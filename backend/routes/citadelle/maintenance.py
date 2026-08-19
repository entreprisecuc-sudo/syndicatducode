"""
Maintenance admin — La Citadelle Numérique.
Purge des données de test/factices responsables des NDR (bounces) quotidiens :
utilisateurs, annonces (enchères incluses) et abonnés newsletter dont l'adresse
email appartient à un domaine factice (EMAIL_BLOCKED_DOMAINS) ou dont l'annonce
porte un titre de test ([TEST].../TEST_...).
"""

import re
import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from config.settings import EMAIL_BLOCKED_DOMAINS
from routes.citadelle.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Maintenance"])

_db = None


def set_database(database):
    global _db
    _db = database


class PurgeRequest(BaseModel):
    dry_run: bool = True  # True = simulation (aucune suppression), False = suppression réelle


def _domain_regex() -> str:
    doms = "|".join(re.escape(d) for d in EMAIL_BLOCKED_DOMAINS)
    return rf"@({doms})$"


# Titres d'annonces de démonstration : "[TEST] ..." ou "TEST_..."
_TITLE_REGEX = r"^(\[TEST\]|TEST_)"


@router.post("/admin/maintenance/purge-test-data")
async def purge_test_data(
    body: PurgeRequest,
    current_user: dict = Depends(require_admin),
):
    """
    Supprime les données de test à l'origine des emails automatiques rebondissants.
    Par défaut en mode simulation (dry_run=True) : renvoie uniquement les comptages
    et des échantillons. Passer dry_run=false pour supprimer réellement.
    Ne supprime JAMAIS un compte admin.
    """
    email_rx = {"$regex": _domain_regex(), "$options": "i"}
    title_rx = {"$regex": _TITLE_REGEX, "$options": "i"}

    users_q = {"email": email_rx, "role": {"$ne": "admin"}}
    listings_q = {"$or": [{"seller_email": email_rx}, {"title": title_rx}]}
    subs_q = {"email": email_rx}

    users_count = await _db.users.count_documents(users_q)
    listings_count = await _db.citadelle_listings.count_documents(listings_q)
    subs_count = await _db.citadelle_newsletter_subscriptions.count_documents(subs_q)

    # Échantillons (max 25) pour vérification avant/après
    user_samples = await _db.users.find(users_q, {"_id": 0, "email": 1}).limit(25).to_list(25)
    listing_samples = await _db.citadelle_listings.find(
        listings_q, {"_id": 0, "title": 1, "seller_email": 1, "status": 1, "is_auction": 1}
    ).limit(25).to_list(25)
    sub_samples = await _db.citadelle_newsletter_subscriptions.find(subs_q, {"_id": 0, "email": 1}).limit(25).to_list(25)

    report = {
        "dry_run": body.dry_run,
        "blocked_domains": EMAIL_BLOCKED_DOMAINS,
        "matched": {
            "users": users_count,
            "listings": listings_count,
            "newsletter_subscribers": subs_count,
        },
        "samples": {
            "users": [u.get("email") for u in user_samples],
            "listings": listing_samples,
            "newsletter_subscribers": [s.get("email") for s in sub_samples],
        },
        "deleted": {"users": 0, "listings": 0, "newsletter_subscribers": 0},
    }

    if not body.dry_run:
        del_users = await _db.users.delete_many(users_q)
        del_listings = await _db.citadelle_listings.delete_many(listings_q)
        del_subs = await _db.citadelle_newsletter_subscriptions.delete_many(subs_q)
        report["deleted"] = {
            "users": del_users.deleted_count,
            "listings": del_listings.deleted_count,
            "newsletter_subscribers": del_subs.deleted_count,
        }
        logger.warning(
            f"[Maintenance] Purge données de test par {current_user.get('email') or current_user.get('sub')} — "
            f"users={del_users.deleted_count}, listings={del_listings.deleted_count}, subs={del_subs.deleted_count}"
        )

    return report
