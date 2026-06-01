/**
 * Page Mes Messages - Espace Développeur
 * Affiche les messages reçus des clients potentiels
 * Requiert un abonnement actif pour lire les messages
 */

import { useState, useEffect } from "react";
import { 
  Mail, Lock, Loader2, Trash2, Eye, X, 
  User, Phone, Calendar, FileText, AlertTriangle, CheckCircle, CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { API_URL } from "@/config/constants";
import api from "@/services/api";

/**
 * Modal de détail d'un message
 */
const MessageDetailModal = ({ message, onClose, onDelete }) => {
  if (!message) return null;

  const projectTypes = {
    site_web: "Site web",
    application: "Application mobile",
    logiciel: "Logiciel / CRM / ERP",
    ecommerce: "E-commerce",
    maintenance: "Maintenance / TMA",
    autre: "Autre"
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 flex items-center justify-between p-4"
          style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
        >
          <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            {message.subject}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Infos expéditeur */}
          <div 
            className="p-4 rounded-lg mb-6"
            style={{ background: "var(--bg-section)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User size={18} style={{ color: "var(--sage)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nom</p>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {message.sender_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail size={18} style={{ color: "var(--sage)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Email</p>
                  <a 
                    href={`mailto:${message.sender_email}`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--sage)" }}
                  >
                    {message.sender_email}
                  </a>
                </div>
              </div>
              
              {message.sender_phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} style={{ color: "var(--sage)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Téléphone</p>
                    <a 
                      href={`tel:${message.sender_phone}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--sage)" }}
                    >
                      {message.sender_phone}
                    </a>
                  </div>
                </div>
              )}
              
              {message.project_type && (
                <div className="flex items-center gap-3">
                  <FileText size={18} style={{ color: "var(--sage)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Type de projet</p>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {projectTypes[message.project_type] || message.project_type}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            <Calendar size={14} />
            Reçu le {formatDate(message.created_at)}
          </div>

          {/* Message */}
          <div 
            className="p-4 rounded-lg whitespace-pre-wrap"
            style={{ background: "var(--bg-section)", color: "var(--text-secondary)" }}
          >
            {message.content}
          </div>
        </div>

        {/* Actions */}
        <div 
          className="sticky bottom-0 flex items-center justify-between p-4"
          style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)" }}
        >
          <a
            href={`mailto:${message.sender_email}?subject=Re: ${message.subject}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Mail size={16} />
            Répondre par email
          </a>
          
          <button
            onClick={() => onDelete(message.id)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Carte de message (aperçu)
 */
const MessageCard = ({ message, canRead, onView, onDelete }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // Moins de 24h
    if (diff < 86400000) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    // Moins d'une semaine
    if (diff < 604800000) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    }
    // Plus ancien
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div 
      className={`p-4 rounded-xl transition-colors ${!message.is_read ? "border-l-4" : ""}`}
      style={{ 
        background: "var(--bg-card)", 
        border: "1px solid var(--border-color)",
        borderLeftColor: !message.is_read ? "var(--sage)" : "var(--border-color)"
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* En-tête */}
          <div className="flex items-center gap-2 mb-1">
            <span 
              className={`font-medium truncate ${!message.is_read ? "" : ""}`}
              style={{ color: "var(--text-primary)" }}
            >
              {message.sender_name}
            </span>
            {!message.is_read && (
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: "var(--sage)" }}
              />
            )}
          </div>
          
          {/* Sujet */}
          <p 
            className="text-sm font-medium truncate mb-1"
            style={{ color: canRead ? "var(--text-secondary)" : "var(--text-muted)" }}
          >
            {message.subject}
          </p>
          
          {/* Aperçu ou message verrouillé */}
          {canRead && message.content ? (
            <p 
              className="text-sm truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {message.content.substring(0, 100)}...
            </p>
          ) : (
            <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
              <Lock size={12} />
              <span>Message verrouillé</span>
            </div>
          )}
        </div>

        {/* Actions et date */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
            {formatDate(message.created_at)}
          </span>
          
          <div className="flex items-center gap-1">
            {canRead ? (
              <>
                <button
                  onClick={() => onView(message)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: "var(--sage)" }}
                  title="Voir le message"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <Lock size={16} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Bannière d'avertissement (abonnement requis)
 */
const SubscriptionBanner = ({ reason }) => (
  <div 
    className="p-4 rounded-xl mb-6 flex items-start gap-4"
    style={{ background: "#fef3c7", border: "1px solid #f59e0b" }}
  >
    <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h3 className="font-semibold text-amber-800 mb-1">
        Accès limité
      </h3>
      <p className="text-sm text-amber-700 mb-3">
        {reason || "Votre abonnement n'est pas actif. Vous pouvez voir vos messages mais pas leur contenu."}
      </p>
      <Link
        to="/espace-developpeur/abonnement"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
      >
        <CreditCard size={16} />
        Gérer mon abonnement
      </Link>
    </div>
  </div>
);

/**
 * Page principale des messages
 */
const DeveloperMessages = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, can_read: true });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [messagesRes, statsRes] = await Promise.all([
        api.get('/messages/my'),
        api.get('/messages/stats')
      ]);
      
      setMessages(messagesRes.data.messages || []);
      setStats({
        total: statsRes.data.total || 0,
        unread: statsRes.data.unread || 0,
        can_read: statsRes.data.can_read,
        reason: statsRes.data.reason
      });
    } catch (err) {
      console.error("Erreur chargement messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    if (!stats.can_read) return;
    
    try {
      const response = await api.get(
        `/messages/my/${message.id}`
      );
      setSelectedMessage(response.data);
      
      // Mettre à jour la liste (marquer comme lu)
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_read: true } : m
      ));
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'ouverture du message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    
    try {
      await api.delete(
        `/messages/my/${messageId}`
      );
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      setSelectedMessage(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <DashboardLayout>
      {/* Titre */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Mes messages
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Messages reçus de clients potentiels
          </p>
        </div>
        
        {stats.total > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "var(--sage)" }}>
              {stats.unread}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              non lu{stats.unread > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Bannière si accès limité */}
      {!stats.can_read && stats.total > 0 && (
        <SubscriptionBanner reason={stats.reason} />
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--sage)" }} />
        </div>
      ) : messages.length === 0 ? (
        <div 
          className="text-center py-12 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <Mail size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Aucun message
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Les messages de clients potentiels apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              canRead={stats.can_read}
              onView={handleViewMessage}
              onDelete={handleDeleteMessage}
            />
          ))}
        </div>
      )}

      {/* Modal de détail */}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onDelete={handleDeleteMessage}
        />
      )}
    </DashboardLayout>
  );
};

export default DeveloperMessages;
