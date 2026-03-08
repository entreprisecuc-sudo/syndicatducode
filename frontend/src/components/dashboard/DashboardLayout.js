/**
 * Layout principal des espaces membres
 * Sidebar + Header + Contenu
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, X, LogOut, User, FileText, Briefcase, 
  Code, Home, ChevronRight, Bell, CreditCard, Handshake, BookOpen, Mail
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CONFIG } from "@/config/constants";
import NotificationsPopup from "@/components/NotificationsPopup";

// Configuration des menus par rôle
const MENU_ITEMS = {
  commercial: [
    { path: "/espace-commercial", label: "Tableau de bord", icon: Home },
    { path: "/espace-commercial/profil", label: "Mon profil", icon: User },
    { path: "/espace-commercial/affaires", label: "Mes affaires", icon: Briefcase },
    { path: "/espace-commercial/partenaires", label: "Partenaires", icon: Handshake },
    { path: "/espace-commercial/documents", label: "Documents", icon: FileText }
  ],
  developer: [
    { path: "/espace-developpeur", label: "Tableau de bord", icon: Home },
    { path: "/espace-developpeur/profil", label: "Mon profil", icon: User },
    { path: "/espace-developpeur/book", label: "Mon Book", icon: BookOpen },
    { path: "/espace-developpeur/messages", label: "Mes messages", icon: Mail },
    { path: "/espace-developpeur/projets", label: "Projets du Syndicat", icon: Code },
    { path: "/espace-developpeur/abonnement", label: "Mon abonnement", icon: CreditCard },
    { path: "/espace-developpeur/partenaires", label: "Partenaires", icon: Handshake },
    { path: "/espace-developpeur/documents", label: "Documents", icon: FileText }
  ]
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = MENU_ITEMS[user?.role] || [];
  const roleLabel = user?.role === "commercial" ? "Partenaire Commercial" : "Partenaire Développeur";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
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
          w-64 transform transition-transform duration-300 ease-in-out
          lg:transform-none flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border-color)" }}
      >
        {/* Logo */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-color)" }}>
          <Link to="/" className="flex items-center gap-3">
            <img src={CONFIG.logo} alt={CONFIG.companyName} className="h-12" />
          </Link>
        </div>

        {/* Info utilisateur */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {user?.email}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--sage)" }}>
            {roleLabel}
          </p>
        </div>

        {/* Navigation - prend l'espace restant */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-colors
                  ${isActive 
                    ? "font-medium" 
                    : "hover:bg-gray-100"
                  }
                `}
                style={{ 
                  background: isActive ? "var(--bg-section)" : "transparent",
                  color: isActive ? "var(--sage-dark)" : "var(--text-secondary)"
                }}
              >
                <Icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion - toujours en bas */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full hover:bg-red-50 transition-colors"
            style={{ color: "var(--text-muted)" }}
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
          className="sticky top-0 z-30 px-4 lg:px-6 py-3 flex items-center justify-between"
          style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
        >
          {/* Bouton menu mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            style={{ color: "var(--text-primary)" }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Titre page (desktop) */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {menuItems.find(item => item.path === location.pathname)?.label || "Espace membre"}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              className="p-2 rounded-lg hover:bg-gray-100 relative"
              style={{ color: "var(--text-muted)" }}
            >
              <Bell size={20} />
            </button>
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{ background: "var(--sage)" }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Notifications Popup */}
      <NotificationsPopup />
    </div>
  );
};

export default DashboardLayout;
