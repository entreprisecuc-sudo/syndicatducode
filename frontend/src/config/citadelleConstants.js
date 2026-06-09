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
  email: "contact@lacitadellenumerique.fr",
};

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
];

// Types de services proposés
export const CITADELLE_SERVICES = [
  { slug: "valuation", label: "Évaluation", icon: "TrendingUp", description: "Estimation précise de la valeur de votre actif numérique", price: "Gratuit" },
  { slug: "verification", label: "Vérification", icon: "ShieldCheck", description: "Audit indépendant du trafic, revenus et données GA", price: "Sur devis" },
  { slug: "migration", label: "Migration", icon: "ArrowRightLeft", description: "Transfert technique complet réalisé par nos partenaires", price: "Sur devis" },
  { slug: "audit", label: "Audit avant vente", icon: "FileSearch", description: "Rapport technique complet pour rassurer les acheteurs", price: "Sur devis" },
];

// Navigation principale
export const CITADELLE_NAV_LINKS = [
  { href: "/citadelle/annonces", label: "Annonces" },
  { href: "/citadelle/vendre", label: "Vendre" },
  { href: "/citadelle/services", label: "Services" },
  { href: "/citadelle/blog", label: "Blog" },
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
  if (path.startsWith("/")) return `${process.env.REACT_APP_BACKEND_URL}${path}`;
  return path;
};

// Extensions reconnues comme images
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
// Extensions reconnues comme documents
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];

/**
 * Détermine si un chemin/URL pointe vers une image
 */
export const isImageFile = (path) => {
  if (!path) return false;
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
