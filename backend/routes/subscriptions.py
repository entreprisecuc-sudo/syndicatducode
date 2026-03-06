"""
Routes pour la gestion des abonnements
- Admin : CRUD plans, configuration Stripe, vue des abonnements
- Développeurs : Voir plans, souscrire, gérer son abonnement
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone, timedelta
import uuid
import logging

from models.subscription import (
    PlanCreate, PlanUpdate, PlanResponse, PlanListResponse,
    PlanStatus, PlanDuration,
    SubscriptionCreate, SubscriptionResponse, SubscriptionListResponse,
    SubscriptionStatus,
    StripeConfigUpdate, StripeConfigResponse
)
from middleware.auth import get_current_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["Abonnements"])

# Variable globale pour la base de données
db = None

def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


# ============================================
# ROUTES ADMIN - GESTION DES PLANS
# ============================================

@router.post("/admin/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    data: PlanCreate,
    current_user: dict = Depends(require_admin)
):
    """Créer un nouveau plan d'abonnement (admin)"""
    now = datetime.now(timezone.utc).isoformat()
    plan_id = str(uuid.uuid4())
    
    plan_doc = {
        "id": plan_id,
        "name": data.name,
        "description": data.description,
        "price_monthly": data.price_monthly,
        "price_yearly": data.price_yearly,
        "features": data.features,
        "is_recommended": data.is_recommended,
        "trial_days": data.trial_days,
        "status": PlanStatus.ACTIVE.value,
        "subscriber_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.subscription_plans.insert_one(plan_doc)
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "create_plan",
        "details": f"Plan créé: {data.name} ({data.price_monthly}€/mois)",
        "target_id": plan_id,
        "created_at": now
    })
    
    logger.info(f"Plan créé: {data.name} par {current_user.get('email')}")
    
    return PlanResponse(**plan_doc)


@router.get("/admin/plans", response_model=PlanListResponse)
async def get_all_plans_admin(
    current_user: dict = Depends(require_admin)
):
    """Récupérer tous les plans (admin)"""
    plans = await db.subscription_plans.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return PlanListResponse(
        plans=[PlanResponse(**p) for p in plans],
        total=len(plans)
    )


@router.put("/admin/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    data: PlanUpdate,
    current_user: dict = Depends(require_admin)
):
    """Mettre à jour un plan (admin)"""
    plan = await db.subscription_plans.find_one({"id": plan_id})
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan non trouvé"
        )
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.price_monthly is not None:
        update_data["price_monthly"] = data.price_monthly
    if data.price_yearly is not None:
        update_data["price_yearly"] = data.price_yearly
    if data.features is not None:
        update_data["features"] = data.features
    if data.is_recommended is not None:
        update_data["is_recommended"] = data.is_recommended
    if data.trial_days is not None:
        update_data["trial_days"] = data.trial_days
    if data.status is not None:
        update_data["status"] = data.status.value
    
    await db.subscription_plans.update_one(
        {"id": plan_id},
        {"$set": update_data}
    )
    
    updated = await db.subscription_plans.find_one({"id": plan_id}, {"_id": 0})
    return PlanResponse(**updated)


@router.delete("/admin/plans/{plan_id}")
async def delete_plan(
    plan_id: str,
    current_user: dict = Depends(require_admin)
):
    """Supprimer un plan (admin)"""
    plan = await db.subscription_plans.find_one({"id": plan_id})
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan non trouvé"
        )
    
    # Vérifier qu'il n'y a pas d'abonnements actifs
    active_subs = await db.subscriptions.count_documents({
        "plan_id": plan_id,
        "status": SubscriptionStatus.ACTIVE.value
    })
    
    if active_subs > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer : {active_subs} abonnement(s) actif(s) sur ce plan"
        )
    
    await db.subscription_plans.delete_one({"id": plan_id})
    
    return {"message": "Plan supprimé avec succès"}


# ============================================
# ROUTES ADMIN - GESTION DES ABONNEMENTS
# ============================================

@router.get("/admin/subscriptions", response_model=SubscriptionListResponse)
async def get_all_subscriptions_admin(
    status_filter: str = Query(None),
    current_user: dict = Depends(require_admin)
):
    """Récupérer tous les abonnements (admin)"""
    filter_query = {}
    if status_filter:
        filter_query["status"] = status_filter
    
    subscriptions = await db.subscriptions.find(
        filter_query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Enrichir avec les infos utilisateur et plan
    enriched = []
    for sub in subscriptions:
        user = await db.users.find_one({"id": sub["user_id"]}, {"_id": 0, "email": 1})
        plan = await db.subscription_plans.find_one({"id": sub["plan_id"]}, {"_id": 0, "name": 1})
        
        enriched.append(SubscriptionResponse(
            **sub,
            user_email=user.get("email", "N/A") if user else "N/A",
            plan_name=plan.get("name", "N/A") if plan else "N/A"
        ))
    
    return SubscriptionListResponse(
        subscriptions=enriched,
        total=len(enriched)
    )


@router.get("/admin/stats")
async def get_subscription_stats(
    current_user: dict = Depends(require_admin)
):
    """Statistiques des abonnements (admin)"""
    total_plans = await db.subscription_plans.count_documents({})
    active_plans = await db.subscription_plans.count_documents({"status": "active"})
    
    total_subs = await db.subscriptions.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    expired_subs = await db.subscriptions.count_documents({"status": "expired"})
    cancelled_subs = await db.subscriptions.count_documents({"status": "cancelled"})
    
    # Revenus (estimation basée sur les abonnements actifs)
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    revenue_result = await db.subscriptions.aggregate(pipeline).to_list(1)
    monthly_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "plans": {
            "total": total_plans,
            "active": active_plans
        },
        "subscriptions": {
            "total": total_subs,
            "active": active_subs,
            "expired": expired_subs,
            "cancelled": cancelled_subs
        },
        "revenue": {
            "monthly_estimate": monthly_revenue
        }
    }


# ============================================
# ROUTES ADMIN - CONFIGURATION STRIPE
# ============================================

@router.get("/admin/stripe-config", response_model=StripeConfigResponse)
async def get_stripe_config(
    current_user: dict = Depends(require_admin)
):
    """Récupérer la configuration Stripe (admin)"""
    config = await db.settings.find_one({"key": "stripe_config"}, {"_id": 0})
    
    if not config:
        return StripeConfigResponse(
            has_public_key=False,
            has_secret_key=False,
            has_webhook_secret=False,
            is_live_mode=False,
            is_configured=False
        )
    
    return StripeConfigResponse(
        has_public_key=bool(config.get("stripe_public_key")),
        has_secret_key=bool(config.get("stripe_secret_key")),
        has_webhook_secret=bool(config.get("stripe_webhook_secret")),
        is_live_mode=config.get("is_live_mode", False),
        is_configured=bool(config.get("stripe_public_key") and config.get("stripe_secret_key"))
    )


@router.put("/admin/stripe-config", response_model=StripeConfigResponse)
async def update_stripe_config(
    data: StripeConfigUpdate,
    current_user: dict = Depends(require_admin)
):
    """Mettre à jour la configuration Stripe (admin)"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.stripe_public_key is not None:
        update_data["stripe_public_key"] = data.stripe_public_key
    if data.stripe_secret_key is not None:
        update_data["stripe_secret_key"] = data.stripe_secret_key
    if data.stripe_webhook_secret is not None:
        update_data["stripe_webhook_secret"] = data.stripe_webhook_secret
    if data.is_live_mode is not None:
        update_data["is_live_mode"] = data.is_live_mode
    
    await db.settings.update_one(
        {"key": "stripe_config"},
        {"$set": update_data},
        upsert=True
    )
    
    # Log admin action
    await db.admin_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": current_user.get("sub"),
        "action": "update_stripe_config",
        "details": "Configuration Stripe mise à jour",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return await get_stripe_config(current_user)


# ============================================
# ROUTES DÉVELOPPEURS - PLANS & ABONNEMENTS
# ============================================

@router.get("/plans", response_model=PlanListResponse)
async def get_available_plans(
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les plans disponibles (développeurs)"""
    # Vérifier que l'utilisateur est un développeur
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les abonnements sont réservés aux développeurs partenaires"
        )
    
    plans = await db.subscription_plans.find(
        {"status": PlanStatus.ACTIVE.value},
        {"_id": 0}
    ).sort("price_monthly", 1).to_list(100)
    
    return PlanListResponse(
        plans=[PlanResponse(**p) for p in plans],
        total=len(plans)
    )


@router.get("/my-subscription")
async def get_my_subscription(
    current_user: dict = Depends(get_current_user)
):
    """Récupérer l'abonnement actuel du développeur"""
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les abonnements sont réservés aux développeurs partenaires"
        )
    
    user_id = current_user.get("sub")
    
    # Chercher l'abonnement actif
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": SubscriptionStatus.ACTIVE.value},
        {"_id": 0}
    )
    
    if not subscription:
        return {"subscription": None, "message": "Aucun abonnement actif"}
    
    # Enrichir avec les infos du plan
    plan = await db.subscription_plans.find_one({"id": subscription["plan_id"]}, {"_id": 0})
    
    return {
        "subscription": SubscriptionResponse(
            **subscription,
            user_email=current_user.get("email"),
            plan_name=plan.get("name") if plan else "N/A"
        )
    }


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe_to_plan(
    data: SubscriptionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Souscrire à un plan (développeurs uniquement)
    Note: Pour l'instant, crée un abonnement en mode "pending" 
    En attente de la configuration Stripe pour les paiements réels
    """
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les abonnements sont réservés aux développeurs partenaires"
        )
    
    user_id = current_user.get("sub")
    
    # Vérifier qu'il n'a pas déjà un abonnement actif
    existing = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": {"$in": [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.PENDING.value]}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous avez déjà un abonnement actif ou en attente"
        )
    
    # Vérifier que le plan existe et est actif
    plan = await db.subscription_plans.find_one({
        "id": data.plan_id,
        "status": PlanStatus.ACTIVE.value
    })
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan non trouvé ou inactif"
        )
    
    # Calculer les dates et le prix
    now = datetime.now(timezone.utc)
    
    if data.duration == PlanDuration.MONTHLY:
        end_date = now + timedelta(days=30)
        price = plan["price_monthly"]
    else:
        end_date = now + timedelta(days=365)
        price = plan["price_yearly"]
    
    # Ajouter les jours d'essai si applicable
    if plan.get("trial_days", 0) > 0:
        end_date = end_date + timedelta(days=plan["trial_days"])
    
    subscription_id = str(uuid.uuid4())
    
    subscription_doc = {
        "id": subscription_id,
        "user_id": user_id,
        "plan_id": data.plan_id,
        "duration": data.duration.value,
        "price": price,
        "status": SubscriptionStatus.ACTIVE.value,  # Active directement (Stripe viendra plus tard)
        "start_date": now.isoformat(),
        "end_date": end_date.isoformat(),
        "stripe_subscription_id": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.subscriptions.insert_one(subscription_doc)
    
    # Mettre à jour le compteur d'abonnés du plan
    await db.subscription_plans.update_one(
        {"id": data.plan_id},
        {"$inc": {"subscriber_count": 1}}
    )
    
    logger.info(f"Abonnement créé: {current_user.get('email')} -> {plan['name']}")
    
    return SubscriptionResponse(
        **subscription_doc,
        user_email=current_user.get("email"),
        plan_name=plan["name"]
    )


@router.post("/cancel")
async def cancel_subscription(
    current_user: dict = Depends(get_current_user)
):
    """Annuler son abonnement (développeur)"""
    if current_user.get("role") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les abonnements sont réservés aux développeurs partenaires"
        )
    
    user_id = current_user.get("sub")
    
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": SubscriptionStatus.ACTIVE.value
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun abonnement actif à annuler"
        )
    
    await db.subscriptions.update_one(
        {"id": subscription["id"]},
        {"$set": {
            "status": SubscriptionStatus.CANCELLED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Décrémenter le compteur
    await db.subscription_plans.update_one(
        {"id": subscription["plan_id"]},
        {"$inc": {"subscriber_count": -1}}
    )
    
    logger.info(f"Abonnement annulé: {current_user.get('email')}")
    
    return {"message": "Abonnement annulé avec succès"}
