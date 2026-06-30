"""
update_blog_images.py
Associe une image de couverture SEO-optimisée à chacun des 41 articles de blog.
Les URL sont des photos Unsplash libres de droits.
Le champ cover_image_alt est optimisé pour le SEO, le GEO et l'AEO.

Usage : python update_blog_images.py
"""
import asyncio
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Bibliothèque d'images par thème ─────────────────────────────────────────
IMGS = {
    # Estimation / Analytics
    "est_a":  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "est_b":  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "est_c":  "https://images.unsplash.com/photo-1599658880436-c61792e70672?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "est_d":  "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Vente de site
    "sell_a": "https://images.unsplash.com/photo-1487014679447-9f8336841d58?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "sell_b": "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "sell_c": "https://images.unsplash.com/photo-1586880244406-556ebe35f282?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "sell_d": "https://images.unsplash.com/photo-1688561808434-886a6dd97b8c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Achat de site
    "buy_a":  "https://images.unsplash.com/photo-1603302576837-37561b2e2302?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "buy_b":  "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "buy_c":  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "buy_d":  "https://images.unsplash.com/photo-1542744095-291d1f67b221?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # SaaS
    "saas_a": "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "saas_b": "https://images.unsplash.com/photo-1590971862391-06cac0657603?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "saas_c": "https://images.unsplash.com/photo-1642132652803-01f9738d0446?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # E-commerce
    "eco_a":  "https://images.unsplash.com/photo-1674027392887-751d6396b710?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "eco_b":  "https://images.unsplash.com/photo-1674027392857-9aed6e8ecab9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "eco_c":  "https://images.unsplash.com/photo-1674027392842-29f8354e236c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # SEO
    "seo_a":  "https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "seo_b":  "https://images.unsplash.com/photo-1562577309-2592ab84b1bc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "seo_c":  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Juridique
    "law_a":  "https://images.unsplash.com/photo-1562564055-71e051d33c19?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "law_b":  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "law_c":  "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Migration / Hébergement
    "mig_a":  "https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "mig_b":  "https://images.unsplash.com/photo-1667984390538-3dea7a3fe33d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "mig_c":  "https://images.unsplash.com/photo-1667984390553-7f439e6ae401?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Sécurité
    "sec_a":  "https://images.unsplash.com/photo-1633265486064-086b219458ec?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "sec_b":  "https://images.unsplash.com/photo-1614064548237-096f735f344f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "sec_c":  "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Business / KPI
    "kpi_a":  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "kpi_b":  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Application mobile
    "mob_a":  "https://images.unsplash.com/photo-1480694313141-fce5e697ee25?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "mob_b":  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Réseaux sociaux / YouTube / Instagram
    "yt_a":   "https://images.unsplash.com/photo-1521302200778-33500795e128?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "yt_b":   "https://images.unsplash.com/photo-1567443024551-f3e3cc2be870?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "yt_c":   "https://images.unsplash.com/photo-1611162616475-46b635cb6868?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Marketplace / Actualités
    "mkt_a":  "https://images.unsplash.com/photo-1557838923-2985c318be48?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    # Négociation
    "neg_a":  "https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "neg_b":  "https://images.unsplash.com/photo-1672380135241-c024f7fbfa13?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
}

# ── Mapping slug → (image_key, alt_text_SEO) ─────────────────────────────────
# alt text : décrit l'image + mots-clés SEO/GEO/AEO francophones
ARTICLES = [
    (
        "guide-comment-evaluer-la-valeur-dun-saas",
        "est_b",
        "Évaluer la valeur d'un SaaS en France — tableau de bord d'analyse de performance",
    ),
    (
        "le-marche-des-actifs-numeriques-en-2026-tendances-et-chiffre",
        "mkt_a",
        "Marché des actifs numériques en France 2026 — tendances achat et vente de sites internet",
    ),
    (
        "comment-preparer-la-vente-de-son-site-web-en-6-semaines",
        "sell_a",
        "Préparer la vente de son site web — ordinateur portable avec interface de gestion",
    ),
    (
        "due-diligence-pour-acheteurs-la-checklist-des-25-points-esse",
        "buy_d",
        "Due diligence achat site internet — checklist des 25 points essentiels pour acheteurs",
    ),
    (
        "saas-b2b-pourquoi-ils-dominent-le-marche-en-2026",
        "saas_a",
        "SaaS B2B en France 2026 — tableau de bord logiciel par abonnement",
    ),
    (
        "cession-dactif-numerique-les-clauses-essentielles-du-contrat",
        "law_a",
        "Cession d'actif numérique France — signature d'un contrat de vente de site internet",
    ),
    (
        "fixer-le-prix-de-vente-de-sa-boutique-e-commerce-guide-prati",
        "eco_a",
        "Fixer le prix d'une boutique e-commerce à vendre — valorisation Shopify France",
    ),
    (
        "la-citadelle-numerique-passe-le-cap-des-500-membres-actifs",
        "mkt_a",
        "La Citadelle Numérique — marketplace française spécialisée achat vente de sites",
    ),
    (
        "negocier-le-prix-dun-actif-numerique-strategies-avancees",
        "neg_a",
        "Négocier le prix d'un actif numérique — poignée de main après accord commercial",
    ),
    (
        "e-commerce-de-niche-le-filon-des-boutiques-sous-100-000",
        "eco_b",
        "Acheter une boutique e-commerce de niche sous 100 000 € — opportunité d'investissement",
    ),
    (
        "5-erreurs-qui-font-chuter-la-valeur-de-votre-actif-numerique",
        "est_c",
        "5 erreurs qui font chuter la valeur d'un actif numérique — analyse sur ordinateur",
    ),
    (
        "comment-vendre-un-site-internet",
        "sell_b",
        "Comment vendre un site internet en France — guide complet pour vendeurs 2026",
    ),
    (
        "comment-acheter-un-site-internet-sans-risque",
        "buy_a",
        "Comment acheter un site internet sans risque — guide complet pour acheteurs 2026",
    ),
    (
        "comment-estimer-valeur-site-internet",
        "est_a",
        "Comment estimer la valeur d'un site internet — méthode de calcul et multiples",
    ),
    (
        "criteres-valeur-site-internet",
        "est_b",
        "Critères qui déterminent la valeur d'un site internet — analyse SEO trafic revenus",
    ),
    (
        "comment-vendre-un-saas",
        "saas_b",
        "Comment vendre un SaaS en France — processus de cession logiciel par abonnement",
    ),
    (
        "comment-vendre-boutique-shopify",
        "eco_c",
        "Comment vendre une boutique Shopify — valorisation et étapes de cession",
    ),
    (
        "erreurs-valeur-site-internet",
        "est_d",
        "Erreurs d'estimation de la valeur d'un site internet — pièges à éviter",
    ),
    (
        "audit-seo-avant-achat-site-internet",
        "seo_b",
        "Audit SEO avant achat d'un site internet — analyse du référencement naturel",
    ),
    (
        "documents-vente-site-internet",
        "law_b",
        "Documents légaux obligatoires pour vendre un site internet en France",
    ),
    (
        "securiser-vente-site-internet",
        "sec_a",
        "Sécuriser la vente d'un site internet — cadenas de sécurité sur clavier",
    ),
    (
        "transfert-nom-de-domaine-vente-site",
        "mig_a",
        "Transfert de nom de domaine lors d'une vente de site internet — guide technique",
    ),
    (
        "migrer-hebergement-sans-perte-seo",
        "mig_b",
        "Migrer l'hébergement d'un site web sans perte de SEO — infrastructure cloud",
    ),
    (
        "acheter-ou-creer-un-site-internet",
        "buy_b",
        "Acheter ou créer un site internet : comparaison ROI et guide décision 2026",
    ),
    (
        "kpi-avant-acheter-business-digital",
        "kpi_a",
        "KPI essentiels à analyser avant d'acheter un business digital — tableau de bord",
    ),
    (
        "preparer-site-internet-a-la-vente",
        "sell_c",
        "Préparer son site internet à la vente — optimisation et valorisation avant cession",
    ),
    (
        "comment-vendre-une-application-mobile",
        "mob_a",
        "Comment vendre une application mobile — valorisation et processus de cession",
    ),
    (
        "comment-vendre-une-chaine-youtube",
        "yt_a",
        "Comment vendre une chaîne YouTube — valorisation et démarche de cession 2026",
    ),
    (
        "comment-vendre-un-compte-instagram",
        "yt_b",
        "Comment vendre un compte Instagram — guide valorisation et cession 2026",
    ),
    (
        "pieges-juridiques-vente-site-internet",
        "law_c",
        "Pièges juridiques de la vente d'un site internet en France — conseils d'experts",
    ),
    (
        "calculer-rentabilite-business-en-ligne",
        "kpi_b",
        "Calculer la rentabilité d'un business en ligne — métriques et formules clés",
    ),
    (
        "meilleurs-outils-auditer-site-internet",
        "seo_a",
        "Meilleurs outils pour auditer un site internet avant achat — analyse technique SEO",
    ),
    (
        "verifier-trafic-reel-site-avant-achat",
        "seo_c",
        "Vérifier le trafic réel d'un site internet avant achat — outils et méthodes 2026",
    ),
    (
        "combien-vaut-une-boutique-shopify",
        "eco_a",
        "Combien vaut une boutique Shopify ? — méthodes de valorisation et prix de vente",
    ),
    (
        "erreurs-migration-site-internet",
        "mig_c",
        "Erreurs courantes lors d'une migration de site internet — guide technique",
    ),
    (
        "proteger-business-digital-piratage",
        "sec_b",
        "Protéger son business digital contre le piratage — cybersécurité et bonnes pratiques",
    ),
    (
        "fixer-prix-vente-business-en-ligne",
        "est_a",
        "Fixer le prix de vente d'un business en ligne — méthode de valorisation 2026",
    ),
    (
        "acheter-un-saas-points-a-controler",
        "saas_c",
        "Acheter un SaaS : les points essentiels à contrôler avant acquisition France",
    ),
    (
        "tendances-marche-sites-internet-2026",
        "kpi_a",
        "Tendances du marché des sites internet en France 2026 — statistiques et prévisions",
    ),
    (
        "preparer-transmission-business-digital",
        "sell_d",
        "Préparer la transmission d'un business digital — guide complet cession d'entreprise",
    ),
    (
        "pourquoi-marketplace-specialisee-vendre-site",
        "neg_b",
        "Pourquoi choisir une marketplace spécialisée pour vendre son site internet — La Citadelle",
    ),
]


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc).isoformat()

    updated = 0
    not_found = []

    for slug, img_key, alt_text in ARTICLES:
        img_url = IMGS[img_key]
        result = await db.citadelle_blog_posts.update_one(
            {"slug": {"$regex": f"^{slug}"}},
            {"$set": {
                "cover_image_url": img_url,
                "cover_image_alt": alt_text,
                "updated_at": now,
            }}
        )
        if result.matched_count:
            updated += 1
            print(f"  ✅  {slug[:55]}")
        else:
            not_found.append(slug)
            print(f"  ❌  NON TROUVÉ: {slug[:55]}")

    print(f"\n{'='*60}")
    print(f"Articles mis à jour : {updated} / {len(ARTICLES)}")
    if not_found:
        print(f"Non trouvés : {not_found}")


if __name__ == "__main__":
    asyncio.run(main())
