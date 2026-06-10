"""
Routes messagerie — La Citadelle Numérique
Conversations pré-vente liées aux annonces (acheteur ↔ vendeur)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging
import asyncio

from middleware.auth import get_current_user
from services.email_service import send_new_message_notification_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Messages"])

db = None

def set_database(database):
    global db
    db = database


# ── Modèles ────────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    listing_id: str
    content: str = Field(min_length=1, max_length=2000)

class MessageReply(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


# ── Helpers ────────────────────────────────────────────────────────────────────

async def require_citadelle_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("platform") != "citadelle" and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux membres Citadelle")
    return current_user


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/messages/send", status_code=201, summary="Envoyer un message au vendeur")
async def send_message(
    data: MessageCreate,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Envoie un message au vendeur d'une annonce.
    Crée la conversation si elle n'existe pas encore.
    """
    listing = await db.citadelle_listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing["status"] != "active":
        raise HTTPException(status_code=400, detail="Cette annonce n'est plus disponible")

    sender_id = current_user.get("sub")
    if listing["seller_id"] == sender_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous envoyer un message à vous-même")

    now = datetime.now(timezone.utc).isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": sender_id,
        "sender_email": current_user.get("email"),
        "content": data.content,
        "sent_at": now,
    }

    # Chercher une conversation existante entre cet acheteur et ce vendeur pour cette annonce
    conv = await db.citadelle_conversations.find_one({
        "listing_id": data.listing_id,
        "buyer_id": sender_id,
    })

    if conv:
        # Ajouter le message à la conversation existante
        await db.citadelle_conversations.update_one(
            {"id": conv["id"]},
            {"$push": {"messages": msg}, "$set": {"updated_at": now, f"last_read.{sender_id}": now}}
        )
        conv_id = conv["id"]
    else:
        # Créer une nouvelle conversation
        conv_id = str(uuid.uuid4())
        conversation = {
            "id": conv_id,
            "listing_id": data.listing_id,
            "listing_title": listing["title"],
            "listing_slug": listing.get("slug", ""),
            "buyer_id": sender_id,
            "buyer_email": current_user.get("email"),
            "seller_id": listing["seller_id"],
            "seller_email": listing.get("seller_email", ""),
            "messages": [msg],
            "last_read": {sender_id: now},
            "created_at": now,
            "updated_at": now,
            # Champs de suivi des notifications email
            "seller_notified_at": None,
            "reminder_sent_at": None,
        }
        await db.citadelle_conversations.insert_one(conversation)
        logger.info(f"[Citadelle] Conversation créée: {conv_id} — {current_user.get('email')} → {listing.get('seller_email')}")

        # Notifier le vendeur par email (premier message — fire and forget)
        seller_email = listing.get("seller_email", "")
        if seller_email:
            async def _notify_seller():
                success = send_new_message_notification_email(
                    seller_email=seller_email,
                    listing_title=listing["title"],
                    buyer_email=current_user.get("email", ""),
                    message_preview=data.content,
                    conversation_id=conv_id,
                )
                if success:
                    await db.citadelle_conversations.update_one(
                        {"id": conv_id},
                        {"$set": {"seller_notified_at": datetime.now(timezone.utc).isoformat()}}
                    )
            asyncio.create_task(_notify_seller())
        else:
            logger.warning(f"[Citadelle] Seller email manquant pour la conversation {conv_id}")

    return {"conversation_id": conv_id, "message": msg}


@router.post("/messages/{conversation_id}/reply", summary="Répondre dans une conversation")
async def reply_message(
    conversation_id: str,
    data: MessageReply,
    current_user: dict = Depends(require_citadelle_user)
):
    """Répondre dans une conversation existante (acheteur ou vendeur)"""
    conv = await db.citadelle_conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    user_id = current_user.get("sub")
    if conv["buyer_id"] != user_id and conv["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    now = datetime.now(timezone.utc).isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": user_id,
        "sender_email": current_user.get("email"),
        "content": data.content,
        "sent_at": now,
    }

    await db.citadelle_conversations.update_one(
        {"id": conversation_id},
        {"$push": {"messages": msg}, "$set": {"updated_at": now, f"last_read.{user_id}": now}}
    )

    # Si c'est le vendeur qui répond → désactiver toute future relance automatique
    # (une seule relance 24h par conversation est possible)
    if user_id == conv.get("seller_id") and conv.get("reminder_sent_at") is None:
        await db.citadelle_conversations.update_one(
            {"id": conversation_id},
            {"$set": {"reminder_sent_at": now}},
        )

    return msg


@router.get("/messages/my", summary="Mes conversations")
async def my_conversations(
    current_user: dict = Depends(require_citadelle_user)
):
    """Liste toutes les conversations de l'utilisateur"""
    user_id = current_user.get("sub")
    cursor = db.citadelle_conversations.find(
        {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]},
        {"_id": 0}
    ).sort("updated_at", -1)
    conversations = await cursor.to_list(100)

    # Ajouter le dernier message et le compteur pour chaque conversation
    for conv in conversations:
        conv["last_message"] = conv["messages"][-1] if conv.get("messages") else None
        conv["message_count"] = len(conv.get("messages", []))
        del conv["messages"]  # Ne pas envoyer tous les messages dans la liste

    return {"conversations": conversations}


@router.get("/messages/{conversation_id}", summary="Détail d'une conversation")
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Détail complet d'une conversation avec tous les messages"""
    conv = await db.citadelle_conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    user_id = current_user.get("sub")
    if conv["buyer_id"] != user_id and conv["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    # Marquer comme lu automatiquement à l'ouverture
    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"last_read.{user_id}": now}}
    )

    return conv


@router.get("/messages-unread-count", summary="Nombre de messages non lus")
async def unread_count(
    current_user: dict = Depends(require_citadelle_user)
):
    """Retourne le nombre total de conversations avec des messages non lus"""
    user_id = current_user.get("sub")
    cursor = db.citadelle_conversations.find(
        {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]},
        {"_id": 0, "messages": 1, "last_read": 1}
    )
    conversations = await cursor.to_list(200)

    total_unread = 0
    for conv in conversations:
        user_last_read = conv.get("last_read", {}).get(user_id, "1970-01-01T00:00:00")
        for msg in conv.get("messages", []):
            if msg["sender_id"] != user_id and msg["sent_at"] > user_last_read:
                total_unread += 1
                break  # 1 conversation non lue = +1 (pas le nb de messages)

    return {"unread": total_unread}
