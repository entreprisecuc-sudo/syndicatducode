"""
Routes admin — App "Papa en Mousse"
Alertes temps réel + actions rapides (valider/refuser) + gestion des subscriptions WebPush.
"""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.push_service import (
    get_alert_summary,
    get_vapid_public_key,
    check_and_notify,
    set_database as _push_set_db,
)
from routes.admin.stats import get_current_user, admin_only

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/push-alerts", tags=["Admin Push Alerts"])

_db: AsyncIOMotorDatabase | None = None


def set_database(db: AsyncIOMotorDatabase):
    global _db
    _db = db
    _push_set_db(db)


def _check_db():
    if _db is None:
        raise HTTPException(status_code=500, detail="Base de données non initialisée.")


# ── Résumé des alertes ───────────────────────────────────────────────────────

@router.get("/summary", dependencies=[Depends(admin_only)])
async def alerts_summary():
    """Retourne toutes les alertes actives groupées par catégorie."""
    _check_db()
    return await get_alert_summary()


# ── Clé VAPID publique ───────────────────────────────────────────────────────

@router.get("/vapid-key")
async def vapid_key():
    """Retourne la clé VAPID publique (Application Server Key)."""
    return {"public_key": get_vapid_public_key()}


# ── Gestion des subscriptions push ──────────────────────────────────────────

@router.post("/subscribe", dependencies=[Depends(admin_only)])
async def subscribe_push(request: Request):
    """Enregistre un appareil pour les push notifications."""
    _check_db()
    body = await request.json()
    endpoint = body.get("endpoint")
    p256dh   = body.get("keys", {}).get("p256dh")
    auth_key = body.get("keys", {}).get("auth")

    if not all([endpoint, p256dh, auth_key]):
        raise HTTPException(status_code=400, detail="Subscription incomplète.")

    await _db.admin_push_subscriptions.update_one(
        {"endpoint": endpoint},
        {"$set": {
            "endpoint":    endpoint,
            "p256dh":      p256dh,
            "auth":        auth_key,
            "updated_at":  datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    return {"message": "Appareil enregistré pour les notifications."}


@router.delete("/subscribe", dependencies=[Depends(admin_only)])
async def unsubscribe_push(request: Request):
    """Désabonne un appareil des push notifications."""
    _check_db()
    body     = await request.json()
    endpoint = body.get("endpoint")
    if endpoint:
        await _db.admin_push_subscriptions.delete_one({"endpoint": endpoint})
    return {"message": "Appareil désabonné."}


# ── Actions rapides (valider / refuser) ──────────────────────────────────────

@router.post("/{alert_type}/{item_id}/validate", dependencies=[Depends(admin_only)])
async def validate_alert(alert_type: str, item_id: str):
    """Valide une alerte directement depuis l'app mobile."""
    _check_db()

    if alert_type == "listing":
        await _db.citadelle_listings.update_one(
            {"id": item_id}, {"$set": {"status": "active", "validated_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif alert_type == "transaction":
        await _db.citadelle_transactions.update_one(
            {"id": item_id}, {"$set": {"status": "admin_verified", "verified_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif alert_type == "service_order":
        await _db.citadelle_service_orders.update_one(
            {"id": item_id}, {"$set": {"status": "traitee", "treated_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif alert_type == "kyc":
        await _db.users.update_one(
            {"id": item_id}, {"$set": {"kyc_status": "approved", "kyc_approved_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif alert_type == "contact":
        await _db.contact_requests.update_one(
            {"id": item_id}, {"$set": {"status": "contacted"}}
        )
    elif alert_type == "user":
        await _db.users.update_one(
            {"id": item_id}, {"$set": {"status": "active"}}
        )
    elif alert_type == "book":
        await _db.portfolios.update_one(
            {"id": item_id}, {"$set": {"validation_status": "approved", "validated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Type d'alerte inconnu : {alert_type}")

    logger.info(f"Alerte validée : type={alert_type} id={item_id}")
    return {"message": "Validé avec succès.", "type": alert_type, "id": item_id}


@router.post("/{alert_type}/{item_id}/reject", dependencies=[Depends(admin_only)])
async def reject_alert(alert_type: str, item_id: str):
    """Refuse une alerte directement depuis l'app mobile."""
    _check_db()

    if alert_type == "listing":
        await _db.citadelle_listings.update_one(
            {"id": item_id}, {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif alert_type == "transaction":
        await _db.citadelle_transactions.update_one(
            {"id": item_id}, {"$set": {"status": "disputed"}}
        )
    elif alert_type == "service_order":
        await _db.citadelle_service_orders.update_one(
            {"id": item_id}, {"$set": {"status": "annulee"}}
        )
    elif alert_type == "kyc":
        await _db.users.update_one(
            {"id": item_id}, {"$set": {"kyc_status": "rejected"}}
        )
    elif alert_type == "user":
        await _db.users.update_one(
            {"id": item_id}, {"$set": {"status": "suspended"}}
        )
    elif alert_type == "book":
        await _db.portfolios.update_one(
            {"id": item_id}, {"$set": {"validation_status": "rejected"}}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Type d'alerte inconnu : {alert_type}")

    logger.info(f"Alerte refusée : type={alert_type} id={item_id}")
    return {"message": "Refusé avec succès.", "type": alert_type, "id": item_id}
