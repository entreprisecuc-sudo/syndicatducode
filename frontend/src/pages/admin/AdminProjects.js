/**
 * Gestion des projets - Admin
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { 
  Rocket, Plus, Edit, Trash2, Users
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des statuts
const STATUS_CONFIG = {
  open: { label: "Ouvert", color: "#10b981", bg: "#10b98120" },
  in_progress: { label: "En cours", color: "#3b82f6", bg: "#3b82f620" },
  closed: { label: "Fermé", color: "#6b7280", bg: "#6b728020" }
};

// Configuration des types de collaboration
const COLLAB_CONFIG = {
  freelance: { label: "Mission Freelance", color: "#8b5cf6" },
  support: { label: "Soutien Technique", color: "#f59e0b" },
  partnership: { label: "Partenariat", color: "#10b981" }
};

// Technologies disponibles
const AVAILABLE_TECHNOLOGIES = [
  "React", "Vue.js", "Angular", "Node.js", "Python", "FastAPI", "Django",
  "PHP", "Laravel", "Java", "Spring", "MongoDB", "PostgreSQL", "MySQL",
  "Docker", "AWS", "TypeScript", "Next.js", "Flutter", "React Native"
];

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Modal création/édition
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologies: [],
    budget: "",
    collaboration_type: "freelance"
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const response = await axios.get(`${API_URL}/projects/admin/list${params}`, {
        headers: getAuthHeaders()
      });
      setProjects(response.data.projects);
    } catch (err) {
      setError("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      description: "",
      technologies: [],
      budget: "",
      collaboration_type: "freelance"
    });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      technologies: project.technologies || [],
      budget: project.budget || "",
      collaboration_type: project.collaboration_type
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingProject) {
        await axios.put(
          `${API_URL}/projects/admin/${editingProject.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${API_URL}/projects/admin/create`,
          formData,
          { headers: getAuthHeaders() }
        );
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setFormLoading(false);
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/projects/admin/${projectId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;
    
    try {
      await axios.delete(`${API_URL}/projects/admin/${projectId}`, {
        headers: getAuthHeaders()
      });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const toggleTechnology = (tech) => {
    const technologies = formData.technologies.includes(tech)
      ? formData.technologies.filter(t => t !== tech)
      : [...formData.technologies, tech];
    setFormData({ ...formData, technologies });
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Projets
      </h1>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 
            className="font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            Projets du Syndicat
          </h2>
          <p 
            className="text-sm"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            Gérez les projets visibles par les développeurs
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors inline-flex items-center gap-2"
          style={{ background: "var(--admin-accent)" }}
        >
          <Plus size={18} />
          Nouveau projet
        </button>
      </div>

      {/* Filtres */}
      <div 
        className="p-4 rounded-xl mb-6 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg py-2 px-3 transition-colors duration-300"
          style={{ 
            background: "var(--admin-bg-section)", 
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)"
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouvert</option>
          <option value="in_progress">En cours</option>
          <option value="closed">Fermé</option>
        </select>
      </div>

      {/* Liste des projets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "var(--admin-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <Rocket size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
          <p className="mb-4" style={{ color: "var(--admin-text-secondary)" }}>Aucun projet créé</p>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
            style={{ background: "var(--admin-accent)" }}
          >
            Créer le premier projet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.open;
            const collabConfig = COLLAB_CONFIG[project.collaboration_type] || COLLAB_CONFIG.freelance;
            
            return (
              <div 
                key={project.id}
                className="p-5 rounded-xl transition-colors duration-300"
                style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
              >
                {/* Header projet */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 
                        className="font-semibold text-lg"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {project.title}
                      </h3>
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <p 
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {project.description}
                    </p>
                    
                    {/* Technologies */}
                    {project.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map(tech => (
                          <span 
                            key={tech}
                            className="px-2 py-1 rounded text-xs transition-colors duration-300"
                            style={{ 
                              background: "var(--admin-bg-section)", 
                              color: "var(--admin-text-secondary)" 
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Infos */}
                    <div 
                      className="flex flex-wrap items-center gap-4 text-sm"
                      style={{ color: "var(--admin-text-muted)" }}
                    >
                      <span style={{ color: collabConfig.color }}>
                        {collabConfig.label}
                      </span>
                      {project.budget && (
                        <span>Budget: {project.budget}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {project.applications_count || 0} candidature(s)
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Changer statut */}
                    <select
                      value={project.status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
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
                      onClick={() => openEditModal(project)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)" }}
          >
            <h2 
              className="text-xl font-bold mb-6"
              style={{ color: "var(--admin-text)" }}
            >
              {editingProject ? "Modifier le projet" : "Nouveau projet"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Titre */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Titre du projet *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: Développement ERP sur mesure"
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Décrivez le projet en détail..."
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
              </div>
              
              {/* Type de collaboration */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Type de collaboration *
                </label>
                <select
                  value={formData.collaboration_type}
                  onChange={(e) => setFormData({ ...formData, collaboration_type: e.target.value })}
                  required
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                >
                  <option value="freelance">Mission Freelance</option>
                  <option value="support">Soutien Technique</option>
                  <option value="partnership">Partenariat</option>
                </select>
              </div>
              
              {/* Budget */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Budget indicatif
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="Ex: 5 000 - 10 000 € ou À définir"
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
              </div>
              
              {/* Technologies */}
              <div className="mb-6">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Technologies requises
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TECHNOLOGIES.map(tech => {
                    const isSelected = formData.technologies.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTechnology(tech)}
                        className="px-3 py-1.5 rounded text-sm transition-colors"
                        style={{
                          background: isSelected ? "var(--admin-accent)" : "var(--admin-bg-section)",
                          color: isSelected ? "#fff" : "var(--admin-text-secondary)"
                        }}
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                  style={{ background: "var(--admin-accent)" }}
                >
                  {formLoading ? "Enregistrement..." : editingProject ? "Mettre à jour" : "Créer le projet"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    color: "var(--admin-text-secondary)" 
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProjects;
