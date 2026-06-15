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
# Référence : PRD services v2 validé par le client
_SERVICES_SEED: list[dict] = [
    # ── Vendeur ─────────────────────────────────────────────────────────
    {
        "title": "Évaluation Standard",
        "target_category": "vendeur",
        "short_description": "Estimez la valeur de votre projet avant sa mise en vente.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant connaître la valeur estimée de leur projet avant publication.\n\n"
            "Ce que nous analysons :\n"
            "• Type de projet\n• Ancienneté\n• Revenus déclarés\n• Trafic déclaré\n"
            "• Positionnement du marché\n• Potentiel de croissance\n\n"
            "Ce qui n'est pas vérifié :\n"
            "• Code source\n• Comptabilité\n• Accès Analytics\n• Données privées\n\n"
            "Vous recevez :\n"
            "• Estimation de valeur\n• Fourchette basse\n• Fourchette recommandée\n"
            "• Fourchette haute\n• Conseils de mise en vente\n\n"
            "Badge : ✅ Évalué par La Citadelle"
        ),
        "price": 1.0, "price_label": "", "service_type": "paid",
        "category": "evaluation", "icon": "star", "display_order": 10,
    },
    {
        "title": "Évaluation Expert Certifiée",
        "target_category": "vendeur",
        "short_description": "Obtenez une valorisation approfondie et certifiée de votre projet.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant obtenir une expertise complète avant la vente.\n\n"
            "Nous analysons :\n\n"
            "Technique :\n• Architecture\n• Dette technique\n• Qualité du code\n"
            "• Hébergement\n• Dépendances\n\n"
            "Business :\n• Revenus\n• Marges\n• Sources de revenus\n\n"
            "SEO :\n• Positionnement\n• Backlinks\n• Risques SEO\n\n"
            "Juridique :\n• Domaine\n• Mentions légales\n• Conditions générales\n\n"
            "Vous recevez :\n• Rapport complet\n• Analyse détaillée\n• Recommandations\n\n"
            "Badge : 🏆 Évaluation Expert Certifiée"
        ),
        "price": 1.0, "price_label": "", "service_type": "paid",
        "category": "evaluation", "icon": "star", "display_order": 20,
    },
    {
        "title": "Valorisation Avant Vente",
        "target_category": "vendeur",
        "short_description": "Augmentez l'attractivité de votre projet avant publication.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant maximiser leurs chances de vendre rapidement.\n\n"
            "Nous intervenons sur :\n"
            "• Le titre de l'annonce\n• La présentation du projet\n• Les visuels\n"
            "• La mise en valeur des revenus\n• La présentation du trafic\n"
            "• L'argumentaire commercial\n\n"
            "Vous recevez :\n"
            "• Une annonce optimisée\n• Une présentation professionnelle\n"
            "• Des recommandations personnalisées\n\n"
            "Badge : ⭐ Annonce Optimisée"
        ),
        "price": 1.0, "price_label": "", "service_type": "paid",
        "category": "valorisation", "icon": "zap", "display_order": 30,
    },
    {
        "title": "Refonte Avant Vente",
        "target_category": "vendeur",
        "short_description": "Augmentez la valeur de votre projet grâce à une intervention experte.",
        "description": (
            "Pour qui ?\n"
            "Vendeurs souhaitant améliorer leur projet avant sa mise en vente.\n\n"
            "Réalisé par :\nLe Syndicat du Code.\n\n"
            "Prestations possibles :\n"
            "• Refonte graphique\n• Optimisation UX/UI\n• Optimisation mobile\n"
            "• Optimisation SEO\n• Amélioration des performances\n"
            "• Corrections techniques\n• Modernisation du projet\n\n"
            "Fonctionnement :\nÉtude préalable puis devis personnalisé."
        ),
        "price": None, "price_label": "Sur devis", "service_type": "quote",
        "category": "refonte", "icon": "zap", "display_order": 40,
    },
    {
        "title": "Vente aux Enchères",
        "target_category": "vendeur",
        "short_description": "Laissez le marché déterminer la valeur de votre projet.",
        "description": (
            "Pour qui ?\nVendeurs souhaitant maximiser leur prix de vente.\n\n"
            "Le vendeur définit :\n"
            "• Prix minimum\n• Date de début\n• Date de fin\n• Conditions de participation\n\n"
            "Les acheteurs enchérissent jusqu'à la clôture.\n\n"
            "Toutes les enchères sont protégées par le système de Transaction Sécurisée de La Citadelle."
        ),
        "price": 0.0, "price_label": "Gratuit", "service_type": "free",
        "category": "encheres", "icon": "zap", "display_order": 50,
    },
    # ── Acheteur ─────────────────────────────────────────────────────────
    {
        "title": "Audit Avant Achat",
        "target_category": "acheteur",
        "short_description": "Analyse indépendante avant votre acquisition.",
        "description": (
            "Pour qui ?\nAcheteurs souhaitant sécuriser leur investissement.\n\n"
            "Nous analysons :\n"
            "• Cohérence du prix demandé\n• Revenus\n• Trafic\n"
            "• Historique du projet\n• Potentiel de croissance\n• Risques identifiés\n\n"
            "Vous recevez :\n"
            "• Rapport détaillé\n• Points forts\n• Points faibles\n• Recommandations\n\n"
            "Conclusion :\n"
            "• Achat recommandé\n• Achat à négocier\n• Achat déconseillé\n\n"
            "Badge : 🔍 Audit Réalisé"
        ),
        "price": 1.0, "price_label": "", "service_type": "paid",
        "category": "audit", "icon": "shield", "display_order": 60,
    },
    {
        "title": "Audit Sécurité",
        "target_category": "acheteur",
        "short_description": "Identifiez les risques de sécurité avant d'investir.",
        "description": (
            "Pour qui ?\nAcheteurs souhaitant vérifier la sécurité d'un projet.\n\n"
            "Nous analysons :\n"
            "• Authentification\n• Gestion des accès\n• Permissions\n"
            "• Dépendances obsolètes\n• Vulnérabilités connues\n"
            "• Hébergement\n• Protection des données\n\n"
            "Vous recevez :\n"
            "• Rapport de sécurité complet\n• Niveau de risque\n• Recommandations\n\n"
            "Niveaux :\n🟢 Faible\n🟠 Moyen\n🔴 Élevé\n⚫ Critique\n\n"
            "Badge : 🔒 Audit Sécurité Réalisé"
        ),
        "price": 1.0, "price_label": "", "service_type": "paid",
        "category": "audit", "icon": "shield", "display_order": 70,
    },
    {
        "title": "Migration Technique",
        "target_category": "acheteur",
        "short_description": "Transférez votre acquisition en toute sérénité.",
        "description": (
            "Pour qui ?\nAcheteurs souhaitant un transfert sécurisé.\n\n"
            "Prestations :\n"
            "• Transfert du domaine\n• Migration hébergement\n• Migration base de données\n"
            "• Migration emails\n• Migration outils tiers\n• Vérifications post-transfert\n\n"
            "Réalisé par :\nLes partenaires du Syndicat du Code."
        ),
        "price": None, "price_label": "Sur devis", "service_type": "quote",
        "category": "migration", "icon": "zap", "display_order": 80,
    },
    {
        "title": "Accompagnement Achat",
        "target_category": "acheteur",
        "short_description": "Soyez accompagné durant toutes les étapes de votre acquisition.",
        "description": (
            "Pour qui ?\nAcheteurs souhaitant être guidés tout au long du processus.\n\n"
            "Prestations :\n\n"
            "Avant achat :\n• Analyse du projet\n• Questions au vendeur\n\n"
            "Pendant la négociation :\n• Conseils\n• Analyse du prix\n• Aide à la décision\n\n"
            "Après achat :\n• Suivi du transfert\n• Validation finale"
        ),
        "price": 1.0, "price_label": "", "service_type": "paid",
        "category": "accompagnement", "icon": "handshake", "display_order": 90,
    },
    # ── Commun ───────────────────────────────────────────────────────────
    {
        "title": "Transaction Sécurisée",
        "target_category": "commun",
        "short_description": "Sécurisez chaque transaction réalisée sur la plateforme.",
        "description": (
            "Pour qui ?\nAcheteurs et vendeurs.\n\n"
            "Fonctionnement :\n"
            "1. Paiement de l'acheteur\n2. Sécurisation des fonds\n"
            "3. Transmission du projet\n4. Validation du transfert\n5. Libération des fonds\n\n"
            "Inclus :\n"
            "• Paiement sécurisé\n• Historique complet\n• Facturation\n"
            "• Gestion des litiges\n• Intervention de La Garde si nécessaire\n\n"
            "Particularité :\n"
            "🛡️ Service obligatoire pour toutes les ventes réalisées sur La Citadelle Numérique."
        ),
        "price": 0.0, "price_label": "Inclus", "service_type": "free",
        "category": "transaction", "icon": "shield", "display_order": 100,
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
