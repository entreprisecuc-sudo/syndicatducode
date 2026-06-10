/**
 * Administration des annonces — La Citadelle Numérique
 * Validation, rejet, mise en avant depuis le back-office Syndicat
 */

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Star, Eye, Clock, Filter, AlertCircle, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { getListingImageUrl, isImageFile } from "@/config/citadelleConstants";

const STATUS_LABELS = {
  pending:  { label: "En attente", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  active:   { label: "Publiée",    color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  rejected: { label: "Rejetée",    color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  sold:     { label: "Vendue",     color: "#C9A45C", bg: "rgba(201,164,92,0.1)" },
  expired:  { label: "Expirée",    color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  draft:    { label: "Brouillon",  color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

const TYPE_LABELS = {
  website:        "Site internet",
  ecommerce:      "E-commerce",
  saas:           "SaaS",
  webapp:         "Application web",
  social_account: "Réseau social",
};

export default function AdminCitadelleListings() {
  const [listings, setListings] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectModal, setRejectModal] = useState(null); // { id, title }
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal] = useState(null); // { id, title }
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const res = await api.get("/citadelle/admin/listings", { params: { ...params, limit: 50 } });
      setListings(res.data.listings);
      setCounts(res.data.counts || {});
    } catch (err) {
      console.error("Erreur chargement annonces admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const validate = async (id) => {
    setActionLoading(id + "_validate");
    try {
      await api.patch(`/citadelle/admin/listings/${id}/validate`);
      await fetchListings();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la validation");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) {
      alert("Veuillez saisir un motif de rejet (min. 10 caractères)");
      return;
    }
    setActionLoading(rejectModal.id + "_reject");
    try {
      await api.patch(`/citadelle/admin/listings/${rejectModal.id}/reject`, { reason: rejectReason });
      setRejectModal(null);
      setRejectReason("");
      await fetchListings();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors du rejet");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeature = async (id) => {
    setActionLoading(id + "_feature");
    try {
      await api.patch(`/citadelle/admin/listings/${id}/feature`);
      await fetchListings();
    } catch (err) {
      alert("Erreur mise en avant");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteListing = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal.id + "_delete");
    try {
      await api.delete(`/citadelle/admin/listings/${deleteModal.id}`);
      setDeleteModal(null);
      await fetchListings();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  };

  const TABS = [
    { key: "pending", label: "En attente", count: counts.pending },
    { key: "active",  label: "Publiées",   count: counts.active },
    { key: "all",     label: "Toutes",     count: null },
    { key: "rejected",label: "Rejetées",   count: counts.rejected },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-citadelle-listings">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
            <Filter size={18} style={{ color: "#C9A45C" }} />
          </div>
          <h1 className="text-xl font-bold">Annonces — La Citadelle Numérique</h1>
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "#C9A45C" : "var(--admin-bg-card, rgba(255,255,255,0.05))",
                color: activeTab === tab.key ? "#081729" : "inherit",
                border: "1px solid var(--admin-border, rgba(255,255,255,0.1))"
              }}
              data-testid={`admin-listings-tab-${tab.key}`}>
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: activeTab === tab.key ? "rgba(8,23,41,0.2)" : "rgba(201,164,92,0.2)", color: "#C9A45C" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--admin-border, rgba(255,255,255,0.08))" }} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center opacity-50">
            <p className="text-4xl mb-3">🏰</p>
            <p className="text-sm">Aucune annonce dans cet onglet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => {
              const statusCfg = STATUS_LABELS[listing.status] || STATUS_LABELS.draft;
              return (
                <div key={listing.id} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
                  data-testid={`admin-listing-row-${listing.id}`}>
                  {/* Miniature */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    {listing.images?.filter(Boolean).find(img => isImageFile(img))
                      ? <img src={getListingImageUrl(listing.images.filter(Boolean).find(img => isImageFile(img)))} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                      : <span className="text-xl">🏰</span>}
                  </div>
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{listing.title}</p>
                    <p className="text-xs opacity-50 mt-0.5">
                      {TYPE_LABELS[listing.type] || listing.type} · {listing.price?.toLocaleString("fr-FR")} € · {listing.seller_email} · {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {listing.rejection_reason && (
                      <p className="text-xs mt-0.5 opacity-60 flex items-center gap-1">
                        <AlertCircle size={11} /> {listing.rejection_reason}
                      </p>
                    )}
                  </div>
                  {/* Statut */}
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {listing.status === "active" && (
                      <a href={`/citadelle/annonces/${listing.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-all hover:scale-110 opacity-60 hover:opacity-100"
                        title="Voir l'annonce">
                        <Eye size={15} />
                      </a>
                    )}
                    {listing.status === "active" && (
                      <button onClick={() => toggleFeature(listing.id)}
                        disabled={actionLoading === listing.id + "_feature"}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ color: listing.is_featured ? "#C9A45C" : undefined }}
                        title={listing.is_featured ? "Retirer la mise en avant" : "Mettre en avant"}>
                        <Star size={15} fill={listing.is_featured ? "#C9A45C" : "none"} />
                      </button>
                    )}
                    {listing.status === "pending" && (
                      <>
                        <button onClick={() => validate(listing.id)} disabled={actionLoading === listing.id + "_validate"}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                          data-testid={`admin-validate-${listing.id}`}>
                          <CheckCircle size={13} /> Valider
                        </button>
                        <button onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}
                          data-testid={`admin-reject-${listing.id}`}>
                          <XCircle size={13} /> Rejeter
                        </button>
                      </>
                    )}
                    {/* Supprimer — disponible pour tous les statuts */}
                    <button onClick={() => setDeleteModal({ id: listing.id, title: listing.title })}
                      disabled={actionLoading === listing.id + "_delete"}
                      className="p-2 rounded-lg transition-all hover:scale-110 opacity-50 hover:opacity-100"
                      style={{ color: "#DC2626" }}
                      title="Supprimer l'annonce"
                      data-testid={`admin-delete-${listing.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal rejet */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "var(--admin-bg, #1a1a2e)", border: "1px solid rgba(220,38,38,0.3)" }}>
            <h3 className="font-bold mb-2">Rejeter l'annonce</h3>
            <p className="text-sm opacity-60 mb-4 truncate">{rejectModal.title}</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
              placeholder="Motif du rejet (visible par le vendeur)..." className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                Annuler
              </button>
              <button onClick={reject} disabled={actionLoading !== null}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: "rgba(220,38,38,0.15)", color: "#DC2626" }}
                data-testid="admin-reject-confirm">
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "var(--admin-bg, #1a1a2e)", border: "1px solid rgba(220,38,38,0.3)" }}>
            <h3 className="font-bold mb-2">Supprimer l'annonce</h3>
            <p className="text-sm opacity-60 mb-4 truncate">{deleteModal.title}</p>
            <p className="text-sm mb-4" style={{ color: "#DC2626" }}>
              Cette action est irréversible. L'annonce sera définitivement supprimée.
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                Annuler
              </button>
              <button onClick={deleteListing} disabled={actionLoading !== null}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: "rgba(220,38,38,0.15)", color: "#DC2626" }}
                data-testid="admin-delete-confirm">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
