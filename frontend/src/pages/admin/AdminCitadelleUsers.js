/**
 * AdminCitadelleUsers — Gestion des utilisateurs La Citadelle
 * Liste des membres avec données de consentement CGU/CGV (date + IP)
 */

import { useState, useEffect } from "react";
import { Users, Search, CheckCircle, XCircle, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

export default function AdminCitadelleUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get(`/citadelle/auth/admin/users?${params}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-5" data-testid="admin-citadelle-users">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
              <Users size={18} style={{ color: "#C9A45C" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Utilisateurs La Citadelle
              </h1>
              <p className="text-sm opacity-60">{total} membre{total > 1 ? "s" : ""} inscrit{total > 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Rechercher un utilisateur…"
              className="pl-9 pr-4 py-2 rounded-lg text-sm border outline-none"
              style={{ width: 240 }}
              data-testid="users-search"
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#e5e7eb" }}>
          <table className="w-full text-sm">
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">Inscription</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60 flex items-center gap-1.5">
                  <Shield size={12} style={{ color: "#C9A45C" }} /> CGU / CGV
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 opacity-40">Chargement…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 opacity-40">Aucun utilisateur trouvé</td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#f0f0f0" }}
                    data-testid={`user-row-${i}`}
                  >
                    {/* Utilisateur */}
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.first_name} {u.last_name}</p>
                      <p className="text-xs opacity-50">{u.email}</p>
                    </td>

                    {/* Inscription */}
                    <td className="px-4 py-3 text-xs opacity-60">{fmt(u.created_at)}</td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: u.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: u.status === "active" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {u.status === "active" ? "Actif" : "Suspendu"}
                      </span>
                    </td>

                    {/* CGU / CGV */}
                    <td className="px-4 py-3">
                      {u.cgu_accepted ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={14} style={{ color: "#16a34a" }} />
                            <span className="text-xs font-medium" style={{ color: "#16a34a" }}>Acceptées</span>
                          </div>
                          <p className="text-xs opacity-50 mt-0.5">{fmt(u.cgu_accepted_at)}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle size={14} style={{ color: "#dc2626" }} />
                          <span className="text-xs" style={{ color: "#dc2626" }}>Non acceptées</span>
                        </div>
                      )}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono opacity-60">
                        {u.cgu_ip_address || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm opacity-60">Page {page} / {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-2 rounded-lg disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
