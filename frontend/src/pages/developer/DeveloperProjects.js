/**
 * Projets du Syndicat - Espace Développeur
 * Liste des projets ouverts + candidatures + espaces projets
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Rocket, MapPin, Clock, Euro, Code, Send, 
  CheckCircle, AlertCircle, ChevronRight, X, MessageSquare, Users
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des types de collaboration
const COLLAB_CONFIG = {
  freelance: { label: "Mission Freelance", color: "#8b5cf6", bg: "#8b5cf620" },
  support: { label: "Soutien Technique", color: "#f59e0b", bg: "#f59e0b20" },
  partnership: { label: "Partenariat", color: "#10b981", bg: "#10b98120" }
};

const DeveloperProjects = () => {
  const [projects, setProjects] = useState([]);
  const [projectRooms, setProjectRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("projects"); // projects, rooms
  
  // Modal candidature
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchProjectRooms();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/`, {
        headers: getAuthHeaders()
      });
      setProjects(response.data.projects);
    } catch (err) {
      setError("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/project-rooms/my-rooms`, {
        headers: getAuthHeaders()
      });
      setProjectRooms(response.data.rooms);
    } catch (err) {
      console.error("Erreur chargement espaces projets:", err);
    }
  };

  const openApplyModal = (project) => {
    setSelectedProject(project);
    setMessage("");
    setApplySuccess(false);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setMessage("");
    setApplySuccess(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setApplying(true);
    try {
      await axios.post(
        `${API_URL}/projects/${selectedProject.id}/apply`,
        { message },
        { headers: getAuthHeaders() }
      );
      setApplySuccess(true);
      // Rafraîchir la liste pour mettre à jour le statut "has_applied"
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'envoi de la candidature");
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Projets du Syndicat
      </h1>

      {/* Onglets */}
      <div 
        className="flex gap-2 mb-6 p-1 rounded-lg"
        style={{ background: "var(--bg-section)" }}
      >
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "projects" ? "bg-white shadow-sm" : ""
          }`}
          style={{ color: activeTab === "projects" ? "var(--sage-dark)" : "var(--text-muted)" }}
        >
          <Rocket size={18} />
          Projets disponibles ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "rooms" ? "bg-white shadow-sm" : ""
          }`}
          style={{ color: activeTab === "rooms" ? "var(--sage-dark)" : "var(--text-muted)" }}
        >
          <MessageSquare size={18} />
          Mes espaces projets ({projectRooms.length})
        </button>
      </div>

      {/* ONGLET MES ESPACES PROJETS */}
      {activeTab === "rooms" && (
        <div>
          {projectRooms.length === 0 ? (
            <div 
              className="p-8 rounded-xl text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
              <MessageSquare size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Aucun espace projet
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Quand votre candidature est acceptée, un espace de collaboration<br />
                est automatiquement créé pour échanger avec l'équipe.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/espace-developpeur/projet/${room.id}`}
                  className="block p-5 rounded-xl transition-all hover:shadow-md"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                        {room.name}
                      </h3>
                      {room.project?.technologies && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {room.project.technologies.slice(0, 4).map((tech) => (
                            <span 
                              key={tech}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: "var(--bg-section)", color: "var(--sage)" }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Users size={14} />
                          <span className="text-sm">{room.members_count}</span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>membres</p>
                      </div>
                      {room.recent_messages > 0 && (
                        <div 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ background: "var(--sage)" }}
                        >
                          {room.recent_messages} nouveau{room.recent_messages > 1 ? "x" : ""}
                        </div>
                      )}
                      <ChevronRight size={20} style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET PROJETS DISPONIBLES */}
      {activeTab === "projects" && (
      <>
      {/* Introduction */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Projets disponibles
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Consultez les projets du Syndicat et postulez à ceux qui correspondent à vos compétences.
          Vous serez contacté si votre profil est retenu.
        </p>
      </div>

      {/* Liste des projets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--sage)" }}></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-100 text-red-700 text-center">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <Rocket size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Aucun projet disponible
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Il n'y a pas de projet ouvert pour le moment.<br />
            Revenez bientôt ou complétez votre profil pour être notifié.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const collabConfig = COLLAB_CONFIG[project.collaboration_type] || COLLAB_CONFIG.freelance;
            
            return (
              <div 
                key={project.id}
                className="p-5 rounded-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 
                        className="font-semibold text-lg"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {project.title}
                      </h3>
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: collabConfig.bg, color: collabConfig.color }}
                      >
                        {collabConfig.label}
                      </span>
                    </div>
                    
                    <p 
                      className="text-sm mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {project.description}
                    </p>
                    
                    {/* Technologies */}
                    {project.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map(tech => (
                          <span 
                            key={tech}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "var(--bg-section)", color: "var(--sage)" }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Infos */}
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
                      {project.budget && (
                        <span className="flex items-center gap-1">
                          <Euro size={14} />
                          {project.budget}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Publié le {new Date(project.published_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bouton candidature */}
                  <div className="shrink-0">
                    {project.has_applied ? (
                      <span 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ background: "var(--bg-section)", color: "var(--sage)" }}
                      >
                        <CheckCircle size={16} />
                        Candidature envoyée
                      </span>
                    ) : (
                      <button
                        onClick={() => openApplyModal(project)}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <Send size={16} />
                        Je suis intéressé
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Modal candidature */}
      {selectedProject && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="w-full max-w-lg rounded-xl p-6"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {applySuccess ? (
              <div className="text-center py-6">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: "var(--sage)" }}
                >
                  <CheckCircle size={32} color="white" />
                </div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Candidature envoyée !
                </h3>
                <p 
                  className="text-sm mb-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Le Syndicat a été notifié de votre intérêt.<br />
                  Vous serez contacté si votre profil correspond.
                </p>
                <button onClick={closeModal} className="btn-primary">
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Postuler au projet
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: "var(--sage)" }}
                    >
                      {selectedProject.title}
                    </p>
                  </div>
                  <button 
                    onClick={closeModal}
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleApply}>
                  <div className="mb-4">
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Pourquoi êtes-vous intéressé par ce projet ? *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="Présentez brièvement votre expérience et ce qui vous motive pour ce projet..."
                      className="w-full"
                    />
                    <p 
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Minimum 10 caractères
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={applying || message.length < 10}
                      className="btn-primary flex-1"
                    >
                      {applying ? "Envoi..." : "Envoyer ma candidature"}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Conseils */}
      <div 
        className="mt-6 p-5 rounded-xl"
        style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)" }}
      >
        <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          💡 Conseils pour être sélectionné
        </h3>
        <ul className="text-sm space-y-2" style={{ color: "var(--text-muted)" }}>
          <li>• Complétez votre profil à 100% avec toutes vos compétences</li>
          <li>• Ajoutez vos liens GitHub et portfolio pour montrer vos réalisations</li>
          <li>• Personnalisez chaque candidature en fonction du projet</li>
          <li>• Mettez en avant votre expérience pertinente</li>
        </ul>
      </div>
    </DashboardLayout>
  );
};

export default DeveloperProjects;
