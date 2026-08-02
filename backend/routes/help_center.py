"""
Centre d'aide — La Citadelle Numérique
Rendu HTML côté serveur (lisible par les visiteurs, Google et les IA sans JS).
Routes : GET /aide  et  GET /aide/{slug}   (montées sous /api -> /api/aide, proxy Nginx /aide en prod)
Optimisé SEO / GEO / AEO : Schema.org FAQPage + BreadcrumbList, fil d'Ariane, maillage interne.
"""
import json
import html as _html
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from config.settings import CITADELLE_URL
from config.help_center import CATEGORIES, HELP_BASE_PATH, build_registry, get_category

router = APIRouter(tags=["Centre d'aide"])

db = None


def set_database(database):
    global db
    db = database


DOMAIN = CITADELLE_URL.rstrip("/")
C = "/citadelle"  # préfixe des pages React de la Citadelle

# ── Gabarit commun ───────────────────────────────────────────────────────────

_STYLE = """
:root{--navy:#081729;--navy2:#0F2039;--gold:#C9A45C;--ink:#1E2A3A;--muted:#5A6B7E;--line:#E6E9EF;--bg:#FAFAF7;}
*{box-sizing:border-box;}
body{margin:0;font-family:Georgia,'Times New Roman',serif;color:var(--ink);background:var(--bg);line-height:1.7;}
a{color:#8a6d2f;text-decoration:none;}
a:hover{text-decoration:underline;}
header.site{background:var(--navy);color:#fff;padding:20px;}
header.site .wrap{max-width:980px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
header.site .brand{font-weight:700;font-size:18px;color:#fff;font-family:'Trebuchet MS',Arial,sans-serif;}
header.site .brand span{color:var(--gold);}
header.site .brand:hover{text-decoration:none;}
nav.crumb{max-width:980px;margin:14px auto 0;padding:0 20px;font-size:13px;color:var(--muted);font-family:Arial,sans-serif;}
nav.crumb a{color:var(--muted);}
main{max-width:980px;margin:0 auto;padding:20px 20px 64px;}
h1{font-size:32px;line-height:1.2;color:var(--navy);margin:16px 0 6px;font-family:'Trebuchet MS',Arial,sans-serif;}
h2{font-size:22px;color:var(--navy);margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--gold);font-family:'Trebuchet MS',Arial,sans-serif;}
h3{font-size:17px;color:var(--navy2);margin:20px 0 6px;font-family:'Trebuchet MS',Arial,sans-serif;}
.sub{font-size:15px;color:var(--muted);font-family:Arial,sans-serif;margin:0 0 8px;}
.lead{font-size:18px;color:var(--ink);background:#fff;border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:10px;padding:14px 20px;margin:16px 0 8px;}
.searchbox{position:relative;margin:22px 0 8px;}
.searchbox input{width:100%;padding:16px 18px 16px 46px;font-size:16px;font-family:Arial,sans-serif;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--ink);}
.searchbox .fa-magnifying-glass{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:var(--gold);}
#searchResults{list-style:none;margin:8px 0 0;padding:0;font-family:Arial,sans-serif;}
#searchResults li{margin:0;border-bottom:1px solid var(--line);}
#searchResults li a{display:block;padding:10px 6px;color:var(--navy2);font-size:14px;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin:18px 0;}
.card{display:block;background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;transition:box-shadow .2s ease,transform .2s ease;color:var(--ink);}
.card:hover{box-shadow:0 8px 24px rgba(8,23,41,.08);transform:translateY(-2px);text-decoration:none;}
.card .ic{width:42px;height:42px;border-radius:10px;background:#F5F2EA;color:#8a6d2f;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px;}
.card .t{font-family:'Trebuchet MS',Arial,sans-serif;font-weight:700;color:var(--navy);font-size:16px;}
.card .d{font-family:Arial,sans-serif;font-size:13px;color:var(--muted);margin-top:4px;}
.card .n{font-family:Arial,sans-serif;font-size:12px;color:var(--gold);margin-top:8px;}
ul.qlist{list-style:none;padding:0;margin:8px 0 0;font-family:Arial,sans-serif;}
ul.qlist li{padding:9px 0;border-bottom:1px solid var(--line);font-size:15px;}
ul.qlist li a{color:var(--navy2);}
ul.qlist li.soon{color:var(--muted);}
ul.qlist li.soon span.badge{font-size:11px;background:#EFEFEA;color:var(--muted);border-radius:999px;padding:2px 8px;margin-left:6px;}
.catblock{margin:30px 0;}
.catblock h2 .fa-solid{color:var(--gold);font-size:18px;margin-right:8px;}
.answer{font-size:16px;}
.answer p{margin:12px 0;}
.answer ul,.answer ol{margin:12px 0;padding-left:22px;}
.answer li{margin:6px 0;}
dl.faq dt{font-weight:700;color:var(--navy2);margin-top:16px;font-family:'Trebuchet MS',Arial,sans-serif;}
dl.faq dd{margin:4px 0 0;padding:0;}
.related,.maillage{background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 22px 18px;margin:22px 0;}
.related ul,.maillage ul{list-style:none;padding:0;margin:8px 0 0;font-family:Arial,sans-serif;}
.related li,.maillage li{padding:8px 0;border-bottom:1px solid var(--line);font-size:15px;}
.recent{font-family:Arial,sans-serif;}
.recent ul{list-style:none;padding:0;margin:8px 0 0;}
.recent li{padding:7px 0;border-bottom:1px solid var(--line);font-size:14px;}
footer.site{background:var(--navy);color:rgba(255,255,255,.7);padding:26px 20px;font-family:Arial,sans-serif;font-size:14px;margin-top:40px;}
footer.site .wrap{max-width:980px;margin:0 auto;}
footer.site a{color:var(--gold);}
.links a{display:inline-block;margin:4px 14px 4px 0;}
.note{font-size:13px;color:var(--muted);font-family:Arial,sans-serif;}
"""


def _page(title: str, description: str, canonical: str, body: str, extra_head: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{_html.escape(title)}</title>
<meta name="description" content="{_html.escape(description)}" />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
<link rel="canonical" href="{canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="La Citadelle Numérique" />
<meta property="og:title" content="{_html.escape(title)}" />
<meta property="og:description" content="{_html.escape(description)}" />
<meta property="og:url" content="{canonical}" />
<meta property="og:locale" content="fr_FR" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
{extra_head}
<style>{_STYLE}</style>
</head>
<body>
<header class="site">
  <div class="wrap">
    <a class="brand" href="{DOMAIN}{C}">La Citadelle <span>Numérique</span></a>
    <span class="note" style="color:rgba(255,255,255,.65)">Centre d'aide</span>
  </div>
</header>
{body}
<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="{DOMAIN}{C}">Accueil</a>
      <a href="{DOMAIN}{C}/annonces">Annonces</a>
      <a href="{DOMAIN}{C}/services">Services</a>
      <a href="{DOMAIN}{C}/blog">Blog</a>
      <a href="{DOMAIN}{HELP_BASE_PATH}">Centre d'aide</a>
      <a href="{DOMAIN}{C}/contact">Contact</a>
    </div>
    <p class="note" style="color:rgba(255,255,255,.5);margin-top:12px;">© {datetime.now().year} La Citadelle Numérique — Joerke.B (SIREN 892 906 728)</p>
  </div>
</footer>
</body>
</html>"""


def _maillage_block() -> str:
    return f"""
    <section class="maillage">
      <h2>Aller plus loin</h2>
      <ul>
        <li><i class="fa-solid fa-book"></i> <a href="{DOMAIN}{C}/guides">Guides de La Citadelle</a> — dossiers complets étape par étape.</li>
        <li><i class="fa-solid fa-feather"></i> <a href="{DOMAIN}{C}/chroniques">Chroniques de La Garde</a> — retours d'expérience sur les transactions.</li>
        <li><i class="fa-solid fa-newspaper"></i> <a href="{DOMAIN}{C}/blog">Articles du blog</a> — conseils vente, achat, estimation, SEO.</li>
        <li><i class="fa-solid fa-screwdriver-wrench"></i> <a href="{DOMAIN}{C}/services">Services</a> — estimation, audits, migration, refonte, création.</li>
        <li><i class="fa-solid fa-store"></i> <a href="{DOMAIN}{C}/annonces">Marketplace</a> — actifs numériques en vente et aux enchères.</li>
      </ul>
    </section>"""


# ── Index /aide ──────────────────────────────────────────────────────────────

@router.api_route(f"{HELP_BASE_PATH}", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def help_index():
    flat, by_slug, by_category = build_registry()

    # Articles réellement disponibles (générés) en base
    docs = await db.citadelle_help_articles.find(
        {}, {"_id": 0, "slug": 1, "question": 1, "view_count": 1}
    ).to_list(length=1000)
    available = {d["slug"]: d for d in docs}

    # Recherche instantanée : uniquement les questions disponibles
    search_index = [
        {"q": d["question"], "u": f"{HELP_BASE_PATH}/{d['slug']}"}
        for d in docs
    ]

    # Questions les plus consultées (top 6 par vues)
    popular = sorted(docs, key=lambda d: d.get("view_count", 0), reverse=True)[:6]
    popular = [p for p in popular if p.get("view_count", 0) > 0][:6]

    # Cartes catégories
    cards = ""
    for cat in CATEGORIES:
        items = by_category[cat["key"]]
        nb_dispo = sum(1 for it in items if it["slug"] in available)
        cards += f"""
      <a class="card" href="#cat-{cat['key']}">
        <div class="ic"><i class="fa-solid {cat['icon']}"></i></div>
        <div class="t">{_html.escape(cat['label'])}</div>
        <div class="d">{_html.escape(cat['description'])}</div>
        <div class="n">{nb_dispo}/{len(items)} réponses</div>
      </a>"""

    # Blocs par catégorie
    blocks = ""
    for cat in CATEGORIES:
        items = by_category[cat["key"]]
        lis = ""
        for it in items:
            if it["slug"] in available:
                lis += f'<li><a href="{HELP_BASE_PATH}/{it["slug"]}">{_html.escape(it["question"])}</a></li>'
            else:
                lis += f'<li class="soon">{_html.escape(it["question"])}<span class="badge">bientôt</span></li>'
        blocks += f"""
      <section class="catblock" id="cat-{cat['key']}">
        <h2><i class="fa-solid {cat['icon']}"></i>{_html.escape(cat['label'])}</h2>
        <p class="sub">{_html.escape(cat['description'])}</p>
        <ul class="qlist">{lis}</ul>
      </section>"""

    popular_html = ""
    if popular:
        pls = "".join(
            f'<li><a href="{HELP_BASE_PATH}/{p["slug"]}">{_html.escape(p["question"])}</a></li>'
            for p in popular
        )
        popular_html = f"""
      <section class="catblock">
        <h2><i class="fa-solid fa-fire"></i>Questions les plus consultées</h2>
        <ul class="qlist">{pls}</ul>
      </section>"""

    body = f"""
<nav class="crumb" aria-label="Fil d'Ariane">
  <a href="{DOMAIN}{C}">Accueil</a> › <span aria-current="page">Centre d'aide</span>
</nav>
<main>
  <h1>Centre d'aide</h1>
  <p class="sub" style="font-size:17px;">FAQ – Questions fréquentes</p>
  <p class="lead">Trouvez rapidement une réponse sur l'achat, la vente, l'estimation, la sécurisation et la transmission d'actifs numériques sur La Citadelle Numérique.</p>

  <div class="searchbox">
    <i class="fa-solid fa-magnifying-glass"></i>
    <input id="helpSearch" type="search" placeholder="Rechercher une question…" autocomplete="off" aria-label="Rechercher dans le Centre d'aide" />
    <ul id="searchResults"></ul>
  </div>

  <section class="recent" id="recentBlock" style="display:none;">
    <h2><i class="fa-solid fa-clock-rotate-left"></i>Consultés récemment</h2>
    <ul id="recentList"></ul>
  </section>

  {popular_html}

  <h2><i class="fa-solid fa-layer-group"></i>Parcourir par catégorie</h2>
  <div class="grid">{cards}</div>

  {blocks}

  {_maillage_block()}
</main>

<script>
  const HELP_INDEX = {json.dumps(search_index, ensure_ascii=False)};
  const inp = document.getElementById('helpSearch');
  const out = document.getElementById('searchResults');
  function norm(s){{return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();}}
  inp.addEventListener('input', function(){{
    const v = norm(inp.value.trim());
    out.innerHTML = '';
    if(v.length < 2) return;
    const res = HELP_INDEX.filter(x => norm(x.q).includes(v)).slice(0,10);
    res.forEach(x => {{
      const li = document.createElement('li');
      li.innerHTML = '<a href="'+x.u+'">'+x.q+'</a>';
      out.appendChild(li);
    }});
  }});
  // Consultés récemment (localStorage)
  try {{
    const recent = JSON.parse(localStorage.getItem('lcn_help_recent') || '[]');
    if(recent.length){{
      document.getElementById('recentBlock').style.display = 'block';
      const ul = document.getElementById('recentList');
      recent.slice(0,5).forEach(r => {{
        const li = document.createElement('li');
        li.innerHTML = '<a href="'+r.u+'">'+r.q+'</a>';
        ul.appendChild(li);
      }});
    }}
  }} catch(e){{}}
</script>"""

    return HTMLResponse(_page(
        title="Centre d'aide — La Citadelle Numérique",
        description="Centre d'aide de La Citadelle Numérique : réponses claires sur l'achat, la vente, l'estimation, le séquestre et la transmission d'actifs numériques.",
        canonical=f"{DOMAIN}{HELP_BASE_PATH}",
        body=body,
    ))


# ── Page individuelle /aide/{slug} ─────────────────────────────────────────────

@router.api_route(f"{HELP_BASE_PATH}/{{slug}}", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def help_article(slug: str):
    flat, by_slug, by_category = build_registry()
    if slug not in by_slug:
        raise HTTPException(status_code=404, detail="Question introuvable")

    doc = await db.citadelle_help_articles.find_one_and_update(
        {"slug": slug},
        {"$inc": {"view_count": 1}},
        projection={"_id": 0},
        return_document=True,
    )
    reg = by_slug[slug]
    cat = get_category(reg["category_key"])

    if not doc:
        # Réponse pas encore rédigée : page minimale honnête (noindex pour éviter le thin content)
        body = f"""
<nav class="crumb" aria-label="Fil d'Ariane">
  <a href="{DOMAIN}{C}">Accueil</a> › <a href="{DOMAIN}{HELP_BASE_PATH}">Centre d'aide</a> › <span aria-current="page">{_html.escape(reg['question'])}</span>
</nav>
<main>
  <h1>{_html.escape(reg['question'])}</h1>
  <p class="lead">La réponse détaillée à cette question est en cours de rédaction. En attendant, consultez nos guides et articles, ou contactez-nous.</p>
  {_maillage_block()}
</main>"""
        return HTMLResponse(_page(
            title=f"{reg['question']} — Centre d'aide",
            description=reg["question"],
            canonical=f"{DOMAIN}{HELP_BASE_PATH}/{slug}",
            body=body,
            extra_head='<meta name="robots" content="noindex, follow" />',
        ), status_code=200)

    # Questions associées : même catégorie (max 5, hors courante)
    related = [it for it in by_category[reg["category_key"]] if it["slug"] != slug][:5]
    related_html = "".join(
        f'<li><i class="fa-solid fa-angle-right"></i> <a href="{HELP_BASE_PATH}/{r["slug"]}">{_html.escape(r["question"])}</a></li>'
        for r in related
    )

    # FAQ complémentaire + Schema
    faq = doc.get("faq") or []
    faq_html = ""
    faq_schema_items = [{
        "@type": "Question",
        "name": reg["question"],
        "acceptedAnswer": {"@type": "Answer", "text": doc.get("lead", "") or doc.get("meta_description", "")},
    }]
    if faq:
        dts = "".join(
            f"<dt>{_html.escape(f['q'])}</dt><dd>{_html.escape(f['a'])}</dd>" for f in faq
        )
        faq_html = f"""
    <section>
      <h2>Questions complémentaires</h2>
      <dl class="faq">{dts}</dl>
    </section>"""
        for f in faq:
            faq_schema_items.append({
                "@type": "Question",
                "name": f["q"],
                "acceptedAnswer": {"@type": "Answer", "text": f["a"]},
            })

    faq_schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq_schema_items}
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{DOMAIN}{C}"},
            {"@type": "ListItem", "position": 2, "name": "Centre d'aide", "item": f"{DOMAIN}{HELP_BASE_PATH}"},
            {"@type": "ListItem", "position": 3, "name": cat["label"], "item": f"{DOMAIN}{HELP_BASE_PATH}#cat-{cat['key']}"},
            {"@type": "ListItem", "position": 4, "name": reg["question"], "item": f"{DOMAIN}{HELP_BASE_PATH}/{slug}"},
        ],
    }
    extra_head = (
        f'<script type="application/ld+json">{json.dumps(faq_schema, ensure_ascii=False)}</script>\n'
        f'<script type="application/ld+json">{json.dumps(breadcrumb_schema, ensure_ascii=False)}</script>'
    )

    lead = doc.get("lead", "")
    body = f"""
<nav class="crumb" aria-label="Fil d'Ariane">
  <a href="{DOMAIN}{C}">Accueil</a> › <a href="{DOMAIN}{HELP_BASE_PATH}">Centre d'aide</a> › <a href="{DOMAIN}{HELP_BASE_PATH}#cat-{cat['key']}">{_html.escape(cat['label'])}</a> › <span aria-current="page">{_html.escape(reg['question'])}</span>
</nav>
<main>
  <article>
    <h1>{_html.escape(reg['question'])}</h1>
    {f'<p class="lead">{_html.escape(lead)}</p>' if lead else ''}
    <div class="answer">{doc.get('answer_html','')}</div>
    {faq_html}
    <section class="related">
      <h2>Questions associées</h2>
      <ul>{related_html}</ul>
    </section>
    {_maillage_block()}
  </article>
</main>

<script>
  // Mémoriser la consultation (localStorage) pour "Consultés récemment"
  try {{
    const key='lcn_help_recent';
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    const item = {{q: {json.dumps(reg['question'], ensure_ascii=False)}, u: {json.dumps(HELP_BASE_PATH + '/' + slug, ensure_ascii=False)}}};
    arr = arr.filter(x => x.u !== item.u);
    arr.unshift(item);
    localStorage.setItem(key, JSON.stringify(arr.slice(0,8)));
  }} catch(e){{}}
</script>"""

    return HTMLResponse(_page(
        title=doc.get("meta_title") or f"{reg['question']} — La Citadelle Numérique",
        description=doc.get("meta_description") or reg["question"],
        canonical=f"{DOMAIN}{HELP_BASE_PATH}/{slug}",
        body=body,
        extra_head=extra_head,
    ))
