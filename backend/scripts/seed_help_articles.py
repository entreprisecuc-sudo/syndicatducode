"""
Seed idempotent des articles du Centre d'aide (collection citadelle_help_articles).
Importe / met à jour le contenu depuis scripts/seed/help_articles.json.
Upsert par `slug` : rejouable sans créer de doublons.

Usage (depuis backend/, avec le venv actif) :
    python scripts/seed_help_articles.py
Config lue depuis l'environnement (backend/.env) : MONGO_URL, DB_NAME.
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
if not MONGO_URL or not DB_NAME:
    sys.exit("ERREUR : MONGO_URL / DB_NAME absents de l'environnement.")

SEED_FILE = Path(__file__).resolve().parent / "seed" / "help_articles.json"
if not SEED_FILE.exists():
    sys.exit(f"ERREUR : fichier seed introuvable : {SEED_FILE}")

articles = json.loads(SEED_FILE.read_text(encoding="utf-8"))
if not articles:
    sys.exit("ERREUR : fichier seed vide.")

client = MongoClient(MONGO_URL)
coll = client[DB_NAME].citadelle_help_articles

coll.create_index("slug", unique=True)

ops = [
    UpdateOne({"slug": a["slug"]}, {"$set": a}, upsert=True)
    for a in articles
    if a.get("slug")
]
result = coll.bulk_write(ops, ordered=False)

print(f"Articles dans le fichier seed : {len(articles)}")
print(f"Insérés (nouveaux)            : {result.upserted_count}")
print(f"Mis à jour (existants)        : {result.modified_count}")
print(f"Total en base désormais       : {coll.count_documents({})}")
client.close()
