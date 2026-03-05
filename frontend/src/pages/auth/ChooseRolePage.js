/**
 * Page de choix du rôle (première connexion)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Code, ArrowRight, LogOut } from "lucide-react";
import { chooseRole, logout } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { CONFIG } from "@/config/constants";

const ROLES = [
  {
    id: "commercial",
    title: "Partenaire Commercial",
    subtitle: "Apporteur d'affaires",
    icon: Briefcase,
    description: "Vous apportez des clients au Syndicat et touchez des commissions sur les projets.",
    features: [
      "Suivi de vos affaires apportées",
      "Accès aux documents partenaires",
      "Commission sur projets signés"
    ]
  },
  {
    id: "developer",
    title: "Partenaire Développeur",
    subtitle: "Freelance",
    icon: Code,
    description: "Vous rejoignez le réseau de développeurs du Syndicat pour collaborer sur des projets.",
    features: [
      "Accès aux opportunités de missions",
      "Intégration au réseau Syndicat",
      "Accompagnement et ressources"
    ]
  }
];

const ChooseRolePage = () => {
  const navigate = useNavigate();
  const { updateUser, logout: contextLogout, user } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    setError("");

    try {
      const response = await chooseRole(selectedRole);
      updateUser(response.user);
      
      // Redirige vers l'espace approprié
      const redirectPath = selectedRole === "commercial"
        ? "/espace-commercial"
        : "/espace-developpeur";
      navigate(redirectPath);
    } catch (err) {
      const message = err.response?.data?.detail || "Erreur lors du choix du rôle";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    contextLogout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center">
        <img 
          src={CONFIG.logo} 
          alt={CONFIG.companyName} 
          className="h-12"
        />
        <button 
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          {/* Titre */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              Bienvenue au Syndicat !
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Choisissez votre rôle pour accéder à votre espace dédié
            </p>
            <p className="text-sm mt-2 px-4 py-2 rounded-lg inline-block" style={{ background: "var(--bg-section)", color: "var(--text-muted)" }}>
              ⚠️ Ce choix est <strong>définitif</strong> et ne pourra pas être modifié
            </p>
          </div>

          {/* Cartes de rôle */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                    p-6 rounded-2xl text-left transition-all
                    border-2 
                    ${isSelected 
                      ? "border-[var(--sage)] shadow-lg" 
                      : "border-transparent hover:border-gray-200"
                    }
                  `}
                  style={{ 
                    background: isSelected ? "var(--bg-section)" : "var(--bg-card)",
                  }}
                  data-testid={`role-${role.id}`}
                >
                  {/* Header carte */}
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="p-3 rounded-xl"
                      style={{ 
                        background: isSelected 
                          ? "linear-gradient(135deg, var(--sage-dark), var(--sage))" 
                          : "var(--bg-section)" 
                      }}
                    >
                      <Icon size={24} color={isSelected ? "white" : "var(--sage)"} />
                    </div>
                    <div>
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {role.title}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ color: "var(--sage)" }}
                      >
                        {role.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p 
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {role.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li 
                        key={index}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--sage)" }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Indicateur de sélection */}
                  {isSelected && (
                    <div 
                      className="mt-4 pt-4 border-t flex items-center gap-2"
                      style={{ borderColor: "var(--border-color)", color: "var(--sage)" }}
                    >
                      <span className="text-sm font-medium">Sélectionné</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div 
              className="p-3 rounded-lg text-sm bg-red-100 text-red-700 mb-4 text-center"
              data-testid="role-error"
            >
              {error}
            </div>
          )}

          {/* Bouton de confirmation */}
          <div className="text-center">
            <button
              onClick={handleConfirm}
              disabled={!selectedRole || loading}
              className="btn-primary inline-flex items-center gap-2"
              data-testid="role-confirm"
            >
              {loading ? (
                "Confirmation..."
              ) : (
                <>
                  Confirmer mon choix
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChooseRolePage;
