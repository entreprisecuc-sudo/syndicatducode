/**
 * Configuration centralisée de l'application
 * Toutes les constantes et configurations sont ici
 */

// URL de l'API backend
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_URL = `${BACKEND_URL}/api`;

// Email unique du Syndicat
export const CONFIG = {
  companyName: "Le Syndicat du Code",
  email: "atelier@syndicatducode.fr",
  logo: "/logo.png",
  slogan: "Notre loi. Unis par le code.",
};

// Mode développement - Active les boutons de connexion rapide dans le footer
// ⚠️ À DÉSACTIVER EN PRODUCTION
export const DEV_MODE = true;

// Comptes de test pour le mode développement
export const TEST_ACCOUNTS = {
  admin: { email: "admin@syndicatducode.fr", password: "AdminSyndicat2025!" },
  developer: { email: "test@syndicatducode.fr", password: "TestPassword123!" },
  commercial: { email: "commercial1772755291@test.com", password: "TestPassword123!" }
};

// Liens de navigation
export const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#pourquoi", label: "Pourquoi nous" },
  { href: "/membres", label: "Nos talents", isRoute: true },
  { href: "#contact", label: "Contact" }
];

// Services proposés
export const SERVICES = [
  {
    icon: "Monitor",
    title: "Création de sites internet",
    description: "Sites vitrines modernes et responsives adaptés à votre image",
    features: [
      "Sites vitrines modernes et responsives",
      "Sites e-commerce",
      "Optimisation SEO",
      "Performance et sécurité"
    ]
  },
  {
    icon: "Settings",
    title: "Développement CRM & ERP",
    description: "Outils sur mesure adaptés à votre métier",
    features: [
      "Gestion clients et ventes",
      "Stocks et facturation",
      "Connexion outils existants",
      "Solutions évolutives"
    ]
  },
  {
    icon: "Bot",
    title: "Intégration IA",
    description: "Solutions d'intelligence artificielle pour automatiser et optimiser",
    features: [
      "Automatisation des processus",
      "Chatbots intelligents",
      "Analyse de données",
      "IA personnalisée"
    ]
  },
  {
    icon: "Store",
    title: "Marketplace",
    description: "Création de places de marché multi-vendeurs performantes",
    features: [
      "Plateforme multi-vendeurs",
      "Gestion des commissions",
      "Paiements sécurisés",
      "Back-office complet"
    ]
  },
  {
    icon: "Smartphone",
    title: "Applications mobiles",
    description: "Apps iOS & Android natives ou hybrides sur mesure",
    features: [
      "Applications iOS & Android",
      "Design UX/UI moderne",
      "Notifications push",
      "Publication stores"
    ]
  },
  {
    icon: "Wrench",
    title: "Maintenance & Infogérance",
    description: "Support technique continu et gestion de votre infrastructure",
    features: [
      "Support technique réactif",
      "Mises à jour régulières",
      "Sécurité & sauvegardes",
      "Monitoring 24/7"
    ]
  }
];

// Points forts (Pourquoi nous)
export const WHY_US_ITEMS = [
  "Double expertise technique & commerciale",
  "Solutions 100 % personnalisées",
  "Technologies modernes et évolutives",
  "Réactivité et rapidité d'exécution",
  "Accompagnement de A à Z",
  "Support et maintenance continue"
];

// Étapes du processus
export const PROCESS_STEPS = [
  { title: "Analyse de vos besoins", desc: "Nous comprenons votre activité, vos objectifs et vos contraintes." },
  { title: "Conception technique & UX", desc: "Design et architecture pensés pour l'expérience utilisateur." },
  { title: "Développement sur mesure", desc: "Code propre, performant et évolutif." },
  { title: "Tests & sécurité", desc: "Vérification complète avant mise en ligne." },
  { title: "Mise en ligne et accompagnement", desc: "Formation et support pour votre autonomie." }
];

// Public cible
export const AUDIENCES = [
  "Entrepreneurs & startups",
  "PME & grandes entreprises",
  "Commerces & indépendants",
  "Sociétés cherchant à automatiser"
];

// Types de fichiers acceptés pour l'upload
export const ACCEPTED_FILE_TYPES = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
