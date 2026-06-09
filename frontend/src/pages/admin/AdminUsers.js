/**
 * Gestion des utilisateurs - Admin
 * Support mode sombre/clair
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, UserCheck, UserX, Shield, Briefcase, Code, ChevronRight, UserPlus, X, Eye, EyeOff, Castle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Pagination from "@/components/shared/Pagination";
import api from "@/services/api";

// Configuration des rôles
const ROLE_CONFIG = {
  commercial:      { label: "Commercial",  icon: Briefcase, color: "#10b981" },
  developer:       { label: "Développeur", icon: Code,      color: "#3b82f6" },
  admin:           { label: "Admin",       icon: Shield,    color: "#ef4444" },
  citadelle_user:  { label: "Citadelle",   icon: Castle,    color: "#C9A45C" },
  null:            { label: "Non défini",  icon: Users,     color: "#6b7280" }
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
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, totalPages: 1 });

  // Modal création admin
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vérification de correspondance des mots de passe
  const passwordsMatch = adminForm.confirmPassword === "" || adminForm.password === adminForm.confirmPassword;

  // Ref pour le debounce de la recherche
  const searchTimer = useRef(null);

  // Fetch principal (lit les states directement)
  const fetchUsers = async (p = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole)   params.append("role", filterRole);
      if (filterStatus) params.append("status", filterStatus);
      if (search)       params.append("search", search);
      params.append("page", p);
      params.append("limit", 20);

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPaginationInfo({
        total:      response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  // Quand les filtres changent : reset page + fetch immédiat
  useEffect(() => {
    setPage(1);
    fetchUsers(1); // eslint-disable-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus]);

  // Quand la recherche change : debounce 350ms + reset page
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1); // eslint-disable-line react-hooks/exhaustive-deps
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quand la page change : fetch avec nouvelle page
  useEffect(() => {
    fetchUsers(page); // eslint-disable-line react-hooks/exhaustive-deps
  }, [page]);

  const updateUserStatus = async (userId, newStatus) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${userId}/status?new_status=${newStatus}`,  {});
      fetchUsers(page);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${userId}/role?new_role=${newRole}`,  {});
      fetchUsers(page);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  // Créer un administrateur
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (adminForm.password !== adminForm.confirmPassword) {
      setCreateError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setCreateLoading(true);
      await api.post(`/admin/users/create-admin`, { email: adminForm.email, password: adminForm.password });
      setShowCreateAdmin(false);
      setAdminForm({ email: "", password: "", confirmPassword: "" });
      fetchUsers(page);
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Erreur lors de la création");
    } finally {
      setCreateLoading(false);
    }
  };

  // La recherche se fait désormais côté serveur (plus de filtrage local)

  return (
    <AdminLayout>
      {/* Titre mobile + Bouton créer admin */}
      <div className="flex items-center justify-between mb-6">
        <h1 
          className="text-xl font-bold lg:hidden"
          style={{ color: "var(--admin-text)" }}
        >
          Utilisateurs
        </h1>
        <button
          onClick={() => setShowCreateAdmin(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ background: "#ef4444" }}
          data-testid="create-admin-btn"
        >
          <UserPlus size={18} />
          <span className="hidden sm:inline">Créer un admin</span>
        </button>
      </div>

      {/* Modal création admin */}
      {showCreateAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full max-w-md rounded-xl p-6 transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
                Créer un administrateur
              </h2>
              <button 
                onClick={() => setShowCreateAdmin(false)}
                style={{ color: "var(--admin-text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                  {createError}
                </div>
              )}
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg transition-colors duration-300"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                  placeholder="admin@exemple.fr"
                  data-testid="admin-email-input"
                />
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 pr-10 rounded-lg transition-colors duration-300"
                    style={{ 
                      background: "var(--admin-bg-section)", 
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)"
                    }}
                    placeholder="Min. 8 caractères, majuscule, minuscule, chiffre"
                    data-testid="admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 pr-10 rounded-lg transition-colors duration-300"
                    style={{ 
                      background: "var(--admin-bg-section)", 
                      border: adminForm.confirmPassword && !passwordsMatch ? "1px solid #ef4444" : "1px solid var(--admin-border)",
                      color: "var(--admin-text)"
                    }}
                    placeholder="Répétez le mot de passe"
                    data-testid="admin-confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {adminForm.confirmPassword && !passwordsMatch && (
                  <p className="text-red-400 text-xs mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ 
                    background: "var(--admin-bg-section)", 
                    color: "var(--admin-text)",
                    border: "1px solid var(--admin-border)"
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !passwordsMatch}
                  className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ background: "#ef4444" }}
                  data-testid="admin-submit-btn"
                >
                  {createLoading ? "Création..." : "Créer l'admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      ) : users.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <Users size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
          <p style={{ color: "var(--admin-text-secondary)" }}>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
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
                      {/* Badge plateforme Citadelle */}
                      {user.platform === "citadelle" && (
                        <span
                          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: "rgba(201,164,92,0.15)", color: "#C9A45C", border: "1px solid rgba(201,164,92,0.3)" }}
                        >
                          <Castle size={10} />
                          La Citadelle
                        </span>
                      )}
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
                  
                  {/* Changer rôle — masqué pour les comptes Citadelle (géré côté Citadelle) */}
                  {user.platform !== "citadelle" ? (
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
                  ) : null}
                  
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

      {/* Pagination */}
      {!loading && !error && (
        <Pagination
          page={page}
          totalPages={paginationInfo.totalPages}
          total={paginationInfo.total}
          itemsPerPage={20}
          onPageChange={setPage}
          activeColor="#e94560"
        />
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
