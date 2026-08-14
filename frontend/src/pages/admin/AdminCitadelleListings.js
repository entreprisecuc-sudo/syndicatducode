/**
 * Administration des annonces — La Citadelle Numérique
 * Validation, rejet, mise en avant depuis le back-office Syndicat
 */

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Star, Eye, Filter, AlertCircle, Trash2, X, ExternalLink, Globe, BarChart2, Calendar, TrendingUp, Hammer, FileText, ShieldCheck, Share2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { getListingImageUrl, isImageFile, isDocumentFile, getFileLabel } from "@/config/citadelleConstants";
import { computeListingQuality } from "@/config/listingQuality";

const STATUS_LABELS = {
  pending:   { label: "En attente", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  active:    { label: "Publiée",    color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  rejected:  { label: "Rejetée",   color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  sold:      { label: "Vendue",     color: "#C9A45C", bg: "rgba(201,164,92,0.1)" },
  expired:   { label: "Expirée",   color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  draft:     { label: "Brouillon", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  withdrawn: { label: "Retirée",   color: "#64748B", bg: "rgba(100,116,139,0.12)" },
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
  const [rejectModal, setRejectModal]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal]   = useState(null);
  const [detailModal, setDetailModal]   = useState(null); // listing complet
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

  const toggleGardeVerify = async (id) => {
    setActionLoading(id + "_garde");
    try {
      await api.patch(`/citadelle/admin/listings/${id}/garde-verify`);
      await fetchListings();
    } catch (err) {
      alert("Erreur badge La Garde");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSocialShare = async (id) => {
    setActionLoading(id + "_social");
    try {
      await api.patch(`/citadelle/admin/listings/${id}/social-share`);
      await fetchListings();
      setDetailModal(prev => prev && prev.id === id ? { ...prev, allow_social_share: !prev.allow_social_share } : prev);
    } catch (err) {
      alert("Erreur consentement partage");
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
    { key: "pending",   label: "En attente", count: counts.pending },
    { key: "active",    label: "Publiées",   count: counts.active },
    { key: "withdrawn", label: "Retirées",   count: counts.withdrawn },
    { key: "sold",      label: "Vendues",    count: counts.sold },
    { key: "all",       label: "Toutes",     count: null },
    { key: "rejected",  label: "Rejetées",   count: counts.rejected },
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
                <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl"
                  style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
                  data-testid={`admin-listing-row-${listing.id}`}>
                  {/* Groupe gauche : miniature + infos */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                    <p className="text-xs opacity-50 mt-0.5 truncate">
                      {TYPE_LABELS[listing.type] || listing.type} · {listing.price?.toLocaleString("fr-FR")} € · {listing.seller_email} · {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {listing.rejection_reason && (
                      <p className="text-xs mt-0.5 opacity-60 flex items-center gap-1">
                        <AlertCircle size={11} /> {listing.rejection_reason}
                      </p>
                    )}
                  </div>
                  </div>
                  {/* Groupe droit : statut + score + actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:justify-end sm:flex-shrink-0">
                  {/* Statut */}
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                  {/* Score qualité */}
                  <QualityBadge listing={listing} />
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Voir les détails — toujours disponible */}
                    <button onClick={() => setDetailModal(listing)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(201,164,92,0.1)", color: "#C9A45C" }}
                      title="Voir les détails"
                      data-testid={`admin-view-${listing.id}`}>
                      <Eye size={13} /> Voir
                    </button>
                    {listing.status === "active" && (
                      <>
                        <button onClick={() => toggleFeature(listing.id)}
                          disabled={actionLoading === listing.id + "_feature"}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ color: listing.is_featured ? "#C9A45C" : undefined }}
                          title={listing.is_featured ? "Retirer la mise en avant" : "Mettre en avant"}>
                          <Star size={15} fill={listing.is_featured ? "#C9A45C" : "none"} />
                        </button>
                        <button onClick={() => toggleGardeVerify(listing.id)}
                          disabled={actionLoading === listing.id + "_garde"}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            color: listing.garde_verified ? "#C9A45C" : "#6B7280",
                            background: listing.garde_verified ? "rgba(201,164,92,0.12)" : "transparent",
                            border: listing.garde_verified ? "1px solid rgba(201,164,92,0.3)" : "1px solid transparent",
                          }}
                          title={listing.garde_verified ? "Retirer le badge La Garde" : "Activer le badge La Garde"}
                          data-testid={`admin-garde-${listing.id}`}>
                          <ShieldCheck size={15} fill={listing.garde_verified ? "rgba(201,164,92,0.3)" : "none"} />
                        </button>
                      </>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal détail annonce */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={e => { if (e.target === e.currentTarget) setDetailModal(null); }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: "var(--admin-bg, #1a1a2e)", border: "1px solid rgba(201,164,92,0.2)" }}>

            {/* En-tête */}
            <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: STATUS_LABELS[detailModal.status]?.bg, color: STATUS_LABELS[detailModal.status]?.color }}>
                    {STATUS_LABELS[detailModal.status]?.label}
                  </span>
                  <span className="text-xs opacity-40">{TYPE_LABELS[detailModal.type] || detailModal.type}</span>
                  {detailModal.is_auction && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                      style={{ background: "rgba(201,164,92,0.15)", color: "#C9A45C" }}>
                      <Hammer size={10} /> Enchère
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-base leading-snug">{detailModal.title}</h2>
                <p className="text-xs opacity-40 mt-1">{detailModal.seller_email} · {new Date(detailModal.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Images */}
              {detailModal.images?.filter(Boolean).filter(isImageFile).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-2">Photos</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {detailModal.images.filter(Boolean).filter(isImageFile).map((img, i) => (
                      <a key={i} href={getListingImageUrl(img)} target="_blank" rel="noopener noreferrer">
                        <img src={getListingImageUrl(img)} alt=""
                          className="h-36 w-auto rounded-xl object-cover flex-shrink-0 hover:opacity-90 transition-opacity"
                          onError={e => e.target.style.display = "none"} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents (PJ vendeur) */}
              {detailModal.images?.filter(Boolean).filter(isDocumentFile).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-2">Pièces jointes du vendeur</p>
                  <div className="space-y-2">
                    {detailModal.images.filter(Boolean).filter(isDocumentFile).map((doc, i) => {
                      const url = getListingImageUrl(doc);
                      const nom = doc.split("/").pop();
                      const label = getFileLabel(doc);
                      return (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                          style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.15)" }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(201,164,92,0.15)" }}>
                            <FileText size={15} style={{ color: "#C9A45C" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{nom}</p>
                            <p className="text-xs opacity-40">{label}</p>
                          </div>
                          <ExternalLink size={13} style={{ color: "#C9A45C", flexShrink: 0 }} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Métriques clés */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetriqueCard icon={TrendingUp} label="Prix" value={`${detailModal.price?.toLocaleString("fr-FR")} €`} />
                {detailModal.monthly_revenue != null && <MetriqueCard icon={BarChart2} label="CA mensuel" value={`${detailModal.monthly_revenue?.toLocaleString("fr-FR")} €`} />}
                {detailModal.monthly_traffic != null && <MetriqueCard icon={Globe} label="Trafic/mois" value={detailModal.monthly_traffic?.toLocaleString("fr-FR")} />}
                {detailModal.age_months != null && <MetriqueCard icon={Calendar} label="Âge" value={`${detailModal.age_months} mois`} />}
              </div>

              {/* Score de qualité (aide à l'accompagnement du vendeur) */}
              <QualityPanel listing={detailModal} />

              {/* Consentement partage réseaux sociaux */}
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                data-testid="admin-social-consent">
                <div className="flex items-center gap-2 min-w-0">
                  <Share2 size={15} style={{ color: "#C9A45C" }} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Partage réseaux sociaux</p>
                    <p className="text-xs opacity-50">
                      {detailModal.allow_social_share
                        ? "Le vendeur autorise le partage de son annonce."
                        : "Le vendeur n'a pas autorisé le partage."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSocialShare(detailModal.id)}
                  disabled={actionLoading === detailModal.id + "_social"}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 transition-all hover:scale-105 disabled:opacity-60"
                  style={{
                    background: detailModal.allow_social_share ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.1)",
                    color: detailModal.allow_social_share ? "#22C55E" : "#DC2626",
                  }}
                  data-testid="admin-social-toggle">
                  {detailModal.allow_social_share ? "Autorisé ✓" : "Non autorisé"}
                </button>
              </div>

              {/* Enchère */}
              {detailModal.is_auction && (
                <div className="p-4 rounded-xl space-y-1" style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.15)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#C9A45C" }}>Paramètres enchère</p>
                  <p className="text-xs opacity-70">Prix de départ : <strong>{detailModal.price?.toLocaleString("fr-FR")} €</strong> · Réserve {detailModal.auction_show_reserve ? "visible" : "cachée"}</p>
                  <p className="text-xs opacity-70">Durée : <strong>{detailModal.auction_duration_days} jours</strong></p>
                  {detailModal.auction_buy_now_price && <p className="text-xs opacity-70">Achat immédiat : <strong>{detailModal.auction_buy_now_price?.toLocaleString("fr-FR")} €</strong></p>}
                </div>
              )}

              {/* Description courte */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-1">Description courte</p>
                <p className="text-sm opacity-80 leading-relaxed">{detailModal.short_description}</p>
              </div>

              {/* Description complète */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-1">Description complète</p>
                <p className="text-sm opacity-70 leading-relaxed whitespace-pre-line">{detailModal.description}</p>
              </div>

              {/* Technologies + niche */}
              {(detailModal.technologies?.length > 0 || detailModal.niche) && (
                <div className="flex flex-wrap gap-2">
                  {detailModal.niche && <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>{detailModal.niche}</span>}
                  {detailModal.technologies?.map(t => <span key={t} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>{t}</span>)}
                </div>
              )}

              {/* URL de prévisualisation */}
              {detailModal.url_preview && (
                <a href={detailModal.url_preview} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs hover:underline" style={{ color: "#C9A45C" }}>
                  <ExternalLink size={12} /> {detailModal.url_preview}
                </a>
              )}

              {/* Prix négociable */}
              {detailModal.price_negotiable && (
                <p className="text-xs px-3 py-1.5 rounded-lg inline-block" style={{ background: "rgba(201,164,92,0.07)", color: "#C9A45C" }}>
                  Prix négociable
                </p>
              )}
            </div>

            {/* Actions en bas — uniquement si en attente */}
            {detailModal.status === "pending" && (
              <div className="flex gap-3 p-5 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <button onClick={() => { validate(detailModal.id); setDetailModal(null); }}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}
                  data-testid="admin-detail-validate">
                  <CheckCircle size={15} /> Valider et publier
                </button>
                <button onClick={() => { setDetailModal(null); setRejectModal({ id: detailModal.id, title: detailModal.title }); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
                  <XCircle size={15} /> Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

function MetriqueCard({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} style={{ color: "#C9A45C" }} />
        <span className="text-xs opacity-40 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

// Badge compact du score de qualité (ligne de liste)
function QualityBadge({ listing }) {
  const { pct, label } = computeListingQuality(listing);
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-lg font-bold flex-shrink-0 flex items-center gap-1"
      style={{ background: `${label.color}1A`, color: label.color }}
      title={`Qualité de l'annonce : ${label.text}`}
      data-testid={`admin-quality-${listing.id}`}
    >
      {pct}%
    </span>
  );
}

// Panneau détaillé du score + éléments manquants (modale)
function QualityPanel({ listing }) {
  const { pct, label, missing } = computeListingQuality(listing);
  return (
    <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.06)", border: "1px solid rgba(201,164,92,0.2)" }} data-testid="admin-quality-panel">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C9A45C" }}>Qualité de l'annonce</span>
        <span className="text-sm font-black" style={{ color: label.color }}>{pct}% · {label.text}</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #16A34A, #22C55E)` }} />
      </div>
      {missing.length > 0 ? (
        <>
          <p className="text-xs opacity-50 mb-1.5">Éléments manquants (à suggérer au vendeur) :</p>
          <ul className="space-y-1">
            {missing.map((c, i) => (
              <li key={i} className="text-xs opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C9A45C" }} /> {c.label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs" style={{ color: "#16A34A" }}>Annonce complète — rien à signaler. ✅</p>
      )}
    </div>
  );
}
