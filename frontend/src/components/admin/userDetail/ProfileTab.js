/**
 * Onglet Profil - Détail utilisateur admin
 * Affiche les informations de base et le profil développeur
 */

import { useState } from "react";
import { 
  User, Phone, MapPin, Briefcase, Clock, Calendar,
  Github, Linkedin, Globe, Shield, Code, Users, UserX, UserCheck, Loader2, X
} from "lucide-react";
import { API_URL } from "@/config/constants";
import api from "@/services/api";

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

export const ProfileTab = ({ user, profile, onUserUpdate }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.null;
  const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
  const RoleIcon = roleConfig.icon;

  // Photo de profil
  const photoUrl = profile?.photo_url?.startsWith("http") 
    ? profile.photo_url 
    : profile?.photo_url ? `${API_URL}${profile.photo_url}` : null;

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      setActionError("Veuillez saisir un motif de suspension");
      return;
    }
    
    try {
      setActionLoading(true);
      setActionError("");
      await api.put(`/admin/users/${user.id}/suspend`,  { reason: suspensionReason });
      setShowSuspendModal(false);
      setSuspensionReason("");
      if (onUserUpdate) onUserUpdate();
      window.location.reload();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Erreur lors de la suspension");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir réactiver ${user.email} ?`)) return;
    
    try {
      setActionLoading(true);
      setActionError("");
      await api.put(`/admin/users/${user.id}/reactivate`,  {});
      if (onUserUpdate) onUserUpdate();
      window.location.reload();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Erreur lors de la réactivation");
    } finally {
      setActionLoading(false);
    }
  };

  const canBeSuspended = user.role !== "admin" && user.status === "active";
  const canBeReactivated = user.status === "suspended";

  return (
    <div className="space-y-6">
      {/* Modal de suspension */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full max-w-md rounded-xl p-6 transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
                Suspendre le compte
              </h3>
              <button 
                onClick={() => setShowSuspendModal(false)}
                style={{ color: "var(--admin-text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm mb-4" style={{ color: "var(--admin-text-secondary)" }}>
              Vous allez suspendre le compte de <strong>{user.email}</strong>. 
              Un email avec le motif lui sera envoyé.
            </p>
            
            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm mb-4">
                {actionError}
              </div>
            )}
            
            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                Motif de la suspension *
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg transition-colors duration-300 resize-none"
                style={{ 
                  background: "var(--admin-bg-section)", 
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"
                }}
                placeholder="Expliquez la raison de cette suspension..."
                data-testid="suspension-reason-input"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ 
                  background: "var(--admin-bg-section)", 
                  color: "var(--admin-text)",
                  border: "1px solid var(--admin-border)"
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading || !suspensionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "#ef4444" }}
                data-testid="confirm-suspend-btn"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                Suspendre
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Motif de suspension si suspendu */}
          {user.status === "suspended" && user.suspension_reason && (
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ background: "#ef444420", border: "1px solid #ef444440" }}
            >
              <p className="text-sm font-medium text-red-400 mb-1">Motif de la suspension :</p>
              <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                {user.suspension_reason}
              </p>
              {user.suspended_at && (
                <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
                  Suspendu le {new Date(user.suspended_at).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          )}

          {/* Actions de modération */}
          {(canBeSuspended || canBeReactivated) && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
              {actionError && !showSuspendModal && (
                <p className="text-red-400 text-sm mb-3">{actionError}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {canBeSuspended && (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ background: "#ef4444" }}
                    data-testid="suspend-user-btn"
                  >
                    <UserX size={16} />
                    Suspendre le compte
                  </button>
                )}
                {canBeReactivated && (
                  <button
                    onClick={handleReactivate}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ background: "#10b981" }}
                    data-testid="reactivate-user-btn"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                    Réactiver le compte
                  </button>
                )}
              </div>
            </div>
          )}
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

export default ProfileTab;
