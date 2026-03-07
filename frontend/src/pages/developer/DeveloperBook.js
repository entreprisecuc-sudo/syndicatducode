/**
 * Page Book / Portfolio - Espace Développeur
 * Présentation des projets réalisés
 */

import { useState, useEffect, useRef } from "react";
import { 
  Plus, X, Edit2, Trash2, ExternalLink, Github, 
  Image as ImageIcon, Loader2, Save, ChevronDown, ChevronUp
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Technologies disponibles pour les tags
const TECHNOLOGIES = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js",
  "Python", "Django", "FastAPI", "PHP", "Laravel", "Ruby", "Rails",
  "Java", "Spring", "C#", ".NET", "Go", "Rust",
  "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes",
  "HTML", "CSS", "Tailwind", "SASS", "WordPress", "Shopify"
];

/**
 * Composant carte de projet
 */
const ProjectCard = ({ project, onEdit, onDelete }) => {
  const imageUrl = project.image_url?.startsWith("http") 
    ? project.image_url 
    : project.image_url ? `${API_URL}${project.image_url}` : null;

  // Statuts avec couleurs
  const statusConfig = {
    pending: { bg: "#f59e0b20", border: "#f59e0b", text: "#f59e0b", label: "En attente de validation" },
    approved: { bg: "#10b98120", border: "#10b981", text: "#10b981", label: "Approuvé - Visible publiquement" },
    rejected: { bg: "#ef444420", border: "#ef4444", text: "#ef4444", label: "Rejeté" }
  };

  const status = statusConfig[project.status] || statusConfig.pending;

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: `1px solid ${status.border}` }}
      data-testid={`project-card-${project.id}`}
    >
      {/* Badge statut */}
      <div 
        className="px-3 py-1.5 text-xs font-medium flex items-center gap-2"
        style={{ background: status.bg, color: status.text }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: status.text }} />
        {status.label}
      </div>

      {/* Raison de rejet si rejeté */}
      {project.status === "rejected" && project.rejection_reason && (
        <div 
          className="px-3 py-2 text-xs border-b"
          style={{ background: "#ef444410", borderColor: "#ef444430", color: "#ef4444" }}
        >
          <strong>Raison du rejet :</strong> {project.rejection_reason}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-video bg-gray-800">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-600" />
          </div>
        )}
        
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onEdit(project)}
            className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            title="Modifier"
            data-testid={`edit-project-${project.id}`}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
            title="Supprimer"
            data-testid={`delete-project-${project.id}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
          {project.title}
        </h3>
        
        {project.year && (
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {project.year}
          </p>
        )}

        {project.description && (
          <p className="text-sm mb-3 line-clamp-3" style={{ color: "var(--text-secondary)" }}>
            {project.description}
          </p>
        )}

        {/* Technologies */}
        {project.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.technologies.map((tech) => (
              <span 
                key={tech}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "var(--sage)", color: "white" }}
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
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-section)", color: "var(--sage)" }}
            >
              <ExternalLink size={14} />
              Voir le projet
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-section)", color: "var(--text-secondary)" }}
            >
              <Github size={14} />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Modal d'ajout/édition de projet
 */
const ProjectModal = ({ isOpen, onClose, project, onSave }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showTechSelect, setShowTechSelect] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    image_data: null,
    project_url: "",
    github_url: "",
    technologies: [],
    year: ""
  });

  // Initialiser avec les données du projet si édition
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        image_url: project.image_url || "",
        image_data: null,
        project_url: project.project_url || "",
        github_url: project.github_url || "",
        technologies: project.technologies || [],
        year: project.year || ""
      });
      
      // Preview de l'image existante
      if (project.image_url) {
        const url = project.image_url.startsWith("http") 
          ? project.image_url 
          : `${API_URL}${project.image_url}`;
        setPreviewImage(url);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        image_url: "",
        image_data: null,
        project_url: "",
        github_url: "",
        technologies: [],
        year: ""
      });
      setPreviewImage(null);
    }
  }, [project, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleTech = (tech) => {
    const technologies = formData.technologies.includes(tech)
      ? formData.technologies.filter(t => t !== tech)
      : [...formData.technologies, tech];
    setFormData({ ...formData, technologies });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Format non supporté. Utilisez JPG, PNG ou WEBP.");
      return;
    }

    // Vérifier la taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    // Convertir en base64 et preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image_data: reader.result, image_url: "" });
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Le titre est obligatoire");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, project?.id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {project ? "Modifier le projet" : "Ajouter un projet"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Image du projet
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            
            <div 
              className="relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 border-dashed"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-section)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ImageIcon size={48} style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                    Cliquez pour ajouter une image
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    JPG, PNG, WEBP - max 5 Mo
                  </p>
                </div>
              )}
            </div>

            {/* OU URL externe */}
            <div className="mt-2">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Ou entrez une URL d'image externe :
              </p>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value) {
                    setPreviewImage(e.target.value);
                    setFormData(prev => ({ ...prev, image_data: null }));
                  }
                }}
                placeholder="https://exemple.com/image.jpg"
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Titre */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Titre du projet *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Mon super projet"
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez ce projet en quelques mots..."
              className="w-full"
            />
          </div>

          {/* Année */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Année
            </label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="2024"
              className="w-full"
            />
          </div>

          {/* Liens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Lien vers le projet
              </label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  type="url"
                  name="project_url"
                  value={formData.project_url}
                  onChange={handleChange}
                  placeholder="https://monprojet.com"
                  className="w-full pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Lien GitHub
              </label>
              <div className="relative">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/user/repo"
                  className="w-full pl-10"
                />
              </div>
            </div>
          </div>

          {/* Technologies */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowTechSelect(!showTechSelect)}
              className="flex items-center justify-between w-full text-sm font-medium mb-2 p-2 rounded-lg"
              style={{ color: "var(--text-secondary)", background: "var(--bg-section)" }}
            >
              <span>
                Technologies utilisées 
                {formData.technologies.length > 0 && ` (${formData.technologies.length})`}
              </span>
              {showTechSelect ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showTechSelect && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg" style={{ background: "var(--bg-section)" }}>
                {TECHNOLOGIES.map((tech) => {
                  const isSelected = formData.technologies.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        isSelected ? "text-white" : ""
                      }`}
                      style={{ 
                        background: isSelected ? "var(--sage)" : "var(--bg-card)",
                        color: isSelected ? "white" : "var(--text-secondary)"
                      }}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tags sélectionnés */}
            {formData.technologies.length > 0 && !showTechSelect && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.technologies.map((tech) => (
                  <span 
                    key={tech}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ background: "var(--sage)", color: "white" }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-section)", color: "var(--text-secondary)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
