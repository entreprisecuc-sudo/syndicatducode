/**
 * Section compétences techniques — Profil Développeur
 * Sélection des technologies maîtrisées
 */

const TECHNOLOGIES = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js",
  "Python", "Django", "FastAPI", "PHP", "Laravel", "Ruby", "Rails",
  "Java", "Spring", "C#", ".NET", "Go", "Rust",
  "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes"
];

const SkillsSection = ({ selectedSkills, onToggle }) => (
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
    <div className="flex flex-wrap gap-2" data-testid="skills-container">
      {TECHNOLOGIES.map((tech) => {
        const isSelected = selectedSkills.includes(tech);
        return (
          <button
            key={tech}
            type="button"
            onClick={() => onToggle(tech)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${isSelected ? "text-white" : ""}`}
            style={{
              background: isSelected ? "var(--sage)" : "var(--bg-section)",
              color: isSelected ? "white" : "var(--text-secondary)"
            }}
            data-testid={`skill-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          >
            {tech}
          </button>
        );
      })}
    </div>
  </div>
);

export default SkillsSection;
