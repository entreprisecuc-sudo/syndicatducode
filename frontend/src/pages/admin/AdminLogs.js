/**
 * Historique des actions admin - Logs
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { History, Shield, User, Eye, Edit, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

// Configuration des actions
const ACTION_CONFIG = {
  VIEW_USERS: { label: "Consultation utilisateurs", icon: Eye, color: "#3b82f6" },
  VIEW_USER_DETAIL: { label: "Consultation profil", icon: User, color: "#6366f1" },
  VIEW_USER_FULL_DETAIL: { label: "Consultation détail complet", icon: User, color: "#8b5cf6" },
  VIEW_STATS: { label: "Consultation stats", icon: Eye, color: "#8b5cf6" },
  UPDATE_USER_STATUS: { label: "Modification statut", icon: Edit, color: "#f59e0b" },
  UPDATE_USER_ROLE: { label: "Modification rôle", icon: Edit, color: "#ef4444" },
  UPDATE_CONTACT_STATUS: { label: "Modification contact", icon: Edit, color: "#10b981" }
};

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/logs?limit=100');
      setLogs(response.data.logs);
    } catch (err) {
      setError("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Historique
      </h1>

      {/* Header */}
      <div 
        className="p-4 rounded-xl mb-6 flex items-center justify-between transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <div>
          <h2 
            className="font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            Journal des actions administratives
          </h2>
          <p 
            className="text-sm"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            Traçabilité complète des actions admin
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ 
            background: "var(--admin-bg-section)", 
            color: "var(--admin-text-secondary)" 
          }}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Liste des logs */}
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
      ) : logs.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <History size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
          <p style={{ color: "var(--admin-text-secondary)" }}>Aucune action enregistrée</p>
        </div>
      ) : (
        <div 
          className="rounded-xl overflow-hidden transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--admin-bg-section)" }}>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium uppercase"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Date
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium uppercase"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Action
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium uppercase"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const actionConfig = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    icon: History,
                    color: "#6b7280"
                  };
                  const ActionIcon = actionConfig.icon;
                  
                  return (
                    <tr 
                      key={index} 
                      className="transition-colors hover:opacity-80"
                      style={{ borderTop: "1px solid var(--admin-border)" }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span 
                          className="text-sm"
                          style={{ color: "var(--admin-text-secondary)" }}
                        >
                          {formatDate(log.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center gap-2 text-sm"
                          style={{ color: actionConfig.color }}
                        >
                          <ActionIcon size={14} />
                          {actionConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="text-sm"
                          style={{ color: "var(--admin-text-secondary)" }}
                        >
                          {log.details}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compteur */}
      <p 
        className="text-center text-sm mt-4"
        style={{ color: "var(--admin-text-muted)" }}
      >
        {logs.length} entrée(s) dans le journal
      </p>
    </AdminLayout>
  );
};

export default AdminLogs;
