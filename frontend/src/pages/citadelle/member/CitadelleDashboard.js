/**
 * Espace membre — La Citadelle Numérique (stub Phase A)
 * Sera enrichi en Phase B avec la gestion des annonces
 */

import { Link, useNavigate } from "react-router-dom";
import { Shield, Plus, MessageSquare, ArrowLeftRight, FileText, User, LogOut, TrendingUp } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS, CITADELLE_CONFIG } from "@/config/citadelleConstants";

export default function CitadelleDashboard() {
  const { user, logout, isAuthenticated } = useCitadelleAuth();
  const navigate = useNavigate();

  // Redirection si non connecté
  if (!isAuthenticated) {
    navigate("/citadelle/connexion");
    return null;
  }

  const menuItems = [
    { icon: Plus,          label: "Publier une annonce", desc: "Mettez votre actif en vente",      href: "/citadelle/espace-membre/mes-annonces/creer", active: true },
    { icon: FileText,      label: "Mes annonces",         desc: "Gérez vos annonces actives",       href: "/citadelle/espace-membre/mes-annonces",        active: true },
    { icon: ArrowLeftRight,label: "Mes transactions",     desc: "Suivez vos achats et ventes",      href: "/citadelle/espace-membre/transactions",    active: true },
    { icon: MessageSquare, label: "Mes messages",         desc: "Échangez avec acheteurs et vendeurs", href: "/citadelle/espace-membre/mes-messages",     active: false, badge: "Bientôt" },
    { icon: TrendingUp,    label: "Mes services",         desc: "Demandes d'évaluation et d'audit", href: "/citadelle/espace-membre/mes-services",        active: false, badge: "Bientôt" },
    { icon: User,          label: "Mon profil",           desc: "Modifier mes informations",        href: "/citadelle/espace-membre/profil",              active: true },
  ];

  return (
    <CitadelleLayout>
      <div className="min-h-screen py-12 px-4" style={{ background: CITADELLE_COLORS.bg }}>
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10 p-8 rounded-2xl" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} style={{ color: CITADELLE_COLORS.gold }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>
                    Espace Membre
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Bonjour, {user?.first_name || "Membre"} !
                </h1>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Bienvenue sur votre espace La Citadelle Numérique
                </p>
              </div>
              <button
                onClick={() => { logout(); navigate("/citadelle"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                data-testid="citadelle-member-logout"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </div>
          </div>

          {/* Message Phase A */}
          <div className="mb-8 p-5 rounded-xl flex items-start gap-3" style={{ background: "rgba(201,164,92,0.08)", border: `1px solid rgba(201,164,92,0.25)` }}>
            <Shield size={20} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: CITADELLE_COLORS.blue }}>Plateforme en cours de développement</p>
              <p className="text-sm mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                La Citadelle Numérique est en construction. Les fonctionnalités de publication d'annonces et de transaction seront disponibles très prochainement.
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(({ icon: Icon, label, desc, href, active, badge }) => {
              const CardContent = (
                <div
                  key={label}
                  className="p-5 rounded-2xl relative transition-all"
                  style={{
                    background: "white",
                    border: `1px solid ${active ? "rgba(201,164,92,0.3)" : CITADELLE_COLORS.border}`,
                    opacity: active ? 1 : 0.65,
                    cursor: active ? "pointer" : "default"
                  }}
                  data-testid={`citadelle-member-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {badge && (
                    <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(201,164,92,0.12)", color: CITADELLE_COLORS.gold }}>
                      {badge}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: active ? "rgba(201,164,92,0.1)" : "rgba(15,39,71,0.07)" }}>
                    <Icon size={20} style={{ color: active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.blue }} />
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: CITADELLE_COLORS.blue }}>{label}</p>
                  <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>{desc}</p>
                </div>
              );
              return active ? (
                <Link key={label} to={href} className="block hover:scale-[1.02] transition-transform">
                  {CardContent}
                </Link>
              ) : (
                <div key={label}>{CardContent}</div>
              );
            })}
          </div>
        </div>
      </div>
    </CitadelleLayout>
  );
}
