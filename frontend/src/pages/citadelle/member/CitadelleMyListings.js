/**
 * Mes annonces — Espace membre La Citadelle Numérique
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, Edit2, Trash2, AlertCircle, Clock, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const STATUS_CONFIG = {
  draft:    { label: "Brouillon",       color: CITADELLE_COLORS.textMuted, bg: "rgba(95,102,114,0.1)", icon: Edit2 },
  pending:  { label: "En attente",      color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  icon: Clock },
  active:   { label: "Publiée",         color: "#22C55E", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle },
  rejected: { label: "Rejetée",         color: "#DC2626", bg: "rgba(220,38,38,0.1)",   icon: XCircle },
  sold:     { label: "Vendue",          color: CITADELLE_COLORS.gold, bg: "rgba(201,164,92,0.1)", icon: ShoppingBag },
  expired:  { label: "Expirée",         color: CITADELLE_COLORS.textMuted, bg: "rgba(95,102,114,0.1)", icon: Clock },
};

export default function CitadelleMyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
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
                    {listing.images?.[0]
                      ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                      : <span className="text-2xl">🏰</span>}
                  </div>
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: CITADELLE_COLORS.blue }}>{listing.title}</h3>
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
                    {["draft", "rejected"].includes(listing.status) && (
                      <>
                        <Link to={`/citadelle/espace-membre/mes-annonces/${listing.id}/modifier`}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue }}
                          title="Modifier">
                          <Edit2 size={15} />
                        </Link>
                        <button onClick={() => handleDelete(listing.id)} disabled={deletingId === listing.id}
                          className="p-2 rounded-lg transition-all hover:scale-110 disabled:opacity-50"
                          style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}
                          title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}
