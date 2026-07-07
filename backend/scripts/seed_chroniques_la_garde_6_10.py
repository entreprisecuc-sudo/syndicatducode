"""
Seed — Les Chroniques de La Garde (rubrique premium) — LOT 2 : Chroniques n°6 à 10
---------------------------------------------------------------------------------
Insère 5 articles en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : réinsère uniquement les slugs absents.
Usage : python -m scripts.seed_chroniques_la_garde_6_10   (depuis /app/backend, venv actif)
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
    6: _IMG + "49136cfb24bdc9447b26353bcd87ff051c1ea07e4e35612f8918a2621d2da8c1.png",
    7: _IMG + "3ce6ba75f4b61d0a966b2d6f73339b67516cb427501f999790dab1add5bd8ddb.png",
    8: _IMG + "adc8c95f388295fe0499ed19095983d2479c29257d9fd531afaf1896267cf1ab.png",
    9: _IMG + "832a8cde693172a20abefe5f9e0a12711936538ca9319b2603ba3a46ea60eff7.png",
    10: _IMG + "61930825336475e73d5d9129fac6524746e78e84af77375a8ba29d05a8c55552.png",
}


CHRONIQUES = [
    {
        "num": 6,
        "slug": "chroniques-la-garde-6-pieges-caches-trafic-impressionnant",
        "date": "2026-08-13T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les pièges cachés derrière un trafic impressionnant",
        "excerpt": "Trafic acheté, bots, campagnes artificielles ou pics temporaires : apprendre à identifier un trafic qui ne crée pas réellement de valeur.",
        "seo": ["faux trafic site internet", "trafic Google Analytics", "audit trafic"],
        "geo": ["audit trafic France"],
        "aeo": [
            {"question": "Comment détecter un faux trafic ?", "answer": "En croisant Analytics et Search Console, en examinant les sources, la géographie, le taux de rebond et la durée des sessions. Un trafic massif mais qui ne convertit pas, sans requêtes réelles dans Search Console, est un signal d'alerte majeur."},
            {"question": "Peut-on acheter du trafic ?", "answer": "Techniquement oui, et c'est justement le problème : un trafic acheté ou généré par des bots gonfle les statistiques sans créer de valeur. Un acheteur averti regarde la qualité et la source du trafic, pas seulement son volume."},
        ],
        "content": """Un chiffre impressionne toujours : « 200 000 visiteurs par mois ». Mais La Garde le répète à chaque évaluation : le volume de trafic ne dit rien de sa **valeur**. Un trafic peut être énorme et parfaitement inutile. Cette chronique vous apprend à regarder au-delà du chiffre.

## Le volume n'est pas la valeur

La première erreur d'un acheteur débutant est de se laisser hypnotiser par le nombre de visiteurs. Or, la vraie question n'est pas « combien ? » mais « **qui, d'où, et pour quoi faire ?** ». Cent visiteurs qui achètent valent mille fois plus que cent mille visiteurs qui rebondissent immédiatement.

## Les sources de trafic : la première lecture

Le tableau des sources révèle beaucoup. Un site sain présente généralement un **mélange équilibré** : recherche organique, accès direct, référents, réseaux sociaux. Les signaux d'alerte :

- Une part écrasante de trafic « direct » inexpliquée : souvent le symptôme d'un trafic généré artificiellement.
- Un afflux soudain de « référents » douteux venus de sites sans rapport.
- Un trafic social massif impossible à relier à des publications réelles.

Un trafic dépendant à 100 % d'une seule source est aussi un risque : si cette source se tarit, l'actif s'effondre.

## La géographie et le comportement

Un site francophone dont le trafic vient massivement de pays sans lien avec son audience doit alerter. De même, un **taux de rebond anormalement élevé** couplé à des sessions de quelques secondes trahit souvent des visiteurs qui ne sont pas de vraies personnes intéressées — ou un trafic acheté de basse qualité.

À l'inverse, des sessions longues, plusieurs pages vues et un taux de retour sain indiquent une audience réelle et engagée.

## Le test décisif : croiser avec Search Console

Voici la méthode que La Garde applique systématiquement. Si Analytics affiche des centaines de milliers de visites organiques, **Search Console doit montrer des impressions et des clics cohérents**. Si les deux ne concordent pas — beaucoup de trafic « organique » dans Analytics mais peu d'impressions dans Search Console — le trafic organique déclaré n'est probablement pas réel.

Ce croisement est l'un des tests anti-fraude les plus efficaces, car il confronte une source manipulable (Analytics) à une source de vérité (Google lui-même).

## Les pics temporaires trompeurs

Attention aussi aux **pics ponctuels** : un article viral, une mention dans un média, une campagne payante intense juste avant la mise en vente. Ces pics gonflent la moyenne mais ne représentent pas le trafic récurrent. Il faut toujours regarder la **tendance de fond sur 12 mois**, pas la photo du dernier mois, souvent choisi parce qu'il flatte les chiffres.

## Le lien avec les revenus

Enfin, le meilleur juge de la qualité du trafic reste sa capacité à **générer des revenus**. Un trafic authentique et pertinent convertit : ventes, inscriptions, clics publicitaires cohérents. Un trafic gonflé, lui, laisse un écart suspect entre l'audience affichée et les revenus réels. Ce décalage est un signal à ne jamais ignorer.

## Les recommandations de La Garde

- **Ne vous fiez jamais au seul volume.** Interrogez la source, la géographie et le comportement.
- **Croisez Analytics et Search Console** : c'est le test anti-fraude le plus puissant.
- **Regardez la tendance sur 12 mois**, pas le mois le plus flatteur.
- **Méfiez-vous des pics** liés à une campagne ou à un événement isolé.
- **Confrontez trafic et revenus** : un écart inexpliqué cache souvent un trafic sans valeur.

Un trafic impressionnant peut être un mirage. La compétence d'un acheteur — et le rôle d'un audit indépendant — consiste à distinguer l'audience réelle de l'illusion statistique.""",
    },
    {
        "num": 7,
        "slug": "chroniques-la-garde-7-actifs-numeriques-valeur-2030",
        "date": "2026-08-20T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les actifs numériques qui prendront de la valeur d'ici 2030",
        "excerpt": "Analyse prospective des marchés prometteurs : agents IA, SaaS spécialisés, communautés, API, newsletters et outils d'automatisation.",
        "seo": ["investir actif numérique", "agent IA", "SaaS", "business digital"],
        "geo": ["investissement numérique France"],
        "aeo": [
            {"question": "Quels actifs numériques investir ?", "answer": "Les actifs difficiles à répliquer et porteurs de récurrence : SaaS spécialisés, communautés engagées, données propriétaires, API utiles et newsletters influentes. Ce sont eux qui devraient prendre de la valeur d'ici 2030."},
            {"question": "Quels business auront de la valeur demain ?", "answer": "Les business qui possèdent une audience directe, une donnée exclusive ou un savoir-faire difficile à copier. À l'ère de l'IA générative, ce qui ne peut pas être répliqué instantanément devient le plus précieux."},
        ],
        "content": """Prédire l'avenir est un exercice risqué, mais observer les tendances permet d'anticiper. La Garde propose ici une lecture prospective : quels actifs numériques ont, selon nous, les meilleures chances de **prendre de la valeur d'ici 2030** — et pourquoi.

## Le principe directeur : la rareté à l'ère de l'abondance

L'IA générative rend abondant tout ce qui était rare hier : le texte, l'image, le code de base. Par conséquent, la valeur se déplace vers ce qui **ne peut pas être répliqué instantanément** : une audience qui fait confiance, une donnée exclusive, une communauté vivante, un savoir-faire propriétaire. Gardez ce principe en tête : il explique la plupart des paris qui suivent.

## Les SaaS spécialisés (micro-SaaS de niche)

Les grands logiciels généralistes affrontent une concurrence féroce, y compris celle de l'IA. En revanche, les **SaaS ultra-spécialisés**, qui résolvent un problème précis pour un métier précis, disposent d'un fossé défensif : la connaissance fine du besoin, l'intégration dans les processus du client, et un coût de changement élevé. Ces actifs, souvent à revenus récurrents, devraient continuer à se valoriser.

## Les communautés engagées

Une communauté active — Discord, forum, espace membre — est l'un des actifs les plus difficiles à copier. On peut cloner une fonctionnalité, pas une culture ni des relations humaines. À l'ère où l'attention est fragmentée, une communauté fidèle représente une **audience captive et monétisable** (abonnements, événements, sponsoring) dont la valeur ira croissant.

## Les données propriétaires et les API

Les modèles d'IA ont faim de données. Un actif qui possède un **jeu de données unique** — historique, structuré, difficile à reconstituer — ou une **API** utile alimentant d'autres services, détient une position stratégique. Ces actifs, souvent invisibles du grand public, sont parmi les plus recherchés par les acquéreurs avertis.

## Les newsletters influentes

Nous y revenons car la tendance se confirme : la newsletter est un canal **direct, résilient et transmissible**. Une liste engagée dans une niche à forte valeur (finance, tech, B2B) constitue un actif dont le pouvoir de monétisation croît avec la confiance de l'audience. En 2030, posséder l'attention directe d'une audience qualifiée vaudra encore plus qu'aujourd'hui.

## Les outils d'automatisation et agents IA (avec prudence)

Les outils qui **orchestrent** l'IA pour automatiser des tâches métier ont un potentiel réel — à condition d'apporter une valeur durable au-delà du simple appel d'API. Les gagnants seront ceux qui accumulent de la donnée d'usage, s'intègrent profondément aux workflows, et bâtissent une base d'utilisateurs fidèle. Les simples façades, elles, seront balayées par la prochaine mise à jour d'un grand modèle.

## Ce qui pourrait perdre de la valeur

Par symétrie, les actifs les plus exposés sont ceux dont la valeur reposait sur la production de contenu générique facilement automatisable, ou sur un trafic SEO fragile face aux réponses directes des moteurs et des IA. Cela ne les condamne pas, mais impose de les faire évoluer vers plus de spécialisation et de relation directe.

## Les recommandations de La Garde

- **Cherchez le non-réplicable** : audience, donnée, communauté, savoir-faire.
- **Privilégiez la récurrence** : elle sécurise et valorise.
- **Méfiez-vous des façades IA** sans valeur durable derrière.
- **Investissez dans la relation directe** : la newsletter et la communauté sont des remparts contre l'incertitude algorithmique.
- **Anticipez l'évolution** des actifs de contenu vers plus de spécialisation.

Investir dans le numérique en vue de 2030, c'est parier sur ce que la machine ne sait pas répliquer : la confiance, la donnée exclusive et le lien humain.""",
    },
    {
        "num": 8,
        "slug": "chroniques-la-garde-8-questions-acheteur-avant-de-signer",
        "date": "2026-08-27T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les questions qu'un acheteur devrait toujours poser avant de signer",
        "excerpt": "Une liste commentée des questions essentielles concernant les revenus, les coûts, le SEO, la technique et les risques.",
        "seo": ["acheter un site internet", "due diligence", "audit achat site"],
        "geo": ["acheter business France"],
        "aeo": [
            {"question": "Quelles questions poser avant un achat ?", "answer": "Interrogez la nature et la stabilité des revenus, les coûts réels, l'origine du trafic, l'état technique, les dépendances et les raisons de la vente. Chaque réponse floue est un risque à chiffrer avant de signer."},
            {"question": "Comment préparer une due diligence ?", "answer": "En structurant vos questions par thèmes (revenus, coûts, trafic, technique, juridique, risques), en exigeant des preuves vérifiables pour chaque affirmation, et en croisant les données entre elles pour détecter les incohérences."},
        ],
        "content": """Acheter un actif numérique sans poser les bonnes questions, c'est acheter à l'aveugle. La Garde a compilé, au fil des dossiers, une liste de questions qui séparent l'acquisition réfléchie du pari hasardeux. Les voici, organisées comme une véritable **due diligence**.

## Sur les revenus

Le cœur de la valeur. Ne vous contentez pas d'un montant :

- **D'où viennent exactement les revenus ?** (publicité, affiliation, ventes, abonnements)
- **Sont-ils récurrents ou ponctuels ?** La récurrence vaut une prime.
- **Y a-t-il une concentration ?** Un seul annonceur, un seul produit, un seul partenaire d'affiliation ? C'est un risque majeur.
- **Quelle est la tendance sur 12 à 24 mois ?** En hausse, stable, en déclin ?
- **Les revenus sont-ils prouvés ?** Exigez captures, relevés, accès en lecture.

Toute réponse vague ici doit faire baisser le prix — ou stopper l'affaire.

## Sur les coûts

Un chiffre d'affaires n'est pas un bénéfice. Il faut reconstituer les **coûts réels** :

- Hébergement, nom de domaine, CDN.
- Licences (thèmes, plugins, logiciels).
- Sous-traitance : rédaction, développement, maintenance.
- Abonnements aux outils (e-mailing, SEO, automatisation).
- Le **temps du propriétaire** : combien d'heures par semaine ? C'est un coût caché fondamental.

## Sur le trafic

- **Quelles sont les sources ?** Recherchez l'équilibre, méfiez-vous de la mono-dépendance.
- **Le trafic est-il vérifiable dans Search Console ?**
- **Y a-t-il eu des chutes ?** Pénalités, mises à jour d'algorithme ?
- **Le trafic converti-il réellement ?**

## Sur la technique

- **Sur quelle technologie repose le site ?** Est-elle maintenue, moderne, ou obsolète ?
- **Quelle est la dette technique ?** Personnalisations fragiles, versions dépassées ?
- **Le site est-il dépendant d'un développeur unique ?**
- **Existe-t-il des sauvegardes régulières et testées ?**

## Sur le juridique et les dépendances

- **Le contenu est-il original et libre de droits ?**
- **Y a-t-il des contrats en cours** (partenariats, abonnements clients) et sont-ils transférables ?
- **Le nom de domaine et les marques** sont-ils bien la propriété du vendeur ?
- **Des dépendances critiques** existent-elles envers une plateforme tierce susceptible de changer ses règles ?

## La question qui révèle tout : pourquoi vendez-vous ?

C'est peut-être la plus importante. La réponse ne doit pas être prise pour argent comptant, mais sa **cohérence** avec le reste du dossier en dit long. « Je manque de temps » ou « je me recentre sur un autre projet » sont plausibles. Une raison floue, contradictoire ou évasive, surtout couplée à des chiffres en déclin, doit alerter.

## Les recommandations de La Garde

- **Structurez votre due diligence** par thèmes : revenus, coûts, trafic, technique, juridique.
- **Exigez une preuve pour chaque affirmation.** « Faites-moi confiance » n'est pas une donnée.
- **Croisez les informations** entre elles : les incohérences révèlent les problèmes.
- **Chiffrez chaque risque** identifié et intégrez-le au prix.
- **Écoutez la raison de la vente** et vérifiez sa cohérence avec les chiffres.

Poser ces questions n'est pas un signe de méfiance, mais de professionnalisme. Un bon vendeur y répondra volontiers — et ces réponses constitueront, le jour venu, la base d'une transaction sereine.""",
    },
    {
        "num": 9,
        "slug": "chroniques-la-garde-9-confiance-vaut-plus-que-le-trafic",
        "date": "2026-09-03T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Pourquoi la confiance vaut parfois plus que le trafic",
        "excerpt": "Comment la qualité des documents, la transparence et la préparation d'une vente influencent fortement la valeur perçue d'un actif numérique.",
        "seo": ["confiance vente site internet", "vendre site internet", "valorisation site web"],
        "geo": ["vendre site France"],
        "aeo": [
            {"question": "Comment rassurer un acheteur ?", "answer": "En offrant une transparence totale : preuves vérifiables, dossier complet, réponses honnêtes y compris sur les faiblesses, et recours à un cadre sécurisé (séquestre). Un acheteur rassuré paie mieux et plus vite."},
            {"question": "Comment augmenter la valeur d'un site ?", "answer": "Au-delà des chiffres, en réduisant l'incertitude : documentation soignée, données prouvées, historique clair et processus de vente sécurisé. Moins l'acheteur perçoit de risque, plus il valorise l'actif."},
        ],
        "content": """Deux sites peuvent afficher le même trafic et les mêmes revenus, et pourtant se vendre à des prix très différents. Pourquoi ? Parce que la valeur d'un actif numérique ne dépend pas seulement de ses chiffres, mais du **niveau de confiance** qu'il inspire. Dans cette chronique, La Garde explore ce facteur trop souvent négligé.

## La valeur est une affaire de risque perçu

Un acheteur ne paie pas seulement pour des revenus : il paie pour la **probabilité** que ces revenus continuent après la reprise. Or cette probabilité, il ne peut pas la mesurer directement — il l'estime à partir de ce que le vendeur lui montre. Plus l'incertitude est grande, plus il applique une décote. Moins il y a de doute, plus il valorise l'actif.

Autrement dit : **réduire l'incertitude, c'est augmenter le prix.** Et l'outil pour réduire l'incertitude s'appelle la confiance.

## La transparence comme multiplicateur

La transparence n'est pas une contrainte, c'est un levier de prix. Un vendeur qui ouvre spontanément ses données, qui explique clairement son modèle, qui reconnaît honnêtement les faiblesses de son actif, envoie un signal puissant : « je n'ai rien à cacher ». Ce signal vaut de l'argent.

À l'inverse, chaque zone d'ombre — un chiffre non prouvé, une question éludée, une réticence à donner accès — plante une graine de doute. Et le doute, dans l'esprit d'un acheteur, se transforme mécaniquement en baisse de prix ou en abandon.

## La qualité des documents parle pour vous

Un dossier soigné, structuré, complet, agit comme un costume bien coupé : il inspire le sérieux avant même qu'un mot soit échangé. À revenus égaux, un actif accompagné :

- de preuves de revenus claires,
- d'exports Search Console et Analytics,
- d'un inventaire des accès,
- d'un historique documenté,

se vendra plus cher qu'un actif présenté à la va-vite. Le fond compte, mais la **forme** rassure.

## La préparation, signe de maîtrise

Un vendeur préparé, qui anticipe les questions et fournit les réponses avant qu'on les pose, démontre qu'il **maîtrise son actif**. Cette maîtrise est contagieuse : elle rassure l'acheteur sur la solidité de ce qu'il s'apprête à reprendre. La préparation n'est pas un détail administratif ; c'est une démonstration de valeur.

## Le cadre sécurisé, socle de la confiance

Aussi transparent soit un vendeur, il reste une peur fondamentale chez l'acheteur : payer et ne rien recevoir. C'est là que le **séquestre** et un processus encadré changent tout. Quand les fonds sont protégés jusqu'à la transmission effective, l'acheteur peut avancer sereinement — et cette sérénité se traduit par une meilleure offre, plus rapide. La structure de la transaction est, elle aussi, un facteur de prix.

## Les recommandations de La Garde

- **Pensez « risque perçu ».** Chaque doute levé se transforme en valeur gagnée.
- **Faites de la transparence une stratégie**, pas une concession.
- **Soignez vos documents** : la forme rassure autant que le fond.
- **Préparez-vous** : la maîtrise démontrée rassure l'acheteur.
- **Vendez dans un cadre sécurisé** : le séquestre transforme la confiance en prix.

Le trafic attire, mais c'est la confiance qui conclut. Un actif digne de confiance se vend mieux, plus vite, et dans de meilleures conditions. C'est toute la philosophie de La Garde : faire de la confiance un actif à part entière.""",
    },
    {
        "num": 10,
        "slug": "chroniques-la-garde-10-carnet-entretien-actif-numerique",
        "date": "2026-09-10T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Le carnet d'entretien d'un actif numérique existe-t-il ?",
        "excerpt": "Présentation de l'intérêt d'un historique complet (migrations, audits, évolutions, incidents, transmissions) et de la manière dont il peut rassurer un futur acquéreur.",
        "seo": ["historique site internet", "transmission actif numérique", "audit site web", "maintenance site"],
        "geo": ["actif numérique France"],
        "aeo": [
            {"question": "Comment conserver l'historique d'un site ?", "answer": "En tenant un carnet d'entretien : un document vivant qui consigne les migrations, mises à jour majeures, audits, incidents, changements de propriétaire et évolutions de revenus, avec dates et preuves. C'est la mémoire de l'actif."},
            {"question": "Quels documents remettre lors d'une vente ?", "answer": "Le dossier de transmission (accès, sauvegardes), les preuves de revenus et de trafic, et idéalement un carnet d'entretien retraçant l'histoire technique et économique de l'actif. Cet historique rassure et valorise."},
        ],
        "content": """Quand on achète une voiture d'occasion, on réclame son carnet d'entretien. Il raconte l'histoire du véhicule, ses révisions, ses réparations, et rassure sur son état. La Garde pose ici une question simple : **pourquoi un actif numérique n'aurait-il pas le sien ?** Cette dernière chronique de notre première série défend une idée : le carnet d'entretien numérique devrait devenir un standard.

## Un actif numérique a une histoire

Un site, un SaaS, une application ne naissent pas parfaits et ne restent pas figés. Ils **vivent** : migrations d'hébergeur, refontes, mises à jour majeures, pics de trafic, incidents de sécurité, changements de stratégie de monétisation, éventuels changements de propriétaire. Cette histoire influence directement l'état actuel de l'actif — et sa valeur.

Pourtant, cette histoire se perd presque toujours. Le vendeur la garde en tête, partiellement, et elle disparaît le jour de la vente. L'acheteur hérite d'une boîte noire.

## Ce que contiendrait un carnet d'entretien

Un carnet d'entretien numérique consignerait, avec dates et preuves, les événements marquants de la vie de l'actif :

- **Migrations** : changements d'hébergeur, de CMS, de nom de domaine.
- **Évolutions techniques** : refontes, mises à jour majeures, changements d'architecture.
- **Audits** : SEO, sécurité, performance, avec leurs conclusions.
- **Incidents** : piratages, pannes, pénalités Google — et comment ils ont été résolus.
- **Évolution des revenus et du trafic** : les grandes étapes, les causes des variations.
- **Transmissions** : les précédents changements de propriétaire.

Ce document deviendrait la **mémoire vivante** de l'actif.

## Pourquoi cela rassure un acheteur

Un carnet d'entretien répond, avant même les questions, à l'angoisse fondamentale de l'acheteur : « qu'est-ce que j'ignore ? ». Un actif dont l'histoire est documentée n'a pas de squelettes dans le placard. Une pénalité passée mais expliquée et résolue devient un point rassurant plutôt qu'une bombe à retardement. Un incident de sécurité documenté et corrigé prouve la réactivité du propriétaire.

En rendant le passé lisible, le carnet transforme l'incertitude en information — et, comme nous l'avons vu dans la chronique précédente, l'information réduit le risque perçu, donc augmente la valeur.

## Un atout pour le vendeur aussi

Tenir un carnet d'entretien n'est pas qu'un cadeau à l'acheteur : c'est un outil de gestion pour le propriétaire. Il permet de garder la trace des décisions, de comprendre les causes des variations, et de ne pas répéter d'anciennes erreurs. Le jour de la vente, il devient un **argument de valorisation** puissant, preuve d'un actif géré avec sérieux.

## Vers une norme de marché

La Garde en est convaincue : à mesure que le marché des actifs numériques se professionnalise, l'historique documenté deviendra un standard, comme il l'est dans l'immobilier ou l'automobile. Les actifs qui en disposeront se distingueront, se vendront mieux, et inspireront naturellement davantage confiance.

## Les recommandations de La Garde

- **Commencez votre carnet dès aujourd'hui**, même rétroactivement : listez ce dont vous vous souvenez.
- **Consignez chaque événement majeur** avec sa date et, si possible, une preuve.
- **N'occultez pas les incidents** : un problème documenté et résolu rassure plus qu'un passé mystérieux.
- **Intégrez le carnet au dossier de vente** : c'est un différenciateur et un argument de prix.
- **Faites-en une habitude de gestion**, pas seulement un document de vente.

Le carnet d'entretien d'un actif numérique n'existe pas encore comme norme. Mais rien ne vous empêche d'être parmi les premiers à l'adopter. C'est ainsi que se construit la réputation d'un actif sérieux — et c'est exactement ce que La Garde souhaite encourager sur le marché.

---

*Ainsi s'achève la première série des Chroniques de La Garde. Dix analyses, un fil conducteur : le sérieux, la transparence et la confiance créent de la valeur. La série continue — restez à l'écoute, chaque jeudi.*""",
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
            # Idempotent : met à jour l'image unique si l'article existe déjà
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

    print(f"\nLot 2 terminé — {created} chronique(s) créée(s), {skipped} mise(s) à jour.")


if __name__ == "__main__":
    asyncio.run(main())
