/**
 * Page Services — La Citadelle Numérique
 * Catalogue de services organisé par catégorie cible (vendeur / acheteur / commun)
 */

import { useState, useEffect } from "react";
import { Star, Handshake, Zap, Shield, ShoppingCart, ArrowRight } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import ServiceDetailModal from "@/components/citadelle/ServiceDetailModal";
import ServiceCheckoutModal from "@/components/citadelle/ServiceCheckoutModal";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, SERVICE_TARGET_SECTIONS } from "@/config/citadelleConstants";

// ── Icônes par type de service ─────────────────────────────────────────────────
const TYPE_ICONS = { paid: Zap, free: Star, partner: Handshake, quote: Shield };

// ── Labels badge par type ──────────────────────────────────────────────────────
const TYPE_BADGE = {
  paid:    { label: "Payant",    bg: "rgba(201,164,92,0.12)",  color: "#C9A45C" },
  free:    { label: "Gratuit",   bg: "rgba(34,197,94,0.10)",   color: "#16A34A" },
  partner: { label: "Partenaire",bg: "rgba(59,130,246,0.10)",  color: "#3B82F6" },
  quote:   { label: "Sur devis", bg: "rgba(100,116,139,0.10)", color: "#64748B" },
};

// Un service est achetable directement s'il est payant et a un prix positif
const isPayable = (svc) => svc.service_type === "paid" && svc.price > 0;


// ── Carte service individuelle ────────────────────────────────────────────────

function ServiceCard({ svc, onDetails, onBuy }) {
  const TypeIcon = TYPE_ICONS[svc.service_type] || Star;
  const badge = TYPE_BADGE[svc.service_type];
  const payable = isPayable(svc);

  return (
    <div
      className="p-6 rounded-2xl flex flex-col transition-all hover:-translate-y-1 hover:shadow-md"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
      data-testid={`service-card-${svc.id}`}
    >
      {/* Icône + badge type */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(201,164,92,0.1)" }}
        >
          <TypeIcon size={20} style={{ color: CITADELLE_COLORS.gold }} />
        </div>
        {badge && (
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Titre */}
      <h3 className="font-bold text-base mb-2" style={{ color: CITADELLE_COLORS.blue }}>
        {svc.title}
      </h3>

      {/* Description courte */}
      <p className="text-sm flex-1 mb-4 leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
        {svc.short_description || svc.description?.substring(0, 100)}
      </p>

      {/* Prix */}
      <div className="mb-4">
        {svc.price_label ? (
          <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>
            {svc.price_label}
          </span>
        ) : svc.price != null ? (
          <span
            className="text-xl font-black"
            style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
          >
            {svc.price > 0 ? `${svc.price.toLocaleString("fr-FR")} €` : "Gratuit"}
          </span>
        ) : null}
      </div>

      {/* Boutons CTA */}
      <div className="flex gap-2">
        <button
          onClick={() => onDetails(svc)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
          data-testid={`service-details-btn-${svc.id}`}
        >
          Détails
        </button>

        {payable ? (
          <button
            onClick={() => onBuy(svc)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid={`service-buy-btn-${svc.id}`}
          >
            <ShoppingCart size={13} />
            Acheter — {svc.price.toLocaleString("fr-FR")} €
          </button>
        ) : (
          <button
            onClick={() => onDetails(svc)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          >
            {svc.cta_label || "En savoir plus"} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}


// ── Squelette de chargement ───────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-56 rounded-2xl animate-pulse"
          style={{ background: CITADELLE_COLORS.bg }}
        />
      ))}
    </div>
  );
}


// ── Page principale ───────────────────────────────────────────────────────────

export default function CitadelleServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [checkoutService, setCheckoutService] = useState(null);

  useEffect(() => {
    citadelleApi
      .get("/services")
      .then((res) => setServices(res.data.services || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Groupage par section cible (ordre conservé grâce à SERVICE_TARGET_SECTIONS)
  const sections = SERVICE_TARGET_SECTIONS.map((section) => ({
    ...section,
    items: services.filter((svc) => (svc.target_category || "commun") === section.key),
  })).filter((section) => section.items.length > 0);

  const openBuy = (svc) => {
    setSelectedService(null);
    setCheckoutService(svc);
  };

  return (
    <CitadelleLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12" data-testid="citadelle-services">

        {/* En-tête de page */}
        <div className="text-center mb-14">
          <h1
            className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}
          >
            Nos services
          </h1>
          <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: CITADELLE_COLORS.textMuted }}>
            Des services complémentaires pour sécuriser vos transactions et optimiser la valeur de vos actifs numériques.
          </p>
        </div>

        {/* Contenu */}
        {loading ? (
          <SkeletonGrid />
        ) : services.length === 0 ? (
          <div className="py-20 text-center">
            <Star size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.2 }} />
            <p className="text-lg font-semibold" style={{ color: CITADELLE_COLORS.textMuted }}>
              Services bientôt disponibles
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {sections.map((section) => (
              <section key={section.key} data-testid={`services-section-${section.key}`}>
                {/* En-tête de section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-1 h-7 rounded-full"
                      style={{ background: CITADELLE_COLORS.gold }}
                    />
                    <h2
                      className="text-xl font-black"
                      style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {section.label}
                    </h2>
                  </div>
                  <p className="text-sm pl-4 ml-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {section.subtitle}
                  </p>
                </div>

                {/* Grille de cartes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((svc) => (
                    <ServiceCard
                      key={svc.id}
                      svc={svc}
                      onDetails={setSelectedService}
                      onBuy={openBuy}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBuy={openBuy}
      />
      <ServiceCheckoutModal
        service={checkoutService}
        onClose={() => setCheckoutService(null)}
      />
    </CitadelleLayout>
  );
}
