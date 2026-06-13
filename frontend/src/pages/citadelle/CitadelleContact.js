/**
 * Page Contact — La Citadelle Numérique
 * Formulaire de contact avec envoi par email
 */

import { useState } from "react";
import { Mail, Send, MapPin, Clock, Shield, CheckCircle } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CONFIG } from "@/config/citadelleConstants";

const SUJETS = [
  "Question générale",
  "Vendre mon actif numérique",
  "Acheter un actif numérique",
  "Problème technique",
  "Partenariat",
  "Autre",
];

export default function CitadelleContact() {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [envoi, setEnvoi] = useState("idle"); // idle | loading | success | error
  const [erreur, setErreur] = useState("");

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi("loading");
    setErreur("");
    try {
      await citadelleApi.post("/contact", form);
      setEnvoi("success");
      setForm({ nom: "", email: "", sujet: "", message: "" });
    } catch (err) {
      setErreur(err?.response?.data?.detail || "Une erreur est survenue. Veuillez réessayer.");
      setEnvoi("error");
    }
  };

  return (
    <CitadelleLayout pageTitle="Nous contacter — La Citadelle Numérique">
      <div className="min-h-screen" style={{ background: CITADELLE_COLORS.bg }}>

        {/* Hero */}
        <div className="py-14 px-4 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
            <Mail size={14} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>Contact</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Nous contacter
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Une question ? Un projet de vente ou d'achat ? Notre équipe vous répond sous 48h.
          </p>
        </div>

        {/* Contenu */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Infos */}
            <div className="space-y-5">
              <InfoCard
                icon={Mail}
                titre="Email"
                contenu={CITADELLE_CONFIG.email}
                lien={`mailto:${CITADELLE_CONFIG.email}`}
              />
              <InfoCard
                icon={Clock}
                titre="Délai de réponse"
                contenu="Sous 48h ouvrées"
              />
              <InfoCard
                icon={Shield}
                titre="Sécurité"
                contenu="Vos données ne sont jamais partagées avec des tiers"
              />
              <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.2)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.gold }}>Vous êtes vendeur ?</p>
                <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Publiez directement votre annonce depuis votre espace membre, notre équipe la vérifie sous 24h.
                </p>
              </div>
            </div>

            {/* Formulaire */}
            <div className="lg:col-span-2">
              {envoi === "success" ? (
                <SuccessMessage />
              ) : (
                <form onSubmit={handleSubmit}
                  className="p-6 rounded-2xl space-y-4"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 4px 24px rgba(15,39,71,0.06)" }}>

                  <h2 className="text-base font-bold mb-2" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                    Envoyer un message
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChampFormulaire label="Votre nom" name="nom" type="text" value={form.nom} onChange={handleChange} required placeholder="Jean Dupont" />
                    <ChampFormulaire label="Votre email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jean@exemple.fr" />
                  </div>

                  {/* Sujet */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                      Sujet <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <select
                      name="sujet"
                      value={form.sujet}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                      style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: form.sujet ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted }}
                      data-testid="contact-sujet"
                    >
                      <option value="">Sélectionner un sujet</option>
                      {SUJETS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                      Message <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      minLength={10}
                      rows={5}
                      placeholder="Décrivez votre demande en détail..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                      style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                      data-testid="contact-message"
                    />
                    <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {form.message.length}/2000 caractères
                    </p>
                  </div>

                  {erreur && (
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
                      {erreur}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={envoi === "loading"}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: CITADELLE_COLORS.night, color: "white", opacity: envoi === "loading" ? 0.7 : 1 }}
                    data-testid="contact-submit"
                  >
                    <Send size={15} />
                    {envoi === "loading" ? "Envoi en cours..." : "Envoyer le message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </CitadelleLayout>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function ChampFormulaire({ label, name, type, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
        data-testid={`contact-${name}`}
      />
    </div>
  );
}

function InfoCard({ icon: Icon, titre, contenu, lien }) {
  const content = (
    <div className="flex items-start gap-3 p-4 rounded-xl"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(201,164,92,0.1)" }}>
        <Icon size={16} style={{ color: CITADELLE_COLORS.gold }} />
      </div>
      <div>
        <p className="text-xs font-semibold mb-0.5" style={{ color: CITADELLE_COLORS.blue }}>{titre}</p>
        <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>{contenu}</p>
      </div>
    </div>
  );
  return lien ? <a href={lien}>{content}</a> : content;
}

function SuccessMessage() {
  return (
    <div className="p-8 rounded-2xl flex flex-col items-center text-center"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 4px 24px rgba(15,39,71,0.06)" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(34,197,94,0.1)" }}>
        <CheckCircle size={28} style={{ color: "#22C55E" }} />
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
        Message envoyé !
      </h3>
      <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
        Merci pour votre message. Notre équipe vous répondra sous 48h ouvrées à l'adresse indiquée.
      </p>
    </div>
  );
}
