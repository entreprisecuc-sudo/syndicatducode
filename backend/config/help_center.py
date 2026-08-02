"""
Registre central du Centre d'aide — La Citadelle Numérique
Source de vérité unique : catégories, questions, slugs, icônes.
Utilisé par la route de rendu (routes/help_center.py) et le script de génération.
"""
import re
import unicodedata

HELP_BASE_PATH = "/aide"  # URL publique propre (Nginx proxy -> /api/aide en prod)


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text).strip("-")
    return text or "question"


# Chaque catégorie : key (slug), label, icône FontAwesome, description courte, liste de questions.
CATEGORIES = [
    {
        "key": "acheter", "label": "Acheter", "icon": "fa-cart-shopping",
        "description": "Acquérir un actif numérique existant en toute sécurité.",
        "questions": [
            "Comment acheter un site internet ?",
            "Comment acheter une boutique Shopify ?",
            "Comment acheter un SaaS ?",
            "Comment acheter une chaîne YouTube ?",
            "Comment acheter un compte TikTok ?",
            "Comment acheter un compte Instagram ?",
            "Comment acheter une page Facebook ?",
            "Comment acheter un groupe Facebook ?",
            "Comment acheter un serveur Discord ?",
            "Comment acheter un nom de domaine ?",
            "Comment acheter une newsletter ?",
            "Comment acheter un podcast ?",
            "Comment acheter une application mobile ?",
            "Comment acheter une API ?",
            "Comment acheter un plugin WordPress ?",
        ],
    },
    {
        "key": "vendre", "label": "Vendre", "icon": "fa-hand-holding-dollar",
        "description": "Céder un actif numérique au meilleur prix, en toute sécurité.",
        "questions": [
            "Comment vendre un site internet ?",
            "Comment vendre un blog ?",
            "Comment vendre un forum ?",
            "Comment vendre un annuaire ?",
            "Comment vendre une boutique Shopify ?",
            "Comment vendre une boutique WooCommerce ?",
            "Comment vendre une boutique PrestaShop ?",
            "Comment vendre une boutique Magento ?",
            "Comment vendre une boutique BigCommerce ?",
            "Comment vendre un SaaS ?",
            "Comment vendre un Micro-SaaS ?",
            "Comment vendre une application web ?",
            "Comment vendre une application mobile ?",
            "Comment vendre une chaîne YouTube ?",
            "Comment vendre un compte TikTok ?",
            "Comment vendre un compte Instagram ?",
            "Comment vendre une page Facebook ?",
            "Comment vendre un groupe Facebook ?",
            "Comment vendre un serveur Discord ?",
            "Comment vendre une chaîne Telegram ?",
            "Comment vendre un compte Twitch ?",
            "Comment vendre un compte LinkedIn ?",
            "Comment vendre un compte Pinterest ?",
            "Comment vendre un compte Reddit ?",
            "Comment vendre un compte Threads ?",
            "Comment vendre un nom de domaine ?",
            "Comment vendre une newsletter ?",
            "Comment vendre un podcast ?",
            "Comment vendre une API ?",
            "Comment vendre un plugin WordPress ?",
            "Comment vendre un thème WordPress ?",
            "Comment vendre une marque numérique ?",
        ],
    },
    {
        "key": "estimation", "label": "Estimation", "icon": "fa-scale-balanced",
        "description": "Estimer la valeur d'un actif avant d'acheter ou de vendre.",
        "questions": [
            "Comment estimer un site internet ?",
            "Comment estimer un SaaS ?",
            "Comment estimer une boutique Shopify ?",
            "Comment estimer une chaîne YouTube ?",
            "Comment estimer un compte TikTok ?",
            "Comment estimer un compte Instagram ?",
            "Comment estimer un nom de domaine ?",
            "Quels critères influencent la valeur d'un actif numérique ?",
            "Quelle différence entre estimation standard et estimation expert ?",
        ],
    },
    {
        "key": "transactions-securisees", "label": "Transactions sécurisées", "icon": "fa-shield-halved",
        "description": "Le séquestre des fonds et la protection des deux parties.",
        "questions": [
            "Comment fonctionne le séquestre des fonds ?",
            "Comment fonctionne Stripe Connect ?",
            "Comment se déroule une transaction ?",
            "Comment est protégé l'acheteur ?",
            "Comment est protégé le vendeur ?",
            "Que se passe-t-il en cas de litige ?",
            "Pourquoi les annonces sont-elles validées ?",
            "Pourquoi une annonce peut-elle être refusée ?",
        ],
    },
    {
        "key": "la-garde", "label": "La Garde", "icon": "fa-user-shield",
        "description": "Le tiers de confiance qui supervise et sécurise chaque vente.",
        "questions": [
            "Qu'est-ce que La Garde de La Citadelle ?",
            "Quel est le rôle de La Garde ?",
            "Comment intervient La Garde ?",
            "Comment contacter La Garde ?",
        ],
    },
    {
        "key": "livrable-de-transmission", "label": "Livrable de Transmission", "icon": "fa-box-open",
        "description": "L'ensemble des accès et documents remis à l'acheteur.",
        "questions": [
            "Qu'est-ce que le Livrable de Transmission ?",
            "Pourquoi le Livrable de Transmission est-il important ?",
            "Que contient le Livrable de Transmission ?",
            "Quand le Livrable de Transmission est-il remis ?",
            "Que faire si un accès manque lors de la transmission ?",
        ],
    },
    {
        "key": "encheres", "label": "Enchères", "icon": "fa-gavel",
        "description": "Vendre et acheter au format enchère.",
        "questions": [
            "Comment fonctionnent les enchères ?",
            "Qu'est-ce qu'un prix de réserve ?",
            "Comment remporter une enchère ?",
            "Comment payer après une enchère ?",
            "Peut-on annuler une enchère ?",
        ],
    },
    {
        "key": "mon-compte", "label": "Mon compte", "icon": "fa-user",
        "description": "Gérer votre compte et vos annonces.",
        "questions": [
            "Comment créer un compte ?",
            "Comment publier une annonce ?",
            "Comment modifier une annonce ?",
            "Comment supprimer une annonce ?",
            "Comment partager une annonce ?",
            "Comment retrouver mon mot de passe ?",
            "Comment modifier mon adresse e-mail ?",
            "Comment supprimer mon compte ?",
        ],
    },
    {
        "key": "paiements", "label": "Paiements", "icon": "fa-credit-card",
        "description": "Moyens de paiement, versements et factures.",
        "questions": [
            "Quels moyens de paiement sont acceptés ?",
            "Quand le vendeur reçoit-il son argent ?",
            "Les paiements sont-ils sécurisés ?",
            "Puis-je payer par virement bancaire ?",
            "Une facture est-elle disponible ?",
        ],
    },
    {
        "key": "services", "label": "Services", "icon": "fa-screwdriver-wrench",
        "description": "Estimation, audits, migration, refonte, création de site.",
        "questions": [
            "Comment demander une estimation ?",
            "Comment demander un audit SEO ?",
            "Comment demander un audit de sécurité ?",
            "Comment demander une migration ?",
            "Comment demander une refonte ?",
            "Comment demander la création d'un site internet ?",
        ],
    },
    {
        "key": "juridique", "label": "Juridique", "icon": "fa-file-contract",
        "description": "Commission, TVA, responsabilité, CGU et RGPD.",
        "questions": [
            "Comment fonctionne la commission ?",
            "Les ventes sont-elles soumises à la TVA ?",
            "Qui est responsable de la transaction ?",
            "La plateforme garantit-elle la rentabilité d'un actif ?",
            "Où consulter les CGU ?",
            "Comment fonctionne le RGPD sur la plateforme ?",
        ],
    },
]


def build_registry():
    """Retourne (flat, by_slug, by_category) avec slugs calculés."""
    flat = []
    by_slug = {}
    by_category = {}
    for cat in CATEGORIES:
        cat_items = []
        for q in cat["questions"]:
            slug = slugify(q)
            item = {
                "slug": slug,
                "question": q,
                "category_key": cat["key"],
                "category_label": cat["label"],
            }
            flat.append(item)
            by_slug[slug] = item
            cat_items.append(item)
        by_category[cat["key"]] = cat_items
    return flat, by_slug, by_category


def get_category(key: str):
    for cat in CATEGORIES:
        if cat["key"] == key:
            return cat
    return None
