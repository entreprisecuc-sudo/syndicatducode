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

from middleware.auth import get_current_user
from services.auth_service import decode_access_token
from services.email_service import (
    send_citadelle_listing_approved_email,
    send_citadelle_listing_rejected_email
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Listings"])

db = None

# Dossier d'upload pour les images d'annonces Citadelle
CITADELLE_UPLOADS_DIR = Path("/app/backend/uploads/citadelle")
CITADELLE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Types d'images autorisés et taille max (5 Mo)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

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
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, GIF"
        )

    # Lecture et validation taille
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux. Taille maximale : 5 Mo"
        )

    # Génération du nom de fichier unique
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"
    filename = f"listing_{uuid.uuid4().hex}{ext}"
    file_path = CITADELLE_UPLOADS_DIR / filename

    # Sauvegarde
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    url = f"/uploads/citadelle/{filename}"
    logger.info(f"[Citadelle] Image uploadée: {url}")
    return {"url": url, "filename": filename}


async def require_citadelle_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Vérifie que l'utilisateur est membre Citadelle ou admin"""
    if current_user.get("platform") != "citadelle" and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux membres de La Citadelle Numérique"
        )
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Vérifie que l'utilisateur est administrateur"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user


# ── Modèles ────────────────────────────────────────────────────────────────────

LISTING_TYPES = ["website", "ecommerce", "saas", "webapp", "social_account"]
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
    filters = {"status": "active"}

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
        {"slug": slug, "status": "active"},
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
        "expires_at": None
    }

    await db.citadelle_listings.insert_one(listing_doc)
    listing_doc.pop("_id", None)
    logger.info(f"[Citadelle] Nouvelle annonce soumise: {slug} par {current_user.get('email')}")
    return listing_doc


@router.patch("/listings/{listing_id}", summary="Modifier une annonce (propriétaire)")
async def update_listing(
    listing_id: str,
    data: ListingUpdate,
    current_user: dict = Depends(require_citadelle_user)
):
    """Modifie une annonce — uniquement par son propriétaire, si non active"""
    listing = await db.citadelle_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    if listing["seller_id"] != current_user.get("sub") and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Vous n'êtes pas propriétaire de cette annonce")
    if listing["status"] == "active":
        raise HTTPException(status_code=400, detail="Une annonce active ne peut pas être modifiée directement. Contactez le support.")

    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return listing
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    # Si modification d'une annonce rejetée → repasse en pending
    if listing["status"] == "rejected":
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

    await db.citadelle_listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "active",
            "published_at": now.isoformat(),
            "expires_at": expires.isoformat(),
            "updated_at": now.isoformat(),
            "rejection_reason": None
        }}
    )

    # Email de notification au vendeur
    if listing.get("seller_email"):
        send_citadelle_listing_approved_email(
            listing["seller_email"],
            listing["title"],
            listing["slug"]
        )

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
