import { ShieldCheck } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

/**
 * Avis de sécurité réutilisable (DRY) — rappelle que toute communication doit
 * rester sur La Citadelle et que les coordonnées directes (email / téléphone)
 * sont automatiquement retirées des descriptions.
 * Mobile first : texte fluide, icône alignée en haut.
 */
export const SecurityContactNotice = ({ className = "" }) => (
  <div
    data-testid="security-contact-notice"
    className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl ${className}`}
    style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.3)" }}
  >
    <ShieldCheck size={18} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 2 }} />
    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
      Pour votre sécurité, toute communication doit rester sur <strong style={{ color: CITADELLE_COLORS.blue }}>La Citadelle</strong>.
      Les coordonnées directes (adresse email, numéro de téléphone) ne sont pas autorisées dans les descriptions
      et sont automatiquement retirées.
    </p>
  </div>
);

export default SecurityContactNotice;
