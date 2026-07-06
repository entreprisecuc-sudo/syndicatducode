"""
Service de push notifications pour l'app admin "Papa en Mousse".
Utilise le protocole Web Push (VAPID) via pywebpush.
"""
import os
import json
import logging
from datetime import datetime, timezone
from pywebpush import webpush, WebPushException
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Chemins vers les clés VAPID générées
_VAPID_PRIVATE_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "vapid_private.pem")
_VAPID_SUBJECT      = os.environ.get("VAPID_SUBJECT", "mailto:admin@example.com")


def _get_vapid_private_key() -> str:
    """Clé privée VAPID : priorité à la variable d'environnement (déploiement VPS fiable),
    sinon repli sur le fichier PEM local."""
    env_key = (os.environ.get("VAPID_PRIVATE_KEY") or "").strip()
    if env_key:
        return env_key
    return _VAPID_PRIVATE_PATH

_db: AsyncIOMotorDatabase | None = None

# Dernier état connu — pour détecter les nouvelles alertes
_last_alert_counts: dict = {}


def set_database(db: AsyncIOMotorDatabase):
    global _db
    _db = db


def get_vapid_public_key() -> str:
    """Retourne la clé publique VAPID (Application Server Key pour le navigateur)."""
    return os.environ.get("VAPID_PUBLIC_KEY", "")


async def get_alert_summary() -> dict:
    """Construit le résumé des alertes actives depuis MongoDB."""
    if _db is None:
        return {}

    # Annonces Citadelle en attente de validation
    listings = await _db.citadelle_listings.find(
        {"status": "pending"}, {"_id": 0, "id": 1, "title": 1, "created_at": 1}
    ).to_list(50)

    # Transactions en attente de vérification admin
    transactions = await _db.citadelle_transactions.find(
        {"status": "credentials_submitted"},
        {"_id": 0, "id": 1, "listing_title": 1, "amount": 1, "created_at": 1}
    ).to_list(50)

    # Commandes de services en attente
    service_orders = await _db.citadelle_service_orders.find(
        {"status": "en_attente"},
        {"_id": 0, "id": 1, "service_title": 1, "client_name": 1, "created_at": 1}
    ).to_list(50)

    # KYC en attente
    kyc_users = await _db.users.find(
        {"platform": "citadelle", "kyc_status": {"$in": ["pending", None]},
         "stripe_connect_account_id": {"$exists": True, "$ne": None}},
        {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1}
    ).to_list(50)

    # Contacts Syndicat non traités
    contacts = await _db.contact_requests.find(
        {"status": "pending"},
        {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "created_at": 1}
    ).to_list(50)

    # Comptes utilisateurs en attente d'activation
    pending_users = await _db.users.find(
        {"status": "pending"},
        {"_id": 0, "id": 1, "email": 1, "first_name": 1, "last_name": 1, "created_at": 1}
    ).to_list(50)

    # Books à valider
    books = await _db.portfolios.find(
        {"validation_status": "pending"},
        {"_id": 0, "id": 1, "user_name": 1, "created_at": 1}
    ).to_list(50)

    return {
        "listings":       {"items": listings,       "count": len(listings),       "label": "Annonce(s) Citadelle à valider",     "type": "listing",      "link": "/syndicat-admin/citadelle/annonces"},
        "transactions":   {"items": transactions,   "count": len(transactions),   "label": "Transaction(s) en attente admin",    "type": "transaction",  "link": "/syndicat-admin/citadelle/transactions"},
        "service_orders": {"items": service_orders, "count": len(service_orders), "label": "Commande(s) service en attente",     "type": "service_order","link": "/syndicat-admin/citadelle/services"},
        "kyc":            {"items": kyc_users,       "count": len(kyc_users),     "label": "Vérification(s) KYC en attente",     "type": "kyc",          "link": "/syndicat-admin/citadelle/utilisateurs"},
        "contacts":       {"items": contacts,        "count": len(contacts),      "label": "Contact(s) Syndicat non traité(s)",  "type": "contact",      "link": "/syndicat-admin/contacts"},
        "pending_users":  {"items": pending_users,   "count": len(pending_users), "label": "Compte(s) utilisateur en attente",  "type": "user",         "link": "/syndicat-admin/utilisateurs"},
        "books":          {"items": books,            "count": len(books),         "label": "Book(s) à valider",                 "type": "book",         "link": "/syndicat-admin/validation-books"},
    }


async def get_total_alert_count() -> int:
    summary = await get_alert_summary()
    return sum(v["count"] for v in summary.values())


async def send_push_to_all_admins(title: str, body: str, url: str = "/admin-live"):
    """Envoie une push notification à tous les appareils enregistrés."""
    if _db is None:
        return

    subscriptions = await _db.admin_push_subscriptions.find({}).to_list(100)
    if not subscriptions:
        return

    payload = json.dumps({"title": title, "body": body, "url": url})

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
                },
                data=payload,
                vapid_private_key=_get_vapid_private_key(),
                vapid_claims={"sub": _VAPID_SUBJECT},
            )
        except WebPushException as e:
            logger.warning(f"Push échoué pour {sub.get('endpoint', '')[:40]}: {e}")
            # Abonnement expiré/invalide (410, 404) ou clés de chiffrement illisibles (response None) → purge
            if e.response is None or e.response.status_code in (400, 404, 410):
                await _db.admin_push_subscriptions.delete_one({"endpoint": sub["endpoint"]})
        except ValueError as e:
            # Données d'abonnement corrompues (clés illisibles) : purger sans bloquer les autres envois
            logger.warning(f"Abonnement push corrompu supprimé ({sub.get('endpoint', '')[:40]}): {e}")
            await _db.admin_push_subscriptions.delete_one({"endpoint": sub["endpoint"]})
        except Exception as e:
            # Toute autre erreur (réseau, timeout…) : on log et on continue avec les abonnements suivants
            logger.error(f"Push: erreur inattendue pour {sub.get('endpoint', '')[:40]}: {e}")


async def check_and_notify():
    """
    Tâche planifiée : compare les compteurs actuels aux précédents.
    Si une nouvelle alerte est détectée → envoie une push notification.
    """
    global _last_alert_counts
    if _db is None:
        return

    try:
        summary = await get_alert_summary()
        current_counts = {k: v["count"] for k, v in summary.items()}

        new_alerts = []
        for key, count in current_counts.items():
            prev = _last_alert_counts.get(key, 0)
            if count > prev:
                diff = count - prev
                new_alerts.append(f"+{diff} {summary[key]['label']}")

        if new_alerts:
            title = "Papa en Mousse — Nouvelle alerte"
            body  = " | ".join(new_alerts[:3])
            await send_push_to_all_admins(title, body, "/admin-live")
            logger.info(f"Push envoyée : {body}")

        _last_alert_counts = current_counts

    except Exception as e:
        logger.error(f"Erreur check_and_notify: {e}")
