/**
 * Page détail utilisateur - Admin
 * Affiche toutes les informations d'un utilisateur avec onglets
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, History, FileText, Briefcase, CreditCard,
  Mail, Phone, MapPin, Github, Linkedin, Globe, Calendar,
  Shield, Code, Users, Clock, CheckCircle, XCircle, AlertTriangle,
  Eye, EyeOff, ExternalLink, MessageCircle, Send, Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des rôles
const ROLE_CONFIG = {
  commercial: { label: "Commercial", icon: Briefcase, color: "#10b981" },
  developer: { label: "Développeur", icon: Code, color: "#3b82f6" },
  admin: { label: "Admin", icon: Shield, color: "#ef4444" },
  null: { label: "Non défini", icon: Users, color: "#6b7280" }
};

// Configuration des statuts
const STATUS_CONFIG = {
  active: { label: "Actif", color: "#10b981", bg: "#10b98120" },
  suspended: { label: "Suspendu", color: "#ef4444", bg: "#ef444420" },
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20" }
};

// Onglets disponibles
const TABS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "history", label: "Historique", icon: History },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "book", label: "Book", icon: Briefcase },
  { id: "subscription", label: "Abonnement", icon: CreditCard }
];

/**
 * Onglet Profil
 */
const ProfileTab = ({ user, profile, theme }) => {
  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.null;
  const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
  const RoleIcon = roleConfig.icon;

  // Photo de profil
  const photoUrl = profile?.photo_url?.startsWith("http") 
    ? profile.photo_url 
    : profile?.photo_url ? `${API_URL}${profile.photo_url}` : null;

  return (
    <div className="space-y-6">
      {/* En-tête utilisateur */}
      <div 
        className="p-6 rounded-xl flex flex-col md:flex-row items-start gap-6 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        {/* Avatar */}
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden flex-shrink-0"
          style={{ background: photoUrl ? "transparent" : roleConfig.color }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={user.email} className="w-full h-full object-cover" />
          ) : (
            user.email.charAt(0).toUpperCase()
          )}
        </div>

        {/* Infos principales */}
        <div className="flex-1">
          <h2 
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--admin-text)" }}
          >
            {profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}`
              : user.email}
          </h2>
          
          <p className="mb-3" style={{ color: "var(--admin-text-secondary)" }}>{user.email}</p>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Rôle */}
            <span 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ background: `${roleConfig.color}20`, color: roleConfig.color }}
            >
              <RoleIcon size={16} />
              {roleConfig.label}
            </span>
            
            {/* Statut */}
            <span 
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            
            {/* Date inscription */}
            {user.created_at && (
              <span 
                className="flex items-center gap-1 text-sm"
                style={{ color: "var(--admin-text-muted)" }}
              >
                <Calendar size={14} />
                Inscrit le {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Détails du profil */}
      {profile && (
        <div 
          className="p-6 rounded-xl transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--admin-text)" }}
          >
            Informations du profil
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.phone && (
              <div className="flex items-center gap-3" style={{ color: "var(--admin-text-secondary)" }}>
                <Phone size={18} style={{ color: "var(--admin-text-muted)" }} />
                <span>{profile.phone}</span>
              </div>
            )}
            
            {profile.city && (
              <div className="flex items-center gap-3" style={{ color: "var(--admin-text-secondary)" }}>
                <MapPin size={18} style={{ color: "var(--admin-text-muted)" }} />
                <span>{profile.city}</span>
              </div>
            )}
            
            {profile.experience && (
              <div className="flex items-center gap-3" style={{ color: "var(--admin-text-secondary)" }}>
                <Briefcase size={18} style={{ color: "var(--admin-text-muted)" }} />
                <span>{profile.experience} d'expérience</span>
              </div>
            )}
            
            {profile.availability && (
              <div className="flex items-center gap-3" style={{ color: "var(--admin-text-secondary)" }}>
                <Clock size={18} style={{ color: "var(--admin-text-muted)" }} />
                <span>
                  {profile.availability === "full" && "Temps plein"}
                  {profile.availability === "partial" && "Temps partiel"}
                  {profile.availability === "weekends" && "Week-ends"}
                  {profile.availability === "unavailable" && "Indisponible"}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div 
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid var(--admin-border)" }}
            >
              <h4 className="text-sm font-medium mb-2" style={{ color: "var(--admin-text-muted)" }}>Bio</h4>
              <p style={{ color: "var(--admin-text-secondary)" }}>{profile.bio}</p>
            </div>
          )}

          {/* Compétences */}
          {profile.skills?.length > 0 && (
            <div 
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid var(--admin-border)" }}
            >
              <h4 className="text-sm font-medium mb-2" style={{ color: "var(--admin-text-muted)" }}>Compétences</h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-3 py-1 rounded-lg text-sm"
                    style={{ background: "var(--admin-accent)20", color: "var(--admin-accent)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Liens */}
          {(profile.github || profile.linkedin || profile.portfolio) && (
            <div 
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid var(--admin-border)" }}
            >
              <h4 className="text-sm font-medium mb-2" style={{ color: "var(--admin-text-muted)" }}>Liens</h4>
              <div className="flex flex-wrap gap-3">
                {profile.github && (
                  <a 
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
                    style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                  >
                    <Github size={16} />
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a 
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
                    style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                  >
                    <Linkedin size={16} />
                    LinkedIn
                  </a>
                )}
                {profile.portfolio && (
                  <a 
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
                    style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                  >
                    <Globe size={16} />
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Onglet Historique
 */
const HistoryTab = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" style={{ color: "var(--admin-accent)" }} size={32} />
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div 
        className="p-8 rounded-xl text-center transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <History size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
        <p style={{ color: "var(--admin-text-secondary)" }}>Aucune activité enregistrée</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "account_created": return User;
      case "role_assigned": return Shield;
      case "portfolio_created": return Briefcase;
      case "application_submitted": return Send;
      case "subscription": return CreditCard;
      case "message_received": return MessageCircle;
      default: return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "account_created": return "#10b981";
      case "role_assigned": return "#3b82f6";
      case "portfolio_created": return "#8b5cf6";
      case "application_submitted": return "#f59e0b";
      case "subscription": return "#e94560";
      case "message_received": return "#06b6d4";
      default: return "#6b7280";
    }
  };

  return (
    <div className="space-y-3">
      {activity.map((item, index) => {
        const Icon = getActivityIcon(item.type);
        const color = getActivityColor(item.type);
        
        return (
          <div 
            key={index}
            className="p-4 rounded-xl flex items-start gap-4 transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium" style={{ color: "var(--admin-text)" }}>{item.label}</p>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-secondary)" }}>{item.details}</p>
              {item.date && (
                <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
                  {new Date(item.date).toLocaleString("fr-FR")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Onglet Documents
 */
const DocumentsTab = ({ userId }) => {
  // Pour l'instant, afficher un placeholder
  // TODO: Implémenter la gestion des documents utilisateur
  return (
    <div 
      className="p-8 rounded-xl text-center transition-colors duration-300"
      style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
    >
      <FileText size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
      <p style={{ color: "var(--admin-text-secondary)" }}>Aucun document disponible</p>
      <p className="text-sm mt-2" style={{ color: "var(--admin-text-muted)" }}>
        Cette fonctionnalité sera disponible prochainement
      </p>
    </div>
  );
};

/**
 * Onglet Book/Portfolio
 */
const BookTab = ({ portfolio }) => {
  if (!portfolio || portfolio.length === 0) {
    return (
      <div 
        className="p-8 rounded-xl text-center transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <Briefcase size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
        <p style={{ color: "var(--admin-text-secondary)" }}>Aucun projet dans le book</p>
      </div>
    );
  }

  const statusLabels = {
    pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20" },
    approved: { label: "Approuvé", color: "#10b981", bg: "#10b98120" },
    rejected: { label: "Rejeté", color: "#ef4444", bg: "#ef444420" }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {portfolio.map((project) => {
        const status = statusLabels[project.status] || statusLabels.pending;
        const imageUrl = project.image_url?.startsWith("http") 
          ? project.image_url 
          : project.image_url ? `${API_URL}${project.image_url}` : null;

        return (
          <div 
            key={project.id}
            className="rounded-xl overflow-hidden transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            {/* Statut */}
            <div 
              className="px-3 py-1.5 flex items-center justify-between text-xs"
              style={{ background: status.bg }}
            >
              <span style={{ color: status.color }}>{status.label}</span>
              {project.is_adult_content && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">
                  +18
                </span>
              )}
            </div>

            {/* Image */}
            <div className="aspect-video bg-gray-800 relative">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                  style={{ filter: project.is_adult_content ? "blur(10px)" : "none" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Briefcase size={32} style={{ color: "var(--admin-text-muted)" }} />
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="p-4">
              <h4 className="font-semibold mb-1" style={{ color: "var(--admin-text)" }}>{project.title}</h4>
              {project.year && (
                <p className="text-xs mb-2" style={{ color: "var(--admin-text-muted)" }}>{project.year}</p>
              )}
              {project.description && (
                <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--admin-text-secondary)" }}>
                  {project.description}
                </p>
              )}
              
              {/* Technologies */}
              {project.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <span 
                      key={tech}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ background: "var(--admin-bg-section)", color: "var(--admin-accent)" }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* Raison de rejet */}
              {project.status === "rejected" && project.rejection_reason && (
                <div 
                  className="mt-2 p-2 rounded text-xs"
                  style={{ background: "#ef444420", color: "#ef4444" }}
                >
                  <strong>Raison :</strong> {project.rejection_reason}
                </div>
              )}

              {/* Liens */}
              <div className="flex gap-2 mt-3">
                {project.project_url && (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                  >
                    <ExternalLink size={12} />
                    Voir
                  </a>
                )}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                  >
                    <Github size={12} />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Onglet Abonnement
 */
const SubscriptionTab = ({ subscription }) => {
  const activeSubscription = subscription?.active;
  const plan = subscription?.plan;

  if (!activeSubscription) {
    return (
      <div 
        className="p-8 rounded-xl text-center transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <CreditCard size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
        <p style={{ color: "var(--admin-text-secondary)" }}>Aucun abonnement actif</p>
      </div>
    );
  }

  return (
    <div 
      className="p-6 rounded-xl transition-colors duration-300"
      style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 
            className="text-lg font-semibold mb-1"
            style={{ color: "var(--admin-text)" }}
          >
            {plan?.name || "Abonnement"}
          </h3>
          <p style={{ color: "var(--admin-text-secondary)" }}>{plan?.description}</p>
        </div>
        
        <span 
          className="px-3 py-1 rounded-lg text-sm font-medium"
          style={{ background: "#10b98120", color: "#10b981" }}
        >
          Actif
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prix */}
        {plan?.price && (
          <div 
            className="p-4 rounded-lg transition-colors duration-300" 
            style={{ background: "var(--admin-bg-section)" }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Prix</p>
            <p className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>
              {plan.price}€ <span className="text-sm font-normal" style={{ color: "var(--admin-text-secondary)" }}>/ mois</span>
            </p>
          </div>
        )}

        {/* Date de début */}
        {activeSubscription.start_date && (
          <div 
            className="p-4 rounded-lg transition-colors duration-300" 
            style={{ background: "var(--admin-bg-section)" }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Date de début</p>
            <p style={{ color: "var(--admin-text)" }}>
              {new Date(activeSubscription.start_date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}

        {/* ID Plan */}
        <div 
          className="p-4 rounded-lg transition-colors duration-300" 
          style={{ background: "var(--admin-bg-section)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>ID Plan</p>
          <p className="font-mono text-sm" style={{ color: "var(--admin-text)" }}>{activeSubscription.plan_id}</p>
        </div>

        {/* Statut */}
        <div 
          className="p-4 rounded-lg transition-colors duration-300" 
          style={{ background: "var(--admin-bg-section)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Statut</p>
          <p className="text-green-400 font-medium">{activeSubscription.status}</p>
        </div>
      </div>

      {/* Fonctionnalités du plan */}
      {plan?.features?.length > 0 && (
        <div 
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--admin-border)" }}
        >
          <h4 className="text-sm font-medium mb-3" style={{ color: "var(--admin-text-muted)" }}>Fonctionnalités incluses</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li 
                key={index} 
                className="flex items-center gap-2"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Page principale
 */
const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useAdminTheme();
  
  const [userData, setUserData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (activeTab === "history" && activity.length === 0) {
      fetchActivity();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users/${userId}/full`, {
        headers: getAuthHeaders()
      });
      setUserData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await axios.get(`${API_URL}/admin/users/${userId}/activity`, {
        headers: getAuthHeaders()
      });
      setActivity(response.data.activity || []);
    } catch (err) {
      console.error("Erreur chargement activité:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" style={{ color: "var(--admin-accent)" }} size={48} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/syndicat-admin/utilisateurs")}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: "var(--admin-accent)" }}
          >
            Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  const user = userData?.user;
  const profile = userData?.profile;
  const portfolio = userData?.portfolio;
  const subscription = userData?.subscription;

  return (
    <AdminLayout>
      {/* Bouton retour */}
      <button
        onClick={() => navigate("/syndicat-admin/utilisateurs")}
        className="flex items-center gap-2 transition-colors mb-6 hover:opacity-80"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        <ArrowLeft size={18} />
        Retour à la liste des utilisateurs
      </button>

      {/* Titre */}
      <h1 
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        Détail utilisateur
      </h1>

      {/* Onglets */}
      <div 
        className="flex flex-wrap gap-2 p-2 rounded-xl mb-6 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          // Masquer certains onglets selon le rôle
          if (tab.id === "book" && user?.role !== "developer") return null;
          if (tab.id === "subscription" && user?.role !== "developer") return null;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                background: isActive ? "var(--admin-accent)" : "transparent",
                color: isActive ? "#fff" : "var(--admin-text-secondary)"
              }}
              data-testid={`tab-${tab.id}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu de l'onglet */}
      <div>
        {activeTab === "profile" && (
          <ProfileTab user={user} profile={profile} />
        )}
        {activeTab === "history" && (
          <HistoryTab activity={activity} loading={activityLoading} />
        )}
        {activeTab === "documents" && (
          <DocumentsTab userId={userId} />
        )}
        {activeTab === "book" && (
          <BookTab portfolio={portfolio} />
        )}
        {activeTab === "subscription" && (
          <SubscriptionTab subscription={subscription} />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;
