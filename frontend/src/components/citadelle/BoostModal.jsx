/**
 * BoostModal — La Citadelle Numérique
 * Modale de souscription au service payant « Annonce à la Une ».
 * Présente les 2 formules et redirige vers Stripe Checkout.
 * Réutilisée sur la fiche détail (propriétaire) et l'écran de succès de création.
 */
import { useState } from "react";
import { Star, Check, AlertCircle, Infinity as InfinityIcon, CalendarClock } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

export const BOOST_PLANS = [
  {
    key: "3months",
    price: 19,
    label: "3 mois",
    tagline: "Visibilité renforcée pendant 90 jours",
    icon: CalendarClock,
    features: ["Mise en avant dans le carrousel « À la Une »", "Priorité d'affichage sur l'accueil et la liste", "Durée : 90 jours"],
  },
  {
    key: "until_sale",
    price: 49,
    label: "Jusqu'à la vente",
    tagline: "En avant jusqu'à ce que votre actif trouve preneur",
    icon: InfinityIcon,
    highlight: true,
    features: ["Mise en avant dans le carrousel « À la Une »", "Priorité d'affichage sur l'accueil et la liste", "Sans limite de durée, jusqu'à la vente"],
  },
];

export default function BoostModal({ isOpen, onClose, listingId, listingTitle }) {
  const [selected, setSelected] = useState("until_sale");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await citadelleApi.post("/payments/boost/checkout", {
        listing_id: listingId,
        plan: selected,
        origin_url: window.location.origin,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setError("Impossible d'initier le paiement. Réessayez.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la création du paiement.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} data-testid="boost-modal">
      <div className="w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
        {/* En-tête */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
            <Star size={20} style={{ color: CITADELLE_COLORS.gold }} />
          </div>
          <div>
            <h3 className="font-black text-lg leading-snug" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              Mettre mon annonce à la Une
            </h3>
            <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
              Boostez la visibilité{listingTitle ? ` de « ${listingTitle} »` : ""} dans le carrousel mis en avant sur l'accueil et la liste des annonces.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-4" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Formules */}
        <div className="space-y-3">
          {BOOST_PLANS.map((plan) => {
            const active = selected === plan.key;
            const Icon = plan.icon;
            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelected(plan.key)}
                className="w-full text-left p-4 rounded-2xl transition-all relative"
                style={{
                  border: active ? `2px solid ${CITADELLE_COLORS.gold}` : `1px solid ${CITADELLE_COLORS.border}`,
                  background: active ? "rgba(201,164,92,0.06)" : "white",
                }}
                data-testid={`boost-plan-${plan.key}`}
              >
                {plan.highlight && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                    Populaire
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={18} style={{ color: active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.textMuted }} />
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>{plan.price} €</span>
                    <span className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>· {plan.label}</span>
                  </div>
                </div>
                <p className="text-xs mb-2" style={{ color: CITADELLE_COLORS.textMuted }}>{plan.tagline}</p>
                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                      <Check size={12} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 2 }} /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            data-testid="boost-modal-close"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="boost-checkout-btn"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
            ) : (
              <><Star size={14} /> Passer à la Une</>
            )}
          </button>
        </div>
        <p className="text-[11px] text-center mt-3" style={{ color: CITADELLE_COLORS.textMuted }}>
          Paiement sécurisé via Stripe. Vous serez redirigé pour finaliser le règlement.
        </p>
      </div>
    </div>
  );
}
