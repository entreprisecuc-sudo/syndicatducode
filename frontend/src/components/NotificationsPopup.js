/**
 * Composant Notifications Popup
 * Affiche les notifications personnelles en popup à la connexion
 */

import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle, Info, Bell } from "lucide-react";
import api from "@/services/api";

/**
 * Icône selon le type de notification
 */
const NotificationIcon = ({ type }) => {
  const icons = {
    book_rejected: { icon: AlertTriangle, color: "#ef4444", bg: "#ef444420" },
    book_approved: { icon: CheckCircle, color: "#10b981", bg: "#10b98120" },
    message_received: { icon: Bell, color: "#3b82f6", bg: "#3b82f620" },
    default: { icon: Info, color: "#6366f1", bg: "#6366f120" }
  };

  const config = icons[type] || icons.default;
  const Icon = config.icon;

  return (
    <div 
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: config.bg }}
    >
      <Icon size={24} style={{ color: config.color }} />
    </div>
  );
};

/**
 * Modal de notification individuelle
 */
const NotificationModal = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onDismiss} />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200"
        style={{ background: "#16213e" }}
      >
        {/* Header coloré selon le type */}
        <div 
          className="p-4"
          style={{ 
            background: notification.type === "book_rejected" ? "#ef444420" : "#6366f120",
            borderBottom: `1px solid ${notification.type === "book_rejected" ? "#ef4444" : "#6366f1"}40`
          }}
        >
          <div className="flex items-start gap-4">
            <NotificationIcon type={notification.type} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg">
                {notification.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(notification.created_at)}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-5">
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {notification.message}
          </p>

          {/* Données supplémentaires si présentes */}
          {notification.data?.project_title && (
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ background: "#1a1a2e" }}
            >
              <p className="text-xs text-gray-500 mb-1">Projet concerné</p>
              <p className="text-sm text-white font-medium">
                {notification.data.project_title}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-4 flex justify-end"
          style={{ borderTop: "1px solid #1f4068" }}
        >
          <button
            onClick={onDismiss}
            className="px-6 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ background: "#e94560" }}
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Provider de notifications - à intégrer dans le layout
 */
const NotificationsPopup = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPopupNotifications();
  }, []);

  const fetchPopupNotifications = async () => {
    try {
      const response = await api.get('/notifications/popup');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      // Silently fail - pas critique
      console.error("Erreur chargement notifications:", err);
    }
  };

  const handleDismiss = async () => {
    const current = notifications[currentIndex];
    if (current) {
      try {
        await api.put(`/notifications/popup/${current.id}/dismiss`,  {});
      } catch (err) {
        console.error("Erreur dismiss notification:", err);
      }
    }

    // Passer à la suivante ou fermer
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setNotifications([]);
    }
  };

  const currentNotification = notifications[currentIndex];

  if (!currentNotification) return null;

  return (
    <NotificationModal
      notification={currentNotification}
      onDismiss={handleDismiss}
    />
  );
};

export default NotificationsPopup;
