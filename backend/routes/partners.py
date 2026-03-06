"""
Routes pour la gestion des partenaires
- Admin : CRUD complet
- Membres : Consultation des partenaires actifs
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
import uuid
import logging

from models.partner import (
    PartnerCreate, PartnerUpdate, PartnerResponse, PartnerListResponse,
    PartnerCategory, PartnerStatus
)
from middleware.auth import get_current_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/partners", tags=["Partenaires"])

db = None

def set_database(database):
    global db
    db = database


# ============================================
# ROUTES ADMIN
# ============================================

@router.post("/admin", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
async def create_partner(
    data: PartnerCreate,
    current_user: dict = Depends(require_admin)
):
    """Créer un nouveau partenaire (admin)"""
    now = datetime.now(timezone.utc).isoformat()
    partner_id = str(uuid.uuid4())
    
    partner_doc = {
        "id": partner_id,
        "name": data.name,
        "description": data.description,
        "logo_url": data.logo_url,
        "website_url": data.website_url,
        "category": data.category.value,
        "advantages": data.advantages,
        "discount_code": data.discount_code,
        "contact_email": data.contact_email,
        "is_featured": data.is_featured,
        "status": PartnerStatus.ACTIVE.value,
        "created_at": now,
        "updated_at": now
    }
    
    await db.partners.insert_one(partner_doc)
    
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "create_partner",
        "details": f"Partenaire créé: {data.name}",
        "target_id": partner_id,
        "created_at": now
    })
    
    logger.info(f"Partenaire créé: {data.name}")
    
    return PartnerResponse(**partner_doc)


@router.get("/admin", response_model=PartnerListResponse)
async def get_all_partners_admin(
    current_user: dict = Depends(require_admin)
):
    """Récupérer tous les partenaires (admin)"""
    partners = await db.partners.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    
    return PartnerListResponse(
        partners=[PartnerResponse(**p) for p in partners],
        total=len(partners)
    )


@router.get("/admin/{partner_id}", response_model=PartnerResponse)
async def get_partner_admin(
    partner_id: str,
    current_user: dict = Depends(require_admin)
):
    """Récupérer un partenaire (admin)"""
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    
    return PartnerResponse(**partner)


@router.put("/admin/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: str,
    data: PartnerUpdate,
    current_user: dict = Depends(require_admin)
):
    """Mettre à jour un partenaire (admin)"""
    partner = await db.partners.find_one({"id": partner_id})
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.logo_url is not None:
        update_data["logo_url"] = data.logo_url
    if data.website_url is not None:
        update_data["website_url"] = data.website_url
    if data.category is not None:
        update_data["category"] = data.category.value
    if data.advantages is not None:
        update_data["advantages"] = data.advantages
    if data.discount_code is not None:
        update_data["discount_code"] = data.discount_code
    if data.contact_email is not None:
        update_data["contact_email"] = data.contact_email
    if data.is_featured is not None:
        update_data["is_featured"] = data.is_featured
    if data.status is not None:
        update_data["status"] = data.status.value
    
    await db.partners.update_one({"id": partner_id}, {"$set": update_data})
    
    updated = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    return PartnerResponse(**updated)


@router.delete("/admin/{partner_id}")
async def delete_partner(
    partner_id: str,
    current_user: dict = Depends(require_admin)
):
    """Supprimer un partenaire (admin)"""
    partner = await db.partners.find_one({"id": partner_id})
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    
    await db.partners.delete_one({"id": partner_id})
    
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "delete_partner",
        "details": f"Partenaire supprimé: {partner['name']}",
        "target_id": partner_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Partenaire supprimé"}


# ============================================
# ROUTES MEMBRES
# ============================================

@router.get("/", response_model=PartnerListResponse)
async def get_partners_for_members(
    category: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les partenaires actifs (membres)"""
    filter_query = {"status": PartnerStatus.ACTIVE.value}
    
    if category:
        filter_query["category"] = category
    
    # Tri : featured d'abord, puis par nom
    partners = await db.partners.find(
        filter_query, 
        {"_id": 0}
    ).sort([("is_featured", -1), ("name", 1)]).to_list(100)
    
    return PartnerListResponse(
        partners=[PartnerResponse(**p) for p in partners],
        total=len(partners)
    )


@router.get("/categories")
async def get_partner_categories(
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les catégories avec le nombre de partenaires"""
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.partners.aggregate(pipeline).to_list(20)
    
    category_labels = {
        "hosting": "Hébergement",
        "tools": "Outils & Logiciels",
        "services": "Services",
        "training": "Formation",
        "legal": "Juridique & Comptabilité",
        "marketing": "Marketing",
        "other": "Autre"
    }
    
    categories = [
        {
            "key": r["_id"],
            "label": category_labels.get(r["_id"], r["_id"]),
            "count": r["count"]
        }
        for r in results
    ]
    
    return {"categories": categories}
