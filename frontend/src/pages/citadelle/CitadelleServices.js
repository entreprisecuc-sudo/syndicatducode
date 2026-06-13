/**
 * Page Services — La Citadelle Numérique
 * Layout :
 *   1. Hero — Transaction Sécurisée (commun)
 *   2. Deux zones immersives distinctes côte à côte : Vendeurs (dark) | Acheteurs (light)
 */

import { useState, useEffect } from "react";
import { Star, Handshake, Zap, Shield, ShoppingCart, ArrowRight, TrendingUp, Search } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import ServiceDetailModal from "@/components/citadelle/ServiceDetailModal";
import ServiceCheckoutModal from "@/components/citadelle/ServiceCheckoutModal";
import ServiceHeroBanner from "@/components/citadelle/ServiceHeroBanner";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// ── Icônes par type de service ─────────────────────────────────────────────────
const TYPE_ICONS = { paid: Zap, free: Star, partner: Handshake, quote: Shield };

const isPayable = (svc) => svc.service_type === "paid" && svc.price > 0;


// ── Carte pour la zone VENDEURS (fond sombre) ─────────────────────────────────

function DarkServiceCard({ svc, index, onDetails, onBuy }) {
  const TypeIcon = TYPE_ICONS[svc.service_type] || Star;
  const payable = isPayable(svc);

  return (
    <div
      className="group p-5 rounded-xl flex flex-col gap-4 transition-all duration-200 hover:translate-y-[-2px] cursor-default"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(201,164,92,0.18)",
      }}
      data-testid={`service-card-${svc.id}`}
    >
      {/* Numéro + Icône */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-black"
            style={{ color: "rgba(201,164,92,0.5)", fontFamily: "'Montserrat', sans-serif", letterSpacing: "1px" }}
          >
            0{index + 1}
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(201,164,92,0.12)" }}
          >
            <TypeIcon size={15} style={{ color: CITADELLE_COLORS.gold }} />
          </div>
        </div>
        {/* Badge type */}
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
          style={{
            background: "rgba(201,164,92,0.12)",
            color: CITADELLE_COLORS.gold,
            border: "1px solid rgba(201,164,92,0.2)",
          }}
        >
          {svc.price_label || (svc.price > 0 ? `${svc.price.toLocaleString("fr-FR")} €` : svc.price === 0 ? "Gratuit" : "Sur devis")}
        </span>
      </div>

      {/* Séparateur doré */}
      <div className="h-px" style={{ background: "rgba(201,164,92,0.15)" }} />

      {/* Titre + Description */}
      <div>
        <h3 className="font-bold text-sm mb-1.5" style={{ color: "white" }}>
          {svc.title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          {svc.short_description || svc.description?.substring(0, 90)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onDetails(svc)}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/10"
          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
          data-testid={`service-details-btn-${svc.id}`}
        >
          Détails
        </button>
        {payable ? (
          <button
            onClick={() => onBuy(svc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid={`service-buy-btn-${svc.id}`}
          >
            <ShoppingCart size={11} /> Acheter
          </button>
        ) : (
          <button
            onClick={() => onDetails(svc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          >
            Voir <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}


// ── Carte pour la zone ACHETEURS (fond clair) ─────────────────────────────────

function LightServiceCard({ svc, index, onDetails, onBuy }) {
  const TypeIcon = TYPE_ICONS[svc.service_type] || Star;
  const payable = isPayable(svc);

  return (
    <div
      className="group p-5 rounded-xl flex flex-col gap-4 transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px]"
      style={{
        background: "white",
        border: `1px solid ${CITADELLE_COLORS.border}`,
        boxShadow: "0 2px 8px rgba(15,39,71,0.06)",
      }}
      data-testid={`service-card-${svc.id}`}
    >
      {/* Numéro + Icône */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-black"
            style={{ color: "rgba(201,164,92,0.4)", fontFamily: "'Montserrat', sans-serif", letterSpacing: "1px" }}
          >
            0{index + 1}
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(15,39,71,0.06)" }}
          >
            <TypeIcon size={15} style={{ color: CITADELLE_COLORS.blue }} />
          </div>
        </div>
        {/* Badge type */}
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
          style={{
            background: "rgba(15,39,71,0.06)",
            color: CITADELLE_COLORS.blue,
            border: `1px solid ${CITADELLE_COLORS.border}`,
          }}
        >
          {svc.price_label || (svc.price > 0 ? `${svc.price.toLocaleString("fr-FR")} €` : svc.price === 0 ? "Gratuit" : "Sur devis")}
        </span>
      </div>

      {/* Séparateur */}
      <div className="h-px" style={{ background: CITADELLE_COLORS.border }} />

      {/* Titre + Description */}
      <div>
        <h3 className="font-bold text-sm mb-1.5" style={{ color: CITADELLE_COLORS.blue }}>
          {svc.title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
          {svc.short_description || svc.description?.substring(0, 90)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onDetails(svc)}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-70"
          style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.textMuted }}
          data-testid={`service-details-btn-${svc.id}`}
        >
          Détails
        </button>
        {payable ? (
          <button
            onClick={() => onBuy(svc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid={`service-buy-btn-${svc.id}`}
          >
            <ShoppingCart size={11} /> Acheter
          </button>
        ) : (
          <button
            onClick={() => onDetails(svc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          >
            Voir <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}


// ── Squelette chargement ──────────────────────────────────────────────────────

function SkeletonLoading() {
  return (
    <div className="space-y-8">
      <div className="h-52 rounded-2xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden">
        <div className="h-96 animate-pulse" style={{ background: "#0F2747", opacity: 0.3 }} />
        <div className="h-96 animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
      </div>
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

  const commonService  = services.find((s) => (s.target_category || "commun") === "commun");
  const vendorServices = services.filter((s) => s.target_category === "vendeur");
  const buyerServices  = services.filter((s) => s.target_category === "acheteur");

  const openBuy = (svc) => {
    setSelectedService(null);
    setCheckoutService(svc);
  };

  return (
    <CitadelleLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12" data-testid="citadelle-services">

        {/* En-tête */}
        <div className="text-center mb-12">
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

        {loading ? (
          <SkeletonLoading />
        ) : (
          <div className="space-y-8">

            {/* 1. Transaction Sécurisée — hero pleine largeur */}
            {commonService && (
              <ServiceHeroBanner
                service={commonService}
                onDetails={setSelectedService}
              />
            )}

            {/* 2. Vendeurs (dark) — pleine largeur */}
            {vendorServices.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: CITADELLE_COLORS.blue }}
              >
                <div
                  className="px-8 py-7"
                  style={{ borderBottom: "1px solid rgba(201,164,92,0.2)" }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(201,164,92,0.15)" }}
                    >
                      <TrendingUp size={18} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                    <h2
                      className="text-xl font-black"
                      style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Pour les vendeurs
                    </h2>
                  </div>
                  <p className="text-xs pl-12" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Évaluez, optimisez et valorisez votre projet avant la vente.
                  </p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorServices.map((svc, i) => (
                    <DarkServiceCard
                      key={svc.id}
                      svc={svc}
                      index={i}
                      onDetails={setSelectedService}
                      onBuy={openBuy}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Acheteurs (light) — pleine largeur */}
            {buyerServices.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#FAFBFD", border: `1px solid ${CITADELLE_COLORS.border}` }}
              >
                <div
                  className="px-8 py-7"
                  style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(201,164,92,0.1)" }}
                    >
                      <Search size={18} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                    <h2
                      className="text-xl font-black"
                      style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Pour les acheteurs
                    </h2>
                  </div>
                  <p className="text-xs pl-12" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Sécurisez votre investissement avant et après l'acquisition.
                  </p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {buyerServices.map((svc, i) => (
                    <LightServiceCard
                      key={svc.id}
                      svc={svc}
                      index={i}
                      onDetails={setSelectedService}
                      onBuy={openBuy}
                    />
                  ))}
                </div>
              </div>
            )}

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
