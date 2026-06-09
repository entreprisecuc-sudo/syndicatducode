/**
 * Carte annonce — La Citadelle Numérique
 * Composant réutilisable pour la liste et les suggestions
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ShoppingCart, Cloud, Monitor, Users, TrendingUp, BarChart2, Calendar, ShieldCheck, Star } from "lucide-react";
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
  // Ne retenir que les images pour l'aperçu de la carte
  const firstImage = listing.images?.filter(Boolean).find(img => isImageFile(img));
  const mainImage = firstImage ? getListingImageUrl(firstImage) : PLACEHOLDER_IMG;

  return (
    <Link
      to={`/citadelle/annonces/${listing.slug}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 2px 8px rgba(15,39,71,0.05)" }}
      data-testid={`listing-card-${listing.slug}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "160px" }}>
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { e.target.src = PLACEHOLDER_IMG; }}
        />
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
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
        {listing.is_verified && (
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
      <div className="p-4">
        <h3 className="font-bold text-sm mb-2 line-clamp-2 leading-snug" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
          {listing.title}
        </h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: CITADELLE_COLORS.textMuted }}>
          {listing.short_description}
        </p>

        {/* Prix */}
        <div className="mb-3">
          <span className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            {listing.price?.toLocaleString("fr-FR")} €
          </span>
          {listing.price_negotiable && (
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
          <span className="text-xs font-semibold transition-colors group-hover:underline" style={{ color: CITADELLE_COLORS.gold }}>
            Voir l'annonce →
          </span>
        </div>
      </div>
    </Link>
  );
}
