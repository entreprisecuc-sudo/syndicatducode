"""
Service Scheduler — Newsletter La Citadelle Numérique
Gestion de l'envoi automatique du digest d'annonces via APScheduler
"""

import logging
import asyncio
import re
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
LISTING_RELANCE_JOB_ID = "citadelle_listing_relance_check"

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


# Définition des 3 « fenêtres » d'articles affichées en bas de la newsletter
BLOG_NEWSLETTER_SECTIONS = [
    ("Derniers articles", {"$nin": ["guide-la-citadelle", "chroniques-la-garde"]}),
    ("Guides de La Citadelle", "guide-la-citadelle"),
    ("Chroniques de La Garde", "chroniques-la-garde"),
]


async def fetch_blog_sections(since_iso: str = None, per_section: int = 3) -> list:
    """
    Récupère les derniers articles publiés pour les 3 fenêtres de la newsletter.
    Si `since_iso` est fourni, ne prend que les articles publiés après cette date
    (articles de la semaine) ; sinon les plus récents (aperçu/envoi forcé).
    """
    if _db is None:
        return []
    proj = {"_id": 0, "title": 1, "slug": 1, "excerpt": 1, "category": 1, "published_at": 1}
    sections = []
    for label, cat_filter in BLOG_NEWSLETTER_SECTIONS:
        query = {"is_published": True, "category": cat_filter}
        if since_iso:
            query["published_at"] = {"$gte": since_iso}
        posts = await _db.citadelle_blog_posts.find(query, proj).sort("published_at", -1).limit(per_section).to_list(per_section)
        if posts:
            sections.append({"label": label, "posts": posts})
    return sections


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
    Job horaire — Détecte les messages non lus depuis > 24h et envoie
    un email digest groupé à chaque utilisateur concerné (acheteur OU vendeur).

    Règles :
    - 1 email max par conversation par utilisateur toutes les 24h (last_notified)
    - Si un utilisateur a plusieurs conversations en attente → 1 seul email groupé
    """
    if _db is None:
        logger.error("[Relances] DB non initialisée, check annulé.")
        return

    from services.email_service import send_unread_messages_digest_email

    now = datetime.now(timezone.utc)
    threshold_24h = (now - timedelta(hours=24)).isoformat()

    # Chercher toutes les conversations actives ayant eu une activité il y a > 24h
    cursor = _db.citadelle_conversations.find(
        {
            "updated_at": {"$lt": threshold_24h},
            "is_blocked": {"$ne": True},
        },
        {"_id": 0},
    )
    conversations = await cursor.to_list(500)

    if not conversations:
        logger.debug("[Relances] Aucune conversation candidate à la relance.")
        return

    # Regrouper les conversations en attente par utilisateur
    # Format : {user_id: {"email": str, "conversations": [conv_info, ...]}}
    pending_by_user: dict = {}

    for conv in conversations:
        buyer_id  = conv.get("buyer_id")
        seller_id = conv.get("seller_id")
        messages  = conv.get("messages", [])
        last_read = conv.get("last_read", {})
        last_notified = conv.get("last_notified", {})

        for participant_id, participant_email in [
            (buyer_id,  conv.get("buyer_email",  "")),
            (seller_id, conv.get("seller_email", "")),
        ]:
            if not participant_id or not participant_email:
                continue

            # Messages non lus par ce participant, envoyés il y a > 24h
            user_last_read = last_read.get(str(participant_id), "1970-01-01T00:00:00+00:00")
            unread_old = [
                m for m in messages
                if m.get("sender_id") != participant_id          # pas ses propres messages
                and m.get("sent_at", "") > user_last_read         # non lu
                and m.get("sent_at", "") < threshold_24h          # > 24h sans réponse
            ]

            if not unread_old:
                continue

            # Anti-spam : vérifier last_notified pour cette conversation
            last_ts = last_notified.get(str(participant_id))
            if last_ts:
                try:
                    last_dt = datetime.fromisoformat(last_ts)
                    if last_dt.tzinfo is None:
                        last_dt = last_dt.replace(tzinfo=timezone.utc)
                    if (now - last_dt).total_seconds() < 86400:
                        continue  # Notifié trop récemment pour cette conversation
                except (ValueError, TypeError):
                    pass

            # Collecter les infos pour le digest
            last_msg = unread_old[-1]
            conv_info = {
                "conv_id":       conv.get("id"),
                "listing_title": conv.get("listing_title", ""),
                "unread_count":  len(unread_old),
                "last_preview":  (last_msg.get("content") or "")[:150],
            }

            if participant_id not in pending_by_user:
                pending_by_user[participant_id] = {"email": participant_email, "conversations": []}
            pending_by_user[participant_id]["conversations"].append(conv_info)

    if not pending_by_user:
        logger.debug("[Relances] Aucun utilisateur à relancer ce cycle.")
        return

    # Envoyer 1 email digest par utilisateur
    reminders_sent = 0
    notif_ts = now.isoformat()

    for participant_id, data in pending_by_user.items():
        recipient_email = data["email"]
        convs = data["conversations"]

        success = send_unread_messages_digest_email(
            recipient_email=recipient_email,
            conversations=convs,
        )

        if success:
            reminders_sent += 1
            # Mettre à jour last_notified pour toutes les conversations incluses
            for conv_info in convs:
                await _db.citadelle_conversations.update_one(
                    {"id": conv_info["conv_id"]},
                    {"$set": {f"last_notified.{participant_id}": notif_ts}}
                )
            logger.info(
                f"[Relances] Digest envoyé à {recipient_email} "
                f"— {len(convs)} conversation(s) en attente."
            )

    if reminders_sent > 0:
        logger.info(f"[Relances] {reminders_sent} digest(s) envoyé(s) ce cycle.")



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

    # Récupération des 3 fenêtres d'articles (bas de newsletter)
    blog_since = None if force else (datetime.now(timezone.utc) - timedelta(days=days_back)).isoformat()
    blog_sections = await fetch_blog_sections(since_iso=blog_since)
    logger.info(f"[Newsletter] Fenêtres d'articles : {[(s['label'], len(s['posts'])) for s in blog_sections]}")

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
        "blog_sections_snapshot": blog_sections,  # Fenêtres d'articles pour l'aperçu
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
            blog_sections=blog_sections,
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
                # Pas d'enchère reçue : l'annonce redevient une annonce standard
                await _db.citadelle_listings.update_one(
                    {"id": listing_id},
                    {"$set": {
                        "auction_ends_at": None,
                        "is_auction": False,
                        "updated_at": now.isoformat(),
                    }}
                )

                # Créer une notice vendeur (pop-up à sa prochaine connexion)
                seller_id = listing["seller_id"]
                notice = {
                    "id": str(_uuid.uuid4()),
                    "user_id": seller_id,
                    "type": "auction_unsold",
                    "listing_id": listing_id,
                    "listing_title": listing["title"],
                    "listing_slug": listing.get("slug", ""),
                    "price": listing.get("price"),
                    "acknowledged": False,
                    "created_at": now.isoformat(),
                }
                await _db.citadelle_seller_notices.insert_one(notice)

                # Email d'accompagnement au vendeur (mêmes informations que le pop-up)
                seller = await _db.users.find_one({"id": seller_id}, {"_id": 0, "email": 1, "first_name": 1, "prenom": 1})
                if seller and seller.get("email"):
                    from services.email_service import send_citadelle_auction_unsold_email
                    send_citadelle_auction_unsold_email(
                        seller_email=seller["email"],
                        seller_name=seller.get("first_name") or seller.get("prenom") or "",
                        listing_title=listing["title"],
                        listing_slug=listing.get("slug", ""),
                        price=listing.get("price"),
                    )

                logger.info(f"[Enchère] Terminée sans gagnant → annonce standard: '{listing['title']}'")

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


def _compute_listing_quality(listing: dict) -> dict:
    """
    Calcule le score de qualité d'une annonce — miroir Python de listingQuality.js.
    Retourne {'pct': int, 'label': str, 'missing': list[str]}
    """
    def has_number(s):
        return bool(re.search(r'\d', s or ""))

    def length(s):
        return len((s or "").strip())

    def tech_filled(t):
        return len([x for x in t if x]) > 0 if isinstance(t, list) else length(str(t)) > 0

    nb_images = len([img for img in (listing.get("images") or []) if img])

    criteria = [
        {"weight": 10, "done": length(listing.get("title")) >= 15,
         "label": "Un titre clair d'au moins 15 caractères"},
        {"weight": 8,  "done": has_number(listing.get("title")),
         "label": "Un chiffre clé dans le titre (revenu, trafic…)"},
        {"weight": 10, "done": length(listing.get("short_description")) >= 80,
         "label": "Une accroche d'au moins 80 caractères"},
        {"weight": 12, "done": bool(listing.get("monthly_revenue")) and float(listing.get("monthly_revenue") or 0) > 0,
         "label": "Les revenus mensuels"},
        {"weight": 5,  "done": listing.get("monthly_charges") is not None and listing.get("monthly_charges") != "",
         "label": "Les charges mensuelles"},
        {"weight": 8,  "done": bool(listing.get("monthly_traffic")) and float(listing.get("monthly_traffic") or 0) > 0,
         "label": "Le trafic mensuel"},
        {"weight": 4,  "done": length(listing.get("traffic_sources")) > 0,
         "label": "Les sources de trafic"},
        {"weight": 6,  "done": bool(listing.get("age_months")),
         "label": "L'ancienneté de l'actif"},
        {"weight": 6,  "done": length(listing.get("niche")) > 0,
         "label": "La niche / le secteur"},
        {"weight": 14, "done": length(listing.get("description")) >= 300,
         "label": "Une description d'au moins 300 caractères"},
        {"weight": 6,  "done": tech_filled(listing.get("technologies") or []),
         "label": "Les technologies utilisées"},
        {"weight": 5,  "done": length(listing.get("ideal_buyer")) >= 30,
         "label": "Le profil du repreneur idéal"},
        {"weight": 4,  "done": length(listing.get("weaknesses")) >= 20,
         "label": "Les points faibles (honnêteté valorisée)"},
    ]

    if not listing.get("is_adult"):
        criteria.append({"weight": 14, "done": nb_images > 0,
                          "label": "Au moins une image (visuel de vente)"})
        criteria.append({"weight": 6,  "done": length(listing.get("url_preview")) > 0,
                          "label": "L'URL ou une démo du site"})

    total   = sum(c["weight"] for c in criteria)
    done    = sum(c["weight"] for c in criteria if c["done"])
    pct     = round((done / total) * 100) if total > 0 else 0
    missing = [c["label"] for c in criteria if not c["done"]]

    if pct >= 90:   label = "Score excellent"
    elif pct >= 70: label = "Bon score"
    elif pct >= 40: label = "Score à compléter"
    else:           label = "Score de départ"

    return {"pct": pct, "label": label, "missing": missing}


async def check_listing_relances():
    """
    Job quotidien (10h) — Envoie une relance aux vendeurs dont l'annonce active
    est en ligne depuis plus de 31 jours sans relance (ou relance > 60 jours).
    L'email inclut le score de qualité et des conseils personnalisés.
    """
    if _db is None:
        logger.error("[Relance Annonces] DB non initialisée, job annulé.")
        return

    from services.email_service.citadelle.listings import send_citadelle_listing_relance_email

    now        = datetime.now(timezone.utc)
    seuil_31j  = (now - timedelta(days=31)).isoformat()
    seuil_60j  = (now - timedelta(days=60)).isoformat()

    # Annonces actives depuis > 31 jours, sans relance envoyée ou relance > 60 jours
    cursor = _db.citadelle_listings.find(
        {
            "status": "active",
            "$and": [
                {
                    "$or": [
                        {"approved_at": {"$lt": seuil_31j}},
                        {"approved_at": {"$exists": False}, "created_at": {"$lt": seuil_31j}},
                        {"approved_at": None, "created_at": {"$lt": seuil_31j}},
                    ]
                },
                {
                    "$or": [
                        {"relance_sent_at": {"$exists": False}},
                        {"relance_sent_at": None},
                        {"relance_sent_at": {"$lt": seuil_60j}},
                    ]
                },
            ],
        },
        {"_id": 0},
    )
    listings = await cursor.to_list(200)

    if not listings:
        logger.info("[Relance Annonces] Aucune annonce candidate à la relance.")
        return

    sent = 0
    for listing in listings:
        seller_email = listing.get("seller_email")
        if not seller_email:
            continue

        # Calcul ancienneté
        date_ref_str = listing.get("approved_at") or listing.get("created_at")
        try:
            date_ref    = datetime.fromisoformat(date_ref_str.replace("Z", "+00:00"))
            days_online = (now - date_ref).days
        except Exception:
            days_online = 31

        quality = _compute_listing_quality(listing)

        ok = send_citadelle_listing_relance_email(
            to_email         = seller_email,
            seller_name      = seller_email,
            listing_title    = listing.get("title", ""),
            listing_slug     = listing.get("slug", ""),
            days_online      = days_online,
            quality_pct      = quality["pct"],
            quality_label    = quality["label"],
            missing_criteria = quality["missing"],
        )

        if ok:
            await _db.citadelle_listings.update_one(
                {"id": listing["id"]},
                {"$set": {"relance_sent_at": now.isoformat()}},
            )
            sent += 1

    logger.info(f"[Relance Annonces] {sent} email(s) de relance envoyé(s).")


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

    # ── Job 4 : Vérification des enchères terminées (toutes les 5 min) ─────────
    scheduler.add_job(
        check_ended_auctions,
        CronTrigger(minute="*/5"),
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

    # ── Job 6 : Relance annonces actives > 31 jours (10h chaque matin) ──────────
    scheduler.add_job(
        check_listing_relances,
        CronTrigger(hour=10, minute=0),
        id=LISTING_RELANCE_JOB_ID,
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"[Scheduler] Démarré — Newsletter: jour={config.get('day_of_week', 4)}, heure={config.get('hour', 16)}h | "
        f"Relances conversations: toutes les heures | Blog planifié: toutes les heures | "
        f"Enchères: vérification toutes les 5min | Digest enchères: 9h | "
        f"Relances annonces: 10h quotidien."
    )
