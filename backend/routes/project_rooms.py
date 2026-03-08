"""
Routes de gestion des espaces de projet collaboratifs
Salons de discussion, notes de projet, gestion des membres
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
import logging

from middleware.auth import get_current_user, RoleChecker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/project-rooms", tags=["Espaces Projet"])

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

class ProjectRoomCreate(BaseModel):
    """Modèle pour créer un espace projet"""
    project_id: str
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None


class ProjectNoteCreate(BaseModel):
    """Modèle pour créer une note de projet"""
    content: str = Field(..., min_length=1)
    is_pinned: bool = False


class ProjectNoteUpdate(BaseModel):
    """Modèle pour mettre à jour une note"""
    content: Optional[str] = None
    is_pinned: Optional[bool] = None


class ProjectMessageCreate(BaseModel):
    """Modèle pour envoyer un message dans le salon"""
    content: str = Field(..., min_length=1, max_length=5000)


class AddMemberRequest(BaseModel):
    """Modèle pour ajouter un membre"""
    user_id: str
    role: str = "member"  # admin, member


# ============================================
# FONCTIONS UTILITAIRES
# ============================================

async def get_room_or_404(room_id: str):
    """Récupère un espace projet ou lève une erreur 404"""
    room = await db.project_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espace projet non trouvé"
        )
    return room


async def check_room_member(room_id: str, user_id: str):
    """Vérifie si l'utilisateur est membre de l'espace"""
    room = await get_room_or_404(room_id)
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas membre de cet espace projet"
        )
    return room


async def get_user_info(user_id: str):
    """Récupère les informations basiques d'un utilisateur"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        return None
    
    # Récupérer le profil
    profile = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "id": user_id,
        "email": user.get("email"),
        "first_name": profile.get("first_name") if profile else None,
        "last_name": profile.get("last_name") if profile else None,
        "photo_url": profile.get("photo_url") if profile else None,
        "role": user.get("role")
    }


# ============================================
# CRÉATION AUTOMATIQUE D'UN ESPACE PROJET
# ============================================

async def create_project_room_for_application(project_id: str, developer_id: str):
    """
    Crée automatiquement un espace projet quand une candidature est acceptée
    Appelé depuis la route d'acceptation de candidature
    """
    # Récupérer le projet
    project = await db.projects.find_one({"id": project_id})
    if not project:
        return None
    
    # Vérifier si un espace existe déjà pour ce projet
    existing_room = await db.project_rooms.find_one({"project_id": project_id})
    
    if existing_room:
        # Ajouter le développeur s'il n'est pas déjà membre
        member_ids = [m["user_id"] for m in existing_room.get("members", [])]
        if developer_id not in member_ids:
            await db.project_rooms.update_one(
                {"id": existing_room["id"]},
                {"$push": {"members": {
                    "user_id": developer_id,
                    "role": "member",
                    "joined_at": datetime.now(timezone.utc).isoformat()
                }}}
            )
        return existing_room["id"]
    
    # Créer un nouvel espace projet
    room_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    room = {
        "id": room_id,
        "project_id": project_id,
        "name": project.get("title", "Nouveau projet"),
        "description": project.get("description", ""),
        "status": "active",
        "members": [
            {
                "user_id": developer_id,
                "role": "member",
                "joined_at": now
            }
        ],
        "created_at": now,
        "updated_at": now
    }
    
    await db.project_rooms.insert_one(room)
    
    # Créer une note de bienvenue
    welcome_note = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "content": f"🎉 Bienvenue dans l'espace projet \"{project.get('title')}\" !\n\nUtilisez cette zone pour les informations importantes du projet.",
        "is_pinned": True,
        "created_by": "system",
        "created_at": now
    }
    await db.project_notes.insert_one(welcome_note)
    
    logger.info(f"Espace projet créé pour le projet {project_id}")
    
    return room_id


# ============================================
# ROUTES - LISTE DES ESPACES
# ============================================

@router.get("/my-rooms")
async def get_my_project_rooms(current_user: dict = Depends(get_current_user)):
    """
    Liste les espaces projets où l'utilisateur est membre
    """
    user_id = current_user["sub"]
    
    # Trouver les espaces où l'utilisateur est membre
    rooms = await db.project_rooms.find(
        {"members.user_id": user_id, "status": "active"},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(50)
    
    # Enrichir avec les infos du projet et le nombre de messages non lus
    for room in rooms:
        project = await db.projects.find_one(
            {"id": room.get("project_id")},
            {"_id": 0, "id": 1, "title": 1, "status": 1, "technologies": 1}
        )
        room["project"] = project
        
        # Compter les messages récents (dernières 24h)
        recent_count = await db.project_messages.count_documents({
            "room_id": room["id"],
            "created_at": {"$gte": (datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)).isoformat()}
        })
        room["recent_messages"] = recent_count
        
        # Nombre total de membres
        room["members_count"] = len(room.get("members", []))
    
    return {"rooms": rooms}


@router.get("/admin/list", dependencies=[Depends(admin_only)])
async def admin_get_all_rooms(current_user: dict = Depends(get_current_user)):
    """
    Liste tous les espaces projets (admin)
    """
    rooms = await db.project_rooms.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for room in rooms:
        project = await db.projects.find_one(
            {"id": room.get("project_id")},
            {"_id": 0, "id": 1, "title": 1}
        )
        room["project"] = project
        room["members_count"] = len(room.get("members", []))
    
    return {"rooms": rooms}


# ============================================
# ROUTES - DÉTAIL D'UN ESPACE
# ============================================

@router.get("/{room_id}")
async def get_project_room(
    room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère les détails d'un espace projet
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    room = await get_room_or_404(room_id)
    
    # Vérifier l'accès (membre ou admin)
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    # Enrichir les membres avec leurs infos
    enriched_members = []
    for member in room.get("members", []):
        user_info = await get_user_info(member["user_id"])
        if user_info:
            enriched_members.append({
                **member,
                **user_info
            })
    
    room["members"] = enriched_members
    
    # Infos du projet
    project = await db.projects.find_one(
        {"id": room.get("project_id")},
        {"_id": 0}
    )
    room["project"] = project
    
    # Supprimer _id si présent
    room.pop("_id", None)
    
    return room


# ============================================
# ROUTES - GESTION DES MEMBRES
# ============================================

@router.post("/{room_id}/members", dependencies=[Depends(admin_only)])
async def add_member_to_room(
    room_id: str,
    data: AddMemberRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Ajouter un membre à l'espace projet (admin)
    """
    room = await get_room_or_404(room_id)
    
    # Vérifier que l'utilisateur existe
    user = await db.users.find_one({"id": data.user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Vérifier s'il n'est pas déjà membre
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if data.user_id in member_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet utilisateur est déjà membre"
        )
    
    # Ajouter le membre
    await db.project_rooms.update_one(
        {"id": room_id},
        {
            "$push": {"members": {
                "user_id": data.user_id,
                "role": data.role,
                "joined_at": datetime.now(timezone.utc).isoformat()
            }},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    logger.info(f"Membre {data.user_id} ajouté à l'espace {room_id}")
    
    return {"message": "Membre ajouté avec succès"}


@router.delete("/{room_id}/members/{user_id}", dependencies=[Depends(admin_only)])
async def remove_member_from_room(
    room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retirer un membre de l'espace projet (admin)
    """
    room = await get_room_or_404(room_id)
    
    # Vérifier qu'il est bien membre
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cet utilisateur n'est pas membre"
        )
    
    # Retirer le membre
    await db.project_rooms.update_one(
        {"id": room_id},
        {
            "$pull": {"members": {"user_id": user_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Membre retiré avec succès"}


# ============================================
# ROUTES - NOTES DE PROJET
# ============================================

@router.get("/{room_id}/notes")
async def get_project_notes(
    room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Liste les notes d'un espace projet
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    room = await get_room_or_404(room_id)
    
    # Vérifier l'accès
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    # Récupérer les notes (pinned en premier)
    notes = await db.project_notes.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("created_at", -1)]).to_list(100)
    
    # Enrichir avec les infos de l'auteur
    for note in notes:
        if note.get("created_by") and note["created_by"] != "system":
            author = await get_user_info(note["created_by"])
            note["author"] = author
    
    return {"notes": notes}


@router.post("/{room_id}/notes")
async def create_project_note(
    room_id: str,
    data: ProjectNoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Créer une note dans l'espace projet
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    room = await get_room_or_404(room_id)
    
    # Vérifier l'accès
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    note = {
        "id": note_id,
        "room_id": room_id,
        "content": data.content,
        "is_pinned": data.is_pinned,
        "created_by": user_id,
        "created_at": now,
        "updated_at": now
    }
    
    await db.project_notes.insert_one(note)
    
    # Mettre à jour le timestamp de l'espace
    await db.project_rooms.update_one(
        {"id": room_id},
        {"$set": {"updated_at": now}}
    )
    
    return {"message": "Note créée", "note_id": note_id}


@router.put("/{room_id}/notes/{note_id}")
async def update_project_note(
    room_id: str,
    note_id: str,
    data: ProjectNoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Modifier une note (auteur ou admin)
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    note = await db.project_notes.find_one({"id": note_id, "room_id": room_id})
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note non trouvée"
        )
    
    # Vérifier les droits (auteur ou admin)
    if note.get("created_by") != user_id and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non autorisé"
        )
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.content is not None:
        update_data["content"] = data.content
    if data.is_pinned is not None:
        update_data["is_pinned"] = data.is_pinned
    
    await db.project_notes.update_one(
        {"id": note_id},
        {"$set": update_data}
    )
    
    return {"message": "Note mise à jour"}


@router.delete("/{room_id}/notes/{note_id}")
async def delete_project_note(
    room_id: str,
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Supprimer une note (auteur ou admin)
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    note = await db.project_notes.find_one({"id": note_id, "room_id": room_id})
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note non trouvée"
        )
    
    # Vérifier les droits
    if note.get("created_by") != user_id and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non autorisé"
        )
    
    await db.project_notes.delete_one({"id": note_id})
    
    return {"message": "Note supprimée"}


# ============================================
# ROUTES - MESSAGES (CHAT)
# ============================================

@router.get("/{room_id}/messages")
async def get_project_messages(
    room_id: str,
    limit: int = 50,
    before: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère les messages d'un espace projet
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    room = await get_room_or_404(room_id)
    
    # Vérifier l'accès
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    query = {"room_id": room_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.project_messages.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Inverser pour avoir l'ordre chronologique
    messages.reverse()
    
    # Enrichir avec les infos de l'auteur
    for msg in messages:
        author = await get_user_info(msg.get("sender_id"))
        msg["sender"] = author
    
    return {"messages": messages}


@router.post("/{room_id}/messages")
async def send_project_message(
    room_id: str,
    data: ProjectMessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Envoyer un message dans l'espace projet
    """
    user_id = current_user["sub"]
    user_role = current_user.get("role")
    
    room = await get_room_or_404(room_id)
    
    # Vérifier l'accès
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if user_id not in member_ids and user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "id": message_id,
        "room_id": room_id,
        "sender_id": user_id,
        "content": data.content,
        "created_at": now
    }
    
    await db.project_messages.insert_one(message)
    
    # Mettre à jour le timestamp de l'espace
    await db.project_rooms.update_one(
        {"id": room_id},
        {"$set": {"updated_at": now}}
    )
    
    return {"message": "Message envoyé", "message_id": message_id}
