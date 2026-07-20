/**
 * Layout Admin
 * Interface d'administration avec sidebar organisée en sections
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, X, LogOut, Users, BarChart3, 
  FileText, History, Shield, Home, Rocket, Megaphone, Bell, BookOpen,
  CreditCard, Handshake, BookCheck, Sun, Moon, MessageSquare, Database,
  Globe, ArrowLeftRight, Star, LayoutDashboard, ChevronLeft, Sword, Flag, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminTheme } from "@/context/AdminThemeContext";
import api from "@/services/api";

const UNIVERSE_KEY = "admin_selected_universe";

// ── Menus par univers ────────────────────────────────────────────────────────

const SYNDICAT_MENU = [
  {
    title: "Tableau de bord",
    items: [
      { path: "/syndicat-admin", label: "Vue d'ensemble", icon: BarChart3, description: "Statistiques globales" },
    ],
  },
  {
    title: "Utilisateurs",
    items: [
      { path: "/syndicat-admin/utilisateurs", label: "Gestion utilisateurs", icon: Users, description: "Gérer les comptes membres" },
      { path: "/syndicat-admin/contacts",      label: "Demandes contact",    icon: FileText, description: "Demandes de contact" },
    ],
  },
  {
    title: "Contenus",
    items: [
      { path: "/syndicat-admin/projets",           label: "Projets",           icon: Rocket,       description: "Créer et gérer les projets" },
      { path: "/syndicat-admin/espaces-projets",   label: "Espaces Projets",   icon: MessageSquare,description: "Espaces collaboratifs" },
      { path: "/syndicat-admin/annonces",          label: "Annonces",          icon: Megaphone,    description: "Actualités membres" },
      { path: "/syndicat-admin/alertes",           label: "Alertes",           icon: Bell,         description: "Alertes et popups" },
      { path: "/syndicat-admin/partenaires",       label: "Partenaires",       icon: Handshake,    description: "Logos partenaires" },
      { path: "/syndicat-admin/validation-books",  label: "Validation Books",  icon: BookCheck,    description: "Portfolios à valider" },
    ],
  },
  {
    title: "Abonnements",
    items: [
      { path: "/syndicat-admin/abonnements", label: "Gestion forfaits", icon: CreditCard, description: "Forfaits et paiements" },
    ],
  },
  {
    title: "Système",
    items: [
      { path: "/syndicat-admin/logs",       label: "Historique actions",  icon: History, description: "Actions administratives" },
      { path: "/syndicat-admin/securite",   label: "Anti-Brute Force",    icon: Shield,  description: "Protection anti-brute force" },
      { path: "/syndicat-admin/sauvegarde", label: "Sauvegarde données",  icon: Database,description: "Export données" },
    ],
  },
];

const CITADELLE_MENU = [
  {
    title: "Tableau de bord",
    items: [
      { path: "/syndicat-admin/citadelle", label: "Vue d'ensemble", icon: LayoutDashboard, description: "Dashboard Citadelle" },
    ],
  },
  {
    title: "Utilisateurs (commun)",
    items: [
      { path: "/syndicat-admin/utilisateurs",          label: "Gestion utilisateurs",    icon: Users, description: "Tous les comptes" },
      { path: "/syndicat-admin/citadelle/utilisateurs",label: "Membres Citadelle",        icon: Users, description: "Membres avec KYC et CGU" },
    ],
  },
  {
    title: "La Citadelle",
    items: [
      { path: "/syndicat-admin/citadelle/annonces",    label: "Annonces",           icon: Globe,          description: "Valider les annonces" },
      { path: "/syndicat-admin/citadelle/transactions",label: "Transactions",        icon: ArrowLeftRight, description: "Ventes et litiges" },
      { path: "/syndicat-admin/citadelle/signalements",label: "Signalements",        icon: Flag,           description: "Conversations signalées", badge: "reports" },
      { path: "/syndicat-admin/citadelle/factures",    label: "Factures",            icon: FileText,       description: "Factures PDF" },
      { path: "/syndicat-admin/citadelle/services",    label: "Services",            icon: Star,           description: "Catalogue services" },
      { path: "/syndicat-admin/citadelle/commission",  label: "Commission ventes",   icon: CreditCard,     description: "Taux de commission" },
      { path: "/syndicat-admin/citadelle/newsletter",  label: "Newsletter",          icon: Bell,           description: "Abonnés et scheduler" },
      { path: "/syndicat-admin/citadelle/blog",        label: "Blog",                icon: BookOpen,       description: "Articles Citadelle" },
      { path: "/syndicat-admin/citadelle/analytics",   label: "Statistiques",        icon: TrendingUp,     description: "Fréquentation et parcours" },
    ],
  },
  {
    title: "Système",
    items: [
      { path: "/syndicat-admin/logs",       label: "Historique actions", icon: History, description: "Actions administratives" },
      { path: "/syndicat-admin/securite",   label: "Anti-Brute Force",   icon: Shield,  description: "Protection anti-brute force" },
      { path: "/syndicat-admin/sauvegarde", label: "Sauvegarde données", icon: Database,description: "Export données" },
    ],
  },
];

// Tous les items (pour retrouver le titre de page dans le header)
const ALL_MENU_ITEMS = [...SYNDICAT_MENU, ...CITADELLE_MENU].flatMap(s => s.items);


const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [universe, setUniverse] = useState(() => localStorage.getItem(UNIVERSE_KEY));
  const [alertCount, setAlertCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const { user, logout } = useAuth();
  const { theme, currentTheme, toggleTheme } = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Écouter les changements d'univers
  useEffect(() => {
    const handler = () => setUniverse(localStorage.getItem(UNIVERSE_KEY));
    window.addEventListener("admin_universe_changed", handler);
    return () => window.removeEventListener("admin_universe_changed", handler);
  }, []);

  // Auto-détecter l'univers depuis l'URL (uniquement sur changement de route,
  // pour ne pas ré-imposer "citadelle" lors d'un changement d'univers manuel)
  useEffect(() => {
    if (location.pathname.startsWith("/syndicat-admin/citadelle")
        && localStorage.getItem(UNIVERSE_KEY) !== "citadelle") {
      localStorage.setItem(UNIVERSE_KEY, "citadelle");
      setUniverse("citadelle");
    }
  }, [location.pathname]);

  // Badge alertes — polling 60s
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/admin/push-alerts/summary");
        const total = Object.values(res.data).reduce((s, v) => s + (v.count || 0), 0);
        setAlertCount(total);
      } catch { /* silencieux */ }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Badge signalements Citadelle ouverts — polling 60s
  useEffect(() => {
    if (universe !== "citadelle") return;
    const fetchReports = async () => {
      try {
        const res = await api.get("/citadelle/admin/reports", { params: { status: "open" } });
        setReportsCount(res.data.open_count || 0);
      } catch { /* silencieux */ }
    };
    fetchReports();
    const interval = setInterval(fetchReports, 60000);
    return () => clearInterval(interval);
  }, [universe]);

  const handleLogout = () => { logout(); navigate("/"); };

  // Changer d'univers → retour au sélecteur
  const changeUniverse = () => {
    localStorage.removeItem(UNIVERSE_KEY);
    setUniverse(null);
    navigate("/syndicat-admin");
    window.dispatchEvent(new Event("admin_universe_changed"));
  };

  const isDark = theme === "dark";
  const isCitadelle = universe === "citadelle";

  // Couleurs Citadelle spécifiques pour la sidebar
  const sidebarAccent = isCitadelle ? "#C9A45C" : currentTheme.accent;
  const sidebarBg     = isCitadelle ? "#0a1628"  : currentTheme.bgSidebar;
  const sidebarBorder = isCitadelle ? "rgba(201,164,92,0.2)" : currentTheme.border;

  const menuSections = isCitadelle ? CITADELLE_MENU : SYNDICAT_MENU;

  return (
    <div 
      className="min-h-screen flex transition-colors duration-300" 
      style={{ background: currentTheme.bg }}
    >
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-64 transform transition-all duration-300 ease-in-out
          lg:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
      >
        {/* Logo + univers */}
        <div className="p-4 border-b" style={{ borderColor: sidebarBorder }}>
          <div className="flex items-center gap-3">
            <Shield size={28} style={{ color: sidebarAccent }} />
            <div>
              <p style={{ color: isCitadelle ? "#C9A45C" : currentTheme.text }} className="font-bold text-sm">ADMIN</p>
              <p style={{ color: isCitadelle ? "rgba(255,255,255,0.5)" : currentTheme.textSecondary }} className="text-xs">
                {isCitadelle ? "La Citadelle Numérique" : "Le Syndicat du Code"}
              </p>
            </div>
          </div>
          {/* Bouton changer d'univers */}
          {universe && (
            <button onClick={changeUniverse} data-testid="change-universe-btn"
              className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: `${sidebarAccent}18`, color: sidebarAccent, border: `1px solid ${sidebarAccent}30` }}>
              <ChevronLeft size={13} />
              Changer d'univers
            </button>
          )}
        </div>

        {/* Info admin */}
        <div className="p-4 border-b" style={{ borderColor: sidebarBorder }}>
          <p className="text-sm font-medium truncate" style={{ color: isCitadelle ? "rgba(255,255,255,0.85)" : currentTheme.text }}>
            {user?.email}
          </p>
          <p className="text-xs mt-1" style={{ color: sidebarAccent }}>Administrateur</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3"
                style={{ color: isCitadelle ? "rgba(255,255,255,0.3)" : currentTheme.textMuted }}>
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      title={item.description}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                      style={{
                        background: isActive ? (isCitadelle ? "rgba(201,164,92,0.12)" : currentTheme.bgSection) : "transparent",
                        color: isActive
                          ? (isCitadelle ? "#C9A45C" : currentTheme.text)
                          : (isCitadelle ? "rgba(255,255,255,0.6)" : currentTheme.textSecondary),
                      }}>
                      <span className="flex items-center gap-3">
                        <Icon size={18} />
                        {item.label}
                      </span>
                      {item.badge === "reports" && reportsCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: "#ef4444", color: "white" }} data-testid="sidebar-reports-badge">
                          {reportsCount > 9 ? "9+" : reportsCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Lien Papa en Mousse — App alertes */}
        <div className="absolute bottom-28 left-0 right-0 px-4">
          <Link to="/admin-live" title="App d'alertes admin"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all hover:opacity-90"
            style={{ background: "rgba(201,164,92,0.12)", border: "1px solid rgba(201,164,92,0.2)" }}>
            <div className="flex items-center gap-2">
              <Sword size={16} style={{ color: "#C9A45C" }} />
              <span className="font-semibold" style={{ color: "#C9A45C" }}>Papa en Mousse</span>
            </div>
            {alertCount > 0 && (
              <span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: "#ef4444", color: "white" }}>
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
        </div>

        {/* Retour au site */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <Link to="/" title="Retourner sur le site public"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ color: isCitadelle ? "rgba(255,255,255,0.4)" : currentTheme.textSecondary }}>
            <Home size={18} />
            Retour au site
          </Link>
        </div>

        {/* Déconnexion */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: sidebarBorder }}>
          <button onClick={handleLogout} title="Se déconnecter"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
            style={{ color: sidebarAccent }}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header 
          className="sticky top-0 z-30 px-4 lg:px-6 py-3 flex items-center justify-between transition-colors duration-300"
          style={{ 
            background: currentTheme.bgSidebar, 
            borderBottom: `1px solid ${currentTheme.border}` 
          }}
        >
          {/* Bouton menu mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg"
            style={{ color: currentTheme.text }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Titre */}
          <div className="hidden lg:block">
            <h1 
              className="text-lg font-semibold"
              style={{ color: currentTheme.text }}
            >
              {ALL_MENU_ITEMS.find(item => item.path === location.pathname)?.label || "Administration"}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Toggle thème */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ 
                background: currentTheme.bgSection,
                color: currentTheme.text
              }}
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              data-testid="theme-toggle"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Badge admin */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ 
                background: `${currentTheme.accent}20`, 
                color: currentTheme.accent 
              }}
            >
              <Shield size={14} />
              Admin
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main 
          className="flex-1 p-4 lg:p-6 admin-theme-context min-w-0 overflow-x-hidden"
          style={{
            "--admin-bg": currentTheme.bg,
            "--admin-bg-card": currentTheme.bgCard,
            "--admin-bg-section": currentTheme.bgSection,
            "--admin-border": currentTheme.border,
            "--admin-text": currentTheme.text,
            "--admin-text-secondary": currentTheme.textSecondary,
            "--admin-text-muted": currentTheme.textMuted,
            "--admin-accent": currentTheme.accent
          }}
        >
          {/* Styles dynamiques pour le thème */}
          <style>{`
            .admin-theme-context .text-white { color: var(--admin-text) !important; }
            .admin-theme-context .text-gray-400 { color: var(--admin-text-secondary) !important; }
            .admin-theme-context .text-gray-500 { color: var(--admin-text-muted) !important; }
            .admin-theme-context .text-gray-300 { color: var(--admin-text-secondary) !important; }
            .admin-theme-context .bg-\\[\\#16213e\\] { background: var(--admin-bg-card) !important; }
            .admin-theme-context .bg-\\[\\#1a1a2e\\] { background: var(--admin-bg-section) !important; }
            .admin-theme-context .border-\\[\\#1f4068\\] { border-color: var(--admin-border) !important; }
            .admin-theme-context input, 
            .admin-theme-context select, 
            .admin-theme-context textarea {
              background: var(--admin-bg-section) !important;
              border-color: var(--admin-border) !important;
              color: var(--admin-text) !important;
            }
            .admin-theme-context input::placeholder,
            .admin-theme-context textarea::placeholder {
              color: var(--admin-text-muted) !important;
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
