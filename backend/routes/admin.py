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
    Statistiques globales avancées pour le tableau de bord admin
    """
    # ---- UTILISATEURS ----
    total_users = await db.users.count_documents({})
    commercial_count = await db.users.count_documents({"role": "commercial"})
    developer_count = await db.users.count_documents({"role": "developer"})
    pending_count = await db.users.count_documents({"status": "pending"})
    suspended_count = await db.users.count_documents({"status": "suspended"})
    active_count = await db.users.count_documents({"status": "active"})
    
    # ---- CONTACTS ----
    contacts_total = await db.contacts.count_documents({})
    contacts_pending = await db.contacts.count_documents({"status": "pending"})
    contacts_contacted = await db.contacts.count_documents({"status": "contacted"})
    contacts_converted = await db.contacts.count_documents({"status": "converted"})
    
    # ---- PROJETS ----
    projects_total = await db.projects.count_documents({})
    projects_open = await db.projects.count_documents({"status": "open"})
    projects_closed = await db.projects.count_documents({"status": "closed"})
    projects_in_progress = await db.projects.count_documents({"status": "in_progress"})
    
    # Comptage des candidatures
    candidatures_pipeline = [
        {"$unwind": "$applications"},
        {"$count": "total"}
    ]
    candidatures_result = await db.projects.aggregate(candidatures_pipeline).to_list(1)
    candidatures_total = candidatures_result[0]["total"] if candidatures_result else 0
    
    # ---- ANNONCES ----
    annonces_total = await db.announcements.count_documents({})
    annonces_active = await db.announcements.count_documents({"is_active": True})
    
    # ---- ALERTES ----
    alertes_total = await db.alerts.count_documents({})
    alertes_active = await db.alerts.count_documents({"is_active": True})
    alertes_popup = await db.alerts.count_documents({"type": "popup"})
    alertes_banner = await db.alerts.count_documents({"type": "banner"})
    
    # ---- ABONNEMENTS ----
    plans_total = await db.subscription_plans.count_documents({})
    plans_active = await db.subscription_plans.count_documents({"is_active": True})
    subscriptions_active = await db.user_subscriptions.count_documents({"status": "active"})
    
    # Calcul revenus mensuels estimés (somme des prix des abonnements actifs)
    revenue_pipeline = [
        {"$match": {"status": "active"}},
        {"$lookup": {
            "from": "subscription_plans",
            "localField": "plan_id",
            "foreignField": "id",
            "as": "plan"
        }},
        {"$unwind": "$plan"},
        {"$group": {"_id": None, "total": {"$sum": "$plan.price"}}}
    ]
    revenue_result = await db.user_subscriptions.aggregate(revenue_pipeline).to_list(1)
    monthly_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # ---- PARTENAIRES ----
    partners_total = await db.partners.count_documents({})
    partners_active = await db.partners.count_documents({"is_active": True})
    
    # Partenaires par catégorie
    partners_by_category = await db.partners.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "VIEW_STATS",
        "Consultation des statistiques avancées"
    )
    
    return {
        "users": {
            "total": total_users,
            "commercial": commercial_count,
            "developer": developer_count,
            "pending": pending_count,
            "suspended": suspended_count,
            "active": active_count
        },
        "contacts": {
            "total": contacts_total,
            "pending": contacts_pending,
            "contacted": contacts_contacted,
            "converted": contacts_converted
        },
        "projects": {
            "total": projects_total,
            "open": projects_open,
            "closed": projects_closed,
            "in_progress": projects_in_progress,
            "candidatures": candidatures_total
        },
        "announcements": {
            "total": annonces_total,
            "active": annonces_active
        },
        "alerts": {
            "total": alertes_total,
            "active": alertes_active,
            "popup": alertes_popup,
            "banner": alertes_banner
        },
        "subscriptions": {
            "plans_total": plans_total,
            "plans_active": plans_active,
            "subscriptions_active": subscriptions_active,
            "monthly_revenue": monthly_revenue
        },
        "partners": {
            "total": partners_total,
            "active": partners_active,
            "by_category": {item["_id"]: item["count"] for item in partners_by_category if item["_id"]}
        }
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


# ============================================
# VALIDATION DES PROJETS PORTFOLIO
# ============================================

@router.get("/portfolio/pending", dependencies=[Depends(admin_only)])
async def get_pending_portfolio_projects(
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère tous les projets de portfolio en attente de validation
    """
    # Récupérer les projets en attente
    projects = await db.portfolio.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrichir avec les infos utilisateur
    for project in projects:
        user = await db.users.find_one(
            {"id": project["user_id"]},
            {"_id": 0, "email": 1}
        )
        profile = await db.profiles.find_one(
            {"user_id": project["user_id"]},
            {"_id": 0, "first_name": 1, "last_name": 1}
        )
        project["user_email"] = user.get("email") if user else None
        project["user_name"] = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() if profile else None
    
    return {"projects": projects, "total": len(projects)}


@router.get("/portfolio/all", dependencies=[Depends(admin_only)])
async def get_all_portfolio_projects(
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère tous les projets de portfolio (avec filtre optionnel par statut)
    """
    query = {}
    if status:
        query["status"] = status
    
    projects = await db.portfolio.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
    # Enrichir avec les infos utilisateur
    for project in projects:
        user = await db.users.find_one(
            {"id": project["user_id"]},
            {"_id": 0, "email": 1}
        )
        profile = await db.profiles.find_one(
            {"user_id": project["user_id"]},
            {"_id": 0, "first_name": 1, "last_name": 1}
        )
        project["user_email"] = user.get("email") if user else None
        project["user_name"] = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() if profile else None
    
    return {"projects": projects, "total": len(projects)}


@router.put("/portfolio/{project_id}/approve", dependencies=[Depends(admin_only)])
async def approve_portfolio_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Approuve un projet de portfolio
    """
    result = await db.portfolio.update_one(
        {"id": project_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "APPROVE_PORTFOLIO",
        f"Projet portfolio {project_id} approuvé"
    )
    
    return {"message": "Projet approuvé avec succès"}


@router.put("/portfolio/{project_id}/reject", dependencies=[Depends(admin_only)])
async def reject_portfolio_project(
    project_id: str,
    rejection_data: dict = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Rejette un projet de portfolio avec une raison
    Crée automatiquement une notification pour le développeur
    """
    from routes.notifications import create_notification
    
    # Récupérer le projet pour avoir les infos
    project = await db.portfolio.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Récupérer la raison si fournie
    rejection_reason = ""
    if rejection_data and "reason" in rejection_data:
        rejection_reason = rejection_data["reason"]
    
    # Mettre à jour le projet
    await db.portfolio.update_one(
        {"id": project_id},
        {"$set": {
            "status": "rejected", 
            "rejection_reason": rejection_reason,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Créer une notification pour le développeur
    await create_notification(
        user_id=project["user_id"],
        notification_type="book_rejected",
        title="Projet refusé",
        message=f"Votre projet \"{project['title']}\" a été refusé.\n\nRaison : {rejection_reason}",
        data={
            "project_id": project_id,
            "project_title": project["title"],
            "rejection_reason": rejection_reason
        }
    )
    
    # Log de l'action
    await log_admin_action(
        current_user["sub"],
        "REJECT_PORTFOLIO",
        f"Projet portfolio {project_id} rejeté"
    )
    
    return {"message": "Projet rejeté"}

