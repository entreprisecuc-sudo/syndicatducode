"""
Thème HTML partagé pour le rendu serveur SEO (Centre d'aide + Dynamic Rendering).
Source unique (DRY) du gabarit, des styles et des blocs communs à toutes les pages
rendues côté serveur et lisibles par Google / les IA sans exécution JavaScript.
"""
import html as _html
from datetime import datetime

from config.settings import CITADELLE_URL

DOMAIN = CITADELLE_URL.rstrip("/")
C = "/citadelle"  # préfixe des pages React de la Citadelle

# Politique d'indexation par défaut des pages publiques
ROBOTS_INDEX = "index, follow, max-snippet:-1, max-image-preview:large"


def esc(value) -> str:
    """Échappement HTML sûr (tolère None)."""
    return _html.escape(str(value)) if value is not None else ""


def fmt_price(amount) -> str:
    """Formate un montant en euros avec séparateur de milliers insécable."""
    try:
        return f"{int(round(float(amount))):,}".replace(",", "\u00a0") + "\u00a0€"
    except (TypeError, ValueError):
        return ""


STYLE = """
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
nav.topnav{max-width:980px;margin:10px auto 0;padding:0 20px;font-family:Arial,sans-serif;font-size:14px;}
nav.topnav a{color:#8a6d2f;display:inline-block;margin:0 12px 4px 0;}
nav.crumb{max-width:980px;margin:14px auto 0;padding:0 20px;font-size:13px;color:var(--muted);font-family:Arial,sans-serif;}
nav.crumb a{color:var(--muted);}
main{max-width:980px;margin:0 auto;padding:20px 20px 64px;}
h1{font-size:32px;line-height:1.2;color:var(--navy);margin:16px 0 6px;font-family:'Trebuchet MS',Arial,sans-serif;}
h2{font-size:22px;color:var(--navy);margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--gold);font-family:'Trebuchet MS',Arial,sans-serif;}
h3{font-size:17px;color:var(--navy2);margin:20px 0 6px;font-family:'Trebuchet MS',Arial,sans-serif;}
.sub{font-size:15px;color:var(--muted);font-family:Arial,sans-serif;margin:0 0 8px;}
.lead{font-size:18px;color:var(--ink);background:#fff;border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:10px;padding:14px 20px;margin:16px 0 8px;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin:18px 0;}
.card{display:block;background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;transition:box-shadow .2s ease,transform .2s ease;color:var(--ink);}
.card:hover{box-shadow:0 8px 24px rgba(8,23,41,.08);transform:translateY(-2px);text-decoration:none;}
.card img{width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:10px;background:#eee;}
.card .t{font-family:'Trebuchet MS',Arial,sans-serif;font-weight:700;color:var(--navy);font-size:16px;}
.card .d{font-family:Arial,sans-serif;font-size:13px;color:var(--muted);margin-top:4px;}
.card .price{font-family:'Trebuchet MS',Arial,sans-serif;font-weight:700;color:#8a6d2f;margin-top:8px;}
.card .badge{display:inline-block;font-family:Arial,sans-serif;font-size:11px;background:#F5F2EA;color:#8a6d2f;border-radius:999px;padding:2px 10px;margin-top:8px;}
ul.qlist{list-style:none;padding:0;margin:8px 0 0;font-family:Arial,sans-serif;}
ul.qlist li{padding:9px 0;border-bottom:1px solid var(--line);font-size:15px;}
ul.qlist li a{color:var(--navy2);}
.meta-row{font-family:Arial,sans-serif;font-size:14px;color:var(--muted);margin:6px 0;}
.meta-row strong{color:var(--navy2);}
.answer,.article{font-size:16px;}
.answer p,.article p{margin:12px 0;}
.answer ul,.answer ol,.article ul,.article ol{margin:12px 0;padding-left:22px;}
.article img{max-width:100%;height:auto;border-radius:10px;margin:14px 0;}
dl.faq dt{font-weight:700;color:var(--navy2);margin-top:16px;font-family:'Trebuchet MS',Arial,sans-serif;}
dl.faq dd{margin:4px 0 0;padding:0;}
.related,.maillage{background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 22px 18px;margin:22px 0;}
.related ul,.maillage ul{list-style:none;padding:0;margin:8px 0 0;font-family:Arial,sans-serif;}
.related li,.maillage li{padding:8px 0;border-bottom:1px solid var(--line);font-size:15px;}
.cta{display:inline-block;background:var(--gold);color:var(--navy);font-family:'Trebuchet MS',Arial,sans-serif;font-weight:700;padding:12px 22px;border-radius:10px;margin:14px 0;}
.cta:hover{text-decoration:none;opacity:.92;}
footer.site{background:var(--navy);color:rgba(255,255,255,.7);padding:26px 20px;font-family:Arial,sans-serif;font-size:14px;margin-top:40px;}
footer.site .wrap{max-width:980px;margin:0 auto;}
footer.site a{color:var(--gold);}
.links a{display:inline-block;margin:4px 14px 4px 0;}
.note{font-size:13px;color:var(--muted);font-family:Arial,sans-serif;}
"""


def _topnav() -> str:
    return f"""
<nav class="topnav" aria-label="Navigation principale">
  <a href="{DOMAIN}{C}">Accueil</a>
  <a href="{DOMAIN}{C}/annonces">Annonces</a>
  <a href="{DOMAIN}{C}/vendre">Vendre</a>
  <a href="{DOMAIN}{C}/services">Services</a>
  <a href="{DOMAIN}{C}/estimation">Estimation</a>
  <a href="{DOMAIN}{C}/parutions">Les Parutions</a>
  <a href="{DOMAIN}/aide">Centre d'aide</a>
  <a href="{DOMAIN}{C}/contact">Contact</a>
</nav>"""


def maillage_block() -> str:
    """Bloc de maillage interne réutilisable en bas de page."""
    return f"""
    <section class="maillage">
      <h2>Aller plus loin</h2>
      <ul>
        <li><a href="{DOMAIN}{C}/annonces">Marketplace</a> — actifs numériques en vente et aux enchères.</li>
        <li><a href="{DOMAIN}{C}/estimation">Estimation</a> — évaluez la valeur de votre site, SaaS ou e-commerce.</li>
        <li><a href="{DOMAIN}{C}/services">Services</a> — audit, vérification, migration, refonte, création.</li>
        <li><a href="{DOMAIN}{C}/blog">Blog & Guides</a> — conseils vente, achat, estimation, SEO.</li>
        <li><a href="{DOMAIN}/aide">Centre d'aide</a> — réponses aux questions fréquentes.</li>
      </ul>
    </section>"""


def render_page(
    title: str,
    description: str,
    canonical: str,
    body: str,
    extra_head: str = "",
    header_note: str = "",
    robots: str = ROBOTS_INDEX,
    og_image: str = "",
) -> str:
    """Gabarit HTML complet (SEO/GEO/AEO) commun à toutes les pages rendues serveur."""
    og_img_tag = f'\n<meta property="og:image" content="{esc(og_image)}" />' if og_image else ""
    note = f'<span class="note" style="color:rgba(255,255,255,.65)">{esc(header_note)}</span>' if header_note else ""
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}" />
<meta name="robots" content="{robots}" />
<link rel="canonical" href="{canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="La Citadelle Numérique" />
<meta property="og:title" content="{esc(title)}" />
<meta property="og:description" content="{esc(description)}" />
<meta property="og:url" content="{canonical}" />
<meta property="og:locale" content="fr_FR" />{og_img_tag}
{extra_head}
<style>{STYLE}</style>
</head>
<body>
<header class="site">
  <div class="wrap">
    <a class="brand" href="{DOMAIN}{C}">La Citadelle <span>Numérique</span></a>
    {note}
  </div>
</header>
{_topnav()}
{body}
<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="{DOMAIN}{C}">Accueil</a>
      <a href="{DOMAIN}{C}/annonces">Annonces</a>
      <a href="{DOMAIN}{C}/services">Services</a>
      <a href="{DOMAIN}{C}/blog">Blog</a>
      <a href="{DOMAIN}/aide">Centre d'aide</a>
      <a href="{DOMAIN}{C}/contact">Contact</a>
      <a href="{DOMAIN}{C}/mentions-legales">Mentions légales</a>
    </div>
    <p class="note" style="color:rgba(255,255,255,.5);margin-top:12px;">© {datetime.now().year} La Citadelle Numérique — Joerke.B (SIREN 892 906 728)</p>
  </div>
</footer>
</body>
</html>"""
