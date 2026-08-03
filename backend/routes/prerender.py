"""
Pré-rendu SEO (Dynamic Rendering — Stratégie 2b, sans Puppeteer).
Sert aux robots (Googlebot, Bingbot, IA…) une version HTML complète des pages
publiques React, avec métadonnées uniques, contenu visible, maillage interne et
Schema.org. Les visiteurs humains continuent de recevoir l'app React (SPA) :
l'aiguillage bot/humain se fait au niveau de Nginx (User-Agent) sur le VPS.

Route montée sous /api  ->  GET /api/prerender/{path}
En production, Nginx proxifie une requête robot pour /citadelle/... vers
http://127.0.0.1:8001/api/prerender/citadelle/...
"""
import json
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from markdown_it import MarkdownIt

from config.seo_theme import (
    DOMAIN, C, ROBOTS_INDEX, esc, fmt_price, render_page, maillage_block,
)
from config.prerender import (
    LISTING_TYPE_LABELS, BLOG_CATEGORY_LABELS, STATIC_PAGES,
    GUIDES_CATEGORY, CHRONIQUES_CATEGORY, HOME_SEO,
)

router = APIRouter(tags=["Pré-rendu SEO"])

_md = MarkdownIt("commonmark", {"html": False, "linkify": True})

db = None


def set_database(database):
    global db
    db = database


# ── Helpers ───────────────────────────────────────────────────────────────────

def _canonical(path: str) -> str:
    return f"{DOMAIN}{path}"


def _abs_image(url: str) -> str:
    """Rend une URL d'image absolue (les CDN externes sont déjà absolus)."""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return f"{DOMAIN}{url if url.startswith('/') else '/' + url}"


def _breadcrumb_schema(items: list[tuple[str, str]]) -> str:
    """items = [(name, url), ...]"""
    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": url}
            for i, (name, url) in enumerate(items)
        ],
    }
    return f'<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>'


def _crumb_nav(items: list[tuple[str, str]]) -> str:
    parts = []
    for i, (name, url) in enumerate(items):
        if i == len(items) - 1:
            parts.append(f'<span aria-current="page">{esc(name)}</span>')
        else:
            parts.append(f'<a href="{url}">{esc(name)}</a>')
    return '<nav class="crumb" aria-label="Fil d\'Ariane">' + " › ".join(parts) + "</nav>"


# ── Rendu : accueil (contenu SEO riche, aligné sur la section React) ───────────

def _render_home() -> HTMLResponse:
    meta = STATIC_PAGES[C]
    why_html = "".join(
        f"<li><strong>{esc(t)}.</strong> {esc(d)}</li>" for t, d in HOME_SEO["why"]
    )
    sell_html = "".join(f"<li>{esc(s)}</li>" for s in HOME_SEO["sell_steps"])
    buy_html = "".join(f"<li>{esc(s)}</li>" for s in HOME_SEO["buy_steps"])
    intro_html = "".join(f"<p>{esc(p)}</p>" for p in HOME_SEO["intro"])

    body = f"""
<main>
  <h1>{esc(meta['h1'])}</h1>
  <p class="lead">{esc(meta['intro'])}</p>

  <section class="article">
    <h2>{esc(HOME_SEO['h2'])}</h2>
    {intro_html}

    <h3>Pourquoi choisir La Citadelle Numérique</h3>
    <ul>{why_html}</ul>

    <h3>Comment vendre un site internet</h3>
    <ol>{sell_html}</ol>
    <p><a class="cta" href="{DOMAIN}{C}/vendre">Vendre mon site</a></p>

    <h3>Comment acheter un site internet</h3>
    <ol>{buy_html}</ol>
    <p><a class="cta" href="{DOMAIN}{C}/annonces">Voir les annonces</a></p>

    <h3>Nos garanties</h3>
    <p>{esc(HOME_SEO['garanties'])}</p>
  </section>
  {maillage_block()}
</main>"""
    crumbs = [("Accueil", f"{DOMAIN}{C}")]
    return HTMLResponse(render_page(
        title=meta["title"], description=meta["description"],
        canonical=_canonical(C), body=body,
        extra_head=_breadcrumb_schema(crumbs),
    ))


# ── Rendu : pages statiques (contenu éditorial fixe) ───────────────────────────

def _render_static(path: str) -> HTMLResponse:
    meta = STATIC_PAGES[path]
    crumbs = [("Accueil", f"{DOMAIN}{C}")]
    if path != C:
        crumbs.append((meta["h1"], _canonical(path)))
    body = f"""
{_crumb_nav(crumbs)}
<main>
  <h1>{esc(meta['h1'])}</h1>
  <p class="lead">{esc(meta['intro'])}</p>
  {maillage_block()}
</main>"""
    return HTMLResponse(render_page(
        title=meta["title"],
        description=meta["description"],
        canonical=_canonical(path),
        body=body,
        extra_head=_breadcrumb_schema(crumbs),
    ))


# ── Rendu : liste d'annonces ───────────────────────────────────────────────────

async def _render_listings_index() -> HTMLResponse:
    meta = STATIC_PAGES["/citadelle/annonces"]
    docs = await db.citadelle_listings.find(
        {"status": "active", "is_adult": {"$ne": True}},
        {"_id": 0, "slug": 1, "title": 1, "short_description": 1, "type": 1,
         "price": 1, "is_auction": 1, "auction_current_bid": 1, "images": 1},
    ).sort("published_at", -1).to_list(length=200)

    cards = ""
    for l in docs:
        slug = l.get("slug")
        if not slug:
            continue
        type_label = LISTING_TYPE_LABELS.get(l.get("type"), "Actif numérique")
        price = l.get("auction_current_bid") if l.get("is_auction") else l.get("price")
        price_html = f'<div class="price">{fmt_price(price)}</div>' if price else ""
        img = _abs_image((l.get("images") or [None])[0])
        img_html = f'<img src="{esc(img)}" alt="{esc(l.get("title"))}" loading="lazy" />' if img else ""
        cards += f"""
      <a class="card" href="{DOMAIN}{C}/annonces/{esc(slug)}">
        {img_html}
        <div class="badge">{esc(type_label)}</div>
        <div class="t">{esc(l.get('title'))}</div>
        <div class="d">{esc((l.get('short_description') or '')[:160])}</div>
        {price_html}
      </a>"""

    crumbs = [("Accueil", f"{DOMAIN}{C}"), ("Annonces", _canonical("/citadelle/annonces"))]
    body = f"""
{_crumb_nav(crumbs)}
<main>
  <h1>{esc(meta['h1'])}</h1>
  <p class="lead">{esc(meta['intro'])}</p>
  <p class="sub">{len(docs)} actif(s) numérique(s) en vente.</p>
  <div class="grid">{cards or '<p>Aucune annonce active pour le moment.</p>'}</div>
  {maillage_block()}
</main>"""
    return HTMLResponse(render_page(
        title=meta["title"], description=meta["description"],
        canonical=_canonical("/citadelle/annonces"), body=body,
        extra_head=_breadcrumb_schema(crumbs),
    ))


# ── Rendu : fiche annonce ──────────────────────────────────────────────────────

async def _render_listing_detail(slug: str) -> HTMLResponse:
    l = await db.citadelle_listings.find_one({"slug": slug}, {"_id": 0})
    if not l:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

    path = f"/citadelle/annonces/{slug}"
    canonical = _canonical(path)
    type_label = LISTING_TYPE_LABELS.get(l.get("type"), "Actif numérique")
    title_txt = l.get("title") or type_label

    # Contenu adulte ou annonce non active : on n'indexe pas (thin/sensible)
    is_indexable = (l.get("status") == "active") and not l.get("is_adult")
    robots = ROBOTS_INDEX if is_indexable else "noindex, follow"

    price = l.get("auction_current_bid") if l.get("is_auction") else l.get("price")
    price_str = fmt_price(price)
    description = (l.get("short_description") or l.get("description") or "")[:300].strip()
    if not description:
        description = f"{type_label} à vendre sur La Citadelle Numérique."
    meta_title = f"{title_txt} — {type_label} à vendre | La Citadelle Numérique"

    img = _abs_image((l.get("images") or [None])[0]) if not l.get("is_adult") else ""

    # Caractéristiques
    rows = [("Type d'actif", type_label)]
    if price_str:
        rows.append(("Enchère actuelle" if l.get("is_auction") else "Prix", price_str))
    if l.get("monthly_revenue"):
        rows.append(("Revenu mensuel", fmt_price(l.get("monthly_revenue"))))
    if l.get("monthly_traffic"):
        rows.append(("Trafic mensuel", f"{esc(l.get('monthly_traffic'))} visiteurs"))
    if l.get("age_months"):
        rows.append(("Ancienneté", f"{esc(l.get('age_months'))} mois"))
    if l.get("niche"):
        rows.append(("Niche", esc(l.get("niche"))))
    rows_html = "".join(
        f'<p class="meta-row"><strong>{esc(k)} :</strong> {v}</p>' for k, v in rows
    )

    desc_full = esc(l.get("description") or "").replace("\n", "<br />")

    # Schema.org Product
    product_schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title_txt,
        "description": description,
        "category": type_label,
    }
    if img:
        product_schema["image"] = img
    if price:
        product_schema["offers"] = {
            "@type": "Offer",
            "price": int(round(float(price))),
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock" if is_indexable else "https://schema.org/SoldOut",
            "url": canonical,
        }

    crumbs = [
        ("Accueil", f"{DOMAIN}{C}"),
        ("Annonces", _canonical("/citadelle/annonces")),
        (title_txt, canonical),
    ]
    extra_head = (
        f'<script type="application/ld+json">{json.dumps(product_schema, ensure_ascii=False)}</script>\n'
        + _breadcrumb_schema(crumbs)
    )
    img_html = f'<img class="article" src="{esc(img)}" alt="{esc(title_txt)}" />' if img else ""

    body = f"""
{_crumb_nav(crumbs)}
<main>
  <article>
    <h1>{esc(title_txt)}</h1>
    <p class="lead">{esc(description)}</p>
    {img_html}
    <section>{rows_html}</section>
    {f'<section class="article"><h2>Description</h2><p>{desc_full}</p></section>' if desc_full else ''}
    <a class="cta" href="{canonical}">Voir l'annonce et contacter le vendeur</a>
    {maillage_block()}
  </article>
</main>"""
    return HTMLResponse(render_page(
        title=meta_title, description=description, canonical=canonical,
        body=body, extra_head=extra_head, robots=robots, og_image=img,
    ))


# ── Rendu : index blog / rubriques ─────────────────────────────────────────────

async def _render_blog_like_index(path: str, category: str | None) -> HTMLResponse:
    meta = STATIC_PAGES[path]
    query = {"is_published": True}
    if category:
        query["category"] = category
    docs = await db.citadelle_blog_posts.find(
        query,
        {"_id": 0, "slug": 1, "title": 1, "excerpt": 1, "category": 1,
         "cover_image_url": 1, "cover_image_alt": 1, "published_at": 1},
    ).sort("published_at", -1).to_list(length=300)

    cards = ""
    for a in docs:
        slug = a.get("slug")
        if not slug:
            continue
        img = _abs_image(a.get("cover_image_url"))
        alt = a.get("cover_image_alt") or a.get("title")
        img_html = f'<img src="{esc(img)}" alt="{esc(alt)}" loading="lazy" />' if img else ""
        cat_label = BLOG_CATEGORY_LABELS.get(a.get("category"), "")
        badge = f'<div class="badge">{esc(cat_label)}</div>' if cat_label else ""
        cards += f"""
      <a class="card" href="{DOMAIN}{C}/blog/{esc(slug)}">
        {img_html}
        {badge}
        <div class="t">{esc(a.get('title'))}</div>
        <div class="d">{esc((a.get('excerpt') or '')[:160])}</div>
      </a>"""

    crumbs = [("Accueil", f"{DOMAIN}{C}"), (meta["h1"], _canonical(path))]
    body = f"""
{_crumb_nav(crumbs)}
<main>
  <h1>{esc(meta['h1'])}</h1>
  <p class="lead">{esc(meta['intro'])}</p>
  <div class="grid">{cards or '<p>Aucune parution disponible pour le moment.</p>'}</div>
  {maillage_block()}
</main>"""
    return HTMLResponse(render_page(
        title=meta["title"], description=meta["description"],
        canonical=_canonical(path), body=body,
        extra_head=_breadcrumb_schema(crumbs),
    ))


# ── Rendu : article de blog ────────────────────────────────────────────────────

async def _render_blog_post(slug: str) -> HTMLResponse:
    a = await db.citadelle_blog_posts.find_one(
        {"slug": slug, "is_published": True}, {"_id": 0}
    )
    if not a:
        raise HTTPException(status_code=404, detail="Article introuvable")

    path = f"/citadelle/blog/{slug}"
    canonical = _canonical(path)
    title_txt = a.get("title") or "Article"
    cat_label = BLOG_CATEGORY_LABELS.get(a.get("category"), "Blog")
    description = (a.get("excerpt") or "")[:300].strip() or f"{title_txt} — La Citadelle Numérique."
    meta_title = f"{title_txt} | La Citadelle Numérique"
    img = _abs_image(a.get("cover_image_url"))
    alt = a.get("cover_image_alt") or title_txt

    content_html = _md.render(a.get("content_md") or a.get("excerpt") or "")

    crumbs = [
        ("Accueil", f"{DOMAIN}{C}"),
        ("Blog", _canonical("/citadelle/blog")),
        (title_txt, canonical),
    ]
    article_schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title_txt,
        "description": description,
        "author": {"@type": "Organization", "name": a.get("author_name") or "La Citadelle Numérique"},
        "publisher": {"@type": "Organization", "name": "La Citadelle Numérique"},
        "mainEntityOfPage": canonical,
    }
    if img:
        article_schema["image"] = img
    if a.get("published_at"):
        article_schema["datePublished"] = str(a.get("published_at"))
    if a.get("updated_at"):
        article_schema["dateModified"] = str(a.get("updated_at"))

    extra_head = (
        f'<script type="application/ld+json">{json.dumps(article_schema, ensure_ascii=False)}</script>\n'
        + _breadcrumb_schema(crumbs)
    )
    img_html = f'<img class="article" src="{esc(img)}" alt="{esc(alt)}" />' if img else ""

    body = f"""
{_crumb_nav(crumbs)}
<main>
  <article>
    <div class="badge">{esc(cat_label)}</div>
    <h1>{esc(title_txt)}</h1>
    <p class="lead">{esc(description)}</p>
    {img_html}
    <div class="article">{content_html}</div>
    <a class="cta" href="{canonical}">Lire l'article sur La Citadelle Numérique</a>
    {maillage_block()}
  </article>
</main>"""
    return HTMLResponse(render_page(
        title=meta_title, description=description, canonical=canonical,
        body=body, extra_head=extra_head, og_image=img,
    ))


# ── Rendu : services ───────────────────────────────────────────────────────────

async def _render_services_index() -> HTMLResponse:
    meta = STATIC_PAGES["/citadelle/services"]
    docs = await db.citadelle_services.find(
        {"is_active": {"$ne": False}},
        {"_id": 0, "title": 1, "description": 1, "short_description": 1,
         "price": 1, "price_label": 1, "category": 1},
    ).sort("display_order", 1).to_list(length=200)

    cards = ""
    for s in docs:
        price_lbl = s.get("price_label") or (fmt_price(s.get("price")) if s.get("price") else "")
        price_html = f'<div class="price">{esc(price_lbl)}</div>' if price_lbl else ""
        desc = s.get("short_description") or s.get("description") or ""
        cards += f"""
      <div class="card">
        <div class="t">{esc(s.get('title'))}</div>
        <div class="d">{esc(desc[:200])}</div>
        {price_html}
      </div>"""

    crumbs = [("Accueil", f"{DOMAIN}{C}"), ("Services", _canonical("/citadelle/services"))]
    body = f"""
{_crumb_nav(crumbs)}
<main>
  <h1>{esc(meta['h1'])}</h1>
  <p class="lead">{esc(meta['intro'])}</p>
  <div class="grid">{cards or '<p>Aucun service disponible pour le moment.</p>'}</div>
  <a class="cta" href="{DOMAIN}{C}/services">Découvrir tous les services</a>
  {maillage_block()}
</main>"""
    return HTMLResponse(render_page(
        title=meta["title"], description=meta["description"],
        canonical=_canonical("/citadelle/services"), body=body,
        extra_head=_breadcrumb_schema(crumbs),
    ))


# ── Dispatcher ─────────────────────────────────────────────────────────────────

@router.api_route("/prerender/{full_path:path}", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def prerender(full_path: str):
    # Normalisation : chemin React avec slash initial, sans slash final
    path = "/" + full_path.strip("/")

    # Détails dynamiques (avant les index)
    m = re.match(r"^/citadelle/annonces/(.+)$", path)
    if m:
        return await _render_listing_detail(m.group(1))
    m = re.match(r"^/citadelle/blog/(.+)$", path)
    if m:
        return await _render_blog_post(m.group(1))

    # Index dynamiques
    if path == "/citadelle":
        return _render_home()
    if path == "/citadelle/annonces":
        return await _render_listings_index()
    if path == "/citadelle/blog":
        return await _render_blog_like_index("/citadelle/blog", None)
    if path == "/citadelle/guides":
        return await _render_blog_like_index("/citadelle/guides", GUIDES_CATEGORY)
    if path == "/citadelle/chroniques":
        return await _render_blog_like_index("/citadelle/chroniques", CHRONIQUES_CATEGORY)
    if path == "/citadelle/parutions":
        return await _render_blog_like_index("/citadelle/parutions", None)
    if path == "/citadelle/services":
        return await _render_services_index()

    # Pages statiques
    if path in STATIC_PAGES:
        return _render_static(path)

    raise HTTPException(status_code=404, detail="Page non pré-rendue")
