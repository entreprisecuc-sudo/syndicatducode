"""
Routes pour le profil utilisateur
Gestion des informations de profil et photo
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import logging
import uuid
import os
import base64

from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["Profil"])

# Variable globale pour la base de données
db = None

# Dossier pour stocker les photos de profil
UPLOAD_DIR = "/app/backend/uploads/profiles"

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database
    
    # Créer le dossier d'upload si nécessaire
    os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================
# MODÈLES PYDANTIC
# ============================================

class DeveloperProfileUpdate(BaseModel):
    """Modèle pour la mise à jour du profil développeur"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[str] = None
    skills: Optional[List[str]] = None


class ProfilePhotoUpload(BaseModel):
    """Modèle pour l'upload de photo en base64"""
    image_data: str  # Image en base64
    filename: Optional[str] = None


# ============================================
# ROUTES PROFIL
# ============================================

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Récupère le profil complet de l'utilisateur connecté
    """
    user_id = current_user.get("sub")
    
    # Récupérer le profil depuis la collection profiles
    profile = await db.profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    # Récupérer les infos de base de l'utilisateur
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Fusionner les données
    result = {
        "user": user,
        "profile": profile or {}
    }
    
    return result


@router.put("/me")
async def update_my_profile(
    profile_data: DeveloperProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Met à jour le profil de l'utilisateur connecté
    """
    user_id = current_user.get("sub")
    now = datetime.now(timezone.utc).isoformat()
    
    # Préparer les données de mise à jour (exclure les None)
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_data["updated_at"] = now
    
    # Upsert le profil
    await db.profiles.update_one(
        {"user_id": user_id},
        {
            "$set": update_data,
            "$setOnInsert": {
                "user_id": user_id,
                "created_at": now
            }
        },
        upsert=True
    )
    
    logger.info(f"Profil mis à jour pour user_id: {user_id}")
    
    return {"message": "Profil mis à jour avec succès"}


@router.post("/photo")
async def upload_profile_photo(
    photo_data: ProfilePhotoUpload,
    current_user: dict = Depends(get_current_user)
):
    """
    Upload une photo de profil (base64)
    - Accepte JPG, PNG, WEBP
    - Taille max: 5 Mo
    - Stocke le fichier et met à jour le profil
    """
    user_id = current_user.get("sub")
    
    try:
        # Décoder le base64
        # Supprimer le préfixe data:image/xxx;base64, si présent
        image_data = photo_data.image_data
        if "," in image_data:
            header, image_data = image_data.split(",", 1)
        
        # Décoder
        image_bytes = base64.b64decode(image_data)
        
        # Vérifier la taille (max 5 Mo)
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'image ne doit pas dépasser 5 Mo"
            )
        
        # Détecter le type d'image par les magic bytes
        if image_bytes[:3] == b'\xff\xd8\xff':
            ext = "jpg"
        elif image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            ext = "png"
        elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
            ext = "webp"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format d'image non supporté. Utilisez JPG, PNG ou WEBP."
            )
        
        # Générer un nom de fichier unique
        filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Supprimer l'ancienne photo si elle existe
        profile = await db.profiles.find_one({"user_id": user_id})
        if profile and profile.get("photo_path"):
            old_path = profile["photo_path"]
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Sauvegarder le fichier
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        # Mettre à jour le profil avec le chemin de la photo
        now = datetime.now(timezone.utc).isoformat()
        photo_url = f"/api/profile/photo/{filename}"
        
        await db.profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "photo_path": filepath,
                    "photo_url": photo_url,
                    "updated_at": now
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "created_at": now
                }
            },
            upsert=True
        )
        
        logger.info(f"Photo de profil uploadée pour user_id: {user_id}")
        
        return {
            "message": "Photo uploadée avec succès",
            "photo_url": photo_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur upload photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'upload de la photo"
        )


@router.delete("/photo")
async def delete_profile_photo(current_user: dict = Depends(get_current_user)):
    """
    Supprime la photo de profil de l'utilisateur
    """
    user_id = current_user.get("sub")
    
    # Récupérer le profil
    profile = await db.profiles.find_one({"user_id": user_id})
    
    if not profile or not profile.get("photo_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune photo de profil à supprimer"
        )
    
    # Supprimer le fichier
    if os.path.exists(profile["photo_path"]):
        os.remove(profile["photo_path"])
    
    # Mettre à jour le profil
    now = datetime.now(timezone.utc).isoformat()
    await db.profiles.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "photo_path": None,
                "photo_url": None,
                "updated_at": now
            }
        }
    )
    
    logger.info(f"Photo de profil supprimée pour user_id: {user_id}")
    
    return {"message": "Photo supprimée avec succès"}


@router.get("/photo/{filename}")
async def get_profile_photo(filename: str):
    """
    Sert une photo de profil
    """
    from fastapi.responses import FileResponse
    
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo non trouvée"
        )
    
    # Déterminer le content-type
    if filename.endswith(".jpg") or filename.endswith(".jpeg"):
        media_type = "image/jpeg"
    elif filename.endswith(".png"):
        media_type = "image/png"
    elif filename.endswith(".webp"):
        media_type = "image/webp"
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(filepath, media_type=media_type)


# ============================================
# PORTFOLIO / BOOK
# ============================================

# Dossier pour les images du portfolio
PORTFOLIO_DIR = "/app/backend/uploads/portfolio"
os.makedirs(PORTFOLIO_DIR, exist_ok=True)


class PortfolioProject(BaseModel):
    """Modèle pour un projet du portfolio"""
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None  # URL externe ou chemin local
    image_data: Optional[str] = None  # Image en base64 (pour upload)
    project_url: Optional[str] = None  # Lien vers le projet en ligne
    github_url: Optional[str] = None  # Lien GitHub
    technologies: Optional[List[str]] = None
    year: Optional[str] = None
    is_adult_content: Optional[bool] = False  # Contenu réservé aux +18 ans


class PortfolioProjectUpdate(BaseModel):
    """Modèle pour la mise à jour d'un projet"""
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_data: Optional[str] = None
    project_url: Optional[str] = None
    github_url: Optional[str] = None
    technologies: Optional[List[str]] = None
    year: Optional[str] = None
    is_adult_content: Optional[bool] = None  # Contenu réservé aux +18 ans


@router.get("/portfolio")
async def get_my_portfolio(current_user: dict = Depends(get_current_user)):
    """
    Récupère tous les projets du portfolio de l'utilisateur
    """
    user_id = current_user.get("sub")
    
    projects = await db.portfolio.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"projects": projects}


@router.post("/portfolio")
async def add_portfolio_project(
    project: PortfolioProject,
    current_user: dict = Depends(get_current_user)
):
    """
    Ajoute un nouveau projet au portfolio
    Le projet est en attente de validation par l'admin
    """
    user_id = current_user.get("sub")
    now = datetime.now(timezone.utc).isoformat()
    project_id = str(uuid.uuid4())
    
    # Traiter l'image si fournie en base64
    image_url = project.image_url
    if project.image_data:
        image_url = await _save_portfolio_image(project.image_data, user_id, project_id)
    
    project_doc = {
        "id": project_id,
        "user_id": user_id,
        "title": project.title,
        "description": project.description,
        "image_url": image_url,
        "project_url": project.project_url,
        "github_url": project.github_url,
        "technologies": project.technologies or [],
        "year": project.year,
        "status": "pending",  # En attente de validation admin
        "created_at": now,
        "updated_at": now
    }
    
    await db.portfolio.insert_one(project_doc)
    
    logger.info(f"Projet portfolio ajouté (en attente) pour user_id: {user_id}")
    
    # Retourner sans _id
    if "_id" in project_doc:
        del project_doc["_id"]
    return project_doc


@router.put("/portfolio/{project_id}")
async def update_portfolio_project(
    project_id: str,
    project_data: PortfolioProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Met à jour un projet du portfolio
    """
    user_id = current_user.get("sub")
    
    # Vérifier que le projet appartient à l'utilisateur
    existing = await db.portfolio.find_one({"id": project_id, "user_id": user_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Préparer les données de mise à jour
    update_data = {k: v for k, v in project_data.model_dump().items() if v is not None and k != "image_data"}
    update_data["updated_at"] = now
    
    # Traiter l'image si fournie en base64
    if project_data.image_data:
        # Supprimer l'ancienne image locale si existante
        if existing.get("image_url") and existing["image_url"].startswith("/api/profile/portfolio/"):
            old_filename = existing["image_url"].split("/")[-1]
            old_path = os.path.join(PORTFOLIO_DIR, old_filename)
            if os.path.exists(old_path):
                os.remove(old_path)
        
        update_data["image_url"] = await _save_portfolio_image(project_data.image_data, user_id, project_id)
    
    await db.portfolio.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    logger.info(f"Projet portfolio mis à jour: {project_id}")
    
    return {"message": "Projet mis à jour avec succès"}


@router.delete("/portfolio/{project_id}")
async def delete_portfolio_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprime un projet du portfolio
    """
    user_id = current_user.get("sub")
    
    # Vérifier que le projet appartient à l'utilisateur
    existing = await db.portfolio.find_one({"id": project_id, "user_id": user_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Supprimer l'image locale si existante
    if existing.get("image_url") and existing["image_url"].startswith("/api/profile/portfolio/"):
        filename = existing["image_url"].split("/")[-1]
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    await db.portfolio.delete_one({"id": project_id})
    
    logger.info(f"Projet portfolio supprimé: {project_id}")
    
    return {"message": "Projet supprimé avec succès"}


@router.get("/portfolio/image/{filename}")
async def get_portfolio_image(filename: str):
    """
    Sert une image du portfolio
    """
    from fastapi.responses import FileResponse
    
    filepath = os.path.join(PORTFOLIO_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image non trouvée"
        )
    
    # Déterminer le content-type
    if filename.endswith(".jpg") or filename.endswith(".jpeg"):
        media_type = "image/jpeg"
    elif filename.endswith(".png"):
        media_type = "image/png"
    elif filename.endswith(".webp"):
        media_type = "image/webp"
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(filepath, media_type=media_type)


async def _save_portfolio_image(image_data: str, user_id: str, project_id: str) -> str:
    """
    Sauvegarde une image de portfolio et retourne l'URL
    """
    try:
        # Supprimer le préfixe data:image/xxx;base64, si présent
        if "," in image_data:
            header, image_data = image_data.split(",", 1)
        
        # Décoder
        image_bytes = base64.b64decode(image_data)
        
        # Vérifier la taille (max 5 Mo)
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'image ne doit pas dépasser 5 Mo"
            )
        
        # Détecter le type d'image
        if image_bytes[:3] == b'\xff\xd8\xff':
            ext = "jpg"
        elif image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            ext = "png"
        elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
            ext = "webp"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format d'image non supporté"
            )
        
        # Générer un nom de fichier unique
        filename = f"{user_id}_{project_id}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        
        # Sauvegarder le fichier
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        return f"/api/profile/portfolio/image/{filename}"
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur sauvegarde image portfolio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la sauvegarde de l'image"
        )

