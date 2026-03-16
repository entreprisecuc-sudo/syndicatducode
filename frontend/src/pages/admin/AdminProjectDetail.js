/**
 * Détail d'un projet et ses candidatures - Admin
 * Avec modal de décision et envoi d'email
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, User, Mail, Calendar, MessageSquare,
  CheckCircle, XCircle, Clock, Eye, X, Loader2, Send, ExternalLink
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des statuts de candidature
const APPLICATION_STATUS = {
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20", icon: Clock },
  reviewed: { label: "Examinée", color: "#3b82f6", bg: "#3b82f620", icon: Eye },
  accepted: { label: "Acceptée", color: "#10b981", bg: "#10b98120", icon: CheckCircle },
  rejected: { label: "Refusée", color: "#ef4444", bg: "#ef444420", icon: XCircle }
};

const AdminProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectRoom, setProjectRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal de décision
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [decisionType, setDecisionType] = useState(null); // 'accepted' ou 'rejected'
  const [decisionNote, setDecisionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchProjectRoom();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/admin/${projectId}`, {
        headers: getAuthHeaders()
      });
      setProject(response.data);
    } catch (err) {
      setError("Projet non trouvé");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectRoom = async () => {
    try {
      const response = await axios.get(`${API_URL}/project-rooms/by-project/${projectId}`, {
        headers: getAuthHeaders()
      });
      setProjectRoom(response.data);
    } catch (err) {
      // Pas d'espace projet, c'est normal si aucune candidature n'a été acceptée
      setProjectRoom(null);
    }
  };

  const openDecisionModal = (application, type) => {
    setSelectedApplication(application);
    setDecisionType(type);
    setDecisionNote("");
    setShowDecisionModal(true);
  };

  const closeDecisionModal = () => {
    setShowDecisionModal(false);
    setSelectedApplication(null);
    setDecisionType(null);
    setDecisionNote("");
  };

  const handleDecision = async () => {
    if (!selectedApplication || !decisionType) return;
    
    try {
      setSubmitting(true);
      await axios.put(
        `${API_URL}/projects/admin/applications/${selectedApplication.id}/status`,
        { 
          status: decisionType,
          note: decisionNote || null
        },
        { headers: getAuthHeaders() }
      );
      closeDecisionModal();
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    // Pour les statuts autres qu'accepté/refusé, pas besoin de modal
    if (newStatus === "accepted" || newStatus === "rejected") {
      const app = project.applications?.find(a => a.id === applicationId);
      openDecisionModal(app, newStatus);
      return;
    }
    
    try {
      await axios.put(
        `${API_URL}/projects/admin/applications/${applicationId}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !project) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/syndicat-admin/projets" className="text-gray-400 hover:text-white">
            ← Retour aux projets
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/syndicat-admin/projets" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft size={18} />
          Retour aux projets
        </Link>
        <h1 className="text-2xl font-bold text-white">{project.title}</h1>
        <p className="text-gray-400 mt-2">{project.description}</p>
      </div>

      {/* Modal de décision */}
      {showDecisionModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full max-w-lg rounded-xl p-6"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
                {decisionType === "accepted" ? "✅ Accepter la candidature" : "❌ Refuser la candidature"}
              </h3>
              <button 
                onClick={closeDecisionModal}
                style={{ color: "var(--admin-text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Info candidat */}
            <div 
              className="p-3 rounded-lg mb-4"
              style={{ background: "var(--admin-bg-section)" }}
            >
              <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                Candidat : <span className="text-white font-medium">{selectedApplication.user?.email}</span>
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-muted)" }}>
                Un email sera envoyé automatiquement au candidat avec votre décision.
              </p>
            </div>
            
            {/* Champ note */}
            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                {decisionType === "accepted" 
                  ? "Message pour le candidat (optionnel)" 
                  : "Raison du refus (recommandé)"
                }
              </label>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg transition-colors duration-300 resize-none"
                style={{ 
                  background: "var(--admin-bg-section)", 
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"
                }}
                placeholder={decisionType === "accepted" 
                  ? "Ex: Bienvenue dans le projet ! Nous sommes ravis de vous avoir dans l'équipe..."
                  : "Ex: Le profil ne correspond pas aux besoins techniques du projet..."
                }
                data-testid="decision-note-input"
              />
            </div>
            
            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={closeDecisionModal}
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
                onClick={handleDecision}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: decisionType === "accepted" ? "#10b981" : "#ef4444" }}
                data-testid="confirm-decision-btn"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {decisionType === "accepted" ? "Accepter et notifier" : "Refuser et notifier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidatures */}
      <div 
        className="rounded-xl p-5"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Candidatures ({project.applications?.length || 0})
        </h2>

        {project.applications?.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Aucune candidature reçue pour ce projet
          </p>
        ) : (
          <div className="space-y-4">
            {project.applications?.map((app) => {
              const statusConfig = APPLICATION_STATUS[app.status] || APPLICATION_STATUS.pending;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={app.id}
                  className="p-4 rounded-lg"
                  style={{ background: "var(--admin-bg-section)" }}
                >
                  {/* Header candidature */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-blue-500"
                      >
                        {app.user?.email?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-white font-medium">{app.user?.email}</p>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(app.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <span 
                      className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {/* Message de candidature */}
                  <div 
                    className="p-3 rounded-lg mb-3"
                    style={{ background: "var(--admin-bg-card)" }}
                  >
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {app.message}
                    </p>
                  </div>
                  
                  {/* Note admin si présente */}
                  {app.admin_note && (
                    <div 
                      className="p-3 rounded-lg mb-3"
                      style={{ 
                        background: app.status === "accepted" ? "#10b98120" : "#ef444420",
                        border: `1px solid ${app.status === "accepted" ? "#10b981" : "#ef4444"}`
                      }}
                    >
                      <p className="text-xs font-medium mb-1" style={{ color: app.status === "accepted" ? "#10b981" : "#ef4444" }}>
                        Note de décision :
                      </p>
                      <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                        {app.admin_note}
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateApplicationStatus(app.id, "pending")}
                      disabled={app.status === "pending"}
                      className={`px-3 py-1.5 rounded text-xs transition-colors ${
                        app.status === "pending" ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
                      }`}
                      style={{ background: APPLICATION_STATUS.pending.bg, color: APPLICATION_STATUS.pending.color }}
                    >
                      En attente
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(app.id, "reviewed")}
                      disabled={app.status === "reviewed"}
                      className={`px-3 py-1.5 rounded text-xs transition-colors ${
                        app.status === "reviewed" ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
                      }`}
                      style={{ background: APPLICATION_STATUS.reviewed.bg, color: APPLICATION_STATUS.reviewed.color }}
                    >
                      Examinée
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(app.id, "accepted")}
                      disabled={app.status === "accepted"}
                      className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                        app.status === "accepted" ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
                      }`}
                      style={{ background: APPLICATION_STATUS.accepted.bg, color: APPLICATION_STATUS.accepted.color }}
                    >
                      <CheckCircle size={12} />
                      Accepter
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(app.id, "rejected")}
                      disabled={app.status === "rejected"}
                      className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                        app.status === "rejected" ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
                      }`}
                      style={{ background: APPLICATION_STATUS.rejected.bg, color: APPLICATION_STATUS.rejected.color }}
                    >
                      <XCircle size={12} />
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjectDetail;
