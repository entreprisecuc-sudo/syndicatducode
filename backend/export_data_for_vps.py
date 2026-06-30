"""
Script d'export — Données preview vers VPS
La Citadelle Numérique

Exporte les articles de blog et les services depuis le MongoDB preview
vers un fichier JSON qui sera importé sur le VPS.

Usage (environnement Emergent preview) :
    cd /app/backend && python export_data_for_vps.py
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
OUTPUT_FILE = ROOT_DIR / "data_for_vps.json"


async def run():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Articles de blog (publiés uniquement)
    articles = await db.citadelle_blog_posts.find(
        {"is_published": True},
        {"_id": 0}
    ).sort("published_at", 1).to_list(200)

    # Services actifs uniquement
    services = await db.citadelle_services.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(50)

    # Annonces fictives seed (statut sold, is_seed_data=True)
    sold_listings = await db.citadelle_listings.find(
        {"is_seed_data": True, "status": "sold"},
        {"_id": 0}
    ).to_list(50)

    client.close()

    data = {
        "articles_blog": articles,
        "services": services,
        "sold_listings": sold_listings,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    print(f"[Export] {len(articles)} articles + {len(services)} services + {len(sold_listings)} annonces vendues")
    print(f"[Export] Fichier généré : {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(run())
