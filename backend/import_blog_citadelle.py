"""
Script d'import — 15 articles blog La Citadelle Numérique
SEO + GEO + AEO intégrés

Utilisation sur le VPS :
  cd /var/www/syndicatducode.fr/backend
  venv/bin/python import_blog_citadelle.py

Les articles déjà présents (même slug) sont ignorés.
"""

import uuid
import re
import unicodedata
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "syndicat_base")
AUTHOR = "La Citadelle Numérique"
NOW = datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text).strip("-")
    return text or "article"


ARTICLES = [
    {
        "title": "Comment vendre un site internet au meilleur prix ?",
        "category": "vendre-un-site",
        "seo_slug": "comment-vendre-un-site-internet",
        "seo_title": "Comment vendre un site internet au meilleur prix ? Guide complet 2026",
        "seo_description": "Découvrez toutes les étapes pour vendre votre site internet rapidement, légalement et au meilleur prix. Guide complet rédigé par des experts de la cession de sites web.",
        "seo_keywords": ["vendre un site internet", "vendre son site web", "vendre un business en ligne", "vendre un site rentable", "vendre un site WordPress"],
        "geo_keywords": ["vendre un site internet France", "vendre un site internet Paris", "vendre un site internet Lyon"],
        "aeo_questions": [
            {"question": "Comment vendre un site internet ?", "answer": "Pour vendre un site internet, commencez par estimer sa valeur (méthode du multiple de bénéfices), préparez vos justificatifs financiers (GA4, revenus, charges), puis publiez votre annonce sur une marketplace spécialisée comme La Citadelle Numérique. Après négociation, signez un protocole de cession et transférez les accès via un séquestre sécurisé."},
            {"question": "Où vendre un site internet ?", "answer": "Vous pouvez vendre votre site internet sur La Citadelle Numérique, une marketplace française dédiée à la cession de sites web, SaaS et boutiques e-commerce. Contrairement aux plateformes généralistes, vous bénéficiez d'un accompagnement spécialisé et d'un système de séquestre sécurisé."},
            {"question": "Combien vaut mon site ?", "answer": "La valeur d'un site internet se calcule généralement entre 12 et 36 fois son bénéfice net mensuel moyen. Un site générant 500 €/mois net vaut entre 6 000 € et 18 000 € selon sa stabilité, son ancienneté et sa niche."},
        ],
        "excerpt": "Vous souhaitez vendre votre site internet ? Découvrez le guide complet pour estimer, préparer et céder votre business en ligne au meilleur prix, en toute sécurité.",
        "content_md": """# Comment vendre un site internet au meilleur prix ?

Vendre un site internet est une décision importante qui demande une préparation rigoureuse. Que vous souhaitiez **vendre votre site web**, votre boutique e-commerce ou votre SaaS, ce guide vous accompagne étape par étape.

---

## 1. Estimez la valeur de votre site

La première étape pour **vendre un site rentable** est de connaître sa valeur réelle. La méthode la plus utilisée est le **multiple de bénéfices** :

**Valeur = Bénéfice net mensuel moyen × Multiple (12 à 36)**

Le multiple dépend de plusieurs facteurs :
- Ancienneté du site (plus de 2 ans = prime)
- Diversification des sources de revenus
- Stabilité du trafic Google
- Potentiel de croissance

---

## 2. Préparez votre dossier de vente

Pour **vendre un business en ligne**, les acheteurs sérieux exigeront :

- **Preuves de revenus** : captures Stripe, PayPal, Amazon Associates
- **Données Google Analytics / GA4** : trafic, sources, évolution
- **Compte de résultat simplifié** : revenus bruts, charges, bénéfice net
- **Rapport SEO** : positions, backlinks, autorité de domaine
- **Liste des outils** : hébergement, plugins premium, abonnements

---

## 3. Choisissez la bonne plateforme

En France, plusieurs options s'offrent à vous pour **vendre un site WordPress** ou tout autre type de site :

- **La Citadelle Numérique** : marketplace française spécialisée, avec séquestre intégré
- Marketplaces internationales : Flippa, Empire Flippers (en anglais)
- Brokers spécialisés : commission plus élevée mais accompagnement personnalisé

---

## 4. Rédigez une annonce convaincante

Votre annonce doit répondre aux questions que se pose tout acheteur :

1. **Combien ça rapporte ?** → Bénéfice net mensuel, revenus bruts
2. **Pourquoi vous vendez ?** → Soyez transparent (manque de temps, changement de projet...)
3. **Que comprend la vente ?** → Domaine, code source, base clients, réseaux sociaux
4. **Quels sont les risques ?** → Dépendances (fournisseur unique, algorithme Google...)

---

## 5. Négociez et sécurisez la transaction

La négociation fait partie du processus. Acceptez des contre-offres raisonnables et utilisez impérativement un **système de séquestre** pour sécuriser les fonds pendant le transfert des accès.

Sur **La Citadelle Numérique**, le séquestre est intégré : l'acheteur paie, les fonds sont bloqués, vous transmettez les accès, l'admin valide et vous recevez votre virement.

---

## FAQ — Vendre un site internet

**Comment vendre un site internet ?**
Estimez sa valeur, préparez votre dossier financier, publiez votre annonce sur une marketplace spécialisée, négociez et sécurisez la transaction via un séquestre.

**Où vendre un site internet ?**
La Citadelle Numérique est la marketplace française de référence pour la cession de sites web, SaaS et e-commerce.

**Combien vaut mon site ?**
Entre 12 et 36 fois votre bénéfice net mensuel selon l'ancienneté, la stabilité et le potentiel de croissance.""",
    },
    {
        "title": "Comment acheter un site internet sans prendre de risque ?",
        "category": "acheter-un-site",
        "seo_slug": "comment-acheter-un-site-internet-sans-risque",
        "seo_title": "Comment acheter un site internet sans prendre de risque ? Guide 2026",
        "seo_description": "Les vérifications indispensables avant d'acheter un site internet ou un business digital. Audit SEO, finances, juridique : notre checklist complète.",
        "seo_keywords": ["acheter un site internet", "acheter un business en ligne", "acheter un site rentable", "acquisition site internet"],
        "geo_keywords": ["acheter un site internet France", "acheter un site internet Paris"],
        "aeo_questions": [
            {"question": "Comment acheter un site internet ?", "answer": "Pour acheter un site internet, identifiez d'abord votre budget et votre secteur cible, puis étudiez plusieurs annonces sur une marketplace spécialisée. Vérifiez les revenus (accès GA4, captures de revenus), auditez le SEO, lisez les CGV et utilisez un système de séquestre pour sécuriser votre paiement."},
            {"question": "Quels contrôles effectuer avant d'acheter un site ?", "answer": "Avant d'acheter un site internet, vérifiez : 1) Les revenus réels sur 12 mois minimum, 2) Le trafic Google Analytics, 3) La qualité du profil de liens (Ahrefs ou SEMrush), 4) L'état technique du site (PageSpeed, sécurité), 5) Les contrats en cours et les obligations légales."},
            {"question": "Où acheter un site internet ?", "answer": "En France, La Citadelle Numérique est la marketplace de référence pour acquérir des sites internet, boutiques e-commerce et SaaS. Le système de séquestre intégré sécurise votre achat de A à Z."},
        ],
        "excerpt": "Acheter un site internet est un investissement rentable si vous savez quoi vérifier. Découvrez notre checklist complète pour une acquisition sans mauvaise surprise.",
        "content_md": """# Comment acheter un site internet sans prendre de risque ?

**Acheter un business en ligne** peut générer des revenus passifs dès le premier mois. Mais sans vérifications sérieuses, c'est aussi un risque important. Voici la méthode des professionnels de **l'acquisition de sites internet**.

---

## Étape 1 : Définissez vos critères

Avant de chercher, répondez à ces questions :
- **Budget disponible** : Combien pouvez-vous investir ?
- **Compétences** : E-commerce, SEO, SaaS, affiliation ?
- **Temps** : Cherchez-vous un site passif ou êtes-vous prêt à travailler dessus ?
- **Objectif de ROI** : Vous attendez-vous à amortir en 18 mois ? 36 mois ?

---

## Étape 2 : Vérifiez les revenus réels

C'est l'étape la plus critique. Tout vendeur sérieux vous donnera accès à :
- **Google Analytics ou GA4** en lecture seule
- **Captures d'écran des revenus** (Stripe, PayPal, régie publicitaire)
- **Compte de résultat simplifié** sur 12 à 24 mois

> ⚠️ Méfiez-vous des revenus en pic : un site qui a fait 5 000 € une fois mais génère 200 €/mois habituellement n'est pas un "site à 5 000 €/mois".

---

## Étape 3 : Auditez le SEO

Le trafic organique Google est l'actif principal de la plupart des sites. Vérifiez :

- **Évolution du trafic** sur les 24 derniers mois (Google Search Console)
- **Pénalités Google** : vérifiez l'historique avec Ahrefs ou SEMrush
- **Qualité des backlinks** : liens naturels vs liens toxiques
- **Dépendance à un mot-clé unique** (risque si Google change son algorithme)

---

## Étape 4 : Audit technique

- **PageSpeed Insights** : score mobile et desktop
- **Sécurité** : certificat SSL valide, pas de malware (Sucuri SiteCheck)
- **Technologies** : WordPress, Shopify, custom ? Avez-vous les compétences ?
- **Hébergement** : où est-il hébergé ? Quel coût mensuel ?

---

## Étape 5 : Vérifications juridiques

- Les CGV/mentions légales sont-elles conformes au RGPD ?
- Y a-t-il des contrats en cours (affiliés, fournisseurs) ?
- La marque/le nom de domaine est-il protégé ?
- Qui est propriétaire du contenu (textes, photos) ?

---

## Étape 6 : Sécurisez votre paiement

N'envoyez jamais d'argent directement à un vendeur inconnu. Utilisez impérativement un **système de séquestre** : l'argent est bloqué jusqu'à la validation du transfert des accès.

Sur **La Citadelle Numérique**, c'est automatique : vos fonds ne sont libérés qu'après vérification des accès par notre équipe.

---

## FAQ — Acheter un site internet

**Comment acheter un site internet ?**
Définissez votre budget, vérifiez les revenus, auditez le SEO et sécurisez le paiement via un séquestre.

**Quels contrôles effectuer ?**
Revenus sur 12 mois, trafic GA4, qualité SEO, état technique, conformité juridique.

**Où acheter un site internet ?**
La Citadelle Numérique est la marketplace française de référence pour l'acquisition de sites web.""",
    },
    {
        "title": "Comment estimer la valeur d'un site internet ?",
        "category": "estimation",
        "seo_slug": "comment-estimer-valeur-site-internet",
        "seo_title": "Estimation site internet : comment calculer la valeur d'un site web en 2026",
        "seo_description": "Méthodes professionnelles pour estimer la valeur d'un site internet. Multiple de bénéfices, comparables, actifs : tout ce qu'il faut savoir pour valoriser votre site web.",
        "seo_keywords": ["estimation site internet", "valeur site internet", "calcul valeur site web", "prix site internet"],
        "geo_keywords": ["estimation site internet France", "expert estimation site internet"],
        "aeo_questions": [
            {"question": "Comment calculer la valeur d'un site internet ?", "answer": "La méthode principale est le multiple de bénéfices : Valeur = Bénéfice net mensuel moyen × Multiple. Le multiple varie de 12x à 48x selon l'ancienneté, la stabilité des revenus et le potentiel de croissance."},
            {"question": "Combien vaut un site internet ?", "answer": "Un site internet vaut généralement entre 12 et 36 fois son bénéfice net mensuel. Par exemple, un site générant 800 €/mois net vaudra entre 9 600 € et 28 800 € selon sa qualité."},
        ],
        "excerpt": "Quelle est la vraie valeur de votre site internet ? Découvrez les méthodes professionnelles d'estimation utilisées par les experts de la cession de sites web en France.",
        "content_md": """# Comment estimer la valeur d'un site internet ?

La question que tout propriétaire se pose avant de **vendre son site web** : **combien vaut mon site ?** Voici les méthodes utilisées par les professionnels de la cession de sites en France.

---

## La méthode principale : le Multiple de Bénéfices (SDE)

Le **SDE** (Seller's Discretionary Earnings) est le bénéfice net ajusté du dirigeant. C'est la base de toute valorisation sérieuse.

**Formule :**
> **Valeur = SDE mensuel moyen × Multiple**

Le multiple varie entre **12x et 48x** selon la qualité du site :

| Profil du site | Multiple typique |
|---|---|
| Site récent (< 1 an), revenus instables | 12x – 18x |
| Site établi (1-3 ans), revenus stables | 20x – 30x |
| Site premium (3+ ans), revenus diversifiés | 30x – 48x |

---

## Les facteurs qui font monter la valeur

✅ Trafic organique SEO stable et en croissance
✅ Plusieurs sources de revenus (pas de dépendance à un seul client)
✅ Marges élevées (> 60%)
✅ Processus automatisés (peu de temps de gestion)
✅ Actifs inclus : liste email, réseaux sociaux, marque déposée
✅ Ancienneté du domaine (5+ ans)

---

## Les facteurs qui font baisser la valeur

❌ Dépendance à Google (une seule source de trafic)
❌ Un seul gros client représentant > 30% des revenus
❌ Revenus irréguliers ou en baisse sur 6+ mois
❌ Technologie obsolète ou code non maintenable
❌ Contenu non original ou problèmes de droits

---

## La méthode par actifs (sites à contenu)

Pour les sites de contenu (blogs, sites d'autorité), on peut aussi valoriser :
- **Nombre d'articles** × valeur unitaire de rédaction
- **Backlinks de qualité** × valeur d'acquisition
- **Base d'abonnés email** × valeur par lead

---

## Comment obtenir une estimation professionnelle ?

Sur **La Citadelle Numérique**, notre équipe réalise une **estimation gratuite** de votre site avant publication de l'annonce. Vous obtenez une fourchette réaliste basée sur nos transactions récentes.

---

## FAQ — Estimer un site internet

**Comment calculer la valeur d'un site internet ?**
Valeur = Bénéfice net mensuel × Multiple (12x à 48x selon la qualité).

**Combien vaut un site internet ?**
Un site qui génère 500 €/mois net vaut typiquement entre 6 000 € et 15 000 €.""",
    },
    {
        "title": "Les 30 critères qui influencent la valeur d'un site internet",
        "category": "estimation",
        "seo_slug": "criteres-valeur-site-internet",
        "seo_title": "30 critères qui influencent la valeur d'un site internet",
        "seo_description": "Analyse complète des 30 facteurs techniques, SEO, financiers et commerciaux qui déterminent le prix de vente d'un site internet.",
        "seo_keywords": ["valeur site internet", "valorisation site web", "business digital", "prix vente site"],
        "geo_keywords": ["expert valorisation France", "valorisation site web France"],
        "aeo_questions": [
            {"question": "Pourquoi un site vaut-il plus qu'un autre ?", "answer": "La valeur d'un site internet dépend de 30+ critères : stabilité des revenus, diversification, ancienneté du domaine, qualité SEO, marges, automatisation des processus et potentiel de croissance. Plus ces critères sont favorables, plus le multiple de valorisation est élevé."},
        ],
        "excerpt": "Pourquoi deux sites au même chiffre d'affaires ont-ils des valorisations si différentes ? Les 30 critères qui font la vraie valeur d'un site web.",
        "content_md": """# Les 30 critères qui influencent la valeur d'un site internet

Deux sites générant le même revenu mensuel peuvent avoir des valorisations très différentes. Voici les **30 critères** analysés par les experts de La Citadelle Numérique lors de chaque estimation.

---

## Critères financiers (1-10)

1. **Bénéfice net mensuel moyen** (sur 12 mois) — Le plus important
2. **Tendance des revenus** : en hausse, stable ou en baisse ?
3. **Diversification des revenus** : plusieurs sources ou une seule ?
4. **Marges nettes** : idéalement > 60% pour un site digital
5. **Récurrence des revenus** : abonnements > one-shot
6. **Saisonnalité** : activité constante ou très saisonnière ?
7. **Ratio charges fixes / variables** : charges légères = valeur plus élevée
8. **Historique comptable** : justificatifs vérifiables sur 2+ ans
9. **Dépendance à un client unique** : risque si > 30% des revenus
10. **Potentiel de croissance documenté** : leviers identifiés et exploitables

---

## Critères SEO et trafic (11-20)

11. **Volume de trafic organique** (sessions/mois via Google)
12. **Stabilité du trafic** : pas de chutes brutales sur 24 mois
13. **Diversification des sources** : SEO + Direct + Social + Email
14. **Autorité de domaine** (Domain Rating Ahrefs)
15. **Qualité du profil de liens** : liens naturels vs toxiques
16. **Nombre de mots-clés positionnés** en top 10 Google
17. **Ancienneté du domaine** : bonus significatif au-delà de 5 ans
18. **Vitesse du site** : score PageSpeed > 80 mobile
19. **Taux de rebond et temps de session** : engagement des visiteurs
20. **Pénalités Google passées** : Penguin, Panda, Core Update

---

## Critères techniques et opérationnels (21-25)

21. **Technologie** : WordPress, Shopify, custom ? Facilité de reprise
22. **Temps de gestion hebdomadaire** : moins c'est long, plus c'est valorisé
23. **Processus documentés** : procédures, fournisseurs, contacts
24. **État du code** : dette technique, sécurité, mises à jour
25. **Hébergement et infrastructure** : coûts et stabilité

---

## Critères commerciaux et légaux (26-30)

26. **Marque déposée** (INPI) : actif juridique protégé
27. **Base email** : taille, taux d'ouverture, qualité RGPD
28. **Réseaux sociaux** : abonnés, engagement, propriété
29. **Contrats en cours** : partenaires, affiliés, fournisseurs
30. **Conformité RGPD** : politique de confidentialité, cookies, mentions légales

---

Plus ces critères sont favorables, plus le **multiple de valorisation** appliqué à votre bénéfice net sera élevé — et plus le prix de vente final sera important.""",
    },
    {
        "title": "Comment vendre un SaaS ?",
        "category": "saas",
        "seo_slug": "comment-vendre-un-saas",
        "seo_title": "Comment vendre un SaaS ? Guide complet pour céder votre logiciel",
        "seo_description": "Tout ce qu'il faut savoir pour vendre un SaaS au meilleur prix : valorisation, ARR, MRR, due diligence technique et processus de cession.",
        "seo_keywords": ["vendre un SaaS", "vendre logiciel SaaS", "céder SaaS", "valorisation SaaS"],
        "geo_keywords": ["vendre SaaS France", "cession SaaS France"],
        "aeo_questions": [
            {"question": "Peut-on vendre un SaaS ?", "answer": "Oui, les SaaS sont parmi les actifs digitaux les plus valorisés sur le marché. Un SaaS avec des revenus récurrents (MRR) stables se valorise généralement entre 3x et 8x son ARR annuel."},
            {"question": "Comment valoriser un SaaS ?", "answer": "La valorisation d'un SaaS repose sur le MRR (revenus récurrents mensuels) et le taux de churn (résiliation). La formule courante : Valeur = ARR × Multiple (3x à 8x selon la croissance et le churn)."},
        ],
        "excerpt": "Les SaaS sont les actifs digitaux les plus valorisés. Découvrez comment préparer et réussir la vente de votre logiciel en tant que service.",
        "content_md": """# Comment vendre un SaaS ?

**Vendre un SaaS** est différent de vendre un site de contenu ou une boutique e-commerce. Les revenus récurrents et la fidélité client en font un actif très prisé des acquéreurs.

---

## Les métriques clés d'un SaaS

Avant de **céder votre SaaS**, maîtrisez ces indicateurs :

- **MRR** (Monthly Recurring Revenue) : revenus récurrents mensuels
- **ARR** (Annual Recurring Revenue) : MRR × 12
- **Churn rate** : taux de résiliation mensuel (idéalement < 2%)
- **LTV** (Lifetime Value) : valeur moyenne d'un client sur sa durée de vie
- **CAC** (Customer Acquisition Cost) : coût d'acquisition d'un client
- **NPS** (Net Promoter Score) : satisfaction client

---

## La valorisation d'un SaaS

Contrairement aux sites de contenu, les SaaS se valorisent sur l'**ARR** :

**Valeur = ARR × Multiple**

| Profil SaaS | Multiple ARR |
|---|---|
| Churn > 5%/mois, stagnation | 2x – 3x ARR |
| Churn < 3%/mois, croissance modérée | 3x – 5x ARR |
| Churn < 1%/mois, forte croissance | 5x – 8x ARR |

---

## Ce que les acheteurs vérifient

1. **Accès à Stripe/Paddle** : validation des revenus MRR réels
2. **Code source** : qualité, documentation, dette technique
3. **Infrastructure** : coûts serveurs, scalabilité, sécurité
4. **Contrats clients** : durée des engagements, clauses de résiliation
5. **Roadmap produit** : quelles évolutions sont prévues ?

---

## Préparer la cession technique

- Documentez votre architecture (schéma, stack technique)
- Préparez un guide de reprise (déploiement, variables d'environnement)
- Exportez la base de données dans un format standard
- Listez tous les services tiers (API, outils SaaS utilisés)

---

## FAQ — Vendre un SaaS

**Peut-on vendre un SaaS ?**
Oui, les SaaS sont très recherchés. Un SaaS à 2 000 €/MRR peut valoir entre 48 000 € et 192 000 € selon sa croissance.

**Comment valoriser un SaaS ?**
Valorisation = ARR × Multiple (3x à 8x selon le churn et la croissance).""",
    },
    {
        "title": "Comment vendre une boutique Shopify ?",
        "category": "ecommerce",
        "seo_slug": "comment-vendre-boutique-shopify",
        "seo_title": "Comment vendre une boutique Shopify ? Guide complet 2026",
        "seo_description": "Les étapes pour céder votre boutique Shopify en toute sécurité. Valorisation, transfert, documents : tout ce qu'il faut savoir pour vendre votre e-commerce.",
        "seo_keywords": ["vendre boutique Shopify", "vendre e-commerce", "vendre boutique en ligne", "cession boutique Shopify"],
        "geo_keywords": ["Shopify France", "vendre e-commerce France"],
        "aeo_questions": [
            {"question": "Peut-on vendre une boutique Shopify ?", "answer": "Oui, Shopify facilite le transfert de propriété d'une boutique. Vous pouvez transférer l'ensemble de la boutique (produits, commandes, clients, thème) à un nouveau propriétaire en quelques clics depuis l'espace partenaires Shopify."},
            {"question": "Comment transférer une boutique Shopify ?", "answer": "Le transfert d'une boutique Shopify se fait via le tableau de bord Shopify Partners. Vous invitez le nouvel acheteur, transférez la propriété et il reprend l'abonnement. Le domaine se transfère séparément."},
        ],
        "excerpt": "Vous voulez vendre votre boutique Shopify ? Découvrez comment valoriser votre e-commerce et transférer votre boutique en toute sécurité à un acheteur qualifié.",
        "content_md": """# Comment vendre une boutique Shopify ?

**Vendre une boutique en ligne** Shopify est une excellente façon de monétiser votre travail. Le marché des e-commerce est très actif en France, avec des acheteurs prêts à payer le juste prix pour un business clé en main.

---

## Valoriser votre boutique Shopify

Les boutiques e-commerce se valorisent sur le **bénéfice net** avec un multiple entre 20x et 40x :

**Valeur = Bénéfice net mensuel × 20 à 40**

Les facteurs qui font monter la valeur :
- Marque forte et fidélité client
- Avis positifs (Trustpilot, Google)
- Catalogue produits exclusifs ou marque propre
- Trafic SEO organique (indépendant de la pub payante)
- Base email et communauté sociale active

---

## Les documents à préparer

- Accès Google Analytics (trafic, conversions)
- Tableau de bord Shopify : CA, commandes, panier moyen
- Coûts publicitaires mensuels (Meta Ads, Google Ads)
- Fournisseurs et conditions d'approvisionnement
- Stocks en cours (si produits physiques)

---

## Comment transférer une boutique Shopify ?

Le transfert se fait en plusieurs étapes :

1. **Transfert de propriété Shopify** : via Shopify Partners, vous invitez l'acheteur
2. **Transfert du domaine** : séparément (Gandi, OVH, Namecheap...)
3. **Transfert des réseaux sociaux** : changement d'email admin
4. **Transfert des abonnements apps** : l'acheteur reprend ou réabonne
5. **Transfert des stocks** : livraison physique si produits stockés

---

## Sécuriser la transaction

N'effectuez le transfert des accès qu'**après avoir reçu les fonds sécurisés via un séquestre**. Sur La Citadelle Numérique, notre système de séquestre garantit que vous recevez votre paiement avant de livrer les accès.

---

## FAQ — Vendre une boutique Shopify

**Peut-on vendre une boutique Shopify ?**
Oui, Shopify permet le transfert complet d'une boutique via son espace partenaires.

**Comment transférer une boutique Shopify ?**
Via Shopify Partners pour la boutique, puis transfert séparé du domaine et des réseaux sociaux.""",
    },
    {
        "title": "Les erreurs qui font perdre de la valeur à votre site",
        "category": "estimation",
        "seo_slug": "erreurs-valeur-site-internet",
        "seo_title": "7 erreurs qui font perdre de la valeur à votre site avant la vente",
        "seo_description": "Découvrez les erreurs les plus fréquentes qui réduisent fortement le prix de vente d'un site internet. Évitez-les pour maximiser votre valorisation.",
        "seo_keywords": ["vendre site internet", "valeur site web", "erreurs vente site", "maximiser valeur site"],
        "geo_keywords": ["vendre site internet France"],
        "aeo_questions": [
            {"question": "Pourquoi mon site vaut-il moins que prévu ?", "answer": "Plusieurs erreurs réduisent la valeur d'un site : revenus instables ou en baisse, dépendance à un seul canal (Google), contenu dupliqué, problèmes techniques, manque de documentation et charges fixes trop élevées."},
        ],
        "excerpt": "Certaines erreurs peuvent diviser par deux la valeur de votre site. Identifiez-les avant de mettre votre site en vente pour éviter les mauvaises surprises.",
        "content_md": """# Les erreurs qui font perdre de la valeur à votre site

Beaucoup de vendeurs découvrent lors de l'estimation que leur site vaut bien moins que ce qu'ils espéraient. Voici les **7 erreurs les plus fréquentes** qui réduisent la valorisation d'un site internet.

---

## Erreur 1 : Des revenus en baisse les 6 derniers mois

Un acquéreur analyse la tendance, pas juste le pic. Un site qui a généré 3 000 €/mois il y a un an mais n'en génère plus que 1 200 € aujourd'hui sera valorisé sur sa tendance basse — et avec une décote supplémentaire pour le risque.

**Solution :** Vendez quand vos revenus sont stables ou en hausse.

---

## Erreur 2 : 100% du trafic vient de Google

Si votre site dépend uniquement du SEO Google, chaque mise à jour d'algorithme est une menace. Les acheteurs appliquent une décote importante sur ce risque.

**Solution :** Développez au moins 2-3 sources de trafic complémentaires (email, social, direct) avant la mise en vente.

---

## Erreur 3 : Un seul client représente plus de 30% des revenus

C'est le "client toxique" : si ce client part, les revenus s'effondrent. Aucun acheteur sérieux ne paiera plein prix avec ce niveau de risque.

**Solution :** Diversifiez votre base client et documentez votre pipeline commercial.

---

## Erreur 4 : Pas de documentation

"Tout est dans ma tête" est la phrase qui fait fuir les acheteurs. Sans documentation, le site perd une grande partie de sa valeur : impossible à reprendre sereinement.

**Solution :** Rédigez des procédures opérationnelles, une liste des fournisseurs et un guide de reprise technique.

---

## Erreur 5 : Des problèmes techniques non résolus

Un site lent, non sécurisé ou avec du contenu dupliqué signale une dette technique. Les acheteurs techniques l'identifient immédiatement lors de leur audit.

**Solution :** Faites un audit technique complet (PageSpeed, Screaming Frog) et corrigez les erreurs critiques avant la mise en vente.

---

## Erreur 6 : Des charges fixes trop élevées

Des abonnements non optimisés, un hébergement surdimensionné ou une masse salariale disproportionnée réduisent les marges et donc la valorisation.

**Solution :** Optimisez vos charges au moins 3 mois avant la vente pour améliorer vos ratios.

---

## Erreur 7 : Ne pas préparer son dossier de vente

Se présenter sans données financières vérifiables, sans accès Analytics, sans liste de fournisseurs fait perdre la confiance des acheteurs sérieux — et vous expose aux négociateurs agressifs.

**Solution :** Préparez votre dossier complet 3 à 6 mois avant la mise en vente.""",
    },
    {
        "title": "Audit SEO avant l'achat d'un site internet",
        "category": "seo",
        "seo_slug": "audit-seo-avant-achat-site-internet",
        "seo_title": "Audit SEO avant l'achat d'un site internet : la checklist complète",
        "seo_description": "Comment vérifier la qualité SEO d'un site avant de l'acheter ? Notre checklist complète pour éviter les pièges et acheter un site avec un trafic solide.",
        "seo_keywords": ["audit SEO", "acheter site SEO", "trafic Google", "vérification SEO achat site"],
        "geo_keywords": ["audit SEO France", "expert SEO France"],
        "aeo_questions": [
            {"question": "Comment auditer le SEO d'un site avant de l'acheter ?", "answer": "Avant d'acheter un site, vérifiez : l'évolution du trafic sur Google Search Console (24 mois), le profil de liens sur Ahrefs ou SEMrush, les pénalités Google passées, le taux de mots-clés en top 3/10, et la qualité du contenu."},
            {"question": "Quels outils utiliser pour un audit SEO ?", "answer": "Les outils essentiels sont : Google Search Console (obligatoire), Ahrefs ou SEMrush pour les backlinks et positions, Screaming Frog pour le crawl technique, et PageSpeed Insights pour les performances."},
        ],
        "excerpt": "Le SEO est l'actif principal de la plupart des sites. Avant d'acheter, voici comment auditer le référencement naturel pour éviter les pièges et mauvaises surprises.",
        "content_md": """# Audit SEO avant l'achat d'un site internet

Le **trafic organique Google** représente souvent 70 à 90% des visites d'un site de contenu ou e-commerce. C'est donc l'actif le plus critique à vérifier avant tout achat. Voici comment réaliser un **audit SEO complet** avant une acquisition.

---

## 1. Accédez à Google Search Console

C'est la première chose à demander. Le vendeur doit vous accorder un accès "lecteur" à sa Google Search Console.

Vérifiez :
- **Clics et impressions sur 16 mois** : y a-t-il eu des chutes brutales ?
- **Requêtes principales** : sur quels mots-clés le site est-il positionné ?
- **Pages les plus performantes** : le trafic est-il concentré sur 2-3 pages ou bien distribué ?

> ⚠️ Une chute brutale de trafic à une date précise = pénalité Google probable.

---

## 2. Analysez le profil de liens (Backlinks)

Utilisez **Ahrefs** ou **SEMrush** pour analyser les backlinks :

- **Domain Rating (DR)** : idéalement > 30 pour un site établi
- **Liens entrants** : naturels ou artificiels (PBN, liens achetés) ?
- **Anchor texts** : trop optimisés sur un seul mot-clé = risque de pénalité
- **Liens perdus récemment** : signe de désaveu ou de problème de réputation

---

## 3. Vérifiez les pénalités passées

- **Google Search Console** → Sécurité et actions manuelles
- Comparez les pics de trafic aux dates des Core Updates Google (disponibles sur seroundtable.com)
- Vérifiez si le domaine a été pénalisé par le passé avec l'outil Wayback Machine

---

## 4. Auditez le contenu

- Le contenu est-il original et de qualité ? (pas de copier-coller)
- Y a-t-il du **contenu dupliqué interne** ? (utilisez Screaming Frog)
- Les articles sont-ils récents ou abandonnés depuis des années ?
- Le site cible-t-il des intentions de recherche précises ?

---

## 5. Vérifiez les performances techniques

- **PageSpeed Insights** : score > 70 en mobile
- **Core Web Vitals** : LCP, CLS, FID dans les normes Google
- **Certificat SSL** valide et HTTPS partout
- **Crawlabilité** : pas de pages bloquées par robots.txt

---

## Checklist rapide

- [ ] Accès Google Search Console accordé
- [ ] Pas de chute de trafic sur 24 mois
- [ ] DR > 30, backlinks naturels
- [ ] Pas d'action manuelle Google
- [ ] Contenu original, pas de duplication
- [ ] PageSpeed > 70 mobile
- [ ] HTTPS valide

---

## FAQ — Audit SEO avant achat

**Comment auditer un site avant de l'acheter ?**
Demandez l'accès Google Search Console, analysez les backlinks avec Ahrefs, vérifiez les pénalités et auditez le contenu.

**Quels outils utiliser ?**
Google Search Console (gratuit), Ahrefs ou SEMrush, Screaming Frog, PageSpeed Insights.""",
    },
    {
        "title": "Les documents indispensables pour vendre un site internet",
        "category": "juridique",
        "seo_slug": "documents-vente-site-internet",
        "seo_title": "Documents indispensables pour vendre un site internet en France",
        "seo_description": "Quels documents faut-il préparer pour vendre un site internet ? Contrats, justificatifs, protocole de cession : la liste complète pour une vente légale et sécurisée.",
        "seo_keywords": ["contrat vente site internet", "documents vente site", "protocole cession site", "juridique vente site"],
        "geo_keywords": ["vendre site internet France", "contrat cession site France"],
        "aeo_questions": [
            {"question": "Quel contrat pour vendre un site internet ?", "answer": "La vente d'un site internet nécessite un protocole de cession (ou acte de vente de fonds de commerce digital) qui détaille le prix, les actifs cédés, les garanties et les conditions de transfert. Ce document doit être signé par les deux parties."},
            {"question": "Faut-il un notaire pour vendre un site internet ?", "answer": "Non, un notaire n'est pas obligatoire pour la vente d'un site internet. Un protocole de cession rédigé par un avocat ou validé par les deux parties suffit. La Citadelle Numérique fournit un modèle de contrat avec chaque transaction."},
        ],
        "excerpt": "Préparer les bons documents est essentiel pour vendre votre site internet en toute légalité. Voici la liste complète des justificatifs à réunir avant la mise en vente.",
        "content_md": """# Les documents indispensables pour vendre un site internet

Une **vente de site internet** sans les bons documents, c'est une vente risquée pour les deux parties. Voici la liste complète des documents à préparer pour sécuriser votre transaction en France.

---

## Documents financiers

Ces pièces prouvent la réalité et la régularité de vos revenus :

- **Relevés de revenus sur 12-24 mois** : captures Stripe, PayPal, Google AdSense, Amazon Associates
- **Factures clients** : si vous avez des clients récurrents (BtoB)
- **Compte de résultat simplifié** : revenus – charges = bénéfice net mensuel
- **Relevés bancaires** : pour valider les virements réels

---

## Documents techniques

Ces éléments prouvent la propriété et facilitent le transfert :

- **Accès registrar du domaine** (Gandi, OVH, Namecheap...) — le domaine doit être transférable
- **Accès hébergement** (cPanel, Plesk, serveur dédié)
- **Codes source et bases de données** : zip à jour du site
- **Liste des plugins, thèmes et licences** premium

---

## Documents marketing et trafic

- **Accès en lecture à Google Analytics / GA4** sur 24 mois
- **Google Search Console** : positions, trafic, erreurs
- **Statistiques réseaux sociaux** : followers, engagement
- **Base email** : nombre d'abonnés, taux d'ouverture, outil utilisé

---

## Documents juridiques

- **Mentions légales et CGV** : doivent être conformes au RGPD
- **Politique de confidentialité** à jour
- **Contrats en cours** : affiliés, fournisseurs, prestataires
- **Marque déposée** (si applicable) : titre INPI

---

## Le protocole de cession

C'est le contrat principal de la vente. Il doit mentionner :

1. Identité des parties (vendeur et acheteur)
2. Description précise des actifs cédés (domaine, code, contenu, comptes...)
3. Prix de vente et modalités de paiement
4. Garanties du vendeur (origine licite, pas de dettes cachées)
5. Conditions de transfert et délais
6. Clause de non-concurrence (durée, périmètre)

---

## FAQ — Documents vente site internet

**Quel contrat pour vendre un site internet ?**
Un protocole de cession qui liste les actifs, le prix, les garanties et les conditions de transfert.

**Faut-il un notaire ?**
Non, un protocole de cession entre particuliers ou professionnels suffit. La Citadelle Numérique fournit un modèle avec chaque transaction.""",
    },
    {
        "title": "Comment sécuriser une vente de site internet ?",
        "category": "securite",
        "seo_slug": "securiser-vente-site-internet",
        "seo_title": "Comment sécuriser une vente de site internet ? Anti-fraude et séquestre",
        "seo_description": "Protégez-vous contre les fraudes lors de la vente d'un site internet. Système de séquestre, vérifications anti-fraude et bonnes pratiques pour une transaction sécurisée.",
        "seo_keywords": ["paiement sécurisé", "vente sécurisée site internet", "séquestre", "fraude vente site"],
        "geo_keywords": ["vente sécurisée France", "séquestre France"],
        "aeo_questions": [
            {"question": "Comment sécuriser une vente de site internet ?", "answer": "Pour sécuriser la vente d'un site internet, utilisez impérativement un système de séquestre : l'acheteur paie, les fonds sont bloqués chez un tiers de confiance, vous transmettez les accès, le tiers valide et vous libère les fonds. N'envoyez jamais les accès avant réception du paiement sécurisé."},
            {"question": "Qu'est-ce qu'un séquestre pour vente de site ?", "answer": "Un séquestre est un mécanisme où un tiers de confiance (la plateforme) détient les fonds de l'acheteur pendant le transfert des accès. Les fonds ne sont libérés au vendeur qu'après validation du transfert. C'est le standard de sécurité pour toute cession de site internet."},
        ],
        "excerpt": "Fraudes, impayés, récupération des accès : les risques sont réels dans la vente de sites internet. Voici comment vous protéger efficacement.",
        "content_md": """# Comment sécuriser une vente de site internet ?

La vente d'un site internet expose vendeur et acheteur à des risques réels : fraude au paiement, récupération des accès, faux acheteurs. Voici les bonnes pratiques pour une **vente sécurisée**.

---

## Le risque principal : l'ordre de transfert

Le scénario catastrophe :
- Vous transférez les accès au site
- L'acheteur annule son virement / charge-back
- Vous avez perdu votre site ET votre argent

**Règle absolue : ne jamais transférer les accès avant d'avoir les fonds sécurisés.**

---

## La solution : le séquestre

Le **séquestre** (ou escrow) est le mécanisme de protection standard dans toute cession de site web sérieuse :

1. L'acheteur envoie les fonds sur un compte séquestre tiers
2. Le vendeur vérifie que les fonds sont bien reçus
3. Le vendeur transfère les accès
4. Le tiers de confiance vérifie que les accès sont valides
5. Les fonds sont libérés au vendeur

Sur **La Citadelle Numérique**, ce processus est automatisé et sécurisé par Stripe. Aucune manipulation manuelle d'argent.

---

## Identifier les signaux d'alerte côté acheteur

Méfiez-vous si l'acheteur :
- Propose de payer par Western Union, MoneyGram ou crypto sans raison
- Demande les accès avant le paiement ("pour vérifier")
- Presse à l'extrême pour une décision rapide
- Refuse d'utiliser un séquestre officiel
- A un profil récent sans historique de transactions

---

## Identifier les signaux d'alerte côté vendeur

Méfiez-vous si le vendeur :
- Refuse de donner accès à Google Analytics
- Fournit des captures d'écran non vérifiables (facilement falsifiables)
- Presse pour une décision rapide avec une "autre offre en cours"
- Ne peut pas justifier les revenus par des virements bancaires réels

---

## Les protections contractuelles

Votre protocole de cession doit inclure :
- **Clause de garantie d'éviction** : le vendeur certifie être propriétaire légitime
- **Clause de non-concurrence** : le vendeur ne peut pas recréer le même site
- **Clause de garantie de passif** : protection contre les dettes cachées

---

## FAQ — Sécuriser une vente de site

**Comment sécuriser une vente de site internet ?**
Utilisez un séquestre : l'acheteur paie d'abord, vous transférez les accès ensuite.

**Qu'est-ce qu'un séquestre ?**
Un mécanisme où un tiers de confiance bloque les fonds jusqu'à validation du transfert des accès.""",
    },
    {
        "title": "Comment transférer un nom de domaine après une vente ?",
        "category": "migration",
        "seo_slug": "transfert-nom-de-domaine-vente-site",
        "seo_title": "Comment transférer un nom de domaine après la vente d'un site ?",
        "seo_description": "Guide pratique pour transférer un nom de domaine à un nouvel acheteur sans erreur. Déverrouillage, code EPP, délais et points de vigilance.",
        "seo_keywords": ["transfert nom de domaine", "transfert DNS", "déplacer domaine", "code EPP transfert"],
        "geo_keywords": ["transfert nom de domaine France", "OVH Gandi transfert"],
        "aeo_questions": [
            {"question": "Comment transférer un nom de domaine ?", "answer": "Pour transférer un nom de domaine : 1) Déverrouillez le domaine chez votre registrar, 2) Obtenez le code de transfert (EPP/AuthInfo), 3) Transmettez ce code à l'acheteur, 4) L'acheteur initie le transfert depuis son registrar, 5) Validez la demande par email. Le transfert prend 5 à 7 jours."},
            {"question": "Combien de temps prend un transfert de domaine ?", "answer": "Un transfert de nom de domaine prend généralement 5 à 7 jours ouvrés. Pour les .fr (AFNIC), le délai est souvent de 48 à 72 heures. Pendant ce délai, le site reste accessible normalement."},
        ],
        "excerpt": "Le transfert de domaine est une étape critique lors de la vente d'un site. Suivez ce guide pas-à-pas pour éviter les erreurs et les blocages.",
        "content_md": """# Comment transférer un nom de domaine après une vente ?

Le **transfert de nom de domaine** est souvent l'étape qui stresse le plus les deux parties lors d'une cession de site. Pourtant, avec la bonne méthode, c'est simple et sécurisé.

---

## Les étapes du transfert de domaine

### Étape 1 : Déverrouiller le domaine

Chez votre registrar (OVH, Gandi, Namecheap...), accédez à la gestion de votre domaine et **désactivez le verrou de transfert** (Transfer Lock / WHOIS Lock).

> ⏱️ Attention : si vous venez de renouveler le domaine ou de faire un changement WHOIS récent, certains registrars imposent un délai de 60 jours avant de permettre le transfert.

### Étape 2 : Récupérer le code de transfert (EPP / AuthInfo)

Dans la gestion de votre domaine, demandez le **code d'autorisation de transfert** (appelé code EPP, AuthInfo ou Auth Code selon le registrar).

Ce code est généralement envoyé par email au contact propriétaire du domaine.

### Étape 3 : Transmettre le code à l'acheteur

Transmettez le code à l'acheteur. Il initie le transfert depuis son propre registrar en indiquant le code EPP.

> ⚠️ Ne transmettez ce code qu'**après avoir reçu les fonds sécurisés** (séquestre). Avec le code EPP, l'acheteur peut initier le transfert.

### Étape 4 : Valider le transfert

Vous recevrez un email de votre registrar actuel vous demandant de valider ou rejeter le transfert. **Validez-le** pour accélérer la procédure (sinon elle se déclenche automatiquement après 5 jours).

### Étape 5 : Confirmer la réception

L'acheteur reçoit une confirmation quand le domaine est bien transféré sur son compte. Le processus complet prend 5 à 7 jours.

---

## Points de vigilance

- **Email du contact WHOIS** : l'email de validation doit être accessible. Si vous avez utilisé la protection WHOIS, vérifiez que vous recevez bien les emails du registrar.
- **Délai de 60 jours** : un domaine récemment transféré ou modifié ne peut pas être re-transféré pendant 60 jours (ICANN).
- **DNS vs Registrar** : le transfert de domaine est différent du changement de DNS. L'acheteur peut faire pointer le DNS vers son hébergement avant même que le transfert soit terminé.

---

## FAQ — Transfert de domaine

**Comment transférer un nom de domaine ?**
Déverrouillez le domaine, obtenez le code EPP, transmettez-le à l'acheteur, validez le transfert.

**Combien de temps ça prend ?**
5 à 7 jours en général. Pour les .fr, souvent 48 à 72 heures.""",
    },
    {
        "title": "Comment migrer un hébergement sans perte SEO ?",
        "category": "migration",
        "seo_slug": "migrer-hebergement-sans-perte-seo",
        "seo_title": "Comment migrer un hébergement web sans perdre son référencement Google ?",
        "seo_description": "Guide complet pour changer d'hébergement web sans perdre son référencement SEO. Checklist technique, redirections 301, monitoring post-migration.",
        "seo_keywords": ["migration hébergement", "migration SEO", "changer hébergement sans perte SEO", "migration serveur"],
        "geo_keywords": ["migration hébergement France", "hébergeur web France"],
        "aeo_questions": [
            {"question": "Comment migrer un site sans perdre son SEO ?", "answer": "Pour migrer un hébergement sans perdre le SEO : 1) Clonez le site sur le nouvel hébergeur, 2) Testez via le fichier hosts avant de changer les DNS, 3) Changez les DNS et attendez la propagation, 4) Vérifiez Google Search Console 48h après pour détecter toute anomalie."},
            {"question": "La migration d'hébergement affecte-t-elle le SEO ?", "answer": "Une migration d'hébergement bien réalisée n'affecte pas le SEO. L'impact est temporaire (quelques heures à 48h de propagation DNS) si les URLs, le contenu et la structure du site restent identiques."},
        ],
        "excerpt": "Changer d'hébergeur web peut faire peur pour votre référencement. Suivez cette méthode éprouvée pour migrer sans perdre une seule position Google.",
        "content_md": """# Comment migrer un hébergement sans perte SEO ?

Lors d'une acquisition de site, l'acheteur souhaite souvent migrer l'hébergement sur sa propre infrastructure. Si cette migration est mal réalisée, elle peut provoquer une perte temporaire (ou permanente) de trafic organique. Voici comment l'éviter.

---

## Avant la migration : préparez-vous

1. **Sauvegardez tout** : fichiers + base de données + emails
2. **Documentez la configuration actuelle** : version PHP, extensions, configuration serveur
3. **Relevez les DNS actuels** : A, CNAME, MX, TXT (utilisez whatsmydns.net)
4. **Choisissez un moment creux** : nuit ou weekend, quand le trafic est minimal

---

## Étape 1 : Clonez le site sur le nouvel hébergeur

Sans toucher au site en production :

1. Exportez la base de données (MySQL dump)
2. Téléchargez tous les fichiers via FTP/SFTP
3. Importez la base sur le nouvel hébergeur
4. Uploadez les fichiers et configurez le vhost
5. Mettez à jour les fichiers de configuration (wp-config.php, .env...)

---

## Étape 2 : Testez avant de changer les DNS

**Modifiez votre fichier hosts** pour faire pointer le domaine vers le nouvel hébergeur sur votre machine uniquement :

```
185.x.x.x  votre-domaine.fr www.votre-domaine.fr
```

Naviguez sur le site et vérifiez :
- Pages s'affichent correctement
- Formulaires fonctionnent
- Emails envoyés correctement
- Certificat SSL valide (Let's Encrypt ou équivalent)

---

## Étape 3 : Réduisez le TTL DNS avant la bascule

48h avant de changer les DNS, **réduisez le TTL à 300 secondes** (5 minutes). Ainsi, la propagation sera ultra-rapide lors du changement réel.

---

## Étape 4 : Changez les DNS

Modifiez les enregistrements A chez votre registrar pour pointer vers l'IP du nouvel hébergeur. La propagation prend de quelques minutes à 48h.

Pendant la propagation : les deux serveurs doivent avoir le même contenu (pas de modifications entre les deux).

---

## Étape 5 : Monitoring post-migration

Dans les 48h suivant la migration :

- **Google Search Console** : vérifiez les erreurs d'indexation
- **Google Analytics** : comparez le trafic avec la semaine précédente
- **Uptime monitoring** : configurez une alerte si le site est inaccessible
- **PageSpeed Insights** : comparez les scores avant/après

---

## FAQ — Migration hébergement

**Comment migrer sans perdre son SEO ?**
Clonez sur le nouvel hébergeur, testez via le fichier hosts, changez les DNS avec un TTL réduit, surveillez Google Search Console.

**La migration affecte-t-elle le SEO ?**
Non si elle est bien réalisée. Les URLs, le contenu et la structure restent identiques.""",
    },
    {
        "title": "Acheter un site ou le créer : que choisir ?",
        "category": "acheter-un-site",
        "seo_slug": "acheter-ou-creer-un-site-internet",
        "seo_title": "Acheter un site internet ou le créer : comparatif complet 2026",
        "seo_description": "Vaut-il mieux acheter un site existant ou en créer un de zéro ? Comparatif complet des avantages, inconvénients et ROI de chaque approche.",
        "seo_keywords": ["acheter site internet", "créer site internet", "acquisition site vs création"],
        "geo_keywords": ["acheter site internet France", "investissement digital France"],
        "aeo_questions": [
            {"question": "Vaut-il mieux acheter un site internet ou le créer ?", "answer": "Acheter un site existant permet de générer des revenus dès le premier mois et d'éviter les 12-24 mois de phase de lancement. Créer un site coûte moins cher mais demande du temps et de l'expertise. Pour un retour sur investissement rapide, l'achat d'un site établi est généralement plus efficace."},
        ],
        "excerpt": "Créer son site ou en acheter un existant ? Ce comparatif vous aidera à prendre la bonne décision selon votre profil, vos compétences et vos objectifs.",
        "content_md": """# Acheter un site ou le créer : que choisir ?

C'est la question que se posent de nombreux entrepreneurs digitaux : vaut-il mieux **acheter un site internet** existant ou en créer un de zéro ? Les deux approches ont leurs avantages. Voici un comparatif objectif.

---

## Acheter un site existant

### ✅ Les avantages

- **Revenus immédiats** : le site génère déjà des revenus dès le premier mois
- **Trafic établi** : plus besoin d'attendre 12-24 mois de montée en puissance SEO
- **Historique prouvé** : les données financières et de trafic sont vérifiables
- **Base clients existante** : liste email, abonnés, clients récurrents
- **Moindre risque** : un site qui fonctionne a prouvé son modèle

### ❌ Les inconvénients

- **Investissement initial plus élevé** : un site rentable se paye
- **Héritage technique** : vous reprenez le code et l'historique SEO
- **Risques cachés** : pénalités passées, dette technique, problèmes juridiques

---

## Créer un site de zéro

### ✅ Les avantages

- **Coût de démarrage faible** : quelques centaines d'euros d'hébergement
- **Contrôle total** : vous choisissez la niche, la stack, l'architecture
- **Valeur à la revente** : vous pourrez le vendre plus tard à un multiple élevé
- **Apprentissage** : vous maîtrisez tous les aspects du business

### ❌ Les inconvénients

- **Temps long avant les premiers revenus** : 12 à 24 mois minimum pour un site de contenu
- **Risque d'échec élevé** : 80% des nouveaux sites ne deviennent jamais rentables
- **Compétences requises** : SEO, technique, contenu, marketing...
- **Incertitude** : aucune garantie que le modèle fonctionnera

---

## Le ROI comparé

| Critère | Acheter | Créer |
|---|---|---|
| Revenus mois 1 | Immédiats | 0 € |
| Revenus mois 12 | Stables | Incertains |
| Investissement initial | 10 000 – 100 000 € | 500 – 3 000 € |
| ROI amortissement | 18-36 mois | 24-48 mois si succès |
| Risque | Moyen | Élevé |

---

## Notre recommandation

**Vous êtes entrepreneur expérimenté avec du capital ?** → Achetez un site existant. Vous achetez du temps et de la certitude.

**Vous débutez et avez peu de budget ?** → Créez d'abord un petit site pour apprendre, puis utilisez les revenus pour acheter un site plus grand.

**Vous souhaitez diversifier votre patrimoine digital ?** → L'achat d'un site rentable est l'équivalent d'un investissement immobilier locatif, mais avec un meilleur ROI potentiel.""",
    },
    {
        "title": "Les KPI indispensables avant d'acheter un business digital",
        "category": "business",
        "seo_slug": "kpi-avant-acheter-business-digital",
        "seo_title": "Les 12 KPI essentiels à analyser avant d'acheter un business digital",
        "seo_description": "Quels indicateurs financiers et marketing analyser avant d'acquérir un business digital ? Les 12 KPI indispensables pour prendre une décision éclairée.",
        "seo_keywords": ["KPI business digital", "analyse site internet", "due diligence acquisition", "indicateurs achat site"],
        "geo_keywords": ["acquisition business digital France", "investissement site internet France"],
        "aeo_questions": [
            {"question": "Quels KPI analyser avant d'acheter un site internet ?", "answer": "Les KPI essentiels sont : MRR/ARR (revenus récurrents), taux de churn, CAC (coût d'acquisition), LTV (valeur vie client), taux de conversion, sessions organiques, taux de rebond, marges nettes, et concentration des revenus (risque client unique)."},
        ],
        "excerpt": "Avant d'acquérir un business digital, ces 12 indicateurs vous diront si l'investissement est solide ou risqué. Ne les ignorez pas.",
        "content_md": """# Les KPI indispensables avant d'acheter un business digital

La **due diligence** (vérification approfondie) d'un business digital repose sur l'analyse d'indicateurs précis. Voici les **12 KPI essentiels** à exiger avant toute acquisition.

---

## KPI Financiers

### 1. MRR / ARR (pour les SaaS et abonnements)
- **MRR** = Monthly Recurring Revenue (revenus récurrents mensuels)
- **ARR** = MRR × 12
- Tendance sur 12 mois : en hausse ou en baisse ?

### 2. Bénéfice net mensuel moyen
- Sur les 12 derniers mois minimum
- Vérifiez les mois atypiques (pics ou creux)

### 3. Marges nettes
- Idéalement > 60% pour un business digital pur
- Vérifiez les charges récurrentes cachées

### 4. Taux de churn (pour les SaaS/abonnements)
- < 2%/mois = excellent
- 5%/mois = problématique (le site perd ses clients)

### 5. CAC — Coût d'Acquisition Client
- Combien coûte l'acquisition d'un nouveau client ?
- Comparez avec la LTV pour calculer le ratio LTV/CAC (> 3 = sain)

### 6. LTV — Lifetime Value
- Valeur moyenne d'un client sur toute sa durée de vie
- LTV = Panier moyen × Fréquence × Durée de rétention

---

## KPI Trafic et Marketing

### 7. Sessions organiques mensuelles
- Volume et tendance sur 24 mois (Google Analytics)
- Diversification des sources (SEO, direct, social, email)

### 8. Taux de conversion
- Visiteurs → Leads → Clients
- Un taux faible peut signifier un problème d'offre ou d'UX

### 9. Taux de rebond
- < 50% = engagement correct
- > 75% = problème de ciblage ou d'expérience

### 10. Taille et qualité de la liste email
- Nombre d'abonnés actifs
- Taux d'ouverture moyen (> 20% = correct)

---

## KPI de Risque

### 11. Concentration des revenus
- Un client représente > 30% des revenus = risque élevé
- Un canal représente > 80% du trafic = risque élevé

### 12. Dépendance technologique
- Le business dépend-il d'une API ou d'une plateforme tierce ?
- Que se passe-t-il si cette plateforme ferme ou change ses CGU ?

---

## Comment collecter ces KPI ?

Exigez du vendeur :
- Accès Google Analytics / GA4 (lecture seule)
- Export des données de revenus (Stripe, PayPal)
- Accès Google Search Console
- Tableau de bord de l'outil emailing (Mailchimp, ActiveCampaign...)""",
    },
    {
        "title": "Comment préparer son site internet à la vente ?",
        "category": "vendre-un-site",
        "seo_slug": "preparer-site-internet-a-la-vente",
        "seo_title": "Comment préparer son site internet à la vente ? Guide 6 mois avant",
        "seo_description": "Les actions à réaliser 3 à 6 mois avant de vendre votre site pour maximiser sa valeur. Optimisation SEO, finances, documentation : notre checklist complète.",
        "seo_keywords": ["préparer vente site internet", "optimiser valeur site", "vendre son business digital", "maximiser prix vente site"],
        "geo_keywords": ["vendre un site internet France", "préparer une cession de site"],
        "aeo_questions": [
            {"question": "Comment préparer un site à la vente ?", "answer": "Pour préparer la vente de votre site, commencez 6 mois avant : stabilisez vos revenus, documentez vos processus, optimisez vos charges, améliorez vos performances techniques et constituez votre dossier de vente (Analytics, revenus, contrats)."},
            {"question": "Que faire avant de vendre son site ?", "answer": "6 mois avant la vente : diversifiez vos sources de revenus, réduisez les charges inutiles, documentez tous vos processus, mettez à jour les mentions légales et préparez vos justificatifs financiers sur 24 mois."},
            {"question": "Comment augmenter la valeur d'un site internet ?", "answer": "Pour augmenter la valeur de votre site : diversifiez les sources de trafic et de revenus, automatisez les processus, créez une liste email, améliorez les marges en réduisant les charges, et documentez tout pour faciliter la reprise."},
        ],
        "excerpt": "La préparation est la clé d'une vente réussie. Voici toutes les actions à réaliser 3 à 6 mois avant de mettre votre site en vente pour en maximiser le prix.",
        "content_md": """# Comment préparer son site internet à la vente ?

Les propriétaires qui obtiennent les meilleurs prix de vente ne se réveillent pas un matin en décidant de vendre. Ils **préparent leur site 3 à 6 mois à l'avance**. Voici comment faire.

---

## 6 mois avant la vente

### Stabilisez vos revenus

C'est le signal le plus important pour les acheteurs. Un site avec 6 mois de revenus stables ou en hausse se valorisera beaucoup mieux qu'un site en baisse.

- Identifiez et corrigez les sources d'instabilité
- Évitez les changements majeurs (refonte, changement de niche)
- Documentez chaque mois dans un tableau simple

### Diversifiez vos sources de revenus

Un site monodépendant (ex: 100% AdSense) est moins valorisé. Ajoutez :
- Affiliation
- Produits digitaux (ebooks, templates)
- Abonnements ou membres premium
- Services complémentaires

### Réduisez les charges superflues

Passez en revue tous vos abonnements :
- Outils SaaS inutilisés
- Hébergement surdimensionné
- Services premium non essentiels

Chaque euro de charges économisé augmente directement votre bénéfice net et donc votre valorisation.

---

## 3 mois avant la vente

### Documentez vos processus

Rédigez des procédures simples pour toutes les tâches récurrentes :
- Comment créer un article / fiche produit
- Comment gérer les demandes clients
- Liste des fournisseurs et contacts
- Calendrier éditorial

> 🎯 Un site bien documenté permet à l'acheteur de démarrer le lendemain de la transaction. C'est un argument de valorisation fort.

### Nettoyez la technique

- Mettez à jour WordPress / plugins / thèmes
- Corrigez les erreurs Google Search Console
- Améliorez le score PageSpeed (mobile prioritaire)
- Vérifiez et renouvelez le certificat SSL

### Mettez à jour vos documents légaux

- Mentions légales à jour (SIRET, adresse, nom du responsable)
- Politique de confidentialité conforme RGPD
- CGV si vous vendez des produits ou services

---

## 1 mois avant la mise en vente

### Constituez votre dossier de vente

Préparez en avance :
- ✅ Accès Google Analytics / GA4 (lecteur)
- ✅ Captures de revenus sur 24 mois
- ✅ Compte de résultat simplifié
- ✅ Liste des outils et leurs coûts
- ✅ Accès registrar et hébergeur préparés (déverrouillage)

### Définissez votre prix

Utilisez la méthode du multiple :
- Calculez votre bénéfice net mensuel moyen sur 12 mois
- Appliquez un multiple réaliste (20x à 36x selon la qualité)
- Prévoyez une marge de négociation de 10 à 15%

---

## FAQ — Préparer son site à la vente

**Comment préparer un site à la vente ?**
Commencez 6 mois avant : stabilisez les revenus, diversifiez, documentez, optimisez les charges et constituez votre dossier financier.

**Comment augmenter la valeur d'un site ?**
Diversifiez les revenus et le trafic, automatisez les processus, créez une liste email, réduisez les charges fixes et documentez tout.

**Que faire avant de vendre son site ?**
Préparez un dossier complet (Analytics, revenus 24 mois, documentation), corrigez les problèmes techniques et mettez vos documents légaux à jour.""",
    },
]


def build_slug(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text).strip("-")
    return text or "article"


def main():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db["citadelle_blog_posts"]

    inserted = 0
    skipped = 0

    for article in ARTICLES:
        slug = article.get("seo_slug") or build_slug(article["title"])

        # Éviter les doublons
        if collection.find_one({"slug": slug}):
            print(f"  ⚠️  Ignoré (existe déjà) : {slug}")
            skipped += 1
            continue

        doc = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            "title": article["title"],
            "excerpt": article.get("excerpt", ""),
            "content_md": article["content_md"],
            "category": article["category"],
            "author_name": AUTHOR,
            "partner_link": None,
            "cover_image_url": None,
            "is_published": True,
            "scheduled_at": None,
            "published_at": NOW,
            "seo_title": article.get("seo_title"),
            "seo_description": article.get("seo_description"),
            "seo_keywords": article.get("seo_keywords", []),
            "geo_keywords": article.get("geo_keywords", []),
            "aeo_questions": article.get("aeo_questions", []),
            "view_count": 0,
            "created_at": NOW,
            "updated_at": NOW,
        }

        collection.insert_one(doc)
        del doc["_id"]
        inserted += 1
        print(f"  ✅ Inséré : {article['title']}")

    print(f"\n✅ Import terminé — {inserted} articles insérés, {skipped} ignorés.")
    client.close()


if __name__ == "__main__":
    main()
