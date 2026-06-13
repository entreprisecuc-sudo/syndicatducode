/**
 * ServiceCheckoutModal — La Citadelle Numérique
 * Modale de commande (paiement Stripe mocké)
 */

import { useState } from "react";
import { X, ShoppingCart, CheckCircle, Loader } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import citadelleApi from "@/services/citadelleApi";

const FORM_INITIAL = { client_name: "", client_email: "", client_message: "" };

export default function ServiceCheckoutModal({ service, onClose }) {
  const [form, setForm] = useState(FORM_INITIAL);
  const [step, setStep] = useState("form"); // form | processing | success
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  // Réinitialisation à l'ouverture
  const handleClose = () => {
    if (step === "processing") return;
    setForm(FORM_INITIAL);
    setStep("form");
    setError("");
    setOrderId("");
    onClose();
  };

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
    setStep("processing");
    try {
      const res = await citadelleApi.post(`/services/${service.id}/buy`, {
        client_name: client_name.trim(),
        client_email: client_email.trim(),
        client_message: form.client_message.trim(),
      });
      setOrderId(res.data.order_id || "");
      setStep("success");
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
        {/* ── Étape succès ── */}
        {step === "success" && (
          <div className="text-center py-4" data-testid="checkout-success">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <CheckCircle size={32} style={{ color: "#22C55E" }} />
            </div>
            <h3
              className="font-black text-xl mb-2"
              style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
            >
              Commande enregistrée !
            </h3>
            <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
              Notre équipe va vous contacter très prochainement.
            </p>
            {orderId && (
              <p
                className="text-xs font-mono mt-3 px-3 py-1.5 rounded-lg inline-block"
                style={{ background: "rgba(201,164,92,0.1)", color: CITADELLE_COLORS.gold }}
              >
                Réf. {orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <p className="text-xs mt-3 mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
              Un email de confirmation vous a été envoyé.
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="checkout-close-success"
            >
              Fermer
            </button>
          </div>
        )}

        {/* ── Étape formulaire / traitement ── */}
        {(step === "form" || step === "processing") && (
          <>
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
                disabled={step === "processing"}
                className="p-1 rounded-lg disabled:opacity-40"
                style={{ color: CITADELLE_COLORS.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Montant */}
            <div className="p-4 rounded-xl mb-5 text-center" style={{ background: CITADELLE_COLORS.blue }}>
              <p
                className="text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}
              >
                Montant
              </p>
              <p
                className="text-3xl font-black"
                style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}
              >
                {service.price.toLocaleString("fr-FR")} €
              </p>
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
                  disabled={step === "processing"}
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
                  disabled={step === "processing"}
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
                  disabled={step === "processing"}
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
              disabled={step === "processing"}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-70 transition-all hover:scale-[1.01]"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="checkout-submit"
            >
              {step === "processing" ? (
                <>
                  <Loader size={15} className="animate-spin" /> Traitement en cours…
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Confirmer ma commande — {service.price.toLocaleString("fr-FR")} €
                </>
              )}
            </button>

            <p className="text-center text-xs mt-3" style={{ color: CITADELLE_COLORS.textMuted }}>
              Paiement en ligne bientôt disponible · Vous serez contacté directement
            </p>
          </>
        )}
      </div>
    </div>
  );
}
