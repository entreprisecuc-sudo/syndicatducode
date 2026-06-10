/**
 * Services — La Citadelle Numérique
 * Catalogue de services complémentaires pour acheteurs et vendeurs
 */

import { useState, useEffect } from "react";
import { Star, Handshake, Zap, Shield, ExternalLink, ArrowRight } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_ICONS = {
  paid: Zap,
  free: Star,
  partner: Handshake,
  quote: Shield,
};

const TYPE_LABELS = {
  paid: "Payant",
  free: "Gratuit",
  partner: "Partenaire",
  quote: "Sur devis",
};

export default function CitadelleServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    citadelleApi.get("/services").then(res => {
      setServices(res.data.services || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <CitadelleLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12" data-testid="citadelle-services">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            Nos services
          </h1>
          <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: CITADELLE_COLORS.textMuted }}>
            Des services complémentaires pour sécuriser vos transactions et optimiser la valeur de vos actifs numériques.
          </p>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />)}
          </div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center">
            <Star size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.2 }} />
            <p className="text-lg font-semibold" style={{ color: CITADELLE_COLORS.textMuted }}>Services bientôt disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => {
              const TypeIcon = TYPE_ICONS[svc.service_type] || Star;
              return (
                <div key={svc.id}
                  className="p-6 rounded-2xl flex flex-col transition-all hover:-translate-y-1"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`service-card-${svc.id}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,92,0.1)" }}>
                      <TypeIcon size={20} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                    {svc.service_type === "partner" && svc.partner_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                        {svc.partner_name}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-base mb-2" style={{ color: CITADELLE_COLORS.blue }}>
                    {svc.title}
                  </h3>
                  <p className="text-sm flex-1 mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {svc.short_description || svc.description?.substring(0, 120)}
                  </p>

                  {/* Prix */}
                  <div className="mb-4">
                    {svc.price_label ? (
                      <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>{svc.price_label}</span>
                    ) : svc.price != null ? (
                      <span className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                        {svc.price > 0 ? `${svc.price.toLocaleString("fr-FR")} €` : "Gratuit"}
                      </span>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {TYPE_LABELS[svc.service_type]}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedService(svc)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                      style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                      {svc.cta_label || "En savoir plus"} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal détail service */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg p-6 rounded-2xl max-h-[80vh] overflow-y-auto" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-bold text-xl" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {selectedService.title}
              </h2>
              <button onClick={() => setSelectedService(null)} className="p-1 rounded-lg" style={{ color: CITADELLE_COLORS.textMuted }}>
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <p className="text-sm leading-relaxed mb-6 whitespace-pre-line" style={{ color: CITADELLE_COLORS.textMuted }}>
              {selectedService.description}
            </p>

            {selectedService.price_label && (
              <p className="text-lg font-bold mb-4" style={{ color: CITADELLE_COLORS.blue }}>{selectedService.price_label}</p>
            )}
            {!selectedService.price_label && selectedService.price != null && (
              <p className="text-2xl font-black mb-4" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {selectedService.price > 0 ? `${selectedService.price.toLocaleString("fr-FR")} €` : "Gratuit"}
              </p>
            )}

            {selectedService.partner_name && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <Handshake size={15} style={{ color: "#3B82F6" }} />
                <span className="text-sm" style={{ color: "#3B82F6" }}>Service partenaire — {selectedService.partner_name}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSelectedService(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                Fermer
              </button>
              {selectedService.cta_url ? (
                <a href={selectedService.cta_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                  {selectedService.cta_label} <ExternalLink size={13} />
                </a>
              ) : (
                <a href={`mailto:atelier@syndicatducode.fr?subject=Service: ${selectedService.title}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                  Nous contacter
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </CitadelleLayout>
  );
}
