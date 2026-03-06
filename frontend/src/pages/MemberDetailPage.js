/**
 * Page Détail Membre
 * Affiche le profil complet d'un développeur
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Briefcase, Github, Linkedin, Globe, 
  ExternalLink, Mail, Calendar, Loader2, Code, Image as ImageIcon
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { API_URL } from "@/config/constants";
import axios from "axios";

const MemberDetailPage = () => {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    try {
      const response = await axios.get(`${API_URL}/members/public/${memberId}`);
      setMember(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Membre non trouvé");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a1a2e" }}>
        <Loader2 className="animate-spin text-red-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: "#1a1a2e" }}>
        <Navigation />
        <div className="pt-24 pb-16 px-4 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-white mb-4">Oops !</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link
              to="/membres"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: "#e94560", color: "white" }}
            >
              <ArrowLeft size={18} />
              Retour aux membres
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const profile = member?.profile || {};
  const projects = member?.projects || [];
  
  // Photo
  const photoUrl = profile.photo_url?.startsWith("http") 
    ? profile.photo_url 
    : profile.photo_url ? `${API_URL}${profile.photo_url}` : null;
  
  // Nom
  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : member?.email?.split("@")[0];
  
  const initial = displayName?.charAt(0).toUpperCase() || "?";

  // Disponibilité
  const availabilityLabels = {
    full: "Temps plein",
    partial: "Temps partiel",
    weekends: "Week-ends",
    unavailable: "Indisponible"
  };

  return (
    <div className="min-h-screen" style={{ background: "#1a1a2e" }}>
      <Navigation />
      
      {/* Header avec retour */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/membres"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            Retour aux membres
          </Link>
        </div>
      </section>

      {/* Profil */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div 
            className="rounded-xl p-6 md:p-8"
            style={{ background: "#16213e", border: "1px solid #1f4068" }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo */}
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full flex-shrink-0 flex items-center justify-center text-4xl font-bold text-white overflow-hidden mx-auto md:mx-0"
                style={{ background: photoUrl ? "transparent" : "#e94560" }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              
              {/* Infos */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {displayName}
                </h1>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400 mb-4">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {profile.city}
                    </span>
                  )}
                  {profile.experience && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={16} />
                      {profile.experience} d'expérience
                    </span>
                  )}
                  {profile.availability && (
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {availabilityLabels[profile.availability] || profile.availability}
                    </span>
                  )}
                </div>
                
                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                
                {/* Liens */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {profile.github && (
                    <a 
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                      style={{ background: "#1f4068", color: "#9ca3af" }}
                    >
                      <Github size={18} />
                      GitHub
                    </a>
                  )}
                  {profile.linkedin && (
                    <a 
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                      style={{ background: "#1f4068", color: "#9ca3af" }}
                    >
                      <Linkedin size={18} />
                      LinkedIn
                    </a>
                  )}
                  {profile.portfolio && (
                    <a 
                      href={profile.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                      style={{ background: "#1f4068", color: "#9ca3af" }}
                    >
                      <Globe size={18} />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compétences */}
      {profile.skills?.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div 
              className="rounded-xl p-6"
              style={{ background: "#16213e", border: "1px solid #1f4068" }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">
                Compétences techniques
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-3 py-1.5 rounded-lg text-sm"
                    style={{ background: "#e94560", color: "white" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio / Réalisations */}
      {projects.length > 0 && (
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-6">
              Réalisations ({projects.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const projectImg = project.image_url?.startsWith("http")
                  ? project.image_url
                  : project.image_url ? `${API_URL}${project.image_url}` : null;
                
                return (
                  <div 
                    key={project.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "#16213e", border: "1px solid #1f4068" }}
                  >
                    {/* Image */}
                    <div className="aspect-video bg-gray-800">
                      {projectImg ? (
                        <img 
                          src={projectImg} 
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
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
                      
                      {/* Liens */}
                      <div className="flex gap-2">
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default MemberDetailPage;
