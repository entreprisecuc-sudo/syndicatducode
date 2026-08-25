#!/usr/bin/env python3
"""
Script de nettoyage des comptes de test — La Citadelle Numérique.

Supprime définitivement les comptes de test et toutes leurs données
associées (annonces, transactions, conversations, abonnements newsletter,
enchères, notices vendeur) depuis la base MongoDB de production.

Usage :
    /var/www/syndicatducode.fr/backend/venv/bin/python3 \
        /var/www/syndicatducode.fr/deploy/cleanup_test_accounts.py

Le script affiche le détail de chaque suppression.
"""

import os
import sys
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

# ── Emails de comptes test à supprimer ────────────────────────────────────────
TEST_EMAILS = {
    "jean.test.citadelle@test.fr",
    "vendeur.demo@citadelle.fr",
    "test.vendeur@citadelle.fr",
    "test.acheteur@citadelle.fr",
    "marie.testui@citadelle-test.fr",
}

# ── Connexion MongoDB ─────────────────────────────────────────────────────────
load_dotenv(dotenv_path="/var/www/syndicatducode.fr/backend/.env")

mongo_url = os.environ.get("MONGO_URL")
db_name   = os.environ.get("DB_NAME")

if not mongo_url or not db_name:
    log.error("MONGO_URL ou DB_NAME non défini dans .env")
    sys.exit(1)

db = MongoClient(mongo_url)[db_name]


def _del(collection_name: str, query: dict) -> int:
    """Supprime les documents correspondants et retourne le nombre supprimé."""
    result = db[collection_name].delete_many(query)
    if result.deleted_count:
        log.info(f"  [{collection_name}] {result.deleted_count} document(s) supprimé(s)")
    else:
        log.info(f"  [{collection_name}] Aucun document trouvé")
    return result.deleted_count


def main():
    log.info("=" * 60)
    log.info("Nettoyage des comptes de test — La Citadelle Numérique")
    log.info("=" * 60)
    log.info(f"Emails ciblés : {', '.join(sorted(TEST_EMAILS))}")
    log.info("")

    total = 0

    # ── Comptes utilisateur ───────────────────────────────────────────────────
    log.info("[ Comptes utilisateur ]")
    total += _del("users", {"email": {"$in": list(TEST_EMAILS)}})

    # ── Annonces (vendeur ou champ seller_email) ──────────────────────────────
    log.info("[ Annonces ]")
    total += _del("citadelle_listings", {"seller_email": {"$in": list(TEST_EMAILS)}})
    # Annonces de démo marquées explicitement
    total += _del("citadelle_listings", {"demo_seed": True})
    total += _del("citadelle_listings", {"test_scenario_seed": True})

    # ── Transactions ──────────────────────────────────────────────────────────
    log.info("[ Transactions ]")
    total += _del("citadelle_transactions", {
        "$or": [
            {"buyer_email":  {"$in": list(TEST_EMAILS)}},
            {"seller_email": {"$in": list(TEST_EMAILS)}},
        ]
    })
    total += _del("citadelle_transactions", {"demo_seed": True})
    total += _del("citadelle_transactions", {"test_scenario_seed": True})

    # ── Conversations ─────────────────────────────────────────────────────────
    log.info("[ Conversations ]")
    total += _del("citadelle_conversations", {
        "$or": [
            {"buyer_email":  {"$in": list(TEST_EMAILS)}},
            {"seller_email": {"$in": list(TEST_EMAILS)}},
        ]
    })
    total += _del("citadelle_conversations", {"demo_seed": True})

    # ── Abonnements newsletter ────────────────────────────────────────────────
    log.info("[ Abonnements newsletter ]")
    total += _del("citadelle_newsletter_subscriptions", {"email": {"$in": list(TEST_EMAILS)}})

    # ── Notices vendeur ───────────────────────────────────────────────────────
    log.info("[ Notices vendeur ]")
    total += _del("citadelle_seller_notices", {"demo_seed": True})

    # ── Offres / enchères liées ───────────────────────────────────────────────
    log.info("[ Offres / enchères liées ]")
    for coll in ["citadelle_offers", "citadelle_bids"]:
        try:
            total += _del(coll, {
                "$or": [
                    {"buyer_email":  {"$in": list(TEST_EMAILS)}},
                    {"seller_email": {"$in": list(TEST_EMAILS)}},
                ]
            })
        except Exception:
            pass  # Collection inexistante selon la version

    log.info("")
    log.info("=" * 60)
    log.info(f"Nettoyage terminé : {total} document(s) supprimé(s) au total.")
    log.info("Ces comptes et leurs données ne déclencheront plus d'emails.")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
