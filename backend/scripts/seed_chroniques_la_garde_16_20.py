"""
Seed — Les Chroniques de La Garde (rubrique premium) — LOT 4 : Chroniques n°16 à 20
---------------------------------------------------------------------------------
Insère 5 articles en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : met à jour l'image des articles déjà présents, insère les absents.
Usage : python -m scripts.seed_chroniques_la_garde_16_20   (depuis /app/backend, venv actif)
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

CATEGORY = "chroniques-la-garde"
AUTHOR = "La Garde"

# Image unique et stylisée par chronique (navy éditorial + or)
_IMG = "https://static.prod-images.emergentagent.com/jobs/bb5bc88e-9c1e-46ed-99db-f8c3b00e681b/images/"
COVERS = {
    16: _IMG + "980e138d29f7ebc4a960f819f8242093f0c7968132c95a636296f0eb083cea8d.png",
    17: _IMG + "ffb6949952d4237ef9dffe7a65bbe4840bfabef154392f25374e4d8b01e9d3b9.png",
    18: _IMG + "24bcc626465a5fd73433f1eb99cae1fa074d1bcb7f806e1f2e2a925b8eb51a37.png",
    19: _IMG + "18e84db5cee0dd4b7882e2326c32cf4bc8e13ed02e1026baf571325813fde915.png",
    20: _IMG + "0d54981afd89b7cb849571cc08934f6bdf991edb8d694292845ac8674d3d5036.png",
}


CHRONIQUES = [
    {
        "num": 16,
        "slug": "chroniques-la-garde-16-actifs-numeriques-plus-faciles-a-revendre",
        "date": "2026-10-22T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les actifs numériques les plus faciles à revendre",
        "excerpt": "Quels types d'actifs séduisent le plus les acheteurs et pourquoi certains se revendent beaucoup plus vite que d'autres.",
        "seo": ["vendre business digital", "acheter site rentable", "revente site internet"],
        "geo": ["business digital France"],
        "aeo": [
            {"question": "Quel actif numérique acheter ?", "answer": "Les actifs les plus recherchés sont ceux à revenus récurrents et prévisibles (SaaS, abonnements, newsletters), simples à gérer, peu dépendants d'une seule source de trafic ou d'un savoir-faire rare. Ce sont aussi les plus faciles à revendre ensuite."},
            {"question": "Quel business est le plus facile à revendre ?", "answer": "Un business est facile à revendre quand il est transparent, simple à transmettre, peu dépendant de son fondateur, à revenus stables et documentés. La liquidité vient de la lisibilité : plus un acheteur comprend et vérifie vite, plus la revente est rapide."},
        ],
        "content": """Tous les actifs numériques ne se valent pas au moment de la revente. Certains trouvent preneur en quelques jours ; d'autres stagnent des mois. La différence ne tient pas seulement au prix ou aux revenus, mais à un facteur souvent sous-estimé : la **liquidité**. Dans cette chronique, La Garde explore ce qui rend un actif facile — ou difficile — à revendre.

## La liquidité, notion clé et négligée

Sur les marchés financiers, un actif « liquide » est un actif qu'on peut vendre vite, sans décote, parce que de nombreux acheteurs le comprennent et le désirent. Le principe vaut pour le numérique. Un actif liquide se caractérise par une **demande large** et une **compréhension rapide**.

> Plus un acheteur comprend vite ce qu'il achète et vérifie facilement les chiffres, plus l'actif est liquide — donc facile à revendre.

À l'inverse, un actif complexe, opaque ou de niche ultra-spécialisée peut être excellent, mais son cercle d'acquéreurs se réduit, et sa revente s'allonge.

## Ce qui rend un actif facile à revendre

Au fil des transactions, La Garde a identifié les caractéristiques communes des actifs qui partent vite :

- **Des revenus récurrents et prouvés.** La prévisibilité rassure et élargit le cercle des acheteurs.
- **Une gestion simple.** Un actif qui demande peu d'heures et pas de compétence rare séduit les repreneurs individuels.
- **Une faible dépendance au fondateur.** Si le succès repose sur la personnalité ou le savoir-faire unique du vendeur, l'acheteur hésite.
- **Une transparence totale.** Des données vérifiables raccourcissent la due diligence, donc le délai de vente.
- **Une transmission fluide.** Peu d'accès complexes, une pile technique standard, une documentation claire.

## Les catégories les plus demandées

Certains formats concentrent naturellement la demande :

1. **Les micro-SaaS de niche** : revenus récurrents, valeur claire, coûts maîtrisés. Très recherchés par les petits repreneurs.
2. **Les newsletters et audiences directes** : une relation indépendante des algorithmes, simple à transmettre.
3. **Les sites de contenu bien structurés** avec un trafic diversifié et des revenus prouvés (affiliation, publicité).
4. **Les boutiques e-commerce à marque forte**, avec clientèle fidèle et fournisseurs solides.

Le point commun de ces actifs : ils se comprennent vite et se vérifient facilement.

## Ce qui ralentit une revente

À l'opposé, plusieurs facteurs allongent le délai de vente ou imposent une décote :

- La **dépendance à une seule source** de trafic ou à un seul client.
- Une **technologie exotique** ou une dette technique lourde.
- Un modèle économique **difficile à expliquer** en quelques phrases.
- Une **opacité** des données qui rallonge et complique la due diligence.
- Une forte dépendance au **temps et au talent** du propriétaire actuel.

Ces actifs ne sont pas invendables, mais ils exigent un acheteur plus averti, plus patient — et souvent un prix ajusté.

## Rendre son actif plus liquide

La bonne nouvelle, c'est que la liquidité se **construit**. Un vendeur peut, en amont, rendre son actif plus facile à revendre :

- En documentant tout et en rendant les données vérifiables.
- En réduisant les dépendances (diversifier le trafic, ne pas reposer sur un seul client).
- En simplifiant la gestion et en la rendant transmissible (procédures, automatisations).
- En stabilisant les revenus, idéalement vers du récurrent.

C'est exactement la logique de préparation que nous détaillerons dans une prochaine chronique.

## Les recommandations de La Garde

- **Pensez liquidité** : un actif se revend d'autant mieux qu'il se comprend et se vérifie vite.
- **Privilégiez le récurrent et le prouvé** : ce sont les formats les plus demandés.
- **Réduisez les dépendances** : trafic, clients, fondateur — chaque dépendance rétrécit le cercle d'acheteurs.
- **Soignez la transmissibilité** : documentation, procédures, pile technique standard.
- **Construisez la liquidité en amont**, bien avant de penser à vendre.

Un actif facile à revendre n'est pas forcément le plus rentable dans l'absolu, mais c'est celui qui offre le plus de **liberté** à son propriétaire : celle de sortir quand il le souhaite, au bon prix, sans subir l'attente. Et cette liberté, sur le marché numérique, a une valeur bien réelle.""",
    },
    {
        "num": 17,
        "slug": "chroniques-la-garde-17-erreurs-qui-coutent-des-milliers-euros-cession",
        "date": "2026-10-29T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les erreurs qui coûtent plusieurs milliers d'euros lors d'une cession",
        "excerpt": "Retour sur les erreurs les plus coûteuses observées avant ou pendant une vente d'actif numérique.",
        "seo": ["erreur vente site", "vendre site internet", "valorisation"],
        "geo": ["vendre site France"],
        "aeo": [
            {"question": "Quelles erreurs éviter ?", "answer": "Les erreurs les plus coûteuses sont : vendre au mauvais moment (revenus en baisse), mal préparer son dossier, sous-estimer ou surestimer le prix, négliger la fiscalité, accepter un paiement non sécurisé et bâcler la transmission. Chacune peut coûter plusieurs milliers d'euros."},
            {"question": "Pourquoi une vente échoue-t-elle ?", "answer": "Une vente échoue le plus souvent à cause d'un prix mal calibré, d'un manque de preuves vérifiables, d'un dossier mal préparé ou d'une perte de confiance de l'acheteur. Le temps qui passe décote l'annonce et finit par faire fuir les acquéreurs sérieux."},
        ],
        "content": """Vendre un actif numérique est un moment décisif, où quelques erreurs peuvent effacer des mois, voire des années, de travail. La Garde a vu des cessions se conclure bien en dessous de leur valeur — non par malchance, mais à cause d'erreurs évitables. Voici les plus coûteuses, et comment ne pas les commettre.

## Erreur n°1 : vendre au mauvais moment

Le timing est le premier facteur de prix. Vendre quand les revenus **baissent** est l'erreur la plus onéreuse : l'acheteur projette la tendance et applique une décote sévère. À l'inverse, un actif vendu sur une dynamique positive, avec des chiffres en hausse, se négocie au sommet.

> On ne vend pas quand on est fatigué ou pressé, mais quand l'actif est au meilleur de sa forme.

Attendre d'être « à bout » pour vendre, c'est vendre au pire moment. La préparation anticipée (voir la chronique suivante) est le meilleur antidote.

## Erreur n°2 : un dossier mal préparé

Un dossier incomplet fait fuir les acheteurs sérieux ou les incite à négocier durement. Chaque donnée manquante, chaque preuve absente ajoute de la friction et du doute. Un dossier bâclé peut coûter, à lui seul, plusieurs milliers d'euros de décote — simplement parce qu'il transforme un actif solide en pari incertain aux yeux de l'acquéreur.

## Erreur n°3 : mal calibrer le prix

Deux excès se paient cher :

- **Surestimer** : le prix trop haut fait fuir, l'annonce vieillit, et l'actif finit par se vendre décoté après des mois d'attente.
- **Sous-estimer** : par méconnaissance de la valeur réelle (notamment celle du récurrent), certains vendeurs bradent un actif qui valait bien plus.

Le juste prix repose sur un multiple défendable, appuyé sur des preuves. C'est un exercice de rigueur, pas d'intuition.

## Erreur n°4 : négliger la fiscalité

C'est l'angle mort classique. Une cession peut générer une imposition significative selon la structure (particulier, société) et la nature de l'actif. Ne pas anticiper le traitement fiscal, c'est risquer de voir une part substantielle du prix s'évaporer. La Garde recommande de **consulter un professionnel** avant de vendre, pas après. Cette précaution ne remplace pas un conseil fiscal personnalisé, mais elle évite les mauvaises surprises.

## Erreur n°5 : accepter un paiement non sécurisé

C'est peut-être l'erreur la plus dangereuse. Céder les accès avant d'être payé, ou accepter un paiement direct « pour aller plus vite », expose à la perte pure et simple de l'actif **et** des fonds. Le séquestre n'est pas une contrainte : c'est l'assurance qui protège les deux parties. Renoncer à ce cadre pour gagner quelques jours peut coûter la totalité de la transaction.

## Erreur n°6 : bâcler la transmission

Une vente ne s'achève pas au paiement, mais à la transmission complète. Oublier un accès, mal transférer un domaine, négliger les licences ou les sauvegardes génère des litiges, des remboursements et une atteinte à la réputation. Une transmission bâclée peut transformer une belle vente en cauchemar juridique. (Nous y avons consacré une chronique entière : les dix oublis les plus fréquents.)

## Les recommandations de La Garde

- **Vendez au bon moment**, sur une dynamique positive, pas dans l'urgence.
- **Préparez un dossier irréprochable** : chaque preuve manquante coûte de l'argent.
- **Calibrez le prix avec rigueur**, ni trop haut, ni trop bas.
- **Anticipez la fiscalité** en consultant un professionnel avant la vente.
- **N'acceptez jamais un paiement non sécurisé** : le séquestre protège tout le monde.
- **Soignez la transmission** jusqu'au dernier accès.

Ces erreurs ont un point commun : elles sont toutes **évitables**. Une cession réussie n'est pas affaire de chance, mais de méthode et d'anticipation. C'est précisément ce que La Garde cherche à apporter : la sérénité d'une vente préparée, où chaque euro de valeur créé est aussi un euro de valeur préservé.""",
    },
    {
        "num": 18,
        "slug": "chroniques-la-garde-18-preparer-son-business-un-an-avant-la-vente",
        "date": "2026-11-05T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Comment préparer son business un an avant la vente",
        "excerpt": "Plan d'action détaillé pour augmenter progressivement la valeur d'un actif numérique avant sa mise en vente.",
        "seo": ["préparer vente site", "vendre business", "valorisation"],
        "geo": ["France"],
        "aeo": [
            {"question": "Quand préparer la vente ?", "answer": "Idéalement douze mois avant la mise en vente. Ce délai permet de constituer un historique de revenus propre, de réduire les dépendances, de nettoyer la technique et de rassembler toutes les preuves. Une vente préparée un an à l'avance se conclut plus vite et à meilleur prix."},
            {"question": "Comment augmenter la valeur d'un site ?", "answer": "En stabilisant et diversifiant les revenus (vers du récurrent si possible), en réduisant les dépendances (trafic, clients, fondateur), en documentant tout, en nettoyant la dette technique et en tenant un historique clair. La valeur naît de la réduction du risque perçu."},
        ],
        "content": """La meilleure vente n'est pas celle qu'on improvise le jour où l'on décide de partir, mais celle qu'on **prépare longtemps à l'avance**. La Garde le constate systématiquement : un actif préparé un an avant sa mise en vente se cède plus vite, à meilleur prix, et dans de bien meilleures conditions. Voici un plan d'action, mois après mois, pour maximiser la valeur avant la cession.

## Le principe : réduire le risque perçu

Rappelons la règle d'or vue dans une précédente chronique : la valeur d'un actif dépend du **risque perçu** par l'acheteur. Préparer sa vente, ce n'est pas maquiller son business — c'est **réduire méthodiquement chaque source d'incertitude**, pour qu'au moment de vendre, l'acheteur n'ait presque plus de raisons de douter.

> Un an de préparation, ce sont douze mois pour transformer chaque point d'interrogation en preuve.

## Mois 1 à 3 : l'état des lieux et le nettoyage

La première phase consiste à regarder son actif avec les yeux d'un acheteur exigeant :

- **Auditer les revenus** : d'où viennent-ils, sont-ils stables, concentrés, prouvables ?
- **Cartographier les dépendances** : une seule source de trafic ? un seul gros client ? un savoir-faire personnel non transmissible ?
- **Nettoyer la technique** : mises à jour, suppression du superflu, sauvegardes fiables.
- **Rassembler les accès** et commencer un inventaire complet.

Cette phase révèle les chantiers prioritaires des mois suivants.

## Mois 4 à 8 : consolider et diversifier

C'est le cœur du travail de valorisation :

- **Stabiliser et, si possible, rendre les revenus récurrents.** Transformer une prestation ponctuelle en abonnement, un lecteur en abonné.
- **Diversifier les sources de trafic et de revenus** pour réduire les dépendances qui inquiètent les acheteurs.
- **Documenter les procédures** : rédiger comment le business fonctionne, pour le rendre transmissible sans vous.
- **Automatiser** ce qui peut l'être, afin de réduire le temps de gestion — un argument de vente majeur.

Chaque dépendance levée, chaque procédure écrite augmente la liquidité et la valeur de l'actif.

## Mois 9 à 11 : constituer le dossier de preuves

Un actif préparé doit pouvoir **prouver** tout ce qu'il avance. Pendant cette phase :

- Consolidez un **historique de revenus propre** sur 12 mois (relevés Stripe, régie, affiliation).
- Assurez-vous que **Search Console et Analytics** racontent une histoire cohérente.
- Reconstituez les **coûts réels** pour présenter un bénéfice net crédible.
- Préparez le **dossier de transmission** (inventaire des accès, sauvegardes, documentation).
- Envisagez de tenir un **carnet d'entretien** retraçant l'histoire de l'actif.

À ce stade, le dossier doit répondre aux questions avant même qu'elles soient posées.

## Mois 12 : la mise sur le marché

Le dernier mois est celui de la mise en vente proprement dite :

- **Calibrer le prix** sur un multiple défendable, appuyé sur les preuves accumulées.
- **Anticiper la fiscalité** avec un professionnel.
- **Choisir le bon cadre** : un environnement sécurisé, avec séquestre, qui rassure l'acheteur et filtre les curieux.
- **Rédiger une annonce claire**, transparente sur les forces comme sur les faiblesses.

Un actif arrivé ici n'attend plus qu'une chose : le bon acheteur, qui reconnaîtra en un coup d'œil le sérieux du dossier.

## Les recommandations de La Garde

- **Anticipez d'un an.** La préparation est le levier de valorisation le plus rentable qui soit.
- **Réduisez les dépendances** : trafic, clients, fondateur. C'est ce qui rassure le plus.
- **Visez le récurrent** et la stabilité des revenus.
- **Documentez et prouvez tout**, en continu, pas dans la précipitation finale.
- **Vendez au sommet**, sur une dynamique positive et un dossier irréprochable.

Préparer sa vente un an à l'avance, ce n'est pas repousser l'échéance : c'est se donner les moyens de vendre **quand on veut, au prix qu'on mérite**. C'est la différence entre subir une vente et la maîtriser — et c'est tout l'art que La Garde souhaite transmettre.""",
    },
    {
        "num": 19,
        "slug": "chroniques-la-garde-19-mythes-les-plus-repandus-sur-la-vente-de-sites",
        "date": "2026-11-12T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les mythes les plus répandus sur la vente de sites internet",
        "excerpt": "Déconstruction des idées reçues sur la valorisation, le trafic, les revenus et les délais de vente.",
        "seo": ["vendre site internet", "valeur site internet", "business digital"],
        "geo": ["France"],
        "aeo": [
            {"question": "Quels sont les mythes sur la vente de sites ?", "answer": "Les mythes les plus courants : « plus de trafic = plus de valeur », « un site se vend en quelques jours », « le prix se fixe au feeling », « les acheteurs paient pour le potentiel », ou encore « pas besoin d'intermédiaire ». Chacun de ces mythes conduit à des erreurs coûteuses."},
            {"question": "Combien vaut réellement un site ?", "answer": "Un site vaut généralement un multiple de son bénéfice net mensuel (souvent 24 à 40 fois pour un site de contenu, davantage pour un SaaS récurrent), pondéré par la stabilité des revenus, la diversité du trafic, les dépendances et la qualité des preuves. La valeur repose sur les chiffres prouvés, pas sur le potentiel."},
        ],
        "content": """Le marché de la vente de sites internet charrie son lot d'idées reçues. Certaines sont rassurantes, d'autres flatteuses, mais presque toutes conduisent à des erreurs coûteuses. La Garde a décidé de faire le ménage : voici les mythes les plus répandus, et ce que révèle la réalité du marché.

## Mythe n°1 : « Plus de trafic, plus de valeur »

C'est la croyance la plus tenace. Or le trafic n'est pas la valeur — c'est ce que le trafic **rapporte** qui compte. Un site à 200 000 visiteurs qui ne génère rien vaut moins qu'un site à 5 000 visiteurs qui convertit et dégage un bénéfice stable.

> On n'achète pas des visiteurs, on achète un bénéfice net prouvé et durable.

Un trafic gonflé, non converti, ou dépendant d'une seule source, peut même être un **repoussoir** pour l'acheteur averti.

## Mythe n°2 : « Un bon site se vend en quelques jours »

Certains actifs très liquides partent vite, c'est vrai. Mais la règle générale est qu'une vente sérieuse prend du **temps** : constitution du dossier, due diligence de l'acheteur, vérifications, négociation, transmission. Espérer vendre en quarante-huit heures conduit souvent à brader ou à bâcler. Une vente bien menée se compte en semaines, parfois en mois — et c'est normal.

## Mythe n°3 : « Le prix se fixe au feeling »

Fixer son prix « à l'affection » ou « au temps passé » est l'erreur numéro un des sites invendus. Le marché valorise sur des **multiples de bénéfice**, pondérés par le risque. Un prix défendable se calcule et se justifie ; un prix au feeling se traduit par une annonce qui vieillit et finit décotée.

## Mythe n°4 : « Les acheteurs paient pour le potentiel »

« Ce site pourrait faire dix fois plus avec un peu de travail. » Peut-être. Mais un acheteur sérieux **ne paie pas le potentiel** : il paie ce qui existe et se prouve. Le potentiel, c'est **son** travail futur, son risque — pourquoi vous le paierait-il ? Vendre du potentiel, c'est vendre du vent. Vendez des chiffres réels ; le potentiel est un argument de séduction, pas de prix.

## Mythe n°5 : « Pas besoin d'intermédiaire ni de séquestre »

Beaucoup pensent économiser en vendant « directement, entre gens sérieux ». C'est ignorer le risque fondamental : céder les accès sans être payé, ou payer sans recevoir. Le cadre sécurisé et le séquestre ne sont pas des frais superflus : ce sont des **assurances** qui protègent les deux parties et rassurent l'acheteur, ce qui accélère et sécurise la vente. Économiser cette protection, c'est souvent la plus mauvaise économie qui soit.

## Mythe n°6 : « La transparence fait fuir les acheteurs »

Certains vendeurs cachent les faiblesses par peur d'effrayer. C'est l'inverse qui se produit : l'opacité crée le doute, et le doute fait chuter le prix. La **transparence**, y compris sur les faiblesses, inspire confiance et valorise l'actif. Un acheteur découvrira toujours ce qu'on lui cache — mieux vaut l'annoncer soi-même.

## Les recommandations de La Garde

- **Oubliez le trafic-roi** : c'est le bénéfice net prouvé qui fait la valeur.
- **Acceptez que la vente prenne du temps** : la précipitation décote.
- **Calculez votre prix**, ne le devinez pas.
- **Vendez le réel, pas le potentiel.**
- **Ne renoncez jamais au cadre sécurisé.**
- **Faites de la transparence une force**, pas une menace.

Déconstruire ces mythes, c'est se donner une chance de vendre au juste prix, dans de bonnes conditions. Le marché des actifs numériques se professionnalise : les croyances d'hier n'y ont plus leur place, et ceux qui l'ont compris vendent mieux que les autres.""",
    },
    {
        "num": 20,
        "slug": "chroniques-la-garde-20-historique-de-maintenance-rassure-les-investisseurs",
        "date": "2026-11-19T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Pourquoi un historique de maintenance rassure les investisseurs",
        "excerpt": "Comment les mises à jour, audits, sauvegardes et journaux d'intervention augmentent la confiance et la valeur d'un actif numérique.",
        "seo": ["maintenance site internet", "audit site", "historique maintenance"],
        "geo": ["France"],
        "aeo": [
            {"question": "Pourquoi conserver un historique de maintenance ?", "answer": "Parce qu'il prouve qu'un actif a été géré avec sérieux : mises à jour régulières, audits, sauvegardes, incidents résolus. Cet historique réduit l'incertitude de l'acheteur, révèle une dette technique maîtrisée et augmente directement la confiance, donc la valeur de l'actif."},
            {"question": "Quels documents fournir à un acheteur ?", "answer": "Fournissez le journal des mises à jour et interventions, les rapports d'audit (SEO, sécurité, performance), l'historique des sauvegardes, la trace des incidents et de leur résolution, ainsi que le dossier de transmission complet. Ces documents constituent la mémoire technique de l'actif."},
        ],
        "content": """Nous refermons cette deuxième série des Chroniques de La Garde comme nous avions clos la première : sur l'idée d'**historique**. Car s'il fallait retenir une seule leçon de toutes ces analyses, ce serait celle-ci : ce qui rassure un investisseur, ce n'est pas la promesse, c'est la **preuve du sérieux dans la durée**. Et cette preuve porte un nom : l'historique de maintenance.

## La maintenance, révélatrice du sérieux d'un propriétaire

Un actif numérique se maintient comme un jardin : sans entretien régulier, il se dégrade lentement, invisiblement, jusqu'au jour où les problèmes éclatent. Un historique de maintenance raconte, mieux que n'importe quel discours, la manière dont un propriétaire a **pris soin** de son actif.

> Un investisseur ne demande pas seulement « combien ça rapporte ? », mais « dans quel état est-ce vraiment ? ». L'historique de maintenance répond à cette seconde question.

Un actif bien entretenu inspire confiance avant même l'examen des chiffres. Un actif négligé, à l'inverse, laisse craindre une dette technique cachée que l'acheteur héritera.

## Ce que contient un bon historique de maintenance

Concrètement, La Garde recommande de consigner et de conserver :

- **Le journal des mises à jour** : CMS, thèmes, plugins, dépendances, avec leurs dates.
- **Les rapports d'audit** : SEO, sécurité, performance, et les actions correctives menées.
- **L'historique des sauvegardes** : fréquence, emplacement, tests de restauration.
- **La trace des incidents** : pannes, piratages, pénalités — et surtout la façon dont ils ont été résolus.
- **Les interventions techniques majeures** : migrations, refontes, changements d'architecture.

Ce recueil devient la **mémoire vivante** de l'actif, et un argument de vente redoutable.

## Pourquoi cela augmente la valeur

Nous l'avons répété tout au long de ces chroniques : **la valeur d'un actif est inversement proportionnelle au risque perçu.** Un historique de maintenance agit directement sur ce risque :

- Il **réduit l'incertitude** : l'acheteur sait ce qu'il achète et dans quel état.
- Il **transforme les incidents passés en points rassurants** : un problème documenté et résolu prouve la réactivité du propriétaire, au lieu de rester une bombe à retardement.
- Il **révèle une dette technique maîtrisée**, ce qui évite les mauvaises surprises post-acquisition.
- Il **démontre le sérieux de la gestion**, ce qui rejaillit sur la crédibilité de tout le dossier.

Moins de doute, plus de confiance : mécaniquement, plus de valeur.

## Un outil autant pour le vendeur que pour l'acheteur

Tenir un historique de maintenance n'est pas qu'un cadeau à l'acheteur. Pour le propriétaire, c'est un outil de pilotage : comprendre les causes des variations, ne pas répéter les erreurs, anticiper les échéances techniques. Le jour de la vente, ce document se transforme en **argument de valorisation** — la preuve tangible d'un actif géré avec professionnalisme.

## Vers un standard de marché

À mesure que le marché des actifs numériques mûrit, l'historique de maintenance a vocation à devenir un **standard**, comme le carnet d'entretien dans l'automobile ou l'immobilier. Les actifs qui en disposeront se distingueront naturellement, se vendront mieux et inspireront davantage confiance. Être parmi les premiers à l'adopter, c'est prendre une longueur d'avance.

## Les recommandations de La Garde

- **Tenez un historique dès aujourd'hui**, même rétroactivement.
- **Consignez tout** : mises à jour, audits, sauvegardes, incidents, interventions.
- **N'occultez pas les incidents** : documentés et résolus, ils rassurent plus qu'un passé mystérieux.
- **Intégrez cet historique au dossier de vente** : c'est un différenciateur et un argument de prix.
- **Faites-en une habitude de gestion**, pas seulement un document de dernière minute.

Ainsi s'achève cette deuxième série des Chroniques de La Garde. Vingt analyses, un même fil conducteur, décliné sous toutes ses formes : le **sérieux, la transparence et la confiance créent de la valeur**. Un actif dont on connaît l'histoire, dont on peut vérifier les chiffres et dont on a pris soin dans la durée n'est pas seulement plus facile à vendre — il est tout simplement plus précieux. Et c'est exactement ce que La Garde s'efforce d'encourager, chronique après chronique.""",
    },
]


async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc).isoformat()
    created, skipped = 0, 0

    for c in CHRONIQUES:
        cover = COVERS[c["num"]]
        existing = await db.citadelle_blog_posts.find_one({"slug": c["slug"]})
        if existing:
            await db.citadelle_blog_posts.update_one(
                {"slug": c["slug"]},
                {"$set": {"cover_image_url": cover, "updated_at": now}},
            )
            skipped += 1
            print(f"  ↻ Chronique n°{c['num']} déjà présente — image mise à jour")
            continue
        post = {
            "id": str(uuid.uuid4()),
            "slug": c["slug"],
            "title": c["title"],
            "excerpt": c["excerpt"],
            "content_md": c["content"],
            "category": CATEGORY,
            "author_name": AUTHOR,
            "partner_link": None,
            "cover_image_url": cover,
            "is_published": False,
            "scheduled_at": c["date"],
            "published_at": None,
            "seo_title": c["title"],
            "seo_description": c["excerpt"][:300],
            "seo_keywords": c["seo"],
            "geo_keywords": c["geo"],
            "aeo_questions": c["aeo"],
            "view_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        await db.citadelle_blog_posts.insert_one(post)
        created += 1
        print(f"  ✓ Chronique n°{c['num']} programmée le {c['date'][:10]} — {c['slug']}")

    print(f"\nLot 4 terminé — {created} chronique(s) créée(s), {skipped} mise(s) à jour.")


if __name__ == "__main__":
    asyncio.run(main())
