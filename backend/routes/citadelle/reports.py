"""
Routes signalement — La Citadelle Numérique
Un utilisateur peut signaler une conversation (transaction ou pré-vente) à l'admin.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from routes.citadelle.dependencies import require_citadelle_user, require_admin
from services.email_service import send_citadelle_report_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Signalements"])

db = None


def set_database(database):
    global db
    db = database


# ── Constantes ───────────────────────────────────────────────────────────────
CONVERSATION_TYPES = {"transaction", "presale"}
REPORT_REASONS = {
    "arnaque": "Arnaque suspectée",
    "contournement": "Contournement (échange de coordonnées)",
    "inapproprie": "Contenu inapproprié",
    "litige": "Litige",
    "autre": "Autre",
}
REPORT_STATUSES = ("open", "reviewed", "resolved")


# ── Modèles ──────────────────────────────────────────────────────────────────
class ReportCreate(BaseModel):
    conversation_type: str
    conversation_id: str
    reason: str
    message: str = Field(min_length=5, max_length=2000)


class ReportStatusUpdate(BaseModel):
    status: str
    admin_notes: str = Field(default="", max_length=2000)


# ── Helpers ──────────────────────────────────────────────────────────────────
async def _charger_contexte(conversation_type: str, conversation_id: str, user_id: str) -> dict:
    """Vérifie que l'utilisateur participe à la conversation et retourne le contexte."""
    if conversation_type == "transaction":
        conv = await db.citadelle_transactions.find_one({"id": conversation_id}, {"_id": 0})
    else:
        conv = await db.citadelle_conversations.find_one({"id": conversation_id}, {"_id": 0})

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    if user_id not in (conv.get("buyer_id"), conv.get("seller_id")):
        raise HTTPException(status_code=403, detail="Vous ne participez pas à cette conversation")

    counterpart = "seller" if user_id == conv.get("buyer_id") else "buyer"
    return {
        "listing_title": conv.get("listing_title", ""),
        "buyer_id": conv.get("buyer_id", ""),
        "seller_id": conv.get("seller_id", ""),
        "buyer_email": conv.get("buyer_email", ""),
        "seller_email": conv.get("seller_email", ""),
        "reporter_role": "buyer" if user_id == conv.get("buyer_id") else "seller",
        "counterpart_role": counterpart,
    }


# ── Routes utilisateur ─────────────────────────────────────────────────────────
@router.post("/reports", status_code=201, summary="Signaler une conversation à l'admin")
async def create_report(data: ReportCreate, current_user: dict = Depends(require_citadelle_user)):
    if data.conversation_type not in CONVERSATION_TYPES:
        raise HTTPException(status_code=400, detail="Type de conversation invalide")
    if data.reason not in REPORT_REASONS:
        raise HTTPException(status_code=400, detail="Motif de signalement invalide")

    user_id = current_user.get("sub")
    ctx = await _charger_contexte(data.conversation_type, data.conversation_id, user_id)

    now = datetime.now(timezone.utc).isoformat()
    report = {
        "id": str(uuid.uuid4()),
        "conversation_type": data.conversation_type,
        "conversation_id": data.conversation_id,
        "reason": data.reason,
        "reason_label": REPORT_REASONS[data.reason],
        "message": data.message.strip(),
        "reporter_id": user_id,
        "reporter_email": current_user.get("email"),
        "reporter_role": ctx["reporter_role"],
        "listing_title": ctx["listing_title"],
        "buyer_id": ctx["buyer_id"],
        "seller_id": ctx["seller_id"],
        "buyer_email": ctx["buyer_email"],
        "seller_email": ctx["seller_email"],
        "status": "open",
        "admin_notes": "",
        "created_at": now,
        "updated_at": now,
    }
    await db.citadelle_reports.insert_one({**report})

    try:
        send_citadelle_report_email(report)
    except Exception as e:
        logger.warning(f"[Citadelle Report] Échec envoi email admin: {e}")

    logger.info(f"[Citadelle Report] Signalement {report['id']} par {report['reporter_email']} — motif {data.reason}")
    return {"success": True, "message": "Signalement transmis à notre équipe. Nous traitons votre demande sous 48h."}


# ── Routes admin ───────────────────────────────────────────────────────────────
@router.get("/admin/reports", summary="Admin — Liste des signalements")
async def admin_list_reports(status: str = None, current_user: dict = Depends(require_admin)):
    query = {}
    if status and status in REPORT_STATUSES:
        query["status"] = status
    cursor = db.citadelle_reports.find(query, {"_id": 0}).sort("created_at", -1)
    reports = await cursor.to_list(500)
    open_count = await db.citadelle_reports.count_documents({"status": "open"})
    return {"reports": reports, "count": len(reports), "open_count": open_count}


@router.patch("/admin/reports/{report_id}", summary="Admin — Mettre à jour un signalement")
async def admin_update_report(report_id: str, data: ReportStatusUpdate, current_user: dict = Depends(require_admin)):
    if data.status not in REPORT_STATUSES:
        raise HTTPException(status_code=400, detail="Statut invalide")
    result = await db.citadelle_reports.update_one(
        {"id": report_id},
        {"$set": {"status": data.status, "admin_notes": data.admin_notes.strip(),
                  "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Signalement introuvable")
    return {"success": True}
