/**
 * ServiceHeroBanner — La Citadelle Numérique
 * Affichage premium du service "Transaction Sécurisée" en tête de page
 */

import { Shield, Info } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const ETAPES = [
  { num: "1", label: "Paiement acheteur" },
  { num: "2", label: "Fonds sécurisés" },
  { num: "3", label: "Transmission projet" },
  { num: "4", label: "Validation transfert" },
  { num: "5", label: "Libération des fonds" },
];

export default function ServiceHeroBanner({ service, onDetails }) {
  if (!service) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-14"
      style={{ background: CITADELLE_COLORS.blue }}
      data-testid="service-hero-banner"
    >
      {/* Bandeau "Obligatoire" */}
      <div
        className="px-6 py-2 flex items-center justify-center gap-2"
        style={{ background: CITADELLE_COLORS.gold }}
      >
        <Shield size={13} style={{ color: CITADELLE_COLORS.night }} />
        <span
          className="text-xs font-black tracking-widest"
          style={{ color: CITADELLE_COLORS.night, textTransform: "uppercase", letterSpacing: "2px" }}
        >
          Service obligatoire pour toutes les ventes sur La Citadelle
        </span>
      </div>

      {/* Corps principal */}
      <div className="px-8 py-10 md:px-12 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start gap-8">

          {/* Icône + Titre */}
          <div className="flex items-start gap-5 flex-1">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}
            >
              <Shield size={32} style={{ color: CITADELLE_COLORS.gold }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}
                >
                  {service.title}
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: "rgba(201,164,92,0.15)", color: CITADELLE_COLORS.gold, border: "1px solid rgba(201,164,92,0.35)" }}
                >
                  {service.price_label || "Inclus"}
                </span>
              </div>
              <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.65)" }}>
                {service.short_description}
              </p>
            </div>
          </div>

          {/* Bouton en savoir plus */}
          <button
            onClick={() => onDetails(service)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80"
            style={{
              border: "1px solid rgba(201,164,92,0.5)",
              color: CITADELLE_COLORS.gold,
              background: "rgba(201,164,92,0.08)",
            }}
            data-testid="hero-service-details"
          >
            <Info size={15} />
            En savoir plus
          </button>
        </div>

        {/* Étapes du processus */}
        <div className="mt-10">
          <p
            className="text-xs font-semibold mb-4 uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Comment ça fonctionne
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {ETAPES.map((e, i) => (
              <div key={e.num} className="flex items-center gap-3 flex-1 min-w-0">
                {/* Étape */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  >
                    {e.num}
                  </div>
                  <span className="text-sm whitespace-nowrap" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {e.label}
                  </span>
                </div>
                {/* Connecteur */}
                {i < ETAPES.length - 1 && (
                  <div
                    className="hidden sm:block h-px flex-1 mx-1"
                    style={{ background: "rgba(201,164,92,0.25)", minWidth: "16px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
