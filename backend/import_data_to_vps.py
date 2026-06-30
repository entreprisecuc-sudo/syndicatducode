"""
Script d'import — Données preview vers VPS
La Citadelle Numérique

Importe les articles de blog, services et annonces vendues depuis data_for_vps.json
vers le MongoDB de production.

Idempotent : ne réinsère pas les éléments déjà présents (vérification par slug/title/id).

Usage (VPS, après git pull) :
    cd /var/www/syndicatducode.fr/backend
    source venv/bin/activate
    python import_data_to_vps.py
"""

import asyncio
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
INPUT_FILE = ROOT_DIR / "data_for_vps.json"


async def run():
    if not INPUT_FILE.exists():
        print(f"[Erreur] Fichier introuvable : {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # ── 1. Articles de blog ───────────────────────────────────────────────────
    articles = data.get("articles_blog", [])
    articles_inseres = 0
    for article in articles:
        slug = article.get("slug")
        if not slug:
            continue
        exists = await db.citadelle_blog_posts.find_one({"slug": slug}, {"_id": 1})
        if not exists:
            await db.citadelle_blog_posts.insert_one(article)
            articles_inseres += 1

    print(f"[Import] Articles blog : {articles_inseres} insérés / {len(articles)} total")

    # ── 2. Services ───────────────────────────────────────────────────────────
    services = data.get("services", [])
    services_inseres = 0
    for service in services:
        service_id = service.get("id")
        if not service_id:
            continue
        exists = await db.citadelle_services.find_one({"id": service_id}, {"_id": 1})
        if not exists:
            await db.citadelle_services.insert_one(service)
            services_inseres += 1

    print(f"[Import] Services : {services_inseres} insérés / {len(services)} total")

    # ── 3. Annonces vendues seed ──────────────────────────────────────────────
    sold_listings = data.get("sold_listings", [])
    listings_inseres = 0
    already_seeded = await db.citadelle_listings.count_documents({"is_seed_data": True})

    if already_seeded == 0:
        for listing in sold_listings:
            await db.citadelle_listings.insert_one(listing)
            listings_inseres += 1
        print(f"[Import] Annonces vendues : {listings_inseres} insérées")
    else:
        print(f"[Import] Annonces vendues : déjà présentes ({already_seeded}), aucune insertion")

    client.close()
    print("[Import] Terminé avec succès.")


if __name__ == "__main__":
    asyncio.run(run())
