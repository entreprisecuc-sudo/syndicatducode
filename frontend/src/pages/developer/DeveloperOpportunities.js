/**
 * Page Opportunités - Espace Développeur
 */

import { Code, MapPin, Clock, Euro, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Opportunités mockées (vide pour MVP)
const MOCK_OPPORTUNITIES = [];

const DeveloperOpportunities = () => {
  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Opportunités
      </h1>

      {/* Introduction */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Opportunités de missions
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Consultez les projets disponibles et postulez aux missions qui correspondent à vos compétences.
        </p>
      </div>

      {/* Liste des opportunités */}
      {MOCK_OPPORTUNITIES.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <Code size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Aucune opportunité disponible
          </h3>
          <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            Il n'y a pas de mission ouverte pour le moment. 
            Complétez votre profil pour être notifié dès qu'une opportunité correspondant à vos compétences sera disponible.
          </p>
          <a 
            href="/espace-developpeur/profil" 
            className="btn-primary inline-flex items-center gap-2"
          >
            Compléter mon profil
            <ChevronRight size={18} />
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {MOCK_OPPORTUNITIES.map((opportunity) => (
            <div 
              key={opportunity.id}
              className="p-5 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
              {/* Carte opportunité */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    {opportunity.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                    {opportunity.description}
                  </p>
                  
                  {/* Tags technologies */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {opportunity.technologies.map((tech) => (
                      <span 
                        key={tech}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: "var(--bg-section)", color: "var(--sage)" }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  {/* Infos */}
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {opportunity.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {opportunity.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro size={14} />
                      {opportunity.rate}
                    </span>
                  </div>
                </div>
                
                <button className="btn-primary shrink-0">
                  Postuler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conseils */}
      <div 
        className="mt-6 p-5 rounded-xl"
        style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)" }}
      >
        <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          💡 Conseils pour être sélectionné
        </h3>
        <ul className="text-sm space-y-2" style={{ color: "var(--text-muted)" }}>
          <li>• Complétez votre profil à 100% avec toutes vos compétences</li>
          <li>• Ajoutez vos liens GitHub et portfolio pour montrer vos réalisations</li>
          <li>• Indiquez votre disponibilité réelle pour éviter les malentendus</li>
          <li>• Personnalisez chaque candidature en fonction du projet</li>
        </ul>
      </div>
    </DashboardLayout>
  );
};

export default DeveloperOpportunities;
