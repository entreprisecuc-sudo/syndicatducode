#!/usr/bin/env python3
"""
Télécharge et auto-héberge les Google Fonts (Montserrat + Inter).
Élimine les requêtes externes bloquantes → amélioration FCP/LCP mobile.

Usage (avant yarn build) :
    python3 /var/www/syndicatducode.fr/deploy/download_fonts.py
"""

import re
import sys
import urllib.request
from pathlib import Path

FONTS_DIR = Path("/var/www/syndicatducode.fr/frontend/public/fonts")
FONTS_URL  = (
    "https://fonts.googleapis.com/css2"
    "?family=Montserrat:wght@700;800;900"
    "&family=Inter:wght@400;500;600"
    "&display=swap"
)
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read() if binary else r.read().decode("utf-8")


def parse_latin_blocks(css):
    """
    Retourne les blocs @font-face du sous-ensemble Latin uniquement.
    Format Google Fonts : commentaire '/* latin */' juste avant chaque bloc.
    """
    pattern = re.compile(
        r"/\*\s*(latin)\s*\*/\s*(@font-face\s*\{[^}]+\})",
        re.DOTALL | re.IGNORECASE
    )
    return [block for _, block in pattern.findall(css)]


def block_meta(block):
    family = re.search(r"font-family:\s*['\"]?([^;'\"]+)", block).group(1).strip()
    weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
    url    = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    return family.lower().replace(" ", "-"), weight, url


def main():
    FONTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Récupération du CSS Google Fonts…")
    try:
        css = fetch(FONTS_URL)
    except Exception as e:
        print(f"ERREUR fetch CSS : {e}")
        sys.exit(1)

    blocks = parse_latin_blocks(css)
    if not blocks:
        print("ERREUR : aucun bloc @font-face latin trouvé.")
        sys.exit(1)

    print(f"{len(blocks)} variantes détectées.")
    downloaded = 0

    for block in blocks:
        try:
            family, weight, url = block_meta(block)
        except Exception:
            continue

        filename = f"{family}-{weight}.woff2"
        dest = FONTS_DIR / filename

        if dest.exists():
            print(f"  [SKIP] {filename} (déjà présent)")
            continue

        try:
            data = fetch(url, binary=True)
            dest.write_bytes(data)
            print(f"  [OK]   {filename} ({dest.stat().st_size // 1024} KB)")
            downloaded += 1
        except Exception as e:
            print(f"  [ERR]  {filename} : {e}")

    print(f"\nTerminé : {downloaded} fonts téléchargées → {FONTS_DIR}")
    print("Lancez maintenant : cd frontend && yarn build")


if __name__ == "__main__":
    main()
