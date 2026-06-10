"""
Service Scheduler — Newsletter La Citadelle Numérique
Gestion de l'envoi automatique du digest d'annonces via APScheduler
"""

import logging
import asyncio
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# ── État du module ─────────────────────────────────────────────────────────────

scheduler = AsyncIOScheduler()
_db = None

NEWSLETTER_JOB_ID = "citadelle_newsletter_digest"

LISTING_TYPE_LABELS = {
    "website": "Site internet",
    "ecommerce": "E-commerce",
    "saas": "SaaS",
    "webapp": "Application web",
    "social_account": "Réseau social",
}

DEFAULT_CONFIG = {
    "id": "main",
    "frequency": "weekly",      # weekly | biweekly | monthly
    "day_of_week": 4,           # 0=lundi … 4=vendredi … 6=dimanche
    "hour": 16,                  # heure locale du serveur (0-23)
    "max_listings": 10,
    "is_active": True,
    "last_run_at": None,
}


# ── Helpers DB ─────────────────────────────────────────────────────────────────

def set_database(database):
    """Injecte la référence à la base de données MongoDB."""
    global _db
    _db = database


async def get_or_create_config() -> dict:
    """Retourne la config newsletter depuis la DB (crée les valeurs par défaut si absente)."""
    config = await _db.citadelle_newsletter_config.find_one({"id": "main"}, {"_id": 0})
    if not config:
        cfg = {**DEFAULT_CONFIG, "updated_at": datetime.now(timezone.utc).isoformat()}
        await _db.citadelle_newsletter_config.insert_one(cfg)
        # Retirer _id ajouté par Motor
        cfg.pop("_id", None)
        return cfg
    return config


# ── Logique d'envoi ────────────────────────────────────────────────────────────

async def run_newsletter_digest():
    """
    Fonction principale exécutée par le scheduler.
    Récupère les nouvelles annonces et les envoie à tous les abonnés actifs.
    """
    if _db is None:
        logger.error("[Newsletter] Base de données non initialisée, envoi annulé.")
        return

    config = await get_or_create_config()

    if not config.get("is_active"):
        logger.info("[Newsletter] Envoi désactivé dans la configuration.")
        return

    # Vérification de la fréquence (évite les envois trop rapprochés)
    last_run = config.get("last_run_at")
    if last_run:
        last_run_dt = datetime.fromisoformat(last_run.replace("Z", "+00:00"))
        days_since = (datetime.now(timezone.utc) - last_run_dt).days
        min_days = {"weekly": 6, "biweekly": 13, "monthly": 27}.get(
            config.get("frequency", "weekly"), 6
        )
        if days_since < min_days:
            logger.info(
                f"[Newsletter] Fréquence non atteinte : {days_since} jour(s) depuis le dernier envoi "
                f"(minimum {min_days}). Envoi ignoré."
            )
            return

    # Période de recherche des annonces
    freq = config.get("frequency", "weekly")
    days_back = {"weekly": 7, "biweekly": 14, "monthly": 30}.get(freq, 7)
    since_dt = datetime.now(timezone.utc) - timedelta(days=days_back)

    max_listings = config.get("max_listings", 10)

    # Récupération des annonces publiées dans la période
    cursor = _db.citadelle_listings.find(
        {
            "status": "active",
            "published_at": {"$gte": since_dt.isoformat()},
        },
        {
            "_id": 0,
            "id": 1,
            "title": 1,
            "type": 1,
            "price": 1,
            "images": 1,
            "slug": 1,
            "short_description": 1,
        },
    ).sort("published_at", -1).limit(max_listings)

    listings = await cursor.to_list(max_listings)

    if not listings:
        logger.info("[Newsletter] Aucune nouvelle annonce dans la période, pas d'envoi.")
        await _db.citadelle_newsletter_config.update_one(
            {"id": "main"},
            {"$set": {"last_run_at": datetime.now(timezone.utc).isoformat()}},
        )
        return

    # Récupération des abonnés actifs
    subscribers = await _db.citadelle_newsletter_subscriptions.find(
        {"is_active": True}, {"_id": 0}
    ).to_list(20000)

    if not subscribers:
        logger.info("[Newsletter] Aucun abonné actif.")
        return

    logger.info(
        f"[Newsletter] Démarrage envoi : {len(listings)} annonce(s) → {len(subscribers)} abonné(s)."
    )

    # Import local pour éviter les imports circulaires au chargement du module
    from services.email_service import send_newsletter_digest_email

    sent = 0
    errors = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for subscriber in subscribers:
        success = send_newsletter_digest_email(
            to_email=subscriber["email"],
            listings=listings,
            unsubscribe_token=subscriber["unsubscribe_token"],
            period_days=days_back,
        )

        if success:
            sent += 1
            await _db.citadelle_newsletter_subscriptions.update_one(
                {"email": subscriber["email"]},
                {"$set": {"last_email_sent_at": now_iso}},
            )
        else:
            errors += 1
            # Si aucun compte lié → supprimer l'abonnement (email invalide/inexistant)
            if not subscriber.get("user_id"):
                await _db.citadelle_newsletter_subscriptions.delete_one(
                    {"email": subscriber["email"]}
                )
                logger.warning(
                    f"[Newsletter] Abonnement supprimé (email invalide, sans compte) : {subscriber['email']}"
                )

        # Petite pause entre les envois pour ne pas surcharger le serveur SMTP
        if sent % 50 == 0 and sent > 0:
            await asyncio.sleep(1)

    # Mise à jour du dernier envoi
    await _db.citadelle_newsletter_config.update_one(
        {"id": "main"},
        {"$set": {"last_run_at": now_iso}},
    )

    logger.info(f"[Newsletter] Envoi terminé : {sent} succès, {errors} erreur(s).")


# ── Gestion du scheduler ───────────────────────────────────────────────────────

def reschedule_newsletter_job(day_of_week: int, hour: int):
    """Reprogramme le job avec le nouveau jour et la nouvelle heure."""
    try:
        trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=0)
        if scheduler.get_job(NEWSLETTER_JOB_ID):
            scheduler.reschedule_job(NEWSLETTER_JOB_ID, trigger=trigger)
            logger.info(f"[Newsletter] Job reprogrammé → jour={day_of_week}, heure={hour}h.")
        else:
            scheduler.add_job(
                run_newsletter_digest,
                trigger=trigger,
                id=NEWSLETTER_JOB_ID,
                replace_existing=True,
            )
            logger.info(f"[Newsletter] Job créé → jour={day_of_week}, heure={hour}h.")
    except Exception as e:
        logger.error(f"[Newsletter] Erreur lors de la reprogrammation du job : {e}")


async def init_newsletter_scheduler():
    """
    Initialise le scheduler au démarrage de l'application.
    Charge la config depuis MongoDB et démarre le job planifié.
    """
    if _db is None:
        logger.error("[Newsletter] DB non disponible, scheduler non démarré.")
        return

    config = await get_or_create_config()

    trigger = CronTrigger(
        day_of_week=config.get("day_of_week", 4),
        hour=config.get("hour", 16),
        minute=0,
    )

    scheduler.add_job(
        run_newsletter_digest,
        trigger=trigger,
        id=NEWSLETTER_JOB_ID,
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"[Newsletter] Scheduler démarré → "
        f"jour={config.get('day_of_week', 4)}, heure={config.get('hour', 16)}h, "
        f"fréquence={config.get('frequency', 'weekly')}."
    )
