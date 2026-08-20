#!/usr/bin/env python3
"""
Script de génération des thumbnails pour les images d'annonces existantes.
Génère deux formats :
  - _thumb.webp : 900px (écrans intermédiaires)
  - _small.webp : 400px (mobile / cartes)

À exécuter sur le VPS après déploiement ou après une mise à jour du backend.

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
THUMB_SIDE  = 900
SMALL_SIDE  = 400
QUALITY     = 75

try:
    from PIL import Image as PilImage
except ImportError:
    log.error("Pillow non installé. Lancez : pip install Pillow")
    sys.exit(1)


def generate_variant(src: Path, suffix: str, max_side: int) -> bool:
    """Génère un thumbnail redimensionné avec le suffix donné (_thumb ou _small)."""
    dst = src.with_stem(src.stem + suffix)
    if dst.exists():
        log.info(f"  [SKIP] {dst.name} (déjà présent)")
        return False
    try:
        img = PilImage.open(src).convert("RGB")
        if img.width > max_side or img.height > max_side:
            img.thumbnail((max_side, max_side), PilImage.LANCZOS)
        img.save(dst, "WebP", quality=QUALITY, method=4)
        gain = src.stat().st_size - dst.stat().st_size
        log.info(f"  [OK]   {dst.name} ({dst.stat().st_size // 1024} KB) | gain {gain // 1024} KB")
        return True
    except Exception as e:
        log.warning(f"  [ERR]  {src.name} → {suffix}: {e}")
        return False


def main():
    if not UPLOADS_DIR.exists():
        log.error(f"Dossier introuvable : {UPLOADS_DIR}")
        sys.exit(1)

    # Uniquement les .webp sources (ni _thumb, ni _small)
    sources = [
        f for f in UPLOADS_DIR.glob("*.webp")
        if not f.stem.endswith("_thumb") and not f.stem.endswith("_small")
    ]
    log.info(f"Images sources détectées : {len(sources)}")

    thumb_done = thumb_skip = 0
    small_done = small_skip = 0

    for src in sorted(sources):
        if generate_variant(src, "_thumb", THUMB_SIDE):
            thumb_done += 1
        else:
            thumb_skip += 1

        if generate_variant(src, "_small", SMALL_SIDE):
            small_done += 1
        else:
            small_skip += 1

    log.info("")
    log.info(f"_thumb (900px) : {thumb_done} générés | {thumb_skip} déjà présents")
    log.info(f"_small (400px) : {small_done} générés | {small_skip} déjà présents")


if __name__ == "__main__":
    main()
