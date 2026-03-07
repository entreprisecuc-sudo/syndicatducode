"""
Routes pour les notifications utilisateurs
Gestion des notifications personnelles (rejets de book, etc.)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid
import logging

from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# MODÈLES PYDANTIC
# ============================================

class NotificationCreate(BaseModel):
    """Modèle pour créer une notification"""
    user_id: str
    type: str  # book_rejected, book_approved, message_received, etc.
    title: str
    message: str
    data: Optional[dict] = None  # Données supplémentaires (project_id, etc.)


# ============================================
# FONCTIONS UTILITAIRES
# ============================================

async def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None
):
    """
    Crée une notification pour un utilisateur
    Utilisée par d'autres modules (admin, etc.)
    """
    now = datetime.now(timezone.utc).isoformat()
    notification_id = str(uuid.uuid4())
    
    notification_doc = {
        "id": notification_id,
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "is_read": False,
        "show_popup": True,  # Afficher en popup à la prochaine connexion
        "created_at": now
    }
    
    await db.notifications.insert_one(notification_doc)
    logger.info(f"Notification créée pour user_id: {user_id}, type: {notification_type}")
    
    return notification_id


# ============================================
# ROUTES
# ============================================

@router.get("/unread")
async def get_unread_notifications(current_user: dict = Depends(get_current_user)):
    """
    Récupère les notifications non lues de l'utilisateur
    """
    user_id = current_user.get("sub")
    
    notifications = await db.notifications.find(
        {"user_id": user_id, "is_read": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"notifications": notifications, "count": len(notifications)}


@router.get("/popup")
async def get_popup_notifications(current_user: dict = Depends(get_current_user)):
    """
    Récupère les notifications à afficher en popup (non encore vues)
    """
    user_id = current_user.get("sub")
    
    notifications = await db.notifications.find(
        {"user_id": user_id, "show_popup": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    return {"notifications": notifications, "count": len(notifications)}


@router.put("/popup/{notification_id}/dismiss")
async def dismiss_popup(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marque une notification comme vue (ne plus afficher en popup)
    """
    user_id = current_user.get("sub")
    
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"show_popup": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    return {"message": "Notification fermée"}


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marque une notification comme lue
    """
    user_id = current_user.get("sub")
    
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True, "show_popup": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    return {"message": "Notification marquée comme lue"}


@router.put("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """
    Marque toutes les notifications comme lues
    """
    user_id = current_user.get("sub")
    
    result = await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True, "show_popup": False}}
    )
    
    return {"message": f"{result.modified_count} notification(s) marquée(s) comme lue(s)"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprime une notification
    """
    user_id = current_user.get("sub")
    
    result = await db.notifications.delete_one(
        {"id": notification_id, "user_id": user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    return {"message": "Notification supprimée"}
