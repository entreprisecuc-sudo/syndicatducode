/**
 * Gestion des utilisateurs - Admin
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, UserCheck, UserX, Shield, Briefcase, Code, ChevronRight } from "lucide-react";
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
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
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
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Utilisateurs
      </h1>

      {/* Filtres */}
      <div 
        className="p-4 rounded-xl mb-6 flex flex-col md:flex-row gap-4 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2" 
            style={{ color: "var(--admin-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Rechercher par email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 rounded-lg py-2 px-3 transition-colors duration-300"
            style={{ 
              background: "var(--admin-bg-section)", 
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)"
            }}
          />
        </div>
        
        {/* Filtre rôle */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg py-2 px-3 transition-colors duration-300"
          style={{ 
            background: "var(--admin-bg-section)", 
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)"
          }}
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
          className="rounded-lg py-2 px-3 transition-colors duration-300"
          style={{ 
            background: "var(--admin-bg-section)", 
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)"
          }}
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
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "var(--admin-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <Users size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
          <p style={{ color: "var(--admin-text-secondary)" }}>Aucun utilisateur trouvé</p>
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
                className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-300 hover:opacity-90"
                style={{ 
                  background: "var(--admin-bg-card)", 
                  border: "1px solid var(--admin-border)"
                }}
                onClick={() => navigate(`/syndicat-admin/utilisateurs/${user.id}`)}
                data-testid={`user-row-${user.id}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ background: roleConfig.color }}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium truncate"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {user.email}
                    </p>
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
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                    className="text-xs py-1.5 px-2 rounded transition-colors duration-300"
                    style={{ 
                      background: "var(--admin-bg-section)", 
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="" disabled>Changer rôle</option>
                    <option value="commercial">Commercial</option>
                    <option value="developer">Développeur</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  {/* Indicateur cliquable */}
                  <ChevronRight 
                    size={18} 
                    className="hidden md:block" 
                    style={{ color: "var(--admin-text-muted)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compteur */}
      <p 
        className="text-center text-sm mt-4"
        style={{ color: "var(--admin-text-muted)" }}
      >
        {filteredUsers.length} utilisateur(s) trouvé(s)
      </p>
    </AdminLayout>
  );
};

export default AdminUsers;
