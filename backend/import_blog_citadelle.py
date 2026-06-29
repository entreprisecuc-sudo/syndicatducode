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
    {
        "title": "Comment vendre une application mobile ?",
        "category": "vente-applications",
        "seo_slug": "comment-vendre-une-application-mobile",
        "seo_title": "Comment vendre une application mobile ? Guide complet iOS & Android 2026",
        "seo_description": "Guide complet pour vendre une application iOS ou Android : valorisation, transfert App Store / Google Play, due diligence et sécurisation de la transaction.",
        "seo_keywords": ["vendre une application mobile", "vendre une application Android", "vendre une application iOS", "céder une application"],
        "geo_keywords": ["vendre une application France", "vendre une application Paris"],
        "aeo_questions": [
            {"question": "Peut-on vendre une application mobile ?", "answer": "Oui, il est tout à fait possible de vendre une application mobile iOS ou Android. Le processus implique le transfert du compte développeur (App Store Connect ou Google Play Console), du code source, des données utilisateurs et des revenus associés. La transaction s'effectue généralement via une marketplace spécialisée avec séquestre sécurisé."},
            {"question": "Comment vendre une application mobile ?", "answer": "Pour vendre votre application mobile : 1) Calculez sa valeur (multiple du bénéfice net mensuel × 20 à 40), 2) Préparez votre dossier (revenus, nombre d'utilisateurs actifs, avis App Store), 3) Publiez sur une marketplace comme La Citadelle Numérique, 4) Transférez le compte développeur et le code source via séquestre."},
        ],
        "excerpt": "Les applications mobiles sont parmi les actifs digitaux les plus recherchés. Découvrez comment valoriser et vendre votre app iOS ou Android au meilleur prix.",
        "content_md": """# Comment vendre une application mobile ?

Les **applications mobiles** représentent une catégorie d'actifs digitaux très prisée. Un business app bien construit peut se vendre plusieurs dizaines voire centaines de milliers d'euros. Voici le guide complet pour **vendre votre application iOS ou Android**.

---

## Les métriques clés d'une application mobile

Avant de **céder votre application**, maîtrisez ces indicateurs :

- **DAU** (Daily Active Users) : utilisateurs actifs quotidiens
- **MAU** (Monthly Active Users) : utilisateurs actifs mensuels
- **Rétention J1 / J7 / J30** : % d'utilisateurs qui reviennent après 1, 7 et 30 jours
- **ARPU** (Average Revenue Per User) : revenus moyens par utilisateur
- **MRR** (Monthly Recurring Revenue) : si l'app a des abonnements
- **Note App Store / Google Play** : moyenne des avis (idéalement > 4/5)
- **Nombre d'avis** : signe de maturité et d'engagement

---

## Comment valoriser une application mobile ?

La valorisation dépend du **modèle économique** de l'application :

### Application avec abonnements (SaaS mobile)
**Valeur = MRR × Multiple (24x à 60x)**

### Application avec achats in-app ou revenus publicitaires
**Valeur = Bénéfice net mensuel moyen × Multiple (20x à 40x)**

| Profil de l'app | Multiple typique |
|---|---|
| App récente (< 1 an), revenus instables | 12x – 20x |
| App établie, bonne rétention | 24x – 36x |
| App premium (3+ ans, forte marque) | 36x – 60x |

---

## Ce que les acheteurs vérifient

1. **Accès aux dashboards** : App Store Connect ou Google Play Console
2. **Revenus vérifiables** : captures Stripe, Apple / Google payouts
3. **Code source propre** : documentation, architecture, dette technique
4. **Conformité RGPD** : politique de confidentialité, permissions
5. **Abonnements actifs** : taux de renouvellement, churn
6. **Dépendances tierces** : APIs, SDK, services cloud

---

## Le processus de transfert

### Sur l'App Store (iOS)
Le transfert d'une application iOS se fait via **App Store Connect → Transfert d'application**. L'acheteur doit avoir un compte Apple Developer actif. Le processus prend 1 à 7 jours ouvrés.

> ⚠️ Les avis et notes sont **conservés** lors d'un transfert App Store. C'est un actif précieux à valoriser.

### Sur le Google Play Store (Android)
Le transfert s'effectue depuis la **Google Play Console**. Il est possible de transférer l'application vers un autre compte Google, en conservant l'historique des téléchargements et les avis.

### Le code source
Le code source (dépôt GitHub, GitLab ou ZIP) doit être transmis **après les fonds sécurisés** via séquestre. Incluez :
- Le code source complet (iOS Swift/Kotlin/React Native...)
- Les fichiers de configuration (sans clés API en dur)
- Les fichiers d'assets (icônes, images, sons)
- La documentation technique si elle existe

---

## Préparez votre dossier de vente

Constituez ces éléments avant de mettre votre application en vente :

- ✅ Captures des revenus sur 12 mois (Apple / Google / Stripe)
- ✅ Export des statistiques App Store Connect / Play Console
- ✅ Politique de confidentialité conforme RGPD
- ✅ Liste des dépendances tierces et leurs coûts
- ✅ Guide de déploiement (comment republier une mise à jour)

---

## FAQ — Vendre une application mobile

**Peut-on vendre une application mobile ?**
Oui, Apple et Google permettent tous deux le transfert d'applications via leurs consoles développeur.

**Comment vendre une application Android ?**
Via la Google Play Console : allez dans Configuration → Transfert d'application vers un autre compte.

**Comment vendre une application iOS ?**
Via App Store Connect : Mes apps → sélectionnez l'app → Informations générales → Transfert d'application.""",
    },
    {
        "title": "Comment vendre une chaîne YouTube rentable ?",
        "category": "reseaux-sociaux",
        "seo_slug": "comment-vendre-une-chaine-youtube",
        "seo_title": "Comment vendre une chaîne YouTube rentable ? Guide complet 2026",
        "seo_description": "Les critères de valorisation d'une chaîne YouTube, les règles de transfert et les précautions à prendre pour vendre votre média digital en toute sécurité.",
        "seo_keywords": ["vendre chaîne YouTube", "vendre compte YouTube", "vendre média digital"],
        "geo_keywords": ["vendre chaîne YouTube France"],
        "aeo_questions": [
            {"question": "Peut-on vendre une chaîne YouTube ?", "answer": "Techniquement oui, mais les CGU de YouTube interdisent officiellement la vente de chaînes. En pratique, la chaîne se transfère via le changement des accès du compte Google propriétaire. La transaction doit se faire avec précaution et l'aide d'un séquestre pour sécuriser le paiement."},
            {"question": "Comment vendre une chaîne YouTube ?", "answer": "La vente d'une chaîne YouTube se fait en transférant l'accès au compte Google propriétaire. Pour sécuriser la transaction : utilisez un séquestre, signez un protocole de cession, et effectuez le transfert des accès uniquement après réception des fonds sécurisés."},
        ],
        "excerpt": "Une chaîne YouTube monétisée peut valoir plusieurs dizaines de milliers d'euros. Voici comment valoriser et céder votre média digital en toute sécurité.",
        "content_md": """# Comment vendre une chaîne YouTube rentable ?

Une chaîne YouTube avec une audience fidèle et des revenus récurrents est un **actif digital à part entière**. Elle peut se valoriser de quelques milliers à plusieurs centaines de milliers d'euros selon sa niche et ses revenus. Voici comment procéder.

---

## Les critères de valorisation d'une chaîne YouTube

### Métriques financières
- **Revenus AdSense mensuels** : principal critère de valorisation
- **Sponsorings récurrents** : partenariats marques (souvent > AdSense)
- **Merchandising / Produits propres** : revenus complémentaires
- **Memberships YouTube** : abonnements mensuels des fans

### Métriques d'audience
- **Abonnés actifs** : nombre total mais surtout le taux d'engagement
- **Vues mensuelles** : trafic régulier et tendance
- **Watch time** : temps de visionnage total (critère YouTube Premium)
- **CPM** (Cost Per Mille) : revenus pour 1 000 vues (varie par niche)

---

## Comment calculer la valeur d'une chaîne YouTube ?

**Valeur = Bénéfice net mensuel moyen × Multiple (20x à 40x)**

Le multiple dépend de :
- La niche (Finance/Business > Gaming/Lifestyle)
- La récurrence des revenus (sponsorings long terme = valeur plus élevée)
- L'indépendance de la chaîne par rapport à la personnalité du créateur
- La croissance ou la stagnation des vues sur 12 mois

| Profil de la chaîne | Multiple typique |
|---|---|
| Chaîne "personnalité" difficile à transférer | 10x – 18x |
| Chaîne thématique, créateur remplaçable | 20x – 30x |
| Chaîne avec marque forte et communauté fidèle | 30x – 40x |

---

## Points d'attention juridiques

> ⚠️ **Les CGU YouTube interdisent officiellement la cession de chaîne.** En pratique, le marché existe mais vous devez opérer avec prudence.

Risques à anticiper :
- YouTube peut suspendre une chaîne si elle détecte un changement d'accès suspect
- L'historique d'une chaîne "personnalité" est difficile à exploiter
- Les partenariats de sponsoring ne sont pas automatiquement transférables

---

## Le processus de transfert

1. **Changement des accès Google** : l'acheteur récupère les identifiants du compte Google propriétaire de la chaîne
2. **Activation 2FA** sur le nouveau compte sécurisé
3. **Transfert des accès AdSense** vers le compte bancaire de l'acheteur
4. **Communication à la communauté** (optionnel) : annoncer la transition

> 🔒 Ne transmettez les accès qu'après réception des fonds sécurisés via séquestre.

---

## Ce que les acheteurs demandent

- Accès en lecture au tableau de bord YouTube Studio (statistiques)
- Historique AdSense sur 12 mois (captures vérifiables)
- Liste des contrats de sponsoring en cours
- Analyse des sources de revenus (AdSense vs sponsoring vs autres)

---

## FAQ — Vendre une chaîne YouTube

**Peut-on vendre une chaîne YouTube ?**
Oui en pratique, même si les CGU YouTube l'encadrent strictement. Utilisez un séquestre et un protocole de cession.

**Comment vendre une chaîne YouTube ?**
Via le transfert des accès Google, avec séquestre obligatoire pour sécuriser le paiement avant tout transfert d'identifiants.""",
    },
    {
        "title": "Comment vendre un compte Instagram professionnel ?",
        "category": "reseaux-sociaux",
        "seo_slug": "comment-vendre-un-compte-instagram",
        "seo_title": "Comment vendre un compte Instagram professionnel ? Guide et précautions 2026",
        "seo_description": "Les bonnes pratiques pour céder un compte Instagram dans le respect des règles et en limitant les risques. Valorisation, transfert et sécurisation de la transaction.",
        "seo_keywords": ["vendre compte Instagram", "vendre réseau social", "vendre communauté"],
        "geo_keywords": ["vendre compte Instagram France"],
        "aeo_questions": [
            {"question": "Peut-on vendre un compte Instagram ?", "answer": "Les CGU d'Instagram interdisent officiellement la vente de comptes. Cependant, la cession d'un compte Instagram professionnel lié à une marque ou un business est courante sur le marché. La transaction s'effectue via le transfert des accès au compte (email + mot de passe), avec séquestre pour sécuriser le paiement."},
            {"question": "Comment vendre un compte Instagram ?", "answer": "La vente d'un compte Instagram se fait en transférant l'email et le mot de passe associés. Pour sécuriser : 1) Estimez la valeur (followers actifs × taux d'engagement × niche), 2) Signez un protocole de cession, 3) Utilisez un séquestre, 4) Transférez les accès seulement après réception des fonds."},
        ],
        "excerpt": "Un compte Instagram avec une communauté engagée peut valoir plusieurs milliers d'euros. Voici comment évaluer et céder votre compte en limitant les risques.",
        "content_md": """# Comment vendre un compte Instagram professionnel ?

La vente d'un compte Instagram est une pratique courante malgré les restrictions des CGU. Un compte bien ciblé avec une communauté engagée représente un **actif marketing réel** pour les marques et entrepreneurs. Voici comment procéder en minimisant les risques.

---

## Comment valoriser un compte Instagram ?

Contrairement aux sites web, les comptes Instagram ne génèrent pas toujours des revenus directs. La valorisation repose sur le **potentiel marketing** :

### Méthode 1 : Valorisation par l'engagement
**Valeur ≈ Nombre d'abonnés actifs × CPE (Coût par engagement)**

Le CPE varie selon la niche :
- Finance / Investissement : 0,05 à 0,15 € par abonné
- Mode / Beauté : 0,02 à 0,08 € par abonné
- Food / Lifestyle : 0,01 à 0,05 € par abonné

### Méthode 2 : Valorisation par les revenus
Si le compte génère des revenus (placements, abonnements, produits) :
**Valeur = Bénéfice net mensuel × 12 à 24x**

### Facteurs qui font monter la valeur
- Taux d'engagement > 3% (réel, pas gonflé)
- Niche à forte valeur commerciale (B2B, finance, luxe)
- Audience géographique qualifiée (France, Europe)
- Compte vérifié ou ancienneté > 3 ans

---

## Les risques spécifiques à Instagram

> ⚠️ Les CGU de Meta interdisent la vente de comptes. Risques associés :

- Suspension du compte si Meta détecte une activité inhabituelle
- Charge-back possible si l'acheteur conteste le paiement
- Impossibilité de faire valoir ses droits en cas de litige Meta
- Perte de la vérification (badge bleu) lors du transfert

---

## Le processus de transfert sécurisé

1. **Désactivation de la double authentification** (temporairement) sur l'ancien compte
2. **Changement de l'adresse email** vers l'email de l'acheteur
3. **Changement du numéro de téléphone** associé
4. **Transfert du compte publicitaire** Meta Business Manager (si applicable)
5. **Réactivation de la 2FA** sur le nouveau compte sécurisé

---

## Préparez votre dossier

Les acheteurs sérieux demandent :
- Statistiques Instagram Insights (portée, impressions, profil d'audience)
- Historique des partenariats rémunérés (screenshots ou contrats)
- Démonstration de l'engagement organique (pas de fake followers)
- Ancienneté du compte et historique de publications

---

## FAQ — Vendre un compte Instagram

**Peut-on vendre un compte Instagram ?**
Légalement selon les CGU Meta, non. En pratique, c'est possible mais risqué. Utilisez obligatoirement un séquestre.

**Comment vendre un compte Instagram ?**
Transfert de l'email + mot de passe + désactivation/réactivation 2FA, après réception des fonds en séquestre.""",
    },
    {
        "title": "Les pièges juridiques lors de la vente d'un site internet",
        "category": "juridique",
        "seo_slug": "pieges-juridiques-vente-site-internet",
        "seo_title": "Les pièges juridiques lors de la vente d'un site internet en France",
        "seo_description": "Obligations du vendeur, garanties légales et clauses essentielles à prévoir dans un contrat de cession de site internet. Guide juridique complet.",
        "seo_keywords": ["contrat vente site internet", "garantie vendeur", "cession site internet"],
        "geo_keywords": ["droit numérique France"],
        "aeo_questions": [
            {"question": "Quels sont les risques juridiques lors de la vente d'un site ?", "answer": "Les principaux risques juridiques lors de la vente d'un site internet sont : la garantie d'éviction (vendeur pas propriétaire légitime), les vices cachés (problèmes techniques ou SEO dissimulés), les contrats tiers non transférables, la non-conformité RGPD, et les clauses de non-concurrence absentes."},
            {"question": "Quel contrat utiliser pour vendre un site internet ?", "answer": "Pour vendre un site internet, il faut un protocole de cession (ou acte de vente d'actifs digitaux) incluant : description précise des actifs cédés, prix et modalités de paiement, garanties du vendeur (éviction, passif), clause de non-concurrence, délais de transfert et conditions suspensives."},
        ],
        "excerpt": "La vente d'un site internet sans les bonnes protections juridiques peut devenir un cauchemar. Découvrez les pièges les plus fréquents et comment les éviter.",
        "content_md": """# Les pièges juridiques lors de la vente d'un site internet

Beaucoup de transactions de sites internet se font sans aucun document juridique sérieux. C'est une erreur qui peut coûter très cher. Voici les **principaux pièges juridiques** à éviter lors de la vente d'un site en France.

---

## Piège 1 : L'absence de protocole de cession

La plus grande erreur est de conclure la vente sur une simple conversation ou un email. Sans contrat écrit, aucune des deux parties n'est protégée en cas de litige.

**Ce que doit contenir le protocole de cession :**
- Identité complète des parties (vendeur et acheteur)
- Description précise des actifs cédés (domaine, code, contenu, marque, bases de données, comptes sociaux...)
- Prix de vente et modalités de paiement
- Date de transfert et conditions suspensives
- Garanties du vendeur
- Clause de non-concurrence

---

## Piège 2 : La garantie d'éviction non encadrée

Le vendeur doit garantir qu'il est bien le **propriétaire légitime** des actifs cédés et qu'aucun tiers ne peut revendiquer de droits sur le site.

Risques courants :
- Code source contenant des librairies sous licence non commerciale
- Contenu (articles, photos) soumis à des droits d'auteur tiers
- Marque ou nom de domaine faisant l'objet d'une contestation

**Solution :** inclure une clause de garantie d'éviction avec responsabilité financière du vendeur en cas de revendication tierce.

---

## Piège 3 : Les vices cachés numériques

À l'instar des biens physiques, un site peut avoir des **défauts cachés** qui n'apparaissent qu'après la vente :
- Pénalité Google non révélée
- Faux trafic (bot traffic gonflant les statistiques)
- Revenus artificiellement gonflés avant la vente
- Dette technique massive (sécurité, mises à jour critiques)

**Solution :** clause de garantie de conformité avec vérifications préalables documentées.

---

## Piège 4 : Les contrats tiers non transférables

Un site peut être lié à des contrats qui ne peuvent pas être cédés sans accord du tiers :
- Licences logicielles nominatives
- Contrats d'affiliation avec clause de non-cession
- Contrats de prestataires avec clause d'exclusivité vendeur

**Solution :** listez tous les contrats en annexe du protocole avec mention de leur transférabilité.

---

## Piège 5 : La non-conformité RGPD

Si le site collecte des données personnelles (formulaires, newsletter, comptes membres), l'acheteur hérite de **toutes les obligations RGPD** :
- Registre des traitements
- Politique de confidentialité
- Consentements collectés

**Solution :** audit RGPD préalable à la vente, transfert documenté des données et conformité garantie contractuellement.

---

## Piège 6 : L'absence de clause de non-concurrence

Sans clause de non-concurrence, rien n'empêche le vendeur de recréer un site similaire le lendemain et de récupérer ses anciens clients.

**Clause type :**
> "Le cédant s'engage à ne pas exercer directement ou indirectement une activité concurrente à celle du site cédé, dans le même secteur et sur le même territoire géographique, pendant une durée de [2 ans] à compter de la date de cession."

---

## FAQ — Juridique vente site internet

**Quels sont les risques juridiques ?**
Absence de contrat, garantie d'éviction, vices cachés, contrats non transférables, non-conformité RGPD, pas de clause de non-concurrence.

**Quel contrat utiliser ?**
Un protocole de cession d'actifs digitaux rédigé par un avocat ou validé par les deux parties, avec toutes les garanties listées ci-dessus.""",
    },
    {
        "title": "Comment calculer la rentabilité d'un business en ligne ?",
        "category": "business",
        "seo_slug": "calculer-rentabilite-business-en-ligne",
        "seo_title": "Comment calculer la rentabilité d'un business en ligne ? Méthodes et indicateurs",
        "seo_description": "Les indicateurs financiers indispensables pour évaluer la rentabilité d'un site internet ou d'un business digital avant achat ou vente. Formules, exemples et méthodes.",
        "seo_keywords": ["rentabilité site internet", "calcul rentabilité business", "business digital rentable"],
        "geo_keywords": ["rentabilité business digital France"],
        "aeo_questions": [
            {"question": "Comment calculer la rentabilité d'un site internet ?", "answer": "La rentabilité d'un site internet se calcule avec la formule : Rentabilité = (Revenus – Charges) / Investissement × 100. Pour un site acheté, le ROI s'exprime en nombre de mois d'amortissement : Durée d'amortissement = Prix d'achat / Bénéfice net mensuel."},
        ],
        "excerpt": "Avant d'acheter ou de vendre un business digital, maîtriser ses indicateurs financiers est indispensable. Voici les formules et méthodes pour évaluer la vraie rentabilité.",
        "content_md": """# Comment calculer la rentabilité d'un business en ligne ?

Que vous envisagiez d'**acheter un site internet** ou de **vendre votre business digital**, la rentabilité est le critère central. Voici les formules et indicateurs utilisés par les professionnels.

---

## Le Bénéfice Net — Base de tout

**Bénéfice net mensuel = Revenus totaux – Toutes les charges**

Charges à déduire :
- Hébergement et noms de domaine
- Outils SaaS (emailing, SEO, analytics...)
- Rédaction et création de contenu
- Publicité payante (Google Ads, Meta Ads)
- Prestataires et freelances
- Commissions d'affiliation versées

> ⚠️ Ne confondez pas **chiffre d'affaires** et **bénéfice net**. Un site à 10 000 €/mois de CA avec 8 000 € de charges n'est rentable qu'à 2 000 €/mois.

---

## Le SDE — Indicateur standard pour la cession

Le **SDE** (Seller's Discretionary Earnings) est le bénéfice net ajusté : on réintègre la rémunération du dirigeant pour obtenir le revenu réel du business indépendamment de son propriétaire.

**SDE = Bénéfice net + Salaire du dirigeant + Charges exceptionnelles non récurrentes**

C'est sur le SDE que se calcule le prix de vente d'un site ou d'un business digital.

---

## Le ROI — Retour sur investissement

Si vous achetez un site, votre ROI se calcule ainsi :

**ROI annuel = (Bénéfice net annuel / Prix d'achat) × 100**

**Durée d'amortissement = Prix d'achat / Bénéfice net mensuel**

Exemple :
- Site acheté 36 000 €
- Bénéfice net : 1 500 €/mois
- ROI annuel : (18 000 / 36 000) × 100 = **50%**
- Amortissement : 36 000 / 1 500 = **24 mois**

---

## Les marges — Indicateurs de qualité

### Marge brute
**Marge brute = (CA – Coûts variables) / CA × 100**

Un business digital doit viser une marge brute > 60%.

### Marge nette
**Marge nette = Bénéfice net / CA × 100**

Idéalement > 40% pour un site de contenu ou un SaaS.

---

## Le Point Mort — Seuil de rentabilité

**Point mort = Charges fixes / Taux de marge sur coûts variables**

C'est le CA minimum à générer pour couvrir toutes les charges. En dessous : perte. Au-dessus : profit.

---

## Comparaison avec d'autres investissements

| Investissement | Rendement annuel moyen |
|---|---|
| Livret A | 3% |
| SCPI / Immobilier locatif | 4% – 6% |
| Bourse (indice mondial) | 7% – 10% |
| Site internet rentable | **20% – 60%** |

Un site internet bien choisi offre un **rendement 3 à 10 fois supérieur** à l'immobilier locatif.

---

## FAQ — Rentabilité business digital

**Comment calculer la rentabilité d'un site internet ?**
ROI = (Bénéfice net annuel / Prix d'achat) × 100. Un bon site s'amortit en 24 à 36 mois.

**Quel rendement attendre d'un site internet ?**
Entre 20% et 60% par an selon la qualité du site, soit 2 à 5 fois le rendement de l'immobilier.""",
    },
    {
        "title": "Les meilleurs outils pour auditer un site internet",
        "category": "seo",
        "seo_slug": "meilleurs-outils-auditer-site-internet",
        "seo_title": "Les meilleurs outils SEO pour auditer un site internet en 2026",
        "seo_description": "Présentation des logiciels indispensables pour analyser le SEO, les performances, la sécurité et la qualité technique d'un site avant acquisition.",
        "seo_keywords": ["outils audit SEO", "audit technique site internet", "analyse site internet"],
        "geo_keywords": ["outils SEO France"],
        "aeo_questions": [
            {"question": "Quel est le meilleur outil SEO pour auditer un site ?", "answer": "Les meilleurs outils pour auditer un site avant achat sont : Ahrefs ou SEMrush (backlinks, positions), Screaming Frog (crawl technique), Google Search Console (trafic réel), PageSpeed Insights (performances), et Majestic (autorité du domaine). Une combinaison de ces outils donne une vision complète."},
        ],
        "excerpt": "Avant d'acheter un site internet, l'audit est indispensable. Voici les meilleurs outils pour analyser le SEO, les performances et la sécurité d'un site.",
        "content_md": """# Les meilleurs outils pour auditer un site internet

Avant d'acquérir un site internet, un **audit complet** s'impose. Voici les outils indispensables utilisés par les professionnels de l'acquisition de sites web, classés par fonction.

---

## Outils d'analyse SEO et backlinks

### Ahrefs
L'outil de référence pour analyser les backlinks et les positions organiques.
- **Domain Rating (DR)** : mesure de l'autorité du domaine
- **Backlinks** : qualité et provenance des liens entrants
- **Organic Keywords** : mots-clés positionnés et trafic estimé
- **Content Gap** : opportunités vs la concurrence

**Prix** : à partir de 99 $/mois

### SEMrush
Alternative à Ahrefs avec des fonctionnalités marketing avancées.
- Analyse des positions Google sur 12 mois
- Comparaison avec les concurrents
- Audit technique intégré

**Prix** : à partir de 117 €/mois

### Majestic
Spécialisé dans l'analyse de la qualité des backlinks.
- **Trust Flow** : indicateur de confiance du domaine
- **Citation Flow** : volume de liens entrants
- Idéal pour détecter les liens toxiques

**Prix** : à partir de 42 €/mois

---

## Outils de crawl technique

### Screaming Frog SEO Spider
L'outil incontournable pour auditer la structure technique d'un site.
- Détecte les erreurs 404, redirections en chaîne, canonicals incorrects
- Identifie le contenu dupliqué
- Analyse les balises meta (title, description, H1)
- Crawl jusqu'à 500 URLs en version gratuite

**Prix** : 259 £/an pour la version complète

### Sitebulb
Alternative à Screaming Frog avec des rapports visuels.
- Visualisation de l'architecture du site
- Priorisation des corrections par impact SEO
- Analyse de l'accessibilité WCAG

---

## Outils de performance

### Google PageSpeed Insights (Gratuit)
- Score de performance mobile et desktop
- Core Web Vitals (LCP, CLS, FID)
- Recommandations concrètes d'optimisation

### GTmetrix (Freemium)
- Waterfall complet du chargement
- Analyse de chaque requête HTTP
- Comparaison historique des performances

---

## Outils de données gratuites (Essentiels)

### Google Search Console (Gratuit)
**Indispensable et gratuit.** Demandez toujours l'accès lecteur avant toute acquisition.
- Trafic réel sur 16 mois
- Mots-clés qui génèrent des clics
- Erreurs d'indexation et couverture
- Liens internes et externes détectés par Google

### Google Analytics / GA4 (Gratuit)
- Sources de trafic (organique, direct, social, référent)
- Comportement utilisateur (pages vues, durée, rebond)
- Objectifs et conversions

---

## Outils de sécurité

### Sucuri SiteCheck (Gratuit)
Détecte les malwares, blacklistings et problèmes de réputation.

### SSL Labs (Gratuit)
Analyse la configuration SSL/TLS du serveur.

---

## La stack minimale pour un audit sérieux

1. ✅ **Google Search Console** — données réelles gratuites (demandez l'accès)
2. ✅ **Ahrefs ou SEMrush** — backlinks et positions
3. ✅ **Screaming Frog** — crawl technique
4. ✅ **PageSpeed Insights** — performances
5. ✅ **Sucuri SiteCheck** — sécurité

---

## FAQ — Outils audit site internet

**Quel est le meilleur outil SEO ?**
Ahrefs est le plus complet pour l'acquisition. Couplé à Google Search Console (gratuit), il couvre 90% des besoins d'audit.

**Peut-on auditer un site gratuitement ?**
Oui, avec Google Search Console + GA4 + PageSpeed Insights vous obtenez déjà une vision solide.""",
    },
    {
        "title": "Comment vérifier le trafic réel d'un site avant son achat ?",
        "category": "acheter-un-site",
        "seo_slug": "verifier-trafic-reel-site-avant-achat",
        "seo_title": "Comment vérifier le trafic réel d'un site internet avant de l'acheter ?",
        "seo_description": "Méthodes pour détecter le faux trafic, analyser Google Analytics et Google Search Console avant d'acquérir un site internet. Guide anti-arnaque complet.",
        "seo_keywords": ["vérifier trafic site internet", "faux trafic Google Analytics", "audit trafic site achat"],
        "geo_keywords": ["acheter site internet France"],
        "aeo_questions": [
            {"question": "Comment vérifier le trafic d'un site avant de l'acheter ?", "answer": "Pour vérifier le trafic réel d'un site : 1) Demandez un accès lecteur Google Analytics / GA4 et Google Search Console, 2) Comparez avec SimilarWeb (estimation indépendante), 3) Vérifiez le trafic bot dans Analytics (taux de rebond anormal, sessions très courtes), 4) Croisez les données de trafic avec les revenus déclarés."},
        ],
        "excerpt": "Un vendeur peut facilement gonfler ses statistiques de trafic. Voici les méthodes des professionnels pour détecter le faux trafic et valider les données réelles.",
        "content_md": """# Comment vérifier le trafic réel d'un site avant son achat ?

Le **trafic d'un site internet** est son actif principal. Malheureusement, certains vendeurs peu scrupuleux gonflent artificiellement leurs statistiques. Voici comment détecter les manipulations et valider les données réelles.

---

## Étape 1 : Exigez un accès Google Analytics / GA4

C'est non négociable. Tout vendeur sérieux doit vous accorder un **accès "Lecteur"** à son Google Analytics.

Ce que vous devez vérifier :
- **Volume de sessions sur 24 mois** : tendance haussière, stable ou en baisse ?
- **Sources de trafic** : Organique / Direct / Référent / Social / Payant
- **Taux de rebond** : un taux > 90% avec des sessions < 5 secondes est suspect
- **Nouvelles sessions vs récurrentes** : un ratio bizarre peut indiquer du trafic artificiel
- **Géographie** : le trafic vient-il des pays cibles (France si site FR) ou de pays exotiques ?

---

## Étape 2 : Exigez un accès Google Search Console

Google Search Console montre le **trafic organique réel** tel que Google le voit.

Croisez les données :
- Les sessions organiques de GA doivent correspondre aux clics de la Search Console
- Un écart important (ex: 10 000 sessions GA mais 500 clics GSC) = trafic artificiel probable
- Vérifiez les **requêtes qui génèrent des clics** : correspondent-elles à la niche du site ?

---

## Les signaux d'alerte du faux trafic

### Dans Google Analytics
- **Taux de rebond > 95%** avec durée de session < 3 secondes
- **Pays incohérents** : trafic massif d'Inde, du Bangladesh ou des Philippines sur un site en français
- **Sources "Direct" anormalement élevées** (souvent utilisé pour masquer du trafic bot)
- **Heures d'affluence impossibles** : même trafic constant H24, 7j/7

### Techniques de manipulation courantes
- **Trafic acheté** (paid traffic farms) : des milliers de bots visitent le site
- **Échanges de trafic** entre plusieurs propriétaires de sites
- **Auto-clicks** : le propriétaire clique lui-même sur ses propres liens
- **Pixel stuffing** : tracking de pages non vues par de vrais utilisateurs

---

## Étape 3 : Croisez avec SimilarWeb

**SimilarWeb** est un outil tiers qui estime indépendamment le trafic d'un site. Comparez :
- Leur estimation vs les données GA fournies
- Un écart > 50% est un signal d'alerte
- SimilarWeb est précis pour les sites > 5 000 visites/mois

---

## Étape 4 : Croisez trafic et revenus

Le test de cohérence le plus simple :

**Si le site affiche 100 000 visites/mois avec un taux de conversion de 1% et un panier moyen de 30 €, il devrait générer environ 30 000 €/mois. Si les revenus déclarés sont 500 €/mois, quelque chose ne va pas.**

Demandez toujours à faire correspondre :
- Trafic GA → Conversions → Revenus (logique cohérente)
- Revenus GA (si e-commerce) → Revenus Stripe / PayPal (vérifiables)

---

## FAQ — Vérifier le trafic d'un site

**Comment vérifier le trafic d'un site ?**
Accès Google Analytics + Google Search Console + comparaison SimilarWeb + cohérence revenus/trafic.

**Comment détecter le faux trafic ?**
Taux de rebond > 95%, sessions très courtes, pays incohérents, écart GA vs Search Console = signaux d'alerte majeurs.""",
    },
    {
        "title": "Combien vaut une boutique Shopify ?",
        "category": "estimation",
        "seo_slug": "combien-vaut-une-boutique-shopify",
        "seo_title": "Combien vaut une boutique Shopify ? Méthodes d'estimation 2026",
        "seo_description": "Les critères qui influencent la valorisation d'une boutique Shopify. Multiples, marges, trafic SEO : comment estimer le prix de vente de votre e-commerce.",
        "seo_keywords": ["valeur boutique Shopify", "estimation boutique Shopify", "vendre boutique Shopify"],
        "geo_keywords": ["estimation e-commerce France"],
        "aeo_questions": [
            {"question": "Combien vaut une boutique Shopify ?", "answer": "Une boutique Shopify se valorise généralement entre 20 et 40 fois son bénéfice net mensuel. Par exemple, une boutique générant 2 000 €/mois net vaudra entre 40 000 € et 80 000 €. Les facteurs clés sont : la marque propre, la fidélité client, le trafic SEO et les marges."},
        ],
        "excerpt": "La valeur d'une boutique Shopify dépend de bien plus que son chiffre d'affaires. Découvrez les vrais critères de valorisation et les multiples actuels du marché.",
        "content_md": """# Combien vaut une boutique Shopify ?

Avec plus de 4 millions de boutiques dans le monde, Shopify est la plateforme e-commerce la plus achetée/vendue sur le marché. Mais **combien vaut vraiment votre boutique Shopify ?** Voici les méthodes de valorisation et les multiples actuels.

---

## La méthode principale : le Multiple de Bénéfice Net

**Valeur = Bénéfice net mensuel moyen × Multiple**

Pour les boutiques Shopify, le multiple varie généralement entre **20x et 40x** selon la qualité du business.

| Profil de la boutique | Multiple |
|---|---|
| Dropshipping pur, marges faibles | 12x – 18x |
| Marque propre, bon SEO | 24x – 32x |
| DTC établi, communauté fidèle | 32x – 48x |

---

## Les facteurs qui font monter la valeur

### 1. La marque propre (Private Label)
Une boutique qui vend **ses propres produits** (marque déposée, packaging personnalisé) vaut beaucoup plus qu'une boutique de dropshipping. L'acheteur achète la marque, pas juste un intermédiaire.

### 2. Le trafic organique SEO
Une boutique qui génère du trafic sans publicité payante est un actif premium. Calculez la dépendance aux ads :

**% de CA provenant du SEO = (CA organique / CA total) × 100**

Une boutique > 40% organique est bien plus valorisée.

### 3. La fidélité client
- Taux de clients récurrents (idéalement > 25%)
- LTV (Lifetime Value) élevée
- Avis Trustpilot ou Google positifs (> 4,5/5)
- Base email active et engagée

### 4. Les marges nettes
Le e-commerce physique a des marges plus faibles que le digital pur. Visez :
- Produits physiques : marges nettes > 20%
- Produits digitaux via Shopify : marges nettes > 60%

---

## Les facteurs qui font baisser la valeur

❌ **Dépendance à Meta Ads / Google Ads** : si la boutique vit de la pub payante, le risque est élevé (coûts qui montent, comptes publicitaires suspendus)
❌ **Fournisseur unique** : un seul fournisseur = risque d'approvisionnement
❌ **Revenus en baisse** : tendance baissière sur 6 mois = décote importante
❌ **Marque non déposée** : l'acheteur ne peut pas protéger son investissement
❌ **Stocks immobilisés** : si les stocks invendus sont inclus dans la valorisation, attention aux invendus

---

## Exemple de valorisation

Boutique Shopify DTC (marque propre, cosmétiques naturels) :
- CA mensuel moyen : 15 000 €
- Charges (produits + Shopify + apps + pub) : 9 500 €
- Bénéfice net : 5 500 €/mois
- Multiple appliqué : 28x (bonne marque, 35% SEO organique)
- **Valeur estimée : 5 500 × 28 = 154 000 €**

---

## FAQ — Valeur boutique Shopify

**Combien vaut une boutique Shopify ?**
Entre 20x et 40x le bénéfice net mensuel selon la marque, le SEO et les marges.

**Comment vendre une boutique Shopify ?**
Via une marketplace spécialisée comme La Citadelle Numérique, avec séquestre intégré pour sécuriser la transaction.""",
    },
    {
        "title": "Les erreurs à éviter lors de la migration d'un site internet",
        "category": "migration",
        "seo_slug": "erreurs-migration-site-internet",
        "seo_title": "Les erreurs à éviter lors de la migration d'un site internet",
        "seo_description": "Comment préserver le référencement et les données lors d'un changement d'hébergeur ou d'une refonte. Les erreurs les plus fréquentes et comment les éviter.",
        "seo_keywords": ["migration site internet", "perte SEO migration", "changer hébergeur sans perdre SEO"],
        "geo_keywords": ["migration hébergement France"],
        "aeo_questions": [
            {"question": "Comment migrer un site sans perdre son SEO ?", "answer": "Pour migrer sans perdre son SEO : clonez le site sur le nouvel hébergeur, testez via le fichier hosts, réduisez le TTL DNS à 300s avant la bascule, changez les DNS, et surveillez Google Search Console pendant 48h après. Ne modifiez aucune URL lors de la migration."},
        ],
        "excerpt": "Une migration mal réalisée peut faire chuter votre trafic de 50% en quelques jours. Voici les erreurs les plus fréquentes et comment les éviter absolument.",
        "content_md": """# Les erreurs à éviter lors de la migration d'un site internet

Chaque année, des dizaines de propriétaires de sites perdent une part significative de leur trafic après une migration bâclée. Voici les **erreurs les plus fréquentes** et comment les éviter.

---

## Erreur 1 : Changer les URLs pendant la migration

C'est l'erreur la plus dévastatrice. Lors d'un changement d'hébergeur, il ne faut **jamais modifier la structure des URLs** en même temps.

> ⚠️ Si vous passez de `/produit-123.html` à `/produits/produit-123`, Google doit recrawler et réindexer toutes vos pages. Cela peut prendre des semaines et provoquer une chute de 30 à 70% du trafic.

**Règle d'or :** Une seule migration à la fois. Hébergement d'abord. Restructuration URLs ensuite (avec des redirections 301 correctes).

---

## Erreur 2 : Oublier de mettre à jour les redirections 301

Si vous changez des URLs (refonte, changement de CMS), chaque ancienne URL doit rediriger vers la nouvelle via un **code HTTP 301** (redirection permanente).

Erreurs fréquentes :
- Utiliser des redirections 302 (temporaires) au lieu de 301 (permanentes) → Google ne transfère pas le "link juice"
- Chaînes de redirections trop longues (A → B → C → D) → perte de puissance SEO
- Redirections vers la page d'accueil au lieu de la page équivalente

---

## Erreur 3 : Ne pas tester avant de basculer les DNS

Beaucoup de webmasters changent les DNS et découvrent les problèmes en production.

**La bonne méthode :**
1. Configurez le site sur le nouvel hébergeur
2. Modifiez votre **fichier hosts local** pour faire pointer le domaine vers le nouvel IP
3. Naviguez intégralement sur le site et testez toutes les fonctionnalités
4. Seulement alors, changez les DNS

---

## Erreur 4 : Négliger le certificat SSL

Après une migration, vérifiez immédiatement que :
- Le certificat SSL est valide sur le nouveau serveur
- Toutes les pages redirigent bien de HTTP vers HTTPS
- Il n'y a pas de contenu mixte (images en HTTP sur une page HTTPS)

Un site en HTTP ou avec des erreurs SSL est pénalisé par Google et génère des alertes de sécurité qui font fuir les visiteurs.

---

## Erreur 5 : Ne pas surveiller après la migration

La migration n'est pas finie quand les DNS ont basculé. Vous devez surveiller pendant **48 à 72 heures** :

- **Google Search Console** : erreurs d'indexation apparues après migration
- **Uptime monitoring** : le site est-il accessible en permanence ?
- **Logs serveur** : erreurs 404 ou 500 inattendues
- **Temps de chargement** : comparer PageSpeed avant/après

---

## Erreur 6 : Perdre des données en base

Lors d'une migration de CMS ou de base de données :
- Exportez la BDD avant et après, comparez le nombre de lignes
- Vérifiez que les médias (images, fichiers) ont tous été transférés
- Testez les formulaires et les fonctionnalités dynamiques

---

## Checklist migration sans perte SEO

- [ ] URLs inchangées (ou redirections 301 configurées)
- [ ] Site testé via fichier hosts avant bascule DNS
- [ ] TTL DNS réduit à 300s au moins 48h avant
- [ ] Certificat SSL valide sur le nouveau serveur
- [ ] Monitoring activé après migration
- [ ] Search Console vérifiée 24h et 48h après

---

## FAQ — Migration site internet

**Comment migrer sans perdre son SEO ?**
Ne changez pas les URLs, testez avant de basculer, utilisez des 301 pour tout changement d'URL, et surveillez la Search Console pendant 48h.

**La migration affecte-t-elle le SEO ?**
Temporairement oui (propagation DNS), mais une migration bien réalisée n'a pas d'impact durable sur le référencement.""",
    },
    {
        "title": "Comment protéger son business digital contre le piratage ?",
        "category": "securite",
        "seo_slug": "proteger-business-digital-piratage",
        "seo_title": "Comment protéger son site internet et son business digital contre le piratage ?",
        "seo_description": "Les meilleures pratiques de cybersécurité pour sécuriser un site WordPress, un SaaS ou un e-commerce. Double authentification, sauvegardes, mises à jour et protection des accès.",
        "seo_keywords": ["sécurité site internet", "protéger WordPress", "cybersécurité PME"],
        "geo_keywords": ["cybersécurité France"],
        "aeo_questions": [
            {"question": "Comment protéger son site internet contre le piratage ?", "answer": "Pour protéger votre site : 1) Activez la double authentification (2FA) sur tous les accès admin, 2) Faites des sauvegardes automatiques quotidiennes, 3) Maintenez WordPress / plugins à jour, 4) Utilisez des mots de passe forts (gestionnaire de mots de passe), 5) Installez un plugin de sécurité (Wordfence, Sucuri), 6) Activez un WAF (Web Application Firewall)."},
        ],
        "excerpt": "Un site piraté peut perdre 100% de sa valeur en quelques heures. Ces mesures de cybersécurité sont indispensables pour protéger votre investissement digital.",
        "content_md": """# Comment protéger son business digital contre le piratage ?

Un site piraté peut perdre **toute sa valeur** en quelques heures : contenu supprimé, base de données corrompue, réputation détruite, pénalité Google. La cybersécurité n'est pas une option, c'est une nécessité. Voici les mesures essentielles.

---

## Mesure 1 : Double authentification (2FA) partout

La mesure la plus efficace et la plus négligée. Activez la **double authentification** sur :
- Votre hébergeur (OVH, cPanel, Plesk)
- Votre registrar (OVH, Gandi, Namecheap)
- Votre CMS (WordPress, Shopify...)
- Votre email professionnel (Gmail, Outlook)
- Vos comptes Stripe, PayPal
- Votre accès serveur SSH

> 90% des piratages se font via des mots de passe faibles ou volés. La 2FA bloque ces attaques même si votre mot de passe est compromis.

---

## Mesure 2 : Sauvegardes automatiques quotidiennes

**La règle 3-2-1 des sauvegardes :**
- **3** copies de vos données
- **2** supports différents
- **1** copie hors site (cloud externe)

Pour WordPress : plugins **UpdraftPlus** ou **BlogVault**
Pour les VPS : snapshots quotidiens + export BDD automatisé
Pour Shopify : exports CSV réguliers + backup des thèmes

> 🔥 Testez votre procédure de restauration. Une sauvegarde qui ne se restaure pas ne vaut rien.

---

## Mesure 3 : Mises à jour régulières

Les failles de sécurité les plus exploitées proviennent de **logiciels non mis à jour** :
- WordPress core : mettez à jour immédiatement chaque nouvelle version
- Plugins et thèmes : vérifiez chaque semaine
- PHP : passez à PHP 8.2+ (les versions antérieures ne reçoivent plus de correctifs)
- Librairies serveur : SSL, OpenSSL, etc.

---

## Mesure 4 : Sécurisation spécifique WordPress

WordPress est la cible n°1 des hackers car il représente 43% du web. Mesures essentielles :

- Changez l'URL de connexion (pas `/wp-admin` mais `/mon-acces-secret`)
- Limitez les tentatives de connexion (plugin Limit Login Attempts)
- Désactivez l'éditeur de fichiers dans le dashboard
- Supprimez les plugins inactifs
- Installez **Wordfence** ou **Sucuri** pour le pare-feu applicatif (WAF)

---

## Mesure 5 : Gestion des mots de passe

- Utilisez un **gestionnaire de mots de passe** : Bitwarden (gratuit) ou 1Password
- Chaque service = un mot de passe unique et complexe (16+ caractères)
- Ne partagez jamais les mots de passe par email
- Changez les mots de passe d'accès lors d'un départ prestataire

---

## Mesure 6 : Surveillance et alertes

- **Sucuri SiteCheck** (gratuit) : scan régulier des malwares
- **UptimeRobot** (gratuit) : alerte si votre site est inaccessible
- **Google Search Console** : alerte si Google détecte des problèmes de sécurité
- Configurez des alertes de connexion admin (email à chaque connexion)

---

## En cas de piratage : procédure d'urgence

1. Isolez immédiatement le site (mode maintenance ou désactivation temporaire)
2. Prévenez votre hébergeur
3. Restaurez à partir d'une sauvegarde saine antérieure au piratage
4. Changez TOUS les mots de passe et clés d'accès
5. Identifiez la faille (logs serveur, plugin vulnérable)
6. Signalez à Google si le site a été blacklisté

---

## FAQ — Cybersécurité site internet

**Comment protéger son site ?**
2FA partout, sauvegardes quotidiennes, mises à jour immédiates, mot de passe gestionnaire, WAF (Wordfence/Sucuri).

**Mon site a été piraté, que faire ?**
Isolez, restaurez depuis une sauvegarde saine, changez tous les mots de passe, identifiez la faille, puis signalez à Google.""",
    },
    {
        "title": "Comment fixer le bon prix de vente pour un business en ligne ?",
        "category": "estimation",
        "seo_slug": "fixer-prix-vente-business-en-ligne",
        "seo_title": "Comment fixer le bon prix de vente d'un business en ligne ?",
        "seo_description": "Les méthodes professionnelles pour déterminer un prix de vente réaliste pour un site internet ou un business digital. Multiples, comparables et stratégie de prix.",
        "seo_keywords": ["prix business en ligne", "vendre site internet prix", "calcul prix vente site internet"],
        "geo_keywords": ["estimation business digital France"],
        "aeo_questions": [
            {"question": "Comment fixer le prix de vente d'un site internet ?", "answer": "Pour fixer le prix de vente d'un site internet : 1) Calculez votre bénéfice net mensuel moyen sur 12 mois, 2) Appliquez un multiple de marché (20x à 36x selon la qualité), 3) Vérifiez les prix de transactions comparables récentes, 4) Ajoutez une marge de négociation de 10 à 15%."},
        ],
        "excerpt": "Fixer le bon prix est l'étape la plus difficile de la vente. Un prix trop haut fait fuir les acheteurs ; trop bas, vous laissez de l'argent sur la table. Voici la méthode.",
        "content_md": """# Comment fixer le bon prix de vente pour un business en ligne ?

Fixer le prix d'un business en ligne est autant un art qu'une science. Un prix trop élevé fait fuir les acheteurs qualifiés ; un prix trop bas est de l'argent laissé sur la table. Voici les **méthodes professionnelles** pour trouver le bon prix.

---

## Méthode 1 : Le Multiple de SDE (méthode principale)

C'est la méthode standard dans l'industrie.

**Prix de vente = SDE mensuel moyen × Multiple**

**Calcul du SDE :**
1. Prenez vos revenus bruts sur 12 mois
2. Déduisez toutes les charges d'exploitation réelles
3. Réintégrez votre rémunération (si vous vous payez en tant que gérant)
4. Lissez les revenus exceptionnels non récurrents

**Déterminer le bon multiple :**

| Qualité du business | Multiple |
|---|---|
| Faible (< 1 an, revenus instables) | 12x – 18x |
| Moyenne (1-3 ans, revenus stables) | 20x – 28x |
| Bonne (3+ ans, croissance, marque) | 30x – 40x |
| Excellente (leader de niche, récurrence forte) | 40x – 60x |

---

## Méthode 2 : Les transactions comparables (Comps)

Comme en immobilier, cherchez des ventes récentes de sites similaires :
- Même niche
- Même niveau de revenus
- Même technologie

Où chercher des comps :
- Flippa (base de données de ventes)
- Empire Flippers (transactions vérifiées)
- La Citadelle Numérique (marché français)

---

## Méthode 3 : La valeur des actifs

Pour certains sites, la valeur des actifs justifie un prix supérieur au multiple :
- **Base email** : valeur × nombre d'abonnés actifs
- **Marque déposée** : actif juridique supplémentaire
- **Contenu SEO** : valeur de production des articles
- **Backlinks** : coût d'acquisition équivalent

---

## La stratégie de prix

### Fixez un prix "ancre" légèrement surévalué
Les acheteurs négocient toujours. Fixez votre prix affiché avec une marge de **10 à 15%** au-dessus de votre prix plancher.

Exemple :
- Prix plancher souhaité : 50 000 €
- Prix affiché : 55 000 – 58 000 €
- Espace de négociation : 10 – 15%

### Évitez les prix "ronds"
Un site à 49 800 € semble plus travaillé qu'un site affiché 50 000 €. Cela signale que vous avez calculé précisément.

### Justifiez chaque euro de votre prix
Préparez un dossier chiffré qui explique votre valorisation. Un acheteur qui comprend le calcul du prix est plus enclin à l'accepter.

---

## Les erreurs de pricing les plus fréquentes

❌ **Sur-valoriser l'avenir** : "ça pourrait valoir 3x plus si on développait les réseaux sociaux" → Les acheteurs paient pour ce qui existe, pas pour du potentiel non prouvé.

❌ **Oublier les charges** : Valoriser sur le CA brut et non le bénéfice net.

❌ **Ignorer la tendance** : Un site en baisse de revenus depuis 6 mois ne se vend pas au prix d'un site en hausse.

❌ **Prix émotionnel** : "J'y ai mis 3 ans de ma vie donc ça vaut X". Le marché ne paie pas pour le travail passé mais pour les revenus futurs.

---

## FAQ — Fixer le prix d'un business en ligne

**Comment fixer le prix de vente d'un site internet ?**
SDE mensuel × Multiple (20x à 40x selon la qualité) + vérification par les transactions comparables.

**Peut-on négocier le prix d'un site internet ?**
Oui, c'est attendu. Prévoyez une marge de 10 à 15% dans votre prix affiché.""",
    },
    {
        "title": "Acheter un SaaS : les points à contrôler",
        "category": "saas",
        "seo_slug": "acheter-un-saas-points-a-controler",
        "seo_title": "Acheter un SaaS : les 10 points à contrôler avant l'acquisition",
        "seo_description": "Due diligence complète pour acquérir un SaaS : analyse du MRR, du churn, des contrats clients, de l'architecture technique et des coûts d'infrastructure.",
        "seo_keywords": ["acheter SaaS", "audit SaaS acquisition", "MRR SaaS due diligence"],
        "geo_keywords": ["acquisition SaaS France"],
        "aeo_questions": [
            {"question": "Comment acheter un SaaS ?", "answer": "Pour acquérir un SaaS, effectuez une due diligence complète : vérifiez le MRR réel (accès Stripe), analysez le taux de churn (idéalement < 2%/mois), auditez la qualité du code, évaluez les coûts d'infrastructure, listez les contrats clients (durée, clauses), et vérifiez les dépendances API critiques."},
        ],
        "excerpt": "Acquérir un SaaS est une décision d'investissement importante. Voici les 10 contrôles indispensables pour éviter les mauvaises surprises après l'achat.",
        "content_md": """# Acheter un SaaS : les points à contrôler

**Acquérir un SaaS** (Software as a Service) offre l'avantage de revenus récurrents prévisibles. Mais sans due diligence sérieuse, vous pouvez hériter de problèmes techniques, contractuels ou financiers graves. Voici les **10 points essentiels** à contrôler.

---

## Point 1 : Vérifier le MRR réel

Le **MRR** (Monthly Recurring Revenue) est la métrique centrale d'un SaaS. Exigez :
- Accès en lecture à Stripe, Paddle ou PayPal
- Export des transactions sur 12 mois minimum
- Distinction entre MRR actif et MRR "en attente" (clients avec carte expirée)

> ⚠️ Un MRR "affiché" peut inclure des clients en période d'essai, des crédits non encaissés ou des comptes inactifs.

---

## Point 2 : Analyser le taux de churn

Le **churn** (taux de résiliation mensuel) est le signe vital d'un SaaS.

| Taux de churn | Interprétation |
|---|---|
| < 1%/mois | Excellent (produit très fidélisant) |
| 1% – 3%/mois | Correct |
| 3% – 5%/mois | Problématique |
| > 5%/mois | Critique (le SaaS se vide) |

Calculez le churn sur 6 mois et sur 12 mois. Un churn qui s'accélère est un signal d'alarme majeur.

---

## Point 3 : Auditer le code source

Demandez un accès au dépôt de code (GitHub/GitLab) avant la signature.

Vérifiez :
- **Qualité générale** : le code est-il documenté ? Y a-t-il des tests automatisés ?
- **Dette technique** : librairies obsolètes, CVE critiques non patchées
- **Secrets en dur** : clés API ou mots de passe directement dans le code (risque de sécurité)
- **Scalabilité** : l'architecture peut-elle supporter 10x plus d'utilisateurs ?

---

## Point 4 : Évaluer les coûts d'infrastructure

Les coûts de serveurs peuvent exploser avec la croissance :
- Hébergement cloud (AWS, GCP, Heroku) : coût mensuel actuel et évolution
- Bases de données : PostgreSQL, MongoDB, Redis — coûts et sauvegardes
- CDN et stockage (S3, Cloudflare)
- Services tiers intégrés (Twilio, SendGrid, Stripe fees...)

---

## Point 5 : Analyser les contrats clients

- Durée des engagements : mensuel ou annuel ? (annuel = moins de churn)
- Clauses de résiliation : préavis, pénalités
- Clauses de prix : y a-t-il des prix bloqués pour de gros clients ?
- SLA (Service Level Agreement) : quelles garanties de disponibilité ?

---

## Point 6 : Vérifier les dépendances critiques

Un SaaS peut dépendre fortement d'APIs tierces :
- Si cette API change ses CGU ou ferme, le SaaS est en danger
- Vérifiez les contrats avec les fournisseurs d'API
- Identifiez les dépendances "single point of failure"

---

## Point 7 : Analyser la concentration client

Comme pour tout business, la concentration est un risque :
- Un client représente > 20% du MRR = risque élevé
- Top 5 clients = quel % du MRR ?

---

## Point 8 : Vérifier la conformité RGPD

Un SaaS qui traite des données personnelles doit être conforme au RGPD :
- Registre des traitements à jour
- Politique de confidentialité claire
- Procédure de suppression des données sur demande
- Sous-traitants RGPD conformes

---

## Points 9 & 10 : Roadmap et documentation

**Point 9 :** Y a-t-il une roadmap produit documentée ? Quelles fonctionnalités sont en cours ?

**Point 10 :** La documentation technique et utilisateur est-elle à jour ? Un SaaS non documenté coûte cher à reprendre en main.

---

## FAQ — Acheter un SaaS

**Comment acheter un SaaS ?**
Due diligence sur le MRR réel, le churn, le code source, les coûts, les contrats clients et la conformité RGPD.

**Quel taux de churn est acceptable pour un SaaS ?**
< 2%/mois est le standard. Au-delà de 5%/mois, le SaaS perd ses clients plus vite qu'il n'en acquiert.""",
    },
    {
        "title": "Les tendances du marché des sites internet en 2026",
        "category": "actualites",
        "seo_slug": "tendances-marche-sites-internet-2026",
        "seo_title": "Les tendances du marché des sites internet et des business digitaux en 2026",
        "seo_description": "Panorama du marché français de la vente de sites web en 2026 : multiples de valorisation, secteurs porteurs, volume de transactions et perspectives.",
        "seo_keywords": ["marché site internet 2026", "vente business digital", "tendance SaaS 2026"],
        "geo_keywords": ["marché digital France 2026"],
        "aeo_questions": [
            {"question": "Le marché des sites internet est-il en croissance en 2026 ?", "answer": "Oui, le marché de la cession de sites internet est en forte croissance en 2026. La démocratisation de l'entrepreneuriat digital, la multiplication des business en ligne et l'arrivée de nouveaux acheteurs institutionnels (family offices, fonds de capital-acquisition digital) tirent les valorisations à la hausse."},
        ],
        "excerpt": "Le marché des sites internet est en plein essor. Panorama des tendances, des secteurs qui se vendent le mieux et des multiples de valorisation en France en 2026.",
        "content_md": """# Les tendances du marché des sites internet en 2026

Le marché de la **cession de sites internet et de business digitaux** est entré dans une phase de maturité et de professionnalisation. Voici le panorama des tendances clés qui définissent le marché en 2026.

---

## Un marché en croissance structurelle

### Des chiffres qui confirment la tendance
- Le nombre de transactions de sites internet en France a augmenté de **40% entre 2023 et 2026**
- Les multiples moyens de valorisation ont progressé de 15 à 25% sur les 3 dernières années
- Les acheteurs institutionnels (fonds de private equity, family offices) s'intéressent désormais aux sites > 500 000 €

### Les facteurs de croissance
- **Démocratisation** : de plus en plus d'entrepreneurs créent des sites rentables
- **Maturité des créateurs** : après 3-5 ans, beaucoup souhaitent céder pour passer à autre chose
- **Nouvelle classe d'investisseurs** : le "website investing" se professionnalise comme l'immobilier
- **Outils améliorés** : les marketplaces et séquestres facilitent les transactions

---

## Les secteurs les plus recherchés en 2026

### 1. SaaS B2B (multiples élevés)
Les SaaS avec MRR récurrent et churn bas restent les actifs les plus convoités.
- Multiple moyen : **4x à 8x l'ARR**
- Particulièrement recherchés : SaaS de productivité, automation, IA intégrée

### 2. Sites de contenu SEO (forte demande)
L'IA a modifié le SEO mais les sites d'autorité bien positionnés restent précieux.
- Multiple moyen : **28x à 38x le bénéfice mensuel**
- Niches portantes : finance personnelle, santé, legal tech, B2B

### 3. E-commerce DTC avec marque propre
Les boutiques avec une vraie marque et des clients fidèles s'arrachent.
- Multiple moyen : **24x à 36x le bénéfice mensuel**
- Facteur différenciant : base email + programme de fidélité

### 4. Applications mobiles avec abonnements
Les apps B2B avec abonnements SaaS connaissent une valorisation en hausse.
- Multiple moyen : **3x à 6x l'ARR**

---

## Les tendances de valorisation

### L'IA comme double facteur
- Sites **utilisant l'IA** pour réduire les coûts opérationnels : prime de valorisation
- Sites **concurrencés par l'IA** (contenu générique, traduction) : décote croissante

### La récurrence prime sur le volume
Les acheteurs 2026 préfèrent nettement :
- Un site à 2 000 €/mois stables depuis 3 ans
- À un site à 5 000 €/mois instables sur 6 mois

### La France rattrape son retard
La France est en train de rattraper les marchés anglo-saxons (US, UK) où les transactions digitales sont banalisées depuis 10 ans. Les prix progressent et le nombre d'acheteurs qualifiés augmente.

---

## Les secteurs en difficulté

⚠️ Secteurs avec des valorisations sous pression :
- Sites de contenu générique (IA le produit en masse)
- Boutiques dropshipping sans marque (marges érodées)
- Sites dépendants d'une seule plateforme (ex: trafic Facebook uniquement)

---

## Perspectives pour 2026-2027

- **Consolidation** : des acteurs achètent des portfolios entiers de sites (holding digitale)
- **Institutionnalisation** : les fonds de capital-acquisition digital se multiplient en France
- **Hausse des multiples** : la rareté des bons actifs tire les prix vers le haut
- **Professionnalisation** : les vendeurs se préparent mieux (dossiers financiers, audit préalable)

---

## FAQ — Marché sites internet 2026

**Le marché des sites internet est-il en croissance ?**
Oui, avec +40% de transactions en 3 ans et une professionnalisation croissante des acheteurs et vendeurs en France.

**Quels sont les secteurs les plus porteurs ?**
SaaS B2B, sites de contenu SEO d'autorité, e-commerce DTC avec marque propre et apps mobiles avec abonnements.""",
    },
    {
        "title": "Comment préparer la transmission d'un business digital ?",
        "category": "vendre-un-site",
        "seo_slug": "preparer-transmission-business-digital",
        "seo_title": "Comment préparer la transmission d'un business digital ? Guide complet",
        "seo_description": "Les étapes administratives, techniques et commerciales pour réussir la cession d'un actif numérique. Checklist complète pour une transmission réussie.",
        "seo_keywords": ["transmission business digital", "céder entreprise numérique", "vendre activité en ligne"],
        "geo_keywords": ["cession business digital France"],
        "aeo_questions": [
            {"question": "Comment transmettre un business digital ?", "answer": "La transmission d'un business digital se prépare en 3 phases : 1) Phase administrative (documents légaux, contrats, conformité RGPD), 2) Phase technique (documentation, guide de reprise, accès préparés), 3) Phase commerciale (dossier financier, présentation aux acheteurs, négociation). Comptez 3 à 6 mois de préparation pour une cession réussie."},
        ],
        "excerpt": "Transmettre un business digital est un processus qui se prépare des mois à l'avance. Découvrez toutes les étapes pour réussir une cession sans friction.",
        "content_md": """# Comment préparer la transmission d'un business digital ?

La **transmission d'un business digital** est un processus structuré qui demande une préparation sérieuse. Les vendeurs qui obtiennent les meilleurs prix et les cessions les plus fluides sont ceux qui s'y préparent **6 mois à l'avance**. Voici la méthode complète.

---

## Phase 1 : Préparation administrative (6 mois avant)

### Documents légaux
- Mentions légales du site à jour (nom, SIRET, adresse réelle)
- CGV / CGU conformes au droit français et RGPD en vigueur
- Politique de confidentialité à jour
- Registre des traitements de données (RGPD)

### Contrats tiers
Listez tous les contrats en cours et vérifiez leur transférabilité :
- Contrats d'affiliation (clauses de cession ?)
- Licences logicielles (nominatives ou cessibles ?)
- Prestataires en cours (contrats, accès, clés API)
- Contrats clients BtoB le cas échéant

### Statut juridique
Si vous opérez en société (SASU, SAS, SARL), la cession peut prendre deux formes :
- **Cession de fonds de commerce numérique** (actifs uniquement)
- **Cession de titres** (parts sociales) — consultez un expert-comptable

---

## Phase 2 : Préparation technique (3 mois avant)

### Documentation technique
Rédigez un **guide de reprise technique** complet :
- Architecture du site (hébergement, bases de données, services tiers)
- Guide de déploiement (comment mettre en ligne une mise à jour)
- Liste des variables d'environnement et leur rôle
- Liste des accès et où les trouver (gestionnaire de mots de passe)
- Calendrier de renouvellement (domaine, hébergement, certificats)

### Audit technique préalable
Avant de mettre en vente, corrigez les problèmes connus :
- Mises à jour de sécurité en retard
- Erreurs Google Search Console non traitées
- Temps de chargement perfectible (PageSpeed)

### Sauvegardes vérifiées
Assurez-vous que vos sauvegardes fonctionnent et sont restaurables. L'acheteur devra reprendre un site en état de marche.

---

## Phase 3 : Préparation commerciale (1 à 3 mois avant)

### Le dossier de vente
C'est votre "teaser" pour les acheteurs sérieux. Il doit contenir :
- Résumé exécutif (type de site, niche, revenus, prix demandé)
- Historique financier sur 24 mois (revenus, charges, bénéfice net)
- Statistiques de trafic (GA4 anonymisé pour la présentation publique)
- Présentation des actifs inclus dans la vente
- Justification du prix demandé (méthode de valorisation)

### La période de confidentialité
Avant de révéler l'URL complète ou les accès, faites signer un **accord de confidentialité (NDA)** aux acheteurs sérieux. Cela évite que des concurrents utilisent votre dossier à mauvais escient.

### Le processus de Q&R
Préparez les réponses aux questions les plus fréquentes :
- Pourquoi vendez-vous ?
- Quel est le temps de gestion hebdomadaire ?
- Y a-t-il des risques ou des contrats problématiques ?
- Proposez-vous une période de transition (accompagnement) ?

---

## La période de transition : un argument de vente fort

Proposer **4 à 8 semaines d'accompagnement** après la cession est un argument puissant :
- Rassure les acheteurs moins expérimentés
- Justifie un prix légèrement supérieur
- Réduit le risque de litiges post-cession

---

## FAQ — Transmission business digital

**Comment transmettre un business digital ?**
Préparez les documents légaux, documentez la technique, constituez le dossier commercial, et utilisez un séquestre pour sécuriser la transaction.

**Combien de temps prend une cession ?**
De 2 à 6 mois entre la décision de vendre et la finalisation, selon la qualité de la préparation et la rapidité de l'acheteur.""",
    },
    {
        "title": "Pourquoi passer par une marketplace spécialisée pour vendre son site ?",
        "category": "marketplace",
        "seo_slug": "pourquoi-marketplace-specialisee-vendre-site",
        "seo_title": "Pourquoi passer par une marketplace spécialisée pour vendre son site internet ?",
        "seo_description": "Les avantages d'une plateforme dédiée à la vente de sites web : visibilité ciblée, acheteurs qualifiés, séquestre sécurisé, estimation professionnelle et accompagnement.",
        "seo_keywords": ["marketplace vente site internet", "plateforme vente business digital", "vendre un site web marketplace"],
        "geo_keywords": ["marketplace vente site internet France", "plateforme vente site France"],
        "aeo_questions": [
            {"question": "Quelle est la meilleure plateforme pour vendre un site internet ?", "answer": "En France, La Citadelle Numérique est la marketplace spécialisée de référence pour la cession de sites web, SaaS et e-commerce. Elle propose des acheteurs qualifiés, un système de séquestre intégré, une estimation professionnelle et un accompagnement à chaque étape de la transaction."},
            {"question": "Pourquoi utiliser une marketplace spécialisée ?", "answer": "Une marketplace spécialisée dans la vente de sites internet offre une visibilité ciblée auprès d'acheteurs qualifiés, un système de séquestre pour sécuriser les fonds, une assistance pour la valorisation et un cadre juridique pour la transaction. C'est plus efficace et plus sûr qu'une vente directe."},
            {"question": "Où vendre un business digital ?", "answer": "Pour vendre un business digital en France, La Citadelle Numérique est la plateforme dédiée qui réunit vendeurs et acheteurs qualifiés. La transaction est sécurisée par un système de séquestre intégré et accompagnée par une équipe spécialisée."},
        ],
        "excerpt": "Vendre seul ou passer par une marketplace ? Les avantages d'une plateforme spécialisée sont nombreux : visibilité, acheteurs qualifiés, séquestre, estimation. Explications.",
        "content_md": """# Pourquoi passer par une marketplace spécialisée pour vendre son site ?

Face à la tentation de "vendre par soi-même" pour économiser la commission, beaucoup de vendeurs de sites internet finissent par regretter leur choix après des mois sans acheteur sérieux ou une mauvaise transaction. Voici pourquoi passer par une **marketplace spécialisée** est la meilleure décision.

---

## Avantage 1 : Accès à des acheteurs qualifiés et ciblés

La différence principale entre une marketplace spécialisée et une annonce sur un forum généraliste : **la qualité des acheteurs**.

Sur une marketplace dédiée :
- Les acheteurs ont créé un compte et validé leur identité
- Ils cherchent activement à investir dans un business digital
- Leur budget est connu et souvent pré-qualifié
- Ils connaissent le marché et ne perdent pas votre temps avec des questions basiques

Sur un forum généraliste ou un groupe Facebook :
- Des curieux, des négociateurs agressifs, des concurrents qui veulent "juste voir"
- Des acheteurs sans budget réel
- Des risques d'arnaques (faux acheteurs, charge-back)

---

## Avantage 2 : La visibilité ciblée

Une marketplace spécialisée attire un trafic qualifié grâce à son SEO thématique :
- Des acheteurs qui cherchent exactement ce que vous vendez
- Une audience internationale potentielle (diaspora française, investisseurs européens)
- Une newsletter d'alertes envoyée aux acheteurs selon leurs critères

**Résultat :** vos annonces sont vues par les bonnes personnes, pas noyées dans des millions d'annonces généralistes.

---

## Avantage 3 : L'estimation professionnelle

Avant même de publier votre annonce, une marketplace sérieuse vous aide à **valoriser correctement votre business** :
- Analyse de votre dossier financier
- Comparaison avec les transactions récentes
- Proposition d'une fourchette de prix réaliste

Cette étape est cruciale : un prix trop élevé fait stagner votre annonce. Un prix trop bas vous prive de dizaines de milliers d'euros.

---

## Avantage 4 : Le séquestre sécurisé

C'est l'élément le plus important. Le **séquestre intégré** protège les deux parties :

**Pour le vendeur :**
- Certitude de recevoir les fonds avant de transmettre les accès
- Impossibilité pour l'acheteur de faire un charge-back sur des accès déjà transmis
- Fonds vérifiés et validés par un tiers de confiance

**Pour l'acheteur :**
- Les fonds ne sont libérés qu'après validation des accès
- Protection contre les vendeurs qui disparaissent après le paiement
- Recours possible en cas de litige

---

## Avantage 5 : L'accompagnement juridique et technique

La cession d'un business digital comporte des aspects juridiques que peu de particuliers maîtrisent :
- Rédaction ou validation du protocole de cession
- Vérification des clauses essentielles (non-concurrence, garanties)
- Guide de transfert technique (domaine, hébergement, accès)
- Suivi post-cession en cas de litige

---

## La commission : un investissement, pas un coût

La commission d'une marketplace représente généralement **5 à 10% du prix de vente**. Mais elle est largement compensée par :
- Un prix de vente plus élevé (acheteurs qualifiés = moins de bradage)
- Un délai de vente plus court (trafic ciblé)
- Une sécurité totale de la transaction (séquestre)
- Zéro risque de fraude ou d'impayé

Un vendeur qui obtient **50 000 €** via une marketplace avec 5% de commission (2 500 €) fait bien mieux qu'un vendeur qui vend seul 40 000 € après 6 mois d'efforts, sans séquestre et avec le stress de gérer seul la transaction.

---

## La Citadelle Numérique : la référence française

**La Citadelle Numérique** est la marketplace française dédiée à la cession de sites internet, SaaS et boutiques e-commerce. Elle réunit tous les avantages cités :

- ✅ Acheteurs français qualifiés et vérifiés
- ✅ Séquestre Stripe intégré (fonds sécurisés)
- ✅ Estimation professionnelle gratuite
- ✅ Accompagnement de A à Z
- ✅ Messagerie sécurisée vendeur-acheteur
- ✅ Gestion des litiges par La Garde

---

## FAQ — Marketplace vente site internet

**Quelle est la meilleure plateforme pour vendre un site internet ?**
En France, La Citadelle Numérique est la référence pour la cession de sites web, SaaS et e-commerce avec séquestre intégré.

**Pourquoi utiliser une marketplace spécialisée ?**
Acheteurs qualifiés, visibilité ciblée, séquestre sécurisé, estimation professionnelle et accompagnement juridique.

**Où vendre un business digital ?**
La Citadelle Numérique : la marketplace française pour toutes les transactions de business digitaux.""",
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
