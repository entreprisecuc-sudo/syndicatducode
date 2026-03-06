/**
 * Composant d'affichage des annonces pour les membres
 * Utilisé dans les dashboards Commercial et Développeur
 */

import { useState, useEffect } from "react";
import { 
  Megaphone, Info, Bell, Calendar, AlertTriangle, 
  Pin, X, ChevronDown, ChevronUp
} from "lucide-react";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des types d'annonces
const TYPE_CONFIG = {
  info: { icon: Info, color: "#3b82f6", bg: "#3b82f620" },
  update: { icon: Bell, color: "#10b981", bg: "#10b98120" },
  event: { icon: Calendar, color: "#8b5cf6", bg: "#8b5cf620" },
  urgent: { icon: AlertTriangle, color: "#ef4444", bg: "#ef444420" }
};

const AnnouncementCard = ({ announcement, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = TYPE_CONFIG[announcement.announcement_type] || TYPE_CONFIG.info;
  const TypeIcon = typeConfig.icon;
  
  // Tronquer le contenu si trop long
  const isLongContent = announcement.content.length > 200;
  const displayContent = expanded || !isLongContent 
    ? announcement.content 
    : announcement.content.slice(0, 200) + "...";

  return (
    <div 
      className="p-4 rounded-xl relative"
      style={{ 
        background: "var(--bg-card)", 
        border: `1px solid var(--border-color)`,
        borderLeft: `4px solid ${typeConfig.color}`
      }}
      data-testid={`member-announcement-${announcement.id}`}
    >
      {/* Bouton fermer */}
      <button
        onClick={() => onDismiss(announcement.id)}
        className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        style={{ color: "var(--text-muted)" }}
        title="Masquer cette annonce"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <div 
          className="p-2 rounded-lg shrink-0"
          style={{ background: typeConfig.bg }}
        >
          <TypeIcon size={18} style={{ color: typeConfig.color }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {announcement.is_pinned && (
              <Pin size={14} className="text-yellow-500 shrink-0" />
            )}
            <h3 
              className="font-semibold text-sm truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {announcement.title}
            </h3>
          </div>
          
          <p 
            className="text-sm mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {displayContent}
          </p>
          
          {/* Bouton voir plus */}
          {isLongContent && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: "var(--sage)" }}
            >
              {expanded ? (
                <>
                  <ChevronUp size={14} />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Voir plus
                </>
              )}
            </button>
          )}
          
          {/* Date */}
          <p 
            className="text-xs mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            {new Date(announcement.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

const AnnouncementsList = ({ maxItems = 5 }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    // Récupérer les annonces masquées du localStorage
    const saved = localStorage.getItem('dismissed_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/announcements/`, {
        headers: getAuthHeaders()
      });
      setAnnouncements(response.data.announcements);
    } catch (err) {
      console.error("Erreur chargement annonces:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (announcementId) => {
    const newDismissed = [...dismissed, announcementId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  // Filtrer les annonces masquées
  const visibleAnnouncements = announcements
    .filter(a => !dismissed.includes(a.id))
    .slice(0, maxItems);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div 
          className="animate-spin rounded-full h-6 w-6 border-b-2" 
          style={{ borderColor: "var(--sage)" }}
        />
      </div>
    );
  }

  if (visibleAnnouncements.length === 0) {
    return null; // Ne rien afficher si pas d'annonces
  }

  return (
    <div className="space-y-4" data-testid="announcements-section">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Megaphone size={20} style={{ color: "var(--sage)" }} />
        <h2 
          className="font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Annonces
        </h2>
        <span 
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "var(--bg-section)", color: "var(--text-muted)" }}
        >
          {visibleAnnouncements.length}
        </span>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {visibleAnnouncements.map((announcement) => (
          <AnnouncementCard 
            key={announcement.id}
            announcement={announcement}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* Lien voir toutes */}
      {announcements.filter(a => !dismissed.includes(a.id)).length > maxItems && (
        <p 
          className="text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          +{announcements.filter(a => !dismissed.includes(a.id)).length - maxItems} autre(s) annonce(s)
        </p>
      )}
    </div>
  );
};

export default AnnouncementsList;
