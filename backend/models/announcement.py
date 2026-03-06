"""
Modèles Pydantic pour les annonces
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


class AnnouncementTarget(str, Enum):
    """Cibles possibles pour une annonce"""
    ALL = "all"          # Tous les membres
    COMMERCIAL = "commercial"  # Partenaires commerciaux uniquement
    DEVELOPER = "developer"    # Partenaires développeurs uniquement


class AnnouncementType(str, Enum):
    """Types d'annonces"""
    INFO = "info"        # Information générale
    UPDATE = "update"    # Mise à jour / nouveauté
    EVENT = "event"      # Événement
    URGENT = "urgent"    # Message urgent


class AnnouncementCreate(BaseModel):
    """Modèle pour créer une annonce"""
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    announcement_type: AnnouncementType = AnnouncementType.INFO
    target: AnnouncementTarget = AnnouncementTarget.ALL
    is_pinned: bool = False
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Le titre doit contenir au moins 3 caractères')
        return v.strip()


class AnnouncementUpdate(BaseModel):
    """Modèle pour mettre à jour une annonce"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=10)
    announcement_type: Optional[AnnouncementType] = None
    target: Optional[AnnouncementTarget] = None
    is_pinned: Optional[bool] = None
    is_published: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    """Modèle de réponse pour une annonce"""
    id: str
    title: str
    content: str
    announcement_type: str
    target: str
    is_pinned: bool
    is_published: bool
    created_at: str
    updated_at: str
    created_by: str
    view_count: int = 0


class AnnouncementListResponse(BaseModel):
    """Modèle de réponse pour la liste d'annonces"""
    announcements: List[AnnouncementResponse]
    total: int
