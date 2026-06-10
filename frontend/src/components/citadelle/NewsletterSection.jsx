/**
 * Section Newsletter — La Citadelle Numérique
 * Formulaire d'inscription aux alertes hebdomadaires d'annonces
 * Charte graphique : Bleu #0F2747 / Or #C9A45C
 */

import { useState } from "react";
import { Mail, Bell, ArrowRight, CheckCircle } from "lucide-react";
import { CITADELLE_COLORS, CITADELLE_API_URL } from "@/config/citadelleConstants";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${CITADELLE_API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Inscription réussie !");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.detail || "Une erreur est survenue.");
      }
    } catch {
      setStatus("error");
      setMessage("Impossible de contacter le serveur. Veuillez réessayer.");
    }
  };

  return (
    <section
      className="py-16 relative overflow-hidden"
      style={{ background: CITADELLE_COLORS.blue }}
      data-testid="citadelle-newsletter-section"
    >
      {/* Motif de fond subtil */}
      <div
        className="absolute inset-0 opacity-4 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
        {/* Icône */}
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}
        >
          <Bell size={26} style={{ color: CITADELLE_COLORS.gold }} />
        </div>

        {/* Titre */}
        <h2
          className="font-bold mb-3"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            color: "white",
          }}
        >
          Recevez les nouvelles annonces chaque semaine
        </h2>

        {/* Sous-titre */}
        <p className="mb-8" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.7 }}>
          Inscrivez-vous à notre newsletter et soyez le premier informé des nouveaux actifs
          numériques disponibles — sites, SaaS, e-commerce et plus encore.
        </p>

        {/* Formulaire ou confirmation */}
        {status === "success" ? (
          <div
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
            data-testid="citadelle-newsletter-success"
          >
            <CheckCircle size={20} style={{ color: "#22C55E", flexShrink: 0 }} />
            <p style={{ color: "#22C55E", fontWeight: 600, fontSize: "0.9rem" }}>{message}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
            data-testid="citadelle-newsletter-form"
          >
            {/* Champ email */}
            <div
              className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Mail size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={status === "loading"}
                className="bg-transparent outline-none text-sm w-full placeholder-white/40"
                style={{ color: "white" }}
                data-testid="citadelle-newsletter-email-input"
              />
            </div>

            {/* Bouton inscription */}
            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                         transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:hover:scale-100 flex-shrink-0"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="citadelle-newsletter-submit-btn"
            >
              {status === "loading" ? (
                <>
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: `${CITADELLE_COLORS.night}30`, borderTopColor: CITADELLE_COLORS.night }}
                  />
                  Inscription...
                </>
              ) : (
                <>
                  M&apos;inscrire
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Message d'erreur */}
        {status === "error" && (
          <p
            className="mt-3 text-sm"
            style={{ color: "#FCA5A5" }}
            data-testid="citadelle-newsletter-error"
          >
            {message}
          </p>
        )}

        {/* Mention RGPD */}
        <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Sans spam · Désinscription en un clic dans chaque email · Conformité RGPD
        </p>
      </div>
    </section>
  );
}
