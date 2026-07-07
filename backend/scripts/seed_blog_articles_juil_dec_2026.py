"""
Seed — Articles classiques du Blog de La Citadelle — Juillet à Décembre 2026
---------------------------------------------------------------------------------
25 articles classiques (photos réelles), publiés chaque LUNDI en PUBLICATION PROGRAMMÉE.
Catégories du blog général (hors rubriques premium Chroniques / Guides).
Idempotent : met à jour l'image des articles déjà présents, insère les absents.
Usage : python -m scripts.seed_blog_articles_juil_dec_2026   (depuis /app/backend, venv actif)
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

AUTHOR = "La Citadelle Numérique"

# Photos réelles (Unsplash / Pexels)
IMG = {
    "wp": "https://images.pexels.com/photos/1181449/pexels-photo-1181449.jpeg",
    "shopify": "https://images.unsplash.com/photo-1674027392887-751d6396b710",
    "php": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    "blog": "https://images.unsplash.com/photo-1579338775661-7d0b8621ec83",
    "saas": "https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg",
    "cart": "https://images.pexels.com/photos/35560482/pexels-photo-35560482.jpeg",
    "seo": "https://images.pexels.com/photos/270637/pexels-photo-270637.jpeg",
    "gmap": "https://images.pexels.com/photos/5921677/pexels-photo-5921677.jpeg",
    "data3": "https://images.pexels.com/photos/7013070/pexels-photo-7013070.png",
    "charts": "https://images.pexels.com/photos/8068775/pexels-photo-8068775.jpeg",
    "code2": "https://images.pexels.com/photos/14553707/pexels-photo-14553707.jpeg",
    "news": "https://images.unsplash.com/photo-1495020689067-958852a7765e",
    "agency1": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0",
    "agency3": "https://images.unsplash.com/photo-1622675363311-3e1904dc1885",
    "data2": "https://images.pexels.com/photos/97080/pexels-photo-97080.jpeg",
    "tablet": "https://images.pexels.com/photos/8171183/pexels-photo-8171183.jpeg",
    "server1": "https://images.unsplash.com/photo-1680992044138-ce4864c2b962",
    "server2": "https://images.unsplash.com/photo-1680992046626-418f7e910589",
    "nocode": "https://images.unsplash.com/photo-1642132652803-01f9738d0446",
    "robot": "https://images.unsplash.com/photo-1737644467636-6b0053476bb2",
    "aihands": "https://images.unsplash.com/photo-1694903110330-cc64b7e1d21d",
    "code3": "https://images.pexels.com/photos/16023919/pexels-photo-16023919.jpeg",
    "server3": "https://images.unsplash.com/photo-1614508569207-3295ac89d75f",
    "imac": "https://images.unsplash.com/photo-1626785774573-4b799315345d",
    "imac2": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d",
}


def aeo(pairs):
    return [{"question": q, "answer": a} for q, a in pairs]


ARTICLES = [
    {
        "slug": "comment-vendre-un-site-wordpress",
        "date": "2026-07-13T07:00:00+00:00",
        "title": "Comment vendre un site WordPress ?",
        "category": "vendre-un-site",
        "cover": IMG["wp"],
        "excerpt": "Préparation, estimation et transmission : les étapes clés pour vendre un site WordPress au meilleur prix et en toute sécurité.",
        "seo": ["vendre site WordPress", "vendre WordPress", "vendre site internet", "WordPress business"],
        "geo": ["WordPress France"],
        "aeo": aeo([
            ("Comment vendre un site WordPress ?", "Pour vendre un site WordPress : rassemblez les preuves de revenus et de trafic, faites le point sur les thèmes, extensions et leurs licences, estimez sa valeur sur un multiple de bénéfice, publiez une annonce transparente, sécurisez le paiement via un séquestre, puis transmettez la base de données, les fichiers, le domaine et les licences."),
            ("Combien vaut un site WordPress ?", "Un site WordPress se valorise sur son bénéfice net mensuel (souvent 24 à 40 fois pour un site de contenu), ajusté selon la stabilité des revenus, la diversité du trafic, la dette technique et la qualité des preuves."),
        ]),
        "content": """WordPress fait tourner une part immense du web, et les sites WordPress figurent parmi les actifs les plus échangés. Voici comment vendre le vôtre efficacement et en toute sécurité.

## Préparer son site avant la vente

Avant de publier une annonce, mettez de l'ordre dans votre actif. Réunissez les **preuves de revenus** (relevés Stripe, régie publicitaire, affiliation) et de **trafic** (Search Console, Analytics). Faites l'inventaire des **thèmes et extensions**, en vérifiant leurs **licences** : certaines sont liées à votre compte et devront être transférées ou rachetées par l'acheteur.

Profitez-en pour nettoyer : mises à jour du cœur, du thème et des plugins, suppression des extensions inutiles, et **sauvegarde complète** testée.

## Estimer et présenter

Un site WordPress se valorise sur ce qu'il **rapporte**, via un multiple de son bénéfice net mensuel. Fixez un prix défendable, appuyé sur vos chiffres. Rédigez ensuite une annonce claire et transparente : modèle de revenus, sources de trafic, temps de gestion, éléments transmis, et **faiblesses assumées** — l'honnêteté rassure et accélère la vente.

## Sécuriser et transmettre

Ne cédez jamais vos accès complets avant d'être payé. Le recours à un **séquestre** protège les deux parties. La transmission suit un ordre précis : sauvegarde, hébergement et base de données, domaine et zone DNS, puis comptes tiers et licences. Validez chaque étape avec l'acheteur et prévoyez une courte période d'accompagnement.

## En résumé

Vendre un site WordPress, c'est préparer un dossier solide, fixer un prix juste, sécuriser le paiement et transmettre méthodiquement. Un actif bien préparé trouve toujours preneur, au bon prix.""",
    },
    {
        "slug": "comment-acheter-une-boutique-shopify-rentable",
        "date": "2026-07-20T07:00:00+00:00",
        "title": "Comment acheter une boutique Shopify rentable ?",
        "category": "acheter-un-site",
        "cover": IMG["shopify"],
        "excerpt": "Marges, fournisseurs, dépendance publicitaire : les vérifications indispensables avant d'acheter une boutique Shopify.",
        "seo": ["acheter Shopify", "boutique Shopify", "acheter e-commerce"],
        "geo": ["Shopify France"],
        "aeo": aeo([
            ("Comment acheter une boutique Shopify ?", "Pour acheter une boutique Shopify : vérifiez les marges réelles (pas seulement le chiffre d'affaires), la dépendance à la publicité payante, la solidité des fournisseurs, la part de clients récurrents et la force de la marque, puis croisez les revenus avec le tableau de bord Shopify avant de sécuriser l'achat."),
            ("Que vérifier avant l'achat ?", "Vérifiez la marge nette, le coût d'acquisition client, la dépendance publicitaire, les fournisseurs, le taux de clients récurrents, les avis, les applications payantes installées et l'historique des ventes sur 12 à 24 mois."),
        ]),
        "content": """Une boutique Shopify peut être un excellent investissement — ou un gouffre si sa rentabilité repose sur du sable. Voici comment acheter en connaissance de cause.

## Regarder la marge, pas le chiffre d'affaires

L'erreur classique est de se laisser séduire par un gros chiffre d'affaires. Ce qui compte, c'est la **marge nette** : après coût des produits, publicité, frais Shopify et logistique. Une boutique à fort chiffre mais à marge minuscule vaut bien moins qu'une boutique plus modeste mais rentable.

## Tester la dépendance publicitaire

Posez la question clé : que se passe-t-il si l'on **coupe la publicité** ? Si les ventes s'effondrent, la rentabilité est illusoire. Une boutique saine dispose d'une part de trafic organique (SEO, direct), d'une **clientèle récurrente** et d'une **marque** reconnue.

## Vérifier fournisseurs et preuves

Examinez la **solidité des fournisseurs** : un fournisseur unique est un risque majeur. En dropshipping, contrôlez les délais, la qualité et les litiges. Enfin, exigez un accès en lecture au **tableau de bord Shopify** et au processeur de paiement, et croisez ces données avec les relevés bancaires.

## En résumé

Une boutique Shopify rentable se reconnaît à sa marge, sa marque et sa clientèle fidèle — pas à sa dépense publicitaire. Vérifiez, croisez les preuves, puis sécurisez l'achat via un séquestre.""",
    },
    {
        "slug": "comment-vendre-un-site-developpe-avec-laravel",
        "date": "2026-07-27T07:00:00+00:00",
        "title": "Comment vendre un site développé avec Laravel ?",
        "category": "vendre-un-site",
        "cover": IMG["php"],
        "excerpt": "Vendre une application Laravel : documenter le code, les dépendances et les revenus pour rassurer les acheteurs techniques.",
        "seo": ["vendre Laravel", "vendre application Laravel", "vendre site Laravel"],
        "geo": ["Laravel France"],
        "aeo": aeo([
            ("Peut-on vendre un site Laravel ?", "Oui, un site ou une application Laravel se vend comme tout actif numérique. Sa valeur dépend des revenus, de la qualité et de la maintenabilité du code, des dépendances et de la documentation. Un code propre et documenté rassure et valorise l'actif."),
            ("Comment vendre une application Laravel ?", "Documentez l'architecture et les dépendances, prouvez les revenus, présentez le code source et la documentation technique, calibrez le prix, sécurisez le paiement via un séquestre, puis transmettez le code, l'infrastructure et les accès."),
        ]),
        "content": """Un site ou une application développés avec Laravel — l'un des frameworks PHP les plus populaires — sont des actifs recherchés, à condition de rassurer des acheteurs souvent techniques. Voici comment.

## Valoriser la qualité du code

Contrairement à un site de contenu, un actif Laravel se juge aussi sur la **qualité technique**. Un acheteur regardera la maintenabilité du code, le respect des conventions, la couverture de tests éventuelle et la **dette technique**. Un code propre, structuré et documenté se vend mieux qu'un développement bricolé.

## Documenter les dépendances

Listez les **dépendances** (packages Composer, services externes, API) et leurs versions. Précisez la version de PHP et de Laravel, et si des mises à jour majeures sont nécessaires. Cette transparence évite les mauvaises surprises et rassure le repreneur.

## Prouver les revenus et transmettre

Comme pour tout actif, apportez des **preuves de revenus** vérifiables. La transmission d'une application implique le transfert du **code source**, de l'**infrastructure** (serveur, base de données), des **accès** et de la documentation. Sécurisez le paiement via un séquestre et prévoyez un accompagnement technique.

## En résumé

Vendre un site Laravel, c'est vendre autant un produit logiciel qu'un business. La rigueur technique — code propre, dépendances documentées, transmission soignée — fait toute la différence sur le prix.""",
    },
    {
        "slug": "comment-acheter-un-blog-rentable",
        "date": "2026-08-03T07:00:00+00:00",
        "title": "Comment acheter un blog rentable ?",
        "category": "acheter-un-site",
        "cover": IMG["blog"],
        "excerpt": "Trafic, revenus, dépendance SEO : les points à vérifier pour acheter un blog rentable sans mauvaise surprise.",
        "seo": ["acheter blog", "acheter site internet", "blog rentable"],
        "geo": ["Blog France"],
        "aeo": aeo([
            ("Comment acheter un blog ?", "Pour acheter un blog : vérifiez les revenus prouvés et leur diversité, analysez le trafic via Search Console et Analytics, contrôlez la dépendance au SEO et à une seule source, évaluez la fraîcheur du contenu, puis sécurisez l'achat via un séquestre."),
            ("Combien vaut un blog ?", "Un blog se valorise sur son bénéfice net mensuel, multiplié par un facteur (souvent 24 à 40 fois), ajusté selon la diversité du trafic, la stabilité des revenus, la qualité du contenu et le niveau de dépendance au SEO."),
        ]),
        "content": """Un blog rentable peut générer des revenus passifs séduisants (publicité, affiliation, produits). Mais tous les blogs ne se valent pas. Voici comment acheter le bon.

## Analyser le trafic en profondeur

Le nerf de la guerre est le **trafic**. Croisez **Analytics et Search Console** pour vérifier qu'il est réel et diversifié. Méfiez-vous de la dépendance à **une seule requête** ou à un seul canal : un blog qui vit sur un unique mot-clé est fragile face aux mises à jour d'algorithme.

## Vérifier les revenus et le contenu

Exigez des **preuves de revenus** natives (régie publicitaire, affiliation). Analysez la **fraîcheur du contenu** : un blog non maintenu perd progressivement son trafic. Vérifiez aussi qui produit les articles et à quel coût — un blog dépendant d'un rédacteur unique demande un plan de reprise.

## Estimer et sécuriser

Un blog se valorise sur son **bénéfice net**, via un multiple ajusté au risque. Une fois l'audit fait, sécurisez l'achat via un **séquestre** et ne recevez les accès complets qu'après paiement sécurisé.

## En résumé

Acheter un blog rentable, c'est vérifier la réalité du trafic, la diversité des revenus et la santé du contenu. Un blog sain et diversifié est un bel actif ; un blog mono-source, un pari.""",
    },
    {
        "slug": "les-criteres-qui-augmentent-la-valeur-dun-saas",
        "date": "2026-08-10T07:00:00+00:00",
        "title": "Les critères qui augmentent la valeur d'un SaaS",
        "category": "estimation",
        "cover": IMG["saas"],
        "excerpt": "MRR, churn, rétention, diversification : les facteurs qui font grimper le multiple de valorisation d'un SaaS.",
        "seo": ["estimation SaaS", "valorisation SaaS", "valeur SaaS"],
        "geo": ["SaaS France"],
        "aeo": aeo([
            ("Comment estimer un SaaS ?", "On estime un SaaS sur un multiple de son MRR ou de son ARR, ajusté selon le churn, la rétention, la croissance, la diversification de la clientèle et la dette technique. Plus les revenus sont récurrents et stables, plus le multiple est élevé."),
            ("Combien vaut un SaaS ?", "La valeur d'un SaaS dépend de son revenu récurrent (MRR/ARR), de son taux de résiliation (churn), de sa croissance et de la solidité de sa base clients. Un SaaS à faible churn et forte rétention se valorise sur un multiple nettement supérieur à un site classique."),
        ]),
        "content": """Deux SaaS au même chiffre d'affaires peuvent se vendre à des prix très différents. La raison tient à quelques critères déterminants. Voici ceux qui font grimper la valeur.

## La récurrence et la faiblesse du churn

Le cœur de la valeur d'un SaaS est son **revenu récurrent** (MRR). Mais un MRR élevé ne suffit pas : c'est le **churn** (taux de résiliation) qui fait la différence. Un SaaS qui croît tout en fuyant par le bas est fragile. À l'inverse, une **forte rétention** justifie un multiple élevé, car elle prouve la valeur durable du produit.

## La diversification de la clientèle

Un SaaS dont le MRR repose sur **quelques gros clients** est risqué : perdre un compte fait vaciller l'édifice. Une **base clients diversifiée** rassure et augmente la valeur. La qualité de l'acquisition compte aussi : une croissance saine vaut mieux qu'une croissance dopée à la publicité.

## La solidité technique et la transmissibilité

Un code maintenable, une faible **dette technique**, une infrastructure maîtrisée et une **documentation** claire augmentent la valeur, car ils réduisent le risque pour l'acheteur. Un SaaS peu dépendant de son fondateur est plus facile à reprendre — donc plus liquide.

## En résumé

Récurrence, faible churn, clientèle diversifiée, code sain et transmissibilité : voilà les leviers qui font monter le multiple d'un SaaS. Les travailler en amont, c'est augmenter mécaniquement la valeur de son actif.""",
    },
    {
        "slug": "comment-vendre-une-boutique-prestashop",
        "date": "2026-08-17T07:00:00+00:00",
        "title": "Comment vendre une boutique PrestaShop ?",
        "category": "ecommerce",
        "cover": IMG["cart"],
        "excerpt": "Vendre une boutique PrestaShop : marges, modules, catalogue et transmission technique expliqués simplement.",
        "seo": ["vendre Prestashop", "boutique Prestashop", "vendre e-commerce"],
        "geo": ["Prestashop France"],
        "aeo": aeo([
            ("Comment vendre une boutique Prestashop ?", "Pour vendre une boutique PrestaShop : documentez le chiffre d'affaires et surtout les marges réelles, listez les modules et leurs licences, prouvez les ventes, présentez le catalogue et les fournisseurs, puis sécurisez le paiement et transmettez la boutique, la base de données et les accès."),
        ]),
        "content": """PrestaShop est une solution e-commerce open source très répandue en France. Vendre une boutique PrestaShop obéit aux règles du e-commerce, avec quelques spécificités techniques. Voici l'essentiel.

## Raisonner en marge nette

Comme pour toute boutique en ligne, ne vous focalisez pas sur le chiffre d'affaires mais sur la **marge nette** : après coût des produits, frais, logistique et publicité. C'est elle qui détermine la valeur réelle de l'actif.

## Documenter modules et catalogue

PrestaShop repose sur des **modules** (extensions), parfois sous licence payante liée à votre compte. Listez-les et précisez lesquels sont transférables. Documentez aussi le **catalogue produits**, les **fournisseurs** et la part de **clients récurrents** — autant d'éléments qui rassurent l'acheteur.

## Prouver, sécuriser, transmettre

Apportez des **preuves de ventes** (back-office PrestaShop, processeur de paiement) croisées avec les relevés. Sécurisez le paiement via un **séquestre**, puis transmettez la boutique : fichiers, base de données, domaine, modules et relations fournisseurs, avec validation de l'acheteur.

## En résumé

Vendre une boutique PrestaShop, c'est prouver sa rentabilité réelle, documenter modules et fournisseurs, et transmettre proprement l'ensemble technique. La transparence accélère la vente.""",
    },
    {
        "slug": "pourquoi-les-backlinks-augmentent-la-valeur-dun-site-internet",
        "date": "2026-08-24T07:00:00+00:00",
        "title": "Pourquoi les backlinks augmentent la valeur d'un site internet ?",
        "category": "seo",
        "cover": IMG["seo"],
        "excerpt": "Les backlinks de qualité renforcent l'autorité et le trafic d'un site — et donc sa valeur de revente. Explications.",
        "seo": ["backlinks", "valeur site internet", "SEO backlinks"],
        "geo": ["SEO France"],
        "aeo": aeo([
            ("Les backlinks influencent-ils le prix d'un site ?", "Oui, les backlinks de qualité augmentent l'autorité d'un site, améliorent son positionnement et sécurisent son trafic organique. Un profil de liens solide et naturel est un actif difficile à répliquer, ce qui augmente la valeur et la résilience du site."),
        ]),
        "content": """Parmi les critères qui font la valeur d'un site, les backlinks occupent une place à part. Ces liens pointant depuis d'autres sites sont un actif souvent sous-estimé. Voici pourquoi ils comptent.

## Les backlinks, socle de l'autorité SEO

Un **backlink** est un lien entrant depuis un autre site. Aux yeux des moteurs de recherche, il agit comme un vote de confiance : plus un site reçoit de liens de qualité, plus son **autorité** grandit, et mieux il se positionne. Cette autorité se traduit par du trafic organique — la source la plus durable et la plus rentable.

## Un actif difficile à répliquer

Ce qui rend les backlinks précieux, c'est leur **rareté**. Un bon profil de liens se construit avec le temps, la qualité du contenu et des relations. On ne peut pas l'acheter du jour au lendemain (les liens artificiels étant risqués). Un site doté d'un profil de liens **solide et naturel** possède donc un avantage concurrentiel durable — et un acheteur le paiera plus cher.

## Qualité plutôt que quantité

Attention : tous les backlinks ne se valent pas. Mieux vaut quelques liens depuis des sites **pertinents et fiables** qu'une multitude de liens douteux, potentiellement pénalisants. Lors d'un audit, on évalue la **qualité**, la pertinence et la naturalité du profil de liens.

## En résumé

Les backlinks de qualité renforcent l'autorité, sécurisent le trafic et sont difficiles à copier. Ils augmentent donc la valeur et la résilience d'un site — un atout majeur au moment de la revente.""",
    },
    {
        "slug": "comment-transferer-une-fiche-google-business-profile",
        "date": "2026-08-31T07:00:00+00:00",
        "title": "Comment transférer une fiche Google Business Profile ?",
        "category": "seo",
        "cover": IMG["gmap"],
        "excerpt": "Transférer une fiche Google Business Profile lors d'une cession : la méthode pour ne pas perdre avis et visibilité locale.",
        "seo": ["Google Business Profile", "transfert fiche Google", "Google Business"],
        "geo": ["Google Business France"],
        "aeo": aeo([
            ("Comment transférer une fiche Google Business ?", "Pour transférer une fiche Google Business Profile : ajoutez le nouveau propriétaire comme gestionnaire, puis transférez-lui le rôle de propriétaire principal depuis les paramètres de la fiche. Conservez les avis et l'historique en évitant de recréer une fiche, et validez que le nouvel accès fonctionne avant de retirer l'ancien."),
        ]),
        "content": """Pour un commerce local ou une entreprise de services, la fiche Google Business Profile est un actif précieux : elle concentre avis, visibilité locale et contacts. Bien la transférer lors d'une cession est essentiel.

## Pourquoi ne pas recréer la fiche

L'erreur à éviter absolument est de **supprimer et recréer** une fiche. Vous perdriez l'historique, les **avis clients** accumulés et l'ancienneté — des éléments de confiance difficiles à reconstituer. La bonne approche est le **transfert de propriété**, qui préserve tout.

## La méthode de transfert

Le principe : ajouter d'abord le nouveau propriétaire comme **gestionnaire** de la fiche, puis lui attribuer le rôle de **propriétaire principal** depuis les paramètres. L'ancien propriétaire devient alors gestionnaire, avant d'être retiré une fois le transfert validé. Procédez dans cet ordre pour ne jamais perdre le contrôle de la fiche.

## Valider avant de se retirer

Comme pour tout transfert d'accès, **validez** que le nouveau propriétaire dispose bien du contrôle complet avant de vous retirer. Vérifiez que la fiche reste active, que les avis sont conservés et que les informations sont à jour.

## En résumé

Transférer une fiche Google Business Profile, c'est privilégier le transfert de propriété plutôt que la recréation, procéder dans le bon ordre et valider avant de se retirer. Ainsi, avis et visibilité locale sont préservés.""",
    },
    {
        "slug": "comment-vendre-un-site-daffiliation",
        "date": "2026-09-07T07:00:00+00:00",
        "title": "Comment vendre un site d'affiliation ?",
        "category": "vendre-un-site",
        "cover": IMG["data3"],
        "excerpt": "Vendre un site d'affiliation : prouver les commissions, diversifier les programmes et rassurer sur la pérennité du trafic.",
        "seo": ["vendre site affiliation", "affiliation", "business affiliation"],
        "geo": ["Affiliation France"],
        "aeo": aeo([
            ("Comment vendre un site d'affiliation ?", "Pour vendre un site d'affiliation : prouvez les commissions via les tableaux de bord des programmes, documentez la diversité des partenaires et des sources de trafic, montrez la stabilité des revenus, puis sécurisez le paiement et transmettez le site, les comptes d'affiliation et les accès."),
        ]),
        "content": """Un site d'affiliation génère des revenus en recommandant des produits ou services contre commission. C'est un actif prisé, à condition de rassurer sur la pérennité de ses revenus. Voici comment le vendre.

## Prouver les commissions

Le premier réflexe de l'acheteur sera de vérifier les revenus. Fournissez les **tableaux de bord des programmes d'affiliation** (relevés de commissions) sur 12 à 24 mois, croisés avec les versements réels. Des preuves natives valent bien plus que de simples captures.

## Rassurer sur la diversité

Le grand risque d'un site d'affiliation est la **dépendance** : à un seul programme, un seul partenaire, ou un seul mot-clé. Un acheteur averti valorise la **diversité** — plusieurs programmes, plusieurs sources de trafic, un contenu réparti. Mettez en avant cette résilience si votre site en dispose ; soyez transparent si ce n'est pas le cas.

## Sécuriser et transmettre

La transmission implique le transfert du **site** (fichiers, base, domaine) et des **comptes d'affiliation** (ou leur recréation au nom de l'acheteur, selon les programmes). Sécurisez le paiement via un séquestre et documentez les partenariats en cours.

## En résumé

Vendre un site d'affiliation, c'est prouver ses commissions, démontrer la diversité de ses sources et transmettre proprement site et comptes partenaires. La pérennité rassure et se paie.""",
    },
    {
        "slug": "comment-estimer-un-site-daffiliation",
        "date": "2026-09-14T07:00:00+00:00",
        "title": "Comment estimer un site d'affiliation ?",
        "category": "estimation",
        "cover": IMG["charts"],
        "excerpt": "Méthode d'estimation d'un site d'affiliation : multiple de bénéfice, diversité des programmes et solidité du trafic.",
        "seo": ["estimation site affiliation", "valeur site affiliation", "business affiliation"],
        "geo": ["Affiliation France"],
        "aeo": aeo([
            ("Combien vaut un site d'affiliation ?", "Un site d'affiliation se valorise sur son bénéfice net mensuel multiplié par un facteur (souvent 24 à 40 fois), ajusté selon la diversité des programmes, la stabilité des commissions, la solidité et la diversité du trafic, et la dépendance éventuelle à un seul partenaire ou mot-clé."),
        ]),
        "content": """Estimer un site d'affiliation demande de regarder au-delà du revenu affiché : la stabilité et la diversité comptent autant que le montant. Voici la méthode.

## Partir du bénéfice net

L'estimation repose sur le **bénéfice net mensuel** (commissions moins coûts : hébergement, contenu, outils, temps), multiplié par un facteur. Ce multiple, souvent situé entre 24 et 40 fois pour un site de contenu, varie selon le risque.

## Ajuster selon la diversité et la stabilité

Le multiple **monte** quand les revenus sont diversifiés (plusieurs programmes, plusieurs partenaires) et stables dans le temps. Il **baisse** en cas de dépendance à un seul programme, à un seul mot-clé, ou de commissions en dents de scie. La **solidité du trafic** (croisement Analytics / Search Console) pèse également.

## Prendre en compte la pérennité

Un facteur propre à l'affiliation : la **pérennité des programmes**. Un partenaire qui peut baisser ses commissions ou fermer son programme représente un risque. Un site dont les revenus reposent sur des partenaires solides et variés se valorise mieux.

## En résumé

On estime un site d'affiliation sur son bénéfice net, ajusté par la diversité des programmes, la stabilité des commissions et la solidité du trafic. Diversité et régularité sont les meilleurs alliés de la valeur.""",
    },
    {
        "slug": "comment-vendre-un-site-developpe-avec-symfony",
        "date": "2026-09-21T07:00:00+00:00",
        "title": "Comment vendre un site développé avec Symfony ?",
        "category": "vendre-un-site",
        "cover": IMG["code2"],
        "excerpt": "Vendre une application Symfony : mettre en valeur la robustesse du code, documenter l'architecture et rassurer les repreneurs.",
        "seo": ["vendre Symfony", "vendre application Symfony"],
        "geo": ["Symfony France"],
        "aeo": aeo([
            ("Comment vendre un site Symfony ?", "Pour vendre un site ou une application Symfony : documentez l'architecture et les bundles utilisés, mettez en valeur la qualité et la maintenabilité du code, prouvez les revenus, calibrez le prix, sécurisez le paiement via un séquestre, puis transmettez le code, l'infrastructure et les accès."),
        ]),
        "content": """Symfony est un framework PHP réputé pour sa robustesse, souvent utilisé pour des applications professionnelles. Vendre un actif Symfony demande de rassurer des acheteurs exigeants sur le plan technique.

## Mettre en valeur la robustesse

Les projets Symfony sont souvent choisis pour leur **structure et leur robustesse**. Mettez cet atout en avant : architecture claire, respect des bonnes pratiques, bundles utilisés, éventuels tests automatisés. Un acheteur technique valorise un code **maintenable et pérenne**.

## Documenter l'architecture et les dépendances

Fournissez une **documentation** de l'architecture, des **bundles** et dépendances, des services externes et des versions (PHP, Symfony). Signalez la dette technique éventuelle et les mises à jour à prévoir. Cette transparence évite les mauvaises surprises et accélère la due diligence.

## Prouver, sécuriser, transmettre

Apportez des **preuves de revenus** vérifiables. La transmission implique le **code source**, l'**infrastructure**, les **accès** et la documentation. Sécurisez le paiement via un séquestre et prévoyez un accompagnement technique pour la prise en main.

## En résumé

Vendre un site Symfony, c'est valoriser la qualité du code, documenter l'architecture et transmettre proprement. La rigueur technique rassure et se traduit directement dans le prix.""",
    },
    {
        "slug": "comment-acheter-un-media-en-ligne-rentable",
        "date": "2026-09-28T07:00:00+00:00",
        "title": "Comment acheter un média en ligne rentable ?",
        "category": "acheter-un-site",
        "cover": IMG["news"],
        "excerpt": "Audience, diversité des revenus, ligne éditoriale : les clés pour acheter un média numérique rentable et durable.",
        "seo": ["acheter média", "acheter journal en ligne", "média numérique"],
        "geo": ["Média France"],
        "aeo": aeo([
            ("Comment acheter un média numérique ?", "Pour acheter un média en ligne : analysez l'audience et sa fidélité, la diversité des revenus (publicité, abonnements, événements), la ligne éditoriale et la dépendance aux auteurs, puis croisez les données de trafic et de revenus avant de sécuriser l'achat via un séquestre."),
        ]),
        "content": """Un média en ligne rentable — magazine, journal, site d'information de niche — est un actif attirant, mais exigeant. Voici comment acheter le bon.

## Analyser l'audience et sa fidélité

Un média vit de son **audience**. Au-delà du volume, examinez la **fidélité** : trafic récurrent, abonnés, communauté, taux de retour. Une audience fidèle et engagée vaut bien plus qu'un trafic de passage dépendant d'un pic ou d'un seul canal.

## Vérifier la diversité des revenus

Les médias les plus solides diversifient leurs revenus : **publicité**, **abonnements payants**, **événements**, partenariats. Une dépendance exclusive à la publicité rend l'actif vulnérable. Une part de revenus **récurrents** (abonnements) est un signal de qualité.

## Évaluer la ligne éditoriale et l'équipe

Vérifiez la **dépendance aux auteurs** : un média reposant sur une seule plume est fragile à la reprise. Examinez la ligne éditoriale, le calendrier de publication et les coûts de production du contenu. Croisez enfin trafic et revenus avant de conclure.

## En résumé

Acheter un média numérique rentable, c'est privilégier une audience fidèle, des revenus diversifiés et une production transmissible. Vérifiez ces trois piliers avant de sécuriser l'achat.""",
    },
    {
        "slug": "comment-vendre-une-agence-web",
        "date": "2026-10-05T07:00:00+00:00",
        "title": "Comment vendre une agence web ?",
        "category": "business",
        "cover": IMG["agency1"],
        "excerpt": "Vendre une agence web : réduire la dépendance au dirigeant, sécuriser les contrats clients et préparer la transition.",
        "seo": ["vendre agence web", "cession agence digitale"],
        "geo": ["Agence web France"],
        "aeo": aeo([
            ("Peut-on vendre une agence web ?", "Oui, une agence web se vend, mais sa valeur dépend fortement de sa capacité à fonctionner sans son dirigeant. Une agence avec des revenus récurrents, des contrats clients transférables, une équipe autonome et des processus documentés se vend bien mieux qu'une agence reposant sur une seule personne."),
        ]),
        "content": """Vendre une agence web est plus complexe que vendre un site : c'est céder une entreprise, avec ses clients, son équipe et son savoir-faire. Voici les points essentiels.

## Réduire la dépendance au dirigeant

Le principal facteur de valeur — et de risque — est la **dépendance au dirigeant**. Si les clients viennent pour vous, si vous êtes au cœur de chaque projet, l'agence perd de sa valeur à la cession. Les agences les plus vendables reposent sur une **équipe autonome**, des **processus documentés** et une marque qui dépasse la personne du fondateur.

## Sécuriser les contrats clients

Examinez la **récurrence** des revenus (contrats de maintenance, retainers) et la **transférabilité** des contrats clients. Une agence avec des revenus récurrents et des relations clients solides et transférables se valorise nettement mieux qu'une agence vivant de projets ponctuels.

## Préparer la transition

La cession d'une agence exige une **transition** soignée : présentation aux clients clés, transfert du savoir-faire, accompagnement de l'équipe. Prévoyez une période d'accompagnement plus longue que pour un simple site, et formalisez tout par contrat.

## En résumé

Vendre une agence web, c'est prouver qu'elle fonctionne sans son fondateur : équipe autonome, revenus récurrents, contrats transférables et transition préparée. C'est cette autonomie qui fait la valeur.""",
    },
    {
        "slug": "comment-estimer-une-agence-digitale",
        "date": "2026-10-12T07:00:00+00:00",
        "title": "Comment estimer une agence digitale ?",
        "category": "estimation",
        "cover": IMG["agency3"],
        "excerpt": "Estimer une agence digitale : récurrence des revenus, marge, dépendance au dirigeant et portefeuille clients.",
        "seo": ["estimation agence web", "valeur agence digitale"],
        "geo": ["Agence France"],
        "aeo": aeo([
            ("Combien vaut une agence web ?", "Une agence digitale se valorise généralement sur un multiple de son bénéfice (EBE/résultat), ajusté selon la part de revenus récurrents, la marge, la dépendance au dirigeant, la diversité du portefeuille clients et l'autonomie de l'équipe. Plus l'agence est autonome et récurrente, plus le multiple est élevé."),
        ]),
        "content": """Estimer une agence digitale est un exercice plus fin que d'évaluer un site : on valorise une entreprise de services. Voici les critères qui comptent.

## Récurrence et marge

Une agence se valorise sur un **multiple de son bénéfice**. Ce multiple dépend d'abord de la **récurrence** des revenus : les contrats de maintenance et retainers valent plus que les projets ponctuels, par nature imprévisibles. La **marge** compte aussi : une agence rentable et bien gérée se paie mieux qu'une agence à fort chiffre mais faible marge.

## Dépendance au dirigeant et à l'équipe

Le facteur le plus déterminant est la **dépendance au dirigeant**. Une agence qui ne tourne que grâce à son fondateur est décotée. Une **équipe autonome**, des processus documentés et une marque installée augmentent la valeur, car ils réduisent le risque pour le repreneur.

## Portefeuille clients

Analysez la **diversité du portefeuille** : une agence dépendant d'un ou deux gros clients est risquée. Un portefeuille varié, avec des relations solides et transférables, rassure et valorise.

## En résumé

On estime une agence digitale sur un multiple de bénéfice, ajusté par la récurrence, la marge, l'autonomie de l'équipe et la diversité clients. L'indépendance vis-à-vis du dirigeant est la clé du prix.""",
    },
    {
        "slug": "comment-vendre-un-logiciel-saas-b2b",
        "date": "2026-10-19T07:00:00+00:00",
        "title": "Comment vendre un logiciel SaaS B2B ?",
        "category": "saas",
        "cover": IMG["data2"],
        "excerpt": "Vendre un SaaS B2B : valoriser les contrats, le MRR, la faible volatilité et rassurer sur la technique et le support.",
        "seo": ["SaaS B2B", "vendre SaaS"],
        "geo": ["SaaS France"],
        "aeo": aeo([
            ("Comment vendre un SaaS B2B ?", "Pour vendre un SaaS B2B : documentez le MRR, le churn et les contrats clients, prouvez les revenus via le tableau de bord de facturation, présentez l'architecture technique et le support, valorisez la faible volatilité des clients professionnels, puis sécurisez le paiement et transmettez code, infrastructure et base clients."),
        ]),
        "content": """Un SaaS B2B (destiné aux entreprises) est souvent un actif de grande valeur : ses clients professionnels sont plus fidèles et ses contrats plus stables. Voici comment le vendre.

## Valoriser la stabilité des clients B2B

L'atout d'un SaaS B2B est la **faible volatilité** de sa clientèle : les entreprises changent moins souvent de logiciel que les particuliers, car le coût de changement est élevé. Mettez en avant cette **rétention** et la durée de vie de vos clients — c'est un argument de valorisation majeur.

## Documenter MRR, churn et contrats

Comme tout SaaS, présentez le **MRR**, le **churn** et la durée de vie client, prouvés par le tableau de bord de facturation. En B2B, valorisez aussi les **contrats** (engagements annuels, clients de référence) et vérifiez leur transférabilité.

## Rassurer sur la technique et le support

Un acheteur regardera l'**architecture**, la dette technique et surtout le **support** (souvent crucial en B2B). Documentez les processus et la dépendance au fondateur. La transmission inclut le code, l'infrastructure, la base clients et les contrats en cours.

## En résumé

Vendre un SaaS B2B, c'est capitaliser sur la fidélité des clients professionnels, prouver le MRR et les contrats, et rassurer sur la technique et le support. La stabilité B2B est un puissant argument de prix.""",
    },
    {
        "slug": "comment-verifier-la-qualite-dune-base-clients-avant-un-achat",
        "date": "2026-10-26T07:00:00+00:00",
        "title": "Comment vérifier la qualité d'une base clients avant un achat ?",
        "category": "acheter-un-site",
        "cover": IMG["tablet"],
        "excerpt": "Analyser une base clients avant d'acheter : concentration, fidélité, ancienneté et conformité RGPD.",
        "seo": ["base clients", "audit clientèle", "acheter entreprise"],
        "geo": ["France"],
        "aeo": aeo([
            ("Comment analyser une base clients ?", "Pour analyser une base clients avant un achat : mesurez la concentration (part des plus gros clients), la fidélité et l'ancienneté, le taux de churn, la récurrence des revenus et la conformité RGPD. Une base diversifiée, fidèle et conforme est un actif solide ; une base concentrée ou non conforme est un risque."),
        ]),
        "content": """La base clients est souvent l'actif le plus précieux d'une entreprise numérique — et le plus délicat à évaluer. Avant d'acheter, voici comment en vérifier la qualité.

## Mesurer la concentration

Le premier indicateur est la **concentration** : quelle part du chiffre d'affaires repose sur les plus gros clients ? Si quelques comptes pèsent l'essentiel des revenus, la perte de l'un d'eux peut ébranler tout le business. Une base **diversifiée** est bien plus solide.

## Évaluer fidélité et ancienneté

Analysez la **fidélité** : depuis combien de temps les clients restent-ils ? Quel est le **taux de churn** ? Une clientèle ancienne et fidèle prouve la valeur du produit ou service. Regardez aussi la **récurrence** des revenus, gage de prévisibilité.

## Contrôler la conformité RGPD

Point crucial souvent négligé : la base clients est constituée de **données personnelles**. Vérifiez la **conformité RGPD** — consentement, finalité, sécurité. Une base non conforme est un risque juridique que vous héritez. Ce point mérite l'avis d'un professionnel.

## En résumé

Vérifier une base clients, c'est mesurer sa concentration, sa fidélité et sa conformité RGPD. Une base diversifiée, fidèle et conforme est un actif de valeur ; l'inverse, un risque à chiffrer avant d'acheter.""",
    },
    {
        "slug": "comment-vendre-un-portefeuille-de-noms-de-domaine",
        "date": "2026-11-02T07:00:00+00:00",
        "title": "Comment vendre un portefeuille de noms de domaine ?",
        "category": "nom-de-domaine",
        "cover": IMG["server1"],
        "excerpt": "Vendre un portefeuille de domaines : inventaire, estimation, vente groupée ou à l'unité, et transfert sécurisé.",
        "seo": ["portefeuille domaines", "vendre domaines"],
        "geo": ["Nom de domaine France"],
        "aeo": aeo([
            ("Comment vendre plusieurs noms de domaine ?", "Pour vendre un portefeuille de domaines : dressez un inventaire détaillé (extension, historique, trafic), estimez chaque nom, choisissez entre vente groupée ou à l'unité, publiez sur une place de marché ou via un courtier, sécurisez le paiement via un séquestre, puis transférez chaque domaine avec son code d'autorisation."),
        ]),
        "content": """Posséder un portefeuille de noms de domaine, c'est détenir un ensemble d'actifs à la valeur variable. Le vendre efficacement demande méthode. Voici comment.

## Dresser un inventaire précis

Commencez par un **inventaire détaillé** : pour chaque domaine, notez l'extension, l'ancienneté, l'éventuel trafic, l'historique (usages passés, pénalités) et le registrar. Ce travail révèle les **pépites** (noms courts, .com, mots forts) et les domaines de faible valeur.

## Estimer et choisir la stratégie de vente

Estimez chaque nom selon les critères habituels (longueur, extension, potentiel, comparables). Choisissez ensuite votre stratégie : **vente groupée** (plus rapide, souvent décotée) ou **à l'unité** (plus long, mais valorise les meilleurs noms). Souvent, on vend les pépites individuellement et le reste en lot.

## Sécuriser le transfert

Chaque transfert passe par le **registrar** : déverrouillage et **code d'autorisation** (auth code). Pour un portefeuille, organisez les transferts et **sécurisez le paiement** via un séquestre, surtout pour les montants importants.

## En résumé

Vendre un portefeuille de domaines, c'est inventorier, estimer, choisir entre vente groupée et à l'unité, puis transférer de façon sécurisée. Un inventaire clair et un séquestre sont vos meilleurs atouts.""",
    },
    {
        "slug": "comment-acheter-un-portefeuille-de-noms-de-domaine",
        "date": "2026-11-09T07:00:00+00:00",
        "title": "Comment acheter un portefeuille de noms de domaine ?",
        "category": "nom-de-domaine",
        "cover": IMG["server2"],
        "excerpt": "Acheter un portefeuille de domaines : vérifier l'historique, estimer la valeur réelle et sécuriser les transferts.",
        "seo": ["acheter domaines", "portefeuille domaines"],
        "geo": ["France"],
        "aeo": aeo([
            ("Comment acheter plusieurs noms de domaine ?", "Pour acheter un portefeuille de domaines : examinez l'inventaire et l'historique de chaque nom (pénalités, usages passés), estimez la valeur réelle en écartant les domaines sans intérêt, négociez le lot, sécurisez le paiement via un séquestre, puis vérifiez chaque transfert avec le code d'autorisation."),
        ]),
        "content": """Acheter un portefeuille de domaines peut être une opportunité d'investissement — ou l'acquisition d'une masse de noms sans valeur. La vigilance s'impose. Voici la méthode.

## Examiner l'inventaire et l'historique

Ne vous fiez pas au nombre de domaines : c'est la **qualité** qui compte. Pour chaque nom, vérifiez l'extension, la longueur, le potentiel et surtout l'**historique** — un beau nom au passé sulfureux (pénalités, contenus douteux) peut être un cadeau empoisonné. Beaucoup de portefeuilles contiennent une majorité de noms sans intérêt.

## Estimer la valeur réelle

Écartez les domaines sans valeur et concentrez l'estimation sur les **pépites**. Utilisez des comparables et les critères habituels. La valeur d'un portefeuille se concentre souvent sur une minorité de noms : payez pour eux, pas pour le volume.

## Sécuriser les transferts

Négociez le lot, puis **sécurisez le paiement** via un séquestre. Vérifiez chaque **transfert** (déverrouillage, code d'autorisation) et assurez-vous d'obtenir le contrôle effectif de chaque domaine avant de libérer les fonds.

## En résumé

Acheter un portefeuille de domaines, c'est juger la qualité plutôt que le nombre, vérifier chaque historique, estimer la valeur réelle et sécuriser les transferts. La prudence est la règle sur ce marché spéculatif.""",
    },
    {
        "slug": "comment-vendre-un-business-no-code",
        "date": "2026-11-16T07:00:00+00:00",
        "title": "Comment vendre un business No-Code ?",
        "category": "business",
        "cover": IMG["nocode"],
        "excerpt": "Vendre un projet No-Code (Bubble, Glide…) : documenter la plateforme, la portabilité et rassurer sur la pérennité.",
        "seo": ["vendre No-Code", "Bubble", "Glide"],
        "geo": ["No-Code France"],
        "aeo": aeo([
            ("Peut-on vendre un projet No-Code ?", "Oui, un business No-Code (Bubble, Glide, Webflow…) se vend comme un actif numérique. Sa valeur dépend des revenus, de la portabilité du projet, de la dépendance à la plateforme No-Code et de la documentation. Le transfert inclut le compte de la plateforme et les accès associés."),
        ]),
        "content": """Le No-Code (Bubble, Glide, Webflow et autres) permet de créer des applications sans programmation. Ces projets se vendent, mais présentent des spécificités liées à leur plateforme. Voici l'essentiel.

## Documenter la plateforme et la portabilité

Un business No-Code est construit **sur une plateforme** tierce. Documentez laquelle, comment le projet est structuré, et surtout sa **portabilité** : le projet peut-il être transféré facilement à un nouveau compte ? Quelles sont les limites d'export ? Cette transparence rassure l'acheteur.

## Évaluer la dépendance à la plateforme

Comme pour tout actif reposant sur un tiers, la **dépendance à la plateforme** est un risque : évolution des tarifs, des fonctionnalités, voire fermeture. Un acheteur averti intègre ce risque. Mettez en avant la stabilité de la plateforme et la simplicité de reprise.

## Prouver, sécuriser, transmettre

Apportez des **preuves de revenus** vérifiables. La transmission implique le transfert du **compte de la plateforme** (ou du projet), du domaine, des intégrations et des accès. Sécurisez le paiement via un séquestre et documentez le fonctionnement pour faciliter la prise en main.

## En résumé

Vendre un business No-Code, c'est documenter la plateforme, prouver la portabilité et rassurer sur la dépendance. Un projet bien documenté et facilement transférable se vend sereinement.""",
    },
    {
        "slug": "comment-vendre-un-agent-ia",
        "date": "2026-11-23T07:00:00+00:00",
        "title": "Comment vendre un agent IA ?",
        "category": "business",
        "cover": IMG["robot"],
        "excerpt": "Vendre un agent IA : prouver la valeur durable au-delà de la façade, documenter les dépendances et transmettre le savoir-faire.",
        "seo": ["vendre agent IA", "IA", "business IA"],
        "geo": ["IA France"],
        "aeo": aeo([
            ("Peut-on vendre un agent IA ?", "Oui, un agent IA se vend comme un actif numérique. Sa valeur dépend de ce qui le rend durable (données propriétaires, base d'utilisateurs, intégration) au-delà de la simple façade, ainsi que de sa dépendance à des modèles ou API tiers. La transmission inclut le code, les clés API, les données et les comptes."),
        ]),
        "content": """Les agents IA — assistants automatisant des tâches — sont devenus des actifs prisés. Mais leur valeur peut être trompeuse. Voici comment vendre le vôtre honnêtement et efficacement.

## Prouver la valeur durable

Le grand piège d'un agent IA est la **façade** : un outil qui ne fait qu'appeler une API tierce, facilement reproductible. Pour bien vendre, démontrez ce qui rend votre agent **durable** : données propriétaires, base d'utilisateurs fidèle, intégration profonde dans des workflows, ou savoir-faire difficile à copier. C'est cette valeur défendable qui justifie le prix.

## Documenter les dépendances

Un agent IA repose souvent sur des **modèles et API tiers**. Documentez ces dépendances, leur coût, et la capacité de l'agent à changer de fournisseur si nécessaire. La transparence sur ces risques rassure l'acheteur averti.

## Prouver, sécuriser, transmettre

Apportez des **preuves de revenus** et d'usage (utilisateurs actifs, rétention). La transmission inclut le **code**, les **clés API**, les **données** et les comptes. Sécurisez le paiement via un séquestre et prévoyez un accompagnement pour la prise en main technique.

## En résumé

Vendre un agent IA, c'est prouver la valeur durable au-delà de la façade, documenter les dépendances et transmettre code et savoir-faire. La solidité, pas l'effet de mode, fait la valeur.""",
    },
    {
        "slug": "comment-estimer-un-agent-ia",
        "date": "2026-11-30T07:00:00+00:00",
        "title": "Comment estimer un agent IA ?",
        "category": "estimation",
        "cover": IMG["aihands"],
        "excerpt": "Estimer un agent IA : revenus récurrents, données propriétaires, rétention et dépendance technologique.",
        "seo": ["estimation IA", "agent IA", "valeur IA"],
        "geo": ["IA France"],
        "aeo": aeo([
            ("Combien vaut un agent IA ?", "Un agent IA se valorise sur ses revenus (idéalement récurrents), sa base d'utilisateurs et sa rétention, ses données propriétaires et son intégration dans les workflows. Le multiple baisse fortement si l'actif n'est qu'une façade dépendante d'une API tierce, sans valeur durable propre."),
        ]),
        "content": """Estimer un agent IA est un exercice délicat : la technologie impressionne, mais la valeur réelle se cache ailleurs. Voici les critères qui comptent vraiment.

## Partir des revenus et de la récurrence

Comme pour tout actif, l'estimation part des **revenus**, idéalement **récurrents** (abonnements). Un agent IA générant un MRR stable se valorise sur un multiple, comme un SaaS. Les revenus ponctuels ou dépendant d'une hype récente sont valorisés plus prudemment.

## Évaluer la valeur durable

La question centrale : **qu'est-ce qui reste si l'IA devient une commodité ?** Un agent qui n'est qu'une façade sur une API tierce a peu de valeur durable. En revanche, des **données propriétaires**, une **base d'utilisateurs fidèle**, une forte **rétention** ou une intégration profonde augmentent nettement le multiple.

## Mesurer la dépendance technologique

La **dépendance** aux modèles et API tiers est un risque à chiffrer : hausse des prix, changement de conditions, dépréciation. Un agent capable de changer de fournisseur ou peu dépendant est mieux valorisé.

## En résumé

On estime un agent IA sur ses revenus récurrents, sa rétention, ses données propriétaires et sa faible dépendance technologique. La valeur durable prime toujours sur la façade.""",
    },
    {
        "slug": "comment-vendre-une-api",
        "date": "2026-12-07T07:00:00+00:00",
        "title": "Comment vendre une API ?",
        "category": "business",
        "cover": IMG["code3"],
        "excerpt": "Vendre une API : valoriser les utilisateurs, la documentation et la fiabilité, puis transmettre code et contrats d'accès.",
        "seo": ["vendre API", "API REST", "business API"],
        "geo": ["API France"],
        "aeo": aeo([
            ("Peut-on vendre une API ?", "Oui, une API et le service qu'elle alimente se vendent comme un actif : code, documentation, base d'utilisateurs et contrats d'accès. La valeur dépend des revenus (souvent récurrents), du nombre d'utilisateurs, de la fiabilité et de la propriété des données échangées."),
        ]),
        "content": """Une API (interface de programmation) qui rend un service utile peut être un actif de grande valeur, souvent à revenus récurrents. Voici comment la vendre.

## Valoriser les utilisateurs et la récurrence

Une API monétisée fonctionne souvent par **abonnement** ou à l'usage — des revenus récurrents appréciés. Mettez en avant le **nombre d'utilisateurs actifs**, les intégrations existantes et la **rétention**. Une API intégrée profondément dans les systèmes de ses clients bénéficie d'un fort coût de changement, gage de stabilité.

## Documenter et prouver la fiabilité

Une API se juge sur sa **documentation**, sa **fiabilité** (disponibilité, performance) et la qualité de son code. Fournissez la documentation technique, les statistiques d'usage et de disponibilité, et prouvez les revenus. Précisez aussi la **propriété des données** échangées, un point sensible.

## Sécuriser et transmettre

La transmission inclut le **code**, l'**infrastructure**, la **documentation**, les **utilisateurs** et les **contrats d'accès** (clés, abonnements). Vérifiez leur transférabilité. Sécurisez le paiement via un séquestre et prévoyez un accompagnement technique.

## En résumé

Vendre une API, c'est valoriser ses utilisateurs et sa récurrence, prouver sa fiabilité et sa documentation, et transmettre proprement code et contrats. La stabilité des intégrations fait sa valeur.""",
    },
    {
        "slug": "comment-estimer-une-api",
        "date": "2026-12-14T07:00:00+00:00",
        "title": "Comment estimer une API ?",
        "category": "estimation",
        "cover": IMG["server3"],
        "excerpt": "Estimer une API : revenus récurrents, nombre d'utilisateurs, fiabilité et coût de changement pour les clients.",
        "seo": ["estimation API", "valeur API"],
        "geo": ["API France"],
        "aeo": aeo([
            ("Combien vaut une API ?", "Une API se valorise sur ses revenus, généralement récurrents (abonnement ou à l'usage), multipliés par un facteur ajusté selon le nombre d'utilisateurs, la rétention, la fiabilité, la profondeur des intégrations et la dépendance technologique. Plus les clients sont intégrés et fidèles, plus la valeur est élevée."),
        ]),
        "content": """Estimer une API revient à valoriser un service technique à revenus souvent récurrents. Voici les critères déterminants.

## Partir des revenus récurrents

La plupart des API monétisées génèrent des revenus **récurrents** (abonnement ou facturation à l'usage). L'estimation part donc du **MRR** ou de l'ARR, multiplié par un facteur, comme pour un SaaS. Des revenus stables et prévisibles justifient un multiple plus élevé.

## Mesurer utilisateurs, rétention et intégration

Le nombre d'**utilisateurs actifs**, la **rétention** et surtout la **profondeur d'intégration** dans les systèmes des clients sont clés. Une API profondément intégrée bénéficie d'un fort coût de changement : les clients ne la quittent pas facilement, ce qui sécurise les revenus et augmente la valeur.

## Évaluer fiabilité et dépendances

La **fiabilité** (disponibilité, performance) est un critère de valeur, tout comme la **dépendance** à d'autres services ou données tierces, qui constitue un risque à chiffrer. La qualité de la documentation et du code pèse aussi sur la facilité de reprise.

## En résumé

On estime une API sur ses revenus récurrents, sa base d'utilisateurs, la profondeur de ses intégrations et sa fiabilité. Des clients intégrés et fidèles sont le meilleur gage de valeur.""",
    },
    {
        "slug": "comment-vendre-un-plugin-wordpress",
        "date": "2026-12-21T07:00:00+00:00",
        "title": "Comment vendre un plugin WordPress ?",
        "category": "vendre-un-site",
        "cover": IMG["imac"],
        "excerpt": "Vendre un plugin WordPress premium : valoriser les licences actives, le support et la base d'utilisateurs.",
        "seo": ["vendre plugin WordPress", "plugin premium"],
        "geo": ["WordPress France"],
        "aeo": aeo([
            ("Peut-on vendre un plugin WordPress ?", "Oui, un plugin WordPress, surtout premium, se vend comme un actif à revenus souvent récurrents. Sa valeur dépend du nombre de licences actives, des revenus de renouvellement, de la base d'utilisateurs, de la qualité du code et du support. La transmission inclut le code, les licences et les comptes."),
        ]),
        "content": """Un plugin WordPress premium, vendu sous licence ou par abonnement, peut être un actif rentable et récurrent. Voici comment le vendre.

## Valoriser les licences et la récurrence

La valeur d'un plugin premium repose largement sur ses **licences actives** et ses **revenus de renouvellement**. Mettez en avant le nombre de licences, le **taux de renouvellement** et la part de revenus récurrents. Un plugin avec une base d'utilisateurs fidèle et des renouvellements réguliers se valorise comme un mini-SaaS.

## Mettre en avant la base d'utilisateurs et le support

Le nombre d'**installations actives**, les **avis** et la qualité du **support** sont des atouts. Un acheteur regardera aussi la fréquence des mises à jour et la réputation du plugin dans l'écosystème WordPress. Documentez ces éléments.

## Rassurer sur le code et transmettre

Un acheteur technique évaluera la **qualité du code**, sa compatibilité avec les dernières versions de WordPress et la dette technique. La transmission inclut le **code source**, les **licences**, les comptes (plateforme de distribution, support) et la base d'utilisateurs. Sécurisez le paiement via un séquestre.

## En résumé

Vendre un plugin WordPress, c'est valoriser ses licences et renouvellements, sa base d'utilisateurs et son support, puis transmettre code et comptes. La récurrence des licences fait la valeur.""",
    },
    {
        "slug": "comment-vendre-un-theme-wordpress",
        "date": "2026-12-28T07:00:00+00:00",
        "title": "Comment vendre un thème WordPress ?",
        "category": "vendre-un-site",
        "cover": IMG["imac2"],
        "excerpt": "Vendre un thème WordPress premium : ventes, licences, support et compatibilité, puis transmission sécurisée.",
        "seo": ["vendre thème WordPress", "thème premium"],
        "geo": ["WordPress France"],
        "aeo": aeo([
            ("Peut-on vendre un thème WordPress ?", "Oui, un thème WordPress premium se vend comme un actif numérique. Sa valeur dépend des ventes et renouvellements, du nombre d'utilisateurs, des avis, de la qualité du code et du support, ainsi que de la compatibilité avec les dernières versions de WordPress. La transmission inclut le code, les licences et les comptes de distribution."),
        ]),
        "content": """Un thème WordPress premium bien diffusé est un actif attractif, mêlant ventes ponctuelles et parfois abonnements. Voici comment le vendre.

## Analyser ventes et modèle de revenus

Présentez le **modèle de revenus** : ventes à l'unité, licences, abonnements pour les mises à jour et le support. Fournissez l'historique des **ventes** et des renouvellements, prouvé par la plateforme de distribution. Un thème générant des revenus récurrents (support/mises à jour) se valorise mieux qu'un thème à ventes purement ponctuelles.

## Valoriser réputation et support

Le nombre d'**utilisateurs**, les **avis** et la qualité du **support** sont déterminants dans l'écosystème des thèmes. Un thème apprécié, bien noté et régulièrement mis à jour inspire confiance. Documentez ces éléments et la fréquence des mises à jour.

## Rassurer sur la compatibilité et transmettre

Un acheteur vérifiera la **qualité du code** et la **compatibilité** avec les dernières versions de WordPress et les principaux plugins. La transmission inclut le **code source**, les **licences**, les comptes de distribution et de support. Sécurisez le paiement via un séquestre.

## En résumé

Vendre un thème WordPress, c'est prouver ses ventes et renouvellements, valoriser sa réputation et son support, et rassurer sur la compatibilité avant de transmettre code et comptes. Réputation et régularité font le prix.""",
    },
]


async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc).isoformat()
    created, skipped = 0, 0

    for a in ARTICLES:
        existing = await db.citadelle_blog_posts.find_one({"slug": a["slug"]})
        if existing:
            await db.citadelle_blog_posts.update_one(
                {"slug": a["slug"]},
                {"$set": {"cover_image_url": a["cover"], "updated_at": now}},
            )
            skipped += 1
            print(f"  ↻ Article déjà présent — image mise à jour — {a['slug']}")
            continue
        post = {
            "id": str(uuid.uuid4()),
            "slug": a["slug"],
            "title": a["title"],
            "excerpt": a["excerpt"],
            "content_md": a["content"],
            "category": a["category"],
            "author_name": AUTHOR,
            "partner_link": None,
            "cover_image_url": a["cover"],
            "is_published": False,
            "scheduled_at": a["date"],
            "published_at": None,
            "seo_title": a["title"],
            "seo_description": a["excerpt"][:300],
            "seo_keywords": a["seo"],
            "geo_keywords": a["geo"],
            "aeo_questions": a["aeo"],
            "view_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        await db.citadelle_blog_posts.insert_one(post)
        created += 1
        print(f"  ✓ Article programmé le {a['date'][:10]} — {a['slug']}")

    print(f"\nArticles classiques terminés — {created} créé(s), {skipped} mis à jour.")


if __name__ == "__main__":
    asyncio.run(main())
