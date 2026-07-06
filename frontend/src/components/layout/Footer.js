/**
 * Composant Footer
 * Pied de page avec navigation et mentions légales
 */

import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { CONFIG } from "@/config/constants";

const Footer = () => {
  return (
    <footer className="footer" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Slogan */}
          <div>
            <img 
              src={CONFIG.logo} 
              alt={CONFIG.companyName} 
              style={{ height: '80px' }} 
              className="mb-4" 
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {CONFIG.slogan}
            </p>
          </div>
          
          {/* Navigation */}
          <div>
            <h4 
              className="font-semibold mb-4" 
              style={{ color: 'var(--text-primary)' }}
            >
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/#services" className="footer-link">Services</a>
              </li>
              <li>
                <a href="/#pourquoi" className="footer-link">Pourquoi nous</a>
              </li>
              <li>
                <a href="/#approche" className="footer-link">Notre approche</a>
              </li>
              <li>
                <a href="/#contact" className="footer-link">Contact</a>
              </li>
              <li>
                <a href="/rejoindre" className="footer-link">Rejoindre le Syndicat</a>
              </li>
              <li>
                <a href="/membres" className="footer-link">Membres du Syndicat</a>
              </li>
            </ul>
          </div>
          
          {/* Mentions Légales */}
          <div>
            <h4 
              className="font-semibold mb-4" 
              style={{ color: 'var(--text-primary)' }}
            >
              Mentions légales
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/cgv" className="footer-link">
                  Conditions Générales de Vente
                </a>
              </li>
              <li>
                <a href="/cgu" className="footer-link">
                  Conditions Générales d'Utilisation
                </a>
              </li>
              <li>
                <a href="/rgpd" className="footer-link">
                  Politique de confidentialité (RGPD)
                </a>
              </li>
            </ul>
          </div>

          {/* Notre écosystème */}
          <div>
            <h4 
              className="font-semibold mb-4" 
              style={{ color: 'var(--text-primary)' }}
            >
              Notre écosystème
            </h4>
            <Link
              to="/citadelle"
              className="inline-flex flex-col gap-2 p-4 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ 
                border: "1px solid #C9A45C", 
                background: "rgba(201, 164, 92, 0.06)",
                textDecoration: "none"
              }}
              data-testid="footer-citadelle"
            >
              <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "#C9A45C" }}>
                <Shield size={16} />
                La Citadelle Numérique
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Achetez. Vendez. Sécurisez.
              </span>
            </Link>
          </div>
        </div>
        
        {/* Copyright */}
        <div 
          className="border-t pt-6" 
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              © {new Date().getFullYear()} {CONFIG.companyName}. Tous droits réservés.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {CONFIG.email}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
