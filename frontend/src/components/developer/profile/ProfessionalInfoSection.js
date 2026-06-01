/**
 * Section Profil Professionnel - Espace Développeur
 * Inclut : expérience, disponibilité, GitHub, LinkedIn, Portfolio
 */

import { Github, Linkedin, Globe } from "lucide-react";

const ProfessionalInfoSection = ({ formData, onChange }) => (
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
          onChange={onChange}
          className="w-full"
          data-testid="profile-experience"
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
          onChange={onChange}
          className="w-full"
          data-testid="profile-availability"
        >
          <option value="full">Temps plein</option>
          <option value="partial">Temps partiel</option>
          <option value="weekends">Week-ends uniquement</option>
          <option value="unavailable">Indisponible</option>
        </select>
      </div>
    </div>

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
            onChange={onChange}
            placeholder="https://github.com/username"
            className="w-full pl-10"
            data-testid="profile-github"
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
            onChange={onChange}
            placeholder="https://linkedin.com/in/username"
            className="w-full pl-10"
            data-testid="profile-linkedin"
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
            onChange={onChange}
            placeholder="https://monsite.com"
            className="w-full pl-10"
            data-testid="profile-portfolio"
          />
        </div>
      </div>
    </div>
  </div>
);

export default ProfessionalInfoSection;
