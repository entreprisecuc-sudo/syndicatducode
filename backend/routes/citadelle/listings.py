"""
Routes annonces — La Citadelle Numérique
Gestion complète du cycle de vie des annonces : création, publication, validation admin
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Request
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pathlib import Path
import re, uuid, shutil
import logging

from routes.citadelle.dependencies import require_admin, require_citadelle_user
from services.auth_service import decode_access_token
from services.email_service import (
    send_citadelle_listing_approved_email,
    send_citadelle_listing_rejected_email,
    send_citadelle_auction_bid_email,
    send_citadelle_auction_winner_email,
    send_citadelle_auction_new_listing_email,
    send_citadelle_admin_new_listing_email,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Listings"])

db = None

# Dossier d'upload pour les images d'annonces Citadelle
CITADELLE_UPLOADS_DIR = Path("/app/backend/uploads/citadelle")
CITADELLE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Types de fichiers autorisés (images + documents) et taille max (10 Mo)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
ALLOWED_DOC_TYPES = {"application/pdf", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOC_TYPES
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 Mo

def set_database(database):
    global db
    db = database


# ── Helpers ────────────────────────────────────────────────────────────────────

def generate_slug(title: str) -> str:
    """Génère un slug unique à partir du titre"""
    slug = re.sub(r'[^a-z0-9\s-]', '', title.lower().strip())
    slug = re.sub(r'[\s-]+', '-', slug).strip('-') or "annonce"
    suffix = str(uuid.uuid4())[:8]
    return f"{slug}-{suffix}"


def generate_listing_id() -> str:
    return str(uuid.uuid4())


# ── Upload image annonce ────────────────────────────────────────────────────────

@router.post("/upload-image")
async def upload_listing_image(
    file: UploadFile = File(...),
    request: Request = None
):
    """
    Upload une image pour une annonce Citadelle.
    - Types acceptés : JPEG, PNG, WebP, GIF
    - Taille max : 5 Mo
    - Authentification requise (token Citadelle)
    - Retourne l'URL publique de l'image
    """
    # Vérification authentification
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    # Validation type de fichier
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, GIF, SVG, PDF, DOC, DOCX"
        )

    # Lecture et validation taille
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux. Taille maximale : 5 Mo"
        )

    # Génération du nom de fichier unique
    ext_map = {
        ".jpg": ".jpg", ".jpeg": ".jpg", ".png": ".png", ".webp": ".webp",
        ".gif": ".gif", ".svg": ".svg", ".pdf": ".pdf", ".doc": ".doc", ".docx": ".docx"
    }
    raw_ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    ext = ext_map.get(raw_ext, raw_ext or ".bin")
    filename = f"listing_{uuid.uuid4().hex}{ext}"
    file_path = CITADELLE_UPLOADS_DIR / filename

    # Sauvegarde
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    url = f"/uploads/citadelle/{filename}"
    logger.info(f"[Citadelle] Image uploadée: {url}")
    return {"url": url, "filename": filename}


# require_citadelle_user / require_admin importés depuis routes/citadelle/dependencies (DRY)


# ── Modèles ────────────────────────────────────────────────────────────────────

LISTING_TYPES = ["website", "ecommerce", "saas", "webapp", "social_account", "domain"]
LISTING_STATUSES = ["draft", "pending", "active", "sold", "expired", "rejected"]

LISTING_EXPIRY_DAYS = 90  # Durée de validité d'une annonce active


class ListingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    type: str = Field(..., description="Type d'actif")
    short_description: str = Field(..., min_length=20, max_length=300)
    description: str = Field(..., min_length=50)
    price: float = Field(..., gt=0)
    price_negotiable: bool = False
    monthly_revenue: Optional[float] = None
    monthly_traffic: Optional[int] = None
    age_months: Optional[int] = None
    niche: Optional[str] = Field(None, max_length=100)
    technologies: Optional[List[str]] = []
    url_preview: Optional[str] = Field(None, max_length=500)
    images: Optional[List[str]] = []
    # Enchères
    is_auction: bool = False
    auction_show_reserve: bool = False
    auction_duration_days: int = Field(7, ge=3, le=31)
    auction_buy_now_price: Optional[float] = Field(None, gt=0)

    def validate_type(self):
        if self.type not in LISTING_TYPES:
            raise ValueError(f"Type invalide. Valeurs acceptées : {LISTING_TYPES}")


class ListingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=150)
    short_description: Optional[str] = Field(None, min_length=20, max_length=300)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    price_negotiable: Optional[bool] = None
    monthly_revenue: Optional[float] = None
    monthly_traffic: Optional[int] = None
    age_months: Optional[int] = None
    niche: Optional[str] = None
    technologies: Optional[List[str]] = None
    url_preview: Optional[str] = None
    images: Optional[List[str]] = None
    # Enchères
    is_auction: Optional[bool] = None
    auction_show_reserve: Optional[bool] = None
    auction_duration_days: Optional[int] = Field(None, ge=3, le=31)
    auction_buy_now_price: Optional[float] = Field(None, gt=0)


class AdminRejectListing(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)


# ── Routes publiques ──────────────────────────────────────────────────────────

@router.get("/listings", summary="Liste publique des annonces actives")
async def list_listings(
    q: Optional[str] = Query(None, description="Recherche mot-clé"),
    type: Optional[str] = Query(None),
    budget_min: Optional[float] = Query(None),
    budget_max: Optional[float] = Query(None),
    budget: Optional[str] = Query(None, description="Tranche budget ex: 5000-20000"),
    sort: Optional[str] = Query("recent", description="recent|price_asc|price_desc|revenue"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50)
):
    """Liste des annonces actives — accessible sans authentification"""
    filters = {"status": {"$in": ["active", "sold"]}}

    if type and type in LISTING_TYPES:
        filters["type"] = type

    # Traitement tranche budget
    b_min, b_max = budget_min, budget_max
    if budget and "-" in budget:
        parts = budget.split("-")
        try:
            b_min = float(parts[0])
            if parts[1] != "":
                b_max = float(parts[1])
        except ValueError:
            pass
    elif budget and budget.endswith("+"):
        try:
            b_min = float(budget[:-1])
        except ValueError:
            pass

    price_filter = {}
    if b_min is not None:
        price_filter["$gte"] = b_min
    if b_max is not None:
        price_filter["$lte"] = b_max
    if price_filter:
        filters["price"] = price_filter

    # Recherche textuelle
    if q:
        filters["$text"] = {"$search": q}

    # Tri
    sort_map = {
        "recent": [("is_featured", -1), ("published_at", -1)],
        "price_asc": [("is_featured", -1), ("price", 1)],
        "price_desc": [("is_featured", -1), ("price", -1)],
        "revenue": [("is_featured", -1), ("monthly_revenue", -1)],
    }
    sort_order = sort_map.get(sort, sort_map["recent"])

    skip = (page - 1) * limit
    total = await db.citadelle_listings.count_documents(filters)
    cursor = db.citadelle_listings.find(filters, {"_id": 0, "url_preview": 0}).sort(sort_order).skip(skip).limit(limit)
    listings = await cursor.to_list(limit)

    return {
        "listings": listings,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
        "limit": limit
    }


@router.get("/listings/my", summary="Mes annonces (membre connecté)")
async def my_listings(current_user: dict = Depends(require_citadelle_user)):
    """Annonces du vendeur connecté — tous statuts"""
    seller_id = current_user.get("sub")
    cursor = db.citadelle_listings.find(
        {"seller_id": seller_id},
        {"_id": 0, "url_preview": 0}
    ).sort("created_at", -1)
    listings = await cursor.to_list(100)
    return {"listings": listings}


@router.get("/listings/{slug}", summary="Détail d'une annonce publique")
async def get_listing(slug: str):
    """Détail d'une annonce active — URL preview masquée"""
    listing = await db.citadelle_listings.find_one(
        {"slug": slug, "status": {"$in": ["active", "sold"]}},
        {"_id": 0, "url_preview": 0}
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable ou non disponible")

    # Incrément du compteur de vues
    await db.citadelle_listings.update_one(
        {"slug": slug},
        {"$inc": {"views_count": 1}}
    )

    # Infos vendeur (score uniquement, pas de données sensibles)
    seller = await db.users.find_one(
        {"id": listing["seller_id"]},
        {"_id": 0, "first_name": 1, "last_name": 1, "seller_score": 1, "seller_verified": 1, "created_at": 1}
    )
    listing["seller"] = seller or {}

    return listing


# ── Routes membre (authentification Citadelle requise) ─────────────────────────

@router.post("/listings", status_code=status.HTTP_201_CREATED, summary="Créer une annonce")
async def create_listing(
    data: ListingCreate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Crée une annonce en statut 'draft' ou 'pending' selon les données fournies"""
    try:
        data.validate_type()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.now(timezone.utc).isoformat()
    listing_id = generate_listing_id()
    slug = generate_slug(data.title)

    listing_doc = {
        "id": listing_id,
        "slug": slug,
        "title": data.title,
        "type": data.type,
        "short_description": data.short_description,
        "description": data.description,
        "seller_id": current_user.get("sub"),
        "seller_email": current_user.get("email"),
        "status": "pending",
        "price": data.price,
        "price_negotiable": data.price_negotiable,
        "monthly_revenue": data.monthly_revenue,
        "monthly_traffic": data.monthly_traffic,
        "age_months": data.age_months,
        "niche": data.niche,
        "technologies": data.technologies or [],
        "url_preview": data.url_preview,
        "images": data.images or [],
        "is_featured": False,
        "is_verified": False,
        "views_count": 0,
        "favorites_count": 0,
        "rejection_reason": None,
        "created_at": now,
        "updated_at": now,
        "published_at": None,
        "expires_at": None,
        # Enchères
        "is_auction": data.is_auction,
        "auction_show_reserve": data.auction_show_reserve,
        "auction_duration_days": data.auction_duration_days,
        "auction_buy_now_price": data.auction_buy_now_price,
        "auction_ends_at": None,
        "auction_current_bid": None,
        "auction_current_bidder_id": None,
        "auction_current_bidder_email": None,
        "auction_current_bidder_name": None,
        "auction_bids": [],
        "auction_winner_transaction_id": None,
    }

    await db.citadelle_listings.insert_one(listing_doc)
    listing_doc.pop("_id", None)
    logger.info(f"[Citadelle] Nouvelle annonce soumise: {slug} par {current_user.get('email')}")

    # Notification admin — nouvelle annonce à modérer
    send_citadelle_admin_new_listing_email(
        seller_email=current_user.get("email"),
        listing_title=data.title,
        listing_type=data.type,
        listing_price=data.price,
        is_auction=data.is_auction,
    )

    return listing_doc


@router.patch("/listings/{listing_id}", summary="Modifier une annonce (propriétaire)")
async def update_listing(
    listing_id: str,
    data: ListingUpdate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Modifie une annonce — uniquement par son propriétaire"""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing["seller_id"] != current_user.get("sub") and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Vous n'êtes pas propriétaire de cette annonce")

    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return listing
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Traçabilité baisse de prix : on conserve original_price lors de la première baisse
    nouveau_prix = updates.get("price")
    if nouveau_prix is not None:
        prix_actuel = listing.get("price", 0)
        original = listing.get("original_price")
        if nouveau_prix < prix_actuel:
            # Baisse de prix : mémoriser le prix de référence (le plus haut connu)
            updates["original_price"] = original if original and original > prix_actuel else prix_actuel
        elif original and nouveau_prix >= original:
            # Prix remonté au-dessus du prix de référence : effacer le badge
            updates["original_price"] = None

    # Toute modification repasse l'annonce en pending pour re-validation admin
    if listing["status"] in ("active", "rejected"):
        updates["status"] = "pending"
        updates["rejection_reason"] = None

    await db.citadelle_listings.update_one({"id": listing_id}, {"$set": updates})
    updated = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    return updated


@router.delete("/listings/{listing_id}", summary="Supprimer une annonce (propriétaire)")
async def delete_listing(
    listing_id: str,
    current_user: dict = Depends(require_citadelle_user)
):
    """Supprime une annonce — uniquement en statut draft ou rejected"""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing["seller_id"] != current_user.get("sub") and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if listing["status"] == "active":
        raise HTTPException(status_code=400, detail="Impossible de supprimer une annonce active")

    await db.citadelle_listings.delete_one({"id": listing_id})
    return {"message": "Annonce supprimée avec succès"}


# ── Routes Admin ──────────────────────────────────────────────────────────────

@router.get("/admin/listings", summary="Admin — Liste toutes les annonces")
async def admin_list_listings(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Admin : liste toutes les annonces avec filtres optionnels"""
    filters = {}
    if status_filter and status_filter in LISTING_STATUSES:
        filters["status"] = status_filter

    skip = (page - 1) * limit
    total = await db.citadelle_listings.count_documents(filters)
    cursor = db.citadelle_listings.find(filters, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    listings = await cursor.to_list(limit)

    # Compteurs par statut
    counts = {}
    for s in LISTING_STATUSES:
        counts[s] = await db.citadelle_listings.count_documents({"status": s})

    return {
        "listings": listings,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
        "counts": counts
    }


@router.patch("/admin/listings/{listing_id}/validate", summary="Admin — Valider une annonce")
async def admin_validate_listing(
    listing_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : valide une annonce → active. Notifie le vendeur par email."""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing["status"] not in ("pending", "rejected"):
        raise HTTPException(status_code=400, detail=f"L'annonce est déjà en statut '{listing['status']}'")

    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=LISTING_EXPIRY_DAYS)

    auction_updates = {}
    if listing.get("is_auction"):
        # Lancement de l'enchère : calcul de la date de fin
        duration = listing.get("auction_duration_days", 7)
        auction_ends = now + timedelta(days=duration)
        auction_updates = {
            "auction_ends_at": auction_ends.isoformat(),
            "auction_current_bid": listing.get("price"),  # Démarre au prix de réserve
        }

    await db.citadelle_listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "active",
            "published_at": now.isoformat(),
            "expires_at": expires.isoformat(),
            "updated_at": now.isoformat(),
            "rejection_reason": None,
            **auction_updates
        }}
    )

    # Email de notification au vendeur
    if listing.get("seller_email"):
        send_citadelle_listing_approved_email(
            listing["seller_email"],
            listing["title"],
            listing["slug"]
        )

    # Si enchère : notifier tous les utilisateurs + abonnés newsletter
    if listing.get("is_auction") and auction_updates:
        import asyncio
        asyncio.create_task(_notifier_utilisateurs_enchere(listing, auction_updates["auction_ends_at"]))

    logger.info(f"[Citadelle Admin] Annonce validée: {listing_id} par {current_user.get('email')}")
    return {"message": "Annonce validée et publiée avec succès"}


@router.patch("/admin/listings/{listing_id}/reject", summary="Admin — Rejeter une annonce")
async def admin_reject_listing(
    listing_id: str,
    data: AdminRejectListing,
    current_user: dict = Depends(require_admin)
):
    """Admin : rejette une annonce avec motif"""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    now = datetime.now(timezone.utc).isoformat()
    await db.citadelle_listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": data.reason,
            "updated_at": now
        }}
    )

    # Email de notification au vendeur avec le motif détaillé
    if listing.get("seller_email"):
        send_citadelle_listing_rejected_email(
            listing["seller_email"],
            listing["title"],
            data.reason
        )

    logger.info(f"[Citadelle Admin] Annonce rejetée: {listing_id} - Raison: {data.reason[:50]}")
    return {"message": "Annonce rejetée"}


@router.patch("/admin/listings/{listing_id}/feature", summary="Admin — Mettre en avant")
async def admin_feature_listing(
    listing_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : bascule la mise en avant d'une annonce"""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    new_value = not listing.get("is_featured", False)
    await db.citadelle_listings.update_one(
        {"id": listing_id},
        {"$set": {"is_featured": new_value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    action = "mise en avant" if new_value else "retirée de la mise en avant"
    return {"message": f"Annonce {action}", "is_featured": new_value}


@router.delete("/admin/listings/{listing_id}", summary="Admin — Supprimer une annonce")
async def admin_delete_listing(
    listing_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : supprime une annonce quel que soit son statut"""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    await db.citadelle_listings.delete_one({"id": listing_id})
    logger.info(f"[Citadelle Admin] Annonce supprimée: {listing['title']} (par {current_user.get('email')})")
    return {"message": "Annonce supprimée avec succès"}


# ── Enchères ────────────────────────────────────────────────────────────────────

class BidCreate(BaseModel):
    amount: float = Field(..., gt=0)


@router.post("/listings/{listing_id}/bid", summary="Placer une enchère")
async def place_bid(
    listing_id: str,
    data: BidCreate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Acheteur : place une enchère sur une annonce mise aux enchères."""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing.get("status") != "active":
        raise HTTPException(status_code=400, detail="Cette annonce n'est plus disponible")
    if not listing.get("is_auction"):
        raise HTTPException(status_code=400, detail="Cette annonce n'est pas en mode enchère")

    # Vérifier que l'enchère est toujours en cours
    auction_ends_at = listing.get("auction_ends_at")
    if not auction_ends_at:
        raise HTTPException(status_code=400, detail="L'enchère n'a pas encore démarré")
    now = datetime.now(timezone.utc)
    if now >= datetime.fromisoformat(auction_ends_at):
        raise HTTPException(status_code=400, detail="L'enchère est terminée")

    # Vérification de l'identité
    bidder_id = current_user.get("sub")
    if listing["seller_id"] == bidder_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas enchérir sur votre propre annonce")

    # Montant minimum attendu
    current_bid = listing.get("auction_current_bid") or listing.get("price", 0)
    has_bids = bool(listing.get("auction_bids"))
    montant_min = (current_bid + 10) if has_bids else current_bid
    if data.amount < montant_min:
        raise HTTPException(
            status_code=400,
            detail=f"Montant minimum : {montant_min:,.0f} € (enchère actuelle + 10 €)"
        )

    # Récupérer le nom de l'enchérisseur
    bidder_user = await db.citadelle_users.find_one({"id": bidder_id}, {"_id": 0, "first_name": 1, "last_name": 1})
    bidder_name = ""
    if bidder_user:
        bidder_name = f"{bidder_user.get('first_name', '')} {bidder_user.get('last_name', '')}".strip()

    bid_entry = {
        "bidder_id": bidder_id,
        "bidder_email": current_user.get("email"),
        "bidder_name": bidder_name or current_user.get("email"),
        "amount": data.amount,
        "bid_at": now.isoformat(),
    }

    await db.citadelle_listings.update_one(
        {"id": listing_id},
        {
            "$set": {
                "auction_current_bid": data.amount,
                "auction_current_bidder_id": bidder_id,
                "auction_current_bidder_email": current_user.get("email"),
                "auction_current_bidder_name": bidder_name or current_user.get("email"),
                "updated_at": now.isoformat(),
            },
            "$push": {"auction_bids": bid_entry}
        }
    )

    # Email de confirmation à l'enchérisseur
    send_citadelle_auction_bid_email(
        bidder_email=current_user.get("email"),
        bidder_name=bidder_name or current_user.get("email"),
        listing_title=listing["title"],
        listing_slug=listing["slug"],
        amount=data.amount,
        auction_ends_at=auction_ends_at,
    )

    listing_updated = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    logger.info(f"[Citadelle Enchère] {current_user.get('email')} a enchéri {data.amount}€ sur {listing['title']}")
    return listing_updated


async def _notifier_utilisateurs_enchere(listing: dict, auction_ends_at: str):
    """Envoie les notifications email à tous les utilisateurs + abonnés newsletter lors d'une nouvelle enchère."""
    try:
        emails_notifies = set()

        # Tous les utilisateurs inscrits
        cursor = db.citadelle_users.find({}, {"_id": 0, "email": 1, "first_name": 1})
        async for user in cursor:
            email = user.get("email", "")
            if email and email != listing.get("seller_email"):
                emails_notifies.add(email)

        # Abonnés newsletter (peut inclure des non-inscrits)
        cursor_nl = db.citadelle_newsletter.find({"active": True}, {"_id": 0, "email": 1})
        async for sub in cursor_nl:
            email = sub.get("email", "")
            if email:
                emails_notifies.add(email)

        for email in emails_notifies:
            send_citadelle_auction_new_listing_email(
                recipient_email=email,
                listing_title=listing["title"],
                listing_slug=listing["slug"],
                listing_price=listing.get("price", 0),
                auction_ends_at=auction_ends_at,
            )

        logger.info(f"[Citadelle Enchère] Notifications envoyées à {len(emails_notifies)} destinataires pour '{listing['title']}'")
    except Exception as e:
        logger.error(f"[Citadelle Enchère] Erreur notification utilisateurs: {e}")
