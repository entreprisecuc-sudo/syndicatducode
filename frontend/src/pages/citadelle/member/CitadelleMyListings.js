/**
 * Mes annonces — Espace membre La Citadelle Numérique
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, Edit2, Trash2, AlertCircle, Clock, CheckCircle, XCircle, ShoppingBag, ShieldCheck, LogOut, X } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, getListingImageUrl, isImageFile } from "@/config/citadelleConstants";

const STATUS_CONFIG = {
  draft:     { label: "Brouillon",  color: CITADELLE_COLORS.textMuted, bg: "rgba(95,102,114,0.1)",  icon: Edit2 },
  pending:   { label: "En attente", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  icon: Clock },
  active:    { label: "Publiée",    color: "#22C55E", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle },
  rejected:  { label: "Rejetée",   color: "#DC2626", bg: "rgba(220,38,38,0.1)",   icon: XCircle },
  sold:      { label: "Vendue",     color: CITADELLE_COLORS.gold, bg: "rgba(201,164,92,0.1)", icon: ShoppingBag },
  expired:   { label: "Expirée",   color: CITADELLE_COLORS.textMuted, bg: "rgba(95,102,114,0.1)", icon: Clock },
  withdrawn: { label: "Retirée",   color: "#64748B", bg: "rgba(100,116,139,0.1)", icon: LogOut },
};

const WITHDRAW_REASONS = [
  { key: "sold",              label: "Le bien est vendu" },
  { key: "not_exist",         label: "Le bien n'existe plus" },
  { key: "no_longer_selling", label: "Je ne souhaite plus le vendre" },
];

export default function CitadelleMyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState({ open: false, listingId: null, listingTitle: "" });
  const [withdrawReason, setWithdrawReason] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const { isAuthenticated, loading: authLoading } = useCitadelleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return; // Wait for auth context to finish loading
    if (!isAuthenticated) { navigate("/citadelle/connexion"); return; }
    fetchMyListings();
  }, [isAuthenticated, authLoading]);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get("/listings/my");
      setListings(res.data.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette annonce ? Cette action est irréversible.")) return;
    setDeletingId(id);
    try {
      await citadelleApi.delete(`/listings/${id}`);
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Impossible de supprimer cette annonce");
    } finally {
      setDeletingId(null);
    }
  };

  const openWithdrawModal = (listing) => {
    setWithdrawReason(null);
    setWithdrawModal({ open: true, listingId: listing.id, listingTitle: listing.title });
  };

  const handleWithdraw = async () => {
    if (!withdrawReason) return;
    setWithdrawing(true);
    try {
      const res = await citadelleApi.post(`/listings/${withdrawModal.listingId}/withdraw`, { reason: withdrawReason });
      setListings(prev => prev.map(l =>
        l.id === withdrawModal.listingId ? { ...l, status: res.data.new_status } : l
      ));
      setWithdrawModal({ open: false, listingId: null, listingTitle: "" });
    } catch (err) {
      alert(err.response?.data?.detail || "Impossible de retirer l'annonce");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <CitadelleLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10" data-testid="my-listings">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
              Mes annonces
            </h1>
            <p className="text-sm mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              {listings.length} annonce{listings.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link to="/citadelle/espace-membre/mes-annonces/creer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="create-listing-btn">
            <Plus size={16} /> Nouvelle annonce
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: CITADELLE_COLORS.border }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">🏰</p>
            <h2 className="text-lg font-bold mb-2" style={{ color: CITADELLE_COLORS.blue }}>Aucune annonce pour le moment</h2>
            <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>Publiez votre premier actif numérique gratuitement</p>
            <Link to="/citadelle/espace-membre/mes-annonces/creer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              <Plus size={16} /> Créer une annonce
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => {
              const { label, color, bg, icon: StatusIcon } = STATUS_CONFIG[listing.status] || STATUS_CONFIG.draft;
              return (
                <div key={listing.id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`my-listing-${listing.id}`}>
                  {/* Image miniature */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: CITADELLE_COLORS.bg }}>
                    {listing.images?.filter(Boolean).find(img => isImageFile(img))
                      ? <img src={getListingImageUrl(listing.images.filter(Boolean).find(img => isImageFile(img)))} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                      : <span className="text-2xl">🏰</span>}
                  </div>
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm truncate" style={{ color: CITADELLE_COLORS.blue }}>{listing.title}</h3>
                      {listing.garde_verified && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)",
                            color: "#C9A45C",
                            border: "1px solid rgba(201,164,92,0.35)",
                          }}
                          data-testid={`my-listing-garde-badge-${listing.id}`}
                        >
                          <ShieldCheck size={10} /> Vérifié La Garde
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {listing.price?.toLocaleString("fr-FR")} € · {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {listing.rejection_reason && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#DC2626" }}>
                        <AlertCircle size={11} /> {listing.rejection_reason}
                      </p>
                    )}
                  </div>
                  {/* Statut */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: bg, color }}>
                    <StatusIcon size={12} /> {label}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {listing.status === "active" && (
                      <Link to={`/citadelle/annonces/${listing.slug}`}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue }}
                        title="Voir">
                        <Eye size={15} />
                      </Link>
                    )}
                    {["draft", "rejected", "active", "pending"].includes(listing.status) && (
                      <Link to={`/citadelle/espace-membre/mes-annonces/${listing.id}/modifier`}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue }}
                        title="Modifier">
                        <Edit2 size={15} />
                      </Link>
                    )}
                    {["active", "pending"].includes(listing.status) && (
                      <button onClick={() => openWithdrawModal(listing)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(100,116,139,0.1)", color: "#64748B" }}
                        title="Retirer l'annonce de la vente"
                        data-testid={`withdraw-btn-${listing.id}`}>
                        <LogOut size={13} /> Retirer
                      </button>
                    )}
                    {["draft", "rejected"].includes(listing.status) && (
                      <button onClick={() => handleDelete(listing.id)} disabled={deletingId === listing.id}
                        className="p-2 rounded-lg transition-all hover:scale-110 disabled:opacity-50"
                        style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}
                        title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal retrait annonce ─────────────────────────────────────────── */}
      {withdrawModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,23,41,0.75)" }}
          data-testid="withdraw-modal">
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "white", boxShadow: "0 24px 64px rgba(15,39,71,0.25)" }}>
            {/* En-tête modal */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: CITADELLE_COLORS.night, borderBottom: `1px solid rgba(201,164,92,0.2)` }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: CITADELLE_COLORS.gold }}>Retrait d'annonce</p>
                <h2 className="text-base font-black text-white">Retirer l'annonce de la vente</h2>
              </div>
              <button onClick={() => setWithdrawModal({ open: false, listingId: null, listingTitle: "" })}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: "white" }}
                data-testid="withdraw-modal-close">
                <X size={18} />
              </button>
            </div>
            {/* Corps modal */}
            <div className="px-6 py-5">
              <p className="text-sm mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>Annonce :</p>
              <p className="text-sm font-bold mb-5 truncate" style={{ color: CITADELLE_COLORS.blue }}>
                "{withdrawModal.listingTitle}"
              </p>
              <p className="text-sm font-semibold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
                Quelle est la raison du retrait ?
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {WITHDRAW_REASONS.map(({ key, label }) => (
                  <button key={key}
                    onClick={() => setWithdrawReason(key)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      border: withdrawReason === key ? `2px solid ${CITADELLE_COLORS.gold}` : `1.5px solid ${CITADELLE_COLORS.border}`,
                      background: withdrawReason === key ? "rgba(201,164,92,0.06)" : "white",
                      color: CITADELLE_COLORS.blue,
                    }}
                    data-testid={`withdraw-reason-${key}`}>
                    <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: withdrawReason === key ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border,
                      }}>
                      {withdrawReason === key && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setWithdrawModal({ open: false, listingId: null, listingTitle: "" })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted }}
                  data-testid="withdraw-cancel-btn">
                  Annuler
                </button>
                <button onClick={handleWithdraw}
                  disabled={!withdrawReason || withdrawing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: withdrawReason ? CITADELLE_COLORS.night : CITADELLE_COLORS.border, color: "white" }}
                  data-testid="withdraw-confirm-btn">
                  {withdrawing ? "Retrait en cours…" : "Confirmer le retrait"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CitadelleLayout>
  );
}
