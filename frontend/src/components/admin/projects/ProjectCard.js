/**
 * Carte d'un projet - Espace Admin
 */

import { Link } from "react-router-dom";
import { Users, ChevronRight, Edit, Trash2 } from "lucide-react";

const STATUS_CONFIG = {
  open:        { label: "Ouvert",   color: "#10b981", bg: "#10b98120" },
  in_progress: { label: "En cours", color: "#3b82f6", bg: "#3b82f620" },
  closed:      { label: "Fermé",    color: "#6b7280", bg: "#6b728020" }
};

const COLLAB_CONFIG = {
  freelance:   { label: "Mission Freelance",  color: "#8b5cf6" },
  support:     { label: "Soutien Technique",  color: "#f59e0b" },
  partnership: { label: "Partenariat",        color: "#10b981" }
};

const ProjectCard = ({ project, onEdit, onDelete, onStatusChange }) => {
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.open;
  const collabConfig = COLLAB_CONFIG[project.collaboration_type] || COLLAB_CONFIG.freelance;

  return (
    <div
      className="p-5 rounded-xl transition-colors duration-300"
      style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to={`/syndicat-admin/projets/${project.id}`}
              className="font-semibold text-lg hover:underline transition-colors"
              style={{ color: "var(--admin-text)" }}
              data-testid={`project-link-${project.id}`}
            >
              {project.title}
            </Link>
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ background: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>

          <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--admin-text-secondary)" }}>
            {project.description}
          </p>

          {project.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {project.technologies.map(tech => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded text-xs transition-colors duration-300"
                  style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            <span style={{ color: collabConfig.color }}>{collabConfig.label}</span>
            {project.budget && <span>Budget: {project.budget}</span>}
            <span className="flex items-center gap-1">
              <Users size={14} />
              {project.applications_count || 0} candidature(s)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/syndicat-admin/projets/${project.id}`}
            className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-1"
            title="Voir les candidatures"
            data-testid={`view-applications-${project.id}`}
          >
            <Users size={16} />
            <span className="text-xs hidden sm:inline">{project.applications_count || 0}</span>
            <ChevronRight size={14} />
          </Link>

          <select
            value={project.status}
            onChange={(e) => onStatusChange(project.id, e.target.value)}
            className="text-xs py-1.5 px-2 rounded transition-colors duration-300"
            style={{
              background: "var(--admin-bg-section)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)"
            }}
          >
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Fermé</option>
          </select>

          <button
            onClick={() => onEdit(project)}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            title="Modifier"
          >
            <Edit size={16} />
          </button>

          <button
            onClick={() => onDelete(project.id)}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
