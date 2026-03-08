/**
 * Composant d'alertes pour le site public
 * Affiche les bannières et popups pour les visiteurs non connectés
 */

import { useState, useEffect } from "react";
import { 
  X, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink
} from "lucide-react";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des styles
const STYLE_CONFIG = {
  info: { 
    icon: Info, 
    bgBanner: "bg-blue-500/10 border-blue-500/30",
    bgPopup: "bg-blue-500",
    text: "text-blue-400",
  },
  success: { 
    icon: CheckCircle, 
    bgBanner: "bg-green-500/10 border-green-500/30",
    bgPopup: "bg-green-500",
    text: "text-green-400",
  },
  warning: { 
    icon: AlertTriangle, 
    bgBanner: "bg-yellow-500/10 border-yellow-500/30",
    bgPopup: "bg-yellow-500",
    text: "text-yellow-400",
  },
  danger: { 
    icon: XCircle, 
    bgBanner: "bg-red-500/10 border-red-500/30",
    bgPopup: "bg-red-500",
    text: "text-red-400",
  }
};

// Composant Bannière publique
const PublicBanner = ({ alert, onDismiss }) => {
  const styleConfig = STYLE_CONFIG[alert.style] || STYLE_CONFIG.info;
  const Icon = styleConfig.icon;

  return (
    <div 
      className={`px-4 py-3 border-b ${styleConfig.bgBanner} flex items-center justify-between gap-4`}
      data-testid={`public-banner-${alert.id}`}
    >
      <div className="flex items-center gap-3 flex-1 max-w-7xl mx-auto">
        {alert.image_url ? (
          <img 
            src={alert.image_url} 
            alt="" 
            className="w-8 h-8 rounded object-cover"
          />
        ) : (
          <Icon size={20} className={styleConfig.text} />
        )}
        <div className="flex-1">
          <span className={`font-medium ${styleConfig.text}`}>{alert.title}</span>
          <span className="text-gray-300 ml-2">{alert.message}</span>
          {alert.link_url && (
            <a 
              href={alert.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`ml-2 inline-flex items-center gap-1 ${styleConfig.text} hover:underline`}
            >
              {alert.link_text || "En savoir plus"}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
      {alert.dismissible && (
        <button 
          onClick={() => onDismiss(alert.id)}
          className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

// Composant Popup public
const PublicPopup = ({ alert, onDismiss }) => {
  const styleConfig = STYLE_CONFIG[alert.style] || STYLE_CONFIG.info;
  const Icon = styleConfig.icon;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      data-testid={`public-popup-${alert.id}`}
    >
      <div 
        className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "#16213e" }}
      >
        {/* Image si présente */}
        {alert.image_url && (
          <div className="w-full">
            <img 
              src={alert.image_url} 
              alt="" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        {/* Header coloré */}
        <div className={`${styleConfig.bgPopup} px-5 py-4 flex items-center gap-3`}>
          <Icon size={24} className="text-white" />
          <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
        </div>
        
        {/* Contenu */}
        <div className="p-5">
          <p className="text-gray-300 mb-4">{alert.message}</p>
          
          {alert.link_url && (
            <a 
              href={alert.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
            >
              {alert.link_text || "En savoir plus"}
              <ExternalLink size={16} />
            </a>
          )}
          
          {/* Bouton fermer */}
          {alert.dismissible && (
            <button 
              onClick={() => onDismiss(alert.id)}
              className="w-full py-2.5 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-500 transition-colors"
            >
              J'ai compris
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal
const PublicAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    const saved = localStorage.getItem('dismissed_public_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_URL}/alerts/public`);
      setAlerts(response.data.alerts);
    } catch (err) {
      // Silencieux - pas d'alertes publiques
    }
  };

  const handleDismiss = (alertId) => {
    const newDismissed = [...dismissed, alertId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_public_alerts', JSON.stringify(newDismissed));
  };

  // Filtrer les alertes déjà fermées
  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  
  // Séparer bannières et popups
  const banners = visibleAlerts.filter(a => a.alert_type === "banner");
  const popups = visibleAlerts.filter(a => a.alert_type === "popup");
  
  // Afficher un seul popup à la fois (le plus récent)
  const activePopup = popups.length > 0 ? popups[0] : null;

  if (visibleAlerts.length === 0) return null;

  return (
    <>
      {/* Bannières en haut */}
      {banners.length > 0 && (
        <div className="sticky top-0 z-40">
          {banners.map(alert => (
            <PublicBanner 
              key={alert.id} 
              alert={alert} 
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
      
      {/* Popup modal */}
      {activePopup && (
        <PublicPopup 
          alert={activePopup} 
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
};

export default PublicAlerts;
