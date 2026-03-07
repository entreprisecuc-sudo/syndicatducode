/**
 * Modal d'ajout/édition de projet - Book développeur
 * Formulaire complet pour créer ou modifier un projet du portfolio
 */

import { useState, useEffect, useRef } from "react";
import { 
  X, ExternalLink, Github, Image as ImageIcon, 
  Loader2, Save, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";
import { API_URL } from "@/config/constants";

// Technologies disponibles pour les tags
const TECHNOLOGIES = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js",
  "Python", "Django", "FastAPI", "PHP", "Laravel", "Ruby", "Rails",
  "Java", "Spring", "C#", ".NET", "Go", "Rust",
  "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes",
  "HTML", "CSS", "Tailwind", "SASS", "WordPress", "Shopify"
];

export const ProjectModal = ({ isOpen, onClose, project, onSave }) => {
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
    year: "",
    is_adult_content: false
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
        year: project.year || "",
        is_adult_content: project.is_adult_content || false
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
        year: "",
        is_adult_content: false
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

          {/* Contenu adulte */}
          <div className="mb-4">
            <label 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
              style={{ 
                background: formData.is_adult_content ? "#ef444420" : "var(--bg-section)",
                border: formData.is_adult_content ? "1px solid #ef4444" : "1px solid var(--border-color)"
              }}
            >
              <input
                type="checkbox"
                checked={formData.is_adult_content}
                onChange={(e) => setFormData({ ...formData, is_adult_content: e.target.checked })}
                className="w-5 h-5 rounded accent-red-500"
              />
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} style={{ color: formData.is_adult_content ? "#ef4444" : "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: formData.is_adult_content ? "#ef4444" : "var(--text-secondary)" }}>
                    Contenu réservé aux +18 ans
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    L'image sera floutée et le lien masqué sur la page publique
                  </p>
                </div>
              </div>
            </label>
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

export default ProjectModal;
