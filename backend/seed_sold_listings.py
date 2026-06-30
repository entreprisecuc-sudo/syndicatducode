"""
Script de seed — Annonces vendues fictives
La Citadelle Numérique

But : insérer une dizaine d'annonces au statut "sold" pour la preuve sociale.
Idempotent : vérifie d'abord l'existence via is_seed_data=True avant toute insertion.

Usage (preview ou VPS) :
    cd /app/backend                                    (preview Emergent)
    cd /var/www/syndicatducode.fr/backend              (VPS)
    python seed_sold_listings.py
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Chargement des variables d'environnement
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# ── Marqueur de seed — permet l'idempotence ─────────────────────────────────
SEED_MARKER = "is_seed_data"

# ── ID vendeur fictif (ne correspond à aucun compte réel) ───────────────────
SEED_SELLER_ID = "00000000-seed-0000-0000-000000000000"


def _dt(days_ago: int) -> str:
    """Retourne une date ISO passée."""
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


def _listing(
    title: str,
    listing_type: str,
    short_desc: str,
    description: str,
    price: float,
    monthly_revenue: float,
    monthly_traffic: int,
    age_months: int,
    niche: str,
    technologies: list,
    images: list,
    garde_verified: bool,
    created_days_ago: int,
    sold_days_ago: int,
    views_count: int,
) -> dict:
    """Construit un document d'annonce vendue."""
    slug_base = title.lower()
    # Nettoyage du slug
    import re
    slug_base = re.sub(r"[^a-z0-9\s-]", "", slug_base)
    slug_base = re.sub(r"[\s-]+", "-", slug_base).strip("-")
    slug = f"{slug_base}-{uuid.uuid4().hex[:8]}"

    created_at = _dt(created_days_ago)
    sold_at = _dt(sold_days_ago)

    return {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": title,
        "type": listing_type,
        "short_description": short_desc,
        "description": description,
        "seller_id": SEED_SELLER_ID,
        "seller_email": "vendeur@exemple.fr",
        "status": "sold",
        "price": price,
        "price_negotiable": False,
        "monthly_revenue": monthly_revenue,
        "monthly_traffic": monthly_traffic,
        "age_months": age_months,
        "niche": niche,
        "technologies": technologies,
        "url_preview": None,           # Masqué — valeur fictive non nécessaire
        "images": images,
        "is_featured": False,
        "is_verified": True,
        "garde_verified": garde_verified,
        "garde_verified_at": created_at if garde_verified else None,
        "views_count": views_count,
        "favorites_count": 0,
        "rejection_reason": None,
        "created_at": created_at,
        "updated_at": sold_at,
        "published_at": created_at,
        "expires_at": None,
        "sold_at": sold_at,
        # Enchères (désactivées)
        "is_auction": False,
        "auction_show_reserve": False,
        "auction_duration_days": 7,
        "auction_buy_now_price": None,
        "auction_ends_at": None,
        "auction_current_bid": None,
        "auction_current_bidder_id": None,
        "auction_current_bidder_email": None,
        "auction_current_bidder_name": None,
        "auction_bids": [],
        "auction_winner_transaction_id": None,
        # Marqueur seed
        SEED_MARKER: True,
    }


# ── Catalogue des 11 annonces fictives ───────────────────────────────────────

SEED_LISTINGS = [

    _listing(
        title="Logiciel RH — Gestion congés & absences",
        listing_type="saas",
        short_desc="SaaS B2B de gestion des congés, absences et plannings. 42 entreprises clientes, MRR stable depuis 14 mois.",
        description="""## Présentation

Logiciel SaaS de gestion des ressources humaines (congés, absences, plannings) à destination des PME de 10 à 200 salariés.

**Chiffres clés**
- 42 clients actifs (contrats annuels)
- MRR : 1 850 € / mois
- Taux de churn < 3 % / an
- Infrastructure hébergée sur un VPS managé (coût < 80 €/mois)

**Fonctionnalités**
- Tableau de bord RH temps réel
- Workflow de validation multi-niveaux
- Export SILAE / SAGE compatible
- Application mobile incluse (iOS & Android)

**Points forts**
- Contrats en cours jusqu'à fin d'année (revenu garanti)
- Code source bien documenté (Laravel + Vue.js)
- Support technique transférable

Cession pour raisons personnelles. Accompagnement 30 jours inclus.""",
        price=28500,
        monthly_revenue=1850,
        monthly_traffic=3200,
        age_months=22,
        niche="SaaS B2B / RH",
        technologies=["Laravel", "Vue.js", "MySQL", "Redis"],
        images=["https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=True,
        created_days_ago=310,
        sold_days_ago=280,
        views_count=487,
    ),

    _listing(
        title="Boutique mode féminine — Prêt-à-porter",
        listing_type="ecommerce",
        short_desc="E-commerce mode femme. 2 400 références, 18 mois d'ancienneté, CA mensuel régulier. Fournisseurs européens exclusifs.",
        description="""## Présentation

Boutique e-commerce spécialisée dans la mode féminine (prêt-à-porter, accessoires). Clientèle française et belge.

**Chiffres clés**
- CA mensuel moyen : 980 € net
- Panier moyen : 62 €
- 2 400 références produits actives
- Taux de retour : 8 %

**Atouts**
- Accords exclusifs avec 3 fournisseurs européens
- 4 800 abonnées newsletter actives
- Compte Instagram : 6 200 abonnés
- Avis clients 4,6/5 sur Trustpilot (112 avis)

**Stack technique**
- WooCommerce (WordPress)
- Hébergement O2switch
- Thème premium personnalisé

Cession complète : domaine, stock, contrats fournisseurs et réseaux sociaux.""",
        price=14200,
        monthly_revenue=980,
        monthly_traffic=8400,
        age_months=18,
        niche="Mode / Textile",
        technologies=["WooCommerce", "WordPress", "Stripe"],
        images=["https://images.unsplash.com/photo-1753161618211-2b3d3166133a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=260,
        sold_days_ago=225,
        views_count=312,
    ),

    _listing(
        title="Blog finance personnelle — 42 000 visiteurs/mois",
        listing_type="blog",
        short_desc="Blog SEO finance personnelle, épargne et investissement. 42 000 visites organiques mensuelles. Monétisé via affiliation.",
        description="""## Présentation

Blog thématique sur la finance personnelle, l'épargne et l'investissement. Créé il y a 3 ans, positionné sur des mots-clés à forte valeur.

**Trafic**
- 42 000 visites organiques / mois (Google Search Console)
- 38 articles positionnés en top 3
- DA (Moz) : 28

**Monétisation**
- Affiliation bancaire : 390 € / mois
- Affiliation assurance-vie : 180 € / mois
- Articles sponsorisés : 50 € / mois (3-4 par an)

**Contenu**
- 86 articles publiés (tous originaux)
- 12 guides PDF téléchargeables
- Fichier email : 1 840 abonnés

Vente pour réorientation professionnelle. Toutes les sources de trafic et partenariats d'affiliation inclus dans la cession.""",
        price=8900,
        monthly_revenue=620,
        monthly_traffic=42000,
        age_months=36,
        niche="Finance personnelle",
        technologies=["WordPress", "Ahrefs", "Mailchimp"],
        images=["https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=True,
        created_days_ago=220,
        sold_days_ago=195,
        views_count=398,
    ),

    _listing(
        title="Application web — Gestion de projets freelances",
        listing_type="webapp",
        short_desc="Outil SaaS de gestion de projets et devis pour freelances. 380 utilisateurs actifs, plan Freemium + Pro (19€/mois).",
        description="""## Présentation

Application web de gestion de projets, devis et facturation pour les freelances et consultants indépendants.

**Utilisateurs**
- 380 utilisateurs actifs
- 48 abonnés plan Pro (19 €/mois) = 912 €/mois
- Taux de conversion freemium → payant : 12,6 %

**Fonctionnalités**
- Création de devis et factures PDF
- Suivi du temps par projet
- Tableau Kanban intégré
- Portail client pour validation

**Technique**
- Backend FastAPI + MongoDB
- Frontend React
- Hébergement Railway (70 €/mois)

Raison de cession : repositionnement sur un autre projet. Documentation technique complète fournie. Migration accompagnée.""",
        price=22000,
        monthly_revenue=1350,
        monthly_traffic=5600,
        age_months=14,
        niche="Productivité / Freelance",
        technologies=["FastAPI", "React", "MongoDB", "Railway"],
        images=["https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=190,
        sold_days_ago=162,
        views_count=276,
    ),

    _listing(
        title="Site vitrine agence immobilière régionale",
        listing_type="website",
        short_desc="Site vitrine immobilier avec espace agents, formulaires de contact et portail annonces. Trafic local établi.",
        description="""## Présentation

Site vitrine professionnel pour agence immobilière régionale (Sud-Ouest). Espace agents connecté, liste d'annonces dynamique et formulaires de contact.

**Performances**
- 1 800 visites locales / mois
- 12 prospects qualifiés / mois via formulaires
- Bien positionné sur les requêtes locales (vérifiable)

**Fonctionnalités**
- Espace agents privé (login / annonces)
- Galerie photo immersive
- Formulaire estimation gratuite
- Compatible Google My Business

**Technique**
- WordPress + ACF
- Thème sur-mesure (PSD fourni)
- Hébergement inclus jusqu'à fin d'année

Vendu suite à fermeture de l'agence. Transférable à toute agence du secteur.""",
        price=4500,
        monthly_revenue=180,
        monthly_traffic=1800,
        age_months=28,
        niche="Immobilier / Local",
        technologies=["WordPress", "ACF", "Google Maps API"],
        images=["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=150,
        sold_days_ago=128,
        views_count=189,
    ),

    _listing(
        title="Boutique Shopify — Équipements fitness & running",
        listing_type="shopify_store",
        short_desc="Boutique Shopify spécialisée fitness et running. 6 800 clients, 3 fournisseurs en dropshipping EU. Annonces Meta rentables.",
        description="""## Présentation

Boutique Shopify spécialisée dans l'équipement fitness et running. Créée il y a 2 ans, elle génère un revenu stable via des fournisseurs européens en dropshipping.

**Chiffres**
- CA mensuel moyen : 870 € net
- 6 800 clients dans la base email
- 320 références produits actives
- ROAS Meta Ads : 2,8

**Inclus dans la cession**
- Compte Shopify (plan Basic)
- 3 accords fournisseurs dropshipping EU (délais 3-5j)
- Bibliothèque publicités Meta (68 visuels)
- Compte Instagram 4 100 abonnés

Raison de vente : déménagement à l'étranger. Formation au tunnel de vente incluse.""",
        price=11800,
        monthly_revenue=870,
        monthly_traffic=12300,
        age_months=24,
        niche="Sport / Fitness",
        technologies=["Shopify", "Meta Ads", "Klaviyo"],
        images=["https://images.unsplash.com/photo-1595909315417-2edd382a56dc?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=True,
        created_days_ago=130,
        sold_days_ago=108,
        views_count=341,
    ),

    _listing(
        title="Newsletter B2B — Marketing digital (3 200 abonnés)",
        listing_type="newsletter",
        short_desc="Newsletter hebdomadaire marketing digital pour dirigeants et marketeurs. 3 200 abonnés qualifiés. Taux d'ouverture 38 %.",
        description="""## Présentation

Newsletter hebdomadaire sur le marketing digital, les tendances réseaux sociaux et l'IA. Audience B2B : dirigeants, responsables marketing, freelances.

**Audience**
- 3 200 abonnés actifs (liste propre, opt-in double)
- Taux d'ouverture : 38 %
- Taux de clic : 8,4 %
- Croissance organique : +120 abonnés / mois

**Monétisation**
- 1 sponsor exclusif / semaine (300 €)
- Liens affiliés : 20 €/mois
- Total : ~320 €/mois

**Stack**
- ConvertKit (liste + séquences incluses)
- Archive web complète (52 éditions)

Idéal pour un créateur ou une agence cherchant une audience B2B captive et engagée.""",
        price=5200,
        monthly_revenue=320,
        monthly_traffic=0,
        age_months=16,
        niche="Marketing digital / B2B",
        technologies=["ConvertKit", "Notion"],
        images=["https://images.unsplash.com/photo-1596526131083-e8c633c948d2?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=110,
        sold_days_ago=90,
        views_count=224,
    ),

    _listing(
        title="Chaîne YouTube — Recettes healthy & nutrition",
        listing_type="youtube_channel",
        short_desc="Chaîne YouTube cuisine healthy : 28 000 abonnés, 180 vidéos, monétisée AdSense + affiliation compléments alimentaires.",
        description="""## Présentation

Chaîne YouTube axée sur les recettes healthy, la nutrition et le bien-être. Audience principalement féminine (25-45 ans), francophone.

**Statistiques**
- 28 000 abonnés
- 180 vidéos publiées
- 4,2 M de vues cumulées
- 45 000 vues / mois en moyenne

**Monétisation**
- AdSense : 280 €/mois
- Affiliation compléments alimentaires : 170 €/mois
- Total : ~450 €/mois

**Inclus**
- Accès complet YouTube Studio
- Compte Instagram associé (8 100 abonnés)
- Templates Canva et banque d'images libres de droits

Vente pour raisons familiales. Accompagnement 15 jours inclus pour transmission des partenariats.""",
        price=7600,
        monthly_revenue=450,
        monthly_traffic=0,
        age_months=30,
        niche="Cuisine / Nutrition / Bien-être",
        technologies=["YouTube Studio", "Canva", "Awin Affiliation"],
        images=["https://images.unsplash.com/photo-1758522488093-069c740feb3f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=95,
        sold_days_ago=74,
        views_count=208,
    ),

    _listing(
        title="Forum communautaire — Développeurs Python & JavaScript",
        listing_type="forum",
        short_desc="Forum actif développeurs Python et JS. 4 800 membres, 12 000 sujets, trafic SEO long tail. Monétisé via bannières.",
        description="""## Présentation

Forum communautaire francophone pour développeurs Python et JavaScript. Créé en 2020, il bénéficie d'un fort référencement long tail.

**Communauté**
- 4 800 membres inscrits
- 12 000 sujets
- 38 000 réponses
- 14 000 visiteurs uniques / mois (dont 80 % organiques)

**Monétisation**
- Bannières CPC : 150 €/mois
- Forum sponsorisé (offre d'emploi en avant) : 60 €/mois
- Total : ~210 €/mois

**Technique**
- Discourse (auto-hébergé)
- VPS 8 Go RAM (bail mensuel à 35 €)
- Sauvegarde complète incluse

Idéal pour une entreprise tech ou un créateur de contenu souhaitant une audience qualifiée.""",
        price=6100,
        monthly_revenue=210,
        monthly_traffic=14000,
        age_months=48,
        niche="Tech / Développement",
        technologies=["Discourse", "PostgreSQL"],
        images=["https://images.unsplash.com/photo-1542831371-29b0f74f9713?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=80,
        sold_days_ago=62,
        views_count=197,
    ),

    _listing(
        title="SaaS facturation en ligne — TPE/PME",
        listing_type="saas",
        short_desc="Logiciel de facturation SaaS conforme PDP. 185 abonnés actifs (15€/mois), intégration comptable Pennylane & QuickBooks.",
        description="""## Présentation

Logiciel de facturation en ligne conforme aux exigences PDP 2026, destiné aux TPE et PME françaises.

**Chiffres clés**
- 185 abonnés actifs (plan 15 €/mois)
- MRR : 2 775 € (net après Stripe : ~2 650 €)
- Churn mensuel : < 1,5 %
- NPS : 62

**Fonctionnalités**
- Devis → Facture en 1 clic
- Chorus Pro (marchés publics)
- Connexion Pennylane & QuickBooks
- Relances automatiques
- Module TVA et déclaration CA12

**Technique**
- Node.js + PostgreSQL
- Hébergement Scaleway (120 €/mois)
- Conformité RGPD & e-invoicing EU

Opportunité rare sur un marché en forte croissance avec la réforme PDP 2026.""",
        price=42000,
        monthly_revenue=2800,
        monthly_traffic=6800,
        age_months=26,
        niche="Comptabilité / Facturation",
        technologies=["Node.js", "PostgreSQL", "Stripe", "Pennylane"],
        images=["https://images.unsplash.com/photo-1652422485224-102f6784c149?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=True,
        created_days_ago=65,
        sold_days_ago=44,
        views_count=562,
    ),

    _listing(
        title="Compte Amazon FBA — Ustensiles de cuisine",
        listing_type="amazon_fba",
        short_desc="Compte Amazon FBA 3 SKUs ustensiles de cuisine. Note moyenne 4,7/5 (890 avis), BSR top 2 % catégorie.",
        description="""## Présentation

Compte Amazon FBA spécialisé ustensiles de cuisine premium. 3 références produits avec une note moyenne de 4,7/5 et un historique de ventes de 18 mois.

**Chiffres clés**
- Revenu net mensuel : 1 200 € (après fees FBA et PPC)
- 890 avis vérifiés (4,7/5 de moyenne)
- BSR : top 2 % catégorie Cuisine & Maison
- Stock actuel : 240 unités (inclus dans la cession)

**Produits**
- SKU 1 : Set de spatules silicone (best-seller)
- SKU 2 : Planche à découper bambou premium
- SKU 3 : Passoire acier inoxydable

**Inclus**
- Compte Seller Central (health score vert)
- Accès fournisseur Alibaba + moules propriétaires
- Campagnes PPC optimisées

Vente pour réorientation vers un autre marché. Formation PPC offerte.""",
        price=18500,
        monthly_revenue=1200,
        monthly_traffic=0,
        age_months=18,
        niche="Amazon FBA / Maison & Cuisine",
        technologies=["Amazon Seller Central", "Helium10"],
        images=["https://images.unsplash.com/photo-1633174524827-db00a6b7bc74?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"],
        garde_verified=False,
        created_days_ago=50,
        sold_days_ago=32,
        views_count=143,
    ),

]


# ── Logique principale ────────────────────────────────────────────────────────

async def run():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    already_seeded = await db.citadelle_listings.count_documents({SEED_MARKER: True})

    if already_seeded > 0:
        print(f"[Seed] {already_seeded} annonce(s) seed déjà présente(s). Aucune insertion.")
        client.close()
        return

    result = await db.citadelle_listings.insert_many(SEED_LISTINGS)
    print(f"[Seed] {len(result.inserted_ids)} annonce(s) fictive(s) insérée(s) avec succès.")
    client.close()


if __name__ == "__main__":
    asyncio.run(run())
