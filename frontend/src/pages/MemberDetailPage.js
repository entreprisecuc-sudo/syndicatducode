/**
 * Page Détail Membre
 * Affiche le profil complet d'un développeur + bouton contacter (modal)
 * Refactoré pour utiliser les sous-composants extraits
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Briefcase, Github, Linkedin, Globe, 
  Calendar, Loader2, MessageCircle
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Import des sous-composants
import { ContactModal, MemberProjectCard } from "@/components/members";

// Configuration des disponibilités
const AVAILABILITY_LABELS = {
  full: "Temps plein",
  partial: "Temps partiel",
  weekends: "Week-ends",
  unavailable: "Indisponible"
};

const MemberDetailPage = () => {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);

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
                      {AVAILABILITY_LABELS[profile.availability] || profile.availability}
                    </span>
                  )}
                </div>
                
                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                
                {/* Liens et bouton contacter */}
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
                  
                  {/* Bouton Contacter */}
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-transform hover:scale-105"
                    style={{ background: "#e94560", color: "white" }}
                    data-testid="contact-member-btn"
                  >
                    <MessageCircle size={18} />
                    Contacter
                  </button>
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
              {projects.map((project) => (
                <MemberProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* Modal de contact */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        memberId={memberId}
        memberName={displayName}
      />
    </div>
  );
};

export default MemberDetailPage;
