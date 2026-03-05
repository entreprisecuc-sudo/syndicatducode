/**
 * Section Hero (En-tête de la page d'accueil)
 */

import { ChevronRight } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { CONFIG } from "@/config/constants";

const HeroSection = () => {
  const { openModal } = useModal();
  
  return (
    <section className="hero" data-testid="hero-section">
      {/* Éléments décoratifs */}
      <div className="grid-bg"></div>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 hero-content">
        {/* Slogan */}
        <p 
          className="text-sage-light mb-3 md:mb-4 font-medium opacity-0 animate-fade-in-up text-sm md:text-base mt-8" 
          style={{ color: 'var(--sage)' }}
        >
          {CONFIG.slogan}
        </p>
        
        {/* Titre principal */}
        <h1 className="hero-title opacity-0 animate-fade-in-up delay-100">
          Création de sites web<br />
          <span className="gradient-text">modernes, performants</span><br />
          et intelligents
        </h1>
        
        {/* Sous-titre */}
        <p className="hero-subtitle opacity-0 animate-fade-in-up delay-200">
          Du site vitrine au CRM & ERP sur mesure, avec intégration de solutions 
          IA sur mesure pour votre business.
        </p>
        
        {/* Accroche prix */}
        <p 
          className="mb-6 font-semibold opacity-0 animate-fade-in-up delay-200" 
          style={{ color: 'var(--sage-dark)', fontSize: '1.1rem' }}
        >
          Pas de rançon. Un prix. Technologies actuelles incluses.
        </p>
        
        {/* Boutons CTA */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 opacity-0 animate-fade-in-up delay-300">
          <button 
            onClick={openModal} 
            className="btn-primary" 
            data-testid="hero-cta-devis"
          >
            Demander un devis
            <ChevronRight className="inline ml-2" size={18} />
          </button>
          <a 
            href="#services" 
            className="btn-secondary" 
            data-testid="hero-cta-services"
          >
            Voir nos solutions
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
