"""
Modèles Pydantic pour les alertes/popups
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


class AlertType(str, Enum):
    """Types d'alertes"""
    POPUP = "popup"      # Modal au centre
    BANNER = "banner"    # Bannière en haut de page


class AlertStyle(str, Enum):
    """Styles visuels des alertes"""
    INFO = "info"        # Bleu - information
    SUCCESS = "success"  # Vert - succès
    WARNING = "warning"  # Orange - avertissement
    DANGER = "danger"    # Rouge - urgent/danger


class AlertTarget(str, Enum):
    """Cibles des alertes"""
    ALL = "all"
    COMMERCIAL = "commercial"
    DEVELOPER = "developer"


class AlertCreate(BaseModel):
    """Modèle pour créer une alerte"""
    title: str = Field(..., min_length=3, max_length=100)
    message: str = Field(..., min_length=5, max_length=500)
    alert_type: AlertType = AlertType.BANNER
    style: AlertStyle = AlertStyle.INFO
    target: AlertTarget = AlertTarget.ALL
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    dismissible: bool = True  # L'utilisateur peut fermer l'alerte
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        return v.strip()


class AlertUpdate(BaseModel):
    """Modèle pour mettre à jour une alerte"""
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    message: Optional[str] = Field(None, min_length=5, max_length=500)
    alert_type: Optional[AlertType] = None
    style: Optional[AlertStyle] = None
    target: Optional[AlertTarget] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    dismissible: Optional[bool] = None
    is_active: Optional[bool] = None


class AlertResponse(BaseModel):
    """Modèle de réponse pour une alerte"""
    id: str
    title: str
    message: str
    alert_type: str
    style: str
    target: str
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    dismissible: bool
    is_active: bool
    created_at: str
    updated_at: str
    created_by: str
    dismiss_count: int = 0


class AlertListResponse(BaseModel):
    """Modèle de réponse pour la liste d'alertes"""
    alerts: List[AlertResponse]
    total: int
