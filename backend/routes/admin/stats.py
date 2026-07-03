"""
Routes d'administration - Statistiques, logs et contacts
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional
import logging

from middleware.auth import get_current_user, RoleChecker

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin - Stats"])

admin_only = RoleChecker(["admin"])

db = None


def set_database(database):
    """Injecte la connexion à la base de données"""
    global db
    db = database


async def log_admin_action(admin_id: str, action: str, details: str):
    """Enregistre une action administrative"""
    log_entry = {
        "admin_id": admin_id,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_logs.insert_one(log_entry)


@router.get("/stats", dependencies=[Depends(admin_only)])
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Statistiques globales avancées pour le tableau de bord admin"""
    
    # UTILISATEURS
    total_users = await db.users.count_documents({})
    commercial_count = await db.users.count_documents({"role": "commercial"})
    developer_count = await db.users.count_documents({"role": "developer"})
    pending_count = await db.users.count_documents({"status": "pending"})
    suspended_count = await db.users.count_documents({"status": "suspended"})
    active_count = await db.users.count_documents({"status": "active"})
    
    # CONTACTS
    contacts_total = await db.contacts.count_documents({})
    contacts_pending = await db.contacts.count_documents({"status": "pending"})
    contacts_contacted = await db.contacts.count_documents({"status": "contacted"})
    contacts_converted = await db.contacts.count_documents({"status": "converted"})
    
    # PROJETS
    projects_total = await db.projects.count_documents({})
    projects_open = await db.projects.count_documents({"status": "open"})
    projects_closed = await db.projects.count_documents({"status": "closed"})
    projects_in_progress = await db.projects.count_documents({"status": "in_progress"})
    
    candidatures_pipeline = [
        {"$unwind": "$applications"},
        {"$count": "total"}
    ]
    candidatures_result = await db.projects.aggregate(candidatures_pipeline).to_list(1)
    candidatures_total = candidatures_result[0]["total"] if candidatures_result else 0
    
    # ANNONCES
    annonces_total = await db.announcements.count_documents({})
    annonces_active = await db.announcements.count_documents({"is_active": True})
    
    # ALERTES
    alertes_total = await db.alerts.count_documents({})
    alertes_active = await db.alerts.count_documents({"is_active": True})
    alertes_popup = await db.alerts.count_documents({"type": "popup"})
    alertes_banner = await db.alerts.count_documents({"type": "banner"})
    
    # ABONNEMENTS
    plans_total = await db.subscription_plans.count_documents({})
    plans_active = await db.subscription_plans.count_documents({"is_active": True})
    subscriptions_active = await db.user_subscriptions.count_documents({"status": "active"})
    
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
    
    # PARTENAIRES
    partners_total = await db.partners.count_documents({})
    partners_active = await db.partners.count_documents({"is_active": True})
    
    partners_by_category = await db.partners.aggregate([
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(20)
    
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


@router.get("/citadelle-stats", dependencies=[Depends(admin_only)])
async def get_citadelle_stats(current_user: dict = Depends(get_current_user)):
    """Statistiques globales de La Citadelle Numérique pour le dashboard admin."""

    # Annonces
    listings_total    = await db.citadelle_listings.count_documents({})
    listings_active   = await db.citadelle_listings.count_documents({"status": "active"})
    listings_pending  = await db.citadelle_listings.count_documents({"status": "pending"})

    # Transactions
    tx_active_statuses = ["payment_done", "credentials_submitted", "admin_verified", "disputed"]
    transactions_total         = await db.citadelle_transactions.count_documents({})
    transactions_active        = await db.citadelle_transactions.count_documents({"status": {"$in": tx_active_statuses}})
    transactions_awaiting_admin = await db.citadelle_transactions.count_documents({"status": "credentials_submitted"})

    # Utilisateurs Citadelle (plateforme = citadelle)
    citadelle_users = await db.users.count_documents({"platform": "citadelle"})
    kyc_pending     = await db.users.count_documents({
        "platform": "citadelle",
        "kyc_status": {"$in": ["pending", None]},
        "stripe_connect_account_id": {"$exists": True, "$ne": None},
    })

    # Commandes de services en attente
    service_orders_pending = await db.citadelle_service_orders.count_documents({"status": "en_attente"})
    service_orders_total   = await db.citadelle_service_orders.count_documents({})

    # Factures et CA total
    invoices_total = await db.citadelle_invoices.count_documents({})
    ca_result = await db.citadelle_invoices.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$amount_ttc"}}}
    ]).to_list(1)
    ca_total = ca_result[0]["total"] if ca_result else 0.0

    # Newsletter abonnés actifs
    newsletter_subs = await db.citadelle_newsletter_subscriptions.count_documents({"active": True})

    # Blog articles publiés
    blog_published = await db.citadelle_blog_posts.count_documents({"is_published": True})

    return {
        "listings": {
            "total":              listings_total,
            "active":             listings_active,
            "pending_validation": listings_pending,
        },
        "transactions": {
            "total":          transactions_total,
            "active":         transactions_active,
            "awaiting_admin": transactions_awaiting_admin,
        },
        "users": {
            "total":       citadelle_users,
            "kyc_pending": kyc_pending,
        },
        "services": {
            "orders_total":   service_orders_total,
            "orders_pending": service_orders_pending,
        },
        "invoices": {
            "total":    invoices_total,
            "ca_total": ca_total,
        },
        "newsletter": {
            "subscribers": newsletter_subs,
        },
        "blog": {
            "published": blog_published,
        },
    }


@router.get("/logs", dependencies=[Depends(admin_only)])
async def get_admin_logs(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Récupère les logs d'actions administratives"""
    logs = await db.admin_logs.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"logs": logs}


@router.get("/contacts", dependencies=[Depends(admin_only)])
async def get_all_contacts(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Liste toutes les demandes de contact"""
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
    """Mettre à jour le statut d'une demande de contact"""
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
    
    await log_admin_action(
        current_user["sub"],
        "UPDATE_CONTACT_STATUS",
        f"Contact {contact_id} statut changé en: {new_status}"
    )
    
    return {"message": f"Statut mis à jour: {new_status}"}
