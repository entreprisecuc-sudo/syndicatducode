/**
 * Section "Notre approche"
 * Affiche les étapes du processus de travail
 */

import { PROCESS_STEPS } from "@/config/constants";

const ProcessSection = () => (
  <section id="approche" className="section" data-testid="process-section">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* En-tête de section */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="section-title">
          Notre <span className="gradient-text">approche</span>
        </h2>
        <p className="section-subtitle px-4">
          Une méthodologie éprouvée pour des résultats concrets
        </p>
      </div>
      
      {/* Étapes du processus */}
      <div className="max-w-2xl mx-auto">
        {PROCESS_STEPS.map((step, index) => (
          <div 
            key={index} 
            className="process-step" 
            data-testid={`process-step-${index}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="process-content">
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProcessSection;
