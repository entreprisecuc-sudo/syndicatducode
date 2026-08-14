"""
Routes messagerie — La Citadelle Numérique
Conversations pré-vente liées aux annonces (acheteur ↔ vendeur)
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging
import asyncio

from routes.citadelle.dependencies import require_citadelle_user
from services.email_service import send_new_message_notification_email
from utils.attachments import Attachment, save_attachment, validate_attachments

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Messages"])

db = None

def set_database(database):
    global db
    db = database


# ── Constante anti-spam ────────────────────────────────────────────────────────

# Délai minimum entre deux emails de notification pour la même conversation et le même destinataire
NOTIFICATION_COOLDOWN_SECONDS = 86400  # 24 heures


# ── Modèles ────────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    listing_id: str
    content: str = Field(default="", max_length=2000)
    attachments: Optional[List[Attachment]] = None

class MessageReply(BaseModel):
    content: str = Field(default="", max_length=2000)
    attachments: Optional[List[Attachment]] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _should_notify(conv: dict, user_id: str) -> bool:
    """
    Vérifie si un email de notification peut être envoyé à cet utilisateur
    pour cette conversation (anti-spam : 1 email max toutes les 24h par conversation).
    """
    last_ts = conv.get("last_notified", {}).get(str(user_id))
    if not last_ts:
        return True
    try:
        last_dt = datetime.fromisoformat(last_ts)
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - last_dt).total_seconds() > NOTIFICATION_COOLDOWN_SECONDS
    except (ValueError, TypeError):
        return True


# require_citadelle_user importé depuis routes/citadelle/dependencies (DRY)


@router.post("/messages/upload-attachment", summary="Téléverser une pièce jointe de conversation")
async def upload_message_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_citadelle_user),
):
    """Upload d'une pièce jointe (image JPG/PNG/WebP ou PDF, max 25 Mo) pour une messagerie."""
    return await save_attachment(file)


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

    pieces = validate_attachments(data.attachments)
    contenu = (data.content or "").strip()
    if not contenu and not pieces:
        raise HTTPException(status_code=400, detail="Message vide : ajoutez un texte ou une pièce jointe")

    # Filtrage des informations de contact (email, téléphone)
    from utils.message_sanitizer import sanitiser_message
    contenu_sanitise, sanitized = sanitiser_message(contenu) if contenu else ("", False)

    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": sender_id,
        "sender_email": current_user.get("email"),
        "content": contenu_sanitise,
        "attachments": pieces,
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
        is_new_conversation = False
    else:
        # Créer une nouvelle conversation
        is_new_conversation = True
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
            # Suivi notifications email (last_notified = dict {user_id: iso_timestamp})
            "last_notified": {},
            "seller_notified_at": None,  # conservé pour rétrocompatibilité
            "reminder_sent_at": None,
        }
        await db.citadelle_conversations.insert_one(conversation)
        logger.info(f"[Citadelle] Conversation créée: {conv_id} — {current_user.get('email')} → {listing.get('seller_email')}")

    # ── Notification email au vendeur (nouvelles ET messages suivants) ──────────
    # Anti-spam : 1 email max par conversation par 24h (champ last_notified)
    seller_id   = listing["seller_id"]
    seller_email = listing.get("seller_email", "")
    conv_for_check = conv if conv else {"last_notified": {}}

    if seller_email and _should_notify(conv_for_check, seller_id):
        async def _notify_seller(r_email, s_email, title, preview, cid, sid):
            success = send_new_message_notification_email(
                recipient_email=r_email,
                listing_title=title,
                sender_email=s_email,
                message_preview=preview,
                conversation_id=cid,
            )
            if success:
                notif_ts = datetime.now(timezone.utc).isoformat()
                await db.citadelle_conversations.update_one(
                    {"id": cid},
                    {"$set": {
                        f"last_notified.{sid}": notif_ts,
                        "seller_notified_at": notif_ts,  # rétrocompatibilité
                    }}
                )
        asyncio.create_task(_notify_seller(
            seller_email,
            current_user.get("email", ""),
            listing["title"],
            contenu or "[Pièce jointe]",
            conv_id,
            seller_id,
        ))
    elif not seller_email:
        logger.warning(f"[Citadelle] Seller email manquant pour la conversation {conv_id}")

    return {"conversation_id": conv_id, "message": msg, "sanitized": sanitized, "created": is_new_conversation}


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

    # Bloquer l'envoi si la conversation est fermée (annonce vendue)
    if conv.get("is_blocked"):
        raise HTTPException(
            status_code=400,
            detail="Cette conversation est fermée. Ce site a été vendu."
        )

    now = datetime.now(timezone.utc).isoformat()

    pieces = validate_attachments(data.attachments)
    contenu = (data.content or "").strip()
    if not contenu and not pieces:
        raise HTTPException(status_code=400, detail="Message vide : ajoutez un texte ou une pièce jointe")

    # Filtrage des informations de contact (email, téléphone)
    from utils.message_sanitizer import sanitiser_message
    contenu_sanitise, sanitized = sanitiser_message(contenu) if contenu else ("", False)

    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": user_id,
        "sender_email": current_user.get("email"),
        "content": contenu_sanitise,
        "attachments": pieces,
        "sent_at": now,
    }

    await db.citadelle_conversations.update_one(
        {"id": conversation_id},
        {"$push": {"messages": msg}, "$set": {"updated_at": now, f"last_read.{user_id}": now}}
    )

    # ── Notification email à l'autre participant (anti-spam 24h) ───────────────
    is_seller   = (user_id == conv.get("seller_id"))
    recipient_id    = conv["buyer_id"]    if is_seller else conv["seller_id"]
    recipient_email = conv.get("buyer_email", "") if is_seller else conv.get("seller_email", "")

    if recipient_email and _should_notify(conv, recipient_id):
        async def _notify_reply(r_email, s_email, title, preview, cid, rid):
            success = send_new_message_notification_email(
                recipient_email=r_email,
                listing_title=title,
                sender_email=s_email,
                message_preview=preview,
                conversation_id=cid,
            )
            if success:
                await db.citadelle_conversations.update_one(
                    {"id": cid},
                    {"$set": {f"last_notified.{rid}": datetime.now(timezone.utc).isoformat()}}
                )
        asyncio.create_task(_notify_reply(
            recipient_email,
            current_user.get("email", ""),
            conv.get("listing_title", ""),
            contenu or "[Pièce jointe]",
            conversation_id,
            recipient_id,
        ))

    return {"message": msg, "sanitized": sanitized}


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

    # Prénoms des parties (une seule requête) — anti-désintermédiation : jamais d'e-mail
    ids = set()
    for conv in conversations:
        ids.add(conv.get("buyer_id"))
        ids.add(conv.get("seller_id"))
    users = await db.users.find(
        {"id": {"$in": list(ids)}},
        {"_id": 0, "id": 1, "first_name": 1}
    ).to_list(500)
    names = {u["id"]: (u.get("first_name") or "").strip() for u in users}

    # Ajouter le dernier message et le compteur pour chaque conversation
    for conv in conversations:
        conv["last_message"] = conv["messages"][-1] if conv.get("messages") else None
        conv["message_count"] = len(conv.get("messages", []))
        del conv["messages"]  # Ne pas envoyer tous les messages dans la liste
        conv["buyer_name"] = names.get(conv.get("buyer_id")) or "Acheteur"
        conv["seller_name"] = names.get(conv.get("seller_id")) or "Vendeur"
        conv.pop("buyer_email", None)
        conv.pop("seller_email", None)
        if conv["last_message"]:
            conv["last_message"].pop("sender_email", None)

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

    # Anonymisation : jamais d'e-mail exposé (anti-désintermédiation + RGPD) — on affiche le prénom
    seller_id = conv.get("seller_id")
    buyer_id = conv.get("buyer_id")
    users = await db.users.find(
        {"id": {"$in": [buyer_id, seller_id]}},
        {"_id": 0, "id": 1, "first_name": 1}
    ).to_list(2)
    names = {u["id"]: (u.get("first_name") or "").strip() for u in users}
    conv["buyer_name"] = names.get(buyer_id) or "Acheteur"
    conv["seller_name"] = names.get(seller_id) or "Vendeur"
    conv.pop("buyer_email", None)
    conv.pop("seller_email", None)
    for m in conv.get("messages", []):
        sender_default = "Vendeur" if m.get("sender_id") == seller_id else "Acheteur"
        m["sender_name"] = names.get(m.get("sender_id")) or sender_default
        m.pop("sender_email", None)

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


@router.get("/member/activity", summary="Flux d'activité du membre (à traiter)")
async def member_activity(current_user: dict = Depends(require_citadelle_user)):
    """
    Agrège les interactions à traiter par le membre :
    - messages non lus, propositions d'achat reçues, contre-offres,
      paiements à faire, accès à transmettre, litiges.
    Trié du plus récent au plus ancien.
    """
    user_id = current_user.get("sub")
    items = []

    # 1. Messages non lus (conversations pré-vente)
    convs = await db.citadelle_conversations.find(
        {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    for conv in convs:
        last_read = conv.get("last_read", {}).get(user_id, "1970-01-01T00:00:00")
        unread = [m for m in (conv.get("messages") or [])
                  if m.get("sender_id") != user_id and m.get("sent_at", "") > last_read]
        if unread:
            last = unread[-1]
            items.append({
                "type": "message",
                "level": "info",
                "title": conv.get("listing_title") or "Conversation",
                "preview": (last.get("content", "") or "")[:80],
                "count": len(unread),
                "created_at": last.get("sent_at", conv.get("updated_at", "")),
                "route": f"/citadelle/espace-membre/messages/{conv.get('id')}",
            })

    # 2 & 3. Transactions nécessitant une action
    txs = await db.citadelle_transactions.find(
        {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]},
        {"_id": 0, "credentials": 0}
    ).sort("updated_at", -1).to_list(100)
    for tx in txs:
        is_seller = tx.get("seller_id") == user_id
        status = tx.get("status")
        route = f"/citadelle/espace-membre/transactions/{tx.get('id')}"
        title = tx.get("listing_title") or "Transaction"
        t = tx.get("updated_at", tx.get("created_at", ""))
        item = None

        if status == "offer_sent":
            if tx.get("counter_amount") and not is_seller:
                item = {"type": "offer", "level": "warning", "title": title,
                        "preview": f"Contre-offre de {tx['counter_amount']} € à examiner"}
            elif not tx.get("counter_amount") and is_seller:
                item = {"type": "offer", "level": "urgent", "title": title,
                        "preview": f"Proposition d'achat reçue : {tx.get('offer_amount')} €"}
        elif status == "offer_accepted":
            if not is_seller and not tx.get("payment_id"):
                item = {"type": "payment", "level": "urgent", "title": title,
                        "preview": "Offre acceptée — paiement à effectuer"}
            elif is_seller and tx.get("payment_id") and not tx.get("credentials_transmitted"):
                item = {"type": "delivery", "level": "urgent", "title": title,
                        "preview": "Paiement reçu — transmettez les accès à l'acheteur"}
        elif status == "disputed":
            item = {"type": "dispute", "level": "urgent", "title": title,
                    "preview": "Litige en cours"}

        if item:
            item.update({"created_at": t, "route": route})
            items.append(item)

    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"items": items, "count": len(items)}



@router.get("/member/notices", summary="Notices vendeur en attente (pop-up)")
async def member_notices(current_user: dict = Depends(require_citadelle_user)):
    """Retourne les notices non confirmées du membre (ex : enchère terminée sans acheteur)."""
    user_id = current_user.get("sub")
    notices = await db.citadelle_seller_notices.find(
        {"user_id": user_id, "acknowledged": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return {"notices": notices, "count": len(notices)}


@router.post("/member/notices/{notice_id}/ack", summary="Confirmer une notice vendeur")
async def acknowledge_notice(notice_id: str, current_user: dict = Depends(require_citadelle_user)):
    """Marque une notice comme lue/comprise par le vendeur (ne réapparaîtra plus)."""
    user_id = current_user.get("sub")
    res = await db.citadelle_seller_notices.update_one(
        {"id": notice_id, "user_id": user_id},
        {"$set": {"acknowledged": True, "acknowledged_at": datetime.now(timezone.utc).isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notice introuvable")
    return {"success": True}
