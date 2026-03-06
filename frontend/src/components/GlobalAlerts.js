/**
 * Composant global d'alertes pour les membres
 * Affiche les bannières en haut de page et les popups au centre
 */

import { useState, useEffect } from "react";
import { 
  X, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink
} from "lucide-react";
import { getAuthHeaders, getToken } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des styles
const STYLE_CONFIG = {
  info: { 
    icon: Info, 
    bgBanner: "bg-blue-500/10 border-blue-500/30",
    bgPopup: "bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500"
  },
  success: { 
    icon: CheckCircle, 
    bgBanner: "bg-green-500/10 border-green-500/30",
    bgPopup: "bg-green-500",
    text: "text-green-400",
    border: "border-green-500"
  },
  warning: { 
    icon: AlertTriangle, 
    bgBanner: "bg-yellow-500/10 border-yellow-500/30",
    bgPopup: "bg-yellow-500",
    text: "text-yellow-400",
    border: "border-yellow-500"
  },
  danger: { 
    icon: XCircle, 
    bgBanner: "bg-red-500/10 border-red-500/30",
    bgPopup: "bg-red-500",
    text: "text-red-400",
    border: "border-red-500"
  }
};

// Composant Bannière
const AlertBanner = ({ alert, onDismiss }) => {
  const styleConfig = STYLE_CONFIG[alert.style] || STYLE_CONFIG.info;
  const Icon = styleConfig.icon;

  return (
    <div 
      className={`px-4 py-3 border-b ${styleConfig.bgBanner} flex items-center justify-between gap-4`}
      data-testid={`alert-banner-${alert.id}`}
    >
      <div className="flex items-center gap-3 flex-1">
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

// Composant Popup
const AlertPopup = ({ alert, onDismiss }) => {
  const styleConfig = STYLE_CONFIG[alert.style] || STYLE_CONFIG.info;
  const Icon = styleConfig.icon;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      data-testid={`alert-popup-${alert.id}`}
    >
      <div 
        className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl`}
        style={{ background: "#16213e" }}
      >
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
const GlobalAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    const saved = localStorage.getItem('dismissed_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchAlerts = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/alerts/`, {
        headers: getAuthHeaders()
      });
      setAlerts(response.data.alerts);
    } catch (err) {
      console.error("Erreur chargement alertes:", err);
    }
  };

  useEffect(() => {
    // Fetch initial si token présent
    fetchAlerts();

    // Polling léger pour détecter les connexions
    const interval = setInterval(() => {
      const token = getToken();
      if (token && alerts.length === 0) {
        fetchAlerts();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  const handleDismiss = async (alertId) => {
    // Mettre à jour localement
    const newDismissed = [...dismissed, alertId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_alerts', JSON.stringify(newDismissed));
    
    // Notifier le serveur
    try {
      await axios.post(`${API_URL}/alerts/${alertId}/dismiss`, {}, {
        headers: getAuthHeaders()
      });
    } catch (err) {
      // Silencieux
    }
  };

  // Filtrer les alertes déjà fermées
  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  
  // Séparer bannières et popups
  const banners = visibleAlerts.filter(a => a.alert_type === "banner");
  const popups = visibleAlerts.filter(a => a.alert_type === "popup");
  
  // Afficher un seul popup à la fois (le plus récent)
  const activePopup = popups.length > 0 ? popups[0] : null;

  return (
    <>
      {/* Bannières en haut */}
      {banners.length > 0 && (
        <div className="sticky top-0 z-40">
          {banners.map(alert => (
            <AlertBanner 
              key={alert.id} 
              alert={alert} 
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
      
      {/* Popup modal */}
      {activePopup && (
        <AlertPopup 
          alert={activePopup} 
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
};

export default GlobalAlerts;
