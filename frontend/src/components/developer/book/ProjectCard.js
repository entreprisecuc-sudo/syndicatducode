/**
 * Carte de projet - Book développeur
 * Affiche un projet du portfolio avec ses informations et actions
 */

import { Edit2, Trash2, ExternalLink, Github, Image as ImageIcon } from "lucide-react";
import { API_URL } from "@/config/constants";

// Configuration des statuts
const STATUS_CONFIG = {
  pending: { bg: "#f59e0b20", border: "#f59e0b", text: "#f59e0b", label: "En attente de validation" },
  approved: { bg: "#10b98120", border: "#10b981", text: "#10b981", label: "Approuvé - Visible publiquement" },
  rejected: { bg: "#ef444420", border: "#ef4444", text: "#ef4444", label: "Rejeté" }
};

export const ProjectCard = ({ project, onEdit, onDelete }) => {
  const imageUrl = project.image_url?.startsWith("http") 
    ? project.image_url 
    : project.image_url ? `${API_URL}${project.image_url}` : null;

  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: `1px solid ${status.border}` }}
      data-testid={`project-card-${project.id}`}
    >
      {/* Badge statut */}
      <div 
        className="px-3 py-1.5 text-xs font-medium flex items-center gap-2"
        style={{ background: status.bg, color: status.text }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: status.text }} />
        {status.label}
        {project.is_adult_content && (
          <span 
            className="ml-auto px-2 py-0.5 rounded text-xs font-bold"
            style={{ background: "#ef4444", color: "white" }}
          >
            +18
          </span>
        )}
      </div>

      {/* Raison de rejet si rejeté */}
      {project.status === "rejected" && project.rejection_reason && (
        <div 
          className="px-3 py-2 text-xs border-b"
          style={{ background: "#ef444410", borderColor: "#ef444430", color: "#ef4444" }}
        >
          <strong>Raison du rejet :</strong> {project.rejection_reason}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-video bg-gray-800">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-600" />
          </div>
        )}
        
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onEdit(project)}
            className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            title="Modifier"
            data-testid={`edit-project-${project.id}`}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
            title="Supprimer"
            data-testid={`delete-project-${project.id}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
          {project.title}
        </h3>
        
        {project.year && (
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {project.year}
          </p>
        )}

        {project.description && (
          <p className="text-sm mb-3 line-clamp-3" style={{ color: "var(--text-secondary)" }}>
            {project.description}
          </p>
        )}

        {/* Technologies */}
        {project.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.technologies.map((tech) => (
              <span 
                key={tech}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "var(--sage)", color: "white" }}
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Liens */}
        <div className="flex gap-2">
          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-section)", color: "var(--sage)" }}
            >
              <ExternalLink size={14} />
              Voir le projet
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-section)", color: "var(--text-secondary)" }}
            >
              <Github size={14} />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
