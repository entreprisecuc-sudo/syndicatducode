"""
Routes pour la gestion des alertes/popups
Admin : CRUD complet
Membres : Lecture des alertes actives
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
import uuid
import logging

from models.alert import (
    AlertCreate,
    AlertUpdate,
    AlertResponse,
    AlertListResponse,
    AlertTarget,
    AlertType,
    AlertStyle
)
from middleware.auth import get_current_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["Alertes"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# ROUTES ADMIN
# ============================================

@router.post("/admin", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Créer une nouvelle alerte (admin uniquement)
    """
    now = datetime.now(timezone.utc).isoformat()
    alert_id = str(uuid.uuid4())
    
    alert_doc = {
        "id": alert_id,
        "title": data.title,
        "message": data.message,
        "alert_type": data.alert_type.value,
        "style": data.style.value,
        "target": data.target.value,
        "link_url": data.link_url,
        "link_text": data.link_text,
        "dismissible": data.dismissible,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "created_by": current_user.get("sub"),
        "dismiss_count": 0
    }
    
    await db.alerts.insert_one(alert_doc)
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "create_alert",
        "details": f"Alerte créée: {data.title}",
        "target_id": alert_id,
        "created_at": now
    })
    
    logger.info(f"Alerte créée: {data.title} par {current_user.get('email')}")
    
    return AlertResponse(**alert_doc)


@router.get("/admin", response_model=AlertListResponse)
async def get_all_alerts_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """
    Récupérer toutes les alertes (admin uniquement)
    """
    total = await db.alerts.count_documents({})
    
    alerts = await db.alerts.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return AlertListResponse(
        alerts=[AlertResponse(**a) for a in alerts],
        total=total
    )


@router.get("/admin/{alert_id}", response_model=AlertResponse)
async def get_alert_admin(
    alert_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Récupérer une alerte spécifique (admin uniquement)
    """
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerte non trouvée"
        )
    
    return AlertResponse(**alert)


@router.put("/admin/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    data: AlertUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Mettre à jour une alerte (admin uniquement)
    """
    alert = await db.alerts.find_one({"id": alert_id})
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerte non trouvée"
        )
    
    # Construire les mises à jour
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.title is not None:
        update_data["title"] = data.title
    if data.message is not None:
        update_data["message"] = data.message
    if data.alert_type is not None:
        update_data["alert_type"] = data.alert_type.value
    if data.style is not None:
        update_data["style"] = data.style.value
    if data.target is not None:
        update_data["target"] = data.target.value
    if data.link_url is not None:
        update_data["link_url"] = data.link_url
    if data.link_text is not None:
        update_data["link_text"] = data.link_text
    if data.dismissible is not None:
        update_data["dismissible"] = data.dismissible
    if data.is_active is not None:
        update_data["is_active"] = data.is_active
    
    await db.alerts.update_one(
        {"id": alert_id},
        {"$set": update_data}
    )
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "update_alert",
        "details": f"Alerte modifiée: {alert['title']}",
        "target_id": alert_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Récupérer l'alerte mise à jour
    updated = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    
    return AlertResponse(**updated)


@router.delete("/admin/{alert_id}", status_code=status.HTTP_200_OK)
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Supprimer une alerte (admin uniquement)
    """
    alert = await db.alerts.find_one({"id": alert_id})
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerte non trouvée"
        )
    
    await db.alerts.delete_one({"id": alert_id})
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "delete_alert",
        "details": f"Alerte supprimée: {alert['title']}",
        "target_id": alert_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Alerte supprimée: {alert['title']} par {current_user.get('email')}")
    
    return {"message": "Alerte supprimée avec succès"}


# ============================================
# ROUTES MEMBRES
# ============================================

@router.get("/", response_model=AlertListResponse)
async def get_alerts_for_member(
    current_user: dict = Depends(get_current_user)
):
    """
    Récupérer les alertes actives pour le membre connecté
    """
    user_role = current_user.get("role")
    
    # Filtre : alertes actives + ciblées pour le rôle de l'utilisateur
    filter_query = {
        "is_active": True,
        "$or": [
            {"target": AlertTarget.ALL.value},
            {"target": user_role}
        ]
    }
    
    total = await db.alerts.count_documents(filter_query)
    
    alerts = await db.alerts.find(
        filter_query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return AlertListResponse(
        alerts=[AlertResponse(**a) for a in alerts],
        total=total
    )


@router.post("/{alert_id}/dismiss", status_code=status.HTTP_200_OK)
async def dismiss_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marquer une alerte comme vue/fermée par l'utilisateur
    Incrémente le compteur de dismiss
    """
    result = await db.alerts.update_one(
        {"id": alert_id, "is_active": True},
        {"$inc": {"dismiss_count": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerte non trouvée"
        )
    
    return {"message": "Alerte fermée"}
