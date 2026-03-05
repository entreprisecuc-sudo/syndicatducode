/**
 * Section Services
 * Affiche les 6 services proposés par l'entreprise
 */

import { Monitor, Settings, Bot, Store, Smartphone, Wrench } from "lucide-react";
import { SERVICES } from "@/config/constants";

// Map des icônes par nom
const ICONS = {
  Monitor,
  Settings,
  Bot,
  Store,
  Smartphone,
  Wrench
};

const ServicesSection = () => (
  <section id="services" className="section" data-testid="services-section">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* En-tête de section */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="section-title">
          Nos <span className="gradient-text">services</span>
        </h2>
        <p className="section-subtitle px-4">
          Des solutions digitales complètes pour accompagner votre croissance
        </p>
      </div>
      
      {/* Grille des services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {SERVICES.map((service, index) => {
          const IconComponent = ICONS[service.icon];
          
          return (
            <div 
              key={index} 
              className="service-card"
              data-testid={`service-card-${index}`}
            >
              <div className="icon-box">
                <IconComponent size={28} color="white" />
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul>
                {service.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default ServicesSection;
