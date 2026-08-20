#!/usr/bin/env python3
"""
Script de génération des thumbnails 600px pour les images d'annonces existantes.
À exécuter UNE SEULE FOIS sur le VPS après déploiement.

Usage :
    /var/www/syndicatducode.fr/backend/venv/bin/python3 /var/www/syndicatducode.fr/deploy/generate_thumbs.py
"""

import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

UPLOADS_DIR = Path("/var/www/syndicatducode.fr/backend/uploads/citadelle")
THUMB_SIDE  = 600
QUALITY     = 75

try:
    from PIL import Image as PilImage
except ImportError:
    log.error("Pillow non installé. Lancez : pip install Pillow")
    sys.exit(1)

def generate_thumb(src: Path) -> bool:
    dst = src.with_stem(src.stem + "_thumb")
    if dst.exists():
        log.info(f"  [SKIP] {src.name} → thumb déjà présent")
        return False
    try:
        img = PilImage.open(src).convert("RGB")
        if img.width > THUMB_SIDE or img.height > THUMB_SIDE:
            img.thumbnail((THUMB_SIDE, THUMB_SIDE), PilImage.LANCZOS)
        img.save(dst, "WebP", quality=QUALITY, method=4)
        gain = src.stat().st_size - dst.stat().st_size
        log.info(f"  [OK]   {dst.name} ({dst.stat().st_size // 1024} KB) | gain {gain // 1024} KB")
        return True
    except Exception as e:
        log.warning(f"  [ERR]  {src.name}: {e}")
        return False

def main():
    if not UPLOADS_DIR.exists():
        log.error(f"Dossier introuvable : {UPLOADS_DIR}")
        sys.exit(1)

    # Uniquement les .webp qui ne sont PAS déjà des thumbs
    sources = [
        f for f in UPLOADS_DIR.glob("*.webp")
        if not f.stem.endswith("_thumb")
    ]
    log.info(f"Images à traiter : {len(sources)}")

    done = 0
    skipped = 0
    for src in sorted(sources):
        if generate_thumb(src):
            done += 1
        else:
            skipped += 1

    log.info("")
    log.info(f"Terminé : {done} thumbnails générés | {skipped} déjà présents")

if __name__ == "__main__":
    main()
