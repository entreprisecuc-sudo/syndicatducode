"""
Registre dynamique du module Transmission d'actif — La Citadelle Numérique.

Architecture pilotée par configuration : pour ajouter un type d'actif, une
section ou un champ, il suffit de modifier ce fichier — aucune refonte.

- SECTIONS         : catalogue des sections d'accès réutilisables
- TYPE_SECTIONS    : mapping type d'actif -> liste de sections affichées (étape 3)
- DEFAULT_CHECKLIST: cases à cocher (étape 4)
- RECOMMENDED_SERVICES : services proposables (étape 6)

Un champ `sensitive=True` est chiffré au repos et n'apparaît JAMAIS dans le
document du vendeur (uniquement acheteur + admin).
"""

# type: "text" | "password" | "textarea" | "url"
def _f(key, label, sensitive=False, type="text"):
    return {"key": key, "label": label, "sensitive": sensitive, "type": type}


SECTIONS = {
    "domain": {
        "title": "Nom de domaine",
        "fields": [
            _f("registrar", "Registrar"),
            _f("login", "Identifiant", sensitive=True),
            _f("password", "Mot de passe", sensitive=True, type="password"),
            _f("auth_code", "Code Auth / EPP", sensitive=True),
            _f("dns", "Configuration DNS", type="textarea"),
            _f("cloudflare", "Accès Cloudflare", sensitive=True),
            _f("expiration", "Date d'expiration"),
            _f("auto_renew", "Renouvellement automatique"),
            _f("dnssec", "DNSSEC"),
        ],
    },
    "hosting": {
        "title": "Hébergement",
        "fields": [
            _f("provider", "Hébergeur"),
            _f("panel", "Panneau (cPanel/Plesk…)"),
            _f("user", "Utilisateur", sensitive=True),
            _f("password", "Mot de passe", sensitive=True, type="password"),
            _f("ftp", "Accès FTP", sensitive=True, type="textarea"),
            _f("ssh", "Accès SSH", sensitive=True, type="textarea"),
            _f("database", "Base de données", sensitive=True, type="textarea"),
        ],
    },
    "cms": {
        "title": "CMS / Framework",
        "fields": [
            _f("platform", "Plateforme (WordPress, Prestashop, Laravel…)"),
            _f("version", "Version"),
            _f("admin_account", "Compte administrateur", sensitive=True, type="textarea"),
        ],
    },
    "ecommerce": {
        "title": "Boutique / E-commerce",
        "fields": [
            _f("shop_platform", "Plateforme (Shopify, WooCommerce, Amazon…)"),
            _f("admin_account", "Compte administrateur", sensitive=True, type="textarea"),
            _f("payment_gateways", "Passerelles de paiement", sensitive=True, type="textarea"),
            _f("suppliers", "Fournisseurs / logistique", type="textarea"),
        ],
    },
    "google": {
        "title": "Écosystème Google",
        "fields": [
            _f("analytics", "Google Analytics"),
            _f("search_console", "Search Console"),
            _f("tag_manager", "Tag Manager"),
            _f("google_ads", "Google Ads"),
            _f("merchant_center", "Merchant Center"),
        ],
    },
    "payments": {
        "title": "Paiements",
        "fields": [
            _f("stripe", "Stripe", sensitive=True, type="textarea"),
            _f("paypal", "PayPal", sensitive=True, type="textarea"),
            _f("other", "Autres passerelles", sensitive=True, type="textarea"),
        ],
    },
    "emails": {
        "title": "Emails & envoi",
        "fields": [
            _f("smtp", "SMTP", sensitive=True, type="textarea"),
            _f("brevo", "Brevo"),
            _f("mailchimp", "Mailchimp"),
            _f("mailgun", "Mailgun"),
            _f("other", "Autres"),
        ],
    },
    "saas": {
        "title": "Infrastructure SaaS",
        "fields": [
            _f("github", "Dépôt GitHub", sensitive=True),
            _f("gitlab", "Dépôt GitLab", sensitive=True),
            _f("docker", "Docker / Registry", sensitive=True, type="textarea"),
            _f("env_vars", "Variables ENV", sensitive=True, type="textarea"),
            _f("api_keys", "Clés API", sensitive=True, type="textarea"),
            _f("ci_cd", "CI / CD"),
            _f("servers", "Serveurs", sensitive=True, type="textarea"),
            _f("license", "Licence"),
            _f("subscriptions", "Abonnements"),
            _f("documentation", "Documentation"),
        ],
    },
    "social": {
        "title": "Réseau social",
        "fields": [
            _f("email", "Email du compte", sensitive=True),
            _f("phone", "Téléphone", sensitive=True),
            _f("auth", "Authentification (2FA, codes secours)", sensitive=True, type="textarea"),
            _f("password", "Mot de passe", sensitive=True, type="password"),
            _f("meta_business", "Meta Business"),
            _f("pixels", "Pixels / tracking"),
            _f("business_manager", "Business Manager"),
        ],
    },
    "newsletter": {
        "title": "Newsletter",
        "fields": [
            _f("platform", "Plateforme"),
            _f("access", "Accès plateforme", sensitive=True, type="textarea"),
            _f("subscribers", "Nombre d'abonnés"),
            _f("segmentation", "Segmentation"),
            _f("automations", "Automatisations"),
            _f("templates", "Templates"),
        ],
    },
    "ai_agent": {
        "title": "Agent IA / Automatisations",
        "fields": [
            _f("ai_provider", "Fournisseur IA"),
            _f("openai_api", "API OpenAI", sensitive=True),
            _f("anthropic_api", "API Anthropic", sensitive=True),
            _f("gemini_api", "API Gemini", sensitive=True),
            _f("main_prompt", "Prompt principal", type="textarea"),
            _f("vector_db", "Base vectorielle", sensitive=True),
            _f("n8n", "n8n", sensitive=True),
            _f("make", "Make"),
            _f("zapier", "Zapier"),
            _f("documentation", "Documentation"),
        ],
    },
    "generic": {
        "title": "Accès de l'actif",
        "fields": [
            _f("accounts", "Comptes & identifiants", sensitive=True, type="textarea"),
            _f("credentials", "Mots de passe / clés", sensitive=True, type="textarea"),
            _f("notes", "Notes techniques", type="textarea"),
        ],
    },
}

TYPE_SECTIONS = {
    "website":        ["domain", "hosting", "cms", "google", "payments", "emails"],
    "ecommerce":      ["domain", "hosting", "cms", "ecommerce", "google", "payments", "emails"],
    "saas":           ["saas", "domain", "hosting", "payments", "emails"],
    "webapp":         ["saas", "domain", "hosting", "payments"],
    "social_account": ["social"],
    "youtube_channel":["social", "google"],
    "instagram":      ["social"],
    "tiktok":         ["social"],
    "linkedin_page":  ["social"],
    "discord_server": ["social"],
    "domain":         ["domain"],
    "shopify_store":  ["ecommerce", "domain", "payments", "emails"],
    "amazon_fba":     ["ecommerce", "emails"],
    "newsletter":     ["newsletter", "emails"],
    "forum":          ["domain", "hosting", "cms", "google", "emails"],
    "blog":           ["domain", "hosting", "cms", "google", "emails"],
    "online_media":   ["domain", "hosting", "cms", "google", "payments", "emails"],
    "ai_automation":  ["ai_agent", "hosting"],
    "template_plugin":["generic"],
    "database_api":   ["saas", "hosting"],
}

DEFAULT_CHECKLIST = [
    {"key": "domain_transferred", "label": "Domaine transféré"},
    {"key": "hosting_transferred", "label": "Hébergement transféré"},
    {"key": "analytics_transferred", "label": "Analytics transféré"},
    {"key": "search_console_transferred", "label": "Search Console transférée"},
    {"key": "payments_transferred", "label": "Comptes de paiement transférés"},
    {"key": "social_transferred", "label": "Réseaux sociaux transférés"},
    {"key": "backup_done", "label": "Sauvegarde réalisée"},
    {"key": "mfa_enabled", "label": "MFA activé"},
    {"key": "passwords_changed", "label": "Tous les mots de passe changés"},
    {"key": "operation_verified", "label": "Fonctionnement vérifié"},
]

RECOMMENDED_SERVICES = [
    {"key": "cybersecurity_audit", "label": "Audit Cybersécurité"},
    {"key": "premium_migration", "label": "Migration Premium"},
    {"key": "seo_audit", "label": "Audit SEO"},
    {"key": "maintenance", "label": "Maintenance"},
    {"key": "performance", "label": "Optimisation des performances"},
    {"key": "premium_support", "label": "Accompagnement Premium"},
    {"key": "ai_automation", "label": "Automatisation IA"},
    {"key": "asset_valuation", "label": "Valorisation d'actif"},
    {"key": "monitoring", "label": "Monitoring"},
    {"key": "backups", "label": "Sauvegardes"},
    {"key": "hosting", "label": "Hébergement"},
]


def get_access_schema(asset_type: str) -> list:
    """Retourne la liste des sections (avec champs) pour un type d'actif donné."""
    section_keys = TYPE_SECTIONS.get(asset_type, ["generic"])
    out = []
    for key in section_keys:
        sec = SECTIONS.get(key)
        if sec:
            out.append({"key": key, "title": sec["title"], "fields": sec["fields"]})
    return out


def is_sensitive(section_key: str, field_key: str) -> bool:
    sec = SECTIONS.get(section_key, {})
    for f in sec.get("fields", []):
        if f["key"] == field_key:
            return f["sensitive"]
    return True  # par défaut, on chiffre (principe de précaution)


def field_label(section_key: str, field_key: str) -> str:
    sec = SECTIONS.get(section_key, {})
    for f in sec.get("fields", []):
        if f["key"] == field_key:
            return f["label"]
    return field_key
