/**
 * Onglet Book/Portfolio - Détail utilisateur admin
 * Affiche les projets du portfolio d'un utilisateur
 */

import { useState } from "react";
import { Briefcase, ExternalLink, Github, Trash2, Loader2 } from "lucide-react";
import { API_URL } from "@/config/constants";
import { getAuthHeaders } from "@/services/authService";
import axios from "axios";

const statusLabels = {
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20" },
  approved: { label: "Approuvé", color: "#10b981", bg: "#10b98120" },
  rejected: { label: "Rejeté", color: "#ef4444", bg: "#ef444420" }
};

export const BookTab = ({ portfolio, onUpdate }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (projectId, projectTitle) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le projet "${projectTitle}" ?`)) return;
    
    try {
      setDeletingId(projectId);
      setError("");
      await axios.delete(
        `${API_URL}/admin/portfolio/${projectId}`,
        { headers: getAuthHeaders() }
      );
      if (onUpdate) onUpdate();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

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

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolio.map((project) => {
          const status = statusLabels[project.status] || statusLabels.pending;
          const imageUrl = project.image_url?.startsWith("http") 
            ? project.image_url 
            : project.image_url ? `${API_URL}${project.image_url}` : null;
          const isDeleting = deletingId === project.id;

          return (
            <div 
              key={project.id}
              className={`rounded-xl overflow-hidden transition-colors duration-300 ${isDeleting ? 'opacity-50' : ''}`}
              style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
            >
              {/* Statut */}
              <div 
                className="px-3 py-1.5 flex items-center justify-between text-xs"
                style={{ background: status.bg }}
              >
                <span style={{ color: status.color }}>{status.label}</span>
                <div className="flex items-center gap-2">
                  {project.is_adult_content && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">
                      +18
                    </span>
                  )}
                  {/* Bouton supprimer */}
                  <button
                    onClick={() => handleDelete(project.id, project.title)}
                    disabled={isDeleting}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    style={{ color: "#ef4444" }}
                    title="Supprimer ce projet"
                    data-testid={`delete-project-${project.id}`}
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
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
    </div>
  );
};

export default BookTab;
