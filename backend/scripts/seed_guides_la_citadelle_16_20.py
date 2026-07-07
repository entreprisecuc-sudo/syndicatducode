"""
Seed — Le Guide de La Citadelle (rubrique premium) — LOT 4 : Guides n°16 à 20
---------------------------------------------------------------------------------
Insère 5 guides en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : met à jour l'image des guides déjà présents, insère les absents.
Usage : python -m scripts.seed_guides_la_citadelle_16_20   (depuis /app/backend, venv actif)
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
    16: _IMG + "4b56212d1d4b76bd51927e863705461e77af4be91838229c87163aff7ac78f73.png",
    17: _IMG + "7151a03af907c0235eeb1ccacb9b10a08e7a6397c9608198551f56ce86ee013b.png",
    18: _IMG + "d81d48230ec6faf8ca93954a2f772d3c76732fd69a518c1a607dd699804a74a4.png",
    19: _IMG + "81ecf2be3c813f43dda450f918bb0781480933705302131fe0464a63214f6a83.png",
    20: _IMG + "d51a2d42ba66f036d3b48f9203abd7b210414eac278eee580ea8cd1ec4deffcc.png",
}


GUIDES = [
    {
        "num": 16,
        "slug": "guide-la-citadelle-16-acheter-et-vendre-une-chaine-youtube-rentable",
        "date": "2026-10-24T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Acheter et vendre une chaîne YouTube rentable",
        "excerpt": "Toutes les étapes pour valoriser une chaîne YouTube, analyser ses revenus et réussir sa transmission.",
        "seo": ["vendre chaîne YouTube", "acheter chaîne YouTube", "monétisation YouTube", "chaîne YouTube rentable"],
        "geo": ["YouTube France"],
        "aeo": [
            {"question": "Peut-on vendre une chaîne YouTube ?", "answer": "Oui, une chaîne YouTube peut se vendre, mais la cession comporte des spécificités : elle est liée à un compte Google et aux règles de la plateforme. La valeur repose sur les revenus (publicité, sponsoring), l'audience, l'engagement et la régularité, et le transfert doit respecter les conditions de YouTube."},
            {"question": "Comment estimer une chaîne YouTube ?", "answer": "On estime une chaîne YouTube sur ses revenus (AdSense, sponsoring, produits), le nombre et l'engagement des abonnés, les vues récurrentes, le RPM, la niche et la régularité de publication. La dépendance à la personnalité du créateur et aux règles de la plateforme est un facteur de risque à intégrer."},
        ],
        "content": """Une chaîne YouTube rentable est un actif attirant, mais sa cession est délicate : elle est liée à un compte Google, dépend des règles de la plateforme et, souvent, de la personnalité du créateur. Ce guide de La Citadelle détaille comment valoriser et transmettre une chaîne YouTube.

## Les sources de revenus d'une chaîne

Une chaîne peut générer des revenus variés :

- **Publicité YouTube (AdSense)** : selon les vues et le RPM (revenu pour mille vues).
- **Sponsoring et placements** : souvent la part la plus rentable.
- **Produits et affiliation** : boutique, formations, liens affiliés.
- **Adhésions et Super Chats** : revenus directs de la communauté.

## Les indicateurs de valeur

- **Vues récurrentes** (et pas seulement le nombre d'abonnés).
- **Engagement** : likes, commentaires, durée de visionnage.
- **RPM et revenus** sur 12 à 24 mois.
- **Niche** : certaines thématiques (finance, tech) ont un RPM bien supérieur.
- **Régularité** et bibliothèque de vidéos « evergreen » qui génèrent des vues durables.

## Le défi de la dépendance au créateur

Le principal risque d'une chaîne est sa **dépendance à la personnalité** du créateur. Si l'audience vient pour un visage et une voix, la chaîne perd de sa valeur une fois cédée. Les chaînes les plus transmissibles reposent sur un **format** ou une **thématique** plutôt que sur une personne — ce qui permet à un repreneur de poursuivre.

## Prouver les revenus et l'audience

La source de vérité est **YouTube Studio** (analytics et revenus) croisée avec le compte AdSense. Exigez ces accès en lecture. Analysez la tendance des vues et des revenus sur la durée, et méfiez-vous des pics liés à une seule vidéo virale.

## Les règles de la plateforme

La cession d'une chaîne doit respecter les **conditions de YouTube/Google**. Le transfert passe généralement par le changement de propriété du compte Google associé, ce qui demande méthode et prudence. Vérifiez aussi l'historique : avertissements, strikes, démonétisations passées.

## Transmettre une chaîne

La transmission implique le transfert du **compte** (ou de la propriété via une marque/entreprise), l'accès à YouTube Studio, au compte AdSense, et la documentation des partenariats de sponsoring en cours. Un accompagnement est recommandé pour assurer la continuité éditoriale.

## En résumé — La checklist YouTube

- **Regardez les vues récurrentes et l'engagement**, pas seulement les abonnés.
- **Diversifiez les revenus** : pub, sponsoring, produits.
- **Évaluez la dépendance au créateur** : format {'>'} personne.
- **Prouvez tout via YouTube Studio + AdSense.**
- **Respectez les règles** de transfert et vérifiez l'historique.
- **Assurez la continuité éditoriale** à la transmission.

Une chaîne bâtie sur un format transmissible et des revenus diversifiés est un bel actif ; une chaîne reposant sur une seule personne, un pari risqué. La Citadelle vous aide à évaluer et sécuriser l'opération.""",
    },
    {
        "num": 17,
        "slug": "guide-la-citadelle-17-instagram-tiktok-facebook-linkedin-valoriser-communaute",
        "date": "2026-10-31T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Instagram, TikTok, Facebook et LinkedIn : valoriser une communauté",
        "excerpt": "Comprendre comment la taille, l'engagement et la qualité d'une communauté influencent la valeur d'un actif numérique.",
        "seo": ["vendre compte Instagram", "vendre TikTok", "vendre Facebook", "vendre LinkedIn"],
        "geo": ["réseaux sociaux France"],
        "aeo": [
            {"question": "Peut-on vendre un compte Instagram ?", "answer": "La vente d'un compte de réseau social existe sur le marché, mais elle est encadrée : la plupart des plateformes interdisent ou restreignent le transfert de comptes dans leurs conditions d'utilisation. La valeur dépend de l'engagement réel, de la niche et de la monétisation, et le risque de fermeture doit être pris en compte."},
            {"question": "Peut-on vendre une page Facebook ?", "answer": "Une page ou une communauté Facebook peut changer de gestionnaire, mais le transfert doit respecter les règles de la plateforme. Ce qui se valorise, c'est l'audience engagée et sa capacité de monétisation, pas seulement le nombre d'abonnés, souvent gonflable artificiellement."},
            {"question": "Comment valoriser une communauté ?", "answer": "On valorise une communauté sur son engagement réel (interactions, portée), sa niche, sa capacité de monétisation (sponsoring, produits) et l'authenticité de l'audience, bien plus que sur le simple nombre d'abonnés. Une petite communauté engagée vaut souvent plus qu'une grande audience passive."},
        ],
        "content": """Instagram, TikTok, Facebook, LinkedIn : les communautés sociales sont devenues des actifs convoités. Mais leur valeur est souvent mal comprise, et leur cession soulève des questions de règles et de risques. Ce guide de La Citadelle explique comment valoriser une communauté à sa juste mesure.

## Le nombre d'abonnés ne fait pas la valeur

C'est le premier piège : confondre **taille** et **valeur**. Un compte à un million d'abonnés inactifs ou achetés vaut moins qu'une communauté de 20 000 personnes réellement engagées. Ce qui compte, c'est la **qualité et l'engagement** de l'audience.

> Les abonnés se comptent ; l'engagement, lui, se prouve — et c'est lui qui se paie.

## Les indicateurs de valeur

- **Taux d'engagement** : interactions rapportées à l'audience.
- **Portée organique** et régularité des performances.
- **Authenticité** : proportion d'abonnés réels (attention aux faux abonnés).
- **Niche** : une audience ciblée et monétisable vaut plus qu'une audience généraliste.
- **Monétisation** : sponsoring, affiliation, produits, services.

## Les spécificités par plateforme

- **Instagram** : engagement visuel, stories, part de faux abonnés à vérifier.
- **TikTok** : portée virale mais volatile ; la régularité des vues compte plus que le total d'abonnés.
- **Facebook** : les **pages et groupes** engagés gardent de la valeur, notamment pour des niches.
- **LinkedIn** : audience B2B à forte valeur, souvent liée à une personne (moins transmissible).

## La question des règles et des risques

Point crucial : la plupart des plateformes **encadrent ou interdisent** le transfert de comptes dans leurs conditions d'utilisation. Une cession mal menée expose à la **fermeture** du compte. Ce risque doit être clairement évalué et intégré — c'est un facteur qui pèse fortement sur la valeur et la faisabilité.

## Détecter l'audience artificielle

Avant toute transaction, vérifiez l'**authenticité** : courbes de croissance anormales (pics soudains), engagement incohérent avec la taille, géographie des abonnés sans rapport avec le contenu. Une audience gonflée artificiellement n'a aucune valeur monétisable.

## Valoriser plutôt que « vendre le compte »

Souvent, la vraie valeur ne réside pas dans le compte lui-même (risqué à transférer) mais dans ce qu'il permet : une **audience à convertir** vers un canal détenu (newsletter, site), une **marque** ou un **business** qui s'appuie sur cette communauté. Structurer l'actif autour d'éléments transmissibles sécurise la transaction.

## En résumé — La checklist communauté

- **Mesurez l'engagement**, pas le nombre d'abonnés.
- **Vérifiez l'authenticité** de l'audience.
- **Évaluez le risque de fermeture** lié aux règles des plateformes.
- **Valorisez la niche et la monétisation.**
- **Structurez l'actif** autour d'éléments réellement transmissibles.

Une communauté engagée est un actif puissant, à condition d'en comprendre les risques et de la valoriser sur l'engagement réel. La Citadelle vous aide à évaluer ce qui, dans une communauté, a une vraie valeur transmissible.""",
    },
    {
        "num": 18,
        "slug": "guide-la-citadelle-18-discord-forums-communautes-numeriques-actif-de-valeur",
        "date": "2026-11-07T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Discord, forums et communautés numériques : créer un actif de valeur",
        "excerpt": "Comment construire, animer, valoriser et transmettre une communauté en ligne.",
        "seo": ["vendre Discord", "vendre forum", "communauté numérique", "serveur Discord"],
        "geo": ["Discord France"],
        "aeo": [
            {"question": "Peut-on vendre un serveur Discord ?", "answer": "Un serveur Discord ou un forum peut changer de propriétaire via le transfert de la propriété du serveur et des accès d'administration. Sa valeur dépend de l'activité réelle, de l'engagement des membres et de sa monétisation. Le transfert doit respecter les règles de la plateforme et préserver la confiance de la communauté."},
            {"question": "Comment valoriser une communauté ?", "answer": "On valorise une communauté en ligne sur son activité (messages, membres actifs), son engagement, sa monétisation (abonnements, sponsoring, dons) et sa culture, bien plus que sur le nombre brut de membres. Une communauté vivante et autonome vaut plus qu'un grand serveur inactif."},
        ],
        "content": """Discord, forums, espaces membres : les communautés numériques sont parmi les actifs les plus difficiles à répliquer. On peut cloner une fonctionnalité, pas une culture ni des relations humaines. Ce guide de La Citadelle explique comment construire, animer, valoriser et transmettre une communauté de valeur.

## Pourquoi une communauté est un actif rare

Une communauté vivante possède un atout unique : une **audience captive et fidèle**, réunie autour d'un intérêt commun. Cette valeur ne se copie pas : elle se construit avec le temps, la modération et la confiance. C'est ce qui rend les communautés engagées si précieuses et si recherchées.

## Construire et animer

Une communauté de valeur repose sur :

- Une **raison d'être** claire (thématique, entraide, passion).
- Une **modération** active qui maintient la qualité et la sécurité.
- Des **rituels** (événements, rendez-vous réguliers) qui entretiennent la vie.
- Une **culture** propre, difficile à imiter.

## Les indicateurs de valeur

- **Membres actifs** (et pas seulement inscrits).
- **Volume et qualité des échanges** (messages, participation).
- **Rétention** : la communauté garde-t-elle ses membres ?
- **Monétisation** : abonnements, sponsoring, dons, événements payants.
- **Autonomie** : la communauté vit-elle sans son fondateur ?

## Le défi de la dépendance au fondateur

Comme pour une chaîne ou un compte social, la question clé est la **transmissibilité**. Une communauté portée à bout de bras par une seule personne perd de sa valeur à la cession. Les plus solides ont une **équipe de modération**, des processus documentés et une culture qui perdure au-delà du fondateur.

## Monétiser une communauté

Les modèles : **abonnements** (accès premium, salons privés), **sponsoring** (marques ciblant la niche), **dons** (Patreon et équivalents), **événements** payants, ou vente de **produits**. Les communautés les mieux valorisées combinent revenus récurrents et engagement fort.

## Valoriser et transmettre

Pour vendre, documentez l'activité (membres actifs, messages, croissance), les revenus, et la structure de modération. Le transfert implique la **propriété du serveur/forum**, les accès d'administration et, idéalement, une **transition en douceur** annoncée à la communauté pour préserver la confiance. Un changement brutal ou opaque peut provoquer un exode des membres — et détruire la valeur.

## En résumé — La checklist communauté numérique

- **Mesurez l'activité réelle**, pas le nombre d'inscrits.
- **Structurez la modération** et documentez les processus.
- **Réduisez la dépendance au fondateur.**
- **Diversifiez la monétisation.**
- **Transmettez en douceur**, dans la transparence envers les membres.

Une communauté numérique bien animée est un actif rare et durable. Sa valeur tient à sa vie propre : la préserver lors de la transmission est la clé d'une cession réussie, et c'est ce que La Citadelle vous aide à orchestrer.""",
    },
    {
        "num": 19,
        "slug": "guide-la-citadelle-19-actifs-numeriques-crees-avec-intelligence-artificielle",
        "date": "2026-11-14T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Les actifs numériques créés avec l'intelligence artificielle",
        "excerpt": "Panorama des nouveaux actifs numériques générés grâce à l'IA : agents, automatisations, SaaS IA et contenus intelligents.",
        "seo": ["IA", "agent IA", "SaaS IA", "business IA", "automatisation IA"],
        "geo": ["intelligence artificielle France"],
        "aeo": [
            {"question": "Peut-on vendre un agent IA ?", "answer": "Oui, un agent IA ou une automatisation peut se vendre comme un actif numérique. Sa valeur dépend de la valeur durable qu'il apporte (données propriétaires, intégration, base d'utilisateurs) au-delà de la simple façade, et de sa dépendance à des modèles ou API tiers, qui constitue le principal risque."},
            {"question": "Comment valoriser un business IA ?", "answer": "On valorise un business IA sur ses revenus (idéalement récurrents), sa base d'utilisateurs, ses données propriétaires et son intégration dans les workflows clients. Le facteur clé est de savoir ce qui reste de valeur si l'IA devient une commodité : une simple façade sur une API tierce vaut peu."},
        ],
        "content": """L'intelligence artificielle a fait émerger une nouvelle génération d'actifs numériques : agents, automatisations, SaaS IA, contenus intelligents. Prometteurs, mais parfois fragiles. Ce guide de La Citadelle dresse le panorama de ces actifs et des précautions à prendre pour les acheter ou les vendre.

## Une nouvelle famille d'actifs

L'IA générative a rendu possible la création rapide d'outils qui, hier, demandaient des équipes entières. On distingue plusieurs catégories :

- **Agents IA** : assistants spécialisés automatisant des tâches.
- **Automatisations** : workflows connectant plusieurs outils via l'IA.
- **SaaS IA** : logiciels dont l'IA est le cœur de la valeur.
- **Contenus intelligents** : bases de contenus ou outils générés/assistés par IA.

## La question centrale : qu'est-ce qui est durable ?

Le grand piège des actifs IA est la **façade** : un outil qui ne fait qu'appeler une API tierce (un grand modèle) sans valeur ajoutée propre. Ce type d'actif est fragile : il peut être balayé par la prochaine mise à jour du modèle ou reproduit en quelques heures.

> La vraie question n'est pas « utilise-t-il l'IA ? » mais « qu'est-ce qui reste de valeur si l'IA devient une commodité ? »

La valeur durable se trouve dans la **donnée propriétaire**, la **base d'utilisateurs fidèle**, l'**intégration profonde** dans les workflows des clients, ou un savoir-faire difficile à répliquer.

## Les indicateurs de valeur

- **Revenus**, idéalement **récurrents** (abonnements).
- **Rétention** et base d'utilisateurs active.
- **Données propriétaires** accumulées (jeu de données unique).
- **Barrières à l'entrée** : intégrations, effets de réseau, savoir-faire.

## Le risque de dépendance technologique

Un actif IA repose souvent sur des **modèles et API tiers** (fournisseurs de grands modèles). Cette dépendance est un risque : hausse des prix, changement de conditions, dépréciation d'un modèle. Évaluez la capacité de l'actif à **changer de fournisseur** ou à réduire cette dépendance.

## Les aspects juridiques spécifiques

Les actifs IA soulèvent des questions particulières : **propriété des contenus générés**, respect des **données** utilisées pour l'entraînement, conformité et responsabilité. Ces points, encore mouvants, doivent être examinés avec prudence, idéalement avec un conseil.

## Acheter ou vendre un actif IA

Côté acheteur : cherchez la valeur durable derrière la façade, exigez les preuves de revenus et de rétention, évaluez la dépendance technologique. Côté vendeur : documentez ce qui rend l'actif défendable (données, utilisateurs, intégrations) et soyez transparent sur les dépendances. La transmission inclut le **code**, les **clés API**, les **données** et les **comptes**.

## En résumé — La checklist IA

- **Cherchez la valeur durable**, pas la simple façade.
- **Privilégiez le récurrent** et la rétention.
- **Valorisez les données propriétaires** et les intégrations.
- **Évaluez la dépendance** aux modèles et API tiers.
- **Traitez les questions juridiques** (propriété, données) avec prudence.

Les actifs IA sont l'une des frontières les plus excitantes du marché — et l'une des plus piégeuses. Distinguer la valeur durable de l'effet de mode est essentiel, et c'est précisément l'analyse que La Citadelle apporte.""",
    },
    {
        "num": 20,
        "slug": "guide-la-citadelle-20-api-licences-logiciels-propriete-intellectuelle",
        "date": "2026-11-21T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : API, licences, logiciels et propriété intellectuelle",
        "excerpt": "Tout comprendre sur les licences logicielles, les API, les droits d'auteur et la propriété intellectuelle lors d'une cession.",
        "seo": ["licence logiciel", "API", "propriété intellectuelle", "vendre logiciel"],
        "geo": ["propriété intellectuelle France"],
        "aeo": [
            {"question": "Comment vendre un logiciel ?", "answer": "Pour vendre un logiciel : établissez clairement la propriété du code et des droits, vérifiez les licences des composants tiers et leur transférabilité, documentez le code et les dépendances, formalisez la cession par un contrat écrit précisant les droits transférés, puis transmettez le code source et les accès de façon sécurisée."},
            {"question": "Les API peuvent-elles être vendues ?", "answer": "Oui, une API et le service qu'elle alimente peuvent être cédés comme un actif : code, documentation, base d'utilisateurs et contrats d'accès. Il faut vérifier les conditions d'utilisation, la propriété des données échangées et la transférabilité des abonnements ou clés existants."},
            {"question": "Que devient la licence lors d'une vente ?", "answer": "Lors d'une vente, chaque licence (composant tiers, thème, bibliothèque) doit être vérifiée : certaines sont transférables, d'autres liées au compte du vendeur et non cessibles. Il faut soit transférer la licence, soit prévoir son rachat au nom de l'acheteur pour assurer la continuité et la conformité."},
        ],
        "content": """Derrière tout actif numérique se cache une couche juridique souvent négligée : les licences, les droits d'auteur, la propriété du code et des données. Mal gérée, elle peut transformer une vente en litige. Ce guide de La Citadelle éclaire les notions clés de propriété intellectuelle lors d'une cession.

*Note : ce guide fournit des repères généraux et ne remplace pas un conseil juridique personnalisé.*

## Établir la propriété : le préalable absolu

Avant toute vente, une question doit être tranchée : **qui possède quoi ?** Le code a-t-il été développé par le vendeur, par un salarié, par un prestataire ? Un développement confié à un freelance sans **clause de cession des droits** peut signifier que le vendeur ne possède pas pleinement ce qu'il prétend vendre. C'est un point de vérification essentiel.

## Comprendre les licences logicielles

Un logiciel s'appuie presque toujours sur des **composants tiers** : bibliothèques, thèmes, plugins, frameworks. Chacun est régi par une **licence** :

- Certaines licences **open source** sont permissives, d'autres imposent des obligations.
- Certaines licences commerciales sont **liées au compte** du vendeur et **non transférables**.

À la vente, chaque licence doit être vérifiée : est-elle transférable ? Faut-il en racheter une au nom de l'acheteur ? Ignorer ce point expose à l'arrêt des mises à jour ou à une non-conformité.

## Le cas des API

Une API (interface de programmation) peut être un actif à part entière, ou une dépendance critique. Deux angles :

- **L'API que l'on possède** : elle se cède avec son code, sa documentation, ses utilisateurs et ses contrats d'accès.
- **Les API tierces dont on dépend** : chaque clé et chaque abonnement doit être transféré ou recréé, sous peine de voir une fonctionnalité tomber en panne après la reprise.

## Droits d'auteur et contenus

Le **contenu** (textes, images, vidéos, code) est protégé par le droit d'auteur. Vérifiez que tout le contenu vendu est **original ou dûment licencié** : une image utilisée sans droits ou un texte copié peuvent engager la responsabilité du nouveau propriétaire. La question se pose aussi pour les **contenus générés par IA**, dont le statut juridique demande prudence.

## Les données et le RGPD

Si l'actif comprend des **données personnelles** (clients, abonnés, utilisateurs), leur cession est encadrée. Il faut respecter le consentement, la finalité et les obligations applicables. Ce point doit être traité sérieusement pour sécuriser la transaction.

## Formaliser la cession par contrat

La propriété intellectuelle se transfère par **écrit**. Un contrat de cession clair doit préciser : ce qui est cédé (code, marque, contenus, données), les droits transférés, les garanties du vendeur (il possède bien ce qu'il vend) et les modalités. C'est la protection des deux parties. (Le guide dédié aux contrats détaille ce point.)

## En résumé — La checklist propriété intellectuelle

- **Établissez la propriété** du code et des contenus avant tout.
- **Vérifiez chaque licence** : transférable ou à racheter ?
- **Gérez les API** possédées comme celles dont vous dépendez.
- **Contrôlez les droits** sur tous les contenus.
- **Traitez les données personnelles** selon le RGPD.
- **Formalisez la cession** par un contrat écrit précis.

La propriété intellectuelle est le socle juridique invisible d'une vente. La maîtriser, c'est éviter les litiges et rassurer l'acheteur — un accompagnement que La Citadelle recommande de traiter avec le plus grand sérieux, conseil à l'appui.""",
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

    print(f"\nLot 4 (Guides) terminé — {created} guide(s) créé(s), {skipped} mis à jour.")


if __name__ == "__main__":
    asyncio.run(main())
