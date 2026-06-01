/**
 * Modal de prévisualisation complète d'un projet portfolio
 */

import { useState } from "react";
import { CheckCircle, XCircle, ExternalLink, Github, ImageIcon, User } from "lucide-react";
import { API_URL } from "@/config/constants";
import RejectModal from "./RejectModal";

const ProjectPreviewModal = ({ project, onClose, onApprove, onReject }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (!project) return null;

  const imageUrl = project.image_url?.startsWith("http")
    ? project.image_url
    : project.image_url ? `${API_URL}${project.image_url}` : null;

  const handleReject = async (reason) => {
    await onReject(project.id, reason);
    setShowRejectModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
          style={{ background: "var(--admin-bg-card)" }}
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
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
              <User size={16} />
              <span>{project.user_name || project.user_email}</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{project.title}</h2>
            {project.year && <p className="text-sm text-gray-500 mb-4">{project.year}</p>}
            {project.description && <p className="text-gray-300 mb-4">{project.description}</p>}

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

            {project.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(project.id)}
                  className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={18} />
                  Approuver
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <XCircle size={18} />
                  Rejeter
                </button>
              </div>
            )}

            {project.status !== "pending" && (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg font-medium"
                style={{ background: "#1f4068", color: "#9ca3af" }}
              >
                Fermer
              </button>
            )}

            {project.status === "rejected" && project.rejection_reason && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500">
                <p className="text-sm font-medium text-red-400 mb-1">Raison du rejet :</p>
                <p className="text-sm text-red-300">{project.rejection_reason}</p>
              </div>
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

export default ProjectPreviewModal;
