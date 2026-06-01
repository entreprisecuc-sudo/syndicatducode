/**
 * Gestion des alertes/popups - Admin
 * CRUD complet pour les alertes et bannières
 */

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import AlertList from "@/components/admin/alerts/AlertList";
import AlertForm from "@/components/admin/alerts/AlertForm";

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alerts/admin');
      setAlerts(response.data.alerts);
    } catch (err) {
      setError("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAlert(null);
    setShowModal(true);
  };

  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setShowModal(true);
  };

  const handleSave = async (data) => {
    if (editingAlert) {
      await api.put(`/alerts/admin/${editingAlert.id}`, data);
    } else {
      await api.post('/alerts/admin', data);
    }
    fetchAlerts();
  };

  const toggleActive = async (alertItem) => {
    try {
      await api.put(`/alerts/admin/${alertItem.id}`, { is_active: !alertItem.is_active });
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette alerte ?")) return;
    try {
      await api.delete(`/alerts/admin/${alertId}`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 className="text-xl font-bold mb-6 lg:hidden text-white">Alertes</h1>

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
          { label: "Total",     value: alerts.length,                                         color: "#6b7280" },
          { label: "Actives",   value: alerts.filter(a => a.is_active).length,                color: "#10b981" },
          { label: "Popups",    value: alerts.filter(a => a.alert_type === "popup").length,   color: "#8b5cf6" },
          { label: "Bannières", value: alerts.filter(a => a.alert_type === "banner").length,  color: "#3b82f6" }
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
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">{error}</div>
      ) : (
        <AlertList
          alerts={alerts}
          onToggleActive={toggleActive}
          onEdit={openEditModal}
          onDelete={deleteAlert}
          onCreateFirst={openCreateModal}
        />
      )}

      {/* Modal création/édition */}
      <AlertForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingAlert={editingAlert}
        onSave={handleSave}
      />
    </AdminLayout>
  );
};

export default AdminAlerts;
