"""
Modèles Pydantic pour les partenaires de services
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class PartnerCategory(str, Enum):
    """Catégories de partenaires"""
    HOSTING = "hosting"          # Hébergement
    TOOLS = "tools"              # Outils & Logiciels
    SERVICES = "services"        # Services professionnels
    TRAINING = "training"        # Formation
    LEGAL = "legal"              # Juridique & Comptabilité
    MARKETING = "marketing"      # Marketing & Communication
    OTHER = "other"              # Autre


class PartnerStatus(str, Enum):
    """Statut des partenaires"""
    ACTIVE = "active"
    INACTIVE = "inactive"


class PartnerCreate(BaseModel):
    """Modèle pour créer un partenaire"""
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    category: PartnerCategory = PartnerCategory.OTHER
    advantages: List[str] = []  # Avantages pour les membres
    discount_code: Optional[str] = None  # Code promo éventuel
    contact_email: Optional[str] = None
    is_featured: bool = False  # Partenaire mis en avant


class PartnerUpdate(BaseModel):
    """Modèle pour mettre à jour un partenaire"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    category: Optional[PartnerCategory] = None
    advantages: Optional[List[str]] = None
    discount_code: Optional[str] = None
    contact_email: Optional[str] = None
    is_featured: Optional[bool] = None
    status: Optional[PartnerStatus] = None


class PartnerResponse(BaseModel):
    """Modèle de réponse pour un partenaire"""
    id: str
    name: str
    description: str
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    category: str
    advantages: List[str]
    discount_code: Optional[str] = None
    contact_email: Optional[str] = None
    is_featured: bool
    status: str
    created_at: str
    updated_at: str


class PartnerListResponse(BaseModel):
    """Liste des partenaires"""
    partners: List[PartnerResponse]
    total: int
