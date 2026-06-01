/**
 * Gestion des projets - Admin
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { Rocket, Plus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import ProjectCard from "@/components/admin/projects/ProjectCard";
import ProjectFormModal from "@/components/admin/projects/ProjectFormModal";

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => { fetchProjects(); }, [filterStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const response = await api.get(`/projects/admin/list${params}`);
      setProjects(response.data.projects);
    } catch (err) {
      setError("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    if (editingProject) {
      await api.put(`/projects/admin/${editingProject.id}`, formData);
    } else {
      await api.post('/projects/admin/create', formData);
    }
    fetchProjects();
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      await api.put(`/projects/admin/${projectId}`, { status: newStatus });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;
    try {
      await api.delete(`/projects/admin/${projectId}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 className="text-xl font-bold mb-6 lg:hidden" style={{ color: "var(--admin-text)" }}>
        Projets
      </h1>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>
            Projets du Syndicat
          </h2>
          <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
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
          style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--admin-accent)" }} />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">{error}</div>
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
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEditModal}
              onDelete={deleteProject}
              onStatusChange={updateProjectStatus}
            />
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      <ProjectFormModal
        show={showModal}
        editingProject={editingProject}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </AdminLayout>
  );
};

export default AdminProjects;
