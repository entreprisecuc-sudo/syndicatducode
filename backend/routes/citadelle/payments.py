"""
Paiements — La Citadelle Numérique
Intégration Stripe Checkout pour les services
"""

import os
import json
import logging
from routes.citadelle.invoices import create_invoice_for_payment
import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
import uuid

import stripe as stripe_sdk
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Paiements La Citadelle"])

_db = None


def set_database(database):
    global _db
    _db = database


# ── Modèles internes Stripe (remplacent emergentintegrations) ─────────────────

@dataclass
class CheckoutSessionRequest:
    """Paramètres de création d'une session Stripe Checkout."""
    amount: float       # Montant en euros (ex: 99.0)
    currency: str
    success_url: str
    cancel_url: str
    metadata: dict


@dataclass
class _WebhookEvent:
    """Représentation simplifiée d'un événement webhook Stripe."""
    event_type: str
    session_id: str
    payment_status: str


class _StripeClient:
    """
    Wrapper autour du SDK Stripe officiel.
    Remplace emergentintegrations.payments.stripe.checkout
    pour un déploiement indépendant de la plateforme Emergent.
    """

    def __init__(self, api_key: str, webhook_secret: Optional[str] = None):
        self.api_key = api_key
        self.webhook_secret = webhook_secret

    async def create_checkout_session(self, req: CheckoutSessionRequest):
        """Crée une session Stripe Checkout. Retourne l'objet session (id, url)."""
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.create,
            api_key=self.api_key,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": req.currency,
                    "product_data": {"name": req.metadata.get("service_title", "Service")},
                    "unit_amount": int(req.amount * 100),  # EUR → centimes Stripe
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            metadata=req.metadata,
        )
        return session

    async def get_checkout_status(self, session_id: str):
        """Récupère le statut d'une session Stripe (payment_status, status)."""
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.retrieve,
            session_id,
            api_key=self.api_key,
        )
        return session

    async def handle_webhook(self, body: bytes, sig: str) -> _WebhookEvent:
        """Parse et vérifie la signature d'un payload webhook Stripe."""
        if self.webhook_secret:
            event = await asyncio.to_thread(
                stripe_sdk.Webhook.construct_event,
                body, sig, self.webhook_secret,
            )
            obj = event["data"]["object"]
            return _WebhookEvent(
                event_type=event["type"],
                session_id=obj.get("id", ""),
                payment_status=obj.get("payment_status", ""),
            )
        else:
            # Mode développement : pas de vérification de signature
            event_data = json.loads(body)
            obj = event_data.get("data", {}).get("object", {})
            return _WebhookEvent(
                event_type=event_data.get("type", ""),
                session_id=obj.get("id", ""),
                payment_status=obj.get("payment_status", ""),
            )


# ── Schémas ───────────────────────────────────────────────────────────────────

class ServiceCheckoutRequest(BaseModel):
    service_id: str
    client_name: str
    client_email: EmailStr
    client_message: Optional[str] = ""
    origin_url: str
    cancel_path: Optional[str] = "/citadelle/services"
    user_id: Optional[str] = None       # ID de l'utilisateur connecté (si disponible)


# ── Utilitaire Stripe ─────────────────────────────────────────────────────────

def _get_stripe() -> _StripeClient:
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Configuration Stripe manquante.")
    # Le secret webhook (whsec_...) active la vérification de signature en production.
    # Configurable via STRIPE_WEBHOOK_SECRET ; absent → parsing sans vérification (dev).
    return _StripeClient(
        api_key=api_key,
        webhook_secret=os.environ.get("STRIPE_WEBHOOK_SECRET") or None,
    )


# ── Finalisation idempotente d'un paiement ────────────────────────────────────

async def _finalize_paid_transaction(session_id: str) -> bool:
    """
    Marque une transaction comme payée de façon idempotente et envoie les emails
    de confirmation. Source unique utilisée par le polling ET le webhook Stripe.
    Retourne True si c'est la première finalisation (emails envoyés), False sinon.
    """
    result = await _db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {
            "payment_status": "paid",
            "status": "complete",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    if result.modified_count == 0:
        # Transaction déjà finalisée (ou introuvable) → aucun double traitement
        return False

    transaction = await _db.payment_transactions.find_one({"session_id": session_id})
    logger.info(f"Paiement confirmé : {session_id} — {transaction.get('service_title')}")

    # Créer la commande de service visible côté admin ET côté membre (« Mes commandes »).
    # Idempotent via session_id : le vrai flux Stripe alimentait payment_transactions/factures
    # mais PAS citadelle_service_orders, d'où les commandes qui ne remontaient plus.
    try:
        existing_order = await _db.citadelle_service_orders.find_one({"session_id": session_id})
        if not existing_order:
            now = datetime.now(timezone.utc).isoformat()
            await _db.citadelle_service_orders.insert_one({
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "service_id": transaction.get("service_id", ""),
                "service_title": transaction.get("service_title", ""),
                "amount": transaction.get("amount", 0),
                "client_name": transaction.get("client_name", ""),
                "client_email": transaction.get("client_email", ""),
                "client_message": transaction.get("client_message", ""),
                "status": "en_attente",
                "admin_note": "",
                "payment_method": "stripe",
                "user_id": transaction.get("user_id", ""),
                "created_at": now,
                "updated_at": now,
            })
            logger.info(f"Commande service créée (admin) pour session {session_id}")
    except Exception as e:
        logger.warning(f"Erreur création commande service admin : {e}")

    try:
        await _send_payment_confirmation_emails(transaction)
    except Exception as e:
        logger.warning(f"Erreur envoi email confirmation paiement : {e}")
    try:
        await create_invoice_for_payment(transaction)
    except Exception as e:
        logger.warning(f"Erreur création facture : {e}")
    return True


# ── POST /payments/service/checkout ──────────────────────────────────────────

@router.post("/service/checkout")
async def create_service_checkout(payload: ServiceCheckoutRequest):
    """
    Crée une session Stripe Checkout pour le paiement d'un service.
    Le prix est récupéré depuis la BDD (jamais depuis le frontend).
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Base de données non initialisée.")

    # Récupérer le service (ID peut être UUID ou ObjectId)
    service = await _db.citadelle_services.find_one({"id": payload.service_id})
    if not service:
        # Tentative par ObjectId MongoDB
        try:
            from bson import ObjectId
            service = await _db.citadelle_services.find_one({"_id": ObjectId(payload.service_id)})
        except Exception:
            pass
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable.")

    price = float(service.get("price", 0))
    if price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Ce service ne nécessite pas de paiement en ligne (devis ou gratuit)."
        )

    # Application de la promo globale (réduction % réellement facturée)
    from routes.citadelle.services import get_promo_config, apply_promo, is_promo_active
    promo = await get_promo_config(_db)
    original_price = price
    price = apply_promo(price, promo)
    promo_percent = promo.get("discount_percent", 0) if is_promo_active(promo) else 0

    # Construction des URLs de retour
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/citadelle/paiement/confirmation?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_path = payload.cancel_path or "/citadelle/services"
    cancel_url = f"{origin}{cancel_path}"

    # Métadonnées transmises à Stripe (et récupérables après paiement)
    metadata = {
        "service_id": payload.service_id,
        "service_title": service.get("title", ""),
        "client_name": payload.client_name,
        "client_email": payload.client_email,
        "client_message": payload.client_message or "",
        "source": "citadelle_services",
    }

    stripe = _get_stripe()
    checkout_req = CheckoutSessionRequest(
        amount=price,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )

    try:
        session = await stripe.create_checkout_session(checkout_req)
    except Exception as e:
        logger.error(f"Stripe checkout creation error: {e}")
        raise HTTPException(status_code=502, detail="Erreur lors de la création de la session de paiement.")

    # Enregistrement de la transaction en statut pending
    transaction_doc = {
        "session_id": session.id,
        "service_id": payload.service_id,
        "service_title": service.get("title", ""),
        "client_name": payload.client_name,
        "client_email": payload.client_email,
        "client_message": payload.client_message or "",
        "amount": price,
        "currency": "eur",
        "original_amount": original_price,
        "promo_percent": promo_percent,
        "payment_status": "pending",
        "status": "initiated",
        "user_id": payload.user_id or "",   # Lié au compte si l'utilisateur est connecté
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.payment_transactions.insert_one(transaction_doc)

    logger.info(f"Checkout session créée : {session.id} pour service {service.get('title')}")

    return {"checkout_url": session.url, "session_id": session.id}


# ── GET /payments/service/status/{session_id} ─────────────────────────────────

@router.get("/service/status/{session_id}")
async def get_service_payment_status(session_id: str):
    """
    Vérifie le statut d'une session Stripe et met à jour la BDD.
    Déclenche les emails de confirmation si paiement validé.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Base de données non initialisée.")

    # Récupérer la transaction en BDD
    transaction = await _db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction introuvable.")

    # Si déjà finalisée, retourner directement
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "service_title": transaction.get("service_title"),
            "amount": transaction.get("amount"),
            "client_email": transaction.get("client_email"),
        }

    # Interroger Stripe
    stripe = _get_stripe()
    try:
        checkout_status = await stripe.get_checkout_status(session_id)
    except Exception as e:
        logger.error(f"Stripe status check error: {e}")
        raise HTTPException(status_code=502, detail="Erreur lors de la vérification du paiement.")

    new_payment_status = checkout_status.payment_status  # "paid", "unpaid", ...
    new_status = checkout_status.status  # "complete", "open", "expired"

    # Mise à jour BDD idempotente (logique partagée avec le webhook → pas de double email)
    if new_payment_status == "paid":
        await _finalize_paid_transaction(session_id)

    elif new_status == "expired":
        await _db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "expired",
                "status": "expired",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "service_title": transaction.get("service_title"),
        "amount": transaction.get("amount"),
        "client_email": transaction.get("client_email"),
    }


# ── POST /payments/webhook/stripe ────────────────────────────────────────────

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Point d'entrée webhook Stripe (événements de paiement)."""
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")

    stripe = _get_stripe()
    try:
        event = await stripe.handle_webhook(body, sig)
    except Exception as e:
        # Signature invalide ou payload corrompu → rejet explicite (sécurité)
        logger.warning(f"Webhook Stripe rejeté (signature/payload invalide) : {e}")
        raise HTTPException(status_code=400, detail="Webhook invalide")

    logger.info(f"Webhook Stripe reçu : {event.event_type} — session {event.session_id}")

    # Paiement confirmé → finalisation fiable (même si l'acheteur a fermé l'onglet)
    if (
        event.event_type == "checkout.session.completed"
        and event.payment_status == "paid"
        and event.session_id
    ):
        try:
            await _finalize_paid_transaction(event.session_id)
        except Exception as e:
            logger.error(f"Erreur traitement webhook paiement {event.session_id} : {e}")

    return {"received": True}


# ── Emails de confirmation ────────────────────────────────────────────────────

async def _send_payment_confirmation_emails(transaction: dict):
    """Envoie les emails de confirmation client et admin après paiement."""
    from services.email_service import send_citadelle_email

    client_email = transaction.get("client_email", "")
    client_name = transaction.get("client_name", "")
    service_title = transaction.get("service_title", "")
    amount = transaction.get("amount", 0)

    # Email client
    client_html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0F2747 0%, #1a4a8a 100%); padding: 32px 40px; text-align: center;">
        <h1 style="color: #C9A45C; font-size: 22px; margin: 0;">Paiement confirmé</h1>
        <p style="color: rgba(255,255,255,0.7); margin-top: 8px;">La Citadelle Numérique</p>
      </div>
      <div style="padding: 32px 40px;">
        <p style="color: #333; font-size: 15px;">Bonjour {client_name},</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Votre paiement pour le service <strong>{service_title}</strong> a bien été reçu.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px 20px; margin: 20px 0; text-align: center;">
          <p style="color: #0F2747; font-size: 13px; margin: 0 0 4px;">Montant réglé</p>
          <p style="color: #C9A45C; font-size: 28px; font-weight: 800; margin: 0;">{amount:,.2f} €</p>
        </div>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Notre équipe va prendre contact avec vous très prochainement pour démarrer la mission.
        </p>
        <p style="color: #555; font-size: 14px; margin-top: 24px;">
          La Garde — La Citadelle Numérique
        </p>
      </div>
    </div>
    """

    await send_citadelle_email(
        to=client_email,
        subject=f"✅ Paiement confirmé — {service_title}",
        html_content=client_html,
    )

    # Email admin
    admin_html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F2747;">Nouveau paiement de service reçu</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Service</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">{service_title}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Client</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{client_name}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{client_email}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Montant</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #C9A45C; font-weight: 700;">{amount:,.2f} €</td></tr>
        <tr><td style="padding: 8px; color: #666;">Message</td>
            <td style="padding: 8px;">{transaction.get('client_message') or '—'}</td></tr>
      </table>
    </div>
    """

    admin_email = os.environ.get("CITADELLE_ADMIN_EMAIL", "lagarde@lacitadellenumerique.fr")
    await send_citadelle_email(
        to=admin_email,
        subject=f"💰 Nouveau paiement — {service_title} ({amount:,.2f} €)",
        html_content=admin_html,
    )
