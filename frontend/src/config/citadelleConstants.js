/**
 * Configuration centralisée — La Citadelle Numérique
 * Charte graphique validée le 02/06/2026
 */

export const CITADELLE_API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/citadelle`;

export const CITADELLE_CONFIG = {
  name: "La Citadelle Numérique",
  domain: "lacitadellenumerique.fr",
  tagline: "Achetez. Vendez. Sécurisez.",
  description: "La plateforme française dédiée à l'achat et à la vente d'actifs numériques.",
  promise: "Vendez votre projet numérique en toute confiance.",
  logo: "/citadelle-logo.png",
  email: "lagarde@lacitadellenumerique.fr",
};

// URL publique canonique (SEO) — pilotée par l'environnement, repli sur le domaine officiel
export const CITADELLE_PUBLIC_URL =
  process.env.REACT_APP_CITADELLE_URL || `https://${CITADELLE_CONFIG.domain}`;

// Palette de couleurs — charte graphique officielle
export const CITADELLE_COLORS = {
  blue: "#0F2747",
  night: "#081729",
  gold: "#C9A45C",
  goldLight: "#D9BB7A",
  white: "#FFFFFF",
  bg: "#F5F7FA",
  textMuted: "#5F6672",
  border: "#DDE3EA",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#DC2626",
};

// Catégories d'annonces — les slugs doivent correspondre aux LISTING_TYPES du backend
export const CITADELLE_CATEGORIES = [
  { slug: "website",        label: "Sites internet",    icon: "Globe",        description: "Sites vitrines, blogs, portfolios" },
  { slug: "ecommerce",      label: "E-commerce",        icon: "ShoppingCart", description: "Boutiques en ligne, marketplaces" },
  { slug: "saas",           label: "SaaS",              icon: "Cloud",        description: "Logiciels en tant que service" },
  { slug: "webapp",         label: "Applications web",  icon: "Monitor",      description: "Apps web, outils en ligne" },
  { slug: "social_account", label: "Réseaux sociaux",   icon: "Users",        description: "Comptes, pages, communautés" },
  { slug: "domain",         label: "Noms de domaine",  icon: "Globe",        description: "Domaines, extensions premium" },
];

// Types de services — utilisé sur la page d'accueil (section présentation)
export const CITADELLE_SERVICES = [
  { slug: "valuation",    label: "Évaluation",      icon: "TrendingUp",    description: "Estimation précise de la valeur de votre actif numérique", price: "Gratuit" },
  { slug: "verification", label: "Vérification",    icon: "ShieldCheck",   description: "Audit indépendant du trafic, revenus et données GA",        price: "Sur devis" },
  { slug: "migration",    label: "Migration",       icon: "ArrowRightLeft",description: "Transfert technique complet réalisé par nos partenaires",    price: "Sur devis" },
  { slug: "audit",        label: "Audit avant vente",icon: "FileSearch",   description: "Rapport technique complet pour rassurer les acheteurs",      price: "Sur devis" },
];

// Catégories supplémentaires ("Autre") — accessibles via le panneau expansible
export const CITADELLE_EXTRA_CATEGORIES = [
  { slug: "shopify_store",   label: "Boutique Shopify",              icon: "Store",          estimType: "ecommerce", description: "Boutique Shopify, dropshipping" },
  { slug: "amazon_fba",      label: "Amazon FBA",                    icon: "Package",        estimType: "ecommerce", description: "Business Amazon FBA / Merch" },
  { slug: "newsletter",      label: "Newsletter",                    icon: "Mail",           estimType: "contenu",   description: "Newsletter payante ou sponsorisée" },
  { slug: "youtube_channel", label: "Chaîne YouTube",                icon: "Youtube",        estimType: "social",    description: "Chaîne monétisée YouTube" },
  { slug: "instagram",       label: "Compte Instagram",              icon: "Camera",         estimType: "social",    description: "Compte ou page Instagram" },
  { slug: "tiktok",          label: "Compte TikTok",                 icon: "Smartphone",     estimType: "social",    description: "Compte TikTok monétisé" },
  { slug: "linkedin_page",   label: "Page LinkedIn Entreprise",      icon: "Linkedin",       estimType: "social",    description: "Page entreprise LinkedIn" },
  { slug: "discord_server",  label: "Serveur Discord",               icon: "MessageSquare",  estimType: "social",    description: "Communauté Discord" },
  { slug: "forum",           label: "Forum",                         icon: "MessagesSquare", estimType: "contenu",   description: "Forum ou communauté en ligne" },
  { slug: "blog",            label: "Blog",                          icon: "FileText",       estimType: "contenu",   description: "Blog monétisé" },
  { slug: "online_media",    label: "Média en ligne",                icon: "Newspaper",      estimType: "contenu",   description: "Magazine, journal, media digital" },
  { slug: "ai_automation",   label: "Agents IA / Automatisations",   icon: "Bot",            estimType: "saas",      description: "Outils IA, scripts, workflows" },
  { slug: "template_plugin", label: "Templates / Thèmes / Plugins",  icon: "LayoutTemplate", estimType: "saas",      description: "Assets numériques revendables" },
  { slug: "database_api",    label: "Bases de données / APIs",       icon: "Database",       estimType: "saas",      description: "APIs, datasets, bases de données" },
];

// Toutes les catégories combinées (pour dropdowns de filtres)
export const CITADELLE_ALL_CATEGORIES = [...CITADELLE_CATEGORIES, ...CITADELLE_EXTRA_CATEGORIES];

// Commission La Citadelle sur chaque vente
export const COMMISSION_RATE = 0.05;     // 5 %
export const COMMISSION_MINIMUM_EUR = 49; // Minimum 49 €
export const SERVICE_TARGET_SECTIONS = [
  {
    key: "vendeur",
    label: "Pour les vendeurs",
    subtitle: "Évaluez, optimisez et valorisez votre projet avant la vente.",
  },
  {
    key: "acheteur",
    label: "Pour les acheteurs",
    subtitle: "Sécurisez votre investissement avant et après l'acquisition.",
  },
  {
    key: "commun",
    label: "Services communs",
    subtitle: "Des services essentiels pour toutes vos transactions.",
  },
];

// Catégories du blog — centralisées ici pour usage public et admin
export const BLOG_CATEGORIES = [
  { slug: "actualites",        label: "Actualités" },
  { slug: "conseils",          label: "Conseils" },
  { slug: "tutoriels",         label: "Tutoriels" },
  { slug: "marche",            label: "Marché" },
  { slug: "juridique",         label: "Juridique" },
  { slug: "vendre-un-site",    label: "Vendre un site" },
  { slug: "acheter-un-site",   label: "Acheter un site" },
  { slug: "estimation",        label: "Estimation" },
  { slug: "seo",               label: "SEO" },
  { slug: "securite",          label: "Sécurité" },
  { slug: "migration",         label: "Migration" },
  { slug: "business",          label: "Business" },
  { slug: "ecommerce",         label: "E-commerce" },
  { slug: "saas",              label: "SaaS" },
  { slug: "vente-applications",label: "Applications mobiles" },
  { slug: "reseaux-sociaux",   label: "Réseaux sociaux" },
  { slug: "marketplace",       label: "Marketplace" },
  { slug: "nom-de-domaine",    label: "Nom de domaine" },
  { slug: "newsletter",        label: "Newsletter" },
  { slug: "communautes",       label: "Communautés" },
  { slug: "investissement",    label: "Investissement" },
  { slug: "chroniques-la-garde", label: "Les Chroniques de La Garde" },
  { slug: "guide-la-citadelle", label: "Le Guide de La Citadelle" },
];

// Navigation principale
export const CITADELLE_NAV_LINKS = [
  { href: "/citadelle/annonces", label: "Annonces" },
  { href: "/citadelle/vendre", label: "Vendre" },
  { href: "/citadelle/services", label: "Services" },
  { href: "/citadelle/parutions", label: "Les Parutions" },
];

/**
 * Résout l'URL complète d'une image/fichier d'annonce.
 * - Chemins relatifs /uploads/* → préfixés avec REACT_APP_BACKEND_URL
 * - URLs externes http(s):// → retournées telles quelles
 * - null/undefined → null
 */
export const getListingImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Les chemins /uploads/* doivent passer par /api/uploads/* pour le routage Kubernetes
  if (path.startsWith("/uploads/")) return `${process.env.REACT_APP_BACKEND_URL}/api${path}`;
  if (path.startsWith("/")) return `${process.env.REACT_APP_BACKEND_URL}${path}`;
  return path;
};

// Extensions reconnues comme images
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
// Extensions reconnues comme documents
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];

/**
 * Détermine si un chemin/URL pointe vers une image
 * Les URLs externes http(s):// (Unsplash, Pexels, etc.) sont considérées comme images
 */
export const isImageFile = (path) => {
  if (!path) return false;
  // URL externe → toujours considérée comme image (Unsplash, Pexels, etc.)
  if (path.startsWith("http://") || path.startsWith("https://")) return true;
  const ext = path.split("?")[0].split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.includes(`.${ext}`);
};

/**
 * Détermine si un chemin/URL pointe vers un document
 */
export const isDocumentFile = (path) => {
  if (!path) return false;
  const ext = path.split("?")[0].split(".").pop()?.toLowerCase();
  return DOCUMENT_EXTENSIONS.includes(`.${ext}`);
};

/**
 * Retourne un label lisible pour l'extension du fichier
 */
export const getFileLabel = (path) => {
  if (!path) return "Fichier";
  const ext = path.split("?")[0].split(".").pop()?.toUpperCase();
  return ext || "Fichier";
};
