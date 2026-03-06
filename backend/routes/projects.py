"""
Routes de gestion des projets
CRUD Admin + Consultation développeurs + Candidatures
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
import logging

from middleware.auth import get_current_user, RoleChecker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Projets"])

# Middleware admin
admin_only = RoleChecker(["admin"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# MODÈLES
# ============================================

class ProjectCreate(BaseModel):
    """Modèle pour créer un projet"""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    technologies: List[str] = []
    budget: Optional[str] = None  # "5000-10000€", "À définir", etc.
    collaboration_type: str = Field(..., pattern="^(freelance|support|partnership)$")
    

class ProjectUpdate(BaseModel):
    """Modèle pour mettre à jour un projet"""
    title: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[List[str]] = None
    budget: Optional[str] = None
    collaboration_type: Optional[str] = None
    status: Optional[str] = None  # open, in_progress, closed


class ProjectApplicationCreate(BaseModel):
    """Modèle pour postuler à un projet"""
    message: str = Field(..., min_length=10, max_length=2000)


# ============================================
# ROUTES ADMIN
# ============================================

@router.get("/admin/list", dependencies=[Depends(admin_only)])
async def admin_get_all_projects(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Liste tous les projets (admin)
    """
    query = {}
    if status:
        query["status"] = status
    
    projects = await db.projects.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Compter les candidatures pour chaque projet
    for project in projects:
        applications_count = await db.project_applications.count_documents({
            "project_id": project["id"]
        })
        project["applications_count"] = applications_count
    
    return {
        "total": len(projects),
        "projects": projects
    }


@router.post("/admin/create", dependencies=[Depends(admin_only)])
async def admin_create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Créer un nouveau projet (admin)
    """
    now = datetime.now(timezone.utc).isoformat()
    project_id = str(uuid.uuid4())
    
    project_doc = {
        "id": project_id,
        "title": project_data.title,
        "description": project_data.description,
        "technologies": project_data.technologies,
        "budget": project_data.budget,
        "collaboration_type": project_data.collaboration_type,
        "status": "open",
        "created_by": current_user["sub"],
        "created_at": now,
        "updated_at": now,
        "published_at": now
    }
    
    await db.projects.insert_one(project_doc)
    
    # Log admin
    await db.admin_logs.insert_one({
        "admin_id": current_user["sub"],
        "action": "CREATE_PROJECT",
        "details": f"Projet créé: {project_data.title}",
        "timestamp": now
    })
    
    logger.info(f"Projet créé: {project_data.title} par {current_user['email']}")
    
    return {"message": "Projet créé avec succès", "id": project_id}


@router.get("/admin/{project_id}", dependencies=[Depends(admin_only)])
async def admin_get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Détail d'un projet avec ses candidatures (admin)
    """
    project = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Récupérer les candidatures
    applications = await db.project_applications.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrichir avec les infos utilisateur
    for app in applications:
        user = await db.users.find_one(
            {"id": app["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        app["user"] = user
    
    project["applications"] = applications
    
    return project


@router.put("/admin/{project_id}", dependencies=[Depends(admin_only)])
async def admin_update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Mettre à jour un projet (admin)
    """
    project = await db.projects.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Construire les champs à mettre à jour
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if project_data.title is not None:
        update_data["title"] = project_data.title
    if project_data.description is not None:
        update_data["description"] = project_data.description
    if project_data.technologies is not None:
        update_data["technologies"] = project_data.technologies
    if project_data.budget is not None:
        update_data["budget"] = project_data.budget
    if project_data.collaboration_type is not None:
        update_data["collaboration_type"] = project_data.collaboration_type
    if project_data.status is not None:
        if project_data.status not in ["open", "in_progress", "closed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Statut invalide"
            )
        update_data["status"] = project_data.status
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    # Log admin
    await db.admin_logs.insert_one({
        "admin_id": current_user["sub"],
        "action": "UPDATE_PROJECT",
        "details": f"Projet modifié: {project['title']}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Projet mis à jour avec succès"}


@router.delete("/admin/{project_id}", dependencies=[Depends(admin_only)])
async def admin_delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprimer un projet (admin)
    """
    project = await db.projects.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Supprimer le projet et ses candidatures
    await db.projects.delete_one({"id": project_id})
    await db.project_applications.delete_many({"project_id": project_id})
    
    # Log admin
    await db.admin_logs.insert_one({
        "admin_id": current_user["sub"],
        "action": "DELETE_PROJECT",
        "details": f"Projet supprimé: {project['title']}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Projet supprimé avec succès"}


@router.put("/admin/applications/{application_id}/status", dependencies=[Depends(admin_only)])
async def admin_update_application_status(
    application_id: str,
    new_status: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mettre à jour le statut d'une candidature (admin)
    """
    valid_statuses = ["pending", "reviewed", "accepted", "rejected"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Statut invalide. Choix: {', '.join(valid_statuses)}"
        )
    
    result = await db.project_applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidature non trouvée"
        )
    
    return {"message": f"Statut mis à jour: {new_status}"}


# ============================================
# ROUTES DÉVELOPPEURS
# ============================================

@router.get("/")
async def get_open_projects(current_user: dict = Depends(get_current_user)):
    """
    Liste les projets ouverts (pour les développeurs)
    """
    # Seuls les projets ouverts sont visibles
    projects = await db.projects.find(
        {"status": "open"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Vérifier si l'utilisateur a déjà postulé
    for project in projects:
        existing = await db.project_applications.find_one({
            "project_id": project["id"],
            "user_id": current_user["sub"]
        })
        project["has_applied"] = existing is not None
    
    return {
        "total": len(projects),
        "projects": projects
    }


@router.get("/{project_id}")
async def get_project_detail(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Détail d'un projet (pour les développeurs)
    """
    project = await db.projects.find_one(
        {"id": project_id, "status": "open"},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé ou non disponible"
        )
    
    # Vérifier si l'utilisateur a déjà postulé
    existing = await db.project_applications.find_one({
        "project_id": project_id,
        "user_id": current_user["sub"]
    })
    project["has_applied"] = existing is not None
    
    if existing:
        project["application_status"] = existing.get("status", "pending")
    
    return project


@router.post("/{project_id}/apply")
async def apply_to_project(
    project_id: str,
    application: ProjectApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Postuler à un projet (développeurs uniquement)
    """
    # Vérifier que c'est un développeur
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les développeurs peuvent postuler aux projets"
        )
    
    # Vérifier que le projet existe et est ouvert
    project = await db.projects.find_one({"id": project_id, "status": "open"})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé ou fermé aux candidatures"
        )
    
    # Vérifier qu'il n'a pas déjà postulé
    existing = await db.project_applications.find_one({
        "project_id": project_id,
        "user_id": current_user["sub"]
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous avez déjà postulé à ce projet"
        )
    
    # Créer la candidature
    now = datetime.now(timezone.utc).isoformat()
    application_id = str(uuid.uuid4())
    
    application_doc = {
        "id": application_id,
        "project_id": project_id,
        "user_id": current_user["sub"],
        "user_email": current_user["email"],
        "message": application.message,
        "status": "pending",
        "created_at": now,
        "updated_at": now
    }
    
    await db.project_applications.insert_one(application_doc)
    
    # Créer une notification pour l'admin
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "type": "project_application",
        "title": f"Nouvelle candidature: {project['title']}",
        "message": f"{current_user['email']} a postulé au projet",
        "data": {
            "project_id": project_id,
            "application_id": application_id,
            "user_email": current_user["email"]
        },
        "read": False,
        "created_at": now
    })
    
    logger.info(f"Candidature de {current_user['email']} pour le projet {project['title']}")
    
    return {"message": "Candidature envoyée avec succès", "id": application_id}


@router.get("/my/applications")
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    """
    Liste mes candidatures (développeur)
    """
    applications = await db.project_applications.find(
        {"user_id": current_user["sub"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Enrichir avec les infos du projet
    for app in applications:
        project = await db.projects.find_one(
            {"id": app["project_id"]},
            {"_id": 0, "title": 1, "status": 1, "collaboration_type": 1}
        )
        app["project"] = project
    
    return {
        "total": len(applications),
        "applications": applications
    }
