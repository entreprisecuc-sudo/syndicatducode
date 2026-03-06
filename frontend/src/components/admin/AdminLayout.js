/**
 * Layout Admin
 * Interface d'administration avec sidebar spécifique
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, X, LogOut, Users, BarChart3, 
  FileText, History, Shield, Home, Rocket, Megaphone, Bell, CreditCard, Handshake
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CONFIG } from "@/config/constants";

// Menu admin
const ADMIN_MENU = [
  { path: "/syndicat-admin", label: "Tableau de bord", icon: BarChart3 },
  { path: "/syndicat-admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { path: "/syndicat-admin/contacts", label: "Demandes contact", icon: FileText },
  { path: "/syndicat-admin/projets", label: "Projets", icon: Rocket },
  { path: "/syndicat-admin/annonces", label: "Annonces", icon: Megaphone },
  { path: "/syndicat-admin/alertes", label: "Alertes", icon: Bell },
  { path: "/syndicat-admin/abonnements", label: "Abonnements", icon: CreditCard },
  { path: "/syndicat-admin/partenaires", label: "Partenaires", icon: Handshake },
  { path: "/syndicat-admin/logs", label: "Historique", icon: History }
];

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#1a1a2e" }}>
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
          lg:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ background: "#16213e", borderRight: "1px solid #1f4068" }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: "#1f4068" }}>
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-red-500" />
            <div>
              <p className="text-white font-bold text-sm">ADMIN</p>
              <p className="text-gray-400 text-xs">Le Syndicat du Code</p>
            </div>
          </div>
        </div>

        {/* Info admin */}
        <div className="p-4 border-b" style={{ borderColor: "#1f4068" }}>
          <p className="text-white text-sm font-medium truncate">
            {user?.email}
          </p>
          <p className="text-red-400 text-xs mt-1">
            Administrateur
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {ADMIN_MENU.map((item) => {
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
                `}
                style={{ 
                  background: isActive ? "#1f4068" : "transparent",
                  color: isActive ? "#fff" : "#9ca3af"
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Retour au site */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Home size={18} />
            Retour au site
          </Link>
        </div>

        {/* Déconnexion */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: "#1f4068" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-red-400 hover:bg-red-500/10 transition-colors"
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
          style={{ background: "#16213e", borderBottom: "1px solid #1f4068" }}
        >
          {/* Bouton menu mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Titre */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-white">
              {ADMIN_MENU.find(item => item.path === location.pathname)?.label || "Administration"}
            </h1>
          </div>

          {/* Badge admin */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <Shield size={14} />
            Admin
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
