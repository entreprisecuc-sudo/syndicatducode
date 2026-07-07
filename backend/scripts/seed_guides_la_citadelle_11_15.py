"""
Seed — Le Guide de La Citadelle (rubrique premium) — LOT 3 : Guides n°11 à 15
---------------------------------------------------------------------------------
Insère 5 guides en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : met à jour l'image des guides déjà présents, insère les absents.
Usage : python -m scripts.seed_guides_la_citadelle_11_15   (depuis /app/backend, venv actif)
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

CATEGORY = "guide-la-citadelle"
AUTHOR = "La Citadelle Numérique"

_IMG = "https://static.prod-images.emergentagent.com/jobs/bb5bc88e-9c1e-46ed-99db-f8c3b00e681b/images/"
COVERS = {
    11: _IMG + "0cafd8c6d2cff46de7e1bb2ae63eb933768b7d7cb925bf049c6053b2e9ddb413.png",
    12: _IMG + "29bfa3e67ba4339f7bceaba4c723cb05f3f94532e066a7191de98ed2ab7ecb97.png",
    13: _IMG + "3efe36f99a1969245f01e329d28bf8d551decb5fe9754182be717ee13197d4cc.png",
    14: _IMG + "75254f8da969b9345064e1623775b76394d65c209861d245f113059c3874bf47.png",
    15: _IMG + "f3122dfb9b9508e4607b6443fdb966a324d9ba170ad6d00e0c46b16740b9aab6.png",
}


GUIDES = [
    {
        "num": 11,
        "slug": "guide-la-citadelle-11-guide-complet-shopify-acheteurs-vendeurs",
        "date": "2026-09-19T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Le guide complet de Shopify pour acheteurs et vendeurs",
        "excerpt": "Créer, développer, valoriser, acheter et vendre une boutique Shopify rentable.",
        "seo": ["Shopify", "vendre Shopify", "acheter Shopify", "boutique Shopify"],
        "geo": ["Shopify France"],
        "aeo": [
            {"question": "Comment vendre une boutique Shopify ?", "answer": "Pour vendre une boutique Shopify : documentez le chiffre d'affaires et surtout les marges réelles, prouvez les ventes via le tableau de bord Shopify et le processeur de paiement, présentez les fournisseurs et la clientèle récurrente, calibrez le prix sur le bénéfice net, puis transmettez la boutique, les comptes et les relations fournisseurs."},
            {"question": "Comment acheter une boutique Shopify ?", "answer": "Pour acheter une boutique Shopify : vérifiez les marges réelles (pas seulement le chiffre d'affaires), la dépendance à la publicité payante, la solidité des fournisseurs, la part de clients récurrents et la force de la marque. Croisez les revenus avec le tableau de bord Shopify avant de sécuriser l'achat."},
        ],
        "content": """Shopify est devenu la plateforme de référence du e-commerce, et les boutiques Shopify figurent parmi les actifs les plus échangés. Mais derrière un chiffre d'affaires flatteur peuvent se cacher des marges fragiles. Ce guide de La Citadelle couvre l'achat et la vente d'une boutique Shopify, sans angle mort.

## Le piège du chiffre d'affaires

La première erreur, côté acheteur comme vendeur, est de se focaliser sur le **chiffre d'affaires**. Or ce qui compte, c'est la **marge nette**. Une boutique à 50 000 € de ventes mensuelles qui dépense 47 000 € en produits, publicité et frais ne vaut pas comme une boutique dégageant une marge saine.

> En e-commerce, le chiffre d'affaires impressionne, mais c'est la marge qui se paie.

## Les indicateurs clés d'une boutique Shopify

- **Marge brute et nette** : après coût des produits, publicité, frais Shopify et logistique.
- **Coût d'acquisition client (CAC)** et dépendance à la publicité payante.
- **Taux de clients récurrents** : une clientèle fidèle vaut bien plus qu'un flux dopé aux publicités.
- **Panier moyen** et taux de conversion.
- **Force de la marque** : une identité reconnue est un actif difficile à copier.

## Ce qui fait la valeur

Une boutique Shopify se valorise d'autant plus qu'elle repose sur des **bases solides** : une marque forte, une clientèle récurrente, des fournisseurs fiables et diversifiés, et une part raisonnable de trafic organique (SEO, direct) plutôt qu'une dépendance totale à la publicité payante.

## Prouver les revenus

La preuve reine est le **tableau de bord Shopify** croisé avec le processeur de paiement (Stripe, PayPal, Shopify Payments). Côté acheteur, exigez ces accès en lecture et recoupez-les avec les relevés bancaires. Méfiez-vous des captures d'écran isolées, facilement embellies.

## Les points de vigilance de l'acheteur

- **Dépendance publicitaire** : si les ventes s'effondrent dès qu'on coupe la pub, la rentabilité est illusoire.
- **Fournisseurs** : un fournisseur unique est un risque majeur (rupture, hausse de prix).
- **Dropshipping** : vérifiez les délais, la qualité et le taux de retours/litiges.
- **Applications Shopify** payantes : coûts récurrents et dépendances.

## Transmettre une boutique Shopify

La transmission inclut la boutique elle-même, le nom de domaine, les comptes de paiement, les **relations fournisseurs**, la liste clients et les applications installées. Documentez les processus (approvisionnement, service client, logistique) et prévoyez un accompagnement, car la relation fournisseur est souvent le point le plus délicat à transmettre.

## En résumé — La checklist Shopify

- **Raisonnez en marge nette**, pas en chiffre d'affaires.
- **Mesurez la dépendance publicitaire** et le taux de clients récurrents.
- **Vérifiez la solidité des fournisseurs.**
- **Prouvez les revenus** via Shopify + processeur de paiement.
- **Valorisez la marque** et la clientèle fidèle.
- **Transmettez** boutique, comptes, fournisseurs et processus.

Une boutique Shopify saine est un actif de premier plan ; une boutique dopée à la publicité, un mirage. Savoir les distinguer, c'est tout l'enjeu — et c'est là que l'accompagnement de La Citadelle prend tout son sens.""",
    },
    {
        "num": 12,
        "slug": "guide-la-citadelle-12-amazon-fba-de-a-a-z",
        "date": "2026-09-26T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Amazon FBA de A à Z",
        "excerpt": "Tout savoir sur la vente, la valorisation et la reprise d'un business Amazon FBA.",
        "seo": ["Amazon FBA", "vendre Amazon FBA", "acheter Amazon FBA"],
        "geo": ["Amazon France"],
        "aeo": [
            {"question": "Comment vendre un Amazon FBA ?", "answer": "Pour vendre un business Amazon FBA : documentez le chiffre d'affaires et la marge nette réelle, prouvez les ventes via Seller Central, valorisez les marques déposées et les avis produits, présentez les fournisseurs et les stocks, puis calibrez le prix sur le bénéfice net en tenant compte de la dépendance à la plateforme Amazon."},
        ],
        "content": """Amazon FBA (Fulfillment by Amazon) permet de vendre des produits en déléguant le stockage, l'expédition et le service client à Amazon. C'est un modèle puissant, mais dont la valeur dépend fortement de la marque, des avis et de la dépendance à la plateforme. Ce guide de La Citadelle en fait le tour, de A à Z.

## Comprendre le modèle FBA

Dans le modèle FBA, le vendeur envoie ses produits dans les entrepôts d'Amazon, qui se charge de la logistique. L'actif repose donc sur trois piliers : des **produits** qui se vendent, une **marque** (idéalement déposée) et une **réputation** (avis clients, historique du compte vendeur).

## Les indicateurs de valeur

- **Marge nette réelle** après coût produit, frais Amazon (commissions, FBA), publicité et retours.
- **Vélocité des ventes** et positionnement (Best Seller Rank).
- **Avis produits** : quantité et note moyenne, très difficiles à reconstituer ailleurs.
- **Marque déposée** et inscription au registre des marques Amazon.
- **Diversité du catalogue** : un business mono-produit est fragile.

## La dépendance à Amazon : le risque central

Le talon d'Achille du FBA est la **dépendance totale à Amazon**. Une suspension de compte, un changement de règles ou l'arrivée d'un concurrent agressif peut bouleverser les revenus du jour au lendemain. Les acheteurs avertis intègrent ce risque dans leur valorisation et recherchent les business ayant amorcé une **diversification** (site propre, autres canaux).

## Prouver les revenus

La source de vérité est **Seller Central** : rapports de ventes, de frais et de règlements. Côté acheteur, exigez un accès en lecture ou des exports complets, et croisez avec les versements réels. Attention aux périodes choisies : analysez sur 12 à 24 mois pour lisser la saisonnalité.

## Les points de vigilance

- **Stocks** : niveau, valeur, produits dormants, ruptures récentes.
- **Fournisseurs** : dépendance, délais, qualité, contrats.
- **Historique du compte** : suspensions passées, litiges, conformité.
- **Publicité (PPC)** : part des ventes dépendant des campagnes payantes.

## Transmettre un business FBA

La cession d'un FBA est spécifique : elle implique le transfert du **compte vendeur** (ou de la marque et des produits), la **marque déposée**, les **stocks** en entrepôt, et les **relations fournisseurs**. Le processus de transfert propre à Amazon doit être anticipé et documenté. Un accompagnement est fortement recommandé.

## En résumé — La checklist FBA

- **Raisonnez en marge nette**, frais Amazon et retours compris.
- **Valorisez la marque déposée et les avis produits.**
- **Mesurez la dépendance** à Amazon et à la publicité PPC.
- **Prouvez tout via Seller Central**, sur 12 à 24 mois.
- **Contrôlez stocks, fournisseurs et historique** du compte.
- **Anticipez le transfert** du compte, de la marque et des stocks.

Un business FBA solide repose sur une marque forte et une clientèle réelle ; un FBA fragile, sur un seul produit et une pub coûteuse. La Citadelle vous aide à faire la différence avant de signer.""",
    },
    {
        "num": 13,
        "slug": "guide-la-citadelle-13-guide-ultime-noms-de-domaine-premium",
        "date": "2026-10-03T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Le guide ultime des noms de domaine premium",
        "excerpt": "Acheter, vendre, estimer et sécuriser un nom de domaine premium, et identifier les opportunités d'investissement.",
        "seo": ["nom de domaine premium", "acheter nom de domaine", "vendre nom de domaine", "estimation nom de domaine", "domaine premium"],
        "geo": ["nom de domaine France", "registrar France"],
        "aeo": [
            {"question": "Comment acheter un nom de domaine premium ?", "answer": "Pour acheter un nom de domaine premium : vérifiez sa disponibilité et son historique (pénalités, usages passés), évaluez sa valeur selon la longueur, l'extension et le potentiel commercial, négociez via une plateforme sécurisée ou un courtier, puis sécurisez le transfert avec un séquestre et le code d'autorisation du registrar."},
            {"question": "Comment vendre un nom de domaine ?", "answer": "Pour vendre un nom de domaine : estimez-le objectivement, publiez-le sur une place de marché ou via un courtier, prouvez la propriété, sécurisez le paiement via un séquestre, puis transférez-le en fournissant le code d'autorisation et en déverrouillant le domaine chez le registrar."},
            {"question": "Combien vaut un nom de domaine ?", "answer": "La valeur d'un nom de domaine dépend de sa longueur (court = mieux), de son extension (.com en tête), de sa mémorisation, de son potentiel commercial ou de marque, de son historique et de la demande. Un mot unique en .com se négocie bien plus cher qu'un nom long ou une extension exotique."},
        ],
        "content": """Un nom de domaine n'est pas qu'une adresse : c'est un actif à part entière, qui peut se valoriser, s'échanger et même constituer un investissement. Ce guide de La Citadelle explore l'achat, la vente, l'estimation et la sécurisation des domaines premium.

## Qu'est-ce qu'un domaine premium ?

Un domaine premium est un nom rare et recherché : court, facile à mémoriser, souvent composé d'un mot fort, généralement en **.com**. Sa valeur tient à sa rareté et à son potentiel commercial ou de marque. À l'inverse, un nom long, alambiqué ou sur une extension exotique a une valeur limitée.

## Les critères de valeur

- **Longueur** : plus c'est court, mieux c'est.
- **Extension** : le **.com** domine ; les extensions nationales (.fr) et sectorielles ont leur marché.
- **Mémorisation et prononciation** : un nom simple vaut plus.
- **Potentiel commercial** : mot-clé à fort trafic ou nom de marque évident.
- **Historique** : un domaine ayant déjà servi peut porter une réputation… ou des pénalités.

## Vérifier avant d'acheter

Un domaine peut cacher un passé. Avant d'acheter, vérifiez son **historique** : usages précédents, éventuelles pénalités Google, présence sur des listes noires, contenus douteux archivés. Un beau nom au passé sulfureux peut être un cadeau empoisonné.

## Estimer un domaine

L'estimation combine des **comparables** (ventes récentes de noms similaires), les critères ci-dessus et la demande du moment. Des outils d'estimation existent, mais ils donnent une fourchette indicative, pas une vérité : la valeur finale reste celle qu'un acheteur est prêt à payer.

## Acheter et vendre en sécurité

Le risque principal d'une transaction de domaine est de **payer sans recevoir** (ou l'inverse). D'où l'importance d'un **séquestre** : les fonds sont sécurisés jusqu'au transfert effectif. Le transfert lui-même passe par le **registrar** : déverrouillage du domaine et remise du **code d'autorisation** (auth code / EPP). Ne réglez jamais avant que ce processus sécurisé ne soit engagé.

## Le domaine comme investissement

Certains investisseurs achètent des domaines pour les revendre (le « domaining »). C'est un marché réel mais spéculatif : il exige du flair, de la patience et une bonne compréhension des tendances. La majorité de la valeur se concentre sur une minorité de noms ; la prudence s'impose.

## En résumé — La checklist domaine

- **Privilégiez le court, le .com et la mémorisation.**
- **Vérifiez l'historique** : pénalités, usages, listes noires.
- **Estimez via des comparables**, sans surévaluer.
- **Sécurisez le paiement** avec un séquestre.
- **Transférez via le registrar** (déverrouillage + code d'autorisation).
- **Investissez avec prudence** : le domaining est spéculatif.

Bien choisi et bien sécurisé, un nom de domaine premium est un actif durable et liquide. La Citadelle vous accompagne pour l'acheter, le vendre ou l'estimer en toute confiance.""",
    },
    {
        "num": 14,
        "slug": "guide-la-citadelle-14-newsletters-rentables-creation-croissance-vente",
        "date": "2026-10-10T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Les newsletters rentables : création, croissance, valorisation et vente",
        "excerpt": "Créer une newsletter rentable, développer sa communauté, la monétiser puis la revendre dans les meilleures conditions.",
        "seo": ["vendre newsletter", "acheter newsletter", "newsletter rentable", "valorisation newsletter"],
        "geo": ["newsletter France"],
        "aeo": [
            {"question": "Peut-on vendre une newsletter ?", "answer": "Oui, une newsletter se vend comme un actif numérique. Sa valeur repose sur la taille et surtout l'engagement de la liste (taux d'ouverture, de clic), le modèle de monétisation (sponsoring, abonnement) et la relation directe avec l'audience. La liste d'abonnés et les revenus se transmettent au nouveau propriétaire."},
            {"question": "Comment valoriser une newsletter ?", "answer": "On valorise une newsletter sur ses revenus (sponsoring, abonnements payants) et sur la qualité de son audience : taille de liste, taux d'ouverture et de clic, croissance, niche et taux de désabonnement. Une liste engagée dans une niche à forte valeur vaut bien plus qu'une grande liste peu active."},
        ],
        "content": """La newsletter est l'un des actifs les plus résilients du numérique : une relation directe avec une audience, indépendante des algorithmes. Ce guide de La Citadelle explique comment créer, faire croître, monétiser et vendre une newsletter rentable.

## Pourquoi la newsletter est un actif solide

Contrairement au trafic SEO ou social, soumis aux algorithmes, la newsletter offre un **canal direct** vers l'audience. Cette relation, difficile à répliquer, en fait un actif transmissible et recherché — à condition qu'elle soit **engagée**, pas seulement nombreuse.

## Créer et faire croître une newsletter

La croissance d'une newsletter repose sur trois leviers :

- **La proposition de valeur** : une raison claire de s'abonner et de rester.
- **L'acquisition** : contenu, réseaux, partenariats, recommandations croisées.
- **La régularité** : un rythme tenu qui installe l'habitude.

La qualité prime sur la quantité : mieux vaut 5 000 abonnés fidèles que 50 000 inactifs.

## Les indicateurs de valeur

- **Taille de la liste**, mais surtout **taux d'ouverture** et **taux de clic**.
- **Croissance** nette (inscriptions moins désabonnements).
- **Taux de désabonnement** (churn) et santé de la délivrabilité.
- **Niche** : une audience B2B, finance ou tech se monétise mieux.
- **Modèle de revenus** : sponsoring, abonnement payant, produits.

## Monétiser une newsletter

Plusieurs modèles coexistent : le **sponsoring** (encarts payés par des annonceurs), l'**abonnement payant** (contenu premium), la **vente de produits** ou l'affiliation. Les newsletters les mieux valorisées combinent souvent revenus récurrents (abonnements) et sponsoring régulier.

## Valoriser et vendre

Une newsletter se valorise sur ses **revenus** et sur la **qualité de son audience**. Pour vendre dans les meilleures conditions :

- Documentez les statistiques (ouverture, clic, croissance) et les revenus.
- Prouvez la **propriété et la portabilité** de la liste (export possible).
- Présentez la ligne éditoriale et le calendrier.

Le point sensible de la transmission est le **transfert de la liste** et de la plateforme d'envoi, dans le respect des règles de consentement (RGPD).

## Le point RGPD

La liste d'abonnés est une base de **données personnelles**. Sa cession doit respecter le consentement des abonnés et les règles applicables. C'est un point à traiter sérieusement, idéalement avec un conseil, pour sécuriser juridiquement la vente.

## En résumé — La checklist newsletter

- **Visez l'engagement**, pas seulement la taille.
- **Suivez ouverture, clic et churn** de près.
- **Diversifiez la monétisation** : sponsoring + abonnement.
- **Prouvez revenus et statistiques.**
- **Assurez la portabilité de la liste** et le respect du RGPD.

Une newsletter engagée est un trésor transmissible : elle possède ce que tout le monde recherche, l'attention directe d'une audience. La Citadelle vous aide à la valoriser et à la céder sereinement.""",
    },
    {
        "num": 15,
        "slug": "guide-la-citadelle-15-acheter-et-vendre-une-application-mobile",
        "date": "2026-10-17T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Acheter et vendre une application mobile",
        "excerpt": "Le guide complet pour évaluer, sécuriser et céder une application mobile Android ou iOS.",
        "seo": ["vendre application mobile", "acheter application mobile", "application iOS", "application Android"],
        "geo": ["application mobile France"],
        "aeo": [
            {"question": "Comment vendre une application mobile ?", "answer": "Pour vendre une application mobile : documentez les téléchargements, la rétention et les revenus (achats intégrés, abonnements, publicité), prouvez ces données via les consoles développeur (App Store Connect, Google Play), présentez le code et les dépendances, puis transférez l'app, les comptes développeur et le code source de façon sécurisée."},
            {"question": "Combien vaut une application ?", "answer": "La valeur d'une application dépend de ses revenus et de leur récurrence, de la rétention des utilisateurs, du nombre de téléchargements actifs, des notes et avis, de la dette technique et de la dépendance aux stores. Une app à revenus récurrents et forte rétention vaut bien plus qu'une app à téléchargements sans usage."},
        ],
        "content": """Une application mobile peut être un actif très rentable, mais son évaluation obéit à des règles propres : rétention, dépendance aux stores et dette technique y pèsent lourd. Ce guide de La Citadelle couvre l'achat et la vente d'une app Android ou iOS.

## Les indicateurs qui comptent vraiment

Le nombre de téléchargements impressionne mais ne dit rien de la valeur. Les vrais indicateurs sont :

- **Utilisateurs actifs** (DAU/MAU) et surtout **rétention** dans le temps.
- **Revenus** : achats intégrés, abonnements, publicité — et leur récurrence.
- **Notes et avis** : réputation difficile à reconstituer.
- **Coût d'acquisition** et sources d'installation.

> Une app qui se télécharge beaucoup mais que personne n'utilise n'a presque aucune valeur.

## Comprendre les modèles de revenus

- **Abonnements** : les plus valorisés (récurrents, prévisibles).
- **Achats intégrés** ponctuels : à analyser selon leur régularité.
- **Publicité** : dépend du volume d'usage et des régies.
- **Freemium** : le taux de conversion vers le payant est clé.

## Prouver les revenus et l'audience

La source de vérité est la **console développeur** : App Store Connect (iOS) et Google Play Console (Android). Elles fournissent téléchargements, revenus, rétention et abonnements. Côté acheteur, exigez ces accès en lecture et croisez avec les versements réels.

## La dépendance aux stores

Comme le FBA dépend d'Amazon, une app dépend d'Apple et Google : règles, commissions, risque de retrait. Une app peut être suspendue pour non-conformité. Ce risque de plateforme doit être évalué, tout comme la conformité aux règles en vigueur.

## Auditer la technique

- **Qualité et maintenabilité du code** ; dette technique.
- **Dépendances** (SDK tiers, services backend, API).
- Compatibilité avec les **dernières versions** d'OS.
- Coûts d'**infrastructure** (serveurs, notifications, stockage).

## Transmettre une application

La cession implique le transfert de l'**app** sur les stores (via le transfert d'app ou de compte développeur), du **code source**, des **comptes** et de l'**infrastructure backend**. Les procédures de transfert d'Apple et Google doivent être anticipées. Un accompagnement technique post-vente est presque indispensable.

## En résumé — La checklist application

- **Regardez la rétention**, pas seulement les téléchargements.
- **Valorisez les revenus récurrents** (abonnements).
- **Prouvez tout via les consoles développeur.**
- **Évaluez la dépendance aux stores** et la conformité.
- **Auditez le code**, les dépendances et l'infrastructure.
- **Anticipez le transfert** d'app, de code et de comptes.

Une application à forte rétention et revenus récurrents est un actif de valeur ; une app aux installations sans usage, un leurre. La Citadelle vous aide à distinguer les deux et à sécuriser la cession.""",
    },
]


async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc).isoformat()
    created, skipped = 0, 0

    for g in GUIDES:
        cover = COVERS[g["num"]]
        existing = await db.citadelle_blog_posts.find_one({"slug": g["slug"]})
        if existing:
            await db.citadelle_blog_posts.update_one(
                {"slug": g["slug"]},
                {"$set": {"cover_image_url": cover, "updated_at": now}},
            )
            skipped += 1
            print(f"  ↻ Guide n°{g['num']} déjà présent — image mise à jour")
            continue
        post = {
            "id": str(uuid.uuid4()),
            "slug": g["slug"],
            "title": g["title"],
            "excerpt": g["excerpt"],
            "content_md": g["content"],
            "category": CATEGORY,
            "author_name": AUTHOR,
            "partner_link": None,
            "cover_image_url": cover,
            "is_published": False,
            "scheduled_at": g["date"],
            "published_at": None,
            "seo_title": g["title"],
            "seo_description": g["excerpt"][:300],
            "seo_keywords": g["seo"],
            "geo_keywords": g["geo"],
            "aeo_questions": g["aeo"],
            "view_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        await db.citadelle_blog_posts.insert_one(post)
        created += 1
        print(f"  ✓ Guide n°{g['num']} programmé le {g['date'][:10]} — {g['slug']}")

    print(f"\nLot 3 (Guides) terminé — {created} guide(s) créé(s), {skipped} mis à jour.")


if __name__ == "__main__":
    asyncio.run(main())
