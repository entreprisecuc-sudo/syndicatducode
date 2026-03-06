"""
Routes pour la gestion des annonces
Admin : CRUD complet
Membres : Lecture des annonces qui les concernent
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
import uuid
import logging

from models.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    AnnouncementListResponse,
    AnnouncementTarget,
    AnnouncementType
)
from middleware.auth import get_current_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/announcements", tags=["Annonces"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# ROUTES ADMIN
# ============================================

@router.post("/admin", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Créer une nouvelle annonce (admin uniquement)
    """
    now = datetime.now(timezone.utc).isoformat()
    announcement_id = str(uuid.uuid4())
    
    announcement_doc = {
        "id": announcement_id,
        "title": data.title,
        "content": data.content,
        "announcement_type": data.announcement_type.value,
        "target": data.target.value,
        "is_pinned": data.is_pinned,
        "is_published": True,
        "created_at": now,
        "updated_at": now,
        "created_by": current_user.get("sub"),
        "view_count": 0
    }
    
    await db.announcements.insert_one(announcement_doc)
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "create_announcement",
        "details": f"Annonce créée: {data.title}",
        "target_id": announcement_id,
        "created_at": now
    })
    
    logger.info(f"Annonce créée: {data.title} par {current_user.get('email')}")
    
    return AnnouncementResponse(**announcement_doc)


@router.get("/admin", response_model=AnnouncementListResponse)
async def get_all_announcements_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """
    Récupérer toutes les annonces (admin uniquement)
    """
    total = await db.announcements.count_documents({})
    
    announcements = await db.announcements.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return AnnouncementListResponse(
        announcements=[AnnouncementResponse(**a) for a in announcements],
        total=total
    )


@router.get("/admin/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement_admin(
    announcement_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Récupérer une annonce spécifique (admin uniquement)
    """
    announcement = await db.announcements.find_one(
        {"id": announcement_id},
        {"_id": 0}
    )
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annonce non trouvée"
        )
    
    return AnnouncementResponse(**announcement)


@router.put("/admin/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: str,
    data: AnnouncementUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Mettre à jour une annonce (admin uniquement)
    """
    announcement = await db.announcements.find_one({"id": announcement_id})
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annonce non trouvée"
        )
    
    # Construire les mises à jour
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.title is not None:
        update_data["title"] = data.title
    if data.content is not None:
        update_data["content"] = data.content
    if data.announcement_type is not None:
        update_data["announcement_type"] = data.announcement_type.value
    if data.target is not None:
        update_data["target"] = data.target.value
    if data.is_pinned is not None:
        update_data["is_pinned"] = data.is_pinned
    if data.is_published is not None:
        update_data["is_published"] = data.is_published
    
    await db.announcements.update_one(
        {"id": announcement_id},
        {"$set": update_data}
    )
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "update_announcement",
        "details": f"Annonce modifiée: {announcement['title']}",
        "target_id": announcement_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Récupérer l'annonce mise à jour
    updated = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    
    return AnnouncementResponse(**updated)


@router.delete("/admin/{announcement_id}", status_code=status.HTTP_200_OK)
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Supprimer une annonce (admin uniquement)
    """
    announcement = await db.announcements.find_one({"id": announcement_id})
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annonce non trouvée"
        )
    
    await db.announcements.delete_one({"id": announcement_id})
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "delete_announcement",
        "details": f"Annonce supprimée: {announcement['title']}",
        "target_id": announcement_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Annonce supprimée: {announcement['title']} par {current_user.get('email')}")
    
    return {"message": "Annonce supprimée avec succès"}


# ============================================
# ROUTES MEMBRES
# ============================================

@router.get("/", response_model=AnnouncementListResponse)
async def get_announcements_for_member(
    current_user: dict = Depends(get_current_user)
):
    """
    Récupérer les annonces pour le membre connecté
    Filtre par rôle : affiche uniquement les annonces ciblées pour son rôle ou pour tous
    """
    user_role = current_user.get("role")
    
    # Filtre : annonces publiées + (ciblées pour tous OU ciblées pour le rôle de l'utilisateur)
    filter_query = {
        "is_published": True,
        "$or": [
            {"target": AnnouncementTarget.ALL.value},
            {"target": user_role}
        ]
    }
    
    total = await db.announcements.count_documents(filter_query)
    
    # Tri : épinglées d'abord, puis par date de création décroissante
    announcements = await db.announcements.find(
        filter_query,
        {"_id": 0}
    ).sort([("is_pinned", -1), ("created_at", -1)]).to_list(50)
    
    return AnnouncementListResponse(
        announcements=[AnnouncementResponse(**a) for a in announcements],
        total=total
    )


@router.post("/{announcement_id}/view", status_code=status.HTTP_200_OK)
async def mark_announcement_viewed(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Incrémenter le compteur de vues d'une annonce
    """
    result = await db.announcements.update_one(
        {"id": announcement_id, "is_published": True},
        {"$inc": {"view_count": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annonce non trouvée"
        )
    
    return {"message": "Vue enregistrée"}
