/**
 * Gestion des utilisateurs - Admin
 */

import { useState, useEffect } from "react";
import { Users, Search, UserCheck, UserX, Shield, Briefcase, Code, MoreVertical } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des rôles
const ROLE_CONFIG = {
  commercial: { label: "Commercial", icon: Briefcase, color: "#10b981" },
  developer: { label: "Développeur", icon: Code, color: "#3b82f6" },
  admin: { label: "Admin", icon: Shield, color: "#ef4444" },
  null: { label: "Non défini", icon: Users, color: "#6b7280" }
};

// Configuration des statuts
const STATUS_CONFIG = {
  active: { label: "Actif", color: "#10b981", bg: "#10b98120" },
  suspended: { label: "Suspendu", color: "#ef4444", bg: "#ef444420" },
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20" }
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole) params.append("role", filterRole);
      if (filterStatus) params.append("status", filterStatus);
      
      const response = await axios.get(`${API_URL}/admin/users?${params}`, {
        headers: getAuthHeaders()
      });
      setUsers(response.data.users);
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      setActionLoading(true);
      await axios.put(
        `${API_URL}/admin/users/${userId}/status?new_status=${newStatus}`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await axios.put(
        `${API_URL}/admin/users/${userId}/role?new_role=${newRole}`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrage local par recherche
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 className="text-xl font-bold mb-6 lg:hidden text-white">
        Utilisateurs
      </h1>

      {/* Filtres */}
      <div 
        className="p-4 rounded-xl mb-6 flex flex-col md:flex-row gap-4"
        style={{ background: "#16213e", border: "1px solid #1f4068" }}
      >
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 bg-[#1a1a2e] border-[#1f4068] text-white placeholder-gray-500"
          />
        </div>
        
        {/* Filtre rôle */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-[#1a1a2e] border-[#1f4068] text-white"
        >
          <option value="">Tous les rôles</option>
          <option value="commercial">Commercial</option>
          <option value="developer">Développeur</option>
          <option value="admin">Admin</option>
        </select>
        
        {/* Filtre statut */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#1a1a2e] border-[#1f4068] text-white"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      {/* Liste des utilisateurs */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "#16213e", border: "1px solid #1f4068" }}
        >
          <Users size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.null;
            const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
            const RoleIcon = roleConfig.icon;
            
            return (
              <div 
                key={user.id}
                className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ background: "#16213e", border: "1px solid #1f4068" }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ background: roleConfig.color }}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {/* Rôle */}
                      <span 
                        className="flex items-center gap-1 text-xs"
                        style={{ color: roleConfig.color }}
                      >
                        <RoleIcon size={12} />
                        {roleConfig.label}
                      </span>
                      {/* Statut */}
                      <span 
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Changer statut */}
                  {user.status === "active" ? (
                    <button
                      onClick={() => updateUserStatus(user.id, "suspended")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Suspendre
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUserStatus(user.id, "active")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      Activer
                    </button>
                  )}
                  
                  {/* Changer rôle */}
                  <select
                    value={user.role || ""}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={actionLoading}
                    className="bg-[#1a1a2e] border-[#1f4068] text-white text-xs py-1.5"
                  >
                    <option value="" disabled>Changer rôle</option>
                    <option value="commercial">Commercial</option>
                    <option value="developer">Développeur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compteur */}
      <p className="text-center text-gray-500 text-sm mt-4">
        {filteredUsers.length} utilisateur(s) trouvé(s)
      </p>
    </AdminLayout>
  );
};

export default AdminUsers;
