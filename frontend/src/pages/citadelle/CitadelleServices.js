/**
 * Services — La Citadelle Numérique
 * Catalogue de services complémentaires + checkout mocké
 */

import { useState, useEffect } from "react";
import {
  Star, Handshake, Zap, Shield, ExternalLink, ArrowRight,
  ShoppingCart, CheckCircle, X, Loader
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_ICONS = { paid: Zap, free: Star, partner: Handshake, quote: Shield };

const TYPE_LABELS = { paid: "Payant", free: "Gratuit", partner: "Partenaire", quote: "Sur devis" };

const FORM_INITIAL = { client_name: "", client_email: "", client_message: "" };

// Un service est achetable directement s'il est payant et a un prix positif
const isPayable = (svc) => svc.service_type === "paid" && svc.price > 0;

export default function CitadelleServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  // Checkout
  const [checkoutService, setCheckoutService] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState(FORM_INITIAL);
  const [checkoutStep, setCheckoutStep] = useState("form"); // "form" | "processing" | "success"
  const [checkoutOrderId, setCheckoutOrderId] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    citadelleApi.get("/services").then(res => {
      setServices(res.data.services || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openCheckout = (svc) => {
    setSelectedService(null);
    setCheckoutService(svc);
    setCheckoutForm(FORM_INITIAL);
    setCheckoutStep("form");
    setCheckoutError("");
    setCheckoutOrderId("");
  };

  const closeCheckout = () => {
    if (checkoutStep === "processing") return;
    setCheckoutService(null);
  };

  const handleCheckoutSubmit = async () => {
    const { client_name, client_email } = checkoutForm;
    if (!client_name.trim() || client_name.trim().length < 2) {
      setCheckoutError("Veuillez renseigner votre nom complet (min. 2 caractères).");
      return;
    }
    if (!client_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email.trim())) {
      setCheckoutError("Veuillez renseigner une adresse email valide.");
      return;
    }
    setCheckoutError("");
    setCheckoutStep("processing");

    try {
      const res = await citadelleApi.post(`/services/${checkoutService.id}/buy`, {
        client_name: client_name.trim(),
        client_email: client_email.trim(),
        client_message: checkoutForm.client_message.trim(),
      });
      setCheckoutOrderId(res.data.order_id || "");
      setCheckoutStep("success");
    } catch (err) {
      setCheckoutError(err.response?.data?.detail || "Une erreur est survenue. Veuillez réessayer.");
      setCheckoutStep("form");
    }
  };

  return (
    <CitadelleLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12" data-testid="citadelle-services">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            Nos services
          </h1>
          <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: CITADELLE_COLORS.textMuted }}>
            Des services complémentaires pour sécuriser vos transactions et optimiser la valeur de vos actifs numériques.
          </p>
        </div>

        {/* Liste des services */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center">
            <Star size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.2 }} />
            <p className="text-lg font-semibold" style={{ color: CITADELLE_COLORS.textMuted }}>
              Services bientôt disponibles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => {
              const TypeIcon = TYPE_ICONS[svc.service_type] || Star;
              const payable = isPayable(svc);
              return (
                <div key={svc.id}
                  className="p-6 rounded-2xl flex flex-col transition-all hover:-translate-y-1"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`service-card-${svc.id}`}>

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(201,164,92,0.1)" }}>
                      <TypeIcon size={20} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                    {svc.service_type === "partner" && svc.partner_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                        {svc.partner_name}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base mb-2" style={{ color: CITADELLE_COLORS.blue }}>
                    {svc.title}
                  </h3>
                  <p className="text-sm flex-1 mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {svc.short_description || svc.description?.substring(0, 120)}
                  </p>

                  {/* Prix */}
                  <div className="mb-4">
                    {svc.price_label ? (
                      <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>
                        {svc.price_label}
                      </span>
                    ) : svc.price != null ? (
                      <span className="text-xl font-black"
                        style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                        {svc.price > 0 ? `${svc.price.toLocaleString("fr-FR")} €` : "Gratuit"}
                      </span>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {TYPE_LABELS[svc.service_type]}
                      </span>
                    )}
                  </div>

                  {/* Boutons CTA */}
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedService(svc)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                      data-testid={`service-details-btn-${svc.id}`}>
                      Détails
                    </button>
                    {payable ? (
                      <button onClick={() => openCheckout(svc)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                        data-testid={`service-buy-btn-${svc.id}`}>
                        <ShoppingCart size={13} />
                        Acheter — {svc.price.toLocaleString("fr-FR")} €
                      </button>
                    ) : (
                      <button onClick={() => setSelectedService(svc)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                        {svc.cta_label || "En savoir plus"} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modale détail service ────────────────────────────────────────── */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg p-6 rounded-2xl max-h-[80vh] overflow-y-auto"
            style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>

            <div className="flex items-start justify-between mb-4">
              <h2 className="font-bold text-xl"
                style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {selectedService.title}
              </h2>
              <button onClick={() => setSelectedService(null)} className="p-1 rounded-lg"
                style={{ color: CITADELLE_COLORS.textMuted }}>
                <X size={20} />
              </button>
            </div>

            <p className="text-sm leading-relaxed mb-6 whitespace-pre-line"
              style={{ color: CITADELLE_COLORS.textMuted }}>
              {selectedService.description}
            </p>

            {selectedService.price_label && (
              <p className="text-lg font-bold mb-4" style={{ color: CITADELLE_COLORS.blue }}>
                {selectedService.price_label}
              </p>
            )}
            {!selectedService.price_label && selectedService.price != null && (
              <p className="text-2xl font-black mb-4"
                style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {selectedService.price > 0
                  ? `${selectedService.price.toLocaleString("fr-FR")} €`
                  : "Gratuit"}
              </p>
            )}

            {selectedService.partner_name && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <Handshake size={15} style={{ color: "#3B82F6" }} />
                <span className="text-sm" style={{ color: "#3B82F6" }}>
                  Service partenaire — {selectedService.partner_name}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSelectedService(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                Fermer
              </button>
              {isPayable(selectedService) ? (
                <button onClick={() => openCheckout(selectedService)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="detail-modal-buy-btn">
                  <ShoppingCart size={13} />
                  Acheter — {selectedService.price.toLocaleString("fr-FR")} €
                </button>
              ) : selectedService.cta_url ? (
                <a href={selectedService.cta_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                  {selectedService.cta_label} <ExternalLink size={13} />
                </a>
              ) : (
                <a href={`mailto:atelier@syndicatducode.fr?subject=Service: ${selectedService.title}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                  Nous contacter
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modale checkout (paiement mocké) ────────────────────────────── */}
      {checkoutService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl"
            style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
            data-testid="checkout-modal">

            {/* ── Étape succès ── */}
            {checkoutStep === "success" && (
              <div className="text-center py-4" data-testid="checkout-success">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(34,197,94,0.1)" }}>
                  <CheckCircle size={32} style={{ color: "#22C55E" }} />
                </div>
                <h3 className="font-black text-xl mb-2"
                  style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                  Commande enregistrée !
                </h3>
                <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Notre équipe va vous contacter très prochainement.
                </p>
                {checkoutOrderId && (
                  <p className="text-xs font-mono mt-3 px-3 py-1.5 rounded-lg inline-block"
                    style={{ background: "rgba(201,164,92,0.1)", color: CITADELLE_COLORS.gold }}>
                    Réf. {checkoutOrderId.slice(0, 8).toUpperCase()}
                  </p>
                )}
                <p className="text-xs mt-3 mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Un email de confirmation vous a été envoyé.
                </p>
                <button onClick={closeCheckout}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="checkout-close-success">
                  Fermer
                </button>
              </div>
            )}

            {/* ── Étape formulaire / traitement ── */}
            {(checkoutStep === "form" || checkoutStep === "processing") && (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-black text-lg"
                      style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                      Commander ce service
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {checkoutService.title}
                    </p>
                  </div>
                  <button onClick={closeCheckout} disabled={checkoutStep === "processing"}
                    className="p-1 rounded-lg disabled:opacity-40"
                    style={{ color: CITADELLE_COLORS.textMuted }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Montant mis en valeur */}
                <div className="p-4 rounded-xl mb-5 text-center" style={{ background: CITADELLE_COLORS.blue }}>
                  <p className="text-xs mb-1"
                    style={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Montant
                  </p>
                  <p className="text-3xl font-black"
                    style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>
                    {checkoutService.price.toLocaleString("fr-FR")} €
                  </p>
                </div>

                {/* Champs du formulaire */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1"
                      style={{ color: CITADELLE_COLORS.textMuted }}>
                      Nom complet *
                    </label>
                    <input
                      value={checkoutForm.client_name}
                      onChange={e => setCheckoutForm(p => ({ ...p, client_name: e.target.value }))}
                      placeholder="Jean Dupont"
                      disabled={checkoutStep === "processing"}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                      data-testid="checkout-name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1"
                      style={{ color: CITADELLE_COLORS.textMuted }}>
                      Adresse email *
                    </label>
                    <input
                      type="email"
                      value={checkoutForm.client_email}
                      onChange={e => setCheckoutForm(p => ({ ...p, client_email: e.target.value }))}
                      placeholder="jean@example.com"
                      disabled={checkoutStep === "processing"}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                      data-testid="checkout-email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1"
                      style={{ color: CITADELLE_COLORS.textMuted }}>
                      Message / précisions (optionnel)
                    </label>
                    <textarea
                      value={checkoutForm.client_message}
                      onChange={e => setCheckoutForm(p => ({ ...p, client_message: e.target.value }))}
                      placeholder="Décrivez votre projet ou vos besoins..."
                      rows={3}
                      disabled={checkoutStep === "processing"}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                      data-testid="checkout-message"
                    />
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl text-xs mb-3"
                    style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}
                    data-testid="checkout-error">
                    {checkoutError}
                  </div>
                )}

                <button
                  onClick={handleCheckoutSubmit}
                  disabled={checkoutStep === "processing"}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-70 transition-all hover:scale-[1.01]"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="checkout-submit">
                  {checkoutStep === "processing" ? (
                    <><Loader size={15} className="animate-spin" /> Traitement en cours…</>
                  ) : (
                    <>Confirmer ma commande — {checkoutService.price.toLocaleString("fr-FR")} €</>
                  )}
                </button>

                <p className="text-center text-xs mt-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Paiement en ligne bientôt disponible · Vous serez contacté directement
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </CitadelleLayout>
  );
}
