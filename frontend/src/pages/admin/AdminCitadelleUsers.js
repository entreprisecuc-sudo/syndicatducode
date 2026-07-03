/**
 * AdminCitadelleUsers — Gestion des utilisateurs La Citadelle
 * Liste des membres avec CGU, statut KYC et modale de validation des documents
 */

import { useState, useEffect } from "react";
import {
  Users, Search, CheckCircle, XCircle, Shield, ChevronLeft, ChevronRight,
  Eye, FileText, Phone, Calendar, X, AlertCircle, ExternalLink
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
};

// ── Badge KYC ─────────────────────────────────────────────────────────────────
function KycBadge({ status }) {
  if (status === "validated")
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}
        data-testid="kyc-badge-validated">
        <CheckCircle size={11} /> Validé
      </span>
    );
  if (status === "rejected")
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}
        data-testid="kyc-badge-rejected">
        <XCircle size={11} /> Rejeté
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: "rgba(245,158,11,0.1)", color: "#d97706" }}
      data-testid="kyc-badge-pending">
      <Shield size={11} /> En attente
    </span>
  );
}

// ── Composant document cliquable ───────────────────────────────────────────────
function DocLink({ label, doc }) {
  if (!doc) return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs"
      style={{ background: "#f8f9fa", color: "#9ca3af" }}>
      <FileText size={13} /> {label} — <em>non fourni</em>
    </div>
  );
  const url = `${BACKEND_URL}/api${doc.url}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all hover:opacity-80"
      style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", color: "#2563eb" }}
      data-testid={`doc-link-${label.toLowerCase().replace(/\s/g,"-")}`}>
      <FileText size={13} />
      <span className="flex-1 truncate">{doc.filename || label}</span>
      <span className="opacity-40 text-xs">{fmtDate(doc.uploaded_at)}</span>
      <ExternalLink size={11} />
    </a>
  );
}

// ── Modale KYC ────────────────────────────────────────────────────────────────
function KycModal({ user, onClose, onSuccess }) {
  const [action, setAction] = useState(null);   // "validate" | "reject"
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const docs = user.documents || {};
  const hasAnyDoc = !!(docs.identity || docs.rib || docs.kbis);

  const submit = async () => {
    setError("");
    if (action === "reject" && !reason.trim()) {
      setError("Veuillez indiquer un motif de rejet.");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/citadelle/auth/admin/users/${user.id}/kyc`, {
        action,
        rejection_reason: reason.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour KYC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      data-testid="kyc-modal">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: "#C9A45C" }} />
            <h2 className="font-bold text-base">Validation KYC</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            data-testid="kyc-modal-close">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Infos utilisateur */}
          <div className="p-4 rounded-xl space-y-2" style={{ background: "#f8f9fa" }}>
            <p className="font-semibold text-sm">{user.first_name} {user.last_name}</p>
            <p className="text-xs opacity-60">{user.email}</p>
            <div className="flex flex-wrap gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
                <Phone size={12} />
                {user.phone || <em className="opacity-40">Téléphone manquant</em>}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#374151" }}>
                <Calendar size={12} />
                {user.date_of_birth ? fmtDate(user.date_of_birth) : <em className="opacity-40">Date de naissance manquante</em>}
              </span>
            </div>
            <div className="pt-1">
              <KycBadge status={user.kyc_status} />
              {user.kyc_status === "rejected" && user.kyc_rejection_reason && (
                <p className="text-xs mt-1.5" style={{ color: "#dc2626" }}>
                  Motif : {user.kyc_rejection_reason}
                </p>
              )}
              {user.kyc_status === "validated" && user.kyc_validated_at && (
                <p className="text-xs mt-1.5 opacity-50">Validé le {fmt(user.kyc_validated_at)}</p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">Documents justificatifs</p>
            {!hasAnyDoc ? (
              <div className="flex items-center gap-2 text-xs py-3 px-3 rounded-lg"
                style={{ background: "rgba(245,158,11,0.06)", color: "#d97706" }}>
                <AlertCircle size={13} /> Aucun document uploadé par l'utilisateur
              </div>
            ) : (
              <div className="space-y-2">
                <DocLink label="Carte d'identité" doc={docs.identity} />
                <DocLink label="RIB" doc={docs.rib} />
                <DocLink label="KBIS" doc={docs.kbis} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">Décision</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setAction("validate"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: action === "validate" ? "#16a34a" : "rgba(34,197,94,0.07)",
                  color: action === "validate" ? "white" : "#16a34a",
                  border: action === "validate" ? "none" : "1px solid rgba(34,197,94,0.25)"
                }}
                data-testid="kyc-action-validate">
                <CheckCircle size={14} /> Valider
              </button>
              <button
                onClick={() => { setAction("reject"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: action === "reject" ? "#dc2626" : "rgba(220,38,38,0.07)",
                  color: action === "reject" ? "white" : "#dc2626",
                  border: action === "reject" ? "none" : "1px solid rgba(220,38,38,0.25)"
                }}
                data-testid="kyc-action-reject">
                <XCircle size={14} /> Rejeter
              </button>
            </div>

            {action === "reject" && (
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Motif de rejet (ex : document illisible, photo non conforme…)"
                rows={3}
                className="w-full mt-3 px-3 py-2.5 rounded-xl text-sm outline-none resize-none border"
                style={{ borderColor: "#e5e7eb" }}
                data-testid="kyc-rejection-reason"
              />
            )}

            {error && (
              <div className="flex items-center gap-2 mt-2 text-xs p-2.5 rounded-lg"
                style={{ background: "rgba(220,38,38,0.07)", color: "#dc2626" }}>
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
            data-testid="kyc-modal-cancel">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!action || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
            style={{ background: "#C9A45C", color: "white" }}
            data-testid="kyc-modal-submit">
            {loading ? "Enregistrement…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminCitadelleUsers() {
  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const handleKycSuccess = () => {
    setSelectedUser(null);
    loadUsers();
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

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">
                  <span className="flex items-center gap-1.5">
                    <Shield size={12} style={{ color: "#C9A45C" }} /> CGU / CGV
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">
                  <span className="flex items-center gap-1.5">
                    <Shield size={12} style={{ color: "#C9A45C" }} /> KYC
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide opacity-60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 opacity-40">Chargement…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 opacity-40">Aucun utilisateur trouvé</td>
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
                      {/* Info KYC rapide */}
                      <div className="flex gap-2 mt-0.5">
                        {u.phone && (
                          <span className="text-xs opacity-40 flex items-center gap-0.5">
                            <Phone size={10} /> {u.phone}
                          </span>
                        )}
                        {u.date_of_birth && (
                          <span className="text-xs opacity-40 flex items-center gap-0.5">
                            <Calendar size={10} /> {fmtDate(u.date_of_birth)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inscription */}
                    <td className="px-4 py-3 text-xs opacity-60">{fmt(u.created_at)}</td>

                    {/* Statut compte */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: u.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: u.status === "active" ? "#16a34a" : "#dc2626",
                        }}>
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

                    {/* KYC */}
                    <td className="px-4 py-3">
                      <KycBadge status={u.kyc_status} />
                      {/* Indicateur documents disponibles */}
                      {(u.documents?.identity || u.documents?.rib || u.documents?.kbis) && (
                        <p className="text-xs opacity-40 mt-0.5">
                          {[u.documents?.identity && "CNI", u.documents?.rib && "RIB", u.documents?.kbis && "KBIS"].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(201,164,92,0.1)", color: "#C9A45C" }}
                        data-testid={`btn-kyc-review-${i}`}>
                        <Eye size={12} /> Réviser KYC
                      </button>
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
              className="p-2 rounded-lg disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm opacity-60">Page {page} / {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="p-2 rounded-lg disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modale KYC */}
      {selectedUser && (
        <KycModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={handleKycSuccess}
        />
      )}
    </AdminLayout>
  );
}
