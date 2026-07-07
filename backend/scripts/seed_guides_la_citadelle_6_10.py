"""
Seed — Le Guide de La Citadelle (rubrique premium) — LOT 2 : Guides n°6 à 10
---------------------------------------------------------------------------------
Insère 5 guides en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : met à jour l'image des guides déjà présents, insère les absents.
Usage : python -m scripts.seed_guides_la_citadelle_6_10   (depuis /app/backend, venv actif)
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
    6: _IMG + "b09e4e781c93bf29259a29ef2419770aa61fda41e8d2956b04cc9342ed841833.png",
    7: _IMG + "303e202705309dbbf9513b1499c242b47f8570f4190b84634d808fbdd4da373f.png",
    8: _IMG + "224713ece1040c50dbf4f34e0b34d14c2610d9cebcaef9bd93d652733e286c28.png",
    9: _IMG + "24e09d768921f8dff441e8e9f50c8218fde5ff93c145350b94b6319f1e63d080.png",
    10: _IMG + "fb0d1ccbcf269ca083497bd3cff69ac92de7429b3bae0ed80311d074e0039619.png",
}


GUIDES = [
    {
        "num": 6,
        "slug": "guide-la-citadelle-6-stripe-et-stripe-connect-pour-les-marketplaces",
        "date": "2026-08-15T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Stripe et Stripe Connect pour les marketplaces",
        "excerpt": "Comprendre Stripe, Stripe Connect, les paiements, les commissions et les bonnes pratiques pour une place de marché.",
        "seo": ["Stripe Connect", "marketplace Stripe", "paiement marketplace"],
        "geo": ["Stripe France"],
        "aeo": [
            {"question": "Comment fonctionne Stripe Connect ?", "answer": "Stripe Connect permet à une plateforme d'encaisser des paiements puis de reverser des fonds à des vendeurs tiers, tout en prélevant une commission. La plateforme crée des comptes connectés pour chaque vendeur, encaisse via un paiement, puis déclenche des virements vers ces comptes selon les règles définies."},
            {"question": "Comment créer une marketplace ?", "answer": "Pour créer une marketplace de paiement : mettez en place Stripe Connect, créez un compte connecté par vendeur, choisissez un modèle de flux (paiements séparés puis virements), définissez la commission de la plateforme, sécurisez les fonds si nécessaire (séquestre) et gérez la conformité et les remboursements."},
        ],
        "content": """Toute place de marché repose sur une mécanique invisible mais cruciale : la circulation de l'argent entre acheteurs, vendeurs et plateforme. Stripe, et plus précisément **Stripe Connect**, est l'un des outils de référence pour orchestrer ces flux. Ce guide de La Citadelle vous explique les concepts clés, sans jargon inutile.

## Stripe, la brique de base

Stripe est un prestataire de paiement qui permet d'encaisser des cartes bancaires en ligne de façon sécurisée. Pour un site classique à un seul vendeur, cela suffit : le client paie, l'argent arrive sur le compte du marchand.

Mais une **marketplace** est différente : elle met en relation **plusieurs vendeurs** avec des acheteurs, et doit reverser à chacun sa part tout en prélevant une commission. C'est là qu'intervient Stripe Connect.

## Stripe Connect : orchestrer les flux à trois

Stripe Connect ajoute la notion de **comptes connectés** : chaque vendeur de la plateforme dispose de son propre compte, relié à celui de la marketplace. Le principe :

1. L'acheteur paie sur la plateforme.
2. La plateforme encaisse le paiement.
3. La plateforme reverse au vendeur sa part, en **prélevant une commission** au passage.

Cette architecture permet à la plateforme de garder le contrôle de l'expérience de paiement tout en rémunérant automatiquement les vendeurs.

## Les modèles de flux

Il existe plusieurs façons d'organiser les flux. Le modèle **« paiements séparés puis virements »** (Separate Charges & Transfers) est particulièrement souple : la plateforme encaisse d'abord le paiement, puis déclenche un **virement** (transfer) vers le compte connecté du vendeur, quand elle le décide.

> Ce modèle permet de conditionner le versement au vendeur à un événement précis — par exemple la validation de la transmission d'un actif.

C'est un atout majeur pour une marketplace d'actifs numériques, où l'on souhaite ne libérer les fonds qu'une fois la livraison confirmée.

## La commission de la plateforme

La commission est le modèle économique de la marketplace. Avec Connect, elle peut être prélevée automatiquement lors du reversement au vendeur. Il est essentiel de la définir clairement (pourcentage, minimum éventuel) et de la rendre **transparente** pour les deux parties.

## Le rôle du séquestre (escrow)

Pour les transactions à enjeu, comme la vente d'un site, un mécanisme de **séquestre** protège les deux parties : les fonds de l'acheteur sont sécurisés dès le paiement, mais ne sont reversés au vendeur qu'**après la transmission effective**. Techniquement, cela s'appuie sur la capacité de Connect à dissocier l'encaissement du versement.

## Les bonnes pratiques

- **Vérifier l'identité** des vendeurs (Stripe impose des vérifications de conformité, notamment pour la lutte anti-blanchiment).
- **Gérer les remboursements** et les litiges : prévoir qui supporte quoi.
- **Assurer la traçabilité** : chaque paiement, commission et virement doit être documenté.
- **Sécuriser les fonds** via un séquestre pour les transactions importantes.
- **Communiquer clairement** sur les délais de versement aux vendeurs.

## En résumé — L'essentiel de Connect

- **Stripe** encaisse les paiements ; **Stripe Connect** gère la répartition entre plusieurs vendeurs.
- Le modèle **paiements séparés + virements** offre le plus de souplesse.
- La **commission** se prélève automatiquement au reversement.
- Le **séquestre** libère les fonds seulement après la livraison.
- **Conformité, traçabilité et transparence** sont non négociables.

Comprendre Stripe Connect, c'est comprendre le cœur battant d'une marketplace de confiance. C'est cette infrastructure qui permet à La Citadelle de sécuriser chaque transaction, du paiement jusqu'à la transmission.""",
    },
    {
        "num": 7,
        "slug": "guide-la-citadelle-7-google-search-console-de-a-a-z",
        "date": "2026-08-22T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Google Search Console de A à Z",
        "excerpt": "Tout ce qu'un vendeur et un acheteur doivent savoir sur Search Console pour évaluer la santé SEO d'un site.",
        "seo": ["Google Search Console", "SEO", "audit SEO"],
        "geo": ["SEO France"],
        "aeo": [
            {"question": "Comment utiliser Search Console ?", "answer": "Pour utiliser Search Console : ajoutez et vérifiez la propriété du site, puis consultez le rapport de performances (impressions, clics, requêtes, positions), l'état de l'indexation, l'expérience sur mobile et les éventuelles actions manuelles. Analysez les tendances sur 16 mois pour évaluer la santé SEO."},
            {"question": "Pourquoi Search Console est importante ?", "answer": "Search Console est importante car elle montre les données que Google lui-même observe : impressions, clics, requêtes réelles et problèmes d'indexation. Contrairement à Analytics, ces données sont difficiles à manipuler, ce qui en fait la source de vérité pour évaluer la santé SEO d'un site avant un achat ou une vente."},
        ],
        "content": """Si un seul outil devait accompagner l'achat ou la vente d'un site, ce serait Google Search Console. Gratuit et pourtant sous-exploité, il révèle la santé SEO **réelle** d'un site, avec des données difficiles à falsifier. Ce guide de La Citadelle en fait le tour, de A à Z.

## Qu'est-ce que Search Console ?

Search Console est l'outil officiel de Google qui montre comment un site se comporte **dans les résultats de recherche**. Là où Analytics mesure ce qui se passe *sur* le site (et repose sur un code manipulable), Search Console rapporte ce que **Google lui-même observe**. C'est ce qui en fait la source de vérité SEO.

## Ajouter et vérifier une propriété

Pour accéder aux données, il faut d'abord **vérifier la propriété** du site (par un enregistrement DNS, une balise ou un fichier). Lors d'une transaction, la manière dont cet accès est transmis est importante : le vendeur doit pouvoir donner un accès en lecture, puis transférer proprement la propriété à l'acheteur sans lui faire perdre l'historique.

## Le rapport de performances : le cœur de l'outil

C'est ici que se lit la santé d'un site. Quatre indicateurs clés :

- **Impressions** : combien de fois les pages apparaissent dans les résultats.
- **Clics** : combien de fois les internautes cliquent.
- **CTR** (taux de clic) : la proportion de clics par impression.
- **Position moyenne** : le classement moyen dans les résultats.

Analysez toujours la **courbe sur 16 mois** : une croissance régulière révèle un site qui gagne en autorité ; un plateau, un site stable ; une **chute brutale**, un signal d'alerte (pénalité, mise à jour d'algorithme, problème technique) à élucider avant tout achat.

## Analyser les requêtes

Search Console révèle les **requêtes réelles** qui amènent du trafic. C'est capital :

- Le site se positionne-t-il sur des requêtes **en lien avec son modèle de revenus** ?
- Le trafic dépend-il d'**une seule requête** ou d'un mot-clé de marque ? (risque de concentration)
- Les positions sont-elles **stables** ou vit-il de pics ponctuels ?

Un trafic réparti sur de nombreuses requêtes pertinentes vaut bien plus qu'un trafic concentré sur un terme fragile.

## Vérifier l'indexation

L'onglet dédié à l'indexation montre quelles pages sont **indexées** ou **exclues**, et pourquoi. De nombreuses erreurs d'exploration ou de couverture trahissent souvent une **dette technique** que l'acheteur héritera. C'est un contrôle indispensable avant l'acquisition.

## Contrôler les actions manuelles et la sécurité

Search Console signale les **actions manuelles** (pénalités infligées par Google) et les problèmes de sécurité (piratage, contenu malveillant). Un site sous pénalité doit être identifié avant toute transaction — c'est un facteur de prix majeur, voire un motif de renoncement.

## Croiser avec les revenus

La vraie puissance de l'outil apparaît quand on **croise** ses données avec les revenus déclarés et avec Analytics. Si un vendeur annonce des revenus en hausse alors que les impressions s'effondrent, quelque chose ne colle pas. La cohérence entre les sources est le meilleur test de sincérité.

## En résumé — L'essentiel de Search Console

- C'est la **source de vérité SEO** : difficile à manipuler.
- Analysez la **courbe d'impressions sur 16 mois** en priorité.
- Étudiez la **diversité des requêtes** : fuyez la mono-dépendance.
- Vérifiez l'**indexation** : elle révèle la dette technique.
- Contrôlez les **actions manuelles** et la sécurité.
- **Croisez** toujours avec les revenus et Analytics.

Maîtriser Search Console, c'est se donner le pouvoir d'acheter ou de vendre en connaissance de cause. C'est l'outil que La Citadelle place au centre de toute évaluation sérieuse.""",
    },
    {
        "num": 8,
        "slug": "guide-la-citadelle-8-google-analytics-pour-acheteurs-et-vendeurs",
        "date": "2026-08-29T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Google Analytics pour les acheteurs et vendeurs",
        "excerpt": "Lire, interpréter et exploiter les données Analytics dans le cadre d'une transaction d'actif numérique.",
        "seo": ["Google Analytics", "trafic site", "statistiques site"],
        "geo": ["Analytics France"],
        "aeo": [
            {"question": "Comment lire Google Analytics ?", "answer": "Pour lire Google Analytics : identifiez le nombre d'utilisateurs et de sessions, les sources de trafic, le comportement (pages vues, durée, taux de rebond) et les conversions. Analysez les tendances sur 12 à 24 mois plutôt qu'un seul mois, et recoupez toujours ces données avec Search Console et les revenus réels."},
            {"question": "Quels indicateurs analyser ?", "answer": "Analysez les utilisateurs et sessions, les sources et canaux de trafic, la répartition géographique, le taux de rebond et la durée des sessions, les pages les plus vues, le taux de conversion et l'évolution dans le temps. Ces indicateurs révèlent la qualité du trafic, pas seulement son volume."},
        ],
        "content": """Google Analytics est l'outil que tout acheteur réclame et que tout vendeur présente. Mais savoir le **lire** — et connaître ses limites — fait toute la différence dans une transaction. Ce guide de La Citadelle vous apprend à exploiter Analytics intelligemment, côté acheteur comme côté vendeur.

## Ce que mesure (et ne mesure pas) Analytics

Analytics décrit ce qui se passe **sur** le site : combien de visiteurs, d'où viennent-ils, que font-ils, combien convertissent. C'est précieux pour piloter un actif. Mais rappelons sa limite : Analytics repose sur un **code de suivi** installé par le propriétaire, donc **modifiable**. Il informe, mais ne prouve pas à lui seul. D'où l'importance de le croiser avec Search Console et les revenus réels.

## Les indicateurs fondamentaux

Pour lire Analytics efficacement, concentrez-vous sur :

- **Utilisateurs et sessions** : le volume d'audience.
- **Sources et canaux** : organique, direct, référents, réseaux sociaux, e-mail.
- **Comportement** : pages vues par session, durée moyenne, taux de rebond.
- **Conversions** : ventes, inscriptions, objectifs atteints.

## Lire les sources de trafic

Le tableau des sources est révélateur. Un site sain présente un **mélange équilibré**. Les signaux d'alerte :

- Une part **écrasante de trafic « direct »** inexpliquée (souvent artificiel).
- Un afflux soudain de **référents douteux**.
- Une **mono-dépendance** à une seule source, qui rend l'actif fragile.

## Juger la qualité, pas seulement le volume

Cent visiteurs qui achètent valent plus que cent mille qui rebondissent. Regardez donc au-delà du volume :

- Un **taux de rebond** très élevé avec des sessions de quelques secondes trahit un trafic de faible qualité.
- Une **géographie** incohérente avec l'audience cible (site francophone, trafic majoritairement hors zone) doit alerter.
- Des **sessions longues** et plusieurs pages vues indiquent une audience réelle et engagée.

## Toujours raisonner sur la durée

Un seul mois peut être trompeur : il a peut-être été choisi parce qu'il flatte les chiffres (article viral, campagne payante). Analysez toujours la **tendance de fond sur 12 à 24 mois** pour distinguer le trafic récurrent des pics ponctuels.

## Le croisement indispensable

C'est la règle d'or de La Citadelle : **aucune source ne se lit seule.**

- Croisez Analytics avec **Search Console** : un fort trafic organique dans Analytics doit se retrouver en impressions dans Search Console.
- Croisez Analytics avec les **revenus réels** : un écart inexpliqué entre l'audience affichée et les revenus encaissés est un signal d'alerte.

## Conseils pour le vendeur

Si vous vendez, facilitez la lecture : proposez un **accès en lecture** propre, des exports natifs plutôt que de simples captures, et une présentation honnête des tendances, y compris des creux. La transparence accélère la vente et renforce la confiance.

## En résumé — Analytics dans une transaction

- Analytics **informe** mais ne **prouve** pas seul.
- Concentrez-vous sur **sources, comportement et conversions**.
- Jugez la **qualité** du trafic, pas seulement le volume.
- Raisonnez sur **12 à 24 mois**, pas sur un mois flatteur.
- **Croisez** systématiquement avec Search Console et les revenus.

Bien lu et bien recoupé, Analytics devient un allié puissant. Mal interprété, il peut induire en erreur. C'est cette lecture rigoureuse que La Citadelle applique à chaque dossier.""",
    },
    {
        "num": 9,
        "slug": "guide-la-citadelle-9-acheter-et-vendre-un-saas",
        "date": "2026-09-05T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Acheter et vendre un SaaS",
        "excerpt": "Le guide complet sur la valorisation, les abonnements, le MRR, le churn, la technique et les contrats d'un SaaS.",
        "seo": ["vendre SaaS", "acheter SaaS", "valorisation SaaS"],
        "geo": ["SaaS France"],
        "aeo": [
            {"question": "Comment vendre un SaaS ?", "answer": "Pour vendre un SaaS : documentez le MRR, le churn et la durée de vie client, prouvez les revenus via le tableau de bord de facturation, présentez l'architecture technique et les contrats en cours, calibrez le prix sur un multiple du MRR ou de l'ARR, puis sécurisez le paiement et transmettez le code, les accès et la base clients."},
            {"question": "Comment acheter un SaaS ?", "answer": "Pour acheter un SaaS : vérifiez le MRR et le churn réels, la concentration de la clientèle, la dette technique et la dépendance au fondateur, les contrats et abonnements en cours, ainsi que les coûts d'infrastructure. Croisez les revenus déclarés avec le tableau de bord de facturation avant de sécuriser l'achat."},
        ],
        "content": """Le SaaS (logiciel en tant que service) est l'un des actifs les plus recherchés du marché, grâce à ses revenus récurrents. Mais sa valorisation et sa transmission obéissent à des règles spécifiques. Ce guide de La Citadelle couvre l'achat et la vente d'un SaaS, du MRR jusqu'aux contrats.

## Le vocabulaire indispensable

Trois notions structurent l'analyse d'un SaaS :

- **MRR** (Monthly Recurring Revenue) : le revenu mensuel récurrent, somme des abonnements actifs.
- **ARR** (Annual Recurring Revenue) : l'équivalent annuel, utile pour les contrats à l'année.
- **Churn** : le taux de clients qui résilient sur une période — l'ennemi silencieux du MRR.

Un SaaS sain se reconnaît à un **MRR stable ou croissant** couplé à un **churn maîtrisé**.

## Valoriser un SaaS

Contrairement à un site de contenu (valorisé sur un multiple du bénéfice mensuel), un SaaS se valorise souvent sur un **multiple du MRR ou de l'ARR**, plus élevé grâce à la prévisibilité des revenus. Le multiple monte avec :

- Une **rétention** forte et un churn faible.
- Une **base clients diversifiée** (pas de concentration sur quelques gros comptes).
- Une **croissance** régulière et une acquisition saine.

Il baisse avec un churn élevé, une clientèle concentrée, ou une croissance dopée artificiellement par la publicité.

## Prouver les revenus

La preuve reine d'un SaaS est le **tableau de bord de facturation** (Stripe ou équivalent) : MRR, historique, churn, répartition entre clients. Côté acheteur, exigez cet accès en lecture et **croisez-le** avec les revenus déclarés. Un écart inexpliqué est rédhibitoire.

## Auditer la technique

Un SaaS est aussi un produit logiciel. Vérifiez :

- La **qualité et la maintenabilité du code** ; la dette technique éventuelle.
- L'**architecture** et les coûts d'**infrastructure** (serveurs, services tiers).
- La **dépendance au fondateur** : le produit peut-il évoluer sans lui ?
- La **documentation** technique, condition d'une reprise fluide.

## Examiner les contrats et le juridique

- Les **contrats clients** et abonnements sont-ils transférables ?
- Existe-t-il des **engagements** (annuels, sur mesure) à respecter ?
- Les **licences** des briques logicielles tierces sont-elles en règle et transmissibles ?
- Les questions de **données personnelles** (RGPD) sont-elles maîtrisées ?

## Transmettre un SaaS

La transmission dépasse celle d'un site classique : au-delà des accès et du domaine, il faut transférer le **code source**, l'**infrastructure**, la **base de clients** et les **abonnements en cours** (côté facturation). Une **période d'accompagnement** est ici presque indispensable, tant la prise en main technique et commerciale demande du relais.

## En résumé — SaaS, la checklist

- Maîtrisez **MRR, ARR et churn** : ce sont les indicateurs clés.
- Valorisez sur un **multiple du récurrent**, ajusté selon la rétention.
- **Prouvez les revenus** via le tableau de bord de facturation.
- **Auditez le code**, l'infrastructure et la dépendance au fondateur.
- **Vérifiez les contrats**, licences et conformité RGPD.
- **Transmettez** code, infra, clients et abonnements, avec accompagnement.

Acheter ou vendre un SaaS, c'est conjuguer la rigueur financière du récurrent et l'exigence technique du logiciel. C'est un actif de premier choix — à condition de le maîtriser, ce que La Citadelle vous aide à faire.""",
    },
    {
        "num": 10,
        "slug": "guide-la-citadelle-10-cybersecurite-appliquee-aux-actifs-numeriques",
        "date": "2026-09-12T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : La cybersécurité appliquée aux actifs numériques",
        "excerpt": "Les bonnes pratiques pour protéger un site, une application ou un SaaS avant, pendant et après une transaction.",
        "seo": ["cybersécurité site internet", "sécurité WordPress", "sécurité SaaS", "audit sécurité"],
        "geo": ["cybersécurité France"],
        "aeo": [
            {"question": "Comment sécuriser un site internet ?", "answer": "Pour sécuriser un site internet : maintenez le logiciel, le thème et les extensions à jour, utilisez des mots de passe forts et l'authentification à deux facteurs, limitez les comptes administrateurs, activez HTTPS, mettez en place des sauvegardes automatiques et testées, et surveillez les tentatives d'intrusion."},
            {"question": "Comment protéger un SaaS ?", "answer": "Pour protéger un SaaS : sécurisez l'accès aux serveurs et au code, gérez finement les droits, chiffrez les données sensibles, protégez les clés API, appliquez les mises à jour de sécurité, sauvegardez régulièrement et prévoyez un plan de réponse aux incidents."},
            {"question": "Quelles sont les bonnes pratiques de cybersécurité ?", "answer": "Les bonnes pratiques essentielles : mises à jour régulières, mots de passe forts et uniques, authentification à deux facteurs, principe du moindre privilège, chiffrement (HTTPS et données sensibles), sauvegardes testées, surveillance des accès et rotation des identifiants lors d'un changement de propriétaire."},
        ],
        "content": """La cybersécurité n'est pas un sujet réservé aux grandes entreprises : elle conditionne la valeur, la fiabilité et la transmissibilité de tout actif numérique. Un incident de sécurité peut ruiner un site, faire fuir les visiteurs et effondrer le référencement. Ce guide de La Citadelle réunit les bonnes pratiques, avant, pendant et après une transaction.

## Pourquoi la sécurité fait partie de la valeur

Un actif régulièrement piraté, mal protégé ou dépourvu de sauvegardes est un actif **à risque** — donc décoté. À l'inverse, un site dont la sécurité est maîtrisée et documentée inspire confiance et se transmet sereinement. La sécurité n'est pas un coût : c'est une composante de la valeur.

## Les fondamentaux applicables à tout actif

Quel que soit le type d'actif (site, application, SaaS), certaines règles sont universelles :

- **Mises à jour régulières** du logiciel, du thème et des extensions : la majorité des piratages exploitent des failles connues et non corrigées.
- **Mots de passe forts et uniques**, jamais réutilisés d'un service à l'autre.
- **Authentification à deux facteurs (2FA)** sur les accès critiques.
- **Principe du moindre privilège** : chaque compte n'a que les droits strictement nécessaires.
- **HTTPS** activé partout (chiffrement des échanges).
- **Sauvegardes automatiques, externalisées et testées.**

## Sécuriser un site (et WordPress en particulier)

Pour un site, notamment sous WordPress :

- Limitez et auditez les **comptes administrateurs**.
- Installez une extension de **sécurité** (pare-feu, détection d'intrusion).
- Supprimez les **extensions inutiles ou abandonnées**, portes d'entrée classiques.
- Protégez la page de connexion (limitation des tentatives).

## Protéger une application ou un SaaS

Pour un actif logiciel, les enjeux montent d'un cran :

- Sécurisez l'accès aux **serveurs** et au **code source**.
- **Chiffrez** les données sensibles, au repos et en transit.
- Protégez rigoureusement les **clés API** et les secrets (jamais dans le code public).
- Gérez finement les **droits d'accès** et journalisez les actions.
- Préparez un **plan de réponse aux incidents**.

## La sécurité pendant la transaction

C'est un moment de vulnérabilité particulier. La règle d'or : **ne jamais transmettre d'identifiants complets avant la sécurisation du paiement.** Dévoilez les accès par paliers, privilégiez les accès en lecture pendant la due diligence, et gardez les accès complets pour la toute fin, une fois la transaction sécurisée par un séquestre.

## Après la vente : la rotation des accès

Une fois l'actif transmis, l'acheteur doit **immédiatement** :

- Changer **tous les mots de passe**.
- Révoquer les anciens accès et **clés API** du vendeur.
- Réactiver la 2FA sur ses propres comptes.
- Vérifier qu'aucun accès résiduel ne subsiste.

Cette rotation des identifiants est indispensable pour repartir sur des bases saines.

## En résumé — La checklist cybersécurité

- **Mettez tout à jour** : c'est la première ligne de défense.
- **Mots de passe forts + 2FA** sur les accès critiques.
- **Moindre privilège** : chaque compte au strict nécessaire.
- **Chiffrement (HTTPS, données)** et protection des clés API.
- **Sauvegardes testées** et plan de réponse aux incidents.
- **Dévoilez les accès par paliers** pendant la transaction.
- **Changez tous les identifiants** juste après la vente.

La cybersécurité est le socle silencieux de la confiance numérique. La négliger, c'est fragiliser la valeur de son actif ; la maîtriser, c'est la protéger. C'est pourquoi La Citadelle en fait une priorité à chaque étape d'une transmission.

---

*Ainsi se referme la première série du Guide de La Citadelle. Dix guides pratiques, un même objectif : vous donner les clés pour acheter, vendre et transmettre vos actifs numériques en toute sécurité. La collection continue — rendez-vous chaque samedi.*""",
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

    print(f"\nLot 2 (Guides) terminé — {created} guide(s) créé(s), {skipped} mis à jour.")


if __name__ == "__main__":
    asyncio.run(main())
