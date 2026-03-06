/**
 * Composant Footer
 * Pied de page avec navigation et mentions légales
 * Boutons de test pour connexion rapide aux différents espaces
 */

import { useNavigate } from "react-router-dom";
import { Shield, Code, Briefcase } from "lucide-react";
import { CONFIG, API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

// Identifiants de test pour chaque espace
const TEST_ACCOUNTS = {
  admin: {
    email: "admin@syndicatducode.fr",
    password: "AdminSyndicat2025!",
    redirect: "/syndicat-admin"
  },
  developer: {
    email: "test@syndicatducode.fr",
    password: "TestPassword123!",
    redirect: "/espace-developpeur"
  },
  commercial: {
    email: "commercial1772755291@test.com",
    password: "TestPassword123!",
    redirect: "/espace-commercial"
  }
};

const Footer = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Connexion automatique et redirection
  const handleQuickLogin = async (accountType) => {
    const account = TEST_ACCOUNTS[accountType];
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      const { access_token, user } = response.data;
      
      // Sauvegarder le token et l'utilisateur
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Mettre à jour le contexte
      login(access_token, user);
      
      // Rediriger vers l'espace approprié
      navigate(account.redirect);
      
    } catch (error) {
      console.error("Erreur de connexion:", error);
      alert("Erreur de connexion. Vérifiez les identifiants de test.");
    }
  };

  return (
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
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="mr-2">
                {CONFIG.email}
              </p>
              <button 
                onClick={() => handleQuickLogin('admin')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90 cursor-pointer"
                style={{ background: '#dc2626', color: 'white' }}
              >
                <Shield size={14} />
                Admin
              </button>
              <button 
                onClick={() => handleQuickLogin('developer')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90 cursor-pointer"
                style={{ background: '#8b5cf6', color: 'white' }}
              >
                <Code size={14} />
                Espace Dev
              </button>
              <button 
                onClick={() => handleQuickLogin('commercial')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90 cursor-pointer"
                style={{ background: '#f59e0b', color: 'white' }}
              >
                <Briefcase size={14} />
                Espace Commercial
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
