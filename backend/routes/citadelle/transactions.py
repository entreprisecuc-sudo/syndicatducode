"""
Routes transactions — La Citadelle Numérique
Gestion complète : offres, paiement Stripe, credentials, messagerie, admin
"""

import os
import logging
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional, List

import stripe as stripe_sdk
from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from pydantic import BaseModel, Field

from routes.citadelle.dependencies import require_admin, require_citadelle_user
from services.email_service import send_citadelle_credentials_email, send_new_offer_notification_email
from utils.attachments import Attachment, validate_attachments
from utils.notif_prefs import email_notifications_enabled

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Transactions"])

db = None

def set_database(database):
    global db
    db = database


# ── Statuts ────────────────────────────────────────────────────────────────────

TRANSACTION_STATUSES = [
    "offer_sent",             # Offre envoyée par l'acheteur
    "offer_accepted",         # Offre acceptée par le vendeur
    "offer_refused",          # Offre refusée
    "offer_countered",        # Contre-offre du vendeur
    "payment_done",           # Paiement effectué (fonds en séquestre)
    "credentials_submitted",  # Vendeur a soumis les accès
    "admin_verified",         # Admin a vérifié les accès
    "completed",              # Vente finalisée (fonds libérés + accès envoyés)
    "disputed",               # Litige ouvert
    "cancelled",              # Transaction annulée
]

STATUS_LABELS = {
    "offer_sent": "Offre envoyée",
    "offer_accepted": "Offre acceptée",
    "offer_refused": "Offre refusée",
    "offer_countered": "Contre-offre",
    "payment_done": "Paiement effectué",
    "credentials_submitted": "Accès transmis",
    "admin_verified": "Accès vérifiés",
    "completed": "Vente finalisée",
    "disputed": "Litige en cours",
    "cancelled": "Annulée",
}


# ── Modèles Pydantic ──────────────────────────────────────────────────────────

class OfferCreate(BaseModel):
    listing_id: str
    amount: float = Field(gt=0)
    message: str = Field(min_length=10, max_length=2000)

class CounterOffer(BaseModel):
    amount: float = Field(gt=0)
    message: str = Field(min_length=10, max_length=2000)

class CredentialsSubmit(BaseModel):
    data: str = Field(min_length=10, max_length=5000, description="Codes d'accès, identifiants, instructions de transfert")

class TransactionMessage(BaseModel):
    content: str = Field(default="", max_length=2000)
    attachments: Optional[List[Attachment]] = None

class AdminVerify(BaseModel):
    notes: str = Field(default="", max_length=2000)

class DisputeCreate(BaseModel):
    reason: str = Field(min_length=10, max_length=2000)

class DisputeOpen(BaseModel):
    reason: str = Field(min_length=10, max_length=2000)

class DisputeMessageCreate(BaseModel):
    content: str = Field(default="", max_length=2000)
    attachments: Optional[List[Attachment]] = None

class DisputeConfigUpdate(BaseModel):
    tranches_acheteur: List[dict]
    tranches_vendeur: List[dict]
    default_fee: float = Field(gt=0)


# ── Configuration par défaut des frais d'annulation ──────────────────────────

DEFAULT_DISPUTE_CONFIG = {
    "id": "default",
    "tranches_acheteur": [
        {"price_max": 999.99,  "fee": 49.0,  "label": "Moins de 1 000 €"},
        {"price_max": 4999.99, "fee": 99.0,  "label": "De 1 000 € à 4 999 €"},
        {"price_max": None,    "fee": 199.0, "label": "5 000 € et plus"},
    ],
    "tranches_vendeur": [
        {"price_max": 999.99,  "fee": 49.0,  "label": "Moins de 1 000 €"},
        {"price_max": 4999.99, "fee": 99.0,  "label": "De 1 000 € à 4 999 €"},
        {"price_max": None,    "fee": 199.0, "label": "5 000 € et plus"},
    ],
    "default_fee": 49.0,
}


async def get_dispute_fee(payment_amount: float, role: str = "buyer") -> float:
    """Calcule les frais d'annulation selon le montant, le rôle (buyer/seller) et la config active"""
    config = await db.citadelle_dispute_config.find_one({"id": "default"}, {"_id": 0})
    if not config:
        config = DEFAULT_DISPUTE_CONFIG
    # Utiliser la grille spécifique au rôle, avec fallback sur l'ancienne clé "tranches"
    cle = "tranches_vendeur" if role == "seller" else "tranches_acheteur"
    tranches = config.get(cle) or config.get("tranches", [])
    for tranche in tranches:
        price_max = tranche.get("price_max")
        if price_max is None or payment_amount <= price_max:
            return float(tranche["fee"])
    return float(config.get("default_fee", 49.0))


# ── Helpers ────────────────────────────────────────────────────────────────────

# require_citadelle_user / require_admin importés depuis routes/citadelle/dependencies (DRY)

def system_message(content: str) -> dict:
    """Crée un message système dans la conversation"""
    return {
        "id": str(uuid.uuid4()),
        "sender_id": "system",
        "sender_email": "système",
        "content": content,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "type": "system"
    }


async def _annuler_offres_concurrentes(listing_id: str, accepted_tx_id: str, now: str):
    """Annule automatiquement les autres offres en cours sur la même annonce
    dès qu'une offre est acceptée (le bien a trouvé acquéreur). Notifie chaque acheteur
    avec des suggestions d'annonces similaires (même catégorie)."""
    from services.email_service import send_citadelle_offer_auto_cancelled_email
    from config.settings import CITADELLE_URL

    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0, "type": 1})
    listing_type = listing.get("type") if listing else None

    # Suggestions : jusqu'à 3 annonces actives de la même catégorie (hors annonce vendue, hors adulte)
    suggestions = []
    if listing_type:
        cursor_sug = db.citadelle_listings.find({
            "type": listing_type,
            "status": "active",
            "id": {"$ne": listing_id},
            "is_adult": {"$ne": True},
        }, {"_id": 0, "title": 1, "slug": 1, "price": 1, "images": 1}).sort("created_at", -1).limit(3)
        async for s in cursor_sug:
            suggestions.append({
                "title": s.get("title", ""),
                "slug": s.get("slug", ""),
                "price": s.get("price"),
                "images": s.get("images") or [],
                "url": f"{CITADELLE_URL}/citadelle/annonces/{s.get('slug', '')}",
            })

    base_message = (
        "Navré, le bien numérique vient de trouver acquéreur. "
        "N'hésitez pas à consulter les autres annonces pour trouver la perle rare."
    )
    if suggestions:
        lignes = "\n".join(
            f"• {s['title']}"
            + (f" — {s['price']:,.0f} €" if s.get("price") is not None else "")
            + f" : {s['url']}"
            for s in suggestions
        )
        message_navre = f"{base_message}\n\nQuelques annonces similaires qui pourraient vous intéresser :\n{lignes}"
    else:
        message_navre = base_message

    cursor = db.citadelle_transactions.find({
        "listing_id": listing_id,
        "id": {"$ne": accepted_tx_id},
        "status": {"$in": ["offer_sent", "offer_countered"]},
    }, {"_id": 0})

    concurrentes = await cursor.to_list(500)
    for other in concurrentes:
        await db.citadelle_transactions.update_one(
            {"id": other["id"]},
            {"$set": {
                "status": "cancelled",
                "cancelled_at": now,
                "cancelled_reason": "concurrent_offer_accepted",
                "updated_at": now,
            }, "$push": {"messages": system_message(message_navre)}}
        )
        try:
            if await email_notifications_enabled(db, other.get("buyer_email", "")):
                send_citadelle_offer_auto_cancelled_email(
                    buyer_email=other.get("buyer_email", ""),
                    buyer_name=other.get("buyer_name", ""),
                    listing_title=other.get("listing_title", ""),
                    suggestions=suggestions,
                )
        except Exception as e:
            logger.warning(f"[Citadelle] Échec email annulation offre concurrente {other['id']}: {e}")

    if concurrentes:
        logger.info(f"[Citadelle] {len(concurrentes)} offre(s) concurrente(s) annulée(s) sur l'annonce {listing_id}")


# ── Routes Acheteur ───────────────────────────────────────────────────────────

@router.post("/transactions/offer", status_code=201, summary="Faire une offre sur une annonce")
async def create_offer(
    data: OfferCreate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Acheteur : soumet une offre d'achat sur une annonce active"""
    listing = await db.citadelle_listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing["status"] != "active":
        raise HTTPException(status_code=400, detail="Cette annonce n'est plus disponible")

    buyer_id = current_user.get("sub")
    if listing["seller_id"] == buyer_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas acheter votre propre annonce")

    # Vérifier qu'il n'y a pas déjà une transaction active sur cette annonce pour cet acheteur
    existing = await db.citadelle_transactions.find_one({
        "listing_id": data.listing_id,
        "buyer_id": buyer_id,
        "status": {"$nin": ["offer_refused", "cancelled", "completed"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà une offre en cours sur cette annonce")

    now = datetime.now(timezone.utc).isoformat()
    transaction = {
        "id": str(uuid.uuid4()),
        "listing_id": data.listing_id,
        "listing_title": listing["title"],
        "listing_slug": listing.get("slug", ""),
        "buyer_id": buyer_id,
        "buyer_email": current_user.get("email"),
        "seller_id": listing["seller_id"],
        "seller_email": listing.get("seller_email", ""),
        "status": "offer_sent",
        "offer_amount": data.amount,
        "offer_message": data.message,
        "counter_amount": None,
        "counter_message": None,
        "payment_id": None,
        "payment_amount": None,
        "credentials": None,
        "credentials_transmitted": False,
        "messages": [
            system_message(f"Offre de {data.amount:,.0f} € envoyée par l'acheteur."),
            {
                "id": str(uuid.uuid4()),
                "sender_id": buyer_id,
                "sender_email": current_user.get("email"),
                "content": data.message,
                "sent_at": now,
                "type": "message"
            }
        ],
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "paid_at": None,
        "disputed_at": None,
        "dispute_reason": None,
        "dispute_messages": [],
    }

    await db.citadelle_transactions.insert_one(transaction)
    del transaction["_id"]
    logger.info(f"[Citadelle] Offre créée: {transaction['id']} sur {listing['title']} par {current_user.get('email')}")

    # Notifier le vendeur par email (fire and forget)
    seller_email = listing.get("seller_email", "")
    if seller_email:
        tx_id = transaction["id"]
        tx_amount = data.amount
        tx_message = data.message
        tx_listing_title = listing["title"]
        buyer_email = current_user.get("email", "")

        async def _notify_seller_offer():
            send_new_offer_notification_email(
                seller_email=seller_email,
                listing_title=tx_listing_title,
                offer_amount=tx_amount,
                buyer_email=buyer_email,
                offer_message_preview=tx_message,
                transaction_id=tx_id,
            )
        asyncio.create_task(_notify_seller_offer())
    else:
        logger.warning(f"[Citadelle] Seller email manquant pour la transaction {transaction['id']}")

    return transaction


@router.get("/transactions/unread-count", summary="Nombre de transactions avec messages non lus")
async def transactions_unread_count(
    current_user: dict = Depends(require_citadelle_user)
):
    """Compte les transactions où le dernier message est de l'autre partie
    (= en attente de réponse de l'utilisateur courant).
    Inclut également les litiges avec un dernier message de l'admin."""
    user_id = current_user.get("sub")
    cursor = db.citadelle_transactions.find(
        {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]},
        {"_id": 0, "messages": 1, "dispute_messages": 1, "seller_id": 1, "status": 1}
    )
    transactions = await cursor.to_list(100)

    total = 0
    for tx in transactions:
        # Dernier message normal — non lu si envoyé par l'autre partie
        msgs = [m for m in (tx.get("messages") or []) if m.get("type") != "system"]
        if msgs and msgs[-1].get("sender_id") != user_id:
            total += 1
            continue
        # Dernier message de litige — non lu si admin et utilisateur est le vendeur
        if tx.get("seller_id") == user_id and tx.get("status") == "disputed":
            dispute_msgs = tx.get("dispute_messages") or []
            if dispute_msgs and dispute_msgs[-1].get("sender_role") == "admin":
                total += 1

    return {"unread": total}


@router.get("/transactions/my", summary="Mes transactions (acheteur + vendeur)")
async def my_transactions(
    current_user: dict = Depends(require_citadelle_user)
):
    """Liste les transactions où l'utilisateur est acheteur ou vendeur.
    Retourne :
    - last_message : dernier message normal (vendeur/acheteur)
    - last_dispute_message : dernier message de litige (vendeur uniquement)
    """
    user_id = current_user.get("sub")
    cursor = db.citadelle_transactions.find(
        {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]},
        {"_id": 0, "credentials": 0}
    ).sort("updated_at", -1)
    transactions = await cursor.to_list(100)

    for tx in transactions:
        msgs = tx.pop("messages", []) or []
        msgs_visibles = [m for m in msgs if m.get("type") not in ("system",)]
        dernier = msgs_visibles[-1] if msgs_visibles else None
        tx["last_message"] = {
            "content": dernier.get("content", ""),
            "sender_id": dernier.get("sender_id", ""),
            "sent_at": dernier.get("sent_at", ""),
        } if dernier else None

        # Dernier message de litige — visible uniquement pour le vendeur
        dispute_msgs = tx.pop("dispute_messages", []) or []
        if tx.get("seller_id") == user_id and dispute_msgs:
            dernier_litige = dispute_msgs[-1]
            tx["last_dispute_message"] = {
                "content": dernier_litige.get("content", ""),
                "sender_role": dernier_litige.get("sender_role", ""),
                "sent_at": dernier_litige.get("sent_at", ""),
            }
        else:
            tx["last_dispute_message"] = None

    return {"transactions": transactions}


@router.get("/transactions/{transaction_id}", summary="Détail d'une transaction")
async def get_transaction(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Détail complet d'une transaction (acheteur, vendeur ou admin)"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    user_id = current_user.get("sub")
    is_admin = current_user.get("role") == "admin"
    is_buyer = tx["buyer_id"] == user_id
    is_seller = tx["seller_id"] == user_id

    if not (is_buyer or is_seller or is_admin):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    # Les credentials ne sont visibles par l'acheteur que si l'admin les a transmises
    if tx.get("credentials"):
        if is_buyer and not tx.get("credentials_transmitted"):
            tx["credentials"] = {"submitted": True, "data": None}
        elif not (is_buyer or is_seller or is_admin):
            tx["credentials"] = None

    return tx


# ── Routes Vendeur ────────────────────────────────────────────────────────────

@router.post("/transactions/{transaction_id}/withdraw-offer", summary="Retirer une offre (acheteur, avant paiement)")
async def withdraw_offer(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Acheteur : abandonne sa proposition d'achat tant qu'aucun paiement n'a eu lieu.
    Autorisé même si le vendeur a déjà accepté l'offre (statut offer_accepted).
    Aucun frais : aucun fonds n'est engagé avant le paiement.
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["buyer_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul l'acheteur peut retirer son offre")

    statuts_autorises = ("offer_sent", "offer_countered", "offer_accepted")
    if tx["status"] not in statuts_autorises:
        raise HTTPException(
            status_code=400,
            detail="Le retrait n'est possible qu'avant le paiement (offre envoyée, contre-offre ou offre acceptée)"
        )

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now,
            "cancelled_by_buyer": True,
            "updated_at": now,
        }, "$push": {"messages": system_message(
            "Proposition retirée par l'acheteur. Aucun paiement n'a été effectué, aucun frais n'est appliqué."
        )}}
    )
    logger.info(f"[Citadelle] Offre retirée par l'acheteur: {transaction_id}")
    return {"message": "Proposition retirée. Aucun frais appliqué."}


# ── Enchères : seconde chance à l'enchérisseur suivant ─────────────────────────

async def _prochain_encherisseur(listing: dict, exclude_bidder_ids: set) -> Optional[dict]:
    """Retourne l'enchère valide la plus haute dont l'enchérisseur n'a pas déjà été sollicité."""
    bids = listing.get("auction_bids") or []
    candidats = [b for b in bids if b.get("bidder_id") and b.get("bidder_id") not in exclude_bidder_ids]
    if not candidats:
        return None
    return max(candidats, key=lambda b: b.get("amount", 0))


async def _encherisseurs_deja_sollicites(listing_id: str) -> set:
    """Ensemble des bidder_id ayant déjà eu une transaction pour cette annonce (gagnant + secondes chances)."""
    ids = set()
    cursor = db.citadelle_transactions.find({"listing_id": listing_id}, {"_id": 0, "buyer_id": 1})
    async for t in cursor:
        if t.get("buyer_id"):
            ids.add(t["buyer_id"])
    return ids


async def _is_auction_tx(tx: dict) -> bool:
    if tx.get("is_auction"):
        return True
    listing = await db.citadelle_listings.find_one({"id": tx.get("listing_id")}, {"_id": 0, "is_auction": 1})
    return bool(listing and listing.get("is_auction"))


@router.post("/admin/transactions/{transaction_id}/request-second-chance",
             summary="Admin — Demander au vendeur de proposer la seconde chance")
async def admin_request_second_chance(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : lorsque l'enchère gagnante n'aboutit pas, demande au vendeur (email + message)
    s'il souhaite proposer l'actif à l'enchérisseur suivant. Ne déclenche rien tant que le
    vendeur n'a pas confirmé."""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if not await _is_auction_tx(tx):
        raise HTTPException(status_code=400, detail="Cette transaction ne provient pas d'une enchère")
    if tx.get("status") != "cancelled":
        raise HTTPException(status_code=400, detail="La seconde chance n'est possible que sur une enchère non aboutie (transaction annulée)")

    listing = await db.citadelle_listings.find_one({"id": tx["listing_id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    exclude = await _encherisseurs_deja_sollicites(tx["listing_id"])
    prochain = await _prochain_encherisseur(listing, exclude)
    if not prochain:
        raise HTTPException(status_code=400, detail="Aucun enchérisseur suivant disponible pour cette annonce")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "second_chance_requested": True,
            "second_chance_requested_at": now,
            "second_chance_next_bidder": {
                "bidder_id": prochain.get("bidder_id"),
                "bidder_email": prochain.get("bidder_email"),
                "bidder_name": prochain.get("bidder_name"),
                "amount": prochain.get("amount"),
            },
            "updated_at": now,
        }, "$push": {"messages": system_message(
            f"La Garde vous invite à proposer cet actif à l'enchérisseur suivant "
            f"({prochain.get('amount', 0):,.0f} €) puisque la vente n'a pas abouti. "
            f"Confirmez ci-dessous pour lui offrir une dernière chance."
        )}}
    )

    try:
        from services.email_service import send_citadelle_second_chance_seller_request_email
        send_citadelle_second_chance_seller_request_email(
            seller_email=tx.get("seller_email", ""),
            listing_title=tx.get("listing_title", ""),
            next_amount=prochain.get("amount", 0),
            transaction_id=transaction_id,
        )
    except Exception as e:
        logger.warning(f"[Citadelle Enchère] Échec email demande seconde chance vendeur: {e}")

    logger.info(f"[Citadelle Enchère] Seconde chance demandée au vendeur pour tx {transaction_id}")
    return {"success": True, "message": "Demande envoyée au vendeur.", "next_amount": prochain.get("amount")}


@router.post("/transactions/{transaction_id}/confirm-second-chance",
             summary="Vendeur — Confirmer et proposer la seconde chance")
async def confirm_second_chance(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur : confirme la proposition et déclenche la création de la transaction
    pour l'enchérisseur suivant + email 'dernière chance'."""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut confirmer")
    if not tx.get("second_chance_requested"):
        raise HTTPException(status_code=400, detail="Aucune demande de seconde chance en attente")
    if tx.get("second_chance_done"):
        raise HTTPException(status_code=400, detail="Seconde chance déjà déclenchée")

    listing = await db.citadelle_listings.find_one({"id": tx["listing_id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    # Re-vérifier l'enchérisseur suivant au moment de la confirmation (source de vérité)
    exclude = await _encherisseurs_deja_sollicites(tx["listing_id"])
    prochain = await _prochain_encherisseur(listing, exclude)
    if not prochain:
        raise HTTPException(status_code=400, detail="Aucun enchérisseur suivant disponible")

    now = datetime.now(timezone.utc).isoformat()
    amount = prochain.get("amount", 0)
    new_tx_id = str(uuid.uuid4())
    new_tx = {
        "id": new_tx_id,
        "listing_id": listing["id"],
        "listing_title": listing["title"],
        "listing_slug": listing.get("slug", ""),
        "buyer_id": prochain.get("bidder_id"),
        "buyer_email": prochain.get("bidder_email"),
        "seller_id": listing["seller_id"],
        "seller_email": listing.get("seller_email", ""),
        "status": "offer_accepted",
        "is_auction": True,
        "second_chance": True,
        "offer_amount": amount,
        "offer_message": "Seconde chance : l'enchérisseur précédent n'a pas finalisé l'achat.",
        "counter_amount": None,
        "counter_message": None,
        "payment_id": None,
        "payment_amount": amount,
        "credentials": None,
        "credentials_transmitted": False,
        "messages": [system_message(
            f"Dernière chance ! L'actif vous est proposé à votre enchère de {amount:,.0f} €. "
            f"Procédez au paiement pour finaliser l'acquisition."
        )],
        "dispute_messages": [],
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "paid_at": None,
        "disputed_at": None,
        "dispute_reason": None,
    }
    await db.citadelle_transactions.insert_one(new_tx)

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {"second_chance_done": True, "second_chance_new_tx_id": new_tx_id, "updated_at": now},
         "$push": {"messages": system_message(
             f"Seconde chance proposée à l'enchérisseur suivant ({amount:,.0f} €)."
         )}}
    )

    # L'annonce pointe désormais vers la nouvelle transaction gagnante potentielle
    await db.citadelle_listings.update_one(
        {"id": listing["id"]},
        {"$set": {"status": "sold", "auction_winner_transaction_id": new_tx_id, "updated_at": now}}
    )

    try:
        from services.email_service import send_citadelle_second_chance_offer_email
        if await email_notifications_enabled(db, prochain.get("bidder_email", "")):
            send_citadelle_second_chance_offer_email(
                bidder_email=prochain.get("bidder_email", ""),
                bidder_name=prochain.get("bidder_name") or prochain.get("bidder_email", ""),
                listing_title=listing["title"],
                listing_slug=listing.get("slug", ""),
                amount=amount,
                transaction_id=new_tx_id,
            )
    except Exception as e:
        logger.warning(f"[Citadelle Enchère] Échec email offre seconde chance: {e}")

    logger.info(f"[Citadelle Enchère] Seconde chance confirmée par le vendeur — nouvelle tx {new_tx_id}")
    return {"success": True, "message": "L'enchérisseur suivant a été notifié.", "new_transaction_id": new_tx_id}


@router.post("/transactions/{transaction_id}/decline-second-chance",
             summary="Vendeur — Refuser la seconde chance")
async def decline_second_chance(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur : refuse la proposition de seconde chance (aucune relance)."""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut refuser")
    if not tx.get("second_chance_requested") or tx.get("second_chance_done"):
        raise HTTPException(status_code=400, detail="Aucune demande de seconde chance en attente")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {"second_chance_requested": False, "second_chance_declined": True, "updated_at": now},
         "$push": {"messages": system_message("Le vendeur a décliné la proposition de seconde chance.")}}
    )
    logger.info(f"[Citadelle Enchère] Seconde chance refusée par le vendeur pour tx {transaction_id}")
    return {"success": True, "message": "Proposition refusée."}


@router.post("/transactions/{transaction_id}/accept", summary="Accepter une offre")
async def accept_offer(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur : accepte l'offre de l'acheteur"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut accepter l'offre")
    if tx["status"] not in ("offer_sent", "offer_countered"):
        raise HTTPException(status_code=400, detail=f"Impossible d'accepter une offre en statut '{STATUS_LABELS.get(tx['status'], tx['status'])}'")

    final_amount = tx.get("counter_amount") or tx["offer_amount"]
    now = datetime.now(timezone.utc).isoformat()

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "offer_accepted",
            "payment_amount": final_amount,
            "updated_at": now
        }, "$push": {"messages": system_message(f"Offre acceptée par le vendeur. Montant convenu : {final_amount:,.0f} €. En attente du paiement.")}}
    )
    await _annuler_offres_concurrentes(tx["listing_id"], transaction_id, now)
    logger.info(f"[Citadelle] Offre acceptée: {transaction_id}")
    return {"message": "Offre acceptée", "payment_amount": final_amount}


@router.post("/transactions/{transaction_id}/refuse", summary="Refuser une offre")
async def refuse_offer(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur : refuse l'offre"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut refuser l'offre")
    if tx["status"] not in ("offer_sent", "offer_countered"):
        raise HTTPException(status_code=400, detail="Impossible de refuser cette offre")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {"status": "offer_refused", "updated_at": now},
         "$push": {"messages": system_message("Offre refusée par le vendeur.")}}
    )
    return {"message": "Offre refusée"}


@router.post("/transactions/{transaction_id}/counter", summary="Faire une contre-offre")
async def counter_offer(
    transaction_id: str,
    data: CounterOffer,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur : propose un autre montant"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut contre-proposer")
    if tx["status"] not in ("offer_sent",):
        raise HTTPException(status_code=400, detail="Impossible de contre-proposer à ce stade")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "offer_countered",
            "counter_amount": data.amount,
            "counter_message": data.message,
            "updated_at": now
        }, "$push": {"messages": system_message(f"Contre-offre du vendeur : {data.amount:,.0f} €.")}}
    )
    # Ajouter le message du vendeur
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$push": {"messages": {
            "id": str(uuid.uuid4()),
            "sender_id": current_user.get("sub"),
            "sender_email": current_user.get("email"),
            "content": data.message,
            "sent_at": now,
            "type": "message"
        }}}
    )
    return {"message": "Contre-offre envoyée", "counter_amount": data.amount}


@router.post("/transactions/{transaction_id}/accept-counter", summary="Accepter une contre-offre")
async def accept_counter_offer(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Acheteur : accepte la contre-offre du vendeur"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["buyer_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul l'acheteur peut accepter la contre-offre")
    if tx["status"] != "offer_countered":
        raise HTTPException(status_code=400, detail="Pas de contre-offre à accepter")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "offer_accepted",
            "payment_amount": tx["counter_amount"],
            "updated_at": now
        }, "$push": {"messages": system_message(f"Contre-offre acceptée. Montant convenu : {tx['counter_amount']:,.0f} €. En attente du paiement.")}}
    )
    await _annuler_offres_concurrentes(tx["listing_id"], transaction_id, now)
    return {"message": "Contre-offre acceptée", "payment_amount": tx["counter_amount"]}


@router.post("/transactions/{transaction_id}/buyer-counter", summary="Acheteur — Faire une nouvelle proposition")
async def buyer_counter_offer(
    transaction_id: str,
    data: CounterOffer,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Acheteur : au lieu d'accepter la contre-offre du vendeur, propose un nouveau montant.
    La négociation reste ouverte : la transaction repasse en 'offer_sent' et le vendeur
    peut de nouveau accepter, refuser ou contre-proposer (va-et-vient illimité).
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["buyer_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul l'acheteur peut faire une nouvelle proposition")
    if tx["status"] != "offer_countered":
        raise HTTPException(status_code=400, detail="Aucune contre-offre en cours à renégocier")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "offer_sent",
            "offer_amount": data.amount,
            "offer_message": data.message,
            "counter_amount": None,
            "counter_message": None,
            "updated_at": now,
        }, "$push": {"messages": {
            "$each": [
                system_message(f"Nouvelle proposition de l'acheteur : {data.amount:,.0f} €."),
                {
                    "id": str(uuid.uuid4()),
                    "sender_id": current_user.get("sub"),
                    "sender_email": current_user.get("email"),
                    "content": data.message,
                    "sent_at": now,
                    "type": "message",
                },
            ]
        }}}
    )
    logger.info(f"[Citadelle] Nouvelle proposition de l'acheteur: {transaction_id} — {data.amount} €")
    return {"message": "Nouvelle proposition envoyée au vendeur", "amount": data.amount}


# ── Helpers commission ────────────────────────────────────────────────────────

async def _calculate_commission(payment_amount: float) -> tuple[float, float]:
    """Retourne (commission, net_vendor) selon la config admin."""
    config = await db.citadelle_settings.find_one({"key": "commission"}, {"_id": 0})
    rate = config.get("rate", 0.05) if config else 0.05
    minimum = config.get("minimum_eur", 49.0) if config else 49.0
    commission = max(payment_amount * rate, minimum)
    return round(commission, 2), round(payment_amount - commission, 2)


def _stripe_key() -> str:
    key = os.environ.get("STRIPE_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Configuration Stripe manquante.")
    return key


# ── Paiement via Stripe Checkout ──────────────────────────────────────────────

@router.post("/transactions/{transaction_id}/pay", summary="Créer une session Stripe Checkout")
async def pay_transaction(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Acheteur : crée une session Stripe Checkout et retourne l'URL de paiement.
    Les fonds sont retenus sur le compte plateforme (séquestre).
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["buyer_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul l'acheteur peut payer")
    if tx["status"] != "offer_accepted":
        raise HTTPException(status_code=400, detail="L'offre doit être acceptée avant le paiement")

    payment_amount = tx["payment_amount"]
    citadelle_url = os.environ.get("CITADELLE_URL", "https://lacitadellenumerique.fr")

    try:
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.create,
            api_key=_stripe_key(),
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Achat : {tx['listing_title']}",
                        "description": f"Transaction #{transaction_id[:8].upper()} — La Citadelle Numérique",
                    },
                    "unit_amount": int(payment_amount * 100),  # EUR → centimes
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=(
                f"{citadelle_url}/citadelle/espace-membre/transactions/{transaction_id}"
                f"?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
            ),
            cancel_url=(
                f"{citadelle_url}/citadelle/espace-membre/transactions/{transaction_id}"
                f"?payment=cancelled"
            ),
            metadata={
                "transaction_id": transaction_id,
                "type": "transaction_purchase",
            },
            payment_intent_data={
                "transfer_group": transaction_id,  # regroupe paiement + virement futur
            },
        )
    except stripe_sdk.error.StripeError as e:
        logger.error(f"[Citadelle] Erreur création checkout : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du paiement Stripe.")

    # Sauvegarder l'ID de session (le statut reste offer_accepted jusqu'à confirmation)
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "stripe_session_id": session.id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    logger.info(f"[Citadelle] Session Checkout créée : {session.id} — {payment_amount} €")
    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/transactions/{transaction_id}/confirm-payment", summary="Confirmer le paiement après retour Stripe")
async def confirm_payment(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Appelé par le frontend après retour de Stripe (paramètre ?payment=success).
    Vérifie le statut réel de la session auprès de Stripe et confirme le paiement.
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    # Déjà confirmé
    if tx["status"] == "payment_done":
        return {"status": "payment_done", "already_confirmed": True}

    if tx["status"] != "offer_accepted":
        raise HTTPException(status_code=400, detail="État de transaction invalide pour la confirmation")

    session_id = tx.get("stripe_session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Aucune session Stripe trouvée")

    try:
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.retrieve,
            session_id,
            api_key=_stripe_key(),
        )
    except stripe_sdk.error.StripeError as e:
        logger.error(f"[Citadelle] Erreur vérification session : {e}")
        raise HTTPException(status_code=500, detail="Erreur de vérification du paiement.")

    if session.payment_status != "paid":
        return {"status": "pending", "payment_status": session.payment_status}

    now = datetime.now(timezone.utc).isoformat()
    payment_intent_id = session.payment_intent

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "payment_done",
            "payment_id": payment_intent_id,
            "paid_at": now,
            "updated_at": now
        }, "$push": {"messages": system_message(
            f"Paiement de {tx['payment_amount']:,.0f} € effectué. "
            f"Fonds placés en séquestre. En attente de la transmission des accès par le vendeur."
        )}}
    )

    # Passer l'annonce en "sold"
    await db.citadelle_listings.update_one(
        {"id": tx["listing_id"]},
        {"$set": {"status": "sold", "updated_at": now}}
    )

    # Bloquer les autres conversations actives sur la même annonce
    await _block_other_conversations(tx, now)

    logger.info(f"[Citadelle] Paiement confirmé : {transaction_id} — {tx['payment_amount']} €")
    return {"status": "payment_done"}


async def _block_other_conversations(tx: dict, now: str):
    """Bloque les conversations parallèles sur la même annonce après paiement."""
    MSG_VENDUE = (
        "Le vendeur vient d'accepter une offre. Malheureusement, ce site n'est plus en vente. "
        "Mais pas de panique, je vous invite à regarder les autres annonces pour trouver la perle rare."
    )
    other_convs = await db.citadelle_conversations.find(
        {
            "listing_id": tx["listing_id"],
            "id": {"$ne": tx.get("conversation_id", "")},
            "is_blocked": {"$ne": True}
        },
        {"_id": 0}
    ).to_list(100)

    for conv in other_convs:
        sys_msg = {
            "id": str(uuid.uuid4()),
            "sender_id": "system",
            "sender_email": "system",
            "content": MSG_VENDUE,
            "is_system": True,
            "sent_at": now,
            "created_at": now,
        }
        await db.citadelle_conversations.update_one(
            {"id": conv["id"]},
            {"$push": {"messages": sys_msg}, "$set": {"is_blocked": True, "updated_at": now}}
        )

    if other_convs:
        logger.info(f"[Citadelle] {len(other_convs)} conversation(s) bloquée(s) après paiement")


# ── Credentials vendeur ────────────────────────────────────────────────────────

@router.post("/transactions/{transaction_id}/credentials", summary="Transmettre les accès (vendeur)")
async def submit_credentials(
    transaction_id: str,
    data: CredentialsSubmit,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur : transmet les codes/accès de l'actif numérique à l'admin"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut transmettre les accès")
    if tx["status"] != "payment_done":
        raise HTTPException(status_code=400, detail="Le paiement doit être effectué avant de transmettre les accès")

    now = datetime.now(timezone.utc).isoformat()
    credentials = {
        "data": data.data,
        "submitted_at": now,
        "verified_by_admin": False,
        "verified_at": None,
        "admin_notes": None,
    }

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "credentials_submitted",
            "credentials": credentials,
            "updated_at": now
        }, "$push": {"messages": system_message(
            "Accès transmis par le vendeur. En attente de vérification par l'administrateur."
        )}}
    )
    logger.info(f"[Citadelle] Credentials soumis: {transaction_id}")
    return {"message": "Accès transmis avec succès. L'administrateur va les vérifier."}


# ── Messagerie transaction ─────────────────────────────────────────────────────

@router.post("/transactions/{transaction_id}/message", summary="Envoyer un message")
async def send_message(
    transaction_id: str,
    data: TransactionMessage,
    current_user: dict = Depends(require_citadelle_user)
):
    """Envoie un message dans la conversation de la transaction"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    user_id = current_user.get("sub")
    is_admin = current_user.get("role") == "admin"
    if tx["buyer_id"] != user_id and tx["seller_id"] != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if tx["status"] in ("offer_refused", "cancelled"):
        raise HTTPException(status_code=400, detail="Impossible d'envoyer un message sur une transaction terminée")

    pieces = validate_attachments(data.attachments)
    contenu = (data.content or "").strip()
    if not contenu and not pieces:
        raise HTTPException(status_code=400, detail="Message vide : ajoutez un texte ou une pièce jointe")

    # Filtrage des informations de contact (email, téléphone)
    from utils.message_sanitizer import sanitiser_message
    contenu_sanitise, sanitized = sanitiser_message(contenu) if contenu else ("", False)

    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": user_id if not is_admin else "admin",
        "sender_email": current_user.get("email"),
        "content": contenu_sanitise,
        "attachments": pieces,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "type": "admin" if is_admin else "message"
    }

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$push": {"messages": msg}, "$set": {"updated_at": msg["sent_at"]}}
    )
    return {**msg, "sanitized": sanitized}


# ── Routes Admin ───────────────────────────────────────────────────────────────

@router.get("/admin/transactions", summary="Admin — Toutes les transactions")
async def admin_list_transactions(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Admin : liste toutes les transactions avec filtres"""
    filters = {}
    if status_filter and status_filter in TRANSACTION_STATUSES:
        filters["status"] = status_filter

    skip = (page - 1) * limit
    total = await db.citadelle_transactions.count_documents(filters)
    cursor = db.citadelle_transactions.find(
        filters, {"_id": 0, "messages": 0}
    ).sort("updated_at", -1).skip(skip).limit(limit)
    transactions = await cursor.to_list(limit)

    # Compteurs par statut
    counts = {}
    for s in TRANSACTION_STATUSES:
        counts[s] = await db.citadelle_transactions.count_documents({"status": s})

    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
        "counts": counts,
    }


@router.get("/admin/transactions/{transaction_id}", summary="Admin — Détail transaction")
async def admin_get_transaction(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : détail complet d'une transaction (y compris credentials)"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    return tx


@router.post("/admin/transactions/{transaction_id}/verify", summary="Admin — Vérifier les accès")
async def admin_verify_credentials(
    transaction_id: str,
    data: AdminVerify,
    current_user: dict = Depends(require_admin)
):
    """Admin : confirme que les accès transmis par le vendeur sont valides"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["status"] != "credentials_submitted":
        raise HTTPException(status_code=400, detail="Les accès n'ont pas encore été soumis")
    if not tx.get("credentials"):
        raise HTTPException(status_code=400, detail="Aucun accès à vérifier")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "admin_verified",
            "credentials.verified_by_admin": True,
            "credentials.verified_at": now,
            "credentials.admin_notes": data.notes or None,
            "updated_at": now
        }, "$push": {"messages": system_message(
            "Accès vérifiés par l'administrateur. Validation de la vente en cours."
        )}}
    )
    logger.info(f"[Citadelle Admin] Credentials vérifiés: {transaction_id}")
    return {"message": "Accès vérifiés avec succès"}


@router.post("/admin/transactions/{transaction_id}/complete", summary="Admin — Finaliser la vente et libérer les fonds")
async def admin_complete_transaction(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Admin : finalise la vente.
    - Calcule la commission (config admin)
    - Transfère le net vendeur vers son compte Stripe Connect
    - Rend les accès visibles à l'acheteur
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["status"] != "admin_verified":
        raise HTTPException(status_code=400, detail="Les accès doivent être vérifiés avant de finaliser")

    now = datetime.now(timezone.utc).isoformat()
    payment_amount = tx.get("payment_amount", 0)

    # Calculer commission et montant net vendeur
    commission, net_amount = await _calculate_commission(payment_amount)

    # Récupérer le compte Stripe Connect du vendeur
    seller = await db.users.find_one(
        {"id": tx["seller_id"], "platform": "citadelle"},
        {"_id": 0, "stripe_connect_account_id": 1, "stripe_connect_status": 1, "email": 1}
    )
    seller_stripe_account = seller.get("stripe_connect_account_id") if seller else None
    seller_ready = seller.get("stripe_connect_status") == "active" if seller else False

    stripe_transfer_id = None
    transfer_note = ""

    if seller_stripe_account and seller_ready:
        # Associer le transfert à la charge de l'acheteur (source_transaction) : le virement
        # est accepté même si le solde disponible plateforme est à 0 (fonds encore "en attente"),
        # puis se dénoue automatiquement dès que la charge est réglée.
        source_charge_id = None
        payment_intent_id = tx.get("payment_id")
        if payment_intent_id:
            try:
                pi = await asyncio.to_thread(
                    stripe_sdk.PaymentIntent.retrieve,
                    payment_intent_id,
                    api_key=_stripe_key(),
                )
                source_charge_id = pi.get("latest_charge")
            except stripe_sdk.error.StripeError as e:
                logger.error(f"[Citadelle] Impossible de récupérer la charge du PaymentIntent {payment_intent_id} : {e}")

        if not source_charge_id:
            transfer_note = (
                f"⚠️ Charge de paiement introuvable — virement manuel requis ({net_amount:,.0f} €). "
                f"Vérifiez la transaction dans Stripe."
            )
            logger.error(f"[Citadelle] Transfert impossible : charge introuvable pour transaction {transaction_id}")
        else:
            try:
                transfer = await asyncio.to_thread(
                    stripe_sdk.Transfer.create,
                    api_key=_stripe_key(),
                    amount=int(net_amount * 100),   # EUR → centimes
                    currency="eur",
                    destination=seller_stripe_account,
                    transfer_group=transaction_id,
                    source_transaction=source_charge_id,
                )
                stripe_transfer_id = transfer.id
                transfer_note = (
                    f"Virement de {net_amount:,.0f} € programmé vers le vendeur "
                    f"(libéré dès la disponibilité des fonds Stripe). "
                    f"Commission plateforme : {commission:,.0f} €."
                )
                logger.info(f"[Citadelle] Transfer Stripe : {transfer.id} → {seller_stripe_account} — {net_amount} € (source={source_charge_id})")
            except stripe_sdk.error.StripeError as e:
                logger.error(f"[Citadelle] Erreur Stripe Transfer : {e}")
                transfer_note = f"⚠️ Transfert automatique échoué — virement manuel requis ({net_amount:,.0f} €)."
    elif seller_stripe_account and not seller_ready:
        transfer_note = f"⚠️ Compte Stripe vendeur en cours de vérification — virement manuel requis ({net_amount:,.0f} €)."
    else:
        transfer_note = f"⚠️ Vendeur sans compte Stripe Connect — virement manuel requis ({net_amount:,.0f} €)."

    # Finaliser la transaction
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "completed",
            "completed_at": now,
            "updated_at": now,
            "stripe_transfer_id": stripe_transfer_id,
            "commission_amount": commission,
            "net_seller_amount": net_amount,
        }, "$push": {"messages": system_message(
            f"Vente finalisée ! {transfer_note} "
            f"Les accès sont maintenant disponibles pour l'acheteur."
        )}}
    )

    # Passer l'annonce en statut 'sold'
    await db.citadelle_listings.update_one(
        {"id": tx["listing_id"]},
        {"$set": {"status": "sold", "updated_at": now}}
    )

    logger.info(f"[Citadelle Admin] Vente finalisée : {transaction_id} — {payment_amount} € (commission : {commission} €)")
    return {
        "message": "Vente finalisée. Fonds libérés et accès transmis à l'acheteur.",
        "commission": commission,
        "net_seller_amount": net_amount,
        "stripe_transfer_id": stripe_transfer_id,
    }


@router.post("/admin/transactions/{transaction_id}/dispute", summary="Admin — Ouvrir un litige")
async def admin_open_dispute(
    transaction_id: str,
    data: DisputeCreate,
    current_user: dict = Depends(require_admin)
):
    """Admin : ouvre un litige sur une transaction"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["status"] in ("completed", "cancelled", "offer_refused"):
        raise HTTPException(status_code=400, detail="Impossible d'ouvrir un litige sur cette transaction")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "disputed",
            "disputed_at": now,
            "dispute_reason": data.reason,
            "updated_at": now
        }, "$push": {"messages": system_message(f"Litige ouvert par l'administrateur : {data.reason}")}}
    )
    return {"message": "Litige ouvert"}


@router.post("/admin/transactions/{transaction_id}/transmit", summary="Admin — Transmettre les accès à l'acheteur")
async def admin_transmit_credentials(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Admin : transmet les accès vérifiés à l'acheteur.
    Les credentials deviennent visibles pour l'acheteur uniquement après cette action.
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["status"] != "completed":
        raise HTTPException(status_code=400, detail="La vente doit être finalisée avant la transmission des accès")
    if not tx.get("credentials", {}).get("data"):
        raise HTTPException(status_code=400, detail="Aucun accès à transmettre")
    if tx.get("credentials_transmitted"):
        raise HTTPException(status_code=400, detail="Les accès ont déjà été transmis à l'acheteur")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "credentials_transmitted": True,
            "credentials_transmitted_at": now,
            "credentials_transmitted_by": current_user.get("email"),
            "updated_at": now
        }, "$push": {"messages": system_message(
            "Les accès ont été transmis de manière sécurisée à l'acheteur par l'administrateur."
        )}}
    )

    # Envoi email sécurisé à l'acheteur
    send_citadelle_credentials_email(
        to_email=tx["buyer_email"],
        listing_title=tx.get("listing_title", "Actif numérique"),
        credentials_data=tx["credentials"]["data"],
        amount=tx.get("payment_amount", 0)
    )

    logger.info(f"[Citadelle Admin] Accès transmis à l'acheteur: {transaction_id} par {current_user.get('email')}")
    return {"message": "Accès transmis à l'acheteur avec succès. Email envoyé."}



# ── Routes Litige — Acheteur ──────────────────────────────────────────────────

@router.post("/transactions/{transaction_id}/open-dispute", summary="Acheteur — Ouvrir un litige")
async def open_dispute(
    transaction_id: str,
    data: DisputeOpen,
    current_user: dict = Depends(require_citadelle_user)
):
    """Acheteur : ouvre un litige sur une transaction en cours après le paiement"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["buyer_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul l'acheteur peut ouvrir un litige")

    statuts_autorisés = ["payment_done", "credentials_submitted", "admin_verified"]
    if tx["status"] not in statuts_autorisés:
        raise HTTPException(status_code=400, detail="Un litige ne peut être ouvert qu'après le paiement")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "disputed",
            "disputed_at": now,
            "dispute_reason": data.reason,
            "updated_at": now,
        }, "$push": {"messages": system_message(f"Litige ouvert par l'acheteur : {data.reason}")}}
    )
    logger.info(f"[Citadelle] Litige ouvert par l'acheteur: {transaction_id}")
    return {"message": "Litige ouvert. La Garde va examiner votre dossier."}


@router.get("/transactions/{transaction_id}/cancellation-fee", summary="Consulter les frais d'annulation")
async def get_cancellation_fee_route(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Acheteur ou Vendeur : consulte les frais d'annulation et vérifie si l'annulation est possible.
    - Acheteur en litige : délai 7 jours depuis la date d'ouverture du litige (disputed_at)
    - Acheteur hors litige : délai 7 jours depuis le paiement (paid_at)
    - Vendeur en litige : peut annuler immédiatement, frais applicables
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    user_id = current_user.get("sub")
    is_buyer = tx["buyer_id"] == user_id
    is_seller = tx["seller_id"] == user_id

    if not (is_buyer or is_seller):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    payment_amount = tx.get("payment_amount") or 0
    is_disputed = tx.get("status") == "disputed"

    # Calcul des frais selon le rôle
    role = "seller" if is_seller else "buyer"
    frais = await get_dispute_fee(payment_amount, role=role)

    # Pour le vendeur en litige : annulation possible immédiatement
    if is_seller:
        peut_annuler = is_disputed
        return {
            "role": "seller",
            "cancellation_fee": frais,
            "payment_amount": payment_amount,
            "refund_amount": max(0.0, payment_amount - frais),
            "peut_annuler": peut_annuler,
            "jours_restants": 0,
        }

    # Pour l'acheteur : délai 7 jours depuis disputed_at (litige) ou paid_at (hors litige)
    date_reference = tx.get("disputed_at") if is_disputed else tx.get("paid_at")
    jours_ecoules = None
    peut_annuler = False
    jours_restants = 7

    if date_reference:
        ref_dt = datetime.fromisoformat(date_reference.replace("Z", "+00:00"))
        jours_ecoules = (datetime.now(timezone.utc) - ref_dt).days
        peut_annuler = jours_ecoules >= 7
        jours_restants = max(0, 7 - jours_ecoules)

    return {
        "role": "buyer",
        "cancellation_fee": frais,
        "payment_amount": payment_amount,
        "refund_amount": max(0.0, payment_amount - frais),
        "jours_depuis_reference": jours_ecoules,
        "peut_annuler": peut_annuler,
        "jours_restants": jours_restants,
        "date_reference": "litige" if is_disputed else "paiement",
    }


@router.post("/transactions/{transaction_id}/cancel-purchase", summary="Acheteur — Annuler l'achat")
async def cancel_purchase(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Acheteur : annule son achat après 7 jours depuis le paiement.
    Des frais d'annulation sont prélevés (MOCKED). Le reste est restitué.
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["buyer_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul l'acheteur peut annuler l'achat")

    statuts_annulation = ["payment_done", "credentials_submitted", "admin_verified", "disputed"]
    if tx["status"] not in statuts_annulation:
        raise HTTPException(status_code=400, detail="Annulation impossible à ce stade de la transaction")

    # Délai de 7 jours : depuis disputed_at si en litige, sinon depuis paid_at
    is_disputed = tx["status"] == "disputed"
    date_reference = tx.get("disputed_at") if is_disputed else tx.get("paid_at")
    label_reference = "la création du litige" if is_disputed else "le paiement"

    if not date_reference:
        raise HTTPException(status_code=400, detail="Date de référence introuvable pour calculer le délai")

    ref_dt = datetime.fromisoformat(date_reference.replace("Z", "+00:00"))
    jours_ecoules = (datetime.now(timezone.utc) - ref_dt).days
    if jours_ecoules < 7:
        raise HTTPException(
            status_code=400,
            detail=f"L'annulation n'est disponible que 7 jours après {label_reference} ({7 - jours_ecoules} jour(s) restant(s))"
        )

    payment_amount = tx.get("payment_amount") or 0
    frais = await get_dispute_fee(payment_amount, role="buyer")
    mock_fee_id = f"mock_fee_buyer_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now,
            "cancellation_fee": frais,
            "cancellation_fee_payment_id": mock_fee_id,
            "cancellation_fee_paid": False,
            "updated_at": now,
        }, "$push": {"messages": system_message(
            f"Achat annulé par l'acheteur. Frais d'annulation : {frais:,.0f} € (MOCKED). "
            f"Remboursement de {max(0.0, payment_amount - frais):,.0f} € en cours."
        )}}
    )
    logger.info(f"[Citadelle] Annulation achat par acheteur: {transaction_id} — Frais: {frais} €")
    return {
        "message": f"Achat annulé. Frais de {frais:,.0f} € prélevés.",
        "cancellation_fee": frais,
        "refund_amount": max(0.0, payment_amount - frais),
    }


@router.post("/transactions/{transaction_id}/cancel-as-seller", summary="Vendeur — Annuler la vente en litige")
async def cancel_as_seller(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """
    Vendeur : annule la vente lors d'un litige.
    Des frais de service sont prélevés au vendeur (MOCKED, configurables par l'admin).
    Le montant restant est restitué à l'acheteur. L'annonce est remise en statut actif.
    """
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["seller_id"] != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Seul le vendeur peut utiliser cette action")
    if tx["status"] != "disputed":
        raise HTTPException(status_code=400, detail="Cette action n'est disponible qu'en cas de litige ouvert")

    payment_amount = tx.get("payment_amount") or 0
    frais = await get_dispute_fee(payment_amount, role="seller")
    refund_amount = max(0.0, payment_amount - frais)
    mock_fee_id = f"mock_fee_seller_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now,
            "cancelled_by_seller": True,
            "cancellation_fee": frais,
            "cancellation_fee_payment_id": mock_fee_id,
            "cancellation_fee_paid": False,
            "updated_at": now,
        }, "$push": {"messages": system_message(
            f"Vente annulée par le vendeur. "
            f"Frais de service : {frais:,.0f} € (MOCKED). "
            f"Remboursement acheteur : {refund_amount:,.0f} €."
        )}}
    )

    # Remettre l'annonce en statut actif
    if tx.get("listing_id"):
        await db.citadelle_listings.update_one(
            {"id": tx["listing_id"]},
            {"$set": {"status": "active", "updated_at": now}}
        )

    logger.info(f"[Citadelle] Vente annulée par le vendeur: {transaction_id} — Frais: {frais} € — Remboursement: {refund_amount} €")
    return {
        "message": f"Vente annulée. Frais de service {frais:,.0f} € prélevés. Remboursement de {refund_amount:,.0f} € à l'acheteur (MOCKED).",
        "cancellation_fee": frais,
        "refund_amount": refund_amount,
    }


# ── Chat Litige — Vendeur + Admin uniquement ──────────────────────────────────

@router.get("/transactions/{transaction_id}/dispute-messages", summary="Chat litige — Lire les messages")
async def get_dispute_messages(
    transaction_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur ou Admin uniquement : récupère les messages du chat litige (invisible pour l'acheteur)"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    user_id = current_user.get("sub")
    is_admin = current_user.get("role") == "admin"
    is_seller = tx["seller_id"] == user_id

    if not (is_seller or is_admin):
        raise HTTPException(status_code=403, detail="Accès réservé au vendeur et à l'administrateur")

    return {"dispute_messages": tx.get("dispute_messages", [])}


@router.post("/transactions/{transaction_id}/dispute-messages", summary="Chat litige — Envoyer un message")
async def send_dispute_message(
    transaction_id: str,
    data: DisputeMessageCreate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Vendeur ou Admin uniquement : envoie un message dans le chat litige"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    user_id = current_user.get("sub")
    is_admin = current_user.get("role") == "admin"
    is_seller = tx["seller_id"] == user_id

    if not (is_seller or is_admin):
        raise HTTPException(status_code=403, detail="Accès réservé au vendeur et à l'administrateur")

    if tx["status"] != "disputed":
        raise HTTPException(status_code=400, detail="Le chat litige n'est actif qu'en cas de litige ouvert")

    pieces = validate_attachments(data.attachments)
    contenu = (data.content or "").strip()
    if not contenu and not pieces:
        raise HTTPException(status_code=400, detail="Message vide : ajoutez un texte ou une pièce jointe")

    # Filtrage des informations de contact (email, téléphone)
    from utils.message_sanitizer import sanitiser_message
    contenu_sanitise, sanitized = sanitiser_message(contenu) if contenu else ("", False)

    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": "admin" if is_admin else user_id,
        "sender_email": current_user.get("email"),
        "sender_role": "admin" if is_admin else "seller",
        "content": contenu_sanitise,
        "attachments": pieces,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$push": {"dispute_messages": msg}, "$set": {"updated_at": msg["sent_at"]}}
    )
    return {**msg, "sanitized": sanitized}


# ── Routes Admin — Gestion des litiges ───────────────────────────────────────

@router.post("/admin/transactions/{transaction_id}/resolve-dispute", summary="Admin — Résoudre le litige")
async def admin_resolve_dispute(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : résout le litige en reprenant le cours normal (retour au statut payment_done)"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["status"] != "disputed":
        raise HTTPException(status_code=400, detail="La transaction n'est pas en litige")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "payment_done",
            "dispute_resolved_at": now,
            "updated_at": now,
        }, "$push": {"messages": system_message(
            "Litige résolu par l'administrateur. La transaction reprend son cours normal."
        )}}
    )
    logger.info(f"[Citadelle Admin] Litige résolu: {transaction_id} par {current_user.get('email')}")
    return {"message": "Litige résolu. La transaction reprend son cours normal."}


@router.post("/admin/transactions/{transaction_id}/cancel-transaction", summary="Admin — Annuler la vente")
async def admin_cancel_transaction(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : annule la vente et restitue les fonds à l'acheteur (MOCKED)"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx["status"] in ("completed", "cancelled", "offer_refused"):
        raise HTTPException(status_code=400, detail="Impossible d'annuler cette transaction")

    now = datetime.now(timezone.utc).isoformat()
    payment_amount = tx.get("payment_amount") or 0

    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now,
            "cancelled_by_admin": True,
            "updated_at": now,
        }, "$push": {"messages": system_message(
            f"Vente annulée par l'administrateur. "
            f"Remboursement de {payment_amount:,.0f} € à l'acheteur en cours (MOCKED)."
        )}}
    )

    # Remettre l'annonce active si elle était passée en "sold"
    if tx.get("listing_id"):
        await db.citadelle_listings.update_one(
            {"id": tx["listing_id"]},
            {"$set": {"status": "active", "updated_at": now}}
        )

    logger.info(f"[Citadelle Admin] Vente annulée: {transaction_id} par {current_user.get('email')}")
    return {"message": "Vente annulée. Fonds restitués à l'acheteur (MOCKED)."}


@router.post("/admin/transactions/{transaction_id}/mark-fee-paid", summary="Admin — Marquer les frais d'annulation comme réglés")
async def admin_mark_fee_paid(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : confirme la réception des frais d'annulation (une fois le paiement physique/Stripe vérifié)"""
    tx = await db.citadelle_transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx.get("status") != "cancelled":
        raise HTTPException(status_code=400, detail="Cette action ne s'applique qu'aux transactions annulées")
    if not tx.get("cancellation_fee"):
        raise HTTPException(status_code=400, detail="Aucun frais d'annulation enregistré sur cette transaction")
    if tx.get("cancellation_fee_paid"):
        raise HTTPException(status_code=400, detail="Les frais ont déjà été marqués comme réglés")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_transactions.update_one(
        {"id": transaction_id},
        {"$set": {
            "cancellation_fee_paid": True,
            "cancellation_fee_paid_at": now,
            "cancellation_fee_paid_by": current_user.get("email"),
            "updated_at": now,
        }, "$push": {"messages": system_message(
            f"Frais d'annulation de {tx['cancellation_fee']:,.0f} € confirmés comme réglés par l'administrateur."
        )}}
    )
    logger.info(f"[Citadelle Admin] Frais annulation confirmés: {transaction_id} par {current_user.get('email')}")
    return {"message": f"Frais de {tx['cancellation_fee']:,.0f} € marqués comme réglés."}


# ── Config des frais d'annulation ─────────────────────────────────────────────

@router.get("/admin/dispute-config", summary="Admin — Lire la config des frais d'annulation")
async def admin_get_dispute_config(
    current_user: dict = Depends(require_admin)
):
    """Admin : lit la configuration des frais d'annulation par tranches de prix"""
    config = await db.citadelle_dispute_config.find_one({"id": "default"}, {"_id": 0})
    if not config:
        return DEFAULT_DISPUTE_CONFIG
    return config


@router.patch("/admin/dispute-config", summary="Admin — Modifier la config des frais d'annulation")
async def admin_update_dispute_config(
    data: DisputeConfigUpdate,
    current_user: dict = Depends(require_admin)
):
    """Admin : modifie la configuration des frais d'annulation (acheteur et vendeur séparément)"""
    config = {
        "id": "default",
        "tranches_acheteur": data.tranches_acheteur,
        "tranches_vendeur": data.tranches_vendeur,
        "default_fee": data.default_fee,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user.get("email"),
    }
    await db.citadelle_dispute_config.update_one(
        {"id": "default"},
        {"$set": config},
        upsert=True
    )
    return config



@router.get("/member/earnings", summary="Membre — Récapitulatif des gains vendeur")
async def member_earnings(current_user: dict = Depends(require_citadelle_user)):
    """
    Récapitulatif des gains du vendeur :
    - total encaissé (ventes finalisées, net après commission)
    - en attente / séquestre (ventes payées mais non finalisées)
    - détail par vente
    """
    user_id = current_user.get("sub")
    pending_statuses = ["payment_done", "credentials_submitted", "admin_verified", "disputed"]

    total_received = 0.0
    total_pending = 0.0
    sales = []

    cursor = db.citadelle_transactions.find(
        {"seller_id": user_id, "status": {"$in": pending_statuses + ["completed"]}},
        {"_id": 0, "credentials": 0}
    ).sort("updated_at", -1)

    async for tx in cursor:
        gross = float(tx.get("payment_amount") or 0)
        status = tx.get("status")
        if status == "completed":
            net = float(tx.get("net_seller_amount") or 0)
            commission = float(tx.get("commission_amount") or 0)
            total_received += net
        else:
            commission, net = await _calculate_commission(gross)
            total_pending += net

        sales.append({
            "id": tx.get("id"),
            "title": tx.get("listing_title") or "Vente",
            "gross": gross,
            "commission": round(commission, 2),
            "net": round(net, 2),
            "status": status,
            "date": tx.get("updated_at") or tx.get("created_at"),
            "route": f"/citadelle/espace-membre/transactions/{tx.get('id')}",
        })

    return {
        "total_received": round(total_received, 2),
        "total_pending": round(total_pending, 2),
        "sales_count": len(sales),
        "sales": sales,
    }
