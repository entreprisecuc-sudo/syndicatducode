/**
 * Composant de navigation principal
 * Inclut la version desktop et mobile
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, LogIn } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { CONFIG, NAV_LINKS } from "@/config/constants";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openModal } = useModal();
  const { isAuthenticated, user } = useAuth();

  // Détecte le scroll pour changer le style de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              <a 
                key={link.href} 
                href={link.href} 
                className="nav-link" 
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </a>
            ))}
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
                to="/login" 
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
          <a 
            key={link.href} 
            href={link.href} 
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        
        <button 
          onClick={handleMobileModalOpen} 
          className="btn-primary"
        >
          Devis gratuit
        </button>
      </div>
    </>
  );
};

export default Navigation;
