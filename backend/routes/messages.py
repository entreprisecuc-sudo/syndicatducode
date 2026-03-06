"""
Routes pour la messagerie des talents
Les visiteurs peuvent contacter les développeurs via leur profil public
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr
import uuid
import logging

from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["Messages"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# MODÈLES PYDANTIC
# ============================================

class MessageCreate(BaseModel):
    """Message envoyé par un visiteur à un développeur"""
    developer_id: str
    sender_name: str
    sender_email: EmailStr
    sender_phone: Optional[str] = None
    subject: str
    content: str
    project_type: Optional[str] = None  # Type de projet (site web, app, etc.)


class MessageResponse(BaseModel):
    """Réponse message (pour les développeurs avec abonnement actif)"""
    id: str
    developer_id: str
    sender_name: str
    sender_email: str
    sender_phone: Optional[str] = None
    subject: str
    content: str
    project_type: Optional[str] = None
    is_read: bool
    created_at: str


class MessagePreview(BaseModel):
    """Aperçu de message (sans contenu - pour abonnement inactif)"""
    id: str
    subject: str
    sender_name: str
    is_read: bool
    created_at: str
    locked: bool = True


class MessagesStats(BaseModel):
    """Statistiques des messages"""
    total: int
    unread: int
    can_read: bool
    reason: Optional[str] = None


# ============================================
# ROUTE PUBLIQUE - ENVOYER UN MESSAGE
# ============================================

@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_message_to_developer(message: MessageCreate):
    """
    Envoyer un message à un développeur (route publique)
    Le développeur doit avoir un abonnement actif pour recevoir des messages
    """
    
    # Vérifier que le développeur existe
    developer = await db.users.find_one({
        "id": message.developer_id,
        "role": "developer",
        "status": "active"
    })
    
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Développeur non trouvé"
        )
    
    # Vérifier que le développeur a un abonnement actif
    subscription = await db.subscriptions.find_one({
        "user_id": message.developer_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce développeur n'accepte pas de messages pour le moment"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    message_id = str(uuid.uuid4())
    
    message_doc = {
        "id": message_id,
        "developer_id": message.developer_id,
        "sender_name": message.sender_name,
        "sender_email": message.sender_email,
        "sender_phone": message.sender_phone,
        "subject": message.subject,
        "content": message.content,
        "project_type": message.project_type,
        "is_read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    
    logger.info(f"Message envoyé au développeur {message.developer_id} par {message.sender_email}")
    
    return {
        "message": "Votre message a bien été envoyé",
        "id": message_id
    }


# ============================================
# ROUTES DÉVELOPPEURS - MES MESSAGES
# ============================================

@router.get("/stats")
async def get_my_messages_stats(current_user: dict = Depends(get_current_user)):
    """
    Récupère les statistiques des messages pour le développeur connecté
    """
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux développeurs"
        )
    
    user_id = current_user.get("sub")
    
    # Compter les messages
    total = await db.messages.count_documents({"developer_id": user_id})
    unread = await db.messages.count_documents({"developer_id": user_id, "is_read": False})
    
    # Vérifier le statut de l'utilisateur
    user = await db.users.find_one({"id": user_id})
    if user.get("status") == "suspended":
        return MessagesStats(
            total=total,
            unread=unread,
            can_read=False,
            reason="Votre compte est suspendu. Contactez l'administrateur."
        )
    
    # Vérifier l'abonnement
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if not subscription:
        return MessagesStats(
            total=total,
            unread=unread,
            can_read=False,
            reason="Votre abonnement n'est pas actif. Souscrivez à un forfait pour lire vos messages."
        )
    
    return MessagesStats(
        total=total,
        unread=unread,
        can_read=True,
        reason=None
    )


@router.get("/my")
async def get_my_messages(current_user: dict = Depends(get_current_user)):
    """
    Récupère les messages du développeur connecté
    - Si abonnement actif : retourne les messages complets
    - Si abonnement inactif ou suspendu : retourne seulement les aperçus (sans contenu)
    """
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux développeurs"
        )
    
    user_id = current_user.get("sub")
    
    # Vérifier le statut de l'utilisateur
    user = await db.users.find_one({"id": user_id})
    is_suspended = user.get("status") == "suspended"
    
    # Vérifier l'abonnement
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    can_read = subscription is not None and not is_suspended
    
    # Récupérer les messages
    messages = await db.messages.find(
        {"developer_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    if can_read:
        # Retourner les messages complets
        return {
            "messages": messages,
            "can_read": True,
            "total": len(messages)
        }
    else:
        # Retourner seulement les aperçus (sans contenu ni email)
        previews = [
            MessagePreview(
                id=msg["id"],
                subject=msg["subject"],
                sender_name=msg["sender_name"],
                is_read=msg["is_read"],
                created_at=msg["created_at"],
                locked=True
            ).model_dump()
            for msg in messages
        ]
        
        reason = "Compte suspendu" if is_suspended else "Abonnement inactif"
        
        return {
            "messages": previews,
            "can_read": False,
            "total": len(previews),
            "reason": reason
        }


@router.get("/my/{message_id}")
async def get_message_detail(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère le détail d'un message spécifique
    Requiert un abonnement actif
    """
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux développeurs"
        )
    
    user_id = current_user.get("sub")
    
    # Vérifier le statut de l'utilisateur
    user = await db.users.find_one({"id": user_id})
    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte est suspendu. Vous ne pouvez pas lire vos messages."
        )
    
    # Vérifier l'abonnement
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre abonnement n'est pas actif. Souscrivez à un forfait pour lire ce message."
        )
    
    # Récupérer le message
    message = await db.messages.find_one(
        {"id": message_id, "developer_id": user_id},
        {"_id": 0}
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message non trouvé"
        )
    
    # Marquer comme lu
    if not message.get("is_read"):
        await db.messages.update_one(
            {"id": message_id},
            {"$set": {"is_read": True}}
        )
        message["is_read"] = True
    
    return message


@router.put("/my/{message_id}/read")
async def mark_message_as_read(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marque un message comme lu (requiert abonnement actif)
    """
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux développeurs"
        )
    
    user_id = current_user.get("sub")
    
    # Vérifier l'abonnement
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Abonnement requis"
        )
    
    result = await db.messages.update_one(
        {"id": message_id, "developer_id": user_id},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message non trouvé"
        )
    
    return {"message": "Message marqué comme lu"}


@router.delete("/my/{message_id}")
async def delete_message(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprime un message (requiert abonnement actif)
    """
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux développeurs"
        )
    
    user_id = current_user.get("sub")
    
    # Vérifier l'abonnement
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Abonnement requis pour gérer vos messages"
        )
    
    result = await db.messages.delete_one(
        {"id": message_id, "developer_id": user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message non trouvé"
        )
    
    return {"message": "Message supprimé"}
