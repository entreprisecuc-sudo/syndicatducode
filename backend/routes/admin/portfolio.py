"""
Routes d'administration - Validation des portfolios
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional
import logging

from middleware.auth import get_current_user, RoleChecker

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin - Portfolio"])

admin_only = RoleChecker(["admin"])

db = None


def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


async def log_admin_action(admin_id: str, action: str, details: str):
    """Enregistre une action administrative"""
    from routes.admin.stats import log_admin_action as log_action
    await log_action(admin_id, action, details)


@router.get("/portfolio/pending", dependencies=[Depends(admin_only)])
async def get_pending_portfolio_projects(
    current_user: dict = Depends(get_current_user)
):
    """Récupère tous les projets de portfolio en attente de validation"""
    projects = await db.portfolio.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
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
    """Récupère tous les projets de portfolio (avec filtre optionnel par statut)"""
    query = {}
    if status:
        query["status"] = status
    
    projects = await db.portfolio.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
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
    """Approuve un projet de portfolio"""
    result = await db.portfolio.update_one(
        {"id": project_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
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
    
    project = await db.portfolio.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    rejection_reason = ""
    if rejection_data and "reason" in rejection_data:
        rejection_reason = rejection_data["reason"]
    
    await db.portfolio.update_one(
        {"id": project_id},
        {"$set": {
            "status": "rejected", 
            "rejection_reason": rejection_reason,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
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
    
    await log_admin_action(
        current_user["sub"],
        "REJECT_PORTFOLIO",
        f"Projet portfolio {project_id} rejeté"
    )
    
    return {"message": "Projet rejeté"}


@router.delete("/portfolio/{project_id}", dependencies=[Depends(admin_only)])
async def delete_portfolio_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprime définitivement un projet de portfolio
    """
    project = await db.portfolio.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    await db.portfolio.delete_one({"id": project_id})
    
    await log_admin_action(
        current_user["sub"],
        "DELETE_PORTFOLIO",
        f"Projet portfolio '{project.get('title', project_id)}' supprimé"
    )
    
    logger.info(f"Admin {current_user['email']} a supprimé le projet portfolio {project_id}")
    
    return {"message": "Projet supprimé définitivement"}
