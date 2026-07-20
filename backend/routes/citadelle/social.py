"""
Partage social / Open Graph — La Citadelle Numérique
Route : GET /api/citadelle/listings/{slug}/share

Renvoie une page HTML légère contenant les balises Open Graph / Twitter
(titre, description, prix, image) destinées aux robots des réseaux sociaux
(LinkedIn, Facebook, WhatsApp, X…). Les visiteurs humains sont immédiatement
redirigés vers la page réelle de l'annonce. Ces balises ne modifient en rien
l'affichage de l'annonce sur le site.
"""
import html
import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from config.settings import CITADELLE_URL

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Citadelle Social"])

db = None


def set_database(database):
    global db
    db = database


def _base_url() -> str:
    """Domaine canonique de La Citadelle (indépendant du domaine d'accès)."""
    return CITADELLE_URL.rstrip("/")


def _abs_image(base: str, path: str) -> str:
    """Transforme un chemin d'image d'annonce en URL absolue accessible par les robots."""
    if not path:
        return f"{base}/citadelle-logo.png"
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if path.startswith("/uploads/"):
        return f"{base}/api{path}"
    if path.startswith("/"):
        return f"{base}{path}"
    return f"{base}/{path}"


@router.get("/listings/{slug}/share", response_class=HTMLResponse)
async def listing_share(slug: str, request: Request):
    """Page Open Graph d'une annonce + redirection vers la fiche réelle."""
    base = _base_url()
    canonical = f"{base}/citadelle/annonces/{slug}"

    listing = await db.citadelle_listings.find_one(
        {"slug": slug, "status": {"$in": ["active", "sold"]}},
        {"_id": 0, "title": 1, "short_description": 1, "description": 1,
         "price": 1, "images": 1, "is_adult": 1, "type": 1},
    )

    # Annonce introuvable : on redirige simplement vers la liste des annonces
    if not listing:
        return RedirectResponse(url=f"{base}/citadelle/annonces", status_code=302)

    title = listing.get("title") or "Annonce"
    price = listing.get("price")
    desc = (listing.get("short_description") or listing.get("description") or "").strip()
    if len(desc) > 200:
        desc = desc[:197].rstrip() + "…"
    if price:
        prix_txt = f"{int(price):,}".replace(",", " ") + " €"
        desc = f"{desc} — Prix : {prix_txt}".strip(" —")

    # Image : première image de l'annonce (sauf contenu adulte) sinon logo par défaut
    images = listing.get("images") or []
    first_image = images[0] if (images and not listing.get("is_adult")) else None
    image = _abs_image(base, first_image)

    og_title = html.escape(f"{title} — La Citadelle Numérique")
    og_desc = html.escape(desc)
    og_image = html.escape(image)
    og_url = html.escape(canonical)
    canonical_js = json.dumps(canonical)

    doc = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{og_title}</title>
<meta name="description" content="{og_desc}">
<link rel="canonical" href="{og_url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="La Citadelle Numérique">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{og_desc}">
<meta property="og:image" content="{og_image}">
<meta property="og:url" content="{og_url}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{og_title}">
<meta name="twitter:description" content="{og_desc}">
<meta name="twitter:image" content="{og_image}">
<meta http-equiv="refresh" content="0; url={og_url}">
</head>
<body>
<p>Redirection vers <a href="{og_url}">l'annonce</a>…</p>
<script>window.location.replace({canonical_js});</script>
</body>
</html>"""

    return HTMLResponse(content=doc)
