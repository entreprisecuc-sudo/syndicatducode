/**
 * Page Book / Portfolio - Espace Développeur
 * Présentation des projets réalisés
 * Refactoré pour utiliser les sous-composants extraits
 */

import { useState, useEffect } from "react";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Import des sous-composants
import { ProjectCard, ProjectModal } from "@/components/developer/book";

/**
 * Page principale du Book/Portfolio
 */
const DeveloperBook = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/portfolio`, {
        headers: getAuthHeaders()
      });
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Erreur chargement portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData, projectId) => {
    if (projectId) {
      // Mise à jour
      await axios.put(`${API_URL}/profile/portfolio/${projectId}`, formData, {
        headers: getAuthHeaders()
      });
    } else {
      // Création
      await axios.post(`${API_URL}/profile/portfolio`, formData, {
        headers: getAuthHeaders()
      });
    }
    
    // Rafraîchir la liste
    await fetchProjects();
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Supprimer ce projet de votre portfolio ?")) return;

    try {
      await axios.delete(`${API_URL}/profile/portfolio/${projectId}`, {
        headers: getAuthHeaders()
      });
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const openAddModal = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Mon Book
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Présentez vos réalisations et projets
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="btn-primary inline-flex items-center gap-2"
          data-testid="add-project-btn"
        >
          <Plus size={18} />
          Ajouter un projet
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--sage)" }} />
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="text-center py-12 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <ImageIcon size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Votre book est vide
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Commencez à présenter vos réalisations en ajoutant votre premier projet.
          </p>
          <button
            onClick={openAddModal}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Ajouter mon premier projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={editingProject}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default DeveloperBook;
