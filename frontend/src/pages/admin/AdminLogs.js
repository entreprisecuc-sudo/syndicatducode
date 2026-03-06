/**
 * Historique des actions admin - Logs
 */

import { useState, useEffect } from "react";
import { History, Shield, User, Eye, Edit, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des actions
const ACTION_CONFIG = {
  VIEW_USERS: { label: "Consultation utilisateurs", icon: Eye, color: "#3b82f6" },
  VIEW_USER_DETAIL: { label: "Consultation profil", icon: User, color: "#6366f1" },
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
      const response = await axios.get(`${API_URL}/admin/logs?limit=100`, {
        headers: getAuthHeaders()
      });
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
      <h1 className="text-xl font-bold mb-6 lg:hidden text-white">
        Historique
      </h1>

      {/* Header */}
      <div 
        className="p-4 rounded-xl mb-6 flex items-center justify-between"
        style={{ background: "#16213e", border: "1px solid #1f4068" }}
      >
        <div>
          <h2 className="text-white font-semibold">Journal des actions administratives</h2>
          <p className="text-gray-400 text-sm">Traçabilité complète des actions admin</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-lg bg-[#1a1a2e] text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Liste des logs */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "#16213e", border: "1px solid #1f4068" }}
        >
          <History size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">Aucune action enregistrée</p>
        </div>
      ) : (
        <div 
          className="rounded-xl overflow-hidden"
          style={{ background: "#16213e", border: "1px solid #1f4068" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#1a1a2e" }}>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f4068]">
                {logs.map((log, index) => {
                  const actionConfig = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    icon: History,
                    color: "#6b7280"
                  };
                  const ActionIcon = actionConfig.icon;
                  
                  return (
                    <tr key={index} className="hover:bg-[#1a1a2e]/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-400 text-sm">
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
                        <span className="text-gray-300 text-sm">
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
      <p className="text-center text-gray-500 text-sm mt-4">
        {logs.length} entrée(s) dans le journal
      </p>
    </AdminLayout>
  );
};

export default AdminLogs;
