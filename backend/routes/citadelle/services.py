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

from routes.citadelle.dependencies import require_admin, require_citadelle_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Services"])

db = None

def set_database(database):
    global db
    db = database


# ── Helpers d'authentification ─────────────────────────────────────────────────

# require_citadelle_user / require_admin importés depuis routes/citadelle/dependencies (DRY)


# ── Modèles ────────────────────────────────────────────────────────────────────

class ServiceCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    short_description: str = Field(default="", max_length=300)
    price: Optional[float] = Field(None, ge=0)
    price_label: str = Field(default="", max_length=50)  # "Gratuit", "Sur devis", "À partir de 99€"
    service_type: str = Field(default="paid")  # paid, free, partner, quote
    category: str = Field(default="general")
    target_category: str = Field(default="commun")  # vendeur, acheteur, commun
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
    target_category: Optional[str] = None  # vendeur, acheteur, commun
    icon: Optional[str] = Field(None, max_length=50)
    partner_name: Optional[str] = Field(None, max_length=200)
    partner_url: Optional[str] = Field(None, max_length=500)
    cta_label: Optional[str] = Field(None, max_length=100)
    cta_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# ── Routes publiques ───────────────────────────────────────────────────────────

@router.get("/services", summary="Liste des services actifs")
async def list_services():
    """Retourne les services actifs, triés par ordre d'affichage"""
    cursor = db.citadelle_services.find(
        {"is_active": True}, {"_id": 0}
    ).sort("display_order", 1)
    services = await cursor.to_list(50)
    return {"services": services}


@router.get("/services/my-orders", summary="Mes commandes de services (utilisateur connecté)")
async def my_service_orders(current_user: dict = Depends(require_citadelle_user)):
    """
    Retourne les commandes de service liées à l'email de l'utilisateur connecté.
    Accessible aux membres Citadelle authentifiés uniquement.
    """
    cursor = db.citadelle_service_orders.find(
        {"client_email": current_user["email"]}, {"_id": 0}
    ).sort("created_at", -1)
    orders = await cursor.to_list(50)
    return {"orders": orders}


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


# ── Données de seeding — catalogue officiel des services ──────────────────────
# Référence : catalogue validé par le client (13/06/2026)
_SERVICES_SEED: list[dict] = [
    # ── Vendeur ─────────────────────────────────────────────────────────
    {
        "title": "Estimation Standard",
        "target_category": "vendeur",
        "short_description": "Obtenez une première estimation de la valeur de votre site sous 48h.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant obtenir une première estimation de leur site.\n\n"
            "Ce que comprend le service :\n"
            "• Analyse rapide du site\n"
            "• Estimation de la valeur\n"
            "• Rapport synthétique PDF\n"
            "• Fourchette de prix conseillée"
        ),
        "price": 49.0, "price_label": "", "service_type": "paid",
        "category": "estimation", "icon": "star", "display_order": 10,
    },
    {
        "title": "Estimation Expert",
        "target_category": "vendeur",
        "short_description": "Valorisation complète et détaillée avec rapport PDF professionnel.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant une valorisation approfondie avant mise en vente.\n\n"
            "Ce que comprend le service :\n"
            "• Analyse complète du site\n"
            "• Étude du trafic\n"
            "• Étude SEO\n"
            "• Analyse des revenus\n"
            "• Analyse de la concurrence\n"
            "• Valorisation détaillée\n"
            "• Rapport PDF complet\n"
            "• Conseils d'amélioration avant mise en vente"
        ),
        "price": 149.0, "price_label": "", "service_type": "paid",
        "category": "estimation", "icon": "star", "display_order": 20,
    },
    {
        "title": "Vérification La Garde",
        "target_category": "vendeur",
        "short_description": "Obtenez le badge de confiance « Vérifié par La Garde » sur votre annonce.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant renforcer la crédibilité de leur annonce.\n\n"
            "Ce que comprend le service :\n"
            "• Vérification d'identité du vendeur\n"
            "• Vérification des droits de propriété\n"
            "• Contrôle des revenus déclarés\n"
            "• Vérification des accès principaux\n"
            "• Badge « Vérifié par La Garde » sur l'annonce\n\n"
            "Ce badge rassure les acheteurs et accélère la vente."
        ),
        "price": 99.0, "price_label": "", "service_type": "paid",
        "category": "verification", "icon": "shield", "display_order": 30,
    },
    {
        "title": "Accompagnement Vente Premium",
        "target_category": "vendeur",
        "short_description": "Soyez accompagné à chaque étape de votre vente, de l'annonce à la signature.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant maximiser leurs chances de vendre rapidement.\n\n"
            "Ce que comprend le service :\n"
            "• Préparation du dossier de vente\n"
            "• Optimisation de l'annonce\n"
            "• Conseils sur le prix\n"
            "• Accompagnement vendeur\n"
            "• Réponses aux acheteurs\n"
            "• Assistance jusqu'à la signature"
        ),
        "price": 399.0, "price_label": "", "service_type": "paid",
        "category": "accompagnement", "icon": "handshake", "display_order": 40,
    },
    {
        "title": "Vente aux enchères",
        "target_category": "vendeur",
        "short_description": "Laissez le marché déterminer la valeur de votre site.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant maximiser leur prix de vente.\n\n"
            "Ce que comprend le service :\n"
            "• Mise aux enchères du site\n"
            "• Gestion automatique des enchères\n"
            "• Notifications en temps réel\n"
            "• Historique complet des offres\n\n"
            "Tarification :\n"
            "• Commission : 5 % sur la vente\n"
            "• Option mise en avant : 29 €\n\n"
            "Toutes les enchères sont protégées par la Transaction Sécurisée de La Citadelle."
        ),
        "price": None, "price_label": "Commission 5 %", "service_type": "quote",
        "category": "encheres", "icon": "zap", "display_order": 50,
    },
    # ── Acheteur ─────────────────────────────────────────────────────────
    {
        "title": "Audit SEO",
        "target_category": "acheteur",
        "short_description": "Identifiez les forces et faiblesses SEO avant d'investir.",
        "description": (
            "Pour qui ?\n"
            "Acheteurs et vendeurs souhaitant évaluer le potentiel SEO d'un site.\n\n"
            "Ce que comprend le service :\n"
            "• Audit technique complet\n"
            "• Analyse des Core Web Vitals\n"
            "• Analyse des backlinks\n"
            "• Étude des mots-clés\n"
            "• Identification des erreurs SEO\n"
            "• Plan d'actions priorisé"
        ),
        "price": 199.0, "price_label": "", "service_type": "paid",
        "category": "audit", "icon": "search", "display_order": 60,
    },
    {
        "title": "Audit Sécurité",
        "target_category": "acheteur",
        "short_description": "Identifiez les risques de sécurité avant d'investir.",
        "description": (
            "Pour qui ?\n"
            "Acheteurs souhaitant vérifier la sécurité d'un site avant acquisition.\n\n"
            "Ce que comprend le service :\n"
            "• Vérification HTTPS et certificats\n"
            "• Analyse des vulnérabilités connues\n"
            "• Audit CMS et extensions\n"
            "• Vérification des sauvegardes\n"
            "• Analyse de la configuration serveur\n"
            "• Rapport de sécurité détaillé\n\n"
            "Niveaux de risque : 🟢 Faible — 🟠 Moyen — 🔴 Élevé — ⚫ Critique"
        ),
        "price": 249.0, "price_label": "", "service_type": "paid",
        "category": "audit", "icon": "shield", "display_order": 70,
    },
    {
        "title": "Migration de site",
        "target_category": "acheteur",
        "short_description": "Transférez votre acquisition en toute sérénité.",
        "description": (
            "Pour qui ?\n"
            "Acheteurs souhaitant un transfert complet et sécurisé de leur acquisition.\n\n"
            "Ce que comprend le service :\n"
            "• Migration du nom de domaine\n"
            "• Migration de l'hébergement\n"
            "• Migration de la base de données\n"
            "• Migration des emails\n"
            "• Migration des outils tiers\n"
            "• Vérifications post-transfert\n"
            "• Mise en ligne et confirmation\n\n"
            "Option disponible :\n"
            "• Migration urgente : +100 €"
        ),
        "price": None, "price_label": "À partir de 299 €", "service_type": "quote",
        "category": "migration", "icon": "zap", "display_order": 80,
    },
    {
        "title": "Refonte / Optimisation",
        "target_category": "acheteur",
        "short_description": "Modernisez votre acquisition pour en maximiser la valeur.",
        "description": (
            "Pour qui ?\n"
            "Acheteurs et vendeurs souhaitant améliorer les performances d'un site.\n\n"
            "Ce que comprend le service :\n"
            "• Optimisation des performances\n"
            "• Modernisation graphique\n"
            "• Amélioration de l'expérience utilisateur\n"
            "• Corrections techniques\n"
            "• Optimisation SEO on-page\n\n"
            "Réalisé par les développeurs du Syndicat du Code.\n"
            "Étude préalable puis devis personnalisé."
        ),
        "price": None, "price_label": "À partir de 499 €", "service_type": "quote",
        "category": "refonte", "icon": "zap", "display_order": 90,
    },
    # ── Commun ───────────────────────────────────────────────────────────
    {
        "title": "Transaction Sécurisée Premium",
        "target_category": "commun",
        "short_description": "Protégez votre achat ou votre vente avec notre système de séquestre et La Garde.",
        "description": (
            "Pour qui ?\n"
            "Acheteurs et vendeurs souhaitant sécuriser 100 % de leur transaction.\n\n"
            "Ce que comprend le service :\n"
            "• Gestion complète de la transaction\n"
            "• Vérification vendeur et acheteur\n"
            "• Signature électronique\n"
            "• Contrôle des accès transmis\n"
            "• Sécurisation du paiement via Stripe\n"
            "• Assistance par La Garde jusqu'au transfert complet\n\n"
            "Tarification :\n"
            "• Commission : 5 % du montant de la transaction\n"
            "• Minimum : 49 €\n\n"
            "Service obligatoire pour toutes les ventes réalisées sur La Citadelle Numérique."
        ),
        "price": None, "price_label": "5 % (min. 49 €)", "service_type": "quote",
        "category": "transaction", "icon": "shield", "display_order": 100,
    },
    # ── Gratuits ─────────────────────────────────────────────────────────
    {
        "title": "Dépôt d'annonce",
        "target_category": "commun",
        "short_description": "Publiez votre site à vendre gratuitement sur La Citadelle Numérique.",
        "description": (
            "Créez et publiez votre annonce de vente de site internet entièrement gratuitement.\n"
            "Votre annonce est visible par tous les acheteurs inscrits sur la plateforme."
        ),
        "price": 0.0, "price_label": "Gratuit", "service_type": "free",
        "category": "plateforme", "icon": "star", "display_order": 110,
    },
    {
        "title": "Recherche d'annonces",
        "target_category": "commun",
        "short_description": "Accédez au catalogue complet des sites et projets en vente.",
        "description": (
            "Parcourez librement toutes les annonces de sites en vente sur La Citadelle Numérique.\n"
            "Filtres par type, prix, revenus et ancienneté disponibles."
        ),
        "price": 0.0, "price_label": "Gratuit", "service_type": "free",
        "category": "plateforme", "icon": "search", "display_order": 120,
    },
    {
        "title": "Création de compte",
        "target_category": "commun",
        "short_description": "Créez votre espace membre et accédez à toutes les fonctionnalités.",
        "description": (
            "L'inscription sur La Citadelle Numérique est entièrement gratuite.\n"
            "Accédez à la messagerie, aux offres d'achat et à votre espace membre sans frais."
        ),
        "price": 0.0, "price_label": "Gratuit", "service_type": "free",
        "category": "plateforme", "icon": "star", "display_order": 130,
    },
]

# Titres des services du catalogue officiel (pour désactiver les anciens)
_TITRES_OFFICIELS = {s["title"] for s in _SERVICES_SEED}


# ── Route de seeding — catalogue officiel ─────────────────────────────────────

@router.post(
    "/admin/services/seed",
    status_code=200,
    summary="Admin — Seeder le catalogue officiel des services",
)
async def admin_seed_services(current_user: dict = Depends(require_admin)):
    """
    Idempotente : crée ou met à jour les 10 services du catalogue officiel.
    Désactive les services dont le titre ne fait pas partie du catalogue officiel.
    """
    now = datetime.now(timezone.utc).isoformat()
    created, updated, disabled = 0, 0, 0

    # Désactivation des services hors catalogue officiel
    result = await db.citadelle_services.update_many(
        {"title": {"$nin": list(_TITRES_OFFICIELS)}},
        {"$set": {"is_active": False, "updated_at": now}},
    )
    disabled = result.modified_count

    # Création ou mise à jour des services officiels
    for svc_data in _SERVICES_SEED:
        existing = await db.citadelle_services.find_one(
            {"title": svc_data["title"]}, {"_id": 0}
        )
        if existing:
            await db.citadelle_services.update_one(
                {"title": svc_data["title"]},
                {"$set": {**svc_data, "updated_at": now, "is_active": True}},
            )
            updated += 1
        else:
            new_svc = {
                "id": str(uuid.uuid4()),
                **svc_data,
                "partner_name": None,
                "partner_url": None,
                "cta_label": "En savoir plus",
                "cta_url": None,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            await db.citadelle_services.insert_one(new_svc)
            del new_svc["_id"]
            created += 1

    logger.info(
        f"[Citadelle Admin] Seeding services — créés: {created}, "
        f"mis à jour: {updated}, désactivés: {disabled}"
    )
    return {"created": created, "updated": updated, "disabled": disabled}


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
    from config.settings import CONTACT_EMAIL

    # Pour "Refonte Avant Vente" (catégorie "refonte"), notifier aussi le Syndicat du Code
    cc = [CONTACT_EMAIL] if service.get("category") == "refonte" else None

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
        cc_recipients=cc,
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
