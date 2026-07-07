"""
Seed — Les Chroniques de La Garde (rubrique premium) — LOT 1 : Chroniques n°1 à 5
---------------------------------------------------------------------------------
Insère 5 articles en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Le planificateur (publish_scheduled_posts) les publiera automatiquement à l'heure dite.
Idempotent : réinsère uniquement les slugs absents.
Usage : python -m scripts.seed_chroniques_la_garde_1_5   (depuis /app/backend, venv actif)
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
COVER = "https://static.prod-images.emergentagent.com/jobs/bb5bc88e-9c1e-46ed-99db-f8c3b00e681b/images/a3715841dcdcf63556e7291c96bfed68897dde1bcdc4d9117c9150c2fe3c386e.png"


CHRONIQUES = [
    {
        "num": 1,
        "slug": "chroniques-la-garde-1-pourquoi-certains-sites-restent-invendus",
        "date": "2026-07-09T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Pourquoi certains sites restent invendus pendant des années",
        "excerpt": "Analyse des erreurs les plus fréquentes qui empêchent la vente d'un site internet : prix irréaliste, manque de transparence, absence de données fiables, mauvaise préparation ou faible attractivité.",
        "seo": ["vendre un site internet", "site invendu", "vendre son site web", "prix de vente site internet", "business digital"],
        "geo": ["vendre un site internet France", "vendre un business digital France"],
        "aeo": [
            {"question": "Pourquoi mon site ne se vend pas ?", "answer": "Le plus souvent parce que le prix demandé ne correspond pas aux revenus réels, parce que les données (trafic, chiffre d'affaires) ne sont pas vérifiables, ou parce que le dossier de vente est incomplet. Un acheteur sérieux fuit dès qu'il perçoit un manque de transparence."},
            {"question": "Pourquoi un site reste-t-il invendu ?", "answer": "Un site reste invendu quand son prix, sa preuve de revenus et sa présentation ne sont pas alignés. Corrigez ces trois points et vous passez d'une annonce ignorée à un actif recherché."},
            {"question": "Comment vendre un site plus rapidement ?", "answer": "Fixez un prix appuyé sur un multiple de bénéfice réaliste, réunissez des preuves vérifiables (Search Console, Analytics, relevés de revenus) et préparez un dossier clair avant même de publier l'annonce."},
        ],
        "content": """Chaque semaine, La Garde observe le marché des actifs numériques : des sites qui trouvent preneur en quelques jours, et d'autres qui stagnent des mois, parfois des années. La différence tient rarement au hasard. Elle tient à des erreurs précises, répétées, que nous voyons revenir dossier après dossier.

Cette première chronique ouvre notre rubrique par le sujet qui fâche : **pourquoi certains sites ne se vendent jamais**, et surtout, comment éviter d'en faire partie.

## Le prix irréaliste : l'erreur numéro un

La quasi-totalité des sites invendus partagent un point commun : un prix déconnecté de la réalité économique. Un actif numérique se valorise sur ce qu'il **rapporte**, pas sur le temps ou l'affection que son propriétaire y a investis.

Sur le marché, un site de contenu se négocie généralement entre 24 et 40 fois son bénéfice net mensuel ; un SaaS avec revenus récurrents peut viser davantage. Quand un vendeur demande 50 000 € pour un site qui génère 200 € par mois, il ne vend pas un actif : il vend un rêve. Et les acheteurs sérieux, eux, achètent des chiffres.

> La valeur perçue s'effondre dès que l'acheteur sent que le prix a été fixé « au feeling ».

## L'absence de données vérifiables

Le deuxième tueur de vente est l'opacité. « Faites-moi confiance, le site marche bien » n'a aucune valeur pour un acheteur qui s'apprête à engager plusieurs milliers d'euros.

Un dossier crédible repose sur des preuves :

- **Google Search Console** : impressions, clics, requêtes, évolution sur 12 mois.
- **Analytics** (GA4 ou équivalent) : sources de trafic, taux de rebond, pages populaires.
- **Preuves de revenus** : captures de tableaux de bord (AdSense, Stripe, affiliation), relevés, factures.
- **Coûts réels** : hébergement, licences, sous-traitance, abonnements.

Sans ces éléments, votre site n'est pas invendable par manque de qualité : il est invendable par manque de confiance.

## La mauvaise préparation du dossier

Nous voyons régulièrement des sites au vrai potentiel dont la vente échoue simplement parce que le vendeur n'a rien préparé. Pas de descriptif clair, pas d'inventaire des accès, pas de réponse aux questions basiques. L'acheteur doit alors tout demander, tout vérifier, tout reconstituer. La friction s'accumule, et il abandonne.

Un dossier de vente professionnel répond aux questions **avant** qu'elles ne soient posées : quel est le modèle de revenus ? Quelle part est automatisée ? Quelles dépendances techniques ? Quels risques connus ?

## La faible attractivité intrinsèque

Certains actifs, enfin, souffrent de faiblesses structurelles : dépendance à une seule source de trafic, technologie obsolète, contenu non maintenu, ou niche sans avenir. Ces sites ne sont pas condamnés, mais ils exigent un **discours de vente honnête** : reconnaître les faiblesses, chiffrer le travail de reprise, et ajuster le prix en conséquence.

Tenter de masquer une faiblesse est la pire stratégie : un acheteur sérieux la découvrira pendant sa due diligence, et il partira avec la conviction que vous cachiez peut-être autre chose.

## Le facteur temps : un cercle vicieux

Une annonce qui traîne devient suspecte. Les acheteurs se demandent « pourquoi personne n'en a voulu ? » et négocient à la baisse, ce qui décourage le vendeur, qui laisse l'annonce vieillir encore. Pour briser ce cercle, mieux vaut **retirer une annonce qui ne fonctionne pas, la retravailler en profondeur, puis la republier** comme une offre neuve et solide.

## Les recommandations de La Garde

1. **Fixez un prix défendable.** Appuyez-vous sur un multiple de bénéfice réaliste et soyez prêt à le justifier chiffre à l'appui.
2. **Rendez tout vérifiable.** Search Console, Analytics, preuves de revenus et de coûts : la transparence est votre meilleur argument de vente.
3. **Préparez le dossier avant de publier.** Anticipez les questions ; un acheteur rassuré est un acheteur qui avance.
4. **Assumez les faiblesses.** L'honnêteté crée la confiance, et la confiance accélère la vente.
5. **Ne laissez pas une annonce pourrir.** Mieux vaut retravailler et republier que subir la décote du temps.

Un site bien préparé ne reste pas invendu : il attend simplement le bon acheteur, qui reconnaîtra en un coup d'œil le sérieux du dossier. C'est précisément le rôle de La Garde : transformer un actif « à vendre » en un actif **prêt à être transmis**.""",
    },
    {
        "num": 2,
        "slug": "chroniques-la-garde-2-dix-erreurs-transmission-actifs-numeriques",
        "date": "2026-07-16T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les 10 erreurs observées lors des transmissions d'actifs numériques",
        "excerpt": "Retour d'expérience sur les oublis les plus fréquents lors d'une transmission : mots de passe, DNS, licences, comptes Google, API, hébergement et sauvegardes.",
        "seo": ["transmission site internet", "transfert site web", "migration site", "transmission business digital"],
        "geo": ["transfert site internet France"],
        "aeo": [
            {"question": "Comment transmettre un site internet ?", "answer": "En listant méthodiquement tous les accès (hébergement, DNS, CMS, e-mails, API, licences), en les transférant dans le bon ordre, et en validant chaque étape avec l'acheteur avant de considérer la transmission comme terminée."},
            {"question": "Quels accès faut-il transmettre ?", "answer": "Registrar du nom de domaine, hébergement, base de données, comptes CMS/admin, e-mails professionnels, comptes Google (Analytics, Search Console), clés API, licences de thèmes et plugins, et accès aux plateformes de paiement et d'affiliation."},
        ],
        "content": """La vente d'un actif numérique ne s'achève pas au paiement : elle s'achève à la **transmission complète**. Et c'est souvent là que tout se joue. La Garde accompagne régulièrement des transmissions, et nous constatons que les mêmes oublis reviennent. En voici dix, avec la manière de les éviter.

## 1. Le nom de domaine oublié chez le registrar

L'erreur classique : transférer le site mais laisser le nom de domaine sur le compte du vendeur. Sans le domaine, l'acheteur ne possède rien de durable. Le transfert doit passer par le **registrar** (code d'autorisation, déverrouillage), pas seulement par l'hébergeur.

## 2. Les enregistrements DNS non documentés

Un domaine, ce n'est pas qu'un A record. Il y a les MX (e-mails), les TXT (SPF, DKIM, vérifications), les CNAME (sous-domaines, services tiers). Oublier de documenter la zone DNS, c'est risquer de casser les e-mails ou un service critique le jour du basculement.

## 3. Les comptes Google non transférés proprement

Analytics et Search Console sont des mines d'or de données historiques. Trop souvent, le vendeur ajoute l'acheteur en « utilisateur » puis se retire, ce qui peut faire perdre la propriété. La bonne pratique : transférer la **propriété** de la propriété Analytics et valider un nouvel accès Search Console avant toute suppression.

## 4. Les licences de thèmes et plugins

Un thème premium ou un plugin sous licence est souvent lié au compte du vendeur. Après la vente, les mises à jour cessent, exposant le site à des failles. Il faut soit transférer la licence, soit prévoir son rachat au nom de l'acheteur.

## 5. Les clés API et intégrations tierces

Passerelles de paiement, services d'e-mailing, CDN, outils d'automatisation : chaque intégration repose sur une clé API liée à un compte. Une clé oubliée, et une fonctionnalité tombe en panne quelques jours après la reprise, sans que l'acheteur comprenne pourquoi.

## 6. Les e-mails professionnels

Les adresses `@domaine` servent souvent aux réinitialisations de mot de passe d'autres services. Les négliger peut littéralement enfermer l'acheteur dehors. La messagerie doit être transmise ou reconstruite avant la bascule.

## 7. L'absence de sauvegarde complète

Transmettre sans fournir une **sauvegarde intégrale** (fichiers + base de données) est une faute. En cas de problème pendant la migration, sans point de restauration, on répare à l'aveugle. Une archive complète et testée est le filet de sécurité indispensable.

## 8. La base de données mal exportée

Un export partiel, un mauvais encodage (accents cassés), des tables manquantes : les erreurs de base de données sont sournoises car elles n'apparaissent pas toujours immédiatement. Il faut exporter proprement et **vérifier l'import** sur l'environnement de destination.

## 9. Les identifiants de plateformes de revenus

AdSense, réseaux d'affiliation, Stripe, boutiques d'applications : les comptes qui génèrent les revenus doivent être transférés ou recréés, avec la documentation des seuils de paiement et des cycles de versement. Sinon, l'acheteur récupère le trafic mais pas les revenus.

## 10. L'absence de période d'accompagnement

Même une transmission parfaite laisse des questions. Prévoir une **période de support** (souvent 15 à 30 jours) après la bascule évite bien des litiges et rassure l'acheteur, qui sait qu'il ne sera pas abandonné au premier imprévu.

## Les recommandations de La Garde

- **Établissez un inventaire écrit** de tous les accès avant même de publier l'annonce.
- **Transférez dans le bon ordre** : sauvegarde → hébergement → base de données → domaine/DNS → comptes tiers → validation.
- **Validez chaque étape avec l'acheteur** : une transmission n'est terminée que lorsque l'acheteur confirme que tout fonctionne.
- **Documentez tout** dans un dossier de transmission remis à la fin.
- **Prévoyez un accompagnement** post-vente : c'est le sceau d'une transmission professionnelle.

C'est exactement la logique du dossier de transmission de La Garde : ne rien laisser au hasard, pour que le jour de la bascule soit une formalité, et non une source d'angoisse.""",
    },
    {
        "num": 3,
        "slug": "chroniques-la-garde-3-reconnaitre-un-acheteur-serieux",
        "date": "2026-07-23T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Comment reconnaître un acheteur réellement sérieux ?",
        "excerpt": "Les critères permettant de distinguer un acquéreur motivé d'un simple curieux et les bonnes pratiques pour protéger les informations sensibles.",
        "seo": ["acheteur site internet", "vendre business digital", "vente site internet"],
        "geo": ["acheter site internet France"],
        "aeo": [
            {"question": "Comment reconnaître un acheteur sérieux ?", "answer": "Un acheteur sérieux pose des questions précises sur les revenus et les coûts, respecte un processus, ne réclame pas tous les accès dès le premier message, et est capable de justifier sa capacité financière. Le curieux, lui, veut « tout voir » sans rien engager."},
            {"question": "Quand partager les statistiques d'un site ?", "answer": "Partagez d'abord des données agrégées et anonymisées (tendances, ordres de grandeur). Les accès détaillés (Search Console, Analytics en lecture) se donnent après une marque d'engagement réelle et, idéalement, dans un cadre sécurisé."},
        ],
        "content": """Vendre un actif numérique, c'est ouvrir sa maison à des inconnus. La plupart repartiront sans acheter. Certains ne venaient que pour regarder — voire pour collecter des informations sur un concurrent. Savoir distinguer l'acheteur réel du simple curieux est une compétence que La Garde considère comme essentielle, autant pour gagner du temps que pour **protéger vos données sensibles**.

## Le curieux se trahit vite

Le curieux a un vocabulaire reconnaissable. Il demande « combien ça rapporte ? » sans jamais parler de son projet. Il veut « voir les accès pour se faire une idée » dès le premier message. Il pose des questions vagues, s'intéresse peu au modèle économique, et disparaît dès qu'on lui demande un minimum d'engagement.

Le curieux n'est pas malhonnête — il est simplement en exploration. Le problème, c'est le temps qu'il consomme et le risque qu'il fait courir si vous ouvrez trop tôt vos données.

## L'acheteur sérieux suit un raisonnement

À l'inverse, l'acquéreur motivé pense comme un investisseur. Il cherche à comprendre la **durabilité** des revenus, la **concentration** des risques, le **temps de gestion** hebdomadaire. Ses questions sont précises :

- Quelle part du trafic vient du SEO, du direct, des réseaux ?
- Les revenus dépendent-ils d'un seul client, d'un seul partenaire d'affiliation ?
- Y a-t-il eu des pénalités Google, des incidents techniques ?
- Combien d'heures par semaine faut-il pour maintenir l'actif ?

Ces questions révèlent quelqu'un qui projette une **reprise réelle**, pas une simple curiosité.

## Les signaux de crédibilité financière

Un acheteur sérieux ne se vexe pas qu'on aborde sa capacité à payer. Au contraire, il comprend que c'est une étape normale. Une preuve de fonds, une expérience d'acquisitions passées, une entreprise identifiable : autant de signaux qui séparent l'intention de l'illusion.

À l'inverse, méfiez-vous de l'enthousiasme excessif non étayé — celui qui « veut acheter tout de suite » mais reste flou sur le paiement, et qui pousse à contourner les étapes de sécurité.

## Protéger l'information : la règle des paliers

La bonne pratique consiste à **dévoiler l'information par paliers**, en fonction de l'engagement démontré :

1. **Palier public** : description, catégorie, ordres de grandeur, tendances. Aucun accès.
2. **Palier intéressé** : données agrégées et anonymisées, captures partielles, réponses détaillées aux questions.
3. **Palier engagé** : accès en lecture (Search Console, Analytics) après une marque concrète d'engagement, idéalement dans un cadre sécurisé.
4. **Palier acheteur** : accès complets uniquement une fois la transaction sécurisée.

Ne jamais donner d'identifiants complets avant la sécurisation du paiement : c'est une règle absolue.

## Le rôle du tiers de confiance

C'est ici que la structure d'une transaction encadrée prend tout son sens. Lorsqu'un séquestre protège les fonds et qu'un processus structure les échanges, l'acheteur sérieux est rassuré (son argent est protégé) et le curieux est filtré (il doit s'engager pour avancer). Le cadre lui-même fait le tri.

## Les recommandations de La Garde

- **Écoutez les questions.** Elles trahissent l'investisseur autant que le curieux.
- **Ne dévoilez jamais tout d'un coup.** Appliquez la règle des paliers.
- **N'ayez pas peur d'aborder l'argent.** Un acheteur sérieux le comprend ; un curieux se dérobe.
- **Gardez les accès complets pour la fin**, une fois la transaction sécurisée.
- **Appuyez-vous sur un cadre de confiance** : le séquestre et un processus clair filtrent naturellement les intentions.

Reconnaître un acheteur sérieux, ce n'est pas de la méfiance : c'est du professionnalisme. Et c'est ce professionnalisme qui protège à la fois votre temps, vos données et la valeur de votre actif.""",
    },
    {
        "num": 4,
        "slug": "chroniques-la-garde-4-tendances-marche-actifs-numeriques",
        "date": "2026-07-30T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Les nouvelles tendances du marché des actifs numériques",
        "excerpt": "Panorama des catégories les plus recherchées : SaaS, IA, newsletters, Shopify, applications web et actifs générant des revenus récurrents.",
        "seo": ["marché actifs numériques", "acheter SaaS", "business digital"],
        "geo": ["marché numérique France"],
        "aeo": [
            {"question": "Quels actifs numériques acheter ?", "answer": "Les actifs à revenus récurrents et prévisibles ont la cote : SaaS, newsletters payantes, communautés et abonnements. Les outils s'appuyant sur l'IA et les micro-SaaS spécialisés attirent particulièrement les acheteurs en 2026."},
            {"question": "Quelles sont les tendances du marché ?", "answer": "Trois tendances dominent : la prime aux revenus récurrents, l'essor des actifs liés à l'IA, et une exigence de transparence accrue de la part des acheteurs, qui valorisent désormais autant la qualité des preuves que les chiffres eux-mêmes."},
        ],
        "content": """Le marché des actifs numériques n'est pas figé. Ce qui se vendait cher hier peut stagner aujourd'hui, et des catégories jugées marginales deviennent soudain très recherchées. Dans cette chronique, La Garde dresse le panorama des dynamiques que nous observons en ce moment sur le marché francophone.

## La prime absolue aux revenus récurrents

S'il y a une constante qui se renforce, c'est la valorisation supérieure des **revenus récurrents et prévisibles**. Un SaaS à abonnement, une newsletter payante, une communauté sous adhésion : ces modèles se vendent à des multiples plus élevés que les revenus ponctuels ou purement publicitaires.

La raison est simple : un revenu récurrent est plus facile à projeter, moins volatil, et donne à l'acheteur une visibilité que la publicité — soumise aux algorithmes et aux saisons — n'offre pas.

## L'IA : la catégorie qui redistribue les cartes

Les actifs bâtis autour de l'intelligence artificielle attirent une attention considérable : micro-SaaS d'automatisation, agents spécialisés, outils de génération ou d'analyse. Ces actifs séduisent par leur potentiel de croissance, mais La Garde invite à la prudence.

Un « wrapper » qui ne fait qu'appeler une API tierce sans valeur ajoutée durable présente un risque : sa dépendance à un fournisseur unique et l'évolution rapide du secteur. La vraie valeur réside dans la **donnée propriétaire**, la base d'utilisateurs fidèle, ou un savoir-faire difficile à répliquer — pas dans la simple façade IA.

## Le retour en force des newsletters

Longtemps sous-estimée, la newsletter est redevenue un actif convoité. Elle possède un atout rare : une **relation directe** avec l'audience, indépendante des algorithmes des réseaux sociaux et des moteurs de recherche. Une liste engagée, avec un bon taux d'ouverture et un modèle de monétisation clair (sponsoring, abonnement), constitue un actif solide et transmissible.

## E-commerce et Shopify : la qualité prime sur le volume

Les boutiques Shopify et le e-commerce restent très demandés, mais le marché s'est assaini. Les acheteurs ne cherchent plus le simple « gros chiffre d'affaires » : ils examinent les **marges réelles**, la dépendance à la publicité payante, la solidité des fournisseurs et la part de clients récurrents. Une boutique avec une marque forte et une clientèle fidèle vaut bien plus qu'un catalogue générique dopé aux dépenses publicitaires.

## Applications web et outils de niche

Les applications web et micro-outils qui résolvent un problème précis pour une audience identifiée connaissent un vrai engouement. Leur force : des coûts de maintenance maîtrisés, une proposition de valeur claire, et souvent un modèle d'abonnement. Le micro-SaaS de niche est devenu l'un des actifs préférés des repreneurs individuels et des petits fonds.

## La tendance de fond : l'exigence de preuve

Au-delà des catégories, la vraie transformation du marché est culturelle. Les acheteurs sont plus **matures et plus exigeants**. Ils ne se contentent plus d'un beau discours : ils veulent des données vérifiables, un historique propre, une transparence totale. Dans ce contexte, la qualité de la préparation d'une vente devient un facteur de prix à part entière.

## Les recommandations de La Garde

- **Valorisez le récurrent.** Si vous pouvez transformer un revenu ponctuel en abonnement, vous augmentez la valeur de votre actif.
- **Regardez sous le capot de l'IA.** Cherchez la valeur durable (données, communauté, savoir-faire), pas la mode.
- **Cultivez la relation directe.** Une liste e-mail engagée est un trésor transmissible.
- **Misez sur la marque et la fidélité** plutôt que sur le volume dopé à la publicité.
- **Préparez des preuves irréprochables.** Sur un marché mûr, la transparence est un multiplicateur de valeur.

Le marché récompense de plus en plus les actifs sains, lisibles et bien documentés. C'est une excellente nouvelle : cela signifie que le sérieux paie, littéralement.""",
    },
    {
        "num": 5,
        "slug": "chroniques-la-garde-5-google-search-console-avant-achat",
        "date": "2026-08-06T07:00:00+00:00",
        "title": "Les Chroniques de La Garde : Ce que révèle réellement Google Search Console avant un achat",
        "excerpt": "Pourquoi Search Console est souvent plus importante que Google Analytics pour évaluer la santé d'un site avant de l'acheter.",
        "seo": ["Google Search Console", "audit SEO", "acheter site internet"],
        "geo": ["audit SEO France"],
        "aeo": [
            {"question": "Pourquoi demander Search Console ?", "answer": "Parce que Search Console montre des données que Google considère comme vraies : impressions, clics, requêtes réelles et problèmes d'indexation. Contrairement à d'autres outils, elle est difficile à manipuler et révèle la santé SEO profonde d'un site."},
            {"question": "Que vérifier dans Search Console ?", "answer": "La courbe d'impressions et de clics sur 16 mois, les requêtes qui apportent réellement du trafic, les pages les plus performantes, les éventuelles chutes brutales (pénalités), et l'état de l'indexation et de l'expérience sur mobile."},
        ],
        "content": """Quand un acheteur nous demande « quel est le document le plus important à réclamer avant d'acheter un site ? », la réponse de La Garde surprend souvent : ce n'est pas Google Analytics, c'est **Google Search Console**. Voici pourquoi cet outil, gratuit et sous-exploité, en dit parfois plus sur la santé réelle d'un site que n'importe quel tableau de revenus.

## Analytics mesure, Search Console témoigne

Google Analytics mesure ce qui se passe **sur** le site : visites, comportement, conversions. C'est précieux, mais c'est aussi manipulable : le code de suivi peut être modifié, filtré, ou alimenté par un trafic artificiel.

Search Console, elle, montre ce que **Google lui-même** observe : combien de fois vos pages apparaissent dans les résultats, sur quelles requêtes, avec quel taux de clic. Ce sont des données côté moteur, bien plus difficiles à falsifier. Pour évaluer la solidité SEO d'un actif, c'est la source de vérité.

## La courbe d'impressions : le pouls du site

La première chose à regarder est la **courbe d'impressions sur 16 mois**. Elle raconte une histoire :

- Une croissance régulière ? Le site gagne en autorité et en visibilité.
- Un plateau ? Il est stable, sans dynamique particulière.
- Une **chute brutale** ? Alerte. Elle peut signaler une mise à jour d'algorithme mal encaissée, une pénalité, ou un problème technique. Il faut en comprendre la cause avant d'acheter.

Une baisse récente non expliquée est l'un des signaux les plus importants pour renégocier — ou renoncer.

## Les requêtes : d'où vient vraiment le trafic

Search Console révèle les **requêtes réelles** qui amènent des visiteurs. C'est capital pour juger la qualité du trafic :

- Le site se positionne-t-il sur des requêtes en lien avec son modèle de revenus, ou sur des termes annexes sans valeur commerciale ?
- Le trafic dépend-il d'**une seule requête** ou d'un mot-clé de marque ? C'est un risque de concentration majeur.
- Les positions sont-elles stables, ou le site vit-il sur des pics ponctuels ?

Un trafic diversifié, réparti sur de nombreuses requêtes pertinentes, vaut bien plus qu'un trafic concentré sur un seul terme fragile.

## Les pages performantes et l'indexation

Search Console indique quelles **pages** génèrent le plus d'impressions et de clics. On vérifie ainsi que la valeur ne repose pas sur une unique page (risque énorme si elle décroche), et que les pages monétisées sont bien celles qui performent.

L'onglet d'indexation, enfin, révèle la santé technique : pages exclues, erreurs d'exploration, problèmes de couverture. Un site avec de nombreuses erreurs d'indexation cache souvent une dette technique que l'acheteur héritera.

## Le croisement avec les revenus

La vraie puissance de Search Console apparaît quand on **croise** ses données avec les revenus déclarés. Si un vendeur annonce des revenus en hausse alors que les impressions et clics s'effondrent, quelque chose ne colle pas. À l'inverse, une visibilité solide et croissante conforte la crédibilité des chiffres annoncés.

## Les recommandations de La Garde

- **Exigez un accès Search Console** (au moins en lecture) ou des exports complets sur 16 mois.
- **Analysez la courbe d'impressions** en premier : elle révèle les tendances et les accidents.
- **Étudiez la diversité des requêtes** : fuyez la dépendance à un seul mot-clé.
- **Vérifiez l'indexation** : elle trahit la dette technique cachée.
- **Croisez toujours** les données SEO avec les revenus annoncés : la cohérence est le meilleur test de sincérité.

Search Console ne ment pas. Savoir la lire, c'est se donner le pouvoir d'acheter en connaissance de cause — et d'éviter les mauvaises surprises que même un beau tableau de revenus peut dissimuler.""",
    },
]


async def main():
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    now = datetime.now(timezone.utc).isoformat()
    created, skipped = 0, 0

    for c in CHRONIQUES:
        if await db.citadelle_blog_posts.find_one({"slug": c["slug"]}):
            skipped += 1
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
            "cover_image_url": COVER,
            "is_published": False,          # publication programmée
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

    print(f"\nLot 1 terminé — {created} chronique(s) créée(s), {skipped} ignorée(s) (déjà présentes).")


if __name__ == "__main__":
    asyncio.run(main())
