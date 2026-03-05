/**
 * Section "Pourquoi nous choisir"
 * Liste les avantages de l'entreprise
 */

import { Check } from "lucide-react";
import { WHY_US_ITEMS, CONFIG } from "@/config/constants";

const WhyUsSection = () => (
  <section 
    id="pourquoi" 
    className="section" 
    style={{ background: 'var(--bg-section)' }} 
    data-testid="why-section"
  >
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        
        {/* Liste des avantages */}
        <div>
          <h2 className="section-title mb-6 md:mb-8">
            Pourquoi <span className="gradient-text">nous choisir</span> ?
          </h2>
          <div>
            {WHY_US_ITEMS.map((item, index) => (
              <div 
                key={index} 
                className="why-item" 
                data-testid={`why-item-${index}`}
              >
                <div className="why-check">
                  <Check size={16} color="white" />
                </div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Citation */}
        <div 
          className="card" 
          style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-section))' }}
        >
          <blockquote 
            className="text-lg md:text-xl italic" 
            style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
          >
            "Nous ne vendons pas juste un site, nous créons un{" "}
            <span className="gradient-text font-semibold">outil de croissance</span>{" "}
            pour votre entreprise."
          </blockquote>
          <p 
            className="mt-6 font-semibold" 
            style={{ color: 'var(--sage)' }}
          >
            — {CONFIG.companyName}
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default WhyUsSection;
