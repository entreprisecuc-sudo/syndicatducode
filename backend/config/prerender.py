"""
Configuration du Pré-rendu SEO (Dynamic Rendering) — La Citadelle Numérique.
Centralise (Règle 5 — zéro hardcoding) les libellés et les métadonnées des pages
publiques servies aux robots (title, description, H1, introduction).
"""

# Libellés lisibles des types d'actifs (miroir de citadelleConstants.js — DRY côté données)
LISTING_TYPE_LABELS = {
    "website": "Site internet",
    "ecommerce": "Boutique e-commerce",
    "saas": "SaaS",
    "webapp": "Application web",
    "social_account": "Compte de réseau social",
    "domain": "Nom de domaine",
    "shopify_store": "Boutique Shopify",
    "amazon_fba": "Business Amazon FBA",
    "newsletter": "Newsletter",
    "youtube_channel": "Chaîne YouTube",
    "instagram": "Compte Instagram",
    "tiktok": "Compte TikTok",
    "linkedin_page": "Page LinkedIn Entreprise",
    "discord_server": "Serveur Discord",
    "forum": "Forum",
    "blog": "Blog",
    "online_media": "Média en ligne",
    "ai_automation": "Agent IA / Automatisation",
    "template_plugin": "Template / Thème / Plugin",
    "database_api": "Base de données / API",
}

# Libellés lisibles des catégories de blog
BLOG_CATEGORY_LABELS = {
    "actualites": "Actualités",
    "conseils": "Conseils",
    "tutoriels": "Tutoriels",
    "marche": "Marché",
    "juridique": "Juridique",
    "vendre-un-site": "Vendre un site",
    "acheter-un-site": "Acheter un site",
    "estimation": "Estimation",
    "seo": "SEO",
    "securite": "Sécurité",
    "migration": "Migration",
    "business": "Business",
    "ecommerce": "E-commerce",
    "saas": "SaaS",
    "vente-applications": "Applications mobiles",
    "reseaux-sociaux": "Réseaux sociaux",
    "marketplace": "Marketplace",
    "chroniques-la-garde": "Les Chroniques de La Garde",
    "guide-la-citadelle": "Le Guide de La Citadelle",
}

# Catégories des rubriques éditoriales dédiées
GUIDES_CATEGORY = "guide-la-citadelle"
CHRONIQUES_CATEGORY = "chroniques-la-garde"

# Métadonnées des pages « statiques » (contenu éditorial fixe)
# path (route React) -> {title, description, h1, intro}
STATIC_PAGES = {
    "/citadelle": {
        "title": "Acheter et vendre un site internet, un SaaS ou un e-commerce | La Citadelle Numérique",
        "description": "La Citadelle Numérique, marketplace française pour vendre et acheter des sites internet, SaaS, boutiques e-commerce, chaînes YouTube et actifs numériques. Transactions sécurisées par séquestre.",
        "h1": "Achetez, vendez et sécurisez vos actifs numériques",
        "intro": "La Citadelle Numérique est la marketplace française dédiée à l'achat et à la vente de sites internet, SaaS, boutiques e-commerce, chaînes YouTube, comptes de réseaux sociaux et noms de domaine. Chaque transaction est protégée par un séquestre (paiement sécurisé) et suivie par La Garde.",
    },
    "/citadelle/vendre": {
        "title": "Vendre son site internet, SaaS ou e-commerce | La Citadelle Numérique",
        "description": "Vendez votre site internet, SaaS, boutique e-commerce ou actif numérique en toute sécurité sur La Citadelle Numérique. Publication gratuite, estimation professionnelle et paiement sécurisé par séquestre.",
        "h1": "Vendez votre actif numérique en toute confiance",
        "intro": "Publiez gratuitement votre annonce, fixez votre prix ou lancez une vente aux enchères, et laissez La Garde sécuriser la transaction et la transmission des accès à l'acheteur.",
    },
    "/citadelle/estimation": {
        "title": "Estimation de la valeur d'un site, SaaS ou e-commerce | La Citadelle Numérique",
        "description": "Estimez gratuitement la valeur de votre site internet, SaaS ou boutique e-commerce grâce à nos multiples de valorisation, ou commandez une estimation professionnelle réalisée par nos experts.",
        "h1": "Combien vaut votre actif numérique ?",
        "intro": "Obtenez une fourchette de valorisation instantanée à partir de votre bénéfice net et de votre type d'actif, puis affinez avec une estimation professionnelle réalisée par les experts de La Citadelle Numérique.",
    },
    "/citadelle/services": {
        "title": "Services : estimation, audit, vérification, migration | La Citadelle Numérique",
        "description": "Découvrez les services de La Citadelle Numérique : estimation professionnelle, audit avant vente, vérification par La Garde, migration technique, refonte et création de site.",
        "h1": "Les services de La Citadelle Numérique",
        "intro": "Estimation, audit, vérification indépendante du trafic et des revenus, migration technique, refonte et création : nos services accompagnent vendeurs et acheteurs à chaque étape.",
    },
    "/citadelle/annonces": {
        "title": "Annonces : sites, SaaS et e-commerce à vendre | La Citadelle Numérique",
        "description": "Parcourez les sites internet, SaaS, boutiques e-commerce et actifs numériques à vendre sur La Citadelle Numérique. Achat sécurisé par séquestre et vérification par La Garde.",
        "h1": "Actifs numériques à vendre",
        "intro": "Découvrez les sites internet, SaaS, boutiques e-commerce, chaînes YouTube et autres actifs numériques actuellement en vente ou aux enchères sur La Citadelle Numérique.",
    },
    "/citadelle/blog": {
        "title": "Blog : conseils achat, vente et estimation d'actifs numériques | La Citadelle Numérique",
        "description": "Conseils, guides et actualités sur l'achat, la vente, l'estimation et la sécurisation de sites internet, SaaS et e-commerce. Le blog de La Citadelle Numérique.",
        "h1": "Le blog de La Citadelle Numérique",
        "intro": "Retrouvez nos conseils, guides et analyses de marché pour acheter, vendre, estimer et sécuriser vos actifs numériques.",
    },
    "/citadelle/parutions": {
        "title": "Les Parutions : blog, guides et chroniques | La Citadelle Numérique",
        "description": "Toutes les parutions de La Citadelle Numérique : articles de blog, Guides de La Citadelle et Chroniques de La Garde sur l'achat et la vente d'actifs numériques.",
        "h1": "Les Parutions de La Citadelle",
        "intro": "Le blog, les Guides de La Citadelle et les Chroniques de La Garde réunis en un seul endroit.",
    },
    "/citadelle/guides": {
        "title": "Les Guides de La Citadelle | La Citadelle Numérique",
        "description": "Dossiers complets étape par étape pour acheter, vendre, estimer et transmettre un actif numérique en toute sécurité. Les Guides de La Citadelle.",
        "h1": "Le Guide de La Citadelle",
        "intro": "Des dossiers complets, étape par étape, pour maîtriser l'achat, la vente, l'estimation et la transmission de vos actifs numériques.",
    },
    "/citadelle/chroniques": {
        "title": "Les Chroniques de La Garde | La Citadelle Numérique",
        "description": "Retours d'expérience et analyses de La Garde sur les transactions d'actifs numériques : sécurité, séquestre, transmission et bonnes pratiques.",
        "h1": "Les Chroniques de La Garde",
        "intro": "Les retours d'expérience de La Garde sur les transactions réalisées : sécurité, séquestre, transmission des accès et bonnes pratiques.",
    },
    "/citadelle/contact": {
        "title": "Contact | La Citadelle Numérique",
        "description": "Contactez La Garde de La Citadelle Numérique pour toute question sur l'achat, la vente ou la sécurisation de vos actifs numériques.",
        "h1": "Contacter La Garde",
        "intro": "Une question sur l'achat, la vente ou la sécurisation d'un actif numérique ? La Garde de La Citadelle Numérique vous répond.",
    },
    "/citadelle/cgu": {
        "title": "Conditions Générales d'Utilisation | La Citadelle Numérique",
        "description": "Conditions Générales d'Utilisation de La Citadelle Numérique : accès à la plateforme, transaction sécurisée, séquestre, commission, Stripe Connect et vérification KYC.",
        "h1": "Conditions Générales d'Utilisation",
        "intro": "Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme La Citadelle Numérique.",
    },
    "/citadelle/cgv": {
        "title": "Conditions Générales de Vente | La Citadelle Numérique",
        "description": "Conditions Générales de Vente de La Citadelle Numérique : modalités de cession d'actifs numériques, séquestre, paiement sécurisé, commission et garanties.",
        "h1": "Conditions Générales de Vente",
        "intro": "Les présentes Conditions Générales de Vente encadrent les transactions réalisées sur La Citadelle Numérique.",
    },
    "/citadelle/mentions-legales": {
        "title": "Mentions Légales | La Citadelle Numérique",
        "description": "Mentions légales de La Citadelle Numérique : éditeur du site, hébergeur, propriété intellectuelle et coordonnées de l'entreprise.",
        "h1": "Mentions Légales",
        "intro": "Informations légales relatives à l'éditeur et à l'hébergement de La Citadelle Numérique.",
    },
    "/citadelle/confidentialite": {
        "title": "Politique de Confidentialité (RGPD) | La Citadelle Numérique",
        "description": "Politique de confidentialité de La Citadelle Numérique conforme au RGPD : données collectées, finalités, durée de conservation et exercice de vos droits.",
        "h1": "Politique de Confidentialité",
        "intro": "La protection de vos données personnelles est une priorité. Cette politique, conforme au RGPD, détaille les données collectées et vos droits.",
    },
}
