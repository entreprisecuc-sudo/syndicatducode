"""
Routes services — La Citadelle Numérique
Catalogue de services complémentaires paramétrables par l'admin
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Services"])

db = None

def set_database(database):
    global db
    db = database


# ── Modèles ────────────────────────────────────────────────────────────────────

class ServiceCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    short_description: str = Field(default="", max_length=300)
    price: Optional[float] = Field(None, ge=0)
    price_label: str = Field(default="", max_length=50)  # "Gratuit", "Sur devis", "À partir de 99€"
    service_type: str = Field(default="paid")  # paid, free, partner, quote
    category: str = Field(default="general")
    icon: str = Field(default="star", max_length=50)
    partner_name: Optional[str] = Field(None, max_length=200)
    partner_url: Optional[str] = Field(None, max_length=500)
    cta_label: str = Field(default="En savoir plus", max_length=100)
    cta_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True
    display_order: int = Field(default=0)

class ServiceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=300)
    price: Optional[float] = Field(None, ge=0)
    price_label: Optional[str] = Field(None, max_length=50)
    service_type: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    partner_name: Optional[str] = Field(None, max_length=200)
    partner_url: Optional[str] = Field(None, max_length=500)
    cta_label: Optional[str] = Field(None, max_length=100)
    cta_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user


# ── Routes publiques ───────────────────────────────────────────────────────────

@router.get("/services", summary="Liste des services actifs")
async def list_services():
    """Retourne les services actifs, triés par ordre d'affichage"""
    cursor = db.citadelle_services.find(
        {"is_active": True}, {"_id": 0}
    ).sort("display_order", 1)
    services = await cursor.to_list(50)
    return {"services": services}


# ── Routes admin ───────────────────────────────────────────────────────────────

@router.get("/admin/services", summary="Admin — Tous les services")
async def admin_list_services(current_user: dict = Depends(require_admin)):
    """Admin : liste tous les services (actifs et inactifs)"""
    cursor = db.citadelle_services.find({}, {"_id": 0}).sort("display_order", 1)
    services = await cursor.to_list(100)
    return {"services": services}


@router.post("/admin/services", status_code=201, summary="Admin — Créer un service")
async def admin_create_service(
    data: ServiceCreate,
    current_user: dict = Depends(require_admin)
):
    """Admin : crée un nouveau service dans le catalogue"""
    now = datetime.now(timezone.utc).isoformat()
    service = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.citadelle_services.insert_one(service)
    del service["_id"]
    logger.info(f"[Citadelle Admin] Service créé: {service['title']}")
    return service


@router.patch("/admin/services/{service_id}", summary="Admin — Modifier un service")
async def admin_update_service(
    service_id: str,
    data: ServiceUpdate,
    current_user: dict = Depends(require_admin)
):
    """Admin : modifie un service existant"""
    service = await db.citadelle_services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable")

    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        return service

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.citadelle_services.update_one({"id": service_id}, {"$set": updates})
    updated = await db.citadelle_services.find_one({"id": service_id}, {"_id": 0})
    logger.info(f"[Citadelle Admin] Service modifié: {updated['title']}")
    return updated


@router.delete("/admin/services/{service_id}", summary="Admin — Supprimer un service")
async def admin_delete_service(
    service_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin : supprime définitivement un service"""
    result = await db.citadelle_services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service introuvable")
    logger.info(f"[Citadelle Admin] Service supprimé: {service_id}")
    return {"message": "Service supprimé"}


# ── Modèles commandes de services ─────────────────────────────────────────────

class ServiceOrderCreate(BaseModel):
    client_name: str = Field(min_length=2, max_length=200)
    client_email: str = Field(min_length=5, max_length=200)
    client_message: str = Field(default="", max_length=2000)


class ServiceOrderStatusUpdate(BaseModel):
    status: str  # en_attente | en_cours | termine | annule
    admin_note: Optional[str] = Field(None, max_length=1000)


# Statuts valides pour une commande de service
_STATUTS_COMMANDE = {"en_attente", "en_cours", "termine", "annule"}


# ── Route achat service (Stripe mocké) ────────────────────────────────────────

@router.post("/services/{service_id}/buy", status_code=201, summary="Acheter un service (paiement mocké)")
async def buy_service(service_id: str, data: ServiceOrderCreate):
    """
    Crée une commande de service avec paiement Stripe simulé (succès immédiat).
    Accessible sans authentification — capture nom, email et message du client.
    Envoie un email de confirmation au client et une notification à l'administrateur.
    """
    service = await db.citadelle_services.find_one(
        {"id": service_id, "is_active": True}, {"_id": 0}
    )
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable ou inactif")

    if service.get("service_type") != "paid" or not service.get("price") or service["price"] <= 0:
        raise HTTPException(
            status_code=400, detail="Ce service n'est pas disponible à l'achat direct"
        )

    now = datetime.now(timezone.utc).isoformat()
    order = {
        "id": str(uuid.uuid4()),
        "service_id": service_id,
        "service_title": service["title"],
        "amount": service["price"],
        "client_name": data.client_name,
        "client_email": data.client_email,
        "client_message": data.client_message,
        "status": "en_attente",
        "admin_note": "",
        "payment_method": "stripe_mock",
        "created_at": now,
        "updated_at": now,
    }
    await db.citadelle_service_orders.insert_one(order)
    del order["_id"]

    # Emails de confirmation (les exceptions sont capturées dans chaque fonction)
    from services.email_service import (
        send_service_order_confirmation_email,
        send_service_order_admin_notification_email,
    )
    send_service_order_confirmation_email(
        to_email=data.client_email,
        client_name=data.client_name,
        service_title=service["title"],
        amount=service["price"],
        order_id=order["id"],
    )
    send_service_order_admin_notification_email(
        service_title=service["title"],
        amount=service["price"],
        client_name=data.client_name,
        client_email=data.client_email,
        client_message=data.client_message,
        order_id=order["id"],
    )

    logger.info(
        f"[Citadelle] Nouvelle commande service — {service['title']} — {data.client_email}"
    )
    return {"order_id": order["id"], "status": order["status"], "amount": order["amount"]}


# ── Routes admin — Commandes de services ──────────────────────────────────────

@router.get("/admin/services/orders", summary="Admin — Liste des commandes de services")
async def admin_list_orders(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(require_admin),
):
    """Admin : liste toutes les commandes de services, filtrables par statut"""
    query = {}
    if status:
        if status not in _STATUTS_COMMANDE:
            raise HTTPException(status_code=400, detail="Statut de filtre invalide")
        query["status"] = status
    cursor = db.citadelle_service_orders.find(query, {"_id": 0}).sort("created_at", -1)
    orders = await cursor.to_list(200)
    return {"orders": orders}


@router.patch(
    "/admin/services/orders/{order_id}",
    summary="Admin — Mettre à jour une commande de service",
)
async def admin_update_order(
    order_id: str,
    data: ServiceOrderStatusUpdate,
    current_user: dict = Depends(require_admin),
):
    """Admin : modifie le statut et/ou la note interne d'une commande"""
    if data.status not in _STATUTS_COMMANDE:
        raise HTTPException(
            status_code=400,
            detail=f"Statut invalide. Valeurs acceptées : {', '.join(_STATUTS_COMMANDE)}",
        )
    order = await db.citadelle_service_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    updates = {
        "status": data.status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.admin_note is not None:
        updates["admin_note"] = data.admin_note

    await db.citadelle_service_orders.update_one({"id": order_id}, {"$set": updates})
    updated = await db.citadelle_service_orders.find_one({"id": order_id}, {"_id": 0})
    logger.info(f"[Citadelle Admin] Commande {order_id[:8].upper()} — statut : {data.status}")
    return updated
