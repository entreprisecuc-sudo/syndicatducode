"""
Modèles Pydantic pour les abonnements
Plans configurables par l'admin + Abonnements des développeurs
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class PlanDuration(str, Enum):
    """Durée des plans"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PlanStatus(str, Enum):
    """Statut des plans"""
    ACTIVE = "active"
    INACTIVE = "inactive"


class SubscriptionStatus(str, Enum):
    """Statut des abonnements"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING = "pending"  # En attente de paiement


# ============================================
# PLANS (configurés par l'admin)
# ============================================

class PlanFeature(BaseModel):
    """Fonctionnalité d'un plan"""
    name: str
    included: bool = True


class PlanCreate(BaseModel):
    """Modèle pour créer un plan"""
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    price_monthly: float = Field(..., ge=0)
    price_yearly: float = Field(..., ge=0)
    features: List[str] = []  # Liste des fonctionnalités incluses
    is_recommended: bool = False  # Plan recommandé/mis en avant
    trial_days: int = Field(default=0, ge=0)  # Jours d'essai gratuit
    

class PlanUpdate(BaseModel):
    """Modèle pour mettre à jour un plan"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    price_monthly: Optional[float] = Field(None, ge=0)
    price_yearly: Optional[float] = Field(None, ge=0)
    features: Optional[List[str]] = None
    is_recommended: Optional[bool] = None
    trial_days: Optional[int] = Field(None, ge=0)
    status: Optional[PlanStatus] = None


class PlanResponse(BaseModel):
    """Modèle de réponse pour un plan"""
    id: str
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    features: List[str]
    is_recommended: bool
    trial_days: int
    status: str
    subscriber_count: int = 0
    created_at: str
    updated_at: str


class PlanListResponse(BaseModel):
    """Liste des plans"""
    plans: List[PlanResponse]
    total: int


# ============================================
# ABONNEMENTS (pour les développeurs)
# ============================================

class SubscriptionCreate(BaseModel):
    """Modèle pour créer un abonnement"""
    plan_id: str
    duration: PlanDuration = PlanDuration.MONTHLY


class SubscriptionResponse(BaseModel):
    """Modèle de réponse pour un abonnement"""
    id: str
    user_id: str
    user_email: str
    plan_id: str
    plan_name: str
    duration: str
    price: float
    status: str
    start_date: str
    end_date: str
    stripe_subscription_id: Optional[str] = None
    created_at: str
    updated_at: str


class SubscriptionListResponse(BaseModel):
    """Liste des abonnements"""
    subscriptions: List[SubscriptionResponse]
    total: int


# ============================================
# CONFIGURATION STRIPE (admin)
# ============================================

class StripeConfigUpdate(BaseModel):
    """Configuration Stripe par l'admin"""
    stripe_public_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    is_live_mode: bool = False  # True = production, False = test


class StripeConfigResponse(BaseModel):
    """Réponse configuration Stripe (clés masquées)"""
    has_public_key: bool
    has_secret_key: bool
    has_webhook_secret: bool
    is_live_mode: bool
    is_configured: bool
