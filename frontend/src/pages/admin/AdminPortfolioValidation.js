/**
 * Page Admin - Validation des Books/Portfolios
 * Permet de valider ou rejeter les projets soumis par les développeurs
 */

import { useState, useEffect } from "react";
import { 
  CheckCircle, XCircle, Clock, Eye, ExternalLink, 
  Github, Loader2, Filter, Image as ImageIcon, User
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

/**
 * Modal de prévisualisation du projet
 */
const ProjectPreviewModal = ({ project, onClose, onApprove, onReject }) => {
  if (!project) return null;

  const imageUrl = project.image_url?.startsWith("http") 
    ? project.image_url 
    : project.image_url ? `${API_URL}${project.image_url}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "#16213e" }}
      >
        {/* Image */}
        <div className="aspect-video bg-gray-800">
          {imageUrl ? (
            <img src={imageUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={64} className="text-gray-600" />
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Développeur */}
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
            <User size={16} />
            <span>{project.user_name || project.user_email}</span>
          </div>

          {/* Titre */}
          <h2 className="text-xl font-bold text-white mb-2">{project.title}</h2>
          
          {/* Année */}
          {project.year && (
            <p className="text-sm text-gray-500 mb-4">{project.year}</p>
          )}

          {/* Description */}
          {project.description && (
            <p className="text-gray-300 mb-4">{project.description}</p>
          )}

          {/* Technologies */}
          {project.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies.map((tech) => (
                <span 
                  key={tech}
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: "#e94560", color: "white" }}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Liens */}
          <div className="flex gap-3 mb-6">
            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: "#1f4068", color: "#9ca3af" }}
              >
                <ExternalLink size={16} />
                Voir le projet
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: "#1f4068", color: "#9ca3af" }}
              >
                <Github size={16} />
                GitHub
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onApprove(project.id)}
              className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={18} />
              Approuver
            </button>
            <button
              onClick={() => onReject(project.id)}
              className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <XCircle size={18} />
              Rejeter
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ background: "#1f4068", color: "#9ca3af" }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Carte de projet en attente
 */
const ProjectCard = ({ project, onPreview, onApprove, onReject }) => {
  const imageUrl = project.image_url?.startsWith("http") 
    ? project.image_url 
    : project.image_url ? `${API_URL}${project.image_url}` : null;

  const statusColors = {
    pending: { bg: "#f59e0b20", text: "#f59e0b", label: "En attente" },
    approved: { bg: "#10b98120", text: "#10b981", label: "Approuvé" },
    rejected: { bg: "#ef444420", text: "#ef4444", label: "Rejeté" }
  };

  const status = statusColors[project.status] || statusColors.pending;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ background: "#16213e", border: "1px solid #1f4068" }}
    >
      {/* Image */}
      <div className="aspect-video bg-gray-800 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-600" />
          </div>
        )}
        
        {/* Badge statut */}
        <div 
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
          style={{ background: status.bg, color: status.text }}
        >
          {status.label}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Développeur */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
          <User size={12} />
          <span>{project.user_name || project.user_email}</span>
        </div>

        {/* Titre */}
        <h3 className="font-semibold text-white mb-1 truncate">{project.title}</h3>
        
        {/* Date */}
        <p className="text-xs text-gray-500 mb-3">
          Soumis le {formatDate(project.created_at)}
        </p>

        {/* Technologies (aperçu) */}
        {project.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.technologies.slice(0, 3).map((tech) => (
              <span 
                key={tech}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "#1f4068", color: "#e94560" }}
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="text-xs text-gray-500">+{project.technologies.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(project)}
            className="flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
            style={{ background: "#1f4068", color: "#9ca3af" }}
          >
            <Eye size={14} />
            Voir
          </button>
          {project.status === "pending" && (
            <>
              <button
                onClick={() => onApprove(project.id)}
                className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                title="Approuver"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => onReject(project.id)}
                className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Rejeter"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Page principale de validation des portfolios
 */
const AdminPortfolioValidation = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [previewProject, setPreviewProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const url = filter === "all" 
        ? `${API_URL}/admin/portfolio/all`
        : `${API_URL}/admin/portfolio/all?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (projectId) => {
    try {
      await axios.put(
        `${API_URL}/admin/portfolio/${projectId}/approve`,
        {},
        { headers: getAuthHeaders() }
      );
      
      // Mettre à jour la liste
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: "approved" } : p
      ));
      setPreviewProject(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async (projectId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter ce projet ?")) return;
    
    try {
      await axios.put(
        `${API_URL}/admin/portfolio/${projectId}/reject`,
        {},
        { headers: getAuthHeaders() }
      );
      
      // Mettre à jour la liste
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: "rejected" } : p
      ));
      setPreviewProject(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors du rejet");
    }
  };

  const pendingCount = projects.filter(p => p.status === "pending").length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white lg:hidden">Validation Books</h1>
          <p className="text-sm text-gray-400">
            Validez les projets soumis par les développeurs avant publication
          </p>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "#1f4068", border: "1px solid #1f4068", color: "white" }}
          >
            <option value="pending">En attente ({pendingCount})</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
            <option value="all">Tous</option>
          </select>
        </div>
      </div>

      {/* Alerte projets en attente */}
      {filter !== "pending" && pendingCount > 0 && (
        <div 
          className="p-4 rounded-xl mb-6 flex items-center gap-3"
          style={{ background: "#f59e0b20", border: "1px solid #f59e0b" }}
        >
          <Clock size={20} className="text-amber-500" />
          <span className="text-amber-500">
            <strong>{pendingCount}</strong> projet{pendingCount > 1 ? "s" : ""} en attente de validation
          </span>
          <button
            onClick={() => setFilter("pending")}
            className="ml-auto px-3 py-1 rounded text-sm bg-amber-500 text-white"
          >
            Voir
          </button>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="text-center py-12 rounded-xl"
          style={{ background: "#16213e", border: "1px solid #1f4068" }}
        >
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-white mb-2">
            {filter === "pending" ? "Aucun projet en attente" : "Aucun projet"}
          </h3>
          <p className="text-sm text-gray-400">
            {filter === "pending" 
              ? "Tous les projets ont été traités."
              : "Aucun projet ne correspond à ce filtre."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPreview={setPreviewProject}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Modal de prévisualisation */}
      {previewProject && (
        <ProjectPreviewModal
          project={previewProject}
          onClose={() => setPreviewProject(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPortfolioValidation;
