/**
 * ServiceCheckoutModal — La Citadelle Numérique
 * Modale de commande avec paiement Stripe
 * Pré-remplit les champs si l'utilisateur est connecté + lie la facture à son compte.
 */

import { useState, useEffect } from "react";
import { X, ShoppingCart, Loader, CreditCard, Tag, CheckCircle } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import citadelleApi from "@/services/citadelleApi";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import { isPromoOn, promoDiscounted } from "@/utils/promo";

const FORM_INITIAL = { client_name: "", client_email: "", client_message: "" };

export default function ServiceCheckoutModal({ service, onClose }) {
  const { user } = useCitadelleAuth();
  const [form, setForm]               = useState(FORM_INITIAL);
  const [step, setStep]               = useState("form"); // form | redirecting
  const [error, setError]             = useState("");
  const [promo, setPromo]             = useState(null);
  const [promoCode, setPromoCode]     = useState("");
  const [promoApplied, setPromoApplied] = useState(null); // { code, discount_percent } | null
  const [promoError, setPromoError]   = useState("");
  const [promoChecking, setPromoChecking] = useState(false);

  useEffect(() => {
    citadelleApi.get("/promo").then((res) => setPromo(res.data)).catch(() => {});
  }, []);

  // Pré-remplir avec les infos du compte si connecté
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        client_name:  prev.client_name  || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "",
        client_email: prev.client_email || user.email || "",
      }));
    }
  }, [user]);

  const handleClose = () => {
    if (step === "redirecting") return;
    setForm(FORM_INITIAL);
    setStep("form");
    setError("");
    setPromoCode("");
    setPromoApplied(null);
    setPromoError("");
    onClose();
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const res = await citadelleApi.post("/payments/promo/validate", { code });
      if (res.data.valid) {
        setPromoApplied({ code: res.data.code, discount_percent: res.data.discount_percent });
        setPromoError("");
      } else {
        setPromoApplied(null);
        setPromoError("Code promo invalide.");
      }
    } catch {
      setPromoApplied(null);
      setPromoError("Impossible de vérifier le code. Réessayez.");
    } finally {
      setPromoChecking(false);
    }
  };

  // Prix après promo globale
  const basePrice = isPromoOn(promo, service.price) ? promoDiscounted(service.price, promo) : service.price;
  // Prix après code promo personnel
  const finalPrice = promoApplied
    ? Math.round(basePrice * (1 - promoApplied.discount_percent / 100) * 100) / 100
    : basePrice;

  const handleSubmit = async () => {
    const { client_name, client_email } = form;
    if (!client_name.trim() || client_name.trim().length < 2) {
      setError("Veuillez renseigner votre nom complet (min. 2 caractères).");
      return;
    }
    if (!client_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email.trim())) {
      setError("Veuillez renseigner une adresse email valide.");
      return;
    }
    setError("");
    setStep("redirecting");

    try {
      const res = await citadelleApi.post("/payments/service/checkout", {
        service_id: service.id,
        client_name: client_name.trim(),
        client_email: client_email.trim(),
        client_message: form.client_message.trim(),
        origin_url: window.location.origin,
        user_id: user?.id || null,
        promo_code: promoApplied?.code || null,
      });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue. Veuillez réessayer.");
      setStep("form");
    }
  };

  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl"
        style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
        data-testid="checkout-modal"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3
              className="font-black text-lg"
              style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
            >
              Commander ce service
            </h3>
            <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
              {service.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={step === "redirecting"}
            className="p-1 rounded-lg disabled:opacity-40"
            style={{ color: CITADELLE_COLORS.textMuted }}
            data-testid="checkout-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Montant */}
        <div className="p-4 rounded-xl mb-4 text-center" style={{ background: CITADELLE_COLORS.blue }}>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Montant
          </p>
          <p className="text-3xl font-black" style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>
            {(promoApplied || isPromoOn(promo, service.price)) ? (
              <span className="inline-flex items-baseline gap-2">
                <span style={{ textDecoration: "line-through", opacity: 0.5, fontSize: "0.6em", color: "rgba(255,255,255,0.6)" }}>
                  {service.price.toLocaleString("fr-FR")} €
                </span>
                <span>{finalPrice.toLocaleString("fr-FR")} €</span>
              </span>
            ) : (
              <>{service.price.toLocaleString("fr-FR")} €</>
            )}
          </p>
          {promoApplied && (
            <p className="text-xs mt-1 font-bold" style={{ color: "#22C55E" }}>
              Code {promoApplied.code} · -{promoApplied.discount_percent}%
            </p>
          )}
          {!promoApplied && isPromoOn(promo, service.price) && (
            <p className="text-xs mt-1 font-bold" style={{ color: "#22C55E" }}>
              {promo.label} · -{promo.discount_percent}%
            </p>
          )}
        </div>

        {/* Code promo */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
            Code promo (optionnel)
          </label>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(null); setPromoError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
              placeholder="ex : EMERGENT"
              disabled={step === "redirecting"}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none font-mono tracking-wider"
              style={{ border: `1px solid ${promoApplied ? "#22C55E" : CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
              data-testid="checkout-promo-input"
            />
            <button
              onClick={handleApplyPromo}
              disabled={!promoCode.trim() || step === "redirecting" || promoChecking}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              style={{ background: CITADELLE_COLORS.blue, color: "white" }}
              data-testid="checkout-promo-apply"
            >
              {promoChecking ? <Loader size={13} className="animate-spin" /> : "Appliquer"}
            </button>
          </div>
          {promoApplied && (
            <p className="flex items-center gap-1 text-xs mt-1.5 font-semibold" style={{ color: "#16A34A" }}>
              <CheckCircle size={12} /> Code appliqué — {promoApplied.discount_percent}% de réduction
            </p>
          )}
          {promoError && (
            <p className="text-xs mt-1.5" style={{ color: "#DC2626" }} data-testid="checkout-promo-error">
              {promoError}
            </p>
          )}
        </div>

        {/* Formulaire */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              Nom complet *
            </label>
            <input
              value={form.client_name}
              onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
              placeholder="Jean Dupont"
              disabled={step === "redirecting"}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
              data-testid="checkout-name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              Adresse email *
            </label>
            <input
              type="email"
              value={form.client_email}
              onChange={(e) => setForm((p) => ({ ...p, client_email: e.target.value }))}
              placeholder="jean@example.com"
              disabled={step === "redirecting"}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
              data-testid="checkout-email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              Message / précisions (optionnel)
            </label>
            <textarea
              value={form.client_message}
              onChange={(e) => setForm((p) => ({ ...p, client_message: e.target.value }))}
              placeholder="Décrivez votre projet ou vos besoins..."
              rows={3}
              disabled={step === "redirecting"}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
              data-testid="checkout-message"
            />
          </div>
        </div>

        {error && (
          <div
            className="p-3 rounded-xl text-xs mb-3"
            style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}
            data-testid="checkout-error"
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={step === "redirecting"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-70 transition-all hover:scale-[1.01]"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="checkout-submit"
        >
          {step === "redirecting" ? (
            <>
              <Loader size={15} className="animate-spin" /> Redirection vers Stripe…
            </>
          ) : (
            <>
              <CreditCard size={14} />
              Payer {finalPrice.toLocaleString("fr-FR")} € via Stripe
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-3">
          <svg width="38" height="16" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 9.5C7.5 7.5 9 6 11 6H49C51 6 52.5 7.5 52.5 9.5V15.5C52.5 17.5 51 19 49 19H11C9 19 7.5 17.5 7.5 15.5V9.5Z" fill="#635BFF"/>
            <text x="30" y="15.5" textAnchor="middle" fill="white" fontSize="8" fontFamily="sans-serif" fontWeight="bold">stripe</text>
          </svg>
          <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
            Paiement 100% sécurisé · Données cryptées
          </p>
        </div>
      </div>
    </div>
  );
}
