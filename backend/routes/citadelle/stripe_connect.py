"""
Stripe Connect Express — La Citadelle Numérique
Gestion des comptes connectés pour les vendeurs (payout automatique)
"""

import os
import asyncio
import logging
from datetime import datetime, timezone

import stripe as stripe_sdk
from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel

from routes.citadelle.auth import decode_access_token
from routes.citadelle.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe-connect", tags=["Stripe Connect — La Citadelle"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

_db = None


def set_database(database):
    global _db
    _db = database


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_authenticated_user_id(request: Request) -> str:
    """Extrait l'id utilisateur depuis le JWT Bearer."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")
    try:
        decoded = decode_access_token(auth.split(" ")[1])
        if not decoded:
            raise ValueError
        return decoded["sub"]
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")


def _parse_dob(dob_str: str) -> dict:
    """Transforme '1985-06-15' → {'day': 15, 'month': 6, 'year': 1985}."""
    try:
        year, month, day = dob_str.split("-")
        return {"day": int(day), "month": int(month), "year": int(year)}
    except Exception:
        return {}


def _format_phone_e164(phone: str, default_country: str = "+33") -> str:
    """
    Convertit un numéro français national 0XXXXXXXXX → +33XXXXXXXXX.
    Laisse intacts les numéros déjà en format E.164 (+…).
    """
    phone = phone.strip().replace(" ", "").replace("-", "").replace(".", "")
    if phone.startswith("+"):
        return phone               # Déjà E.164
    if phone.startswith("00"):
        return "+" + phone[2:]     # 0033... → +33...
    if phone.startswith("0") and len(phone) == 10:
        return default_country + phone[1:]  # 0612345678 → +33612345678
    return phone


# ── Modèles ───────────────────────────────────────────────────────────────────

class OnboardRequest(BaseModel):
    return_url: str    # URL de retour après onboarding Stripe réussi
    refresh_url: str   # URL de rafraîchissement si le lien expire


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/onboard", status_code=200)
async def stripe_connect_onboard(body: OnboardRequest, request: Request):
    """
    Crée (ou récupère) un compte Stripe Connect Express pour le vendeur,
    puis génère un Account Link pour l'onboarding.
    Retourne : { onboarding_url, account_id }
    """
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Clé Stripe non configurée")

    user_id = _get_authenticated_user_id(request)
    user = await _db.users.find_one({"id": user_id, "platform": "citadelle"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    now = datetime.now(timezone.utc).isoformat()

    # ── 1. Créer le compte Express si inexistant ───────────────────────────────
    account_id = user.get("stripe_connect_account_id")

    if not account_id:
        create_params = {
            "type": "express",
            "country": "FR",
            "email": user["email"],
            "capabilities": {
                "transfers": {"requested": True},
            },
            "business_type": "individual",
            "settings": {
                "payouts": {"schedule": {"interval": "manual"}},
            },
        }

        # Pré-remplissage avec les données KYC collectées
        individual = {
            "first_name": user.get("first_name", ""),
            "last_name":  user.get("last_name", ""),
            "email":      user["email"],
        }
        if user.get("phone"):
            individual["phone"] = _format_phone_e164(user["phone"])
        if user.get("date_of_birth"):
            dob = _parse_dob(user["date_of_birth"])
            if dob:
                individual["dob"] = dob

        create_params["individual"] = individual

        try:
            account = await asyncio.to_thread(
                stripe_sdk.Account.create,
                api_key=STRIPE_API_KEY,
                **create_params,
            )
            account_id = account["id"]
        except stripe_sdk.error.InvalidRequestError as e:
            logger.error(f"[Stripe Connect] Données invalides: {e}")
            raise HTTPException(status_code=422, detail=f"Données invalides pour Stripe : {e.user_message or str(e)}")
        except stripe_sdk.error.StripeError as e:
            logger.error(f"[Stripe Connect] Erreur création compte: {e}")
            raise HTTPException(status_code=400, detail=f"Erreur Stripe : {e.user_message or str(e)}")

        # Sauvegarder l'account_id dès maintenant
        await _db.users.update_one(
            {"id": user_id},
            {"$set": {
                "stripe_connect_account_id": account_id,
                "stripe_connect_status": "pending",
                "stripe_connect_created_at": now,
                "updated_at": now,
            }},
        )
        logger.info(f"[Stripe Connect] Compte Express créé pour {user['email']} : {account_id}")

    # ── 2. Générer l'Account Link ──────────────────────────────────────────────
    try:
        account_link = await asyncio.to_thread(
            stripe_sdk.AccountLink.create,
            api_key=STRIPE_API_KEY,
            account=account_id,
            refresh_url=body.refresh_url,
            return_url=body.return_url,
            type="account_onboarding",
        )
    except stripe_sdk.error.InvalidRequestError as e:
        logger.error(f"[Stripe Connect] Données invalides (account link): {e}")
        raise HTTPException(status_code=422, detail=f"Données invalides : {e.user_message or str(e)}")
    except stripe_sdk.error.StripeError as e:
        logger.error(f"[Stripe Connect] Erreur génération lien: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur Stripe : {e.user_message or str(e)}")

    return {
        "onboarding_url": account_link["url"],
        "account_id": account_id,
    }


@router.get("/status", status_code=200)
async def stripe_connect_status(request: Request):
    """
    Retourne le statut du compte Stripe Connect du vendeur connecté.
    Statuts possibles : not_connected | pending | active | restricted
    """
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Clé Stripe non configurée")

    user_id = _get_authenticated_user_id(request)
    user = await _db.users.find_one({"id": user_id, "platform": "citadelle"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    account_id = user.get("stripe_connect_account_id")

    if not account_id:
        return {"status": "not_connected", "account_id": None, "details_submitted": False, "payouts_enabled": False}

    # Interroger Stripe pour le statut réel
    try:
        account = await asyncio.to_thread(
            stripe_sdk.Account.retrieve,
            account_id,
            api_key=STRIPE_API_KEY,
        )
    except stripe_sdk.error.StripeError as e:
        logger.warning(f"[Stripe Connect] Impossible de récupérer le compte {account_id}: {e}")
        return {
            "status": user.get("stripe_connect_status", "pending"),
            "account_id": account_id,
            "details_submitted": False,
            "payouts_enabled": False,
        }

    details_submitted = account.get("details_submitted", False)
    payouts_enabled   = account.get("payouts_enabled", False)
    charges_enabled   = account.get("charges_enabled", False)

    if payouts_enabled and charges_enabled:
        computed_status = "active"
    elif details_submitted:
        computed_status = "pending_review"
    else:
        computed_status = "pending"

    # Mettre à jour le statut en base si changement
    if computed_status != user.get("stripe_connect_status"):
        await _db.users.update_one(
            {"id": user_id},
            {"$set": {
                "stripe_connect_status": computed_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )

    return {
        "status": computed_status,
        "account_id": account_id,
        "details_submitted": details_submitted,
        "payouts_enabled": payouts_enabled,
        "charges_enabled": charges_enabled,
    }


@router.get("/admin/accounts", status_code=200)
async def admin_list_connect_accounts(
    current_user: dict = Depends(require_admin)
):
    """
    Admin : liste des comptes Stripe Connect créés (pour suivi).
    """
    cursor = _db.users.find(
        {"platform": "citadelle", "stripe_connect_account_id": {"$exists": True}},
        {"_id": 0, "id": 1, "email": 1, "first_name": 1, "last_name": 1,
         "stripe_connect_account_id": 1, "stripe_connect_status": 1,
         "stripe_connect_created_at": 1},
    ).sort("stripe_connect_created_at", -1)
    accounts = [doc async for doc in cursor]
    return {"accounts": accounts, "total": len(accounts)}
