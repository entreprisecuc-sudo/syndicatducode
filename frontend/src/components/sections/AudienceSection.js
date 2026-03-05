/**
 * Section "À qui s'adresse nos solutions"
 * Affiche les différents publics cibles
 */

import { AUDIENCES } from "@/config/constants";

const AudienceSection = () => (
  <section 
    className="section" 
    style={{ background: 'var(--bg-section)' }} 
    data-testid="audience-section"
  >
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* En-tête de section */}
      <div className="text-center mb-10 md:mb-12">
        <h2 className="section-title">
          À qui s'adresse <span className="gradient-text">nos solutions</span> ?
        </h2>
      </div>
      
      {/* Tags des audiences */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {AUDIENCES.map((audience, index) => (
          <div 
            key={index} 
            className="audience-tag" 
            data-testid={`audience-tag-${index}`}
          >
            {audience}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AudienceSection;
