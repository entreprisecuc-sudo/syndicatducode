/**
 * Détail d'un projet et ses candidatures - Admin
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, User, Mail, Calendar, MessageSquare,
  CheckCircle, XCircle, Clock, Eye
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProject();
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

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/projects/admin/applications/${applicationId}/status?new_status=${newStatus}`,
        {},
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--admin-accent)" }}"></div>
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
                  
                  {/* Message */}
                  <div 
                    className="p-3 rounded-lg mb-4"
                    style={{ background: "var(--admin-bg-card)" }}
                  >
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {app.message}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(APPLICATION_STATUS).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => updateApplicationStatus(app.id, key)}
                        disabled={app.status === key}
                        className={`px-3 py-1.5 rounded text-xs transition-colors ${
                          app.status === key 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:opacity-80"
                        }`}
                        style={{ background: config.bg, color: config.color }}
                      >
                        {config.label}
                      </button>
                    ))}
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
