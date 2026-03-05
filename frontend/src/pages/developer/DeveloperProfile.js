/**
 * Page Profil - Espace Développeur
 */

import { useState } from "react";
import { User, Mail, Phone, MapPin, Code, Github, Linkedin, Globe, Save } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

// Technologies disponibles
const TECHNOLOGIES = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js",
  "Python", "Django", "FastAPI", "PHP", "Laravel", "Ruby", "Rails",
  "Java", "Spring", "C#", ".NET", "Go", "Rust",
  "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes"
];

const DeveloperProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
    experience: "",
    availability: "full",
    skills: []
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const toggleSkill = (skill) => {
    const skills = formData.skills.includes(skill)
      ? formData.skills.filter(s => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSuccess(true);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Mon profil
      </h1>

      <div className="max-w-3xl">
        {/* En-tête profil */}
        <div 
          className="p-6 rounded-xl mb-6 flex flex-col sm:flex-row items-center gap-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: "var(--sage)" }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {formData.firstName && formData.lastName 
                ? `${formData.firstName} ${formData.lastName}`
                : user?.email
              }
            </h2>
            <p className="text-sm" style={{ color: "var(--sage)" }}>
              Partenaire Développeur
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informations personnelles */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Informations personnelles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="06 00 00 00 00"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Ville
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Votre ville"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Bio / Présentation
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Présentez-vous en quelques mots..."
                className="w-full"
              />
            </div>
          </div>

          {/* Profil professionnel */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Profil professionnel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Années d'expérience
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full"
                >
                  <option value="">Sélectionner...</option>
                  <option value="0-2">0-2 ans</option>
                  <option value="2-5">2-5 ans</option>
                  <option value="5-10">5-10 ans</option>
                  <option value="10+">10+ ans</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Disponibilité
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full"
                >
                  <option value="full">Temps plein</option>
                  <option value="partial">Temps partiel</option>
                  <option value="weekends">Week-ends uniquement</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>
            </div>

            {/* Liens */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  GitHub
                </label>
                <div className="relative">
                  <Github size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  LinkedIn
                </label>
                <div className="relative">
                  <Linkedin size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Portfolio / Site web
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="https://monsite.com"
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Compétences techniques
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Sélectionnez les technologies que vous maîtrisez
            </p>

            <div className="flex flex-wrap gap-2">
              {TECHNOLOGIES.map((tech) => {
                const isSelected = formData.skills.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleSkill(tech)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected ? "text-white" : ""
                    }`}
                    style={{ 
                      background: isSelected ? "var(--sage)" : "var(--bg-section)",
                      color: isSelected ? "white" : "var(--text-secondary)"
                    }}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message succès */}
          {success && (
            <div className="p-3 rounded-lg text-sm bg-green-100 text-green-700 mb-4">
              Profil mis à jour avec succès !
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DeveloperProfile;
