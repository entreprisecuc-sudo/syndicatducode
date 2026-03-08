"""
Routes d'administration - Gestion des utilisateurs
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timezone
from typing import Optional
import logging
import re

from middleware.auth import get_current_user, RoleChecker
from config.settings import UserStatus, UserRole
from services.auth_service import hash_password, generate_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin - Users"])


class CreateAdminRequest(BaseModel):
    """Modèle pour créer un administrateur"""
    email: EmailStr
    password: str
    
    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Le mot de passe doit contenir au moins une majuscule")
        if not re.search(r"[a-z]", v):
            raise ValueError("Le mot de passe doit contenir au moins une minuscule")
        if not re.search(r"\d", v):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")
        return v

# Middleware pour vérifier le rôle admin
admin_only = RoleChecker(["admin"])

# Variable globale pour la base de données
db = None


def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


async def log_admin_action(admin_id: str, action: str, details: str):
    """Enregistre une action administrative"""
    from routes.admin.stats import log_admin_action as log_action
    await log_action(admin_id, action, details)


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
    query = {}
    
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(
        query, 
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).to_list(500)
    
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
    """Détails d'un utilisateur spécifique"""
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
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
    """Modifier le statut d'un utilisateur (activer/suspendre)"""
    if new_status not in [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Statut invalide"
        )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    if user_id == current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre statut"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": new_status, "updated_at": now}}
    )
    
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
    """Modifier le rôle d'un utilisateur"""
    allowed_roles = [UserRole.COMMERCIAL, UserRole.DEVELOPER, UserRole.ADMIN]
    if new_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide. Choix possibles: {', '.join(allowed_roles)}"
        )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    if user_id == current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre rôle"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "role": new_role,
        "updated_at": now,
        "first_login": False
    }
    
    if new_role and user.get("status") == UserStatus.PENDING:
        update_data["status"] = UserStatus.ACTIVE
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    await log_admin_action(
        current_user["sub"],
        "UPDATE_USER_ROLE",
        f"Rôle de {user['email']} changé en: {new_role}"
    )
    
    logger.info(f"Admin {current_user['email']} a changé le rôle de {user['email']} en {new_role}")
    
    return {"message": f"Rôle mis à jour: {new_role}"}


@router.post("/users/create-admin", dependencies=[Depends(admin_only)])
async def create_admin(
    data: CreateAdminRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Créer un nouvel administrateur
    Seuls les admins existants peuvent créer de nouveaux admins
    """
    # Vérifier si l'email existe déjà
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email"
        )
    
    # Créer l'utilisateur admin
    now = datetime.now(timezone.utc).isoformat()
    user_id = generate_user_id()
    
    user_doc = {
        "id": user_id,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "role": UserRole.ADMIN,
        "status": UserStatus.ACTIVE,
        "created_at": now,
        "updated_at": now,
        "first_login": False
    }
    
    await db.users.insert_one(user_doc)
    
    await log_admin_action(
        current_user["sub"],
        "CREATE_ADMIN",
        f"Nouvel administrateur créé: {data.email}"
    )
    
    logger.info(f"Admin {current_user['email']} a créé un nouvel admin: {data.email}")
    
    return {
        "message": "Administrateur créé avec succès",
        "user": {
            "id": user_id,
            "email": data.email.lower(),
            "role": UserRole.ADMIN,
            "status": UserStatus.ACTIVE
        }
    }


@router.put("/users/{user_id}/suspend", dependencies=[Depends(admin_only)])
async def suspend_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Suspendre un membre (développeur ou commercial)
    Le membre ne pourra plus accéder à son espace
    """
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Ne pas permettre de suspendre un admin
    if user.get("role") == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Impossible de suspendre un administrateur"
        )
    
    # Vérifier si déjà suspendu
    if user.get("status") == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur est déjà suspendu"
        )
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "status": UserStatus.SUSPENDED,
            "suspended_at": datetime.now(timezone.utc).isoformat(),
            "suspended_by": current_user["sub"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_admin_action(
        current_user["sub"],
        "SUSPEND_USER",
        f"Utilisateur {user['email']} suspendu"
    )
    
    logger.info(f"Admin {current_user['email']} a suspendu l'utilisateur {user['email']}")
    
    return {"message": f"Utilisateur {user['email']} suspendu avec succès"}


@router.put("/users/{user_id}/reactivate", dependencies=[Depends(admin_only)])
async def reactivate_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Réactiver un membre suspendu
    """
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Vérifier si pas suspendu
    if user.get("status") != UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur n'est pas suspendu"
        )
    
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "status": UserStatus.ACTIVE,
                "reactivated_at": datetime.now(timezone.utc).isoformat(),
                "reactivated_by": current_user["sub"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {
                "suspended_at": "",
                "suspended_by": ""
            }
        }
    )
    
    await log_admin_action(
        current_user["sub"],
        "REACTIVATE_USER",
        f"Utilisateur {user['email']} réactivé"
    )
    
    logger.info(f"Admin {current_user['email']} a réactivé l'utilisateur {user['email']}")
    
    return {"message": f"Utilisateur {user['email']} réactivé avec succès"}


@router.get("/users/{user_id}/full", dependencies=[Depends(admin_only)])
async def get_user_full_details(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère toutes les informations d'un utilisateur :
    - Infos de base, Profil, Portfolio/Book, Abonnement, Messages, Historique
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
    
    profile = await db.profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    portfolio = await db.portfolio.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    subscription = await db.user_subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    plan_details = None
    if subscription:
        plan_details = await db.subscription_plans.find_one(
            {"id": subscription.get("plan_id")},
            {"_id": 0}
        )
    
    messages_received = []
    if user.get("role") == "developer":
        messages_received = await db.messages.find(
            {"developer_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
    
    candidatures = []
    projects_with_applications = await db.projects.find(
        {"applications.user_id": user_id},
        {"_id": 0, "id": 1, "title": 1, "applications": 1}
    ).to_list(50)
    for project in projects_with_applications:
        for app in project.get("applications", []):
            if app.get("user_id") == user_id:
                candidatures.append({
                    "project_id": project["id"],
                    "project_title": project["title"],
                    "application": app
                })
    
    notifications = await db.notifications.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    await log_admin_action(
        current_user["sub"],
        "VIEW_USER_FULL_DETAIL",
        f"Consultation détail complet utilisateur: {user['email']}"
    )
    
    return {
        "user": user,
        "profile": profile,
        "portfolio": portfolio,
        "subscription": {
            "active": subscription,
            "plan": plan_details
        },
        "messages": messages_received,
        "candidatures": candidatures,
        "notifications": notifications
    }


@router.get("/users/{user_id}/activity", dependencies=[Depends(admin_only)])
async def get_user_activity(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Récupère l'historique d'activité d'un utilisateur"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    activity = []
    
    user_full = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_full.get("created_at"):
        activity.append({
            "type": "account_created",
            "label": "Création du compte",
            "date": user_full["created_at"],
            "details": f"Email: {user_full['email']}"
        })
    
    if user_full.get("role"):
        activity.append({
            "type": "role_assigned",
            "label": "Rôle assigné",
            "date": user_full.get("updated_at", user_full.get("created_at")),
            "details": f"Rôle: {user_full['role']}"
        })
    
    portfolio_projects = await db.portfolio.find(
        {"user_id": user_id},
        {"_id": 0, "title": 1, "status": 1, "created_at": 1}
    ).to_list(100)
    for project in portfolio_projects:
        activity.append({
            "type": "portfolio_created",
            "label": f"Projet portfolio ajouté: {project['title']}",
            "date": project.get("created_at"),
            "details": f"Statut: {project.get('status', 'pending')}"
        })
    
    projects_with_applications = await db.projects.find(
        {"applications.user_id": user_id},
        {"_id": 0, "title": 1, "applications": 1}
    ).to_list(50)
    for project in projects_with_applications:
        for app in project.get("applications", []):
            if app.get("user_id") == user_id:
                activity.append({
                    "type": "application_submitted",
                    "label": f"Candidature soumise: {project['title']}",
                    "date": app.get("applied_at"),
                    "details": f"Statut: {app.get('status', 'pending')}"
                })
    
    subscriptions = await db.user_subscriptions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(50)
    for sub in subscriptions:
        activity.append({
            "type": "subscription",
            "label": f"Abonnement: {sub.get('plan_id')}",
            "date": sub.get("created_at"),
            "details": f"Statut: {sub.get('status', 'active')}"
        })
    
    messages = await db.messages.find(
        {"developer_id": user_id},
        {"_id": 0, "sender_name": 1, "subject": 1, "created_at": 1}
    ).to_list(50)
    for msg in messages:
        activity.append({
            "type": "message_received",
            "label": f"Message reçu de {msg.get('sender_name')}",
            "date": msg.get("created_at"),
            "details": msg.get("subject", "Sans sujet")
        })
    
    activity.sort(key=lambda x: x.get("date") or "", reverse=True)
    
    return {"activity": activity}
