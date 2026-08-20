#!/usr/bin/env python3
"""
Script de migration des images d'annonces → WebP optimisé
À exécuter UNE SEULE FOIS sur le VPS après déploiement.

Usage :
    cd /var/www/syndicatducode.fr/backend
    python3 /var/www/syndicatducode.fr/deploy/migrate_images_webp.py

Ce script :
  1. Parcourt toutes les images existantes dans uploads/citadelle/
  2. Convertit chaque image en WebP (max 1400px, qualité 82)
  3. Met à jour les URLs en base MongoDB
  4. Conserve les fichiers originaux avec l'extension .bak (supprimables après vérification)
"""

import os
import io
import sys
import logging
from pathlib import Path

# Lecture manuelle du .env (pas besoin de python-dotenv)
def load_env(path):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, val = line.partition('=')
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))
    except FileNotFoundError:
        pass

load_env("/var/www/syndicatducode.fr/backend/.env")

from PIL import Image as PilImage
from pymongo import MongoClient

MONGO_URL  = os.environ["MONGO_URL"]
DB_NAME    = os.environ["DB_NAME"]
UPLOADS_DIR = Path("/var/www/syndicatducode.fr/backend/uploads/citadelle")
MAX_SIDE   = 1400
QUALITY    = 82
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif"}

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

# ── Connexion MongoDB ──────────────────────────────────────────────────────────
client = MongoClient(MONGO_URL)
db     = client[DB_NAME]
col    = db["citadelle_listings"]

# ── Migration ──────────────────────────────────────────────────────────────────
def convert_image(src_path: Path) -> Path | None:
    """Convertit une image en WebP et retourne le nouveau chemin."""
    try:
        img = PilImage.open(src_path).convert("RGB")
        if img.width > MAX_SIDE or img.height > MAX_SIDE:
            img.thumbnail((MAX_SIDE, MAX_SIDE), PilImage.LANCZOS)
        dst_path = src_path.with_suffix(".webp")
        img.save(dst_path, "WebP", quality=QUALITY, method=4)
        return dst_path
    except Exception as e:
        log.warning(f"  Conversion échouée ({src_path.name}): {e}")
        return None


def main():
    if not UPLOADS_DIR.exists():
        log.error(f"Dossier introuvable : {UPLOADS_DIR}")
        sys.exit(1)

    images = [f for f in UPLOADS_DIR.iterdir() if f.suffix.lower() in IMAGE_EXTS]
    log.info(f"Images à traiter : {len(images)}")

    converted = 0
    skipped   = 0
    errors    = 0
    saved_kb  = 0

    for src in images:
        dst = src.with_suffix(".webp")

        # Déjà converti ? (fichier .webp existe déjà avec même base)
        if dst.exists():
            log.info(f"  [SKIP] {src.name} → déjà converti")
            skipped += 1
            continue

        orig_size = src.stat().st_size
        log.info(f"  [CONV] {src.name} ({orig_size // 1024} KB) ...")

        new_path = convert_image(src)
        if new_path is None:
            errors += 1
            continue

        new_size  = new_path.stat().st_size
        gain_kb   = (orig_size - new_size) // 1024
        saved_kb += gain_kb
        log.info(f"         → {new_path.name} ({new_size // 1024} KB) | -{gain_kb} KB")

        # Ancienne URL et nouvelle URL dans MongoDB
        old_url = f"/uploads/citadelle/{src.name}"
        new_url = f"/uploads/citadelle/{new_path.name}"

        # Mettre à jour les annonces qui contiennent cette image
        result = col.update_many(
            {"images": old_url},
            {"$set": {"images.$[elem]": new_url}},
            array_filters=[{"elem": old_url}]
        )
        if result.modified_count > 0:
            log.info(f"         → DB mis à jour ({result.modified_count} annonce(s))")

        # Renommer l'original en .bak (sécurité — supprimable après vérification)
        src.rename(src.with_suffix(src.suffix + ".bak"))

        converted += 1

    log.info("")
    log.info("═" * 50)
    log.info(f"Terminé : {converted} converties | {skipped} déjà OK | {errors} erreurs")
    log.info(f"Espace libéré estimé : {saved_kb // 1024} MB")
    log.info("")
    log.info("Pour supprimer les backups une fois la prod vérifiée :")
    log.info(f"  find {UPLOADS_DIR} -name '*.bak' -delete")


if __name__ == "__main__":
    main()
