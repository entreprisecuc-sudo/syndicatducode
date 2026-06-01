/**
 * Carte projet dans la grille de validation
 */

import { useState } from "react";
import { Eye, CheckCircle, XCircle, ImageIcon, User } from "lucide-react";
import { API_URL } from "@/config/constants";
import RejectModal from "./RejectModal";

const STATUS_COLORS = {
  pending: { bg: "#f59e0b20", text: "#f59e0b", label: "En attente" },
  approved: { bg: "#10b98120", text: "#10b981", label: "Approuvé" },
  rejected: { bg: "#ef444420", text: "#ef4444", label: "Rejeté" }
};

const ProjectCard = ({ project, onPreview, onApprove, onReject }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);

  const imageUrl = project.image_url?.startsWith("http")
    ? project.image_url
    : project.image_url ? `${API_URL}${project.image_url}` : null;

  const status = STATUS_COLORS[project.status] || STATUS_COLORS.pending;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric"
    });

  const handleReject = async (reason) => {
    await onReject(project.id, reason);
    setShowRejectModal(false);
  };

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
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
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <User size={12} />
            <span>{project.user_name || project.user_email}</span>
          </div>
          <h3 className="font-semibold text-white mb-1 truncate">{project.title}</h3>
          <p className="text-xs text-gray-500 mb-3">
            Soumis le {formatDate(project.created_at)}
          </p>

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

          {project.status === "rejected" && project.rejection_reason && (
            <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 line-clamp-2">{project.rejection_reason}</p>
            </div>
          )}

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
                  onClick={() => setShowRejectModal(true)}
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

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        projectTitle={project.title}
      />
    </>
  );
};

export default ProjectCard;
