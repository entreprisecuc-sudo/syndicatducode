/**
 * ServiceDetailModal — La Citadelle Numérique
 * Modale d'affichage du détail d'un service
 */

import { X, Handshake, ShoppingCart, ExternalLink } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const isPayable = (svc) => svc.service_type === "paid" && svc.price > 0;

export default function ServiceDetailModal({ service, onClose, onBuy }) {
  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-6 rounded-2xl max-h-[80vh] overflow-y-auto"
        style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
        data-testid="service-detail-modal"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <h2
            className="font-bold text-xl pr-4"
            style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
          >
            {service.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg flex-shrink-0"
            style={{ color: CITADELLE_COLORS.textMuted }}
            data-testid="service-detail-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description complète */}
        <p
          className="text-sm leading-relaxed mb-6 whitespace-pre-line"
          style={{ color: CITADELLE_COLORS.textMuted }}
        >
          {service.description}
        </p>

        {/* Prix */}
        {service.price_label ? (
          <p className="text-lg font-bold mb-4" style={{ color: CITADELLE_COLORS.blue }}>
            {service.price_label}
          </p>
        ) : service.price != null ? (
          <p
            className="text-2xl font-black mb-4"
            style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
          >
            {service.price > 0 ? `${service.price.toLocaleString("fr-FR")} €` : "Gratuit"}
          </p>
        ) : null}

        {/* Badge partenaire */}
        {service.partner_name && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-4"
            style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}
          >
            <Handshake size={15} style={{ color: "#3B82F6" }} />
            <span className="text-sm" style={{ color: "#3B82F6" }}>
              Service partenaire — {service.partner_name}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
          >
            Fermer
          </button>

          {isPayable(service) ? (
            <button
              onClick={() => onBuy(service)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="detail-modal-buy-btn"
            >
              <ShoppingCart size={13} />
              Acheter — {service.price.toLocaleString("fr-FR")} €
            </button>
          ) : service.cta_url ? (
            <a
              href={service.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            >
              {service.cta_label} <ExternalLink size={13} />
            </a>
          ) : (
            <a
              href={`mailto:atelier@syndicatducode.fr?subject=Service: ${service.title}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            >
              Nous contacter
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
