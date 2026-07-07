"""
Routes modération des membres — La Citadelle Numérique
Actions admin : avertissement, suspension (1-2 semaines), bannissement (suppression logique), réactivation.
Chaque action est tracée sur la fiche du membre (moderation_log) et notifiée par email.
"""

import logging
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from routes.citadelle.dependencies import require_admin
from services.email_service import send_citadelle_moderation_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Modération"])

db = None


def set_database(database):
    global db
    db = database


class WarnInput(BaseModel):
    reason: str = Field(min_length=3, max_length=200)
    note: str = Field(default="", max_length=2000)


class SuspendInput(WarnInput):
    weeks: int = Field(ge=1, le=2)


def _now():
    return datetime.now(timezone.utc).isoformat()


async def _get_member(user_id: str) -> dict:
    user = await db.users.find_one({"id": user_id, "platform": "citadelle"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    return user


async def _log_and_notify(user, action, reason, note, until=None):
    entry = {
        "id": str(uuid.uuid4()), "type": action, "reason": reason, "note": note,
        "created_at": _now(), "until": until,
    }
    await db.users.update_one({"id": user["id"]}, {"$push": {"moderation_log": entry}})
    send_citadelle_moderation_email(
        user_email=user["email"], first_name=user.get("first_name", ""),
        action=action, reason=reason, note=note, until=until,
    )


@router.post("/admin/members/{user_id}/warn", summary="Admin — Avertir un membre")
async def warn_member(user_id: str, data: WarnInput, current_user: dict = Depends(require_admin)):
    user = await _get_member(user_id)
    # Date de fin d'affichage du bandeau côté membre : 1 semaine (l'entrée reste dans l'historique).
    until = (datetime.now(timezone.utc) + timedelta(weeks=1)).isoformat()
    await _log_and_notify(user, "warning", data.reason, data.note, until=until)
    logger.info(f"[Citadelle Moderation] Avertissement de {user['email']} par {current_user.get('email')}")
    return {"success": True, "message": "Avertissement enregistré et email envoyé au membre.", "until": until}


@router.post("/admin/members/{user_id}/suspend", summary="Admin — Suspendre un membre (1-2 semaines)")
async def suspend_member(user_id: str, data: SuspendInput, current_user: dict = Depends(require_admin)):
    user = await _get_member(user_id)
    until = (datetime.now(timezone.utc) + timedelta(weeks=data.weeks)).isoformat()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "suspended", "suspended_until": until, "suspension_reason": data.reason, "updated_at": _now()}}
    )
    await _log_and_notify(user, "suspension", data.reason, data.note, until=until)
    logger.info(f"[Citadelle Moderation] Suspension {data.weeks}sem de {user['email']} par {current_user.get('email')}")
    return {"success": True, "message": f"Membre suspendu {data.weeks} semaine(s). Email envoyé.", "suspended_until": until}


@router.post("/admin/members/{user_id}/ban", summary="Admin — Bannir un membre (suppression logique)")
async def ban_member(user_id: str, data: WarnInput, current_user: dict = Depends(require_admin)):
    user = await _get_member(user_id)
    now = _now()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "banned", "banned_at": now, "ban_reason": data.reason, "suspended_until": None, "updated_at": now}}
    )
    # Retrait des annonces actives ET en attente du membre banni
    await db.citadelle_listings.update_many(
        {"seller_id": user_id, "status": {"$in": ["active", "pending"]}},
        {"$set": {"status": "rejected", "rejection_reason": "Compte du vendeur banni par l'administration", "updated_at": now}}
    )
    await _log_and_notify(user, "ban", data.reason, data.note)
    logger.info(f"[Citadelle Moderation] Bannissement de {user['email']} par {current_user.get('email')}")
    return {"success": True, "message": "Membre banni, annonces retirées et email envoyé."}


@router.post("/admin/members/{user_id}/reactivate", summary="Admin — Réactiver un membre")
async def reactivate_member(user_id: str, current_user: dict = Depends(require_admin)):
    user = await _get_member(user_id)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "active", "suspended_until": None, "banned_at": None, "ban_reason": None, "suspension_reason": None, "updated_at": _now()},
         "$push": {"moderation_log": {"id": str(uuid.uuid4()), "type": "reactivation", "reason": "Réactivation manuelle",
                                      "note": "", "created_at": _now(), "until": None}}}
    )
    logger.info(f"[Citadelle Moderation] Réactivation de {user['email']} par {current_user.get('email')}")
    return {"success": True, "message": "Membre réactivé."}
