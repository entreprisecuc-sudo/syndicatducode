/**
 * Layout Admin
 * Interface d'administration avec sidebar organisée en sections
 * Support mode sombre/clair
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, X, LogOut, Users, BarChart3, 
  FileText, History, Shield, Home, Rocket, Megaphone, Bell, 
  CreditCard, Handshake, BookCheck, Sun, Moon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminTheme } from "@/context/AdminThemeContext";

// Menu admin organisé en sections avec descriptions pour les tooltips
const ADMIN_MENU_SECTIONS = [
  {
    title: "Tableau de bord",
    items: [
      { 
        path: "/syndicat-admin", 
        label: "Vue d'ensemble", 
        icon: BarChart3,
        description: "Statistiques globales et indicateurs clés de la plateforme"
      }
    ]
  },
  {
    title: "Utilisateurs",
    items: [
      { 
        path: "/syndicat-admin/utilisateurs", 
        label: "Gestion utilisateurs", 
        icon: Users,
        description: "Gérer les comptes membres : développeurs, commerciaux et admins"
      },
      { 
        path: "/syndicat-admin/contacts", 
        label: "Demandes contact", 
        icon: FileText,
        description: "Consulter et traiter les demandes de contact du formulaire"
      }
    ]
  },
  {
    title: "Contenus",
    items: [
      { 
        path: "/syndicat-admin/projets", 
        label: "Projets", 
        icon: Rocket,
        description: "Créer et gérer les projets, traiter les candidatures"
      },
      { 
        path: "/syndicat-admin/annonces", 
        label: "Annonces", 
        icon: Megaphone,
        description: "Publier des annonces et actualités pour les membres"
      },
      { 
        path: "/syndicat-admin/alertes", 
        label: "Alertes", 
        icon: Bell,
        description: "Créer des alertes et popups pour les membres ou visiteurs"
      },
      { 
        path: "/syndicat-admin/partenaires", 
        label: "Partenaires", 
        icon: Handshake,
        description: "Gérer les partenaires et leurs logos affichés sur le site"
      },
      { 
        path: "/syndicat-admin/validation-books", 
        label: "Validation Books", 
        icon: BookCheck,
        description: "Valider ou refuser les portfolios soumis par les développeurs"
      }
    ]
  },
  {
    title: "Abonnements",
    items: [
      { 
        path: "/syndicat-admin/abonnements", 
        label: "Gestion forfaits", 
        icon: CreditCard,
        description: "Configurer les forfaits d'abonnement et suivre les paiements"
      }
    ]
  },
  {
    title: "Système",
    items: [
      { 
        path: "/syndicat-admin/logs", 
        label: "Historique actions", 
        icon: History,
        description: "Consulter l'historique des actions administratives"
      }
    ]
  }
];

// Liste plate pour la recherche du titre
const ALL_MENU_ITEMS = ADMIN_MENU_SECTIONS.flatMap(section => section.items);

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, currentTheme, toggleTheme } = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isDark = theme === "dark";

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
          fixed lg:static inset-y-0 left-0 z-50
          w-64 transform transition-all duration-300 ease-in-out
          lg:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ 
          background: currentTheme.bgSidebar, 
          borderRight: `1px solid ${currentTheme.border}` 
        }}
      >
        {/* Logo */}
        <div 
          className="p-4 border-b transition-colors duration-300" 
          style={{ borderColor: currentTheme.border }}
        >
          <div className="flex items-center gap-3">
            <Shield size={28} style={{ color: currentTheme.accent }} />
            <div>
              <p style={{ color: currentTheme.text }} className="font-bold text-sm">ADMIN</p>
              <p style={{ color: currentTheme.textSecondary }} className="text-xs">Le Syndicat du Code</p>
            </div>
          </div>
        </div>

        {/* Info admin */}
        <div 
          className="p-4 border-b transition-colors duration-300" 
          style={{ borderColor: currentTheme.border }}
        >
          <p 
            className="text-sm font-medium truncate"
            style={{ color: currentTheme.text }}
          >
            {user?.email}
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: currentTheme.accent }}
          >
            Administrateur
          </p>
        </div>

        {/* Navigation */}
        <nav 
          className="p-4 space-y-4 overflow-y-auto" 
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          {ADMIN_MENU_SECTIONS.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Titre de section */}
              <p 
                className="text-xs font-semibold uppercase tracking-wider mb-2 px-3"
                style={{ color: currentTheme.textMuted }}
              >
                {section.title}
              </p>
              
              {/* Items de la section */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      title={item.description}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                      style={{ 
                        background: isActive ? currentTheme.bgSection : "transparent",
                        color: isActive ? currentTheme.text : currentTheme.textSecondary
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Retour au site */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ color: currentTheme.textSecondary }}
          >
            <Home size={18} />
            Retour au site
          </Link>
        </div>

        {/* Déconnexion */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 border-t transition-colors duration-300" 
          style={{ borderColor: currentTheme.border }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
            style={{ color: currentTheme.accent }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-h-screen">
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
          className="flex-1 p-4 lg:p-6 admin-theme-context"
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
