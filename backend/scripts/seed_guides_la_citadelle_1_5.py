"""
Seed — Le Guide de La Citadelle (rubrique premium) — LOT 1 : Guides n°1 à 5
---------------------------------------------------------------------------------
Insère 5 guides en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : met à jour l'image des guides déjà présents, insère les absents.
Usage : python -m scripts.seed_guides_la_citadelle_1_5   (depuis /app/backend, venv actif)
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
    1: _IMG + "66002060c59ba2d51baa5b1675ce3a4b8daaa9f95e009d30d079e8865d119fe1.png",
    2: _IMG + "b2d21766360f0b557736ce16a6bcd68bf5030c8ec6ca750a371def0e6306e38d.png",
    3: _IMG + "142054c52cc89190d16e54b71838ec5d8c3ec9aede62a25dfcc5559b9aa0c9e4.png",
    4: _IMG + "220ff2cdfe1790120c7df18e52eb08fb2392a4e116be34bd6aa4a19786a928c0.png",
    5: _IMG + "c8f0853030fde44e82a23c5da3b6df4cfa682966dda687d18611c3e2f50c1e66.png",
}


GUIDES = [
    {
        "num": 1,
        "slug": "guide-la-citadelle-1-comment-vendre-un-site-internet-de-a-a-z",
        "date": "2026-07-11T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Comment vendre un site internet de A à Z",
        "excerpt": "Le guide ultime pour préparer, valoriser, vendre et transmettre un site internet en toute sécurité, étape par étape.",
        "seo": ["vendre un site internet", "vendre site web", "vendre business digital", "vendre un site WordPress"],
        "geo": ["vendre un site internet France", "vendre un business digital France"],
        "aeo": [
            {"question": "Comment vendre un site internet ?", "answer": "Pour vendre un site internet : préparez un dossier de preuves (trafic, revenus, coûts), estimez sa valeur sur un multiple de bénéfice réaliste, publiez une annonce transparente, filtrez les acheteurs sérieux, sécurisez le paiement via un séquestre, puis transmettez méthodiquement tous les accès."},
            {"question": "Quelles sont les étapes pour vendre un site ?", "answer": "Les étapes sont : 1) préparer et documenter l'actif, 2) estimer sa valeur, 3) rédiger une annonce transparente, 4) qualifier les acheteurs, 5) négocier, 6) sécuriser le paiement (séquestre), 7) transmettre les accès dans le bon ordre, 8) accompagner l'acheteur après la vente."},
            {"question": "Où vendre un site internet ?", "answer": "On vend un site internet sur une place de marché spécialisée qui sécurise la transaction (séquestre des fonds, vérification des parties), plutôt qu'en gré à gré, afin de protéger à la fois le vendeur et l'acheteur."},
        ],
        "content": """Vendre un site internet ne s'improvise pas. Entre l'estimation, la préparation du dossier, la recherche d'acheteurs sérieux et la transmission technique, chaque étape compte. Ce guide de La Citadelle vous accompagne **de A à Z**, pour vendre au meilleur prix et en toute sécurité.

## Étape 1 — Préparer l'actif avant toute chose

Une vente réussie se joue avant la mise en ligne de l'annonce. Commencez par réunir tout ce qui prouve la valeur de votre site :

- **Les revenus** : relevés natifs (Stripe, régie publicitaire, affiliation) sur 12 à 24 mois.
- **Le trafic** : accès ou exports Google Search Console et Analytics.
- **Les coûts réels** : hébergement, licences, outils, sous-traitance.
- **L'inventaire des accès** : domaine, hébergement, CMS, e-mails, API, comptes tiers.

Profitez de cette phase pour **nettoyer** votre actif : mises à jour techniques, suppression du superflu, sauvegarde complète et testée.

## Étape 2 — Estimer la valeur

Un site se valorise sur ce qu'il **rapporte**, pas sur le temps que vous y avez investi. La méthode la plus courante repose sur un **multiple du bénéfice net mensuel** : souvent 24 à 40 fois pour un site de contenu, davantage pour un SaaS à revenus récurrents.

> Un prix défendable se calcule et se justifie chiffre à l'appui. Un prix « au feeling » condamne l'annonce à vieillir.

## Étape 3 — Rédiger une annonce transparente

L'annonce doit répondre aux questions dans l'ordre où l'acheteur se les pose : de quoi s'agit-il, comment le site gagne-t-il de l'argent, combien rapporte-t-il vraiment, d'où vient le trafic, combien de temps exige-t-il, qu'est-ce qui est transmis, et à quel prix. **Assumez les faiblesses** : l'honnêteté inspire plus confiance que la perfection affichée.

## Étape 4 — Qualifier les acheteurs

Tous les contacts ne se valent pas. Un acheteur sérieux pose des questions précises sur les revenus et les risques ; un simple curieux veut « tout voir » sans s'engager. Dévoilez l'information **par paliers** : données agrégées d'abord, accès en lecture ensuite, accès complets seulement après sécurisation du paiement.

## Étape 5 — Négocier avec méthode

Fixez à l'avance votre prix plancher et les éléments non négociables. Restez factuel : chaque objection sur le prix doit trouver une réponse chiffrée. N'acceptez jamais de brader dans l'urgence — la précipitation profite rarement au vendeur.

## Étape 6 — Sécuriser le paiement

C'est l'étape à ne jamais négliger. **Ne cédez aucun accès complet avant d'être payé.** Le recours à un séquestre — qui protège les fonds jusqu'à la transmission effective — rassure l'acheteur et vous protège du risque de non-paiement. Le raccourci qui saute la sécurité est toujours un faux gain de temps.

## Étape 7 — Transmettre dans le bon ordre

La transmission est le moment où tout peut se gripper. Respectez une séquence sûre :

1. Sauvegarde complète (fichiers + base de données).
2. Hébergement et base de données.
3. Nom de domaine et zone DNS (avec les enregistrements MX, TXT, CNAME documentés).
4. Comptes tiers : CMS, e-mails, Analytics, Search Console, API, licences.
5. Validation par l'acheteur que tout fonctionne.

## Étape 8 — Accompagner après la vente

Une transmission professionnelle prévoit une **période d'accompagnement** (souvent 15 à 30 jours). Elle rassure l'acheteur, réduit les litiges et laisse le souvenir d'une opération sérieuse.

## En résumé — La checklist de La Citadelle

- **Préparez et documentez** avant de publier.
- **Estimez sur un multiple défendable**, pas au feeling.
- **Rédigez une annonce transparente**, faiblesses comprises.
- **Qualifiez les acheteurs** et dévoilez par paliers.
- **Sécurisez le paiement** via un séquestre.
- **Transmettez dans le bon ordre** et validez chaque étape.
- **Accompagnez** l'acheteur après la bascule.

Vendre un site de A à Z, c'est transformer un actif « à vendre » en un actif **prêt à être transmis**. C'est tout l'accompagnement que La Citadelle met à votre service.""",
    },
    {
        "num": 2,
        "slug": "guide-la-citadelle-2-comment-acheter-un-site-internet-sans-se-tromper",
        "date": "2026-07-18T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Comment acheter un site internet sans se tromper",
        "excerpt": "Toutes les vérifications techniques, financières, juridiques et SEO à mener avant d'investir dans un site internet.",
        "seo": ["acheter un site internet", "acheter business digital", "audit achat"],
        "geo": ["acheter site internet France"],
        "aeo": [
            {"question": "Comment acheter un site internet ?", "answer": "Pour acheter un site internet sans se tromper : vérifiez les revenus et coûts avec des preuves natives, croisez le trafic entre Analytics et Search Console, auditez la technique et les dépendances, contrôlez la propriété et le juridique, puis sécurisez le paiement via un séquestre avant de recevoir tous les accès."},
            {"question": "Que vérifier avant un achat ?", "answer": "Vérifiez : la réalité et la stabilité des revenus, les coûts réels, l'origine et la diversité du trafic, l'état technique et la dette technique, les dépendances (fournisseurs, plateformes), la propriété du domaine et du contenu, les aspects juridiques et la raison de la vente."},
        ],
        "content": """Acheter un site internet peut être un excellent investissement — ou un piège coûteux. La différence tient à la **due diligence** : l'ensemble des vérifications menées avant de signer. Ce guide de La Citadelle passe en revue tout ce qu'il faut contrôler pour acheter en connaissance de cause.

## 1 — Vérifier les revenus

Le cœur de la valeur. Ne vous contentez jamais d'un montant annoncé :

- Exigez des **preuves natives** : tableaux de bord Stripe, régie publicitaire, réseaux d'affiliation.
- Étudiez la **tendance** sur 12 à 24 mois : en hausse, stable ou en déclin ?
- Repérez la **concentration** : un seul annonceur, un seul produit, un seul partenaire ? C'est un risque.
- Distinguez **récurrent et ponctuel** : le récurrent vaut une prime.

## 2 — Reconstituer les coûts réels

Un chiffre d'affaires n'est pas un bénéfice. Reconstituez l'hébergement, les licences, les outils, la sous-traitance — et surtout le **temps de gestion** hebdomadaire, ce coût caché fondamental. C'est le bénéfice net réel qui détermine la valeur.

## 3 — Auditer le trafic

Le trafic doit être **réel et diversifié** :

- Croisez **Analytics et Search Console** : si Analytics affiche un fort trafic organique invisible dans Search Console, méfiance.
- Vérifiez la **diversité des sources** : la mono-dépendance (un seul canal, une seule requête) est fragile.
- Cherchez les **chutes brutales** : elles peuvent trahir une pénalité ou un incident.

## 4 — Contrôler la technique

- Sur quelle **technologie** repose le site ? Est-elle maintenue et moderne ?
- Quelle est la **dette technique** (versions dépassées, personnalisations fragiles) ?
- Le site dépend-il d'un **développeur unique** ?
- Existe-t-il des **sauvegardes** régulières et testées ?

## 5 — Examiner les dépendances

Un actif solide ne repose pas sur un fil. Identifiez les dépendances critiques : une plateforme tierce susceptible de changer ses règles, un fournisseur unique, une API essentielle. Chaque dépendance est un risque à chiffrer.

## 6 — Vérifier le juridique et la propriété

- Le **nom de domaine** et les **marques** appartiennent-ils bien au vendeur ?
- Le **contenu** est-il original et libre de droits ?
- Des **contrats en cours** (clients, partenaires) sont-ils transférables ?

## 7 — Comprendre la raison de la vente

La question « pourquoi vendez-vous ? » révèle beaucoup. Une réponse cohérente rassure ; une raison floue ou contradictoire, surtout couplée à des chiffres en déclin, doit alerter.

## 8 — Sécuriser l'acquisition

Ne réglez jamais avant d'avoir vérifié, et ne recevez les accès complets qu'une fois le paiement sécurisé. Le **séquestre** protège votre argent jusqu'à la transmission effective. Refusez toute pression à contourner ce cadre.

## En résumé — La checklist de l'acheteur

- **Exigez des preuves natives** pour chaque revenu.
- **Reconstituez le bénéfice net**, temps de gestion inclus.
- **Croisez Analytics et Search Console.**
- **Auditez la technique** et la dette cachée.
- **Chiffrez chaque dépendance et chaque risque.**
- **Contrôlez la propriété et le juridique.**
- **Sécurisez le paiement** avant de recevoir les accès.

Acheter sans se tromper, ce n'est pas éviter tout risque : c'est le **repérer, le comprendre et le chiffrer** avant de signer. C'est la rigueur que La Citadelle vous aide à appliquer.""",
    },
    {
        "num": 3,
        "slug": "guide-la-citadelle-3-estimer-la-valeur-dun-actif-numerique",
        "date": "2026-07-25T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Estimer la valeur d'un actif numérique",
        "excerpt": "Méthodes professionnelles de valorisation des sites, SaaS, applications, newsletters et communautés.",
        "seo": ["estimation site internet", "valeur business digital", "valorisation SaaS"],
        "geo": ["estimation site France"],
        "aeo": [
            {"question": "Comment estimer un site ?", "answer": "On estime un site en appliquant un multiple à son bénéfice net mensuel (souvent 24 à 40 fois pour un site de contenu, davantage pour un SaaS récurrent), puis en ajustant ce multiple selon la stabilité des revenus, la diversité du trafic, les dépendances, la qualité des preuves et le temps de gestion."},
            {"question": "Combien vaut mon site ?", "answer": "La valeur de votre site dépend de son bénéfice net réel, du type de revenus (récurrent ou ponctuel), de la solidité du trafic et du niveau de risque. Multipliez votre bénéfice net mensuel par un multiple réaliste, puis ajustez selon la transparence et les preuves disponibles."},
        ],
        "content": """« Combien vaut mon site ? » C'est la question de départ de toute vente. Y répondre avec justesse évite deux écueils coûteux : surestimer (l'annonce vieillit et se décote) ou sous-estimer (on brade un actif de valeur). Ce guide de La Citadelle détaille les méthodes professionnelles de valorisation.

## Le principe : on valorise un bénéfice, pas un chiffre d'affaires

La première règle est de raisonner en **bénéfice net**, pas en chiffre d'affaires. Un site qui encaisse 5 000 € mais en dépense 4 500 € ne vaut pas comme un site qui dégage 4 500 € de bénéfice. Reconstituez tous les coûts, **temps de gestion inclus**, avant toute estimation.

## La méthode du multiple de bénéfice

La méthode la plus répandue applique un **multiple au bénéfice net mensuel** :

- **Site de contenu / affiliation** : souvent 24 à 40 fois le bénéfice net mensuel.
- **E-commerce** : multiple variable selon la marque, la marge et la fidélité client.
- **SaaS à revenus récurrents** : multiples plus élevés, parfois exprimés en multiple de l'ARR.

> Le multiple n'est pas figé : il monte avec la stabilité et la prévisibilité, il baisse avec le risque.

## Les facteurs qui font monter le multiple

- **Revenus récurrents** et prévisibles (abonnements, MRR).
- **Trafic diversifié** et vérifiable.
- **Faible temps de gestion** et actif transmissible.
- **Historique propre** et preuves irréprochables.
- **Marque forte** et audience directe (liste e-mail, communauté).

## Les facteurs qui font baisser le multiple

- **Concentration** des revenus ou du trafic sur une seule source.
- **Dette technique** ou technologie obsolète.
- **Dépendance** à une plateforme tierce ou au fondateur.
- **Données invérifiables** ou historique flou.
- **Tendance déclinante** des revenus.

## Valoriser selon le type d'actif

Chaque catégorie a ses spécificités :

- **Newsletters et communautés** : on valorise l'engagement (taux d'ouverture, fidélité) autant que la taille.
- **Applications** : rétention, notes, coûts de maintenance et dépendance aux stores.
- **SaaS** : MRR, churn, durée de vie client, coût d'acquisition.
- **Domaines** : rareté, longueur, extension, pertinence commerciale.

## L'importance de la preuve

Une estimation ne vaut que par les **preuves** qui la soutiennent. Deux sites au même bénéfice ne se vendent pas au même prix : celui dont les chiffres sont prouvés et documentés obtient un meilleur multiple, car il inspire davantage confiance.

## En résumé — Estimer avec méthode

- **Partez du bénéfice net**, jamais du chiffre d'affaires.
- **Appliquez un multiple réaliste** selon le type d'actif.
- **Ajustez** selon la stabilité, la diversité et les dépendances.
- **Valorisez le récurrent et la marque.**
- **Appuyez tout sur des preuves** : elles font le multiple.

Estimer un actif numérique, c'est joindre la méthode et l'honnêteté. Une estimation défendable est le meilleur point de départ d'une vente rapide et au juste prix — et c'est le premier service que propose La Citadelle.""",
    },
    {
        "num": 4,
        "slug": "guide-la-citadelle-4-tout-comprendre-a-wordpress-avant-un-achat",
        "date": "2026-08-01T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Tout comprendre à WordPress avant un achat",
        "excerpt": "Architecture, sécurité, extensions, performances et points de contrôle avant l'acquisition d'un site WordPress.",
        "seo": ["WordPress", "acheter site WordPress", "audit WordPress"],
        "geo": ["WordPress France"],
        "aeo": [
            {"question": "Comment auditer un site WordPress ?", "answer": "Pour auditer un site WordPress : vérifiez la version du cœur, du thème et des extensions, l'origine et les licences de ces éléments, l'état de sécurité (comptes admin, mises à jour, sauvegardes), les performances (hébergement, cache, Core Web Vitals) et la qualité du code des personnalisations."},
            {"question": "Que vérifier sur WordPress ?", "answer": "Vérifiez les extensions installées et leur nécessité, les thèmes et leurs licences, les comptes administrateurs, la fréquence des mises à jour et des sauvegardes, la sécurité, les performances et l'éventuelle dette technique liée à des personnalisations fragiles."},
        ],
        "content": """WordPress fait tourner une part immense du web, et beaucoup d'actifs mis en vente reposent dessus. Mais un site WordPress peut cacher aussi bien un socle solide qu'une accumulation de dette technique. Ce guide de La Citadelle vous donne les points de contrôle essentiels avant d'acheter.

## Comprendre l'architecture WordPress

Un site WordPress repose sur trois couches qu'il faut examiner séparément :

- **Le cœur (core)** : le logiciel WordPress lui-même, qui doit être à jour.
- **Le thème** : l'apparence et une partie des fonctionnalités.
- **Les extensions (plugins)** : chaque fonctionnalité ajoutée (SEO, sécurité, cache, boutique…).

La santé d'un site dépend de la cohérence et de la maintenance de ces trois couches.

## Vérifier les versions et les mises à jour

Un site dont le cœur, le thème ou les extensions sont **obsolètes** présente un risque de sécurité et de compatibilité. Demandez :

- La version de WordPress et sa fréquence de mise à jour.
- La liste des extensions **avec leur version** et leur date de dernière mise à jour.
- Si des mises à jour ont été **bloquées** (souvent le signe d'une personnalisation fragile qui casse à chaque montée de version).

## Examiner les extensions

Les extensions sont à la fois la force et la faiblesse de WordPress :

- **Trop d'extensions** alourdissent le site et multiplient les failles.
- Une extension **abandonnée** (plus mise à jour) est une porte d'entrée pour les attaques.
- Certaines extensions sont **sous licence** : vérifiez que les licences sont transférables, sinon les mises à jour cesseront après la vente.

Dressez la liste, questionnez la nécessité de chacune, et repérez les doublons.

## Contrôler les thèmes et les licences

Un **thème premium** est souvent lié au compte du vendeur. Après la vente, sans transfert de licence, les mises à jour s'arrêtent — exposant le site à des failles. Prévoyez le transfert ou le rachat de la licence au nom de l'acheteur.

## Auditer la sécurité

- Combien de comptes **administrateurs** existent ? Sont-ils tous légitimes ?
- Une extension de **sécurité** est-elle active et configurée ?
- Les **sauvegardes** sont-elles automatiques, externalisées et testées ?
- Le site a-t-il déjà été **piraté** ? Si oui, comment l'incident a-t-il été résolu ?

## Mesurer les performances

Un site WordPress lent pénalise le SEO et l'expérience utilisateur. Vérifiez l'hébergement, la présence d'un **cache**, l'optimisation des images et les **Core Web Vitals**. Un site alourdi par des extensions et un hébergement bas de gamme héritera d'une dette de performance à redresser.

## Évaluer la dette technique

Enfin, méfiez-vous des **personnalisations « maison »** non documentées : du code ajouté directement dans le thème, des fonctions bricolées, des réglages fragiles. Cette dette technique se paie après l'achat, souvent au prix fort.

## En résumé — La checklist WordPress

- **Vérifiez les versions** du cœur, du thème et des extensions.
- **Auditez les extensions** : nécessité, maintenance, licences.
- **Contrôlez les licences** de thème et de plugins (transférables ?).
- **Examinez la sécurité** : comptes admin, sauvegardes, historique d'incidents.
- **Mesurez les performances** et les Core Web Vitals.
- **Traquez la dette technique** des personnalisations non documentées.

Comprendre WordPress avant d'acheter, c'est éviter d'hériter d'une dette invisible. Ces contrôles transforment une boîte noire en actif maîtrisé — exactement ce que vise l'audit avant vente de La Citadelle.""",
    },
    {
        "num": 5,
        "slug": "guide-la-citadelle-5-reussir-une-migration-de-site-internet",
        "date": "2026-08-08T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Réussir une migration de site internet sans perte de données ni SEO",
        "excerpt": "Le guide complet des migrations : domaine, hébergement, e-mails, bases de données, référencement et sécurité.",
        "seo": ["migration site internet", "migration WordPress", "migration SEO"],
        "geo": ["migration site France"],
        "aeo": [
            {"question": "Comment migrer un site ?", "answer": "Pour migrer un site : réalisez une sauvegarde complète, préparez le nouvel environnement, transférez fichiers et base de données, reconfigurez la zone DNS (A, MX, TXT, CNAME), vérifiez les redirections et les liens, testez tout avant de basculer le domaine, puis surveillez l'indexation après la migration."},
            {"question": "Comment éviter une perte SEO ?", "answer": "Pour éviter une perte SEO lors d'une migration : conservez les mêmes URL ou mettez en place des redirections 301, préservez le contenu et les balises, gérez correctement la zone DNS, soumettez le sitemap à Search Console et surveillez l'indexation et les impressions dans les semaines qui suivent."},
        ],
        "content": """La migration est l'étape la plus délicate de la vie d'un site — et le moment critique d'une transmission. Mal préparée, elle entraîne des pertes de données, des pannes d'e-mails ou une chute du référencement. Bien menée, elle est invisible pour les visiteurs. Ce guide de La Citadelle détaille la méthode pour migrer sans casse.

## Avant tout : la sauvegarde complète

Aucune migration ne commence sans une **sauvegarde intégrale** : fichiers **et** base de données. C'est votre filet de sécurité. Sans point de restauration, le moindre incident se répare à l'aveugle. Cette archive doit être complète, récente et **testée**.

## Étape 1 — Préparer le nouvel environnement

Avant de toucher au site en production, préparez la destination : hébergement dimensionné, versions logicielles compatibles, certificat SSL prêt. Migrer vers un environnement mal préparé, c'est reporter les problèmes au pire moment.

## Étape 2 — Transférer fichiers et base de données

- Copiez l'ensemble des **fichiers** vers le nouvel hébergement.
- Exportez puis importez la **base de données** en soignant l'encodage (les accents cassés sont le symptôme classique d'un mauvais export).
- Vérifiez que **toutes les tables** sont présentes et que l'import est complet.

## Étape 3 — Gérer la zone DNS avec soin

Le domaine ne se résume pas à un enregistrement A. Documentez et reconfigurez **toute la zone** :

- **A / AAAA** : pointage vers le nouveau serveur.
- **MX** : e-mails — un oubli casse la messagerie.
- **TXT** : SPF, DKIM, vérifications de services.
- **CNAME** : sous-domaines et services tiers.

Anticipez la **propagation DNS**, qui peut prendre plusieurs heures.

## Étape 4 — Préserver le référencement

C'est le point le plus sensible. Pour éviter une perte SEO :

- **Conservez les mêmes URL** autant que possible.
- En cas de changement d'URL, mettez en place des **redirections 301** systématiques.
- Préservez le **contenu**, les balises title et meta, la structure des liens internes.
- Mettez à jour et **soumettez le sitemap** à Search Console.

> Une migration réussie est une migration que Google ne remarque presque pas.

## Étape 5 — Ne pas oublier les e-mails

Les adresses `@domaine` servent souvent aux réinitialisations de mot de passe d'autres services. Assurez-vous que la **messagerie** est transférée ou reconstruite **avant** la bascule, sous peine d'enfermer le nouveau propriétaire dehors.

## Étape 6 — Tester avant de basculer

Avant de faire pointer le domaine vers le nouvel environnement, testez tout sur une URL temporaire : affichage, formulaires, paiement, e-mails, liens. La bascule ne doit intervenir qu'une fois **tout validé**.

## Étape 7 — Surveiller après la migration

Le travail ne s'arrête pas à la bascule. Pendant les semaines suivantes, surveillez dans Search Console l'**indexation**, les **impressions** et les éventuelles erreurs d'exploration. Un problème détecté tôt se corrige facilement.

## En résumé — La checklist de migration

- **Sauvegardez tout** avant de commencer, et testez la sauvegarde.
- **Préparez la destination** avant de toucher à la production.
- **Transférez proprement** fichiers et base de données.
- **Reconfigurez toute la zone DNS** (A, MX, TXT, CNAME).
- **Protégez le SEO** : URL conservées, redirections 301, sitemap.
- **Transférez les e-mails** avant la bascule.
- **Testez avant de basculer**, puis **surveillez** l'indexation.

Une migration sans perte de données ni de SEO est le signe d'une transmission professionnelle. C'est précisément le savoir-faire que les partenaires de La Citadelle mettent au service d'une bascule sereine.""",
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

    print(f"\nLot 1 (Guides) terminé — {created} guide(s) créé(s), {skipped} mis à jour.")


if __name__ == "__main__":
    asyncio.run(main())
