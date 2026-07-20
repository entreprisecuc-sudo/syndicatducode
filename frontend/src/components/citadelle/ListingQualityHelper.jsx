/**
 * ListingQualityHelper — La Citadelle Numérique
 * Score de qualité (indicatif) + conseils bienveillants par étape,
 * pour aider les vendeurs à optimiser leur annonce.
 * Utilisé dans CitadelleCreateListing et CitadelleEditListing.
 *
 * Props :
 *   form : objet du formulaire d'annonce
 *   step : index de l'étape en cours (0..3)
 */
import { Lightbulb, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { computeListingQuality } from "@/config/listingQuality";

const STEP_TIPS = {
  0: [
    "Mettez en avant votre atout n°1 dès le titre : type d'actif + chiffre marquant (ex : « Blog cuisine — 2 500 €/mois »).",
    "L'accroche est votre vitrine dans les résultats : soyez concret et donnez envie d'en savoir plus.",
  ],
  1: [
    "Des chiffres transparents (revenus, trafic, ancienneté) rassurent l'acheteur et accélèrent la vente.",
    "Un prix aligné sur le marché attire plus de contacts — vous pourrez toujours l'ajuster plus tard.",
  ],
  2: [
    "Racontez l'histoire de votre actif : origine, raison de la vente, points forts et potentiel de croissance.",
    "Une belle image (capture du site, logo) inspire confiance et multiplie les clics.",
  ],
  3: [
    "Presque prêt ! Vérifiez qu'il ne manque aucun élément clé ci-dessous pour maximiser vos chances de vente.",
  ],
};

export default function ListingQualityHelper({ form, step }) {
  const { pct, criteria, label: lbl } = computeListingQuality(form);

  // Critères non remplis pertinents pour l'étape en cours (ou toutes à l'étape récap)
  const missing = criteria.filter(c => !c.done && (step === 3 || c.step === step));
  const tips = STEP_TIPS[step] || [];

  return (
    <div
      className="mb-6 rounded-2xl p-4"
      style={{ background: "rgba(201,164,92,0.06)", border: `1px solid rgba(201,164,92,0.22)` }}
      data-testid="listing-quality-helper"
    >
      {/* Barre de score */}
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: CITADELLE_COLORS.blue }}>
          <Sparkles size={14} style={{ color: CITADELLE_COLORS.gold }} /> Qualité de l'annonce
        </span>
        <span className="text-sm font-black" style={{ color: lbl.color }} data-testid="quality-score">
          {pct}% · {lbl.text}
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden mb-1" style={{ background: "rgba(15,39,71,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${CITADELLE_COLORS.gold}, #E0BE7A)` }} />
      </div>
      <p className="text-[11px] mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
        Score indicatif — plus votre annonce est complète, plus elle inspire confiance. 💛
      </p>

      {/* Conseils bienveillants de l'étape */}
      {tips.length > 0 && (
        <div className="space-y-1.5 mb-1">
          {tips.map((t, i) => (
            <p key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: CITADELLE_COLORS.blue }}>
              <Lightbulb size={13} className="shrink-0 mt-0.5" style={{ color: CITADELLE_COLORS.gold }} />
              <span>{t}</span>
            </p>
          ))}
        </div>
      )}

      {/* Éléments à compléter (checklist indicative) */}
      {missing.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px dashed rgba(201,164,92,0.3)" }}>
          <p className="text-[11px] font-bold mb-2" style={{ color: CITADELLE_COLORS.textMuted }}>
            {step === 3 ? "Pour une annonce au top, il vous reste :" : "Suggestions pour cette étape :"}
          </p>
          <ul className="space-y-1">
            {missing.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-xs" style={{ color: CITADELLE_COLORS.textMuted }} data-testid="quality-missing-item">
                <Circle size={12} style={{ color: CITADELLE_COLORS.gold }} />
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.length === 0 && step !== 3 && (
        <p className="flex items-center gap-2 text-xs font-semibold mt-2" style={{ color: "#16A34A" }}>
          <CheckCircle2 size={14} /> Cette étape est parfaitement remplie, bravo !
        </p>
      )}
    </div>
  );
}
