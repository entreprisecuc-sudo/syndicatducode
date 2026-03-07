/**
 * Carte de projet - Page membre publique
 * Affiche un projet du portfolio avec gestion du contenu +18
 */

import { ExternalLink, Github, Image as ImageIcon, AlertTriangle, EyeOff } from "lucide-react";
import { API_URL } from "@/config/constants";

export const MemberProjectCard = ({ project }) => {
  const projectImg = project.image_url?.startsWith("http")
    ? project.image_url
    : project.image_url ? `${API_URL}${project.image_url}` : null;
  
  const isAdult = project.is_adult_content;
  
  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ background: "#16213e", border: "1px solid #1f4068" }}
    >
      {/* Badge +18 si contenu adulte */}
      {isAdult && (
        <div 
          className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium"
          style={{ background: "#ef444420", color: "#ef4444" }}
        >
          <AlertTriangle size={14} />
          Contenu réservé aux +18 ans
        </div>
      )}
      
      {/* Image - floutée si +18 */}
      <div className="aspect-video bg-gray-800 relative">
        {projectImg ? (
          <>
            <img 
              src={projectImg} 
              alt={project.title}
              className="w-full h-full object-cover"
              style={{ filter: isAdult ? "blur(20px)" : "none" }}
            />
            {isAdult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <EyeOff size={32} className="text-white/70 mb-2" />
                <span className="text-white/70 text-sm font-medium">Image masquée</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-600" />
          </div>
        )}
      </div>
      
      {/* Contenu */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white">
            {project.title}
          </h3>
          {project.year && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {project.year}
            </span>
          )}
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
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
                style={{ background: "#1f4068", color: "#e94560" }}
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        
        {/* Liens - masqués si +18 */}
        <div className="flex gap-2">
          {isAdult ? (
            <span 
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ background: "#ef444420", color: "#ef4444" }}
            >
              <EyeOff size={12} />
              Lien masqué (contenu +18)
            </span>
          ) : (
            <>
              {project.project_url && (
                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: "#1f4068", color: "#9ca3af" }}
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
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: "#1f4068", color: "#9ca3af" }}
                >
                  <Github size={12} />
                  Code
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProjectCard;
