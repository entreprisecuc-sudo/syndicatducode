"""
Routes d'administration
Gestion des utilisateurs et supervision
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
import logging

from middleware.auth import get_current_user, RoleChecker
from config.settings import UserStatus, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administration"])

# Middleware pour vérifier le rôle admin
admin_only = RoleChecker(["admin"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# GESTION DES UTILISATEURS
# ============================================

@router.get("/users", dependencies=[Depends(admin_only)])
async def get_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Liste tous les utilisateurs
    Filtrable par rôle, statut et recherche
    """
    # Construction du filtre
    query = {}
    
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    # Récupération sans le mot de passe
    users = await db.users.find(
        query, 
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "VIEW_USERS",
        f"Consultation liste utilisateurs (filtres: role={role}, status={status})"
    )
    
    return {
        "total": len(users),
        "users": users
    }


@router.get("/users/{user_id}", dependencies=[Depends(admin_only)])
async def get_user_details(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Détails d'un utilisateur spécifique
    """
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "VIEW_USER_DETAIL",
        f"Consultation profil utilisateur: {user['email']}"
    )
    
    return user


@router.put("/users/{user_id}/status", dependencies=[Depends(admin_only)])
async def update_user_status(
    user_id: str,
    new_status: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Modifier le statut d'un utilisateur (activer/suspendre)
    """
    if new_status not in [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Statut invalide"
        )
    
    # Vérifier que l'utilisateur existe
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Empêcher de modifier son propre statut
    if user_id == current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre statut"
        )
    
    # Mise à jour
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": new_status, "updated_at": now}}
    )
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "UPDATE_USER_STATUS",
        f"Statut de {user['email']} changé en: {new_status}"
    )
    
    logger.info(f"Admin {current_user['email']} a changé le statut de {user['email']} en {new_status}")
    
    return {"message": f"Statut mis à jour: {new_status}"}


@router.put("/users/{user_id}/role", dependencies=[Depends(admin_only)])
async def update_user_role(
    user_id: str,
    new_role: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Modifier le rôle d'un utilisateur
    Seul un admin peut faire cette action
    """
    allowed_roles = [UserRole.COMMERCIAL, UserRole.DEVELOPER, UserRole.ADMIN]
    if new_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide. Choix possibles: {', '.join(allowed_roles)}"
        )
    
    # Vérifier que l'utilisateur existe
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Empêcher de modifier son propre rôle
    if user_id == current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre rôle"
        )
    
    # Mise à jour
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "role": new_role,
        "updated_at": now,
        "first_login": False
    }
    
    # Si on attribue un rôle, on active le compte
    if new_role and user.get("status") == UserStatus.PENDING:
        update_data["status"] = UserStatus.ACTIVE
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "UPDATE_USER_ROLE",
        f"Rôle de {user['email']} changé en: {new_role}"
    )
    
    logger.info(f"Admin {current_user['email']} a changé le rôle de {user['email']} en {new_role}")
    
    return {"message": f"Rôle mis à jour: {new_role}"}


# ============================================
# STATISTIQUES
# ============================================

@router.get("/stats", dependencies=[Depends(admin_only)])
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """
    Statistiques globales pour le tableau de bord admin
    """
    # Comptage des utilisateurs par rôle
    total_users = await db.users.count_documents({})
    commercial_count = await db.users.count_documents({"role": "commercial"})
    developer_count = await db.users.count_documents({"role": "developer"})
    pending_count = await db.users.count_documents({"status": "pending"})
    suspended_count = await db.users.count_documents({"status": "suspended"})
    
    # Comptage des contacts
    contacts_count = await db.contacts.count_documents({})
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "VIEW_STATS",
        "Consultation des statistiques"
    )
    
    return {
        "users": {
            "total": total_users,
            "commercial": commercial_count,
            "developer": developer_count,
            "pending": pending_count,
            "suspended": suspended_count
        },
        "contacts": contacts_count
    }


# ============================================
# LOGS D'ADMINISTRATION
# ============================================

@router.get("/logs", dependencies=[Depends(admin_only)])
async def get_admin_logs(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère les logs d'actions administratives
    """
    logs = await db.admin_logs.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"logs": logs}


async def log_admin_action(admin_id: str, action: str, details: str):
    """
    Enregistre une action administrative
    """
    log_entry = {
        "admin_id": admin_id,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_logs.insert_one(log_entry)


# ============================================
# DEMANDES DE CONTACT
# ============================================

@router.get("/contacts", dependencies=[Depends(admin_only)])
async def get_all_contacts(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Liste toutes les demandes de contact
    """
    query = {}
    if status:
        query["status"] = status
    
    contacts = await db.contacts.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    return {
        "total": len(contacts),
        "contacts": contacts
    }


@router.put("/contacts/{contact_id}/status", dependencies=[Depends(admin_only)])
async def update_contact_status(
    contact_id: str,
    new_status: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mettre à jour le statut d'une demande de contact
    """
    valid_statuses = ["pending", "contacted", "converted", "archived"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Statut invalide. Choix: {', '.join(valid_statuses)}"
        )
    
    result = await db.contacts.update_one(
        {"id": contact_id},
        {"$set": {"status": new_status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact non trouvé"
        )
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "UPDATE_CONTACT_STATUS",
        f"Contact {contact_id} statut changé en: {new_status}"
    )
    
    return {"message": f"Statut mis à jour: {new_status}"}
