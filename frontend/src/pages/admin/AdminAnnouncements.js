/**
 * Gestion des annonces - Admin
 * CRUD complet pour les annonces / actualités
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { 
  Megaphone, Plus, Edit, Trash2, Eye, Pin, PinOff,
  Bell, AlertTriangle, Info, Calendar
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des types d'annonces
const TYPE_CONFIG = {
  info: { label: "Information", icon: Info, color: "#3b82f6", bg: "#3b82f620" },
  update: { label: "Mise à jour", icon: Bell, color: "#10b981", bg: "#10b98120" },
  event: { label: "Événement", icon: Calendar, color: "#8b5cf6", bg: "#8b5cf620" },
  urgent: { label: "Urgent", icon: AlertTriangle, color: "#ef4444", bg: "#ef444420" }
};

// Configuration des cibles
const TARGET_CONFIG = {
  all: { label: "Tous les membres", color: "#6b7280" },
  developer: { label: "Développeurs", color: "#8b5cf6" },
  commercial: { label: "Commerciaux", color: "#f59e0b" }
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal création/édition
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    announcement_type: "info",
    target: "all",
    is_pinned: false
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/announcements/admin`, {
        headers: getAuthHeaders()
      });
      setAnnouncements(response.data.announcements);
    } catch (err) {
      setError("Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      announcement_type: "info",
      target: "all",
      is_pinned: false
    });
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcement_type: announcement.announcement_type,
      target: announcement.target,
      is_pinned: announcement.is_pinned
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingAnnouncement) {
        await axios.put(
          `${API_URL}/announcements/admin/${editingAnnouncement.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${API_URL}/announcements/admin`,
          formData,
          { headers: getAuthHeaders() }
        );
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setFormLoading(false);
    }
  };

  const togglePin = async (announcement) => {
    try {
      await axios.put(
        `${API_URL}/announcements/admin/${announcement.id}`,
        { is_pinned: !announcement.is_pinned },
        { headers: getAuthHeaders() }
      );
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const togglePublish = async (announcement) => {
    try {
      await axios.put(
        `${API_URL}/announcements/admin/${announcement.id}`,
        { is_published: !announcement.is_published },
        { headers: getAuthHeaders() }
      );
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;
    
    try {
      await axios.delete(`${API_URL}/announcements/admin/${announcementId}`, {
        headers: getAuthHeaders()
      });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Annonces
      </h1>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 style={{ color: "var(--admin-text)" }} className="font-semibold">Annonces & Actualités</h2>
          <p style={{ color: "var(--admin-text-secondary)" }} className="text-sm">Publiez des annonces pour les membres</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors inline-flex items-center gap-2"
          style={{ background: "var(--admin-accent)" }}
          data-testid="create-announcement-btn"
        >
          <Plus size={18} />
          Nouvelle annonce
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: announcements.length, color: "#6b7280" },
          { label: "Épinglées", value: announcements.filter(a => a.is_pinned).length, color: "#f59e0b" },
          { label: "Publiées", value: announcements.filter(a => a.is_published).length, color: "#10b981" },
          { label: "Brouillons", value: announcements.filter(a => !a.is_published).length, color: "#ef4444" }
        ].map((stat) => (
          <div 
            key={stat.label}
            className="p-4 rounded-xl text-center transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div style={{ color: "var(--admin-text-secondary)" }} className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Liste des annonces */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "var(--admin-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : announcements.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <Megaphone size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
          <p style={{ color: "var(--admin-text-secondary)" }} className="mb-4">Aucune annonce publiée</p>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
            style={{ background: "var(--admin-accent)" }}
          >
            Créer la première annonce
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const typeConfig = TYPE_CONFIG[announcement.announcement_type] || TYPE_CONFIG.info;
            const targetConfig = TARGET_CONFIG[announcement.target] || TARGET_CONFIG.all;
            const TypeIcon = typeConfig.icon;
            
            return (
              <div 
                key={announcement.id}
                className={`p-5 rounded-xl transition-colors duration-300 ${!announcement.is_published ? 'opacity-60' : ''}`}
                style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
                data-testid={`announcement-${announcement.id}`}
              >
                {/* Header annonce */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {/* Icône épinglée */}
                      {announcement.is_pinned && (
                        <Pin size={16} className="text-yellow-500" />
                      )}
                      
                      <h3 style={{ color: "var(--admin-text)" }} className="font-semibold text-lg">{announcement.title}</h3>
                      
                      {/* Badge type */}
                      <span 
                        className="px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
                        style={{ background: typeConfig.bg, color: typeConfig.color }}
                      >
                        <TypeIcon size={12} />
                        {typeConfig.label}
                      </span>
                      
                      {/* Badge cible */}
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ color: targetConfig.color }}
                      >
                        {targetConfig.label}
                      </span>
                      
                      {/* Badge non publié */}
                      {!announcement.is_published && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-300">
                          Brouillon
                        </span>
                      )}
                    </div>
                    
                    <p style={{ color: "var(--admin-text-secondary)" }} className="text-sm mb-3 line-clamp-2">
                      {announcement.content}
                    </p>
                    
                    {/* Infos */}
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--admin-text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {announcement.view_count} vue(s)
                      </span>
                      <span>
                        Créée le {new Date(announcement.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Toggle épinglé */}
                    <button
                      onClick={() => togglePin(announcement)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.is_pinned 
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                      title={announcement.is_pinned ? "Désépingler" : "Épingler"}
                    >
                      {announcement.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    
                    {/* Toggle publié */}
                    <button
                      onClick={() => togglePublish(announcement)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.is_published 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                      title={announcement.is_published ? "Dépublier" : "Publier"}
                    >
                      <Eye size={16} />
                    </button>
                    
                    {/* Modifier */}
                    <button
                      onClick={() => openEditModal(announcement)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    
                    {/* Supprimer */}
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)" }}
          >
            <h2 style={{ color: "var(--admin-text)" }} className="text-xl font-bold mb-6">
              {editingAnnouncement ? "Modifier l'annonce" : "Nouvelle annonce"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Titre */}
              <div className="mb-4">
                <label style={{ color: "var(--admin-text-secondary)" }} className="block text-sm font-medium mb-2">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: Bienvenue sur le nouvel espace membre"
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
              </div>
              
              {/* Contenu */}
              <div className="mb-4">
                <label style={{ color: "var(--admin-text-secondary)" }} className="block text-sm font-medium mb-2">
                  Contenu *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={5}
                  placeholder="Rédigez le contenu de votre annonce..."
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
              </div>
              
              {/* Type d'annonce */}
              <div className="mb-4">
                <label style={{ color: "var(--admin-text-secondary)" }} className="block text-sm font-medium mb-2">
                  Type d'annonce *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.announcement_type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, announcement_type: key })}
                        className="p-3 rounded-lg border transition-colors flex flex-col items-center gap-2"
                        style={{
                          borderColor: isSelected ? "var(--admin-accent)" : "var(--admin-border)",
                          background: isSelected ? "rgba(233, 69, 96, 0.2)" : "var(--admin-bg-section)"
                        }}
                      >
                        <Icon size={20} style={{ color: config.color }} />
                        <span 
                          className="text-xs"
                          style={{ color: isSelected ? "var(--admin-text)" : "var(--admin-text-secondary)" }}
                        >
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Cible */}
              <div className="mb-4">
                <label style={{ color: "var(--admin-text-secondary)" }} className="block text-sm font-medium mb-2">
                  Destinataires *
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  required
                  className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                >
                  <option value="all">Tous les membres</option>
                  <option value="developer">Développeurs uniquement</option>
                  <option value="commercial">Commerciaux uniquement</option>
                </select>
              </div>
              
              {/* Épinglé */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: "var(--admin-accent)" }}
                  />
                  <span style={{ color: "var(--admin-text-secondary)" }}>
                    Épingler cette annonce (s'affiche en premier)
                  </span>
                </label>
              </div>
              
              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                  style={{ background: "var(--admin-accent)" }}
                >
                  {formLoading ? "Enregistrement..." : editingAnnouncement ? "Mettre à jour" : "Publier l'annonce"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnnouncements;
