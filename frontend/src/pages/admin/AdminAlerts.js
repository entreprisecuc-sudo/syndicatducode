/**
 * Gestion des alertes/popups - Admin
 * CRUD complet pour les alertes et bannières
 */

import { useState, useEffect } from "react";
import { 
  Bell, Plus, Edit, Trash2, Eye, EyeOff,
  AlertTriangle, Info, CheckCircle, XCircle,
  MessageSquare, ExternalLink
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des types d'alertes
const TYPE_CONFIG = {
  popup: { label: "Popup", icon: MessageSquare },
  banner: { label: "Bannière", icon: Bell }
};

// Configuration des styles
const STYLE_CONFIG = {
  info: { label: "Information", color: "#3b82f6", bg: "#3b82f620", icon: Info },
  success: { label: "Succès", color: "#10b981", bg: "#10b98120", icon: CheckCircle },
  warning: { label: "Avertissement", color: "#f59e0b", bg: "#f59e0b20", icon: AlertTriangle },
  danger: { label: "Urgent", color: "#ef4444", bg: "#ef444420", icon: XCircle }
};

// Configuration des cibles
const TARGET_CONFIG = {
  all: { label: "Tous les membres", color: "#6b7280" },
  developer: { label: "Développeurs", color: "#8b5cf6" },
  commercial: { label: "Commerciaux", color: "#f59e0b" }
};

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal création/édition
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    alert_type: "banner",
    style: "info",
    target: "all",
    image_url: "",
    link_url: "",
    link_text: "",
    dismissible: true
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/alerts/admin`, {
        headers: getAuthHeaders()
      });
      setAlerts(response.data.alerts);
    } catch (err) {
      setError("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAlert(null);
    setFormData({
      title: "",
      message: "",
      alert_type: "banner",
      style: "info",
      target: "all",
      image_url: "",
      link_url: "",
      link_text: "",
      dismissible: true
    });
    setShowModal(true);
  };

  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      message: alert.message,
      alert_type: alert.alert_type,
      style: alert.style,
      target: alert.target,
      image_url: alert.image_url || "",
      link_url: alert.link_url || "",
      link_text: alert.link_text || "",
      dismissible: alert.dismissible
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Nettoyer les données
    const dataToSend = {
      ...formData,
      image_url: formData.image_url || null,
      link_url: formData.link_url || null,
      link_text: formData.link_text || null
    };

    try {
      if (editingAlert) {
        await axios.put(
          `${API_URL}/alerts/admin/${editingAlert.id}`,
          dataToSend,
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${API_URL}/alerts/admin`,
          dataToSend,
          { headers: getAuthHeaders() }
        );
      }
      setShowModal(false);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (alertItem) => {
    try {
      await axios.put(
        `${API_URL}/alerts/admin/${alertItem.id}`,
        { is_active: !alertItem.is_active },
        { headers: getAuthHeaders() }
      );
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette alerte ?")) return;
    
    try {
      await axios.delete(`${API_URL}/alerts/admin/${alertId}`, {
        headers: getAuthHeaders()
      });
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 className="text-xl font-bold mb-6 lg:hidden text-white">
        Alertes
      </h1>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-semibold">Alertes & Popups</h2>
          <p className="text-gray-400 text-sm">Créez des alertes et bannières pour les membres</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors inline-flex items-center gap-2"
          data-testid="create-alert-btn"
        >
          <Plus size={18} />
          Nouvelle alerte
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: alerts.length, color: "#6b7280" },
          { label: "Actives", value: alerts.filter(a => a.is_active).length, color: "#10b981" },
          { label: "Popups", value: alerts.filter(a => a.alert_type === "popup").length, color: "#8b5cf6" },
          { label: "Bannières", value: alerts.filter(a => a.alert_type === "banner").length, color: "#3b82f6" }
        ].map((stat) => (
          <div 
            key={stat.label}
            className="p-4 rounded-xl text-center"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Liste des alertes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : alerts.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <Bell size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 mb-4">Aucune alerte créée</p>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            Créer la première alerte
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alertItem) => {
            const typeConfig = TYPE_CONFIG[alertItem.alert_type] || TYPE_CONFIG.banner;
            const styleConfig = STYLE_CONFIG[alertItem.style] || STYLE_CONFIG.info;
            const targetConfig = TARGET_CONFIG[alertItem.target] || TARGET_CONFIG.all;
            const TypeIcon = typeConfig.icon;
            const StyleIcon = styleConfig.icon;
            
            return (
              <div 
                key={alertItem.id}
                className={`p-5 rounded-xl ${!alertItem.is_active ? 'opacity-60' : ''}`}
                style={{ 
                  background: "var(--admin-bg-card)", 
                  border: "1px solid var(--admin-border)",
                  borderLeft: `4px solid ${styleConfig.color}`
                }}
                data-testid={`alert-${alertItem.id}`}
              >
                {/* Header alerte */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-white font-semibold text-lg">{alertItem.title}</h3>
                      
                      {/* Badge type */}
                      <span 
                        className="px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
                        style={{ background: "#1f4068", color: "#fff" }}
                      >
                        <TypeIcon size={12} />
                        {typeConfig.label}
                      </span>
                      
                      {/* Badge style */}
                      <span 
                        className="px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
                        style={{ background: styleConfig.bg, color: styleConfig.color }}
                      >
                        <StyleIcon size={12} />
                        {styleConfig.label}
                      </span>
                      
                      {/* Badge cible */}
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ color: targetConfig.color }}
                      >
                        {targetConfig.label}
                      </span>
                      
                      {/* Badge inactif */}
                      {!alertItem.is_active && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-300">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">
                      {alertItem.message}
                    </p>
                    
                    {/* Lien optionnel */}
                    {alertItem.link_url && (
                      <div className="flex items-center gap-2 text-sm text-blue-400 mb-3">
                        <ExternalLink size={14} />
                        <span>{alertItem.link_text || alertItem.link_url}</span>
                      </div>
                    )}
                    
                    {/* Infos */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span>
                        {alertItem.dismissible ? "Peut être fermée" : "Non fermable"}
                      </span>
                      <span>
                        {alertItem.dismiss_count} fermeture(s)
                      </span>
                      <span>
                        Créée le {new Date(alertItem.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Toggle actif */}
                    <button
                      onClick={() => toggleActive(alertItem)}
                      className={`p-2 rounded-lg transition-colors ${
                        alertItem.is_active 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                      title={alertItem.is_active ? "Désactiver" : "Activer"}
                    >
                      {alertItem.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    
                    {/* Modifier */}
                    <button
                      onClick={() => openEditModal(alertItem)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    
                    {/* Supprimer */}
                    <button
                      onClick={() => deleteAlert(alertItem.id)}
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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6"
            style={{ background: "var(--admin-bg-card)" }}
          >
            <h2 className="text-xl font-bold text-white mb-6">
              {editingAlert ? "Modifier l'alerte" : "Nouvelle alerte"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Titre */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="Ex: Maintenance prévue"
                  className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068] text-white focus:outline-none focus:border-red-500"
                />
              </div>
              
              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Rédigez le message de l'alerte..."
                  className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068] text-white focus:outline-none focus:border-red-500"
                />
              </div>
              
              {/* Type d'alerte */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type d'alerte *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.alert_type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, alert_type: key })}
                        className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                          isSelected 
                            ? 'border-red-500 bg-red-500/20' 
                            : 'border-[#1f4068] bg-[#1a1a2e] hover:border-gray-500'
                        }`}
                      >
                        <Icon size={18} className={isSelected ? 'text-white' : 'text-gray-400'} />
                        <span className={isSelected ? 'text-white' : 'text-gray-400'}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Style */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style visuel *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(STYLE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.style === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, style: key })}
                        className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                          isSelected 
                            ? 'border-red-500 bg-red-500/20' 
                            : 'border-[#1f4068] bg-[#1a1a2e] hover:border-gray-500'
                        }`}
                      >
                        <Icon size={20} style={{ color: config.color }} />
                        <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Cible */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destinataires *
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068] text-white focus:outline-none focus:border-red-500"
                >
                  <option value="all">Tous les membres</option>
                  <option value="developer">Développeurs uniquement</option>
                  <option value="commercial">Commerciaux uniquement</option>
                </select>
              </div>
              
              {/* Image optionnelle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL de l'image (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://exemple.com/image.jpg"
                  className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068] text-white focus:outline-none focus:border-red-500"
                />
                {formData.image_url && (
                  <div className="mt-2 p-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068]">
                    <img 
                      src={formData.image_url} 
                      alt="Aperçu" 
                      className="max-h-32 rounded mx-auto"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>
              
              {/* Lien optionnel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL du lien (optionnel)
                  </label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068] text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texte du lien (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="En savoir plus"
                    className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#1f4068] text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              
              {/* Fermable */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dismissible}
                    onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                    className="w-5 h-5 rounded bg-[#1a1a2e] border-[#1f4068] text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-300">
                    L'utilisateur peut fermer cette alerte
                  </span>
                </label>
              </div>
              
              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  {formLoading ? "Enregistrement..." : editingAlert ? "Mettre à jour" : "Créer l'alerte"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors"
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

export default AdminAlerts;
