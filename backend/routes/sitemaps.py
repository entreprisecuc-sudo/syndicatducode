"""
Sitemaps dynamiques — La Citadelle Numérique & Le Syndicat du Code
Routes : GET /api/sitemap-citadelle.xml  et  GET /api/sitemap-syndicat.xml
"""
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import APIRouter
from fastapi.responses import Response
from config.settings import CITADELLE_URL, FRONTEND_URL

router = APIRouter(tags=["sitemaps"])

MONGO_URL  = os.environ["MONGO_URL"]
DB_NAME    = os.environ.get("DB_NAME", "syndicat_base")

CITADELLE_DOMAIN = CITADELLE_URL.rstrip("/")
SYNDICAT_DOMAIN  = FRONTEND_URL.rstrip("/")


def _url(loc: str, lastmod: str = None, changefreq: str = "weekly", priority: str = "0.8") -> str:
    mod = f"\n    <lastmod>{lastmod}</lastmod>" if lastmod else ""
    return (
        f"  <url>\n"
        f"    <loc>{loc}</loc>{mod}\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        f"  </url>"
    )


def _build_xml(urls: list[str]) -> str:
    body = "\n".join(urls)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
        '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 '
        'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'
        f"{body}\n"
        "</urlset>"
    )


def _fmt_date(raw) -> str:
    """Extrait YYYY-MM-DD depuis une chaîne ISO ou une datetime."""
    if not raw:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return str(raw)[:10]


# ─────────────────────────────────────────────────────────────────────────────
# Sitemap — La Citadelle Numérique
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/sitemap-citadelle.xml", response_class=Response)
async def sitemap_citadelle():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    articles = await db.citadelle_blog_posts.find(
        {"is_published": True},
        {"slug": 1, "updated_at": 1, "_id": 0},
    ).to_list(length=500)

    listings = await db.citadelle_listings.find(
        {"status": "active"},
        {"slug": 1, "updated_at": 1, "_id": 0},
    ).to_list(length=500)

    client.close()

    D = CITADELLE_DOMAIN
    urls = [
        # Pages statiques
        _url(f"{D}/citadelle",                   today,  "weekly",  "1.0"),
        _url(f"{D}/citadelle/annonces",           today,  "daily",   "0.9"),
        _url(f"{D}/citadelle/blog",               today,  "daily",   "0.9"),
        _url(f"{D}/citadelle/estimation",         today,  "monthly", "0.8"),
        _url(f"{D}/citadelle/services",           today,  "monthly", "0.8"),
        _url(f"{D}/citadelle/vendre",             today,  "monthly", "0.7"),
        _url(f"{D}/citadelle/contact",            today,  "monthly", "0.6"),
        _url(f"{D}/citadelle/mentions-legales",   None,   "yearly",  "0.3"),
        _url(f"{D}/citadelle/cgu",                None,   "yearly",  "0.3"),
        _url(f"{D}/citadelle/cgv",                None,   "yearly",  "0.3"),
        _url(f"{D}/citadelle/confidentialite",    None,   "yearly",  "0.3"),
    ]

    # Articles de blog
    for art in articles:
        slug    = art.get("slug", "")
        updated = _fmt_date(art.get("updated_at"))
        if slug:
            urls.append(_url(f"{D}/citadelle/blog/{slug}", updated, "monthly", "0.7"))

    # Annonces publiées
    for lst in listings:
        slug    = lst.get("slug", "")
        updated = _fmt_date(lst.get("updated_at"))
        if slug:
            urls.append(_url(f"{D}/citadelle/annonces/{slug}", updated, "weekly", "0.8"))

    return Response(content=_build_xml(urls), media_type="application/xml")


# ─────────────────────────────────────────────────────────────────────────────
# Sitemap — Le Syndicat du Code
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/sitemap-syndicat.xml", response_class=Response)
async def sitemap_syndicat():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    D = SYNDICAT_DOMAIN
    urls = [
        _url(f"{D}/",              today, "weekly",  "1.0"),
        _url(f"{D}/rejoindre",     today, "monthly", "0.9"),
        _url(f"{D}/membres",       today, "daily",   "0.8"),
        _url(f"{D}/inscription",   today, "monthly", "0.7"),
        _url(f"{D}/connexion",     None,  "yearly",  "0.4"),
        _url(f"{D}/cgv",           None,  "yearly",  "0.3"),
        _url(f"{D}/cgu",           None,  "yearly",  "0.3"),
        _url(f"{D}/rgpd",          None,  "yearly",  "0.3"),
    ]

    return Response(content=_build_xml(urls), media_type="application/xml")
