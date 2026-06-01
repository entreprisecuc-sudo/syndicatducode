/**
 * Dashboard Admin
 * Vue d'ensemble avec statistiques avancées
 * Blocs collapsibles pour une meilleure visibilité
 * Persistance des préférences dans localStorage
 */

import { useState, useEffect } from "react";
import { 
  Users, UserCheck, UserX, Clock, FileText, TrendingUp,
  Rocket, Megaphone, Bell, CreditCard, Handshake, Euro,
  Mail, CheckCircle, AlertCircle, FolderOpen
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/dashboard/StatCard";
import CollapsibleSection from "@/components/admin/dashboard/CollapsibleSection";
import api from "@/services/api";

// Clé localStorage pour les préférences
const DASHBOARD_PREFS_KEY = "syndicat_admin_dashboard_prefs";

// Sections par défaut (toutes ouvertes)
const DEFAULT_SECTIONS = {
  users: true,
  contacts: true,
  projects: true,
  contents: true,
  subscriptions: true,
  partners: true
};

/**
 * Récupère les préférences depuis localStorage
 */
const getStoredPrefs = () => {
  try {
    const stored = localStorage.getItem(DASHBOARD_PREFS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SECTIONS;
  } catch {
    return DEFAULT_SECTIONS;
  }
};

/**
 * Sauvegarde les préférences dans localStorage
 */
const savePrefs = (prefs) => {
  try {
    localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore les erreurs de localStorage
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // État des sections avec persistance localStorage
  const [sections, setSections] = useState(getStoredPrefs);

  useEffect(() => {
    fetchStats();
  }, []);

  // Sauvegarder les préférences quand elles changent
  useEffect(() => {
    savePrefs(sections);
  }, [sections]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  // Toggle une section spécifique
  const toggleSection = (sectionId) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Ouvrir/Fermer toutes les sections
  const toggleAll = () => {
    const allOpen = Object.values(sections).every(v => v);
    const newState = {};
    Object.keys(sections).forEach(key => {
      newState[key] = !allOpen;
    });
    setSections(newState);
  };

  // Vérifier si toutes les sections sont ouvertes
  const allSectionsOpen = Object.values(sections).every(v => v);

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Administration Le Syndicat du Code
            </h2>
            <p className="text-white/80 text-sm">
              Vue d'ensemble de la plateforme et statistiques en temps réel.
            </p>
          </div>
          
          {/* Bouton pour tout réduire/ouvrir - visible seulement quand les stats sont chargées */}
          {!loading && !error && (
            <button
              onClick={toggleAll}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
              data-testid="toggle-all-sections"
            >
              {allSectionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {allSectionsOpen ? "Tout réduire" : "Tout ouvrir"}
            </button>
          )}
        </div>
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
          <CollapsibleSection 
            title="Utilisateurs" 
            icon="👥" 
            columns={6}
            isOpen={sections.users}
            onToggle={() => toggleSection('users')}
            accentColor="#6366f1"
            sectionId="users"
          >
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
          </CollapsibleSection>

          {/* ===== DEMANDES DE CONTACT ===== */}
          <CollapsibleSection 
            title="Demandes de contact" 
            icon="📬" 
            columns={4}
            isOpen={sections.contacts}
            onToggle={() => toggleSection('contacts')}
            accentColor="#f59e0b"
            sectionId="contacts"
          >
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
          </CollapsibleSection>

          {/* ===== PROJETS ===== */}
          <CollapsibleSection 
            title="Projets du Syndicat" 
            icon="🚀" 
            columns={5}
            isOpen={sections.projects}
            onToggle={() => toggleSection('projects')}
            accentColor="#10b981"
            sectionId="projects"
          >
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
          </CollapsibleSection>

          {/* ===== CONTENUS ===== */}
          <CollapsibleSection 
            title="Contenus" 
            icon="📝" 
            columns={4}
            isOpen={sections.contents}
            onToggle={() => toggleSection('contents')}
            accentColor="#3b82f6"
            sectionId="contents"
          >
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
          </CollapsibleSection>

          {/* ===== ABONNEMENTS ===== */}
          <CollapsibleSection 
            title="Abonnements" 
            icon="💰" 
            columns={4}
            isOpen={sections.subscriptions}
            onToggle={() => toggleSection('subscriptions')}
            accentColor="#8b5cf6"
            sectionId="subscriptions"
          >
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
          </CollapsibleSection>

          {/* ===== PARTENAIRES ===== */}
          <CollapsibleSection 
            title="Partenaires" 
            icon="🤝" 
            columns={3}
            isOpen={sections.partners}
            onToggle={() => toggleSection('partners')}
            accentColor="#ec4899"
            sectionId="partners"
          >
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
          </CollapsibleSection>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
