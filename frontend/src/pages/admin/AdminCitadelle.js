/**
 * Page admin — La Citadelle Numérique
 * Tableau de bord de gestion depuis le back-office Syndicat du Code
 * Phase A : Vue d'ensemble et configuration initiale
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Globe, ShoppingCart, Cloud, Monitor, Users, Settings, ExternalLink, Bell, FileText } from "lucide-react";
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
    { icon: Globe, label: "Annonces", desc: "Gérer et valider les annonces de vente", status: "Phase B", count: 0, href: "/syndicat-admin/citadelle/annonces" },
    { icon: ShoppingCart, label: "Transactions", desc: "Suivre les transactions en cours", status: "Phase C", count: 0, href: "/syndicat-admin/citadelle/transactions" },
    { icon: Users, label: "Utilisateurs", desc: "Membres inscrits sur La Citadelle", status: "Actif", count: null, href: null },
    { icon: Cloud, label: "Services", desc: "Catalogue des services complémentaires", status: "Actif", count: 0, href: "/syndicat-admin/citadelle/services" },
    { icon: FileText, label: "Factures", desc: "Factures PDF générées après paiement", status: "Actif", count: null, href: "/syndicat-admin/citadelle/factures" },
    { icon: Bell, label: "Newsletter", desc: "Alertes annonces & gestion des abonnés", status: "Actif", count: null, href: "/syndicat-admin/citadelle/newsletter" },
    { icon: Monitor, label: "Blog", desc: "Articles et publications", status: "Actif", count: 0, href: "/syndicat-admin/citadelle/blog" },
    { icon: Settings, label: "Paramètres", desc: "Configuration de la plateforme", status: "Phase A", count: null, href: null },
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

        {/* Bannière Phase A */}
        <div className="p-5 rounded-xl flex items-start gap-4"
          style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.2)" }}>
            <Shield size={16} style={{ color: "#C9A45C" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#C9A45C" }}>Phase A — Socle technique en place</p>
            <p className="text-sm mt-1 opacity-70">
              La structure de La Citadelle Numérique est opérationnelle. Le frontend, l'authentification indépendante et l'infrastructure backend sont configurés.
              Les modules de gestion des annonces (Phase B) et des transactions (Phase C) seront développés prochainement.
            </p>
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50">Modules disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(({ icon: Icon, label, desc, status, count, href }) => {
              const isActive = status === "Actif" || status === "Phase A" || status === "Phase B" || status === "Phase C";
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

        {/* Roadmap */}
        <div className="p-5 rounded-xl" style={{ border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-50">Feuille de route</h2>
          <div className="space-y-3">
            {[
              { phase: "Phase A", label: "Socle technique", status: "done", items: "Frontend, Auth, Admin menu" },
              { phase: "Phase B", label: "Marketplace Annonces", status: "done", items: "CRUD annonces, validation admin, recherche, filtres" },
              { phase: "Phase C", label: "Transactions & Paiements", status: "todo", items: "Offres, messagerie, Stripe escrow, litiges" },
              { phase: "Phase D", label: "Services, Avis & Blog", status: "todo", items: "Catalogue services, avis post-transaction, blog CMS" },
              { phase: "Phase E", label: "Stats & SEO", status: "todo", items: "Dashboard analytique, SEO, performance" },
            ].map(({ phase, label, status, items }) => (
              <div key={phase} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-xs font-bold w-16 flex-shrink-0" style={{ color: "#C9A45C" }}>{phase}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs opacity-40 mt-0.5">{items}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: status === "done" ? "rgba(34,197,94,0.1)" : status === "next" ? "rgba(201,164,92,0.1)" : "rgba(255,255,255,0.05)",
                    color: status === "done" ? "#22C55E" : status === "next" ? "#C9A45C" : "rgba(255,255,255,0.3)"
                  }}>
                  {status === "done" ? "Terminé" : status === "next" ? "Prochain" : "À venir"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
