/**
 * Page détail annonce — La Citadelle Numérique
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Globe, ShoppingCart, Cloud, Monitor, Users, TrendingUp, BarChart2,
  Calendar, ShieldCheck, Star, ArrowLeft, Eye, Share2, Lock
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_CONFIG = {
  website:        { label: "Site internet",    icon: Globe },
  ecommerce:      { label: "E-commerce",       icon: ShoppingCart },
  saas:           { label: "SaaS",             icon: Cloud },
  webapp:         { label: "Application web",  icon: Monitor },
  social_account: { label: "Réseau social",    icon: Users },
};

export default function CitadelleListingDetail() {
  const { slug } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [slug]);

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

  const { label: typeLabel, icon: TypeIcon } = TYPE_CONFIG[listing.type] || TYPE_CONFIG.website;
  const images = listing.images?.length ? listing.images : [null];

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche — Images + Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image principale */}
            <div className="rounded-2xl overflow-hidden" style={{ height: "320px", background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🏰</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all"
                    style={{ border: i === activeImg ? `2px solid ${CITADELLE_COLORS.gold}` : `2px solid ${CITADELLE_COLORS.border}` }}>
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🏰</div>}
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <h2 className="font-bold mb-4" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Description</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: CITADELLE_COLORS.textMuted }}>{listing.description}</p>
            </div>

            {/* Technologies */}
            {listing.technologies?.length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
                <h2 className="font-bold mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.technologies.map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(15,39,71,0.06)", color: CITADELLE_COLORS.blue }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — Infos & CTA */}
          <div className="space-y-4">
            {/* Badges */}
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
              <div className="mb-1">
                <span className="text-3xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                  {listing.price?.toLocaleString("fr-FR")} €
                </span>
              </div>
              {listing.price_negotiable && <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>Prix négociable</p>}

              {/* CTA Phase C */}
              <div className="space-y-2 mt-5">
                <button disabled className="w-full py-3 rounded-xl font-bold text-sm opacity-60 cursor-not-allowed"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                  Faire une offre — Phase C
                </button>
                <button disabled className="w-full py-3 rounded-xl font-semibold text-sm opacity-60 cursor-not-allowed"
                  style={{ border: `1px solid ${CITADELLE_COLORS.blue}`, color: CITADELLE_COLORS.blue }}>
                  Contacter le vendeur — Phase C
                </button>
              </div>
            </div>

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

            {/* URL masquée */}
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)` }}>
              <Lock size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
                L'URL du site est disponible après initiation d'une transaction sécurisée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CitadelleLayout>
  );
}
