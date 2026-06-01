/**
 * Modal formulaire création/édition de projet - Espace Admin
 * Gère son propre état de formulaire
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const INITIAL_FORM = {
  title: "",
  description: "",
  technologies: [],
  budget: "",
  collaboration_type: "freelance"
};

const AVAILABLE_TECHNOLOGIES = [
  "React", "Vue.js", "Angular", "Node.js", "Python", "FastAPI", "Django",
  "PHP", "Laravel", "Java", "Spring", "MongoDB", "PostgreSQL", "MySQL",
  "Docker", "AWS", "TypeScript", "Next.js", "Flutter", "React Native"
];

const ProjectFormModal = ({ show, editingProject, onClose, onSave }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);

  // Initialiser le formulaire quand le projet à modifier change
  useEffect(() => {
    if (editingProject) {
      setFormData({
        title:              editingProject.title,
        description:        editingProject.description,
        technologies:       editingProject.technologies || [],
        budget:             editingProject.budget || "",
        collaboration_type: editingProject.collaboration_type
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [editingProject, show]);

  const toggleTechnology = (tech) => {
    const technologies = formData.technologies.includes(tech)
      ? formData.technologies.filter(t => t !== tech)
      : [...formData.technologies, tech];
    setFormData({ ...formData, technologies });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setFormLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)" }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>
          {editingProject ? "Modifier le projet" : "Nouveau projet"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
              Titre du projet *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Développement ERP sur mesure"
              className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
              style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Décrivez le projet en détail..."
              className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
              style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
              Type de collaboration *
            </label>
            <select
              value={formData.collaboration_type}
              onChange={(e) => setFormData({ ...formData, collaboration_type: e.target.value })}
              required
              className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
              style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            >
              <option value="freelance">Mission Freelance</option>
              <option value="support">Soutien Technique</option>
              <option value="partnership">Partenariat</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
              Budget indicatif
            </label>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Ex: 5 000 - 10 000 € ou À définir"
              className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
              style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors flex items-center gap-2"
              style={{ background: "var(--admin-accent)" }}
            >
              {formLoading && <Loader2 size={16} className="animate-spin" />}
              {formLoading ? "Enregistrement..." : editingProject ? "Mettre à jour" : "Créer le projet"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
