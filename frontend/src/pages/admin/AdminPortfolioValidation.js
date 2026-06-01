/**
 * Page Admin - Validation des Books/Portfolios
 * Container principal : gestion d'état + appels API
 */

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Loader2, Filter } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import ProjectCard from "@/components/admin/portfolio/ProjectCard";
import ProjectPreviewModal from "@/components/admin/portfolio/ProjectPreviewModal";

const AdminPortfolioValidation = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [previewProject, setPreviewProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const response = await api.get(`/admin/portfolio/all${params}`);
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (projectId) => {
    try {
      await api.put(`/admin/portfolio/${projectId}/approve`, {});
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, status: "approved" } : p
      ));
      setPreviewProject(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async (projectId, reason) => {
    try {
      await api.put(`/admin/portfolio/${projectId}/reject`, { reason });
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, status: "rejected", rejection_reason: reason } : p
      ));
      setPreviewProject(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors du rejet");
    }
  };

  const pendingCount = projects.filter(p => p.status === "pending").length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white lg:hidden">Validation Books</h1>
          <p className="text-sm text-gray-400">
            Validez les projets soumis par les développeurs avant publication
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "#1f4068", border: "1px solid var(--admin-border)", color: "white" }}
          >
            <option value="pending">En attente ({pendingCount})</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
            <option value="all">Tous</option>
          </select>
        </div>
      </div>

      {/* Alerte projets en attente */}
      {filter !== "pending" && pendingCount > 0 && (
        <div
          className="p-4 rounded-xl mb-6 flex items-center gap-3"
          style={{ background: "#f59e0b20", border: "1px solid #f59e0b" }}
        >
          <Clock size={20} className="text-amber-500" />
          <span className="text-amber-500">
            <strong>{pendingCount}</strong> projet{pendingCount > 1 ? "s" : ""} en attente de validation
          </span>
          <button
            onClick={() => setFilter("pending")}
            className="ml-auto px-3 py-1 rounded text-sm bg-amber-500 text-white"
          >
            Voir
          </button>
        </div>
      )}

      {/* Grille de projets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : projects.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-white mb-2">
            {filter === "pending" ? "Aucun projet en attente" : "Aucun projet"}
          </h3>
          <p className="text-sm text-gray-400">
            {filter === "pending"
              ? "Tous les projets ont été traités."
              : "Aucun projet ne correspond à ce filtre."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPreview={setPreviewProject}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Modal de prévisualisation */}
      {previewProject && (
        <ProjectPreviewModal
          project={previewProject}
          onClose={() => setPreviewProject(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPortfolioValidation;
