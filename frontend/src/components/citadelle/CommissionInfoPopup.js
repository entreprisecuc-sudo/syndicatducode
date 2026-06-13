/**
 * CommissionInfoPopup — La Citadelle Numérique
 * Popup d'information sur la commission prélevée à la vente.
 * S'affiche lors du premier focus sur le champ prix de vente.
 */

import { Shield, Euro } from "lucide-react";
import { CITADELLE_COLORS, COMMISSION_RATE, COMMISSION_MINIMUM_EUR } from "@/config/citadelleConstants";

export default function CommissionInfoPopup({ onAcknowledge }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      data-testid="commission-popup"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* En-tête */}
        <div
          className="px-7 py-5 flex items-center gap-4"
          style={{ background: CITADELLE_COLORS.blue }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,164,92,0.2)" }}
          >
            <Shield size={20} style={{ color: CITADELLE_COLORS.gold }} />
          </div>
          <div>
            <h3
              className="font-black text-base"
              style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}
            >
              Commission La Citadelle
            </h3>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              À lire avant de fixer votre prix
            </p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-7 py-6">
          {/* Bloc commission */}
          <div
            className="flex items-stretch gap-5 p-5 rounded-xl mb-5"
            style={{ background: "rgba(15,39,71,0.04)", border: `1px solid ${CITADELLE_COLORS.border}` }}
          >
            {/* Taux */}
            <div className="flex-1 text-center">
              <p
                className="text-4xl font-black"
                style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
              >
                {(COMMISSION_RATE * 100).toFixed(0)} %
              </p>
              <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                du prix de vente
              </p>
            </div>

            {/* Séparateur */}
            <div className="w-px" style={{ background: CITADELLE_COLORS.border }} />

            {/* Minimum */}
            <div className="flex-1 text-center">
              <p
                className="text-4xl font-black"
                style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}
              >
                {COMMISSION_MINIMUM_EUR} €
              </p>
              <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                minimum prélevé
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm leading-relaxed mb-2" style={{ color: CITADELLE_COLORS.blue }}>
            Pour chaque vente réalisée sur La Citadelle Numérique, une commission est prélevée au profit de la plateforme.
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
            Nous vous invitons à en tenir compte lors de la fixation de votre prix de vente afin de vous assurer la marge souhaitée.
          </p>

          {/* Exemple illustratif */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.2)" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: CITADELLE_COLORS.gold }}>
              Exemple
            </p>
            <div className="space-y-1 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              <div className="flex justify-between">
                <span>Prix de vente affiché</span>
                <span className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>1 000 €</span>
              </div>
              <div className="flex justify-between">
                <span>Commission ({(COMMISSION_RATE * 100).toFixed(0)} %)</span>
                <span className="font-semibold" style={{ color: "#DC2626" }}>— 50 €</span>
              </div>
              <div className="h-px my-2" style={{ background: CITADELLE_COLORS.border }} />
              <div className="flex justify-between font-bold">
                <span style={{ color: CITADELLE_COLORS.blue }}>Vous recevez</span>
                <span style={{ color: CITADELLE_COLORS.blue }}>950 €</span>
              </div>
            </div>
          </div>

          {/* Bouton */}
          <button
            onClick={onAcknowledge}
            className="w-full py-3.5 rounded-xl font-black text-sm transition-all hover:scale-[1.01]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night, fontFamily: "'Montserrat', sans-serif" }}
            data-testid="commission-popup-ok"
          >
            J'ai compris — Fixer mon prix
          </button>
        </div>
      </div>
    </div>
  );
}
