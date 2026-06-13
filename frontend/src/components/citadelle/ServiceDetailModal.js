/**
 * ServiceDetailModal — La Citadelle Numérique
 * Modale de détail d'un service.
 * Étapes : "detail" → "form" (contact pré-rempli) → "success"
 */

import { useState } from "react";
import { X, Handshake, ShoppingCart, ExternalLink, ArrowLeft, Send, Loader, CheckCircle } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import citadelleApi from "@/services/citadelleApi";

const isPayable = (svc) => svc.service_type === "paid" && svc.price > 0;

const FORM_INITIAL = { nom: "", email: "", message: "" };

export default function ServiceDetailModal({ service, onClose, onBuy }) {
  const [step, setStep] = useState("detail"); // detail | form | success
  const [form, setForm] = useState(FORM_INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Réinitialisation à chaque ouverture / fermeture
  const handleClose = () => {
    setStep("detail");
    setForm(FORM_INITIAL);
    setError("");
    onClose();
  };

  const openContactForm = () => {
    setForm(FORM_INITIAL);
    setError("");
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!form.nom.trim() || form.nom.trim().length < 2) {
      setError("Veuillez renseigner votre nom (min. 2 caractères).");
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Veuillez renseigner une adresse email valide.");
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      setError("Veuillez décrire votre demande (min. 10 caractères).");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await citadelleApi.post("/contact", {
        nom: form.nom.trim(),
        email: form.email.trim(),
        sujet: `Service : ${service.title}`,
        message: form.message.trim(),
      });
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg p-6 rounded-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
        data-testid="service-detail-modal"
      >

        {/* ── Étape : Détail du service ── */}
        {step === "detail" && (
          <>
            <div className="flex items-start justify-between mb-4">
              <h2
                className="font-bold text-xl pr-4"
                style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
              >
                {service.title}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg flex-shrink-0"
                style={{ color: CITADELLE_COLORS.textMuted }}
                data-testid="service-detail-close"
              >
                <X size={20} />
              </button>
            </div>

            <p
              className="text-sm leading-relaxed mb-6 whitespace-pre-line"
              style={{ color: CITADELLE_COLORS.textMuted }}
            >
              {service.description}
            </p>

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

            <div className="flex gap-3">
              <button
                onClick={handleClose}
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
                <button
                  onClick={openContactForm}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="detail-modal-contact-btn"
                >
                  <Send size={13} />
                  Nous contacter
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Étape : Formulaire de contact ── */}
        {step === "form" && (
          <>
            {/* En-tête avec retour */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep("detail")}
                className="p-1.5 rounded-lg"
                style={{ color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}` }}
                data-testid="contact-form-back"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1">
                <h3
                  className="font-black text-lg"
                  style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
                >
                  Nous contacter
                </h3>
                <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {service.title}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg"
                style={{ color: CITADELLE_COLORS.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sujet pré-rempli (lecture seule) */}
            <div
              className="p-3 rounded-xl mb-4 flex items-center gap-2"
              style={{ background: "rgba(15,39,71,0.05)", border: `1px solid ${CITADELLE_COLORS.border}` }}
            >
              <span className="text-xs font-semibold" style={{ color: CITADELLE_COLORS.textMuted }}>
                Sujet :
              </span>
              <span className="text-sm font-medium" style={{ color: CITADELLE_COLORS.blue }}>
                Service : {service.title}
              </span>
            </div>

            {/* Champs */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Votre nom *
                </label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                  placeholder="Jean Dupont"
                  disabled={submitting}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="contact-nom"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Votre email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="jean@example.com"
                  disabled={submitting}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="contact-email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Votre demande *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Décrivez votre projet et vos besoins..."
                  rows={4}
                  disabled={submitting}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="contact-message"
                />
              </div>
            </div>

            {error && (
              <div
                className="p-3 rounded-xl text-xs mb-3"
                style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}
                data-testid="contact-error"
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-70 transition-all hover:scale-[1.01]"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="contact-submit"
            >
              {submitting ? (
                <><Loader size={15} className="animate-spin" /> Envoi en cours…</>
              ) : (
                <><Send size={14} /> Envoyer ma demande</>
              )}
            </button>
          </>
        )}

        {/* ── Étape : Succès ── */}
        {step === "success" && (
          <div className="text-center py-6" data-testid="contact-success">
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
              Demande envoyée !
            </h3>
            <p className="text-sm mb-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              Votre demande concernant
            </p>
            <p className="text-sm font-semibold mb-4" style={{ color: CITADELLE_COLORS.blue }}>
              « {service.title} »
            </p>
            <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
              a bien été transmise. Notre équipe vous répondra sous 48h.
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="contact-close-success"
            >
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
