/**
 * Page admin — La Citadelle Numérique
 * Tableau de bord de gestion depuis le back-office Syndicat du Code
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Globe, ShoppingCart, Cloud, Monitor, Users, Settings, ExternalLink, Bell, FileText, Flag } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

export default function AdminCitadelle() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Comptage des utilisateurs Citadelle en base
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Erreur chargement stats Citadelle:", err);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { icon: Globe, label: "Annonces", desc: "Gérer et valider les annonces de vente", status: "Actif", count: 0, href: "/syndicat-admin/citadelle/annonces" },
    { icon: ShoppingCart, label: "Transactions", desc: "Suivre les transactions en cours", status: "Actif", count: 0, href: "/syndicat-admin/citadelle/transactions" },
    { icon: Flag, label: "Signalements", desc: "Conversations signalées par les utilisateurs", status: "Actif", count: null, href: "/syndicat-admin/citadelle/signalements" },
    { icon: Users, label: "Utilisateurs", desc: "Membres inscrits sur La Citadelle", status: "Actif", count: null, href: null },
    { icon: Cloud, label: "Services", desc: "Catalogue des services complémentaires", status: "Actif", count: 0, href: "/syndicat-admin/citadelle/services" },
    { icon: FileText, label: "Factures", desc: "Factures PDF générées après paiement", status: "Actif", count: null, href: "/syndicat-admin/citadelle/factures" },
    { icon: Bell, label: "Newsletter", desc: "Alertes annonces & gestion des abonnés", status: "Actif", count: null, href: "/syndicat-admin/citadelle/newsletter" },
    { icon: Monitor, label: "Blog", desc: "Articles et publications", status: "Actif", count: 0, href: "/syndicat-admin/citadelle/blog" },
    { icon: Settings, label: "Paramètres", desc: "Configuration de la plateforme", status: "Actif", count: null, href: null },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-citadelle-dashboard">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
              <Shield size={20} style={{ color: "#C9A45C" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                La Citadelle Numérique
              </h1>
              <p className="text-sm opacity-60">Tableau de bord de gestion</p>
            </div>
          </div>
          <a
            href="/citadelle"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ border: "1px solid #C9A45C", color: "#C9A45C", background: "transparent" }}
            data-testid="admin-citadelle-open-site"
          >
            <ExternalLink size={15} />
            Voir le site
          </a>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50">Modules disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(({ icon: Icon, label, desc, status, count, href }) => {
              const isActive = status === "Actif";
              const cardContent = (
                <div
                  key={label}
                  className="p-5 rounded-xl transition-all"
                  style={{
                    background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                    border: href ? "1px solid rgba(201,164,92,0.3)" : "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                    opacity: isActive ? 1 : 0.6,
                    cursor: href ? "pointer" : "default"
                  }}
                  data-testid={`admin-citadelle-module-${label.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,164,92,0.1)" }}>
                      <Icon size={18} style={{ color: "#C9A45C" }} />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: isActive ? "rgba(34,197,94,0.1)" : "rgba(201,164,92,0.1)",
                        color: isActive ? "#22C55E" : "#C9A45C"
                      }}>
                      {status}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{label}</p>
                  <p className="text-xs opacity-50">{desc}</p>
                  {count !== null && (
                    <p className="text-2xl font-bold mt-3" style={{ color: "#C9A45C", fontFamily: "'Montserrat', sans-serif" }}>
                      {loading ? "—" : count}
                    </p>
                  )}
                  {href && <p className="text-xs mt-3" style={{ color: "#C9A45C" }}>Accéder →</p>}
                </div>
              );
              return href ? (
                <Link key={label} to={href} className="block hover:scale-[1.02] transition-transform">
                  {cardContent}
                </Link>
              ) : (
                <div key={label}>{cardContent}</div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
