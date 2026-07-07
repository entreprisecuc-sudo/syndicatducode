"""
Seed — Le Guide de La Citadelle (rubrique premium) — LOT 5 : Guides n°21 à 25
---------------------------------------------------------------------------------
Insère 5 guides en PUBLICATION PROGRAMMÉE (is_published=False + scheduled_at).
Idempotent : met à jour l'image des guides déjà présents, insère les absents.
Usage : python -m scripts.seed_guides_la_citadelle_21_25   (depuis /app/backend, venv actif)
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
    21: _IMG + "c0ab51e3e66f90fc6576844b6b8df4cf29f9c313952f66f2df480b9abc11dd30.png",
    22: _IMG + "628dc3ed07645445e971982361673957c76f903d41d9ed5ac615ee79c94bae30.png",
    23: _IMG + "faf42c3df97885f97a22fa997be08285c4a6731f3490185f7d6b79c2c10c12da.png",
    24: _IMG + "51102e0d74b83fcf9d761de75f78ef2f222c7c7b62fd7a5f3ab1c33422c6ba16.png",
    25: _IMG + "d47d162aeebc8c5c069f3e2bb4cf4c385defc450139dd14345103b5b5bd922d2.png",
}


GUIDES = [
    {
        "num": 21,
        "slug": "guide-la-citadelle-21-reussir-une-due-diligence-complete-avant-dinvestir",
        "date": "2026-11-28T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Réussir une due diligence complète avant d'investir",
        "excerpt": "Le guide complet de la due diligence technique, financière, juridique et commerciale avant l'achat d'un actif numérique.",
        "seo": ["due diligence", "audit achat", "acheter business", "vérification avant achat"],
        "geo": ["due diligence France"],
        "aeo": [
            {"question": "Qu'est-ce qu'une due diligence ?", "answer": "La due diligence est l'ensemble des vérifications menées par un acheteur avant d'acquérir un actif : audit financier, technique, juridique et commercial. Elle vise à confirmer que l'actif correspond à ce qui est annoncé, à identifier les risques et à les chiffrer avant de signer."},
            {"question": "Que vérifier avant un achat ?", "answer": "Avant un achat, vérifiez les revenus et leurs preuves, les coûts réels, le trafic et sa vérifiabilité, l'état technique et la dette, les dépendances, la propriété et le juridique, la conformité RGPD et la raison de la vente. Croisez systématiquement les sources pour détecter les incohérences."},
        ],
        "content": """La due diligence est l'étape qui sépare l'investissement réfléchi du pari hasardeux. C'est l'audit approfondi mené avant de signer, pour confirmer que l'actif vaut ce qu'il prétend valoir. Ce guide de La Citadelle structure une due diligence complète, en quatre volets.

## Le principe : vérifier avant de faire confiance

Une due diligence ne consiste pas à se méfier de tout, mais à **tout vérifier**. Son objectif : confirmer les affirmations du vendeur, identifier les risques cachés, et **chiffrer** chacun d'eux avant de fixer le prix définitif. Rien ne doit reposer sur la seule parole.

> La règle d'or : aucune affirmation sans preuve, aucune preuve sans recoupement.

## Volet 1 — La due diligence financière

- **Revenus** : origine, récurrence, concentration, tendance sur 12 à 24 mois, prouvés par des relevés natifs.
- **Coûts réels** : hébergement, licences, outils, sous-traitance, et **temps de gestion**.
- **Bénéfice net** reconstitué, base de la valorisation.
- **Cohérence** : les chiffres se recoupent-ils entre l'annonce, les e-mails et les tableaux de bord ?

## Volet 2 — La due diligence technique

- **Technologie** et architecture : moderne, maintenue, ou obsolète ?
- **Dette technique** : personnalisations fragiles, versions dépassées.
- **Sécurité** : comptes, mises à jour, sauvegardes, incidents passés.
- **Performances** : hébergement, Core Web Vitals.
- **Dépendances** : fournisseurs, API, plateformes tierces.

## Volet 3 — La due diligence juridique

- **Propriété** du domaine, des marques, du code et des contenus.
- **Licences** des composants tiers : transférables ?
- **Contrats** en cours (clients, partenaires) et leur transférabilité.
- **Conformité RGPD** pour les données personnelles.
- **Litiges** éventuels, passés ou en cours.

## Volet 4 — La due diligence commerciale

- **Trafic** : sources, diversité, vérifiabilité (croiser Analytics et Search Console).
- **Marché et concurrence** : position, barrières à l'entrée.
- **Clientèle** : concentration, fidélité, satisfaction.
- **Raison de la vente** : cohérente avec le reste du dossier ?

## Chiffrer les risques et ajuster

Chaque faiblesse identifiée n'est pas forcément rédhibitoire : elle doit être **chiffrée** et intégrée au prix. Une migration nécessaire, une dette technique, une dépendance : autant d'éléments à traduire en euros pour ajuster l'offre. La due diligence n'aboutit pas à un « oui » ou « non », mais à un **prix juste et éclairé**.

## Sécuriser la conclusion

La due diligence achevée, la transaction se finalise dans un **cadre sécurisé** : séquestre des fonds, accès complets remis seulement après paiement sécurisé, et transmission méthodique. Ne réglez jamais avant d'avoir terminé vos vérifications.

## En résumé — La checklist due diligence

- **Financier** : revenus prouvés, coûts réels, bénéfice net, cohérence.
- **Technique** : dette, sécurité, performances, dépendances.
- **Juridique** : propriété, licences, contrats, RGPD, litiges.
- **Commercial** : trafic vérifié, marché, clientèle, raison de vente.
- **Chiffrez chaque risque** et ajustez le prix.
- **Sécurisez** paiement et transmission.

Une due diligence rigoureuse est le meilleur investissement avant l'investissement. Elle transforme l'incertitude en décision éclairée — et c'est exactement l'accompagnement que propose La Citadelle.""",
    },
    {
        "num": 22,
        "slug": "guide-la-citadelle-22-fiscalite-vente-actif-numerique-france",
        "date": "2026-12-05T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Fiscalité de la vente d'un actif numérique en France",
        "excerpt": "Comprendre les principales règles fiscales applicables lors de la cession d'un site internet, d'un SaaS ou d'un autre actif numérique.",
        "seo": ["fiscalité vente site internet", "fiscalité SaaS", "impôts vente site", "plus-value site internet"],
        "geo": ["fiscalité France", "impôts France"],
        "aeo": [
            {"question": "Quelle fiscalité pour vendre un site internet ?", "answer": "La fiscalité dépend du statut du vendeur (particulier, entreprise individuelle, société) et de la nature de l'actif. La cession peut relever du régime des plus-values professionnelles ou de l'impôt sur les sociétés. Les règles étant complexes et évolutives, il est indispensable de consulter un expert-comptable ou un avocat fiscaliste."},
            {"question": "Comment déclarer la vente d'un business digital ?", "answer": "La déclaration dépend de la structure juridique : un professionnel déclare généralement la plus-value dans le cadre de son régime (BIC, IS), tandis que les modalités varient selon l'ancienneté et le montant. Un professionnel du chiffre doit valider la déclaration, car une erreur peut coûter cher."},
        ],
        "content": """La fiscalité est l'angle mort de nombreuses ventes d'actifs numériques. Une cession réussie peut voir une part importante de son produit s'évaporer si le volet fiscal n'a pas été anticipé. Ce guide de La Citadelle pose des repères généraux — sans se substituer à un conseil personnalisé.

> **Avertissement important** : ce guide donne des repères généraux. La fiscalité est complexe, personnelle et évolutive. **Consultez systématiquement un expert-comptable ou un avocat fiscaliste** avant toute cession. Aucune décision fiscale ne doit être prise sur la seule base de ce texte.

## Pourquoi anticiper la fiscalité

Le prix de vente n'est pas le montant que vous conservez. Entre le brut et le net, il y a l'**imposition**. L'anticiper permet de calibrer son prix, de choisir le bon moment et, parfois, d'optimiser légalement la structure de l'opération. Y penser **après** la vente, c'est subir ; y penser avant, c'est décider.

## Le facteur déterminant : votre statut

Le traitement fiscal dépend d'abord de **qui vend** :

- **Particulier** : la cession peut relever de règles différentes selon qu'il s'agit d'une activité occasionnelle ou habituelle.
- **Entreprise individuelle / micro-entreprise** : régime des **plus-values professionnelles**, avec des règles spécifiques.
- **Société (SAS, SARL…)** : la cession d'un actif relève souvent de l'**impôt sur les sociétés** ; la cession des titres de la société obéit à d'autres règles encore.

Chaque situation a ses conséquences : il n'existe pas de réponse unique.

## La notion de plus-value

Dans beaucoup de cas, c'est la **plus-value** (différence entre le prix de vente et la valeur d'acquisition ou comptable) qui est imposée, et non le prix total. Le calcul, les taux et les éventuels abattements ou exonérations dépendent de nombreux paramètres : ancienneté, montant, régime, situation personnelle.

## Les régimes et dispositifs possibles

Selon les cas, différents dispositifs peuvent s'appliquer (exonérations liées à la durée de détention, à la valeur de l'entreprise, au départ à la retraite, etc.). Ces dispositifs sont **soumis à conditions strictes** et évoluent régulièrement. Seul un professionnel peut déterminer ceux auxquels vous êtes éligible.

## La TVA et les autres impositions

Au-delà de l'imposition du gain, d'autres aspects peuvent entrer en jeu : **TVA** sur certaines opérations, contributions sociales, formalités déclaratives. Là encore, l'analyse doit être personnalisée.

## Bien s'entourer : la vraie recommandation

La meilleure décision fiscale est celle prise **avec un professionnel du chiffre ou du droit**, en amont de la vente. Le coût d'un conseil est dérisoire comparé au risque d'une erreur ou d'une optimisation manquée. Préparez pour lui un dossier clair : statut, historique, valeur d'acquisition, prix envisagé.

## En résumé — La checklist fiscale

- **Anticipez la fiscalité avant de vendre**, jamais après.
- **Identifiez votre statut** : particulier, EI, société — tout en découle.
- **Comprenez que c'est souvent la plus-value** qui est imposée.
- **Explorez les dispositifs** applicables, sous conditions.
- **Consultez impérativement un expert-comptable ou un fiscaliste.**

La fiscalité ne doit jamais être une surprise de dernière minute. L'anticiper, avec l'aide d'un professionnel, fait partie intégrante d'une vente réussie — et c'est un réflexe que La Citadelle vous encourage vivement à adopter.""",
    },
    {
        "num": 23,
        "slug": "guide-la-citadelle-23-contrats-indispensables-cession-actif-numerique",
        "date": "2026-12-12T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Les contrats indispensables lors d'une cession d'actif numérique",
        "excerpt": "Les contrats essentiels pour sécuriser juridiquement la vente d'un actif numérique.",
        "seo": ["contrat vente site internet", "contrat SaaS", "contrat cession", "juridique"],
        "geo": ["contrat France"],
        "aeo": [
            {"question": "Quel contrat utiliser ?", "answer": "La cession d'un actif numérique repose principalement sur un contrat de cession écrit précisant l'objet, le prix, les éléments transférés, les garanties et les modalités. Selon les cas, il peut être précédé d'un accord de confidentialité (NDA) et d'une lettre d'intention, et accompagné d'un accord d'accompagnement post-vente."},
            {"question": "Comment sécuriser une vente ?", "answer": "Pour sécuriser une vente : formalisez tout par écrit (NDA, lettre d'intention, contrat de cession), précisez les garanties du vendeur et les éléments transférés, prévoyez les conditions de paiement via un séquestre, et faites relire les documents par un professionnel du droit avant signature."},
        ],
        "content": """Une vente d'actif numérique se scelle sur des chiffres, mais se sécurise sur des **contrats**. Un accord verbal ou un document bâclé expose les deux parties à des litiges. Ce guide de La Citadelle présente les contrats essentiels d'une cession — à faire toujours valider par un professionnel du droit.

> **Note** : ce guide décrit le rôle de chaque document à titre pédagogique. La rédaction et la validation d'un contrat doivent être confiées à un professionnel du droit.

## Pourquoi formaliser par écrit

Un contrat écrit protège **les deux parties**. Il fixe précisément ce qui est vendu, à quel prix, dans quelles conditions, et avec quelles garanties. En cas de désaccord, il est la référence. Vendre « sur parole » ou avec un document vague, c'est ouvrir la porte aux malentendus et aux contentieux.

## 1 — L'accord de confidentialité (NDA)

Avant même de dévoiler des données sensibles (revenus, accès, statistiques détaillées), un **accord de confidentialité** engage l'acheteur potentiel à ne pas divulguer ni exploiter les informations reçues. Il protège le vendeur pendant la phase d'exploration, où l'on ouvre progressivement son dossier.

## 2 — La lettre d'intention (LOI)

La **lettre d'intention** formalise l'intérêt sérieux de l'acheteur et pose le cadre de la négociation : prix envisagé, périmètre, calendrier, conditions (comme la réalisation d'une due diligence satisfaisante). Elle n'est pas toujours définitivement engageante, mais elle structure la suite et prouve le sérieux des parties.

## 3 — Le contrat de cession : le document central

C'est le cœur de l'opération. Un bon contrat de cession précise notamment :

- **L'objet** : la description exacte de l'actif et de tous ses éléments (domaine, code, contenus, comptes, base clients, marque…).
- **Le prix** et les **modalités de paiement** (idéalement via séquestre).
- Les **garanties du vendeur** : il déclare posséder l'actif, avoir le droit de le vendre, et que les informations fournies sont exactes.
- Les **conditions suspensives** éventuelles (transfert effectif, validation).
- La **répartition des responsabilités** (litiges antérieurs, dettes).
- Les clauses de **non-concurrence** ou de **non-sollicitation**, si pertinentes.

## 4 — L'accord d'accompagnement post-vente

Souvent négligé, il formalise la **période de support** après la cession : durée, disponibilité du vendeur, périmètre de l'aide. Il sécurise l'acheteur et évite les malentendus sur ce qui est dû après la bascule.

## Le rôle du séquestre dans les contrats

Les contrats gagnent à s'articuler avec un **séquestre** : les fonds de l'acheteur sont sécurisés, et leur libération au vendeur est conditionnée à la réalisation des étapes prévues (transmission effective, validation). Cette mécanique traduit concrètement les garanties du contrat.

## En résumé — La checklist contractuelle

- **Tout par écrit** : la parole ne protège personne.
- **NDA** avant de dévoiler les données sensibles.
- **Lettre d'intention** pour cadrer la négociation.
- **Contrat de cession** précis : objet, prix, garanties, responsabilités.
- **Accord d'accompagnement** pour le support post-vente.
- **Articulez le tout avec un séquestre**, et **faites valider par un juriste**.

Les contrats sont l'ossature juridique d'une vente sereine. Bien rédigés et validés par un professionnel, ils transforment un accord fragile en transaction solide — la sécurité que La Citadelle place au cœur de chaque cession.""",
    },
    {
        "num": 24,
        "slug": "guide-la-citadelle-24-concevoir-un-dossier-vendeur-irreprochable",
        "date": "2026-12-19T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Concevoir un dossier vendeur irréprochable",
        "excerpt": "Préparer un dossier complet permettant de rassurer les acheteurs et d'accélérer la vente.",
        "seo": ["dossier vendeur", "vendre site internet", "data room", "documents vente"],
        "geo": ["vente site France"],
        "aeo": [
            {"question": "Quels documents fournir ?", "answer": "Un dossier vendeur complet contient : la présentation de l'actif, les preuves de revenus (relevés natifs), les données de trafic (Search Console, Analytics), la reconstitution des coûts, l'inventaire des accès, l'historique technique et les éléments juridiques (propriété, licences). Ces documents rassurent l'acheteur et accélèrent la vente."},
            {"question": "Comment préparer un dossier vendeur ?", "answer": "Pour préparer un dossier vendeur : rassemblez et organisez toutes les preuves (revenus, trafic, coûts), rédigez une présentation claire du modèle, listez les accès et l'historique, assumez les faiblesses, et réunissez le tout dans une data room ordonnée. Un dossier qui répond aux questions avant qu'elles soient posées inspire confiance."},
        ],
        "content": """Un dossier vendeur soigné agit comme un costume bien coupé : il inspire le sérieux avant même le premier échange. À revenus égaux, un actif bien documenté se vend plus cher et plus vite. Ce guide de La Citadelle détaille comment concevoir un dossier vendeur irréprochable.

## Le dossier vendeur, meilleur argument de vente

Nous l'avons répété : la valeur d'un actif dépend du **risque perçu** par l'acheteur. Un dossier complet réduit ce risque en répondant **avant** aux questions. Il fait gagner du temps à l'acheteur, raccourcit la due diligence, et transmet un signal puissant : « je maîtrise mon actif et je n'ai rien à cacher ».

## 1 — La présentation de l'actif

Ouvrez par une présentation claire : nature de l'actif, ancienneté, modèle de revenus, positionnement, points forts et **faiblesses assumées**. Cette honnêteté initiale installe la confiance pour tout le reste.

## 2 — Les preuves de revenus

Le cœur du dossier. Rassemblez :

- Les **relevés natifs** (Stripe, régie, affiliation) sur 12 à 24 mois.
- Une synthèse claire de l'évolution et de la répartition des revenus.
- La distinction entre récurrent et ponctuel.

Privilégiez les **exports natifs** aux captures d'écran, plus crédibles.

## 3 — Les données de trafic

- Accès ou exports **Search Console** (16 mois) et **Analytics**.
- Une lecture honnête des sources, de la diversité et des tendances.
- L'explication d'éventuels creux ou pics.

## 4 — La reconstitution des coûts

Présentez le **bénéfice net réel** en détaillant les coûts : hébergement, licences, outils, sous-traitance, et **temps de gestion**. Un acheteur qui voit que vous n'avez rien caché des coûts vous fait davantage confiance sur les revenus.

## 5 — L'inventaire des accès et l'historique

- La **liste complète des accès** (domaine, hébergement, CMS, e-mails, API, comptes tiers).
- L'**historique technique** : migrations, incidents, mises à jour majeures — un véritable « carnet d'entretien ».
- Les procédures de gestion, gage de transmissibilité.

## 6 — Les éléments juridiques

- La **propriété** du domaine, des marques, du code et des contenus.
- Les **licences** et leur transférabilité.
- Les **contrats** en cours et la conformité RGPD.

## Organiser une data room

Rassemblez tout dans une **data room** : un espace ordonné (dossier partagé structuré) où l'acheteur retrouve chaque document classé par thème. Une data room claire est en soi un argument : elle prouve la rigueur et facilite la décision. Dévoilez les éléments sensibles **par paliers**, selon l'engagement démontré.

## En résumé — La checklist du dossier vendeur

- **Présentez l'actif** clairement, faiblesses comprises.
- **Prouvez les revenus** via des exports natifs.
- **Documentez le trafic** (Search Console + Analytics).
- **Reconstituez les coûts** et le bénéfice net.
- **Inventoriez les accès** et l'historique technique.
- **Réunissez les éléments juridiques.**
- **Organisez une data room** et dévoilez par paliers.

Un dossier vendeur irréprochable est l'investissement le plus rentable avant une vente : il rassure, accélère et valorise. C'est la préparation que La Citadelle place au fondement de toute cession réussie.""",
    },
    {
        "num": 25,
        "slug": "guide-la-citadelle-25-guide-ultime-transmission-actif-numerique",
        "date": "2026-12-26T07:00:00+00:00",
        "title": "Le Guide de La Citadelle : Le guide ultime de la transmission d'un actif numérique",
        "excerpt": "Toutes les étapes pour réussir la transmission technique, documentaire et sécuritaire d'un actif numérique après la vente.",
        "seo": ["transmission actif numérique", "transfert site internet", "migration", "dossier de transmission", "attestation de transmission"],
        "geo": ["transmission France"],
        "aeo": [
            {"question": "Comment transmettre un site internet ?", "answer": "Pour transmettre un site internet : réalisez une sauvegarde complète, puis transférez dans le bon ordre l'hébergement, la base de données, le domaine et la zone DNS, les comptes tiers et les licences. Validez chaque étape avec l'acheteur, remettez un dossier de transmission et prévoyez une période d'accompagnement."},
            {"question": "Quels accès transmettre après une vente ?", "answer": "Après une vente, transmettez : le registrar du domaine, l'hébergement, la base de données, les comptes CMS/admin, les e-mails professionnels, les comptes Analytics et Search Console, les clés API, les licences de thèmes et plugins, et les accès aux plateformes de paiement et d'affiliation."},
            {"question": "Comment sécuriser une transmission ?", "answer": "Pour sécuriser une transmission : ne libérez les accès complets qu'après sécurisation du paiement (séquestre), transférez dans le bon ordre en validant chaque étape, faites changer tous les mots de passe et clés API par l'acheteur à la fin, et formalisez le tout par une attestation de transmission."},
        ],
        "content": """La transmission est l'aboutissement d'une vente — et le moment où tout peut se jouer. Une transmission bâclée transforme une belle cession en litige ; une transmission maîtrisée est une simple formalité. Ce guide de La Citadelle réunit toutes les étapes pour réussir la transmission d'un actif numérique.

## La transmission, sceau d'une vente réussie

Une vente ne s'achève pas au paiement, mais à la **transmission complète et validée**. C'est là que l'acheteur prend réellement possession de son actif. Une transmission professionnelle rassure, évite les litiges, et laisse le souvenir d'une opération sérieuse.

## Étape 0 — Ne rien transmettre avant la sécurisation

La règle absolue : **aucun accès complet avant que le paiement ne soit sécurisé** par un séquestre. Les fonds protégés, la transmission peut commencer sereinement, chaque partie sachant qu'elle est couverte.

## Étape 1 — La sauvegarde complète

Avant tout transfert, réalisez une **sauvegarde intégrale** (fichiers + base de données), testée. C'est le filet de sécurité indispensable en cas d'incident pendant la bascule.

## Étape 2 — Transférer dans le bon ordre

L'ordre des opérations évite les pannes :

1. **Hébergement** et fichiers.
2. **Base de données** (encodage vérifié, import complet).
3. **Nom de domaine** et **zone DNS** (A, MX, TXT, CNAME documentés) via le registrar (déverrouillage + code d'autorisation).
4. **Comptes tiers** : CMS/admin, e-mails professionnels, Analytics, Search Console, clés **API**, licences de thèmes et plugins, plateformes de **paiement** et d'**affiliation**.

## Étape 3 — L'inventaire des accès à transmettre

Assurez-vous de ne rien oublier :

- Registrar du domaine, hébergement, base de données.
- Comptes CMS/admin, e-mails professionnels.
- Comptes Google (Analytics, Search Console) — en transférant la **propriété**, pas un simple accès.
- Clés API, licences, comptes de paiement et d'affiliation.

## Étape 4 — Valider chaque étape avec l'acheteur

Une transmission n'est terminée que lorsque l'acheteur **confirme** que tout fonctionne : site en ligne, e-mails opérationnels, paiements actifs, données présentes. Cette validation conjointe est essentielle avant de considérer l'opération close.

## Étape 5 — La rotation des accès

Une fois la transmission validée, l'acheteur doit **immédiatement** changer tous les mots de passe, révoquer les anciens accès et clés API du vendeur, et activer la double authentification. C'est la condition d'un redémarrage sur des bases saines et sécurisées.

## Étape 6 — Le dossier et l'attestation de transmission

Formalisez la fin de l'opération :

- Un **dossier de transmission** remis à l'acheteur (inventaire des accès, documentation, historique).
- Une **attestation de transmission** signée par les deux parties, actant que tout a été transféré et validé. Elle protège chacun et clôt officiellement la cession.

## Étape 7 — L'accompagnement post-vente

Prévoyez une **période de support** (souvent 15 à 30 jours) pour répondre aux questions et assurer le relais. C'est le signe d'une transmission vraiment professionnelle.

## En résumé — La checklist de transmission

- **Rien avant la sécurisation** du paiement (séquestre).
- **Sauvegarde complète** et testée.
- **Transfert dans le bon ordre** : hébergement → base → domaine/DNS → comptes tiers.
- **Inventaire exhaustif** des accès.
- **Validation conjointe** que tout fonctionne.
- **Rotation des accès** par l'acheteur.
- **Dossier + attestation** de transmission.
- **Accompagnement** post-vente.

Une transmission maîtrisée est l'ultime preuve de sérieux d'une vente. Elle ne laisse rien au hasard, protège les deux parties et scelle la confiance. C'est le cœur du métier de La Citadelle : faire du jour de la bascule une formalité sereine.

---

*Ainsi se referme cette série du Guide de La Citadelle. De la vente à la transmission, en passant par l'estimation, la due diligence et le juridique, ces guides forment une bibliothèque de référence pour acheter, vendre et transmettre vos actifs numériques en toute sécurité. La collection continue — rendez-vous chaque samedi.*""",
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

    print(f"\nLot 5 (Guides) terminé — {created} guide(s) créé(s), {skipped} mis à jour.")


if __name__ == "__main__":
    asyncio.run(main())
