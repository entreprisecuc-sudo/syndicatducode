/**
 * Composant Footer
 * Pied de page avec navigation et mentions légales
 */

import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { CONFIG } from "@/config/constants";

const Footer = () => (
  <footer className="footer" data-testid="footer">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
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

export default Footer;
