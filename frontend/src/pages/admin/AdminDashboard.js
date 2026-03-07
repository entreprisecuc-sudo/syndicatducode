/**
 * Dashboard Admin
 * Vue d'ensemble avec statistiques avancées
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { 
  Users, UserCheck, UserX, Clock, FileText, TrendingUp,
  Rocket, Megaphone, Bell, CreditCard, Handshake, Euro,
  Mail, CheckCircle, AlertCircle, FolderOpen
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

/**
 * Carte de statistique individuelle
 */
const StatCard = ({ icon: Icon, label, value, color = "#6366f1", subtext }) => (
  <div 
    className="p-4 rounded-xl transition-colors duration-300"
    style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-1 truncate" style={{ color: "var(--admin-text-muted)" }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>{value}</p>
        {subtext && (
          <p className="text-xs mt-1" style={{ color: "var(--admin-text-muted)" }}>{subtext}</p>
        )}
      </div>
      <div 
        className="p-2 rounded-lg flex-shrink-0 ml-2"
        style={{ background: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  </div>
);

/**
 * Section de statistiques avec titre
 */
const StatsSection = ({ title, children, columns = 5 }) => (
  <div className="mb-6">
    <h3 
      className="font-semibold mb-3 text-sm uppercase tracking-wide"
      style={{ color: "var(--admin-text)" }}
    >
      {title}
    </h3>
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${columns} gap-3`}>
      {children}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatage du montant en euros
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Tableau de bord
      </h1>

      {/* Message de bienvenue */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ background: "linear-gradient(135deg, #e94560, #1f4068)" }}
      >
        <h2 className="text-lg font-semibold text-white mb-1">
          Administration Le Syndicat du Code
        </h2>
        <p className="text-white/80 text-sm">
          Vue d'ensemble de la plateforme et statistiques en temps réel.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "var(--admin-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : (
        <>
          {/* ===== UTILISATEURS ===== */}
          <StatsSection title="👥 Utilisateurs" columns={6}>
            <StatCard 
              icon={Users}
              label="Total"
              value={stats?.users?.total || 0}
              color="#6366f1"
            />
            <StatCard 
              icon={UserCheck}
              label="Actifs"
              value={stats?.users?.active || 0}
              color="#10b981"
            />
            <StatCard 
              icon={TrendingUp}
              label="Commerciaux"
              value={stats?.users?.commercial || 0}
              color="#3b82f6"
            />
            <StatCard 
              icon={UserCheck}
              label="Développeurs"
              value={stats?.users?.developer || 0}
              color="#8b5cf6"
            />
            <StatCard 
              icon={Clock}
              label="En attente"
              value={stats?.users?.pending || 0}
              color="#f59e0b"
            />
            <StatCard 
              icon={UserX}
              label="Suspendus"
              value={stats?.users?.suspended || 0}
              color="#ef4444"
            />
          </StatsSection>

          {/* ===== DEMANDES DE CONTACT ===== */}
          <StatsSection title="📬 Demandes de contact" columns={4}>
            <StatCard 
              icon={Mail}
              label="Total reçues"
              value={stats?.contacts?.total || 0}
              color="#6366f1"
            />
            <StatCard 
              icon={Clock}
              label="En attente"
              value={stats?.contacts?.pending || 0}
              color="#f59e0b"
            />
            <StatCard 
              icon={CheckCircle}
              label="Contactés"
              value={stats?.contacts?.contacted || 0}
              color="#3b82f6"
            />
            <StatCard 
              icon={TrendingUp}
              label="Convertis"
              value={stats?.contacts?.converted || 0}
              color="#10b981"
            />
          </StatsSection>

          {/* ===== PROJETS ===== */}
          <StatsSection title="🚀 Projets du Syndicat" columns={5}>
            <StatCard 
              icon={Rocket}
              label="Total projets"
              value={stats?.projects?.total || 0}
              color="#6366f1"
            />
            <StatCard 
              icon={FolderOpen}
              label="Ouverts"
              value={stats?.projects?.open || 0}
              color="#10b981"
            />
            <StatCard 
              icon={Clock}
              label="En cours"
              value={stats?.projects?.in_progress || 0}
              color="#f59e0b"
            />
            <StatCard 
              icon={CheckCircle}
              label="Terminés"
              value={stats?.projects?.closed || 0}
              color="#3b82f6"
            />
            <StatCard 
              icon={Users}
              label="Candidatures"
              value={stats?.projects?.candidatures || 0}
              color="#8b5cf6"
            />
          </StatsSection>

          {/* ===== CONTENUS ===== */}
          <StatsSection title="📝 Contenus" columns={4}>
            <StatCard 
              icon={Megaphone}
              label="Annonces"
              value={stats?.announcements?.total || 0}
              subtext={`${stats?.announcements?.active || 0} actives`}
              color="#3b82f6"
            />
            <StatCard 
              icon={Bell}
              label="Alertes"
              value={stats?.alerts?.total || 0}
              subtext={`${stats?.alerts?.active || 0} actives`}
              color="#f59e0b"
            />
            <StatCard 
              icon={AlertCircle}
              label="Popups"
              value={stats?.alerts?.popup || 0}
              color="#ef4444"
            />
            <StatCard 
              icon={AlertCircle}
              label="Bannières"
              value={stats?.alerts?.banner || 0}
              color="#10b981"
            />
          </StatsSection>

          {/* ===== ABONNEMENTS ===== */}
          <StatsSection title="💰 Abonnements" columns={4}>
            <StatCard 
              icon={CreditCard}
              label="Forfaits créés"
              value={stats?.subscriptions?.plans_total || 0}
              subtext={`${stats?.subscriptions?.plans_active || 0} actifs`}
              color="#6366f1"
            />
            <StatCard 
              icon={Users}
              label="Abonnés actifs"
              value={stats?.subscriptions?.subscriptions_active || 0}
              color="#10b981"
            />
            <StatCard 
              icon={Euro}
              label="Revenus mensuels"
              value={formatCurrency(stats?.subscriptions?.monthly_revenue)}
              subtext="Estimation"
              color="#f59e0b"
            />
            <StatCard 
              icon={TrendingUp}
              label="Taux conversion"
              value={stats?.users?.developer > 0 
                ? `${Math.round((stats?.subscriptions?.subscriptions_active / stats?.users?.developer) * 100)}%`
                : "0%"
              }
              subtext="Devs abonnés"
              color="#8b5cf6"
            />
          </StatsSection>

          {/* ===== PARTENAIRES ===== */}
          <StatsSection title="🤝 Partenaires" columns={3}>
            <StatCard 
              icon={Handshake}
              label="Total partenaires"
              value={stats?.partners?.total || 0}
              subtext={`${stats?.partners?.active || 0} actifs`}
              color="#6366f1"
            />
            {stats?.partners?.by_category && Object.keys(stats.partners.by_category).length > 0 ? (
              Object.entries(stats.partners.by_category).slice(0, 2).map(([category, count]) => (
                <StatCard 
                  key={category}
                  icon={Handshake}
                  label={category}
                  value={count}
                  color="#3b82f6"
                />
              ))
            ) : (
              <StatCard 
                icon={Handshake}
                label="Catégories"
                value="0"
                subtext="Aucune catégorie"
                color="#3b82f6"
              />
            )}
          </StatsSection>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
