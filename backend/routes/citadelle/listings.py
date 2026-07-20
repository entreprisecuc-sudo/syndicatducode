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

from routes.citadelle.dependencies import require_admin, require_citadelle_user, require_can_transact
from services.auth_service import decode_access_token
from utils.notif_prefs import email_notifications_enabled
from services.email_service import (
    send_citadelle_listing_approved_email,
    send_citadelle_listing_rejected_email,
    send_citadelle_auction_bid_email,
    send_citadelle_auction_outbid_email,
    send_citadelle_auction_winner_email,
    send_citadelle_auction_new_listing_email,
    send_citadelle_auction_bid_removed_email,
    send_citadelle_admin_new_listing_email,
    send_citadelle_report_email,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Listings"])

db = None

# Dossier d'upload pour les images d'annonces Citadelle (chemin relatif au fichier)
CITADELLE_UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads" / "citadelle"
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


# Valeur par défaut du minimum de commission (aligné sur settings.py)
_COMMISSION_MIN_DEFAULT = 49


async def get_min_sale_price() -> float:
    """
    Prix de vente minimum autorisé = minimum de commission + 1 €.
    Garantit un net vendeur positif. Lit dynamiquement la config admin
    (citadelle_settings, clé "commission").
    """
    doc = await db.citadelle_settings.find_one({"key": "commission"}, {"_id": 0, "minimum_eur": 1})
    minimum_eur = doc.get("minimum_eur", _COMMISSION_MIN_DEFAULT) if doc else _COMMISSION_MIN_DEFAULT
    return float(minimum_eur) + 1


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

LISTING_TYPES = [
    # Catégories principales
    "website", "ecommerce", "saas", "webapp", "social_account", "domain",
    # Catégories "Autre" (nouvelles)
    "shopify_store", "amazon_fba", "newsletter", "youtube_channel",
    "instagram", "tiktok", "linkedin_page", "discord_server",
    "forum", "blog", "online_media", "ai_automation",
    "template_plugin", "database_api",
]
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
    url_public: bool = False
    images: Optional[List[str]] = []
    is_adult: bool = False
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
    url_public: Optional[bool] = None
    images: Optional[List[str]] = None
    is_adult: Optional[bool] = None
    # Enchères
    is_auction: Optional[bool] = None
    auction_show_reserve: Optional[bool] = None
    auction_duration_days: Optional[int] = Field(None, ge=3, le=31)
    auction_buy_now_price: Optional[float] = Field(None, gt=0)


class AdminRejectListing(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)


# ── Routes publiques ──────────────────────────────────────────────────────────

def _build_listings_query(q, type, budget, budget_min, budget_max, sort):
    """Construit (filters, sort_order) pour les annonces publiques — partagé (DRY)."""
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

    if q:
        filters["$text"] = {"$search": q}

    sort_map = {
        "recent": [("is_featured", -1), ("published_at", -1)],
        "price_asc": [("is_featured", -1), ("price", 1)],
        "price_desc": [("is_featured", -1), ("price", -1)],
        "revenue": [("is_featured", -1), ("monthly_revenue", -1)],
    }
    sort_order = sort_map.get(sort, sort_map["recent"])
    return filters, sort_order


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
    filters, sort_order = _build_listings_query(q, type, budget, budget_min, budget_max, sort)

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
        {"_id": 0}
    ).sort("created_at", -1)
    listings = await cursor.to_list(100)
    return {"listings": listings}


@router.get("/listings/{slug}/siblings", summary="Annonce précédente / suivante")
async def get_listing_siblings(
    slug: str,
    q: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    budget_min: Optional[float] = Query(None),
    budget_max: Optional[float] = Query(None),
    budget: Optional[str] = Query(None),
    sort: Optional[str] = Query("recent"),
):
    """Annonce précédente et suivante en respectant les filtres/tri en cours."""
    filters, sort_order = _build_listings_query(q, type, budget, budget_min, budget_max, sort)
    docs = await db.citadelle_listings.find(
        filters, {"_id": 0, "slug": 1, "title": 1}
    ).sort(sort_order).to_list(1000)

    idx = next((i for i, d in enumerate(docs) if d.get("slug") == slug), None)

    # Annonce hors périmètre du filtre : on retombe sur le classement global
    if idx is None:
        filters_all, sort_all = _build_listings_query(None, None, None, None, None, "recent")
        docs = await db.citadelle_listings.find(
            filters_all, {"_id": 0, "slug": 1, "title": 1}
        ).sort(sort_all).to_list(1000)
        idx = next((i for i, d in enumerate(docs) if d.get("slug") == slug), None)
        if idx is None:
            return {"prev": None, "next": None}

    def light(d):
        return {"slug": d["slug"], "title": d.get("title", "")} if d else None

    prev = docs[idx - 1] if idx > 0 else None
    nxt = docs[idx + 1] if idx < len(docs) - 1 else None
    return {"prev": light(prev), "next": light(nxt)}


@router.get("/listings/{slug}", summary="Détail d'une annonce publique")
async def get_listing(slug: str):
    """Détail d'une annonce active — URL du site visible seulement si le vendeur l'a autorisée"""
    listing = await db.citadelle_listings.find_one(
        {"slug": slug, "status": {"$in": ["active", "sold"]}},
        {"_id": 0}
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable ou non disponible")

    # URL du site : rendue publique uniquement si le vendeur l'a explicitement choisi
    if not listing.get("url_public"):
        listing.pop("url_preview", None)

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
    current_user: dict = Depends(require_can_transact)
):
    """Crée une annonce en statut 'draft' ou 'pending' selon les données fournies"""
    try:
        data.validate_type()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Prix de vente / réserve minimum dynamique (frais min + 1 €) — net vendeur positif garanti
    min_price = await get_min_sale_price()
    if data.price < min_price:
        raise HTTPException(status_code=400, detail=f"Le prix de vente minimum est de {min_price:.0f} € (frais de traitement minimum).")
    if data.auction_buy_now_price is not None and data.auction_buy_now_price < min_price:
        raise HTTPException(status_code=400, detail=f"Le prix d'achat immédiat minimum est de {min_price:.0f} €.")

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
        "url_preview": None if data.is_adult else data.url_preview,
        "url_public": False if data.is_adult else data.url_public,
        "images": [] if data.is_adult else (data.images or []),
        "is_adult": data.is_adult,
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

    # Contenu adulte : ni images ni lien ne sont conservés
    effective_adult = updates.get("is_adult", listing.get("is_adult", False))
    if effective_adult:
        updates["images"] = []
        updates["url_preview"] = None
        updates["url_public"] = False

    # Prix de vente / réserve + achat immédiat minimum dynamique (frais min + 1 €)
    if data.price is not None or data.auction_buy_now_price is not None:
        min_price = await get_min_sale_price()
        if data.price is not None and data.price < min_price:
            raise HTTPException(status_code=400, detail=f"Le prix de vente minimum est de {min_price:.0f} € (frais de traitement minimum).")
        if data.auction_buy_now_price is not None and data.auction_buy_now_price < min_price:
            raise HTTPException(status_code=400, detail=f"Le prix d'achat immédiat minimum est de {min_price:.0f} €.")

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


@router.patch("/admin/listings/{listing_id}/garde-verify", summary="Admin — Toggle badge Vérifié La Garde")
async def admin_garde_verify_listing(
    listing_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Admin : active ou désactive le badge « Vérifié par La Garde » sur une annonce.
    Envoie un email de notification au vendeur lors de l'activation.
    """
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    new_value = not listing.get("garde_verified", False)
    now = datetime.now(timezone.utc).isoformat()

    await db.citadelle_listings.update_one(
        {"id": listing_id},
        {"$set": {
            "garde_verified": new_value,
            "garde_verified_at": now if new_value else None,
            "updated_at": now,
        }}
    )

    # Email de notification au vendeur uniquement lors de l'activation
    if new_value and listing.get("seller_email"):
        from services.email_service import send_citadelle_garde_verified_email
        seller = await db.users.find_one(
            {"id": listing.get("seller_id")},
            {"_id": 0, "first_name": 1, "last_name": 1}
        )
        seller_name = ""
        if seller:
            seller_name = f"{seller.get('first_name', '')} {seller.get('last_name', '')}".strip()
        send_citadelle_garde_verified_email(
            to_email=listing["seller_email"],
            listing_title=listing["title"],
            listing_slug=listing["slug"],
            seller_name=seller_name,
        )
        logger.info(f"[Citadelle Admin] Badge La Garde activé sur: {listing['title']}")
    else:
        logger.info(f"[Citadelle Admin] Badge La Garde retiré sur: {listing['title']}")

    action = "Badge La Garde activé" if new_value else "Badge La Garde retiré"
    return {"message": action, "garde_verified": new_value}


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
    current_user: dict = Depends(require_can_transact)
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
        "bid_id": str(uuid.uuid4()),
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
    if await email_notifications_enabled(db, current_user.get("email")):
        send_citadelle_auction_bid_email(
            bidder_email=current_user.get("email"),
            bidder_name=bidder_name or current_user.get("email"),
            listing_title=listing["title"],
            listing_slug=listing["slug"],
            amount=data.amount,
            auction_ends_at=auction_ends_at,
        )

    # Notification "vous avez été surenchéri" à l'ancien meilleur enchérisseur
    prev_bidder_id = listing.get("auction_current_bidder_id")
    prev_bidder_email = listing.get("auction_current_bidder_email")
    prev_amount = listing.get("auction_current_bid")
    if prev_bidder_id and prev_bidder_email and prev_bidder_id != bidder_id \
            and await email_notifications_enabled(db, prev_bidder_email):
        send_citadelle_auction_outbid_email(
            bidder_email=prev_bidder_email,
            bidder_name=listing.get("auction_current_bidder_name") or prev_bidder_email,
            listing_title=listing["title"],
            listing_slug=listing["slug"],
            previous_amount=prev_amount or 0,
            new_amount=data.amount,
            auction_ends_at=auction_ends_at,
        )

    listing_updated = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    logger.info(f"[Citadelle Enchère] {current_user.get('email')} a enchéri {data.amount}€ sur {listing['title']}")
    return listing_updated


# ── Signalement d'enchère suspecte ────────────────────────────────────────────

class BidReportCreate(BaseModel):
    message: str = Field(default="", max_length=2000)


def _bid_courante(listing: dict) -> Optional[dict]:
    """Retourne l'enchère la plus haute (enchère courante) ou None."""
    bids = listing.get("auction_bids") or []
    if not bids:
        return None
    return max(bids, key=lambda b: b.get("amount", 0))


@router.post("/listings/{listing_id}/report-bid", summary="Signaler l'enchère courante comme suspecte")
async def report_bid(
    listing_id: str,
    data: BidReportCreate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Tout membre connecté peut signaler discrètement l'enchère la plus haute.
    Le signalement n'est visible que des admins ; aucun autre membre n'en est informé."""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if not listing.get("is_auction"):
        raise HTTPException(status_code=400, detail="Cette annonce n'est pas en mode enchère")

    bid = _bid_courante(listing)
    if not bid:
        raise HTTPException(status_code=400, detail="Aucune enchère à signaler sur cette annonce")

    # Backfill d'un bid_id pour les enchères historiques sans identifiant
    bid_id = bid.get("bid_id")
    if not bid_id:
        bid_id = str(uuid.uuid4())
        await db.citadelle_listings.update_one(
            {"id": listing_id, "auction_bids.bid_at": bid.get("bid_at"),
             "auction_bids.bidder_id": bid.get("bidder_id")},
            {"$set": {"auction_bids.$.bid_id": bid_id}}
        )

    now = datetime.now(timezone.utc).isoformat()
    report = {
        "id": str(uuid.uuid4()),
        "report_type": "bid",
        "reason": "enchere_suspecte",
        "reason_label": "Enchère suspecte",
        "message": (data.message or "").strip() or "Enchère jugée suspecte par un membre.",
        "reporter_id": current_user.get("sub"),
        "reporter_email": current_user.get("email"),
        "reporter_role": "member",
        "listing_id": listing_id,
        "listing_slug": listing.get("slug"),
        "listing_title": listing.get("title", ""),
        "listing_price": listing.get("price"),
        "bid_id": bid_id,
        "bid_amount": bid.get("amount"),
        "bid_bidder_id": bid.get("bidder_id"),
        "bid_bidder_email": bid.get("bidder_email"),
        "bid_bidder_name": bid.get("bidder_name"),
        "buyer_id": None,
        "seller_id": listing.get("seller_id"),
        "buyer_email": None,
        "seller_email": listing.get("seller_email"),
        "status": "open",
        "admin_notes": "",
        "created_at": now,
        "updated_at": now,
    }
    await db.citadelle_reports.insert_one({**report})

    try:
        send_citadelle_report_email(report)
    except Exception as e:
        logger.warning(f"[Citadelle Report] Échec envoi email admin (enchère): {e}")

    logger.info(f"[Citadelle Report] Enchère {bid_id} signalée par {current_user.get('email')} sur {listing['title']}")
    return {"success": True, "message": "Signalement transmis à notre équipe. Merci, nous vérifions cette enchère."}


@router.delete("/admin/listings/{listing_id}/bids/{bid_id}", summary="Admin — Supprimer une enchère suspecte")
async def admin_delete_bid(
    listing_id: str,
    bid_id: str,
    current_user: dict = Depends(require_admin)
):
    """Supprime une enchère, recalcule l'enchère courante et notifie l'enchérisseur."""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    bids = listing.get("auction_bids") or []
    cible = next((b for b in bids if b.get("bid_id") == bid_id), None)
    if not cible:
        raise HTTPException(status_code=404, detail="Enchère introuvable (déjà supprimée ?)")

    reste = [b for b in bids if b.get("bid_id") != bid_id]

    now = datetime.now(timezone.utc).isoformat()
    updates = {"auction_bids": reste, "updated_at": now}
    nouvelle = max(reste, key=lambda b: b.get("amount", 0)) if reste else None
    if nouvelle:
        updates.update({
            "auction_current_bid": nouvelle.get("amount"),
            "auction_current_bidder_id": nouvelle.get("bidder_id"),
            "auction_current_bidder_email": nouvelle.get("bidder_email"),
            "auction_current_bidder_name": nouvelle.get("bidder_name"),
        })
    else:
        updates.update({
            "auction_current_bid": listing.get("price"),
            "auction_current_bidder_id": None,
            "auction_current_bidder_email": None,
            "auction_current_bidder_name": None,
        })

    await db.citadelle_listings.update_one({"id": listing_id}, {"$set": updates})

    # Notification à l'enchérisseur dont l'enchère a été annulée
    try:
        if await email_notifications_enabled(db, cible.get("bidder_email")):
            send_citadelle_auction_bid_removed_email(
                bidder_email=cible.get("bidder_email"),
                bidder_name=cible.get("bidder_name") or cible.get("bidder_email"),
                listing_title=listing.get("title", ""),
                listing_slug=listing.get("slug", ""),
                amount=cible.get("amount", 0),
            )
    except Exception as e:
        logger.warning(f"[Citadelle Enchère] Échec email annulation enchère: {e}")

    # Clôture des signalements liés à cette enchère
    await db.citadelle_reports.update_many(
        {"bid_id": bid_id, "status": {"$ne": "resolved"}},
        {"$set": {"status": "resolved", "updated_at": now}}
    )

    logger.info(f"[Citadelle Enchère] Enchère {bid_id} supprimée par {current_user.get('email')} sur {listing['title']}")
    return {"success": True, "message": "Enchère supprimée. L'enchérisseur a été notifié."}


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
