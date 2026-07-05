"""
Service Scheduler — Newsletter La Citadelle Numérique
Gestion de l'envoi automatique du digest d'annonces via APScheduler
"""

import logging
import asyncio
import uuid
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# ── État du module ─────────────────────────────────────────────────────────────

scheduler = AsyncIOScheduler()
_db = None

NEWSLETTER_JOB_ID = "citadelle_newsletter_digest"
BLOG_SCHEDULER_JOB_ID = "citadelle_blog_scheduled_publish"
AUCTION_CHECK_JOB_ID = "citadelle_auction_check"
AUCTION_DIGEST_JOB_ID = "citadelle_auction_daily_digest"

LISTING_TYPE_LABELS = {
    "website": "Site internet",
    "ecommerce": "E-commerce",
    "saas": "SaaS",
    "webapp": "Application web",
    "social_account": "Réseau social",
    "domain": "Nom de domaine",
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


async def publish_scheduled_posts():
    """
    Job horaire — Publie automatiquement les articles planifiés arrivés à échéance.
    Vérifie les articles avec scheduled_at <= maintenant et is_published == False.
    """
    if _db is None:
        return
    now = datetime.now(timezone.utc).isoformat()
    result = await _db.citadelle_blog_posts.update_many(
        {
            "is_published": False,
            "scheduled_at": {"$ne": None, "$lte": now},
        },
        {
            "$set": {
                "is_published": True,
                "published_at": now,
                "updated_at": now,
                "scheduled_at": None,
            }
        }
    )
    if result.modified_count > 0:
        logger.info(f"[Blog Scheduler] {result.modified_count} article(s) publié(s) automatiquement.")


async def check_unanswered_conversations():
    """
    Job horaire — Détecte les conversations où le vendeur n'a pas répondu depuis 24h.
    Envoie UNE SEULE relance par conversation dormante, jamais deux fois.
    """
    if _db is None:
        logger.error("[Relances] DB non initialisée, check annulé.")
        return

    from services.email_service import send_conversation_reminder_email

    now = datetime.now(timezone.utc)
    threshold_24h = now - timedelta(hours=24)

    # Conversations notifiées initialement mais sans relance encore envoyée
    cursor = _db.citadelle_conversations.find(
        {
            "seller_notified_at": {"$ne": None},
            "reminder_sent_at": None,
        },
        {"_id": 0, "id": 1, "seller_email": 1, "buyer_email": 1, "listing_title": 1,
         "seller_id": 1, "buyer_id": 1, "messages": 1},
    )
    conversations = await cursor.to_list(1000)

    if not conversations:
        logger.debug("[Relances] Aucune conversation éligible à la relance.")
        return

    reminders_sent = 0

    for conv in conversations:
        messages = conv.get("messages", [])
        if not messages:
            continue

        # Dernier message de la conversation
        last_msg = messages[-1]
        last_sender_id = last_msg.get("sender_id")
        last_sent_at_str = last_msg.get("sent_at")

        if not last_sent_at_str:
            continue

        # Analyser si c'est un message de l'acheteur (pas du vendeur, pas du système)
        seller_id = conv.get("seller_id")
        if last_sender_id == seller_id or last_sender_id == "system":
            # Vendeur a déjà répondu ou dernier message est système → pas de relance
            continue

        # Convertir la date du dernier message
        try:
            last_sent_dt = datetime.fromisoformat(last_sent_at_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            continue

        # Vérifier si plus de 24h sans réponse du vendeur
        if last_sent_dt > threshold_24h:
            continue  # Moins de 24h, pas encore le moment

        # Calculer le nombre d'heures écoulées
        hours_since = int((now - last_sent_dt).total_seconds() / 3600)

        # Envoyer la relance
        seller_email = conv.get("seller_email", "")
        if not seller_email:
            logger.warning(f"[Relances] seller_email manquant pour conversation {conv['id']}")
            continue

        success = send_conversation_reminder_email(
            seller_email=seller_email,
            listing_title=conv.get("listing_title", "Votre annonce"),
            buyer_email=conv.get("buyer_email", ""),
            conversation_id=conv["id"],
            hours_since=hours_since,
        )

        if success:
            # Marquer comme relancé → ne jamais renvoyer
            await _db.citadelle_conversations.update_one(
                {"id": conv["id"]},
                {"$set": {"reminder_sent_at": now.isoformat()}},
            )
            reminders_sent += 1
            logger.info(
                f"[Relances] Relance envoyée à {seller_email} "
                f"pour conversation {conv['id']} ({hours_since}h sans réponse)."
            )

    if reminders_sent > 0:
        logger.info(f"[Relances] {reminders_sent} relance(s) envoyée(s) ce cycle.")



async def run_newsletter_digest(force: bool = False):
    """
    Fonction principale exécutée par le scheduler.
    Récupère les nouvelles annonces et les envoie à tous les abonnés actifs.

    Args:
        force: Si True (envoi admin manuel), contourne le filtre de date des annonces
               et la vérification de fréquence. Envoie les dernières annonces actives.
    """
    if _db is None:
        logger.error("[Newsletter] Base de données non initialisée, envoi annulé.")
        return

    config = await get_or_create_config()

    if not config.get("is_active") and not force:
        logger.info("[Newsletter] Envoi désactivé dans la configuration.")
        return

    # Vérification de la fréquence (ignorée en mode force)
    if not force:
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
    max_listings = config.get("max_listings", 10)

    # Requête des annonces : filtre par date si automatique, dernières actives si forcé
    if force:
        cursor = _db.citadelle_listings.find(
            {"status": "active"},
            {
                "_id": 0, "id": 1, "title": 1, "type": 1, "price": 1,
                "images": 1, "slug": 1, "short_description": 1,
            },
        ).sort("published_at", -1).limit(max_listings)
        logger.info(f"[Newsletter] Envoi forcé (admin) — {max_listings} dernières annonces actives.")
    else:
        since_dt = datetime.now(timezone.utc) - timedelta(days=days_back)
        cursor = _db.citadelle_listings.find(
            {
                "status": "active",
                "published_at": {"$gte": since_dt.isoformat()},
            },
            {
                "_id": 0, "id": 1, "title": 1, "type": 1, "price": 1,
                "images": 1, "slug": 1, "short_description": 1,
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

    # ── Création du record d'historique ───────────────────────────────────────
    history_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    history_record = {
        "id": history_id,
        "sent_at": now_iso,
        "period_days": days_back,
        "frequency": freq,
        "listings_count": len(listings),
        "listings_snapshot": listings,  # Stocké pour reconstituer l'aperçu
        "total_sent": len(subscribers),
        "total_delivered": 0,
        "total_failed": 0,
        "opens": 0,
        "clicks": 0,
    }
    await _db.citadelle_newsletter_history.insert_one(history_record)
    logger.info(f"[Newsletter] Historique créé : {history_id}")

    sent = 0
    errors = 0

    for subscriber in subscribers:
        success = send_newsletter_digest_email(
            to_email=subscriber["email"],
            listings=listings,
            unsubscribe_token=subscriber["unsubscribe_token"],
            period_days=days_back,
            history_id=history_id,
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

    # Mise à jour du dernier envoi + finalisation historique
    await _db.citadelle_newsletter_config.update_one(
        {"id": "main"},
        {"$set": {"last_run_at": now_iso}},
    )
    await _db.citadelle_newsletter_history.update_one(
        {"id": history_id},
        {"$set": {"total_delivered": sent, "total_failed": errors}},
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


async def check_ended_auctions():
    """
    Vérifie toutes les 30 min les enchères terminées.
    Si un gagnant existe : crée la transaction et envoie l'email de félicitations.
    """
    if _db is None:
        return
    try:
        from services.email_service import send_citadelle_auction_winner_email
        from config.settings import CITADELLE_URL
        import uuid as _uuid

        now = datetime.now(timezone.utc)
        cursor = _db.citadelle_listings.find({
            "is_auction": True,
            "status": "active",
            "auction_ends_at": {"$lte": now.isoformat()},
            "auction_winner_transaction_id": None,
        }, {"_id": 0})

        async for listing in cursor:
            listing_id = listing["id"]
            winner_id = listing.get("auction_current_bidder_id")
            winner_email = listing.get("auction_current_bidder_email")
            winner_name = listing.get("auction_current_bidder_name", "")
            amount = listing.get("auction_current_bid", 0)

            if winner_id:
                # Créer la transaction automatiquement
                tx_id = str(_uuid.uuid4())
                tx_now = now.isoformat()
                transaction = {
                    "id": tx_id,
                    "listing_id": listing_id,
                    "listing_title": listing["title"],
                    "listing_slug": listing.get("slug", ""),
                    "buyer_id": winner_id,
                    "buyer_email": winner_email,
                    "seller_id": listing["seller_id"],
                    "seller_email": listing.get("seller_email", ""),
                    "status": "offer_accepted",
                    "is_auction": True,
                    "offer_amount": amount,
                    "offer_message": "Enchère remportée automatiquement.",
                    "counter_amount": None,
                    "counter_message": None,
                    "payment_id": None,
                    "payment_amount": amount,
                    "credentials": None,
                    "credentials_transmitted": False,
                    "messages": [{
                        "id": str(_uuid.uuid4()),
                        "sender_id": "system",
                        "content": f"Enchère remportée : {amount:,.0f} €. Procédez au paiement pour finaliser l'acquisition.",
                        "sent_at": tx_now,
                        "type": "system"
                    }],
                    "dispute_messages": [],
                    "created_at": tx_now,
                    "updated_at": tx_now,
                    "completed_at": None,
                    "paid_at": None,
                    "disputed_at": None,
                    "dispute_reason": None,
                }
                await _db.citadelle_transactions.insert_one(transaction)
                transaction.pop("_id", None)

                # Marquer l'annonce comme vendue
                await _db.citadelle_listings.update_one(
                    {"id": listing_id},
                    {"$set": {
                        "status": "sold",
                        "auction_winner_transaction_id": tx_id,
                        "updated_at": tx_now,
                    }}
                )

                # Email de félicitations au gagnant
                send_citadelle_auction_winner_email(
                    winner_email=winner_email,
                    winner_name=winner_name,
                    listing_title=listing["title"],
                    listing_slug=listing.get("slug", ""),
                    amount=amount,
                    transaction_id=tx_id,
                )
                logger.info(f"[Enchère] Clôturée: '{listing['title']}' — gagnant: {winner_email} ({amount}€)")
            else:
                # Pas d'enchère reçue : l'annonce reste active mais l'enchère est terminée
                await _db.citadelle_listings.update_one(
                    {"id": listing_id},
                    {"$set": {
                        "auction_ends_at": None,
                        "updated_at": now.isoformat(),
                    }}
                )
                logger.info(f"[Enchère] Terminée sans gagnant: '{listing['title']}'")

    except Exception as e:
        logger.error(f"[Enchère Scheduler] Erreur check_ended_auctions: {e}")


async def send_auction_daily_digests():
    """Envoie chaque matin à 9h un email au vendeur avec l'état de son enchère en cours."""
    if _db is None:
        return
    try:
        from services.email_service import send_citadelle_auction_daily_digest_email
        now = datetime.now(timezone.utc)

        cursor = _db.citadelle_listings.find({
            "is_auction": True,
            "status": "active",
            "auction_ends_at": {"$gt": now.isoformat()},
        }, {"_id": 0})

        async for listing in cursor:
            seller_email = listing.get("seller_email", "")
            current_bid = listing.get("auction_current_bid") or listing.get("price", 0)
            nb_bids = len(listing.get("auction_bids", []))
            if seller_email:
                send_citadelle_auction_daily_digest_email(
                    seller_email=seller_email,
                    seller_name=listing.get("seller_email", ""),
                    listing_title=listing["title"],
                    listing_slug=listing.get("slug", ""),
                    current_bid=current_bid,
                    nb_bids=nb_bids,
                    auction_ends_at=listing["auction_ends_at"],
                )
        logger.info("[Enchère Scheduler] Digests quotidiens envoyés aux vendeurs.")
    except Exception as e:
        logger.error(f"[Enchère Scheduler] Erreur send_auction_daily_digests: {e}")


async def init_newsletter_scheduler():
    """
    Initialise le scheduler au démarrage de l'application.
    Charge la config depuis MongoDB et démarre les jobs planifiés.
    """
    if _db is None:
        logger.error("[Newsletter] DB non disponible, scheduler non démarré.")
        return

    # ── Job 1 : Digest newsletter ─────────────────────────────────────────────
    config = await get_or_create_config()

    trigger_newsletter = CronTrigger(
        day_of_week=config.get("day_of_week", 4),
        hour=config.get("hour", 16),
        minute=0,
    )

    scheduler.add_job(
        run_newsletter_digest,
        trigger=trigger_newsletter,
        id=NEWSLETTER_JOB_ID,
        replace_existing=True,
    )

    # ── Job 2 : Relance conversations non répondues (toutes les heures) ───────
    scheduler.add_job(
        check_unanswered_conversations,
        CronTrigger(minute=0),  # Toutes les heures pile
        id="citadelle_conversation_reminders",
        replace_existing=True,
    )

    # ── Job 3 : Publication automatique des articles planifiés (toutes les heures) ─
    scheduler.add_job(
        publish_scheduled_posts,
        CronTrigger(minute=5),  # À :05 de chaque heure
        id=BLOG_SCHEDULER_JOB_ID,
        replace_existing=True,
    )

    # ── Job 4 : Vérification des enchères terminées (toutes les 30 min) ─────────
    scheduler.add_job(
        check_ended_auctions,
        CronTrigger(minute="*/30"),
        id=AUCTION_CHECK_JOB_ID,
        replace_existing=True,
    )

    # ── Job 5 : Digest quotidien enchères aux vendeurs (9h chaque matin) ────────
    scheduler.add_job(
        send_auction_daily_digests,
        CronTrigger(hour=9, minute=0),
        id=AUCTION_DIGEST_JOB_ID,
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"[Scheduler] Démarré — Newsletter: jour={config.get('day_of_week', 4)}, heure={config.get('hour', 16)}h | "
        f"Relances conversations: toutes les heures | Blog planifié: toutes les heures | "
        f"Enchères: vérification toutes les 30min | Digest enchères: 9h."
    )
