/**
 * Carte annonce — La Citadelle Numérique
 * Composant réutilisable pour la liste et les suggestions
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Globe, ShoppingCart, Cloud, Monitor, Users, TrendingUp, TrendingDown, BarChart2, Calendar, ShieldCheck, Star, Hammer, Clock } from "lucide-react";
import { CITADELLE_COLORS, getListingImageUrl, isImageFile } from "@/config/citadelleConstants";

const TYPE_CONFIG = {
  website:       { label: "Site internet",    icon: Globe },
  ecommerce:     { label: "E-commerce",       icon: ShoppingCart },
  saas:          { label: "SaaS",             icon: Cloud },
  webapp:        { label: "Application web",  icon: Monitor },
  social_account:{ label: "Réseau social",    icon: Users },
};

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' fill='%230F2747'%3E%3Crect width='400' height='240'/%3E%3Ctext x='50%25' y='50%25' fill='%23C9A45C' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E🏰%3C/text%3E%3C/svg%3E";

export default function ListingCard({ listing }) {
  const { label: typeLabel, icon: TypeIcon } = TYPE_CONFIG[listing.type] || TYPE_CONFIG.website;
  const firstImage = listing.images?.filter(Boolean).find(img => isImageFile(img));
  const mainImage = firstImage ? getListingImageUrl(firstImage) : PLACEHOLDER_IMG;
  const isSold = listing.status === "sold";

  // Calcul du temps restant pour les enchères
  const tempsRestant = useTempsRestant(listing.is_auction ? listing.auction_ends_at : null);

  // Wrapper conditionnel : div non cliquable si vendu, Link sinon
  const Wrapper = isSold
    ? ({ children }) => (
        <div
          className="block rounded-2xl overflow-hidden"
          style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 2px 8px rgba(15,39,71,0.05)", cursor: "default" }}
          data-testid={`listing-card-${listing.slug}`}
        >{children}</div>
      )
    : ({ children }) => (
        <Link
          to={`/citadelle/annonces/${listing.slug}`}
          className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
          style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 2px 8px rgba(15,39,71,0.05)" }}
          data-testid={`listing-card-${listing.slug}`}
        >{children}</Link>
      );

  return (
    <Wrapper>
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "160px" }}>
        <img
          src={mainImage}
          alt={listing.title}
          className={`w-full h-full object-cover transition-transform duration-300 ${!isSold ? "group-hover:scale-105" : ""}`}
          style={{ filter: isSold ? "grayscale(40%)" : "none" }}
          onError={e => { e.target.src = PLACEHOLDER_IMG; }}
        />
        {/* Bandeau VENDU diagonal */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            <div style={{
              background: "#DC2626",
              color: "white",
              fontSize: "18px",
              fontWeight: "900",
              letterSpacing: "6px",
              padding: "10px 32px",
              transform: "rotate(-12deg)",
              boxShadow: "0 4px 24px rgba(220,38,38,0.6)",
              fontFamily: "'Montserrat', sans-serif",
              border: "2px solid rgba(255,255,255,0.3)",
              textTransform: "uppercase",
            }}>
              VENDU
            </div>
          </div>
        )}
        {/* Badges overlay (masqués si vendu) */}
        {!isSold && (
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: CITADELLE_COLORS.night, color: CITADELLE_COLORS.gold }}>
              <TypeIcon size={11} />
              {typeLabel}
            </span>
            {listing.is_featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                <Star size={11} />
                Recommandé
              </span>
            )}
          </div>
        )}
        {/* Badge enchère — pleine largeur, bas de l'image, doré */}
        {!isSold && listing.is_auction && listing.auction_ends_at && tempsRestant && (
          <div className="absolute bottom-0 left-0 right-0">
            <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-black w-full justify-center"
              style={{
                background: CITADELLE_COLORS.gold,
                color: CITADELLE_COLORS.night,
                letterSpacing: "0.04em",
              }}
              data-testid={`listing-auction-badge-${listing.slug}`}>
              <Hammer size={11} />
              ENCHÈRE — {tempsRestant}
            </span>
          </div>
        )}
        {!isSold && listing.is_verified && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "#22C55E", color: "white" }}>
              <ShieldCheck size={11} />
              Vérifié
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4" style={{ opacity: isSold ? 0.65 : 1 }}>
        <h3 className="font-bold text-sm mb-2 line-clamp-2 leading-snug" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
          {listing.title}
        </h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: CITADELLE_COLORS.textMuted }}>
          {listing.short_description}
        </p>

        {/* Prix */}
        <div className="mb-3">
          {listing.original_price && listing.original_price > listing.price && !isSold && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs line-through" style={{ color: CITADELLE_COLORS.textMuted }}>
                {listing.original_price.toLocaleString("fr-FR")} €
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}
                data-testid={`listing-price-drop-${listing.slug}`}>
                <TrendingDown size={11} />
                Prix en baisse
              </span>
            </div>
          )}
          <span className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            {listing.price?.toLocaleString("fr-FR")} €
          </span>
          {listing.price_negotiable && !isSold && (
            <span className="ml-2 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>Négociable</span>
          )}
        </div>

        {/* Métriques clés */}
        <div className="flex gap-3 flex-wrap mb-3">
          {listing.monthly_revenue != null && (
            <div className="flex items-center gap-1 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              <TrendingUp size={12} style={{ color: CITADELLE_COLORS.gold }} />
              {listing.monthly_revenue.toLocaleString("fr-FR")} €/mois
            </div>
          )}
          {listing.monthly_traffic != null && (
            <div className="flex items-center gap-1 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              <BarChart2 size={12} style={{ color: CITADELLE_COLORS.gold }} />
              {listing.monthly_traffic.toLocaleString("fr-FR")} visiteurs
            </div>
          )}
          {listing.age_months != null && (
            <div className="flex items-center gap-1 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              <Calendar size={12} style={{ color: CITADELLE_COLORS.gold }} />
              {listing.age_months} mois
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
          <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
            {listing.published_at ? new Date(listing.published_at).toLocaleDateString("fr-FR") : "Récent"}
          </span>
          {isSold ? (
            <span className="text-xs font-bold" style={{ color: "#DC2626" }}>Vendu</span>
          ) : (
            <span className="text-xs font-semibold transition-colors group-hover:underline" style={{ color: CITADELLE_COLORS.gold }}>
              Voir l'annonce →
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

// ── Hook : compte à rebours dynamique (seconde par seconde) ─────────────────

function useTempsRestant(auctionEndsAt) {
  const [reste, setReste] = useState(() => calculerTempsRestant(auctionEndsAt));

  useEffect(() => {
    if (!auctionEndsAt) return;
    // Mise à jour à la seconde pour un décompte vivant
    const interval = setInterval(() => {
      const r = calculerTempsRestant(auctionEndsAt);
      setReste(r);
      if (!r) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [auctionEndsAt]);

  return reste;
}

function calculerTempsRestant(auctionEndsAt) {
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
}
