/**
 * Dashboard Admin
 * Vue d'ensemble avec statistiques
 */

import { useState, useEffect } from "react";
import { Users, UserCheck, UserX, Clock, FileText, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

const StatCard = ({ icon: Icon, label, value, color = "#6366f1" }) => (
  <div 
    className="p-5 rounded-xl"
    style={{ background: "#16213e", border: "1px solid #1f4068" }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div 
        className="p-2.5 rounded-lg"
        style={{ background: `${color}20` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 className="text-xl font-bold mb-6 lg:hidden text-white">
        Tableau de bord
      </h1>

      {/* Message de bienvenue */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ background: "linear-gradient(135deg, #e94560, #1f4068)" }}
      >
        <h2 className="text-lg font-semibold text-white mb-1">
          Administration Le Syndicat du Code
        </h2>
        <p className="text-white/80 text-sm">
          Gérez les utilisateurs, consultez les demandes et supervisez la plateforme.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : (
        <>
          {/* Statistiques utilisateurs */}
          <h3 className="font-semibold text-white mb-4">Utilisateurs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard 
              icon={Users}
              label="Total utilisateurs"
              value={stats?.users?.total || 0}
              color="#6366f1"
            />
            <StatCard 
              icon={TrendingUp}
              label="Commerciaux"
              value={stats?.users?.commercial || 0}
              color="#10b981"
            />
            <StatCard 
              icon={UserCheck}
              label="Développeurs"
              value={stats?.users?.developer || 0}
              color="#3b82f6"
            />
            <StatCard 
              icon={Clock}
              label="En attente"
              value={stats?.users?.pending || 0}
              color="#f59e0b"
            />
            <StatCard 
              icon={UserX}
              label="Suspendus"
              value={stats?.users?.suspended || 0}
              color="#ef4444"
            />
          </div>

          {/* Autres stats */}
          <h3 className="font-semibold text-white mb-4">Activité</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              icon={FileText}
              label="Demandes de contact"
              value={stats?.contacts || 0}
              color="#8b5cf6"
            />
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
