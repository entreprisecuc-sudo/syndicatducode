/**
 * CGUAcceptanceModal — La Citadelle Numérique
 * Modale bloquante d'acceptation des CGU et CGV
 * Affichée une seule fois lors de l'inscription
 */

import { useState } from "react";
import { Shield, ExternalLink, CheckSquare, Square, X } from "lucide-react";
import { Link } from "react-router-dom";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

export default function CGUAcceptanceModal({ onAccept, loading }) {
  const [cguChecked, setCguChecked] = useState(false);
  const [cgvChecked, setCgvChecked] = useState(false);

  const allChecked = cguChecked && cgvChecked;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,39,71,0.85)", backdropFilter: "blur(4px)" }}
      data-testid="cgu-modal"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
      >
        {/* En-tête */}
        <div
          className="px-6 py-5 text-center"
          style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(201,164,92,0.2)" }}
          >
            <Shield size={22} style={{ color: CITADELLE_COLORS.gold }} />
          </div>
          <h2
            className="font-black text-lg"
            style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}
          >
            Conditions d'utilisation
          </h2>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            Veuillez lire et accepter nos conditions avant de continuer
          </p>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
            En créant votre compte sur <strong style={{ color: CITADELLE_COLORS.blue }}>La Citadelle Numérique</strong>,
            vous acceptez nos conditions générales qui encadrent l'utilisation de la plateforme
            et les transactions réalisées via notre système sécurisé.
          </p>

          {/* Case CGU */}
          <button
            onClick={() => setCguChecked(v => !v)}
            className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: cguChecked ? "rgba(201,164,92,0.08)" : "#f9f9f9",
              border: `1.5px solid ${cguChecked ? CITADELLE_COLORS.gold : "#e5e7eb"}`,
            }}
            data-testid="cgu-checkbox"
          >
            {cguChecked
              ? <CheckSquare size={20} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 1 }} />
              : <Square size={20} style={{ color: "#ccc", flexShrink: 0, marginTop: 1 }} />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                J'accepte les Conditions Générales d'Utilisation (CGU)
              </p>
              <Link
                to="/citadelle/cgu"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs mt-0.5 hover:underline"
                style={{ color: CITADELLE_COLORS.gold }}
              >
                Lire les CGU <ExternalLink size={11} />
              </Link>
            </div>
          </button>

          {/* Case CGV */}
          <button
            onClick={() => setCgvChecked(v => !v)}
            className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: cgvChecked ? "rgba(201,164,92,0.08)" : "#f9f9f9",
              border: `1.5px solid ${cgvChecked ? CITADELLE_COLORS.gold : "#e5e7eb"}`,
            }}
            data-testid="cgv-checkbox"
          >
            {cgvChecked
              ? <CheckSquare size={20} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 1 }} />
              : <Square size={20} style={{ color: "#ccc", flexShrink: 0, marginTop: 1 }} />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                J'accepte les Conditions Générales de Vente (CGV)
              </p>
              <Link
                to="/citadelle/cgv"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs mt-0.5 hover:underline"
                style={{ color: CITADELLE_COLORS.gold }}
              >
                Lire les CGV <ExternalLink size={11} />
              </Link>
            </div>
          </button>

          {/* Message si incomplet */}
          {!allChecked && (
            <p className="text-xs text-center" style={{ color: "#aaa" }}>
              Vous devez accepter les deux documents pour continuer
            </p>
          )}

          {/* Bouton validation */}
          <button
            onClick={() => allChecked && onAccept()}
            disabled={!allChecked || loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: allChecked ? CITADELLE_COLORS.gold : "#e5e7eb",
              color: allChecked ? CITADELLE_COLORS.night : "#999",
              cursor: allChecked ? "pointer" : "not-allowed",
            }}
            data-testid="cgu-accept-btn"
          >
            {loading ? "Création du compte…" : "Valider et créer mon compte"}
          </button>

          <p className="text-xs text-center" style={{ color: "#bbb" }}>
            Cette acceptation est enregistrée avec horodatage et adresse IP conformément au RGPD.
          </p>
        </div>
      </div>
    </div>
  );
}
