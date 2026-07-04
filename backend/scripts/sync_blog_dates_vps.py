"""
Synchronise les dates de publication des articles de blog sur le VPS.
Met published_at + created_at par slug (source : preview au 04/07/2026).
Usage sur le VPS : cd /var/www/syndicatducode.fr/backend && source venv/bin/activate && python3 scripts/sync_blog_dates_vps.py
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

DATES = {
    "guide-comment-evaluer-la-valeur-dun-saas": "2026-05-10T09:00:00",
    "le-marche-des-actifs-numeriques-en-2026-tendances-et-chiffres-cles": "2026-05-11T09:00:00",
    "comment-preparer-la-vente-de-son-site-web-en-6-semaines": "2026-05-12T09:00:00",
    "due-diligence-pour-acheteurs-la-checklist-des-25-points-essentiels": "2026-05-13T09:00:00",
    "saas-b2b-pourquoi-ils-dominent-le-marche-en-2026": "2026-05-14T09:00:00",
    "cession-dactif-numerique-les-clauses-essentielles-du-contrat": "2026-05-15T09:00:00",
    "fixer-le-prix-de-vente-de-sa-boutique-e-commerce-guide-pratique": "2026-05-16T09:00:00",
    "la-citadelle-numerique-passe-le-cap-des-500-membres-actifs": "2026-05-17T09:00:00",
    "negocier-le-prix-dun-actif-numerique-strategies-avancees": "2026-05-18T09:00:00",
    "e-commerce-de-niche-le-filon-des-boutiques-sous-100-000": "2026-05-19T09:00:00",
    "5-erreurs-qui-font-chuter-la-valeur-de-votre-actif-numerique": "2026-05-20T09:00:00",
    "comment-vendre-un-site-internet": "2026-06-19T09:00:00",
    "comment-acheter-un-site-internet-sans-risque": "2026-06-18T09:00:00",
    "comment-estimer-valeur-site-internet": "2026-06-17T09:00:00",
    "criteres-valeur-site-internet": "2026-06-16T09:00:00",
    "comment-vendre-un-saas": "2026-06-15T09:00:00",
    "comment-vendre-boutique-shopify": "2026-06-14T09:00:00",
    "erreurs-valeur-site-internet": "2026-06-13T09:00:00",
    "audit-seo-avant-achat-site-internet": "2026-06-12T09:00:00",
    "documents-vente-site-internet": "2026-06-11T09:00:00",
    "securiser-vente-site-internet": "2026-06-10T09:00:00",
    "transfert-nom-de-domaine-vente-site": "2026-06-09T09:00:00",
    "migrer-hebergement-sans-perte-seo": "2026-06-08T09:00:00",
    "acheter-ou-creer-un-site-internet": "2026-06-07T09:00:00",
    "kpi-avant-acheter-business-digital": "2026-06-06T09:00:00",
    "preparer-site-internet-a-la-vente": "2026-06-05T09:00:00",
    "comment-vendre-une-application-mobile": "2026-06-04T09:00:00",
    "comment-vendre-une-chaine-youtube": "2026-06-03T09:00:00",
    "comment-vendre-un-compte-instagram": "2026-06-02T09:00:00",
    "pieges-juridiques-vente-site-internet": "2026-06-01T09:00:00",
    "calculer-rentabilite-business-en-ligne": "2026-05-31T09:00:00",
    "meilleurs-outils-auditer-site-internet": "2026-05-30T09:00:00",
    "verifier-trafic-reel-site-avant-achat": "2026-05-29T09:00:00",
    "combien-vaut-une-boutique-shopify": "2026-05-28T09:00:00",
    "erreurs-migration-site-internet": "2026-05-27T09:00:00",
    "proteger-business-digital-piratage": "2026-05-26T09:00:00",
    "fixer-prix-vente-business-en-ligne": "2026-05-25T09:00:00",
    "acheter-un-saas-points-a-controler": "2026-05-24T09:00:00",
    "tendances-marche-sites-internet-2026": "2026-05-23T09:00:00",
    "preparer-transmission-business-digital": "2026-05-22T09:00:00",
    "pourquoi-marketplace-specialisee-vendre-site": "2026-05-21T09:00:00",
    "comment-vendre-un-nom-de-domaine-au-meilleur-prix": "2026-07-04T09:00:00",
    "comment-acheter-un-nom-de-domaine-premium": "2026-07-03T09:00:00",
    "comment-estimer-la-valeur-dun-nom-de-domaine": "2026-07-02T09:00:00",
    "les-erreurs-a-eviter-lors-de-lachat-dun-nom-de-domaine": "2026-07-01T09:00:00",
    "comment-vendre-une-newsletter-rentable": "2026-06-30T09:00:00",
    "peut-on-vendre-une-page-facebook": "2026-06-29T09:00:00",
    "peut-on-vendre-un-compte-tiktok": "2026-06-28T09:00:00",
    "peut-on-vendre-un-compte-linkedin": "2026-06-27T09:00:00",
    "peut-on-vendre-un-serveur-discord": "2026-06-26T09:00:00",
    "comment-vendre-un-forum-en-ligne": "2026-06-25T09:00:00",
    "les-reseaux-sociaux-augmentent-ils-la-valeur-dun-site-internet": "2026-06-24T09:00:00",
    "comment-transferer-un-compte-google-analytics-et-search-console": "2026-06-23T09:00:00",
    "les-actifs-numeriques-les-plus-rentables-a-acheter-en-2026": "2026-06-22T09:00:00",
    "comment-eviter-les-arnaques-lors-de-lachat-dun-business-digital": "2026-06-21T09:00:00",
    "comment-preparer-un-dossier-de-vente-professionnel": "2026-06-20T09:00:00",
}


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    updated = 0
    missing = []
    for slug, dt in DATES.items():
        res = await db.citadelle_blog_posts.update_one(
            {"slug": slug},
            {"$set": {"published_at": dt, "created_at": dt}},
        )
        if res.matched_count:
            updated += 1
        else:
            missing.append(slug)
    print(f"Articles mis a jour : {updated} / {len(DATES)}")
    if missing:
        print(f"Slugs introuvables sur le VPS ({len(missing)}) :")
        for s in missing:
            print("  -", s)
    total = await db.citadelle_blog_posts.count_documents({})
    print(f"Total articles en base VPS : {total}")


if __name__ == "__main__":
    asyncio.run(main())
