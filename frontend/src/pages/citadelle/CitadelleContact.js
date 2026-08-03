/**
 * Page Contact — La Citadelle Numérique
 * Formulaire de contact avec envoi par email
 */

import { useState } from "react";
import { Mail, Send, Clock, Shield, CheckCircle, Swords } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { Helmet } from "react-helmet-async";
import { CITADELLE_COLORS, CITADELLE_CONFIG, CITADELLE_PUBLIC_URL } from "@/config/citadelleConstants";

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
    <CitadelleLayout>
      <Helmet>
        <title>Contact | La Citadelle Numérique</title>
        <meta name="description" content="Contactez La Garde de La Citadelle Numérique pour toute question sur l'achat, la vente ou la sécurisation de vos actifs numériques." />
        <link rel="canonical" href={`${CITADELLE_PUBLIC_URL}/citadelle/contact`} />
      </Helmet>
      <div className="min-h-screen" style={{ background: CITADELLE_COLORS.bg }}>

        {/* Hero */}
        <div className="relative py-16 px-4 text-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, #1a3a6b 100%)` }}>
          {/* Ornements décoratifs */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
            <div className="absolute top-0 left-1/4 w-px h-full" style={{ background: CITADELLE_COLORS.gold }} />
            <div className="absolute top-0 right-1/4 w-px h-full" style={{ background: CITADELLE_COLORS.gold }} />
          </div>

          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
            <Shield size={14} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: CITADELLE_COLORS.gold }}>
              La Garde de la Citadelle
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Parlez à La Garde
          </h1>

          <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Gardiens de chaque transaction, nous veillons sur la Citadelle nuit et jour.<br />
            Votre message franchira nos remparts — et une réponse vous parviendra sous 48h.
          </p>

          {/* Séparateur doré */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-12" style={{ background: "rgba(201,164,92,0.4)" }} />
            <Shield size={12} style={{ color: CITADELLE_COLORS.gold, opacity: 0.6 }} />
            <div className="h-px w-12" style={{ background: "rgba(201,164,92,0.4)" }} />
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Panneau La Garde */}
            <div className="space-y-4">

              {/* Bloc principal La Garde */}
              <div className="p-5 rounded-2xl"
                style={{ background: CITADELLE_COLORS.night, border: `1px solid rgba(201,164,92,0.25)` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(201,164,92,0.15)" }}>
                    <Shield size={16} style={{ color: CITADELLE_COLORS.gold }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>
                    Poste de La Garde
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                  La Garde veille sur l'intégrité de chaque échange au sein de la Citadelle. Votre requête est traitée avec la rigueur d'un chevalier sous serment.
                </p>
                <a href={`mailto:${CITADELLE_CONFIG.email}`}
                  className="flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ color: CITADELLE_COLORS.gold }}>
                  <Mail size={12} />
                  {CITADELLE_CONFIG.email}
                </a>
              </div>

              <InfoCard
                icon={Clock}
                titre="Délai de réponse"
                contenu="La Garde répond sous 48h ouvrées. Aucune requête n'est laissée sans réponse."
              />
              <InfoCard
                icon={Shield}
                titre="Confidentialité assurée"
                contenu="Vos échanges avec La Garde sont strictement confidentiels et ne quittent jamais les remparts."
              />

              <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.2)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: CITADELLE_COLORS.gold }}>
                  Vous souhaitez vendre ?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Publiez votre annonce depuis votre espace membre. La Garde en vérifie l'authenticité sous 24h avant publication.
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

                  <div className="flex items-center gap-2 mb-1">
                    <Swords size={16} style={{ color: CITADELLE_COLORS.gold }} />
                    <h2 className="text-base font-bold" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                      Adresser une requête à La Garde
                    </h2>
                  </div>
                  <p className="text-xs pb-2" style={{ color: CITADELLE_COLORS.textMuted, borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
                    Formulez votre demande avec précision — La Garde y répondra avec honneur.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChampFormulaire label="Votre nom" name="nom" type="text" value={form.nom} onChange={handleChange} required placeholder="Jean Dupont" />
                    <ChampFormulaire label="Votre email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jean@exemple.fr" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                      Nature de la requête <span style={{ color: "#DC2626" }}>*</span>
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
                      <option value="">Choisir la nature de votre requête</option>
                      {SUJETS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                      Votre message <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      minLength={10}
                      rows={5}
                      placeholder="Exposez votre demande à La Garde de la Citadelle..."
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
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: CITADELLE_COLORS.night, color: "white", opacity: envoi === "loading" ? 0.7 : 1 }}
                    data-testid="contact-submit"
                  >
                    <Send size={15} />
                    {envoi === "loading" ? "La Garde reçoit votre message..." : "Envoyer à La Garde"}
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

function InfoCard({ icon: Icon, titre, contenu }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(201,164,92,0.1)" }}>
        <Icon size={16} style={{ color: CITADELLE_COLORS.gold }} />
      </div>
      <div>
        <p className="text-xs font-semibold mb-0.5" style={{ color: CITADELLE_COLORS.blue }}>{titre}</p>
        <p className="text-xs leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>{contenu}</p>
      </div>
    </div>
  );
}

function SuccessMessage() {
  return (
    <div className="p-8 rounded-2xl flex flex-col items-center text-center"
      style={{ background: CITADELLE_COLORS.night, border: `1px solid rgba(201,164,92,0.3)`, boxShadow: "0 4px 32px rgba(15,39,71,0.2)" }}>

      {/* Icône */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: "rgba(201,164,92,0.12)", border: `2px solid rgba(201,164,92,0.35)` }}>
        <CheckCircle size={30} style={{ color: CITADELLE_COLORS.gold }} />
      </div>

      {/* Étiquette */}
      <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
        style={{ background: "rgba(201,164,92,0.1)", border: "1px solid rgba(201,164,92,0.25)" }}>
        <Shield size={11} style={{ color: CITADELLE_COLORS.gold }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: CITADELLE_COLORS.gold }}>
          Message reçu
        </span>
      </div>

      <h3 className="text-xl font-black mb-3 text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        La Garde a entendu votre requête
      </h3>

      <p className="text-sm leading-relaxed max-w-sm mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>
        Votre message a bien franchi les remparts de la Citadelle. Nos chevaliers l'examinent avec toute la rigueur qui s'impose — nous vous répondrons au plus vite.
      </p>

      {/* Séparateur */}
      <div className="flex items-center gap-3">
        <div className="h-px w-10" style={{ background: "rgba(201,164,92,0.3)" }} />
        <Shield size={11} style={{ color: "rgba(201,164,92,0.4)" }} />
        <div className="h-px w-10" style={{ background: "rgba(201,164,92,0.3)" }} />
      </div>
    </div>
  );
}
