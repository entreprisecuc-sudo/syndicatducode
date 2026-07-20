/**
 * Page détail annonce — La Citadelle Numérique
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Globe, ShoppingCart, Cloud, Monitor, Users, TrendingUp, BarChart2,
  Calendar, ShieldCheck, Star, ArrowLeft, Eye, Share2, Lock, FileText, Download, Send, AlertCircle, Hammer, Clock, Zap
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import { useCitadelleModeration } from "@/hooks/useCitadelleModeration";
import { CITADELLE_COLORS, getListingImageUrl, isImageFile, isDocumentFile, getFileLabel } from "@/config/citadelleConstants";
import CitadelleAuthModal from "@/components/citadelle/CitadelleAuthModal";
import { ReportBidButton } from "@/components/citadelle/ReportBidButton";
import ShareBar from "@/components/citadelle/ShareBar";
import BoostModal from "@/components/citadelle/BoostModal";
import SellerServicesUpsell, { BUYER_ESTIMATION_SERVICES } from "@/components/citadelle/SellerServicesUpsell";

// ── Hook : compte à rebours ──────────────────────────────────────────────────

function useTempsRestant(auctionEndsAt) {
  const calc = () => {
    if (!auctionEndsAt) return null;
    const diff = new Date(auctionEndsAt) - new Date();
    if (diff <= 0) return null;
    const jours    = Math.floor(diff / 86400000);
    const heures   = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, "0");
    const minutes  = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
    const secondes = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
    return jours > 0
      ? `${jours}j ${heures}:${minutes}:${secondes}`
      : `${heures}:${minutes}:${secondes}`;
  };
  const [reste, setReste] = useState(calc);
  useEffect(() => {
    if (!auctionEndsAt) return;
    const t = setInterval(() => setReste(calc), 1000);
    return () => clearInterval(t);
  }, [auctionEndsAt]);
  return reste;
}

const TYPE_CONFIG = {
  website:        { label: "Site internet",    icon: Globe },
  ecommerce:      { label: "E-commerce",       icon: ShoppingCart },
  saas:           { label: "SaaS",             icon: Cloud },
  webapp:         { label: "Application web",  icon: Monitor },
  social_account: { label: "Réseau social",    icon: Users },
};

export default function CitadelleListingDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useCitadelleAuth();
  const { canTransact } = useCitadelleModeration();
  const [listing, setListing] = useState(null);
  const [siblings, setSiblings] = useState({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [offerModal, setOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [contactModal, setContactModal] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [boostModal, setBoostModal] = useState(false);
  const [estimationPopup, setEstimationPopup] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState(null);
  const [ownerUpsellStep, setOwnerUpsellStep] = useState("boost"); // "boost" | "services" | "done"
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  // Enchères
  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState(false);
  const tempsRestant = useTempsRestant(listing?.auction_ends_at);

  useEffect(() => {
    fetchListing();
    // On conserve les filtres/tri en cours pour une navigation cohérente
    const params = new URLSearchParams(location.search);
    params.delete("page");
    citadelleApi.get(`/listings/${slug}/siblings`, { params: Object.fromEntries(params) })
      .then(res => setSiblings(res.data))
      .catch(() => setSiblings({ prev: null, next: null }));
    window.scrollTo(0, 0);
  }, [slug, location.search]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get(`/listings/${slug}`);
      setListing(res.data);
    } catch (err) {
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <CitadelleLayout>
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
      </div>
    </CitadelleLayout>
  );

  if (!listing) return (
    <CitadelleLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🏰</p>
        <h1 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>Annonce introuvable</h1>
        <Link to="/citadelle/annonces" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
          <ArrowLeft size={16} /> Retour aux annonces
        </Link>
      </div>
    </CitadelleLayout>
  );

  // Contenu adulte : consultation du détail réservée aux comptes vérifiés (connectés)
  if (listing.is_adult && !isAuthenticated) {
    return (
      <CitadelleLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center" data-testid="adult-restricted">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626", border: "2px solid #DC2626" }}>
            <span className="text-xl font-black">18+</span>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            Contenu adulte
          </h1>
          <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
            Cette annonce contient du contenu réservé aux adultes. La consultation du détail est réservée aux comptes vérifiés.
            Connectez-vous ou créez un compte pour continuer.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/citadelle/connexion" className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }} data-testid="adult-login-btn">
              Se connecter
            </Link>
            <Link to="/citadelle/annonces" className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
              Retour aux annonces
            </Link>
          </div>
        </div>
      </CitadelleLayout>
    );
  }

  const { label: typeLabel, icon: TypeIcon } = TYPE_CONFIG[listing.type] || TYPE_CONFIG.website;
  const allFiles = listing.images?.filter(Boolean) || [];
  const images = allFiles.filter(f => isImageFile(f));
  const documents = allFiles.filter(f => isDocumentFile(f));
  // Si pas d'images, on affiche le placeholder
  const displayImages = images.length > 0 ? images : [null];

  // Propriétaire de l'annonce & état du boost « Annonce à la Une »
  const isOwner = isAuthenticated && user?.id === listing.seller_id;
  const isBoosted = !!listing.boost_plan && (
    listing.boost_plan === "until_sale" ||
    (listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date())
  );

  return (
    <CitadelleLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8" data-testid="listing-detail">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
          <Link to="/citadelle" className="hover:opacity-80">Accueil</Link>
          <span>/</span>
          <Link to="/citadelle/annonces" className="hover:opacity-80">Annonces</Link>
          <span>/</span>
          <span style={{ color: CITADELLE_COLORS.blue }} className="truncate max-w-xs">{listing.title}</span>
        </div>

        {/* Navigation entre annonces */}
        <div className="flex items-center justify-between gap-3 mb-6" data-testid="listing-nav">
          <button
            type="button"
            disabled={!siblings.prev}
            onClick={() => siblings.prev && navigate(`/citadelle/annonces/${siblings.prev.slug}${location.search}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-85"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue, background: "#fff" }}
            data-testid="listing-prev-btn"
            title={siblings.prev?.title || ""}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Annonce précédente</span>
            <span className="sm:hidden">Précédente</span>
          </button>

          <Link
            to={`/citadelle/annonces${location.search}`}
            className="text-xs font-medium hover:opacity-80 hidden md:inline"
            style={{ color: CITADELLE_COLORS.textMuted }}
            data-testid="listing-back-all"
          >
            Toutes les annonces
          </Link>

          <button
            type="button"
            disabled={!siblings.next}
            onClick={() => siblings.next && navigate(`/citadelle/annonces/${siblings.next.slug}${location.search}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-85"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue, background: "#fff" }}
            data-testid="listing-next-btn"
            title={siblings.next?.title || ""}
          >
            <span className="hidden sm:inline">Annonce suivante</span>
            <span className="sm:hidden">Suivante</span>
            <ArrowLeft size={15} style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche — Images + Description */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Image principale */}
            <div className="rounded-2xl overflow-hidden" style={{ height: "320px", background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
              {listing.is_adult ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6"
                  style={{ background: "linear-gradient(135deg, #1a1626 0%, #2d1b2e 100%)" }} data-testid="adult-cover">
                  <span className="flex items-center justify-center w-16 h-16 rounded-full text-xl font-black"
                    style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", border: "2px solid #f87171" }}>18+</span>
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Contenu adulte</span>
                  <span className="text-xs max-w-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Aucune image ni lien du site n'est affiché pour les annonces à contenu adulte.
                  </span>
                </div>
              ) : displayImages[activeImg] ? (
                <img src={getListingImageUrl(displayImages[activeImg])} alt={listing.title} className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🏰</span>
                </div>
              )}
            </div>
            {!listing.is_adult && displayImages.length > 1 && (
              <div className="flex gap-2">
                {displayImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all"
                    style={{ border: i === activeImg ? `2px solid ${CITADELLE_COLORS.gold}` : `2px solid ${CITADELLE_COLORS.border}` }}>
                    {img ? <img src={getListingImageUrl(img)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🏰</div>}
                  </button>
                ))}
              </div>
            )}

            {/* Partage de l'annonce */}
            <div className="py-1">
              <ShareBar
                url={`${process.env.REACT_APP_CITADELLE_URL}/api/citadelle/listings/${listing.slug}/share`}
                title={listing.title}
              />
            </div>

            {/* Documents joints */}
            {documents.length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
                <h2 className="font-bold mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Documents joints</h2>
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <a key={i} href={getListingImageUrl(doc)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
                      style={{ background: "rgba(201,164,92,0.06)", border: `1px solid rgba(201,164,92,0.15)` }}
                      data-testid={`listing-document-${i}`}>
                      <FileText size={20} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: CITADELLE_COLORS.blue }}>
                        {doc.split("/").pop()}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(15,39,71,0.06)", color: CITADELLE_COLORS.textMuted }}>
                        {getFileLabel(doc)}
                      </span>
                      <Download size={16} style={{ color: CITADELLE_COLORS.textMuted, flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <h2 className="font-bold mb-4" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Description</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line break-words" style={{ color: CITADELLE_COLORS.textMuted, overflowWrap: "anywhere" }}>{listing.description}</p>
            </div>

            {/* Technologies */}
            {listing.technologies?.length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
                <h2 className="font-bold mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.technologies.map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-lg text-xs font-semibold break-words"
                      style={{ background: "rgba(15,39,71,0.06)", color: CITADELLE_COLORS.blue, overflowWrap: "anywhere", maxWidth: "100%" }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — Infos & CTA */}
          <div className="space-y-4">
            {/* Badge Vérifié La Garde — bannière proéminente */}
            {listing.garde_verified && (
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)",
                  border: "1px solid rgba(201,164,92,0.3)",
                  boxShadow: "0 4px 16px rgba(15,39,71,0.18)",
                }}
                data-testid="garde-verified-banner"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}
                >
                  <ShieldCheck size={22} style={{ color: "#C9A45C" }} />
                </div>
                <div>
                  <p className="font-black text-sm" style={{ color: "#C9A45C", letterSpacing: "0.3px" }}>
                    Vérifié par La Garde
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Identité du vendeur, droits de propriété, revenus et accès contrôlés par notre équipe.
                  </p>
                </div>
              </div>
            )}
            {/* Badges statut */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(15,39,71,0.07)", color: CITADELLE_COLORS.blue }}>
                <TypeIcon size={13} /> {typeLabel}
              </span>
              {listing.is_verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                  <ShieldCheck size={13} /> Vérifié
                </span>
              )}
              {listing.is_featured && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(201,164,92,0.15)", color: CITADELLE_COLORS.gold }}>
                  <Star size={13} /> Recommandé
                </span>
              )}
            </div>

            {/* Titre + Prix */}
            <div className="p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <h1 className="font-black text-xl mb-4 leading-snug" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {listing.title}
              </h1>

              {/* ── Mode ENCHÈRE ── */}
              {listing.is_auction && listing.auction_ends_at ? (
                <div>
                  {/* Timer — uniquement si enchère encore active */}
                  {tempsRestant && listing.status === "active" && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                      <Clock size={14} style={{ color: "#DC2626" }} />
                      <span className="text-xs font-bold" style={{ color: "#DC2626" }}>
                        Enchère en cours — {tempsRestant} restants
                      </span>
                    </div>
                  )}

                  {/* Enchère courante */}
                  <div className="mb-2">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {(listing.auction_bids?.length || 0) === 0 ? "Prix de départ" : "Enchère en cours"}
                    </p>
                    <span className="text-3xl font-black" style={{ color: "#DC2626", fontFamily: "'Montserrat', sans-serif" }}>
                      {(listing.auction_current_bid || listing.price)?.toLocaleString("fr-FR")} €
                    </span>
                    {listing.auction_bids?.length > 0 && (
                      <span className="ml-2 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        ({listing.auction_bids.length} enchère{listing.auction_bids.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                  {/* Signalement discret d'une enchère suspecte (membres connectés) */}
                  {isAuthenticated && listing.status === "active" && (listing.auction_bids?.length || 0) > 0 && (
                    <div className="mb-2">
                      <ReportBidButton listingId={listing.id} />
                    </div>
                  )}
                  {listing.auction_show_reserve && (
                    <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                      Prix de réserve : {listing.price?.toLocaleString("fr-FR")} €
                    </p>
                  )}

                  {/* Prix d'achat immédiat */}
                  {listing.auction_buy_now_price && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <Zap size={13} style={{ color: "#22C55E" }} />
                      <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        Achat immédiat : <strong style={{ color: CITADELLE_COLORS.blue }}>{listing.auction_buy_now_price.toLocaleString("fr-FR")} €</strong>
                      </span>
                    </div>
                  )}

                  {/* Formulaire enchère */}
                  {listing.status !== "sold" && tempsRestant && isAuthenticated && user?.id !== listing.seller_id && canTransact ? (
                    <div className="space-y-3 mt-4">
                      {bidSuccess ? (
                        <div className="p-3 rounded-xl text-xs text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}>
                          Votre enchère a bien été enregistrée ! Un email de confirmation vous a été envoyé.
                        </div>
                      ) : (
                        <>
                          {bidError && (
                            <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
                              <AlertCircle size={13} /> {bidError}
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                              Votre enchère (€) — minimum {((listing.auction_bids?.length || 0) === 0 ? (listing.auction_current_bid || listing.price) : (listing.auction_current_bid || listing.price) + 10).toLocaleString("fr-FR")} €
                            </label>
                            <input type="number" value={bidAmount} onChange={e => { setBidAmount(e.target.value); setBidError(""); }}
                              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                              data-testid="bid-amount" />
                          </div>
                          <button onClick={async () => {
                            setBidError("");
                            const amount = parseFloat(bidAmount);
                            if (!amount || amount <= 0) { setBidError("Montant invalide"); return; }
                            setBidLoading(true);
                            try {
                              const res = await citadelleApi.post(`/listings/${listing.id}/bid`, { amount });
                              setListing(res.data);
                              setBidSuccess(true);
                              setBidAmount("");
                              setTimeout(() => setBidSuccess(false), 5000);
                            } catch (err) {
                              setBidError(err.response?.data?.detail || "Erreur lors de l'enchère");
                            } finally { setBidLoading(false); }
                          }} disabled={bidLoading}
                            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02] mt-3"
                            style={{ background: "#DC2626", color: "white" }}
                            data-testid="btn-place-bid">
                            {bidLoading ? <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "white" }} />
                              : <><Hammer size={15} /> Enchérir</>}
                          </button>
                          {listing.auction_buy_now_price && (
                            <button onClick={() => setOfferModal(true)}
                              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] mt-3"
                              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                              data-testid="btn-buy-now">
                              <Zap size={14} /> Acheter immédiatement — {listing.auction_buy_now_price.toLocaleString("fr-FR")} €
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : listing.status === "sold" ? (
                    <AnnonceSoldee listing={listing} user={user} />
                  ) : isAuthenticated && !canTransact && user?.id !== listing.seller_id ? (
                    <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", color: "#9A3412" }} data-testid="action-restricted-notice">
                      Actions indisponibles : votre compte fait l'objet d'une sanction. Vous ne pouvez pas enchérir pour le moment.
                    </div>
                  ) : !isAuthenticated ? (
                    <button
                      onClick={() => setAuthModal(true)}
                      className="block w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-[1.02]"
                      style={{ background: "#DC2626", color: "white" }}
                      data-testid="btn-auth-encherir">
                      Se connecter pour enchérir
                    </button>
                  ) : null}
                </div>
              ) : (
                /* ── Mode VENTE CLASSIQUE ── */
                <div>
                  <div className="mb-1">
                    {listing.original_price && listing.original_price > listing.price && (
                      <span className="text-sm line-through mr-2" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {listing.original_price.toLocaleString("fr-FR")} €
                      </span>
                    )}
                    <span className="text-3xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                      {listing.price?.toLocaleString("fr-FR")} €
                    </span>
                  </div>
                  {listing.price_negotiable && <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>Prix négociable</p>}

                  <div className="space-y-2 mt-5">
                    {listing.status === "sold" ? (
                      <AnnonceSoldee listing={listing} user={user} />
                    ) : isAuthenticated && user?.id !== listing.seller_id && canTransact ? (
                      <>
                        <button onClick={() => setOfferModal(true)}
                          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                          data-testid="btn-make-offer">
                          Faire une offre
                        </button>
                        <button onClick={() => setContactModal(true)}
                          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
                          style={{ border: `1px solid ${CITADELLE_COLORS.blue}`, color: CITADELLE_COLORS.blue }}
                          data-testid="btn-contact-seller">
                          Contacter le vendeur
                        </button>
                      </>
                    ) : isAuthenticated && !canTransact && user?.id !== listing.seller_id ? (
                      <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", color: "#9A3412" }} data-testid="action-restricted-notice">
                        Actions indisponibles : votre compte fait l'objet d'une sanction. Vous ne pouvez pas acheter ni faire d'offre pour le moment.
                      </div>
                    ) : !isAuthenticated ? (
                      <button
                        onClick={() => setAuthModal(true)}
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                        data-testid="btn-auth-offre">
                        Se connecter pour faire une offre
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Encart « Annonce à la Une » — visible uniquement par le propriétaire */}
            {isOwner && (
              isBoosted ? (
                <div className="p-4 rounded-2xl flex items-center gap-3" data-testid="owner-boost-active"
                  style={{ background: "linear-gradient(135deg, #0F2747 0%, #1a3a6b 100%)", border: "1px solid rgba(201,164,92,0.3)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
                    <Star size={18} style={{ color: "#C9A45C" }} />
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: "#C9A45C", letterSpacing: "0.3px" }}>Votre annonce est à la Une</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {listing.boost_plan === "until_sale"
                        ? "Mise en avant jusqu'à la vente."
                        : listing.boost_expires_at
                          ? `Mise en avant jusqu'au ${new Date(listing.boost_expires_at).toLocaleDateString("fr-FR")}.`
                          : "Mise en avant active."}
                    </p>
                  </div>
                </div>
              ) : listing.status !== "sold" ? (
                <div className="p-4 rounded-2xl" data-testid="owner-boost-cta"
                  style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.25)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={15} style={{ color: CITADELLE_COLORS.gold }} />
                    <p className="text-sm font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Boostez votre visibilité</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Placez votre annonce dans le carrousel « À la Une » sur l'accueil et la liste des annonces. Dès 19 €.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBoostModal(true)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                    data-testid="btn-boost-listing">
                    <Star size={14} /> Mettre à la Une
                  </button>
                  {ownerUpsellStep === "boost" && (
                    <button
                      type="button"
                      onClick={() => setOwnerUpsellStep("services")}
                      className="w-full mt-2 py-1.5 text-xs font-semibold"
                      style={{ color: CITADELLE_COLORS.textMuted }}
                      data-testid="owner-boost-decline">
                      Non merci
                    </button>
                  )}
                </div>
              ) : null
            )}

            {/* Upsell services vendeur (après refus du boost) */}
            {isOwner && listing.status !== "sold" && ownerUpsellStep === "services" && (
              <SellerServicesUpsell user={user} stacked onDecline={() => setOwnerUpsellStep("done")} />
            )}

            {/* Métriques clés */}
            <div className="p-5 rounded-2xl space-y-3" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>Chiffres clés</h3>
              {[
                { icon: TrendingUp, label: "Revenus mensuels", value: listing.monthly_revenue != null ? `${listing.monthly_revenue.toLocaleString("fr-FR")} €` : "Non communiqué" },
                { icon: BarChart2, label: "Trafic mensuel", value: listing.monthly_traffic != null ? `${listing.monthly_traffic.toLocaleString("fr-FR")} visiteurs` : "Non communiqué" },
                { icon: Calendar, label: "Ancienneté", value: listing.age_months != null ? `${listing.age_months} mois` : "Non communiqué" },
                { icon: Eye, label: "Vues de l'annonce", value: listing.views_count ?? 0 },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                    <Icon size={13} style={{ color: CITADELLE_COLORS.gold }} /> {label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{value}</span>
                </div>
              ))}
            </div>

            {/* URL du site — selon le choix du vendeur */}
            {listing.url_public && listing.url_preview ? (
              <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe size={16} style={{ color: CITADELLE_COLORS.gold }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: CITADELLE_COLORS.textMuted }}>Adresse du site</span>
                </div>
                <a href={listing.url_preview} target="_blank" rel="noopener noreferrer nofollow"
                  className="text-xs font-semibold underline break-all" style={{ color: CITADELLE_COLORS.blue }}
                  data-testid="listing-public-url">
                  {listing.url_preview}
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)` }}>
                <div className="flex items-start gap-3">
                  <Lock size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 2 }} />
                  <p className="text-xs leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }} data-testid="listing-url-hidden-msg">
                    Par choix du vendeur, l'adresse du site reste confidentielle. Elle sera communiquée à l'acheteur dès qu'il manifeste un intérêt sérieux ou à l'entame du processus de vente sécurisé.
                  </p>
                </div>
                {listing.status !== "sold" && user?.id !== listing.seller_id && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) { setAuthModal(true); return; }
                      setContactMessage(`Bonjour, votre annonce « ${listing.title} » m'intéresse. Pourriez-vous me communiquer l'adresse du site afin que je puisse l'étudier plus en détail ? Merci d'avance.`);
                      setContactModal(true);
                    }}
                    className="w-full mt-3 py-2.5 rounded-xl font-semibold text-xs transition-all hover:scale-[1.02]"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                    data-testid="btn-request-url">
                    Demander l'adresse au vendeur
                  </button>
                )}
              </div>
            )}

            {/* Upsell estimations pour l'acheteur — « ce site vaut-il le coup ? » */}
            {!isOwner && listing.status !== "sold" && (
              <SellerServicesUpsell
                user={user}
                stacked
                testid="buyer-estimation-upsell"
                targetServices={BUYER_ESTIMATION_SERVICES}
                heading="Ce site vaut-il le coup ?"
                subheading="Avant d'acheter, faites estimer cette annonce par nos experts pour investir en toute confiance."
                clientMessage={`Estimation acheteur pour l'annonce « ${listing.title} » (réf ${listing.id})`}
                onRequireAuth={() => setAuthModal(true)}
              />
            )}

            {/* Widget estimateur contextuel */}
            <EstimateurSidebar listing={listing} />
          </div>
        </div>
      </div>

      {/* Modal — Faire une offre */}
      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <h3 className="font-bold text-lg mb-1" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              Faire une offre
            </h3>
            <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
              Prix affiché : {listing.price?.toLocaleString("fr-FR")} €
              {listing.price_negotiable && " (négociable)"}
            </p>

            {offerError && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-3" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
                <AlertCircle size={13} /> {offerError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Montant de votre offre (€)</label>
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                  placeholder={`${listing.price}`} min="1"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="offer-amount" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Message au vendeur</label>
                <textarea value={offerMessage} onChange={e => setOfferMessage(e.target.value)} rows={4}
                  placeholder="Présentez-vous et expliquez votre intérêt pour cet actif..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="offer-message" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setOfferModal(false); setOfferError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                Annuler
              </button>
              <button onClick={async () => {
                setOfferError("");
                if (!offerAmount || parseFloat(offerAmount) <= 0) { setOfferError("Montant invalide"); return; }
                if (!offerMessage || offerMessage.length < 10) { setOfferError("Message trop court (min. 10 caractères)"); return; }
                setOfferLoading(true);
                try {
                  const res = await citadelleApi.post("/transactions/offer", {
                    listing_id: listing.id,
                    amount: parseFloat(offerAmount),
                    message: offerMessage
                  });
                  setOfferModal(false);
                  navigate(`/citadelle/espace-membre/transactions/${res.data.id}`);
                } catch (err) {
                  setOfferError(err.response?.data?.detail || "Erreur lors de l'envoi de l'offre");
                } finally { setOfferLoading(false); }
              }} disabled={offerLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="offer-submit">
                {offerLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                ) : (
                  <><Send size={14} /> Envoyer l'offre</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal — Contacter le vendeur */}
      {contactModal && (        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <h3 className="font-bold text-lg mb-1" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              Contacter le vendeur
            </h3>
            <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
              Posez vos questions avant de faire une offre.
            </p>

            {contactError && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-3" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
                <AlertCircle size={13} /> {contactError}
              </div>
            )}

            <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={4}
              placeholder="Bonjour, j'aurais quelques questions sur votre annonce..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
              data-testid="contact-message" />

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setContactModal(false); setContactError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                Annuler
              </button>
              <button onClick={async () => {
                setContactError("");
                if (!contactMessage || contactMessage.trim().length < 1) { setContactError("Veuillez saisir un message"); return; }
                setContactLoading(true);
                try {
                  const res = await citadelleApi.post("/messages/send", {
                    listing_id: listing.id,
                    content: contactMessage.trim()
                  });
                  setContactModal(false);
                  setContactMessage("");
                  // Propose les estimations UNIQUEMENT à la première prise de contact
                  if (res.data.created) {
                    setPendingConversationId(res.data.conversation_id);
                    setEstimationPopup(true);
                  } else {
                    navigate(`/citadelle/espace-membre/messages/${res.data.conversation_id}`);
                  }
                } catch (err) {
                  setContactError(err.response?.data?.detail || "Erreur lors de l'envoi");
                } finally { setContactLoading(false); }
              }} disabled={contactLoading || !contactMessage.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="contact-submit">
                {contactLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                ) : (
                  <><Send size={14} /> Envoyer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'authentification contextuel */}
      <CitadelleAuthModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        onSuccess={() => setAuthModal(false)}
        listingTitle={listing?.title}
      />

      {/* Modal — Mettre l'annonce à la Une (propriétaire) */}
      <BoostModal
        isOpen={boostModal}
        onClose={() => setBoostModal(false)}
        listingId={listing?.id}
        listingTitle={listing?.title}
      />

      {/* Pop-up — proposition d'estimation à l'entame d'une conversation */}
      {estimationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)" }} data-testid="contact-estimation-popup">
          <div className="w-full max-w-lg my-8">
            <SellerServicesUpsell
              user={user}
              testid="contact-estimation-upsell"
              targetServices={BUYER_ESTIMATION_SERVICES}
              heading="Votre message est bien parti !"
              subheading="Avant d'investir, assurez-vous que ce site tient toutes ses promesses. Nos experts de La Garde en estiment la vraie valeur — pour négocier et acheter en toute sérénité."
              clientMessage={`Estimation acheteur pour l'annonce « ${listing.title} » (réf ${listing.id})`}
              onRequireAuth={() => setAuthModal(true)}
              onDecline={() => {
                setEstimationPopup(false);
                if (pendingConversationId) navigate(`/citadelle/espace-membre/messages/${pendingConversationId}`);
              }}
            />
          </div>
        </div>
      )}
    </CitadelleLayout>
  );
}

// ── Composant : widget estimateur contextuel ─────────────────────────────────

const ESTIM_TYPE_MAP = {
  website: "contenu", ecommerce: "ecommerce", saas: "saas", webapp: "saas",
  social_account: "social", domain: "contenu",
  shopify_store: "ecommerce", amazon_fba: "ecommerce",
  newsletter: "contenu", youtube_channel: "social", instagram: "social",
  tiktok: "social", linkedin_page: "social", discord_server: "social",
  forum: "contenu", blog: "contenu", online_media: "contenu",
  ai_automation: "saas", template_plugin: "saas", database_api: "saas",
};

const ESTIM_MULTIPLES = {
  saas:      { low: 14, high: 26, label: "SaaS / App" },
  ecommerce: { low: 12, high: 22, label: "E-commerce" },
  contenu:   { low: 12, high: 20, label: "Contenu / Blog" },
  social:    { low: 5,  high: 12, label: "Réseau social" },
};

function EstimateurSidebar({ listing }) {
  const [revenue, setRevenue] = useState(listing.monthly_revenue > 0 ? String(listing.monthly_revenue) : "");
  const [result, setResult]   = useState(null);

  const estType   = ESTIM_TYPE_MAP[listing.type] || "contenu";
  const { low, high, label } = ESTIM_MULTIPLES[estType];
  const fmt = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " €";

  const calculate = () => {
    const rev = parseFloat(revenue);
    if (!rev || rev <= 0) return;
    setResult({ low: Math.round(rev * low), high: Math.round(rev * high) });
  };

  return (
    <div className="p-5 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
      data-testid="estimateur-sidebar">
      {/* En-tête */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={15} style={{ color: CITADELLE_COLORS.gold }} />
        <h3 className="text-sm font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
          Vous avez un actif similaire ?
        </h3>
      </div>
      <p className="text-xs mb-4 pl-[23px]" style={{ color: CITADELLE_COLORS.textMuted }}>
        Estimez sa valeur en quelques secondes — méthode SDE ({label}).
      </p>

      {/* Input bénéfice */}
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
          Bénéfice net mensuel (€)
        </label>
        <input
          type="number" min="1" value={revenue}
          onChange={e => { setRevenue(e.target.value); setResult(null); }}
          placeholder="Ex : 1 500"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: CITADELLE_COLORS.bg,
            border: `1px solid ${result ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
            color: CITADELLE_COLORS.blue,
          }}
          data-testid="quick-estimator-revenue"
        />
      </div>

      {/* Résultat ou bouton */}
      {result ? (
        <div className="mb-3 p-3 rounded-xl text-center"
          style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.25)" }}>
          <p className="text-xs mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>Fourchette de valorisation</p>
          <p className="text-lg font-black leading-tight" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            {fmt(result.low)} — {fmt(result.high)}
          </p>
          <p className="text-xs mt-1.5" style={{ color: CITADELLE_COLORS.textMuted }}>
            Multiple SDE × {low} – × {high} (ancienneté 1–3 ans)
          </p>
          <button onClick={() => setResult(null)} className="mt-2 text-xs underline" style={{ color: CITADELLE_COLORS.textMuted }}>
            Recalculer
          </button>
        </div>
      ) : (
        <button onClick={calculate}
          className="w-full py-2.5 rounded-xl text-sm font-semibold mb-3 transition-all hover:scale-[1.02]"
          style={{ background: CITADELLE_COLORS.blue, color: "white" }}
          data-testid="quick-estimator-btn">
          Calculer
        </button>
      )}

      {/* CTA estimation pro */}
      <Link to="/citadelle/estimation"
        className="block w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-all hover:scale-[1.02]"
        style={{ background: "rgba(201,164,92,0.08)", border: `1px solid rgba(201,164,92,0.3)`, color: CITADELLE_COLORS.blue }}
        data-testid="quick-estimator-pro-link">
        Estimation pro gratuite — 48h →
      </Link>
    </div>
  );
}

// ── Composant : annonce vendue (gagnant ou autres) ───────────────────────────
function AnnonceSoldee({ listing, user }) {
  const isWinner = user && listing.auction_winner_transaction_id &&
    listing.auction_current_bidder_id === user.id;

  if (isWinner) {
    return (
      <div className="p-4 rounded-xl mt-2" style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.3)" }}>
        <p className="text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.gold }}>Félicitations, vous avez remporté l'enchère !</p>
        <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
          Montant : {listing.auction_current_bid?.toLocaleString("fr-FR")} €
        </p>
        <Link to={`/citadelle/espace-membre/transactions/${listing.auction_winner_transaction_id}`}
          className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all hover:scale-[1.02]"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="btn-winner-pay">
          Procéder au paiement
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl text-center" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
      <p className="text-sm font-bold" style={{ color: "#DC2626" }}>Site vendu</p>
      <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>Ce site a trouvé son acquéreur.</p>
      <Link to="/citadelle/annonces"
        className="inline-block mt-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
        Voir les autres annonces
      </Link>
    </div>
  );
}
