"""
Webhook Stripe Connect — La Citadelle Numérique
account.updated : met à jour le statut d'onboarding vendeur (KYC) en base.

Note : l'onboarding et le statut vendeur sont gérés par `stripe_connect.py`
(routes /stripe-connect/*). Ce module ne contient QUE le webhook, dont l'URL
(/api/citadelle/payments/webhook/stripe-connect) est déjà configurée dans Stripe.
"""

import os
import json
import logging
import asyncio

import stripe as stripe_sdk
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Stripe Connect — Webhook"])

db = None


def set_database(database):
    global db
    db = database


@router.post("/payments/webhook/stripe-connect", summary="Webhook Stripe Connect — account.updated")
async def stripe_connect_webhook(request: Request):
    """
    Reçoit les événements Stripe Connect (comptes connectés).
    Met à jour le statut d'onboarding du vendeur quand il termine sa vérification KYC.
    Signature vérifiée si STRIPE_CONNECT_WEBHOOK_SECRET est défini.
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
