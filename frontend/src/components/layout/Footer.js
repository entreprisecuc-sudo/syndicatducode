/**
 * Composant Footer
 * Pied de page avec navigation et mentions légales
 * Inclut des boutons de connexion rapide en mode développement
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Code, Briefcase, Loader2 } from "lucide-react";
import { CONFIG, DEV_MODE, TEST_ACCOUNTS, API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { setAuthData } from "@/services/authService";
import api from "@/services/api";

const Footer = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [loading, setLoading] = useState(null);

  // Connexion rapide pour les tests
  const quickLogin = async (accountType) => {
    if (!DEV_MODE || !TEST_ACCOUNTS[accountType]) return;
    
    setLoading(accountType);
    try {
      const account = TEST_ACCOUNTS[accountType];
      const response = await api.post(`/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      // Stocker le token avec le service d'authentification
      setAuthData(response.data.access_token, response.data.user);
      loginUser(response.data.user);
      
      // Redirection selon le rôle
      const redirectPaths = {
        admin: "/syndicat-admin",
        developer: "/espace-developpeur",
        commercial: "/espace-commercial"
      };
      navigate(redirectPaths[accountType] || "/");
    } catch (err) {
      console.error("Erreur connexion rapide:", err);
      alert("Erreur de connexion: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(null);
    }
  };

  return (
    <footer className="footer" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Boutons de test - Uniquement en mode DEV */}
        {DEV_MODE && (
          <div 
            className="mb-8 p-4 rounded-xl"
            style={{ background: "rgba(233, 69, 96, 0.1)", border: "1px dashed #e94560" }}
          >
            <p className="text-xs text-center mb-3" style={{ color: "#e94560" }}>
              ⚠️ MODE DÉVELOPPEMENT - Connexion rapide pour les tests
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => quickLogin("admin")}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "#ef4444", color: "white" }}
                data-testid="quick-login-admin"
              >
                {loading === "admin" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                Admin
              </button>
              
              <button
                onClick={() => quickLogin("developer")}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "#3b82f6", color: "white" }}
                data-testid="quick-login-dev"
              >
                {loading === "developer" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Code size={16} />
                )}
                Espace Dev
              </button>
              
              <button
                onClick={() => quickLogin("commercial")}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "#10b981", color: "white" }}
                data-testid="quick-login-commercial"
              >
                {loading === "commercial" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Briefcase size={16} />
                )}
                Espace Co
              </button>
            </div>
          </div>
        )}

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

          {/* ⚠️ PROVISOIRE — bouton d'accès admin (à RETIRER avant la mise en production) */}
          <div className="mt-6 flex justify-center">
            <Link
              to="/papaenmousse1981"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: "rgba(233, 69, 96, 0.12)", border: "1px dashed #e94560", color: "#e94560", textDecoration: "none" }}
              data-testid="footer-admin-access-provisoire"
            >
              <Shield size={14} />
              Accès Admin (provisoire)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
