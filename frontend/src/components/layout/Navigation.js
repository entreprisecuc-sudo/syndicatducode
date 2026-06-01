/**
 * Composant de navigation principal
 * Inclut la version desktop et mobile
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { X, LogIn, Shield, ExternalLink } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { CONFIG, NAV_LINKS, CITADELLE_URL } from "@/config/constants";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openModal } = useModal();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Détecte le scroll pour changer le style de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Gère le scroll vers une ancre après navigation
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  // Gère la navigation vers une ancre
  const handleAnchorClick = (e, href) => {
    e.preventDefault();
    
    // Si on est déjà sur la page d'accueil
    if (location.pathname === "/") {
      const anchor = href.replace("/", "");
      const element = document.querySelector(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Sinon, naviguer vers la page d'accueil avec l'ancre
      navigate(href);
    }
    
    setMobileOpen(false);
  };

  // Gère l'ouverture du modal depuis le menu mobile
  const handleMobileModalOpen = () => {
    openModal();
    setMobileOpen(false);
  };

  return (
    <>
      {/* Navigation Desktop */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`} data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <a href="/" className="logo" data-testid="logo">
            <img 
              src={CONFIG.logo} 
              alt={CONFIG.companyName} 
              className="h-32 md:h-44" 
            />
          </a>
          
          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              link.isRoute ? (
                <Link 
                  key={link.href} 
                  to={link.href} 
                  className="nav-link" 
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.label}
                </Link>
              ) : (
                <a 
                  key={link.href} 
                  href={link.href} 
                  className="nav-link" 
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                >
                  {link.label}
                </a>
              )
            ))}
            {/* Lien vers La Citadelle Numérique */}
            <a
              href={CITADELLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{ border: "1px solid #C9A45C", color: "#C9A45C", background: "transparent" }}
              data-testid="nav-citadelle"
            >
              <Shield size={15} />
              La Citadelle
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </a>

            <button 
              onClick={openModal} 
              className="btn-primary" 
              data-testid="nav-cta"
            >
              Devis gratuit
            </button>
            {isAuthenticated ? (
              <Link 
                to={user?.role === "admin" ? "/syndicat-admin" : user?.role === "commercial" ? "/espace-commercial" : "/espace-developpeur"}
                className="btn-secondary inline-flex items-center gap-2"
                data-testid="nav-espace"
              >
                Mon espace
              </Link>
            ) : (
              <Link 
                to="/connexion" 
                className="btn-secondary inline-flex items-center gap-2"
                data-testid="nav-login"
              >
                <LogIn size={18} />
                Connexion
              </Link>
            )}
          </div>

          {/* Bouton Hamburger Mobile */}
          <button 
            className={`hamburger md:hidden ${mobileOpen ? "open" : ""}`} 
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-toggle"
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Menu Mobile */}
      <div 
        className={`mobile-menu ${mobileOpen ? "open" : ""}`} 
        data-testid="mobile-menu"
      >
        <button 
          className="absolute top-6 right-6"
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-menu-close"
          style={{ color: 'var(--text-primary)' }}
        >
          <X size={32} />
        </button>
        
        {NAV_LINKS.map((link) => (
          link.isRoute ? (
            <Link 
              key={link.href} 
              to={link.href} 
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ) : (
            <a 
              key={link.href} 
              href={link.href} 
              className="mobile-nav-link"
              onClick={(e) => handleAnchorClick(e, link.href)}
            >
              {link.label}
            </a>
          )
        ))}
        
        <button 
          onClick={handleMobileModalOpen} 
          className="btn-primary"
        >
          Devis gratuit
        </button>

        {/* Lien vers La Citadelle Numérique — Menu Mobile */}
        <a
          href={CITADELLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold justify-center transition-all duration-200"
          style={{ border: "1px solid #C9A45C", color: "#C9A45C", background: "transparent" }}
          data-testid="nav-citadelle-mobile"
        >
          <Shield size={15} />
          La Citadelle Numérique
          <ExternalLink size={12} style={{ opacity: 0.7 }} />
        </a>
        {isAuthenticated ? (
          <Link 
            to={user?.role === "admin" ? "/syndicat-admin" : user?.role === "commercial" ? "/espace-commercial" : "/espace-developpeur"}
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            Mon espace
          </Link>
        ) : (
          <Link 
            to="/connexion" 
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <LogIn size={18} />
            Connexion
          </Link>
        )}
      </div>
    </>
  );
};

export default Navigation;
