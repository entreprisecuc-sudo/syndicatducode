/**
 * Page Détail Membre
 * Affiche le profil complet d'un développeur + bouton contacter (modal)
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Briefcase, Github, Linkedin, Globe, 
  ExternalLink, Calendar, Loader2, Code, Image as ImageIcon,
  Send, CheckCircle, User, Mail, Phone, FileText, X, MessageCircle,
  AlertTriangle, EyeOff
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { API_URL } from "@/config/constants";
import axios from "axios";

/**
 * Modal de contact
 */
const ContactModal = ({ isOpen, onClose, memberId, memberName }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    sender_name: "",
    sender_email: "",
    sender_phone: "",
    subject: "",
    content: "",
    project_type: ""
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError("");
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_URL}/messages/send`, {
        developer_id: memberId,
        ...formData
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "#16213e" }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 flex items-center justify-between p-4 z-10"
          style={{ background: "#16213e", borderBottom: "1px solid #1f4068" }}
        >
          <h2 className="font-semibold text-lg text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-red-500" />
            Contacter {memberName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Message envoyé !
              </h3>
              <p className="text-gray-400 mb-6">
                Votre message a été transmis à {memberName}. 
                Il vous répondra dans les plus brefs délais.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium"
                style={{ background: "#e94560", color: "white" }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Votre nom *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      name="sender_name"
                      value={formData.sender_name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      required
                      className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Votre email *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      name="sender_email"
                      value={formData.sender_email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      required
                      className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      name="sender_phone"
                      value={formData.sender_phone}
                      onChange={handleChange}
                      placeholder="06 00 00 00 00"
                      className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                    />
                  </div>
                </div>
                
                {/* Type de projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Type de projet
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="site_web">Site web</option>
                    <option value="application">Application mobile</option>
                    <option value="logiciel">Logiciel / CRM / ERP</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="maintenance">Maintenance / TMA</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Sujet */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sujet *
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Objet de votre message"
                    required
                    className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Votre message *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Décrivez votre projet ou votre demande..."
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                  style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                style={{ background: "#e94560", color: "white" }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
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
              {projects.map((project) => {
                const projectImg = project.image_url?.startsWith("http")
                  ? project.image_url
                  : project.image_url ? `${API_URL}${project.image_url}` : null;
                
                const isAdult = project.is_adult_content;
                
                return (
                  <div 
                    key={project.id}
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
              })}
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
