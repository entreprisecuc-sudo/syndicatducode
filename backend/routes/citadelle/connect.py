"""
Routes Stripe Connect — La Citadelle Numérique
Gestion de l'onboarding vendeur (Stripe Express) et du webhook account.updated
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timezone

import stripe as stripe_sdk
from fastapi import APIRouter, HTTPException, Request, Depends

from routes.citadelle.dependencies import require_citadelle_user, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Stripe Connect"])

db = None


def set_database(database):
    global db
    db = database


def _api_key() -> str:
    key = os.environ.get("STRIPE_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Configuration Stripe manquante.")
    return key


# ── Onboarding vendeur ────────────────────────────────────────────────────────

@router.post("/connect/onboard", summary="Démarrer l'onboarding Stripe Connect Express")
async def start_onboarding(current_user: dict = Depends(require_citadelle_user)):
    """
    Crée un compte Stripe Express pour le vendeur (ou récupère l'existant)
    et retourne un lien d'onboarding valide 24h.
    Le vendeur est redirigé vers les pages Stripe pour vérifier son identité (KYC).
    """
    user_id = current_user.get("sub")
    user = await db.users.find_one({"id": user_id, "platform": "citadelle"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    api_key = _api_key()
    citadelle_url = os.environ.get("CITADELLE_URL", "https://lacitadellenumerique.fr")

    # Récupérer ou créer le compte Express Stripe
    stripe_account_id = user.get("stripe_connect_account_id")

    if not stripe_account_id:
        try:
            account = await asyncio.to_thread(
                stripe_sdk.Account.create,
                api_key=api_key,
                type="express",
                country="FR",
                email=user.get("email"),
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            stripe_account_id = account.id
            now = datetime.now(timezone.utc).isoformat()
            await db.users.update_one(
                {"id": user_id, "platform": "citadelle"},
                {"$set": {
                    "stripe_connect_account_id": stripe_account_id,
                    "stripe_connect_status": "pending",
                    "stripe_connect_created_at": now,
                }}
            )
            logger.info(f"[Connect] Compte Express créé : {stripe_account_id} pour {user.get('email')}")
        except stripe_sdk.error.StripeError as e:
            logger.error(f"[Connect] Erreur création compte : {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la création du compte Stripe.")

    # Générer le lien d'onboarding (valable 24h)
    try:
        link = await asyncio.to_thread(
            stripe_sdk.AccountLink.create,
            api_key=api_key,
            account=stripe_account_id,
            refresh_url=f"{citadelle_url}/citadelle/espace-membre/profil?stripe=refresh",
            return_url=f"{citadelle_url}/citadelle/espace-membre/profil?stripe=success",
            type="account_onboarding",
        )
    except stripe_sdk.error.StripeError as e:
        logger.error(f"[Connect] Erreur création lien : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du lien Stripe.")

    return {"onboarding_url": link.url}


@router.get("/connect/status", summary="Statut du compte Stripe Connect du vendeur")
async def get_connect_status(current_user: dict = Depends(require_citadelle_user)):
    """Retourne le statut Stripe Connect de l'utilisateur connecté."""
    user_id = current_user.get("sub")
    user = await db.users.find_one({"id": user_id, "platform": "citadelle"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    account_id = user.get("stripe_connect_account_id")
    status = user.get("stripe_connect_status", "not_connected")
    charges_enabled = user.get("stripe_connect_charges_enabled", False)
    payouts_enabled = user.get("stripe_connect_payouts_enabled", False)

    return {
        "connected": bool(account_id),
        "status": status,               # not_connected | pending | active
        "charges_enabled": charges_enabled,
        "payouts_enabled": payouts_enabled,
        "ready": charges_enabled and payouts_enabled,
    }


@router.post("/connect/relink", summary="Régénérer un lien d'onboarding (si expiré)")
async def relink_onboarding(current_user: dict = Depends(require_citadelle_user)):
    """Régénère un lien d'onboarding pour un compte Express déjà créé."""
    user_id = current_user.get("sub")
    user = await db.users.find_one({"id": user_id, "platform": "citadelle"}, {"_id": 0})
    if not user or not user.get("stripe_connect_account_id"):
        raise HTTPException(status_code=400, detail="Aucun compte Stripe Connect trouvé.")

    api_key = _api_key()
    citadelle_url = os.environ.get("CITADELLE_URL", "https://lacitadellenumerique.fr")

    try:
        link = await asyncio.to_thread(
            stripe_sdk.AccountLink.create,
            api_key=api_key,
            account=user["stripe_connect_account_id"],
            refresh_url=f"{citadelle_url}/citadelle/espace-membre/profil?stripe=refresh",
            return_url=f"{citadelle_url}/citadelle/espace-membre/profil?stripe=success",
            type="account_onboarding",
        )
    except stripe_sdk.error.StripeError as e:
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du lien.")

    return {"onboarding_url": link.url}


# ── Webhook Connect (account.updated) ─────────────────────────────────────────

@router.post("/payments/webhook/stripe-connect", summary="Webhook Stripe Connect — account.updated")
async def stripe_connect_webhook(request: Request):
    """
    Reçoit les événements Stripe Connect.
    Met à jour le statut d'onboarding du vendeur quand il termine sa vérification KYC.
    """
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("STRIPE_CONNECT_WEBHOOK_SECRET")

    try:
        if webhook_secret:
            event = await asyncio.to_thread(
                stripe_sdk.Webhook.construct_event,
                body, sig, webhook_secret,
            )
            event_type = event["type"]
            account_data = dict(event["data"]["object"])
        else:
            raw = json.loads(body)
            event_type = raw.get("type", "")
            account_data = raw.get("data", {}).get("object", {})
    except Exception as e:
        logger.error(f"[Connect Webhook] Erreur signature : {e}")
        raise HTTPException(status_code=400, detail="Signature invalide")

    if event_type == "account.updated":
        stripe_account_id = account_data.get("id")
        charges_enabled = account_data.get("charges_enabled", False)
        payouts_enabled = account_data.get("payouts_enabled", False)
        details_submitted = account_data.get("details_submitted", False)
        new_status = "active" if (charges_enabled and payouts_enabled) else "pending"

        await db.users.update_one(
            {"stripe_connect_account_id": stripe_account_id},
            {"$set": {
                "stripe_connect_status": new_status,
                "stripe_connect_details_submitted": details_submitted,
                "stripe_connect_charges_enabled": charges_enabled,
                "stripe_connect_payouts_enabled": payouts_enabled,
            }}
        )
        logger.info(f"[Connect Webhook] Compte {stripe_account_id} → {new_status}")

    return {"received": True}
