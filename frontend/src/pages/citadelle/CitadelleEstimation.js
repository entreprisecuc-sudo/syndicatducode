/**
 * Page Estimateur Pro — La Citadelle Numérique
 * Outil avancé d'estimation + formulaire de demande d'estimation professionnelle
 * SEO/GEO/AEO : JSON-LD FAQPage + Service + microdata Schema.org
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, ArrowRight, CheckCircle, ChevronDown, ChevronUp,
  BarChart2, Leaf, Layers, Send, Shield, Clock, Star, AlertCircle,
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// ── Constantes ────────────────────────────────────────────────────────────────

const SITE_TYPES = [
  { value: "contenu",     label: "Site de contenu / Blog" },
  { value: "ecommerce",   label: "E-commerce / Boutique" },
  { value: "saas",        label: "SaaS / Application web" },
  { value: "application", label: "Application mobile" },
  { value: "social",      label: "Compte / Réseau social" },
];

const AGES = [
  { value: "lt1",   label: "< 1 an" },
  { value: "1-3",   label: "1 — 3 ans" },
  { value: "3-5",   label: "3 — 5 ans" },
  { value: "5plus", label: "5 ans et +" },
];

const MULTIPLES = {
  saas:        { lt1: [10,15], "1-3": [14,20], "3-5": [18,26], "5plus": [22,30] },
  ecommerce:   { lt1: [8,12],  "1-3": [12,18], "3-5": [15,22], "5plus": [18,25] },
  contenu:     { lt1: [8,12],  "1-3": [12,18], "3-5": [14,20], "5plus": [16,24] },
  application: { lt1: [8,12],  "1-3": [12,18], "3-5": [15,22], "5plus": [18,26] },
  social:      { lt1: [4,7],   "1-3": [5,9],   "3-5": [7,12],  "5plus": [9,15]  },
};

const DIVERSIFICATION_OPTIONS = [
  { value: 1, label: "1 source unique (AdSense, affiliation...)", badge: "-7%" },
  { value: 2, label: "2 sources combinées", badge: "+3%" },
  { value: 3, label: "3 sources ou plus", badge: "+7%" },
];

const formatEur = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const pct = (mult) => {
  const diff = Math.round((mult - 1) * 100);
  return diff > 0 ? `+${diff}%` : `${diff}%`;
};

// ── Algorithme d'estimation ───────────────────────────────────────────────────

function compute({ revenue, siteType, age, seoPercent, growthPercent, diversification }) {
  const [baseLow, baseHigh] = MULTIPLES[siteType][age];

  // Ajustement SEO
  let seoMult, seoLabel, seoColor;
  if (seoPercent >= 60)      { seoMult = 1.07; seoLabel = `SEO dominant ≥ 60%`; seoColor = "#22c55e"; }
  else if (seoPercent >= 30) { seoMult = 1.03; seoLabel = `SEO solide 30–60%`; seoColor = "#84cc16"; }
  else if (seoPercent >= 20) { seoMult = 1.0;  seoLabel = `SEO modéré 20–30%`; seoColor = CITADELLE_COLORS.gold; }
  else                       { seoMult = 0.93; seoLabel = `SEO faible < 20%`; seoColor = "#ef4444"; }

  // Ajustement croissance
  let growthMult, growthLabel, growthColor;
  if (growthPercent > 10)      { growthMult = 1.10; growthLabel = `Forte croissance > 10%/mois`; growthColor = "#22c55e"; }
  else if (growthPercent >= 5) { growthMult = 1.05; growthLabel = `Bonne croissance 5–10%/mois`; growthColor = "#84cc16"; }
  else if (growthPercent >= 0) { growthMult = 1.0;  growthLabel = `Stable 0–5%/mois`; growthColor = CITADELLE_COLORS.gold; }
  else                         { growthMult = 0.88; growthLabel = `Déclin < 0%/mois`; growthColor = "#ef4444"; }

  // Ajustement diversification
  let divMult, divLabel, divColor;
  if (diversification >= 3)       { divMult = 1.07; divLabel = `3+ sources de revenus`; divColor = "#22c55e"; }
  else if (diversification === 2) { divMult = 1.03; divLabel = `2 sources de revenus`; divColor = "#84cc16"; }
  else                            { divMult = 0.93; divLabel = `1 seule source`; divColor = "#ef4444"; }

  const baseLowPrice  = revenue * baseLow;
  const baseHighPrice = revenue * baseHigh;
  const totalMult = seoMult * growthMult * divMult;
  const finalLow  = Math.round(baseLowPrice * totalMult);
  const finalHigh = Math.round(baseHighPrice * totalMult);

  return {
    baseLow, baseHigh, baseLowPrice, baseHighPrice,
    finalLow, finalHigh,
    adjustments: [
      { icon: BarChart2, label: seoLabel,     mult: seoMult,    color: seoColor },
      { icon: TrendingUp, label: growthLabel, mult: growthMult, color: growthColor },
      { icon: Layers,     label: divLabel,    mult: divMult,    color: divColor },
    ],
  };
}

// ── JSON-LD Schemas ───────────────────────────────────────────────────────────

const PAGE_SCHEMAS = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment estimer la valeur de mon site internet en France ?",
        acceptedAnswer: { "@type": "Answer", text: "La valeur d'un site internet en France se calcule avec la méthode du multiple SDE : Valeur = Bénéfice net mensuel × Multiple (8x à 30x). Ce multiple est ajusté selon le trafic SEO organique, le taux de croissance et la diversification des revenus. Notre outil gratuit intègre ces 5 paramètres pour une estimation précise." }
      },
      {
        "@type": "Question",
        name: "Combien coûte une estimation professionnelle de site internet ?",
        acceptedAnswer: { "@type": "Answer", text: "La demande d'estimation professionnelle sur La Citadelle Numérique est gratuite. Notre équipe analyse votre dossier (revenus vérifiés, trafic réel, actifs inclus) et vous fournit un rapport de valorisation détaillé sous 48h ouvrées." }
      },
      {
        "@type": "Question",
        name: "Quel est le multiple utilisé pour valoriser un SaaS en France ?",
        acceptedAnswer: { "@type": "Answer", text: "En France, un SaaS mature (3 à 5 ans) se valorise entre 18 et 26 fois son bénéfice net mensuel. Un SaaS avec une forte rétention et une croissance soutenue peut atteindre 22 à 30 fois le bénéfice mensuel." }
      },
      {
        "@type": "Question",
        name: "Pourquoi le trafic SEO améliore-t-il la valeur d'un site ?",
        acceptedAnswer: { "@type": "Answer", text: "Un trafic SEO organique dominant (> 60%) signifie que les revenus ne dépendent pas de publicités payantes coûteuses. C'est un actif stable et défendable, qui réduit le risque pour l'acheteur et justifie une prime de valorisation de 7 à 15%." }
      },
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Estimation professionnelle de business digital",
    provider: { "@type": "Organization", name: "La Citadelle Numérique", url: "https://lacitadellenumerique.fr" },
    description: "Service d'estimation gratuite de la valeur d'un site internet, SaaS ou e-commerce par des experts de la cession d'actifs numériques en France.",
    areaServed: "France",
    serviceType: "Valorisation de business digital",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Gratuit" }
  }
];

function usePageSchemas() {
  useEffect(() => {
    const scripts = PAGE_SCHEMAS.map((schema, i) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = `estimation-schema-${i}`;
      s.text = JSON.stringify(schema);
      document.head.appendChild(s);
      return s;
    });
    return () => scripts.forEach(s => s.remove());
  }, []);
}

// ── Composant Estimateur ──────────────────────────────────────────────────────

function AdvancedEstimator({ onResult, formRef }) {
  const [revenue, setRevenue]           = useState("");
  const [siteType, setSiteType]         = useState("contenu");
  const [age, setAge]                   = useState("1-3");
  const [seoPercent, setSeoPercent]     = useState(40);
  const [growthPercent, setGrowthPercent] = useState(3);
  const [diversification, setDiversification] = useState(2);
  const [result, setResult]             = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const rev = parseFloat(revenue);
    if (!rev || rev <= 0) return;
    const res = compute({ revenue: rev, siteType, age, seoPercent, growthPercent, diversification });
    setResult(res);
    onResult({ revenue: rev, siteType });
  };

  const reset = () => { setResult(null); setRevenue(""); onResult(null); };

  const inputStyle = {
    background: "white",
    border: `1px solid ${CITADELLE_COLORS.border}`,
    color: CITADELLE_COLORS.blue,
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  const sliderStyle = {
    width: "100%",
    accentColor: CITADELLE_COLORS.gold,
  };

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 4px 24px rgba(15,39,71,0.08)" }}>

      {/* En-tête card */}
      <div className="px-7 py-5" style={{ background: CITADELLE_COLORS.blue, borderBottom: `2px solid ${CITADELLE_COLORS.gold}` }}>
        <h2 className="font-black text-lg" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>
          Estimateur avancé
        </h2>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          5 paramètres · Méthode SDE · Ajustements qualité
        </p>
      </div>

      {!result ? (
        <form onSubmit={calculate} className="p-7 space-y-7">

          {/* 1. Bénéfice net */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
              Bénéfice net mensuel moyen (€) *
            </label>
            <p className="text-xs mb-2" style={{ color: CITADELLE_COLORS.textMuted }}>
              Revenus bruts moins toutes les charges d'exploitation
            </p>
            <input
              type="number" min="1" value={revenue}
              onChange={e => setRevenue(e.target.value)}
              placeholder="Ex : 2 000"
              required data-testid="adv-estimator-revenue"
              style={{ ...inputStyle, fontSize: 18, fontWeight: 700, border: `1px solid ${revenue ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}` }}
            />
          </div>

          {/* 2. Type de business */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
              Type de business
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SITE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setSiteType(t.value)}
                  data-testid={`adv-type-${t.value}`}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                  style={{
                    background: siteType === t.value ? `rgba(201,164,92,0.12)` : CITADELLE_COLORS.bg,
                    border: `1px solid ${siteType === t.value ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                    color: siteType === t.value ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                    fontWeight: siteType === t.value ? 700 : 500,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Ancienneté */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
              Ancienneté du site
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AGES.map(a => (
                <button key={a.value} type="button" onClick={() => setAge(a.value)}
                  data-testid={`adv-age-${a.value}`}
                  className="py-2.5 rounded-xl text-sm font-medium text-center transition-all"
                  style={{
                    background: age === a.value ? `rgba(201,164,92,0.12)` : CITADELLE_COLORS.bg,
                    border: `1px solid ${age === a.value ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                    color: age === a.value ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                    fontWeight: age === a.value ? 700 : 500,
                  }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Trafic SEO organique */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
              Trafic organique SEO
              <span className="ml-2 font-black" style={{ color: CITADELLE_COLORS.gold }}>{seoPercent}%</span>
            </label>
            <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
              Part des visites venant du référencement naturel (Google, Bing...)
            </p>
            <input type="range" min="0" max="100" value={seoPercent}
              onChange={e => setSeoPercent(Number(e.target.value))}
              data-testid="adv-seo-range" style={sliderStyle} />
            <div className="flex justify-between text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              <span>0% — Trafic payant</span><span>100% — SEO pur</span>
            </div>
          </div>

          {/* 5. Taux de croissance */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
              Taux de croissance mensuel
              <span className="ml-2 font-black" style={{ color: growthPercent < 0 ? "#ef4444" : CITADELLE_COLORS.gold }}>
                {growthPercent > 0 ? "+" : ""}{growthPercent}%
              </span>
            </label>
            <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
              Croissance moyenne des revenus sur les 6 derniers mois
            </p>
            <input type="range" min="-20" max="30" value={growthPercent}
              onChange={e => setGrowthPercent(Number(e.target.value))}
              data-testid="adv-growth-range" style={sliderStyle} />
            <div className="flex justify-between text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              <span>-20% Déclin</span><span>+30% Forte croissance</span>
            </div>
          </div>

          {/* 6. Diversification revenus */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
              Sources de revenus
            </label>
            <div className="space-y-2">
              {DIVERSIFICATION_OPTIONS.map(o => (
                <button key={o.value} type="button" onClick={() => setDiversification(o.value)}
                  data-testid={`adv-div-${o.value}`}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: diversification === o.value ? `rgba(201,164,92,0.12)` : CITADELLE_COLORS.bg,
                    border: `1px solid ${diversification === o.value ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                    color: diversification === o.value ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                  }}>
                  <span>{o.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: diversification === o.value ? CITADELLE_COLORS.gold : "rgba(0,0,0,0.06)",
                      color: diversification === o.value ? CITADELLE_COLORS.night : CITADELLE_COLORS.textMuted,
                    }}>
                    {o.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={!revenue}
            data-testid="adv-calculate-btn"
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
            Calculer mon estimation
          </button>
        </form>

      ) : (
        /* ── Résultat ── */
        <div className="p-7">

          {/* Fourchette finale */}
          <div className="text-center mb-6 py-6 rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.blue} 0%, #1a3a6b 100%)` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              Valeur estimée de votre site
            </p>
            <div className="flex items-baseline justify-center gap-2 flex-wrap">
              <span className="font-black" style={{
                fontSize: "clamp(1.8rem, 6vw, 2.8rem)",
                color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif", lineHeight: 1,
              }}>{formatEur(result.finalLow)}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1.5rem" }}>&mdash;</span>
              <span className="font-black" style={{
                fontSize: "clamp(1.8rem, 6vw, 2.8rem)",
                color: CITADELLE_COLORS.goldLight, fontFamily: "'Montserrat', sans-serif", lineHeight: 1,
              }}>{formatEur(result.finalHigh)}</span>
            </div>
          </div>

          {/* Décomposition */}
          <div className="space-y-3 mb-6">
            {/* Base */}
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <span className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                Base (×{result.baseLow} – ×{result.baseHigh})
              </span>
              <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.textMuted }}>
                {formatEur(result.baseLowPrice)} – {formatEur(result.baseHighPrice)}
              </span>
            </div>

            {/* Ajustements */}
            {result.adjustments.map(({ icon: Icon, label, mult, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color, flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>{label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>
                  {pct(mult)}
                </span>
              </div>
            ))}
          </div>

          {/* Message + CTA vers formulaire */}
          <div className="rounded-2xl p-4 mb-5"
            style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}>
            <p className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.blue }}>
              <strong>Cette estimation est indicative.</strong> Une analyse professionnelle de vos données réelles (Analytics, revenus Stripe, trafic GSC) peut affiner ce résultat de ±30%.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02]"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="adv-cta-form">
              Demander une estimation professionnelle
              <ArrowRight size={17} />
            </button>
            <button onClick={reset}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
              style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}` }}
              data-testid="adv-reset-btn">
              Recommencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Formulaire de contact ─────────────────────────────────────────────────────

function ContactForm({ prefillType }) {
  const [form, setForm] = useState({
    nom: "", email: "", url_site: "",
    type_site: prefillType || "contenu",
    benefice_mensuel: "", ca_mensuel: "", message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (prefillType) setForm(f => ({ ...f, type_site: prefillType }));
  }, [prefillType]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading"); setErreur("");
    try {
      await citadelleApi.post("/citadelle/estimation/request", {
        ...form,
        benefice_mensuel: form.benefice_mensuel ? parseFloat(form.benefice_mensuel) : null,
        ca_mensuel: form.ca_mensuel ? parseFloat(form.ca_mensuel) : null,
      });
      setStatus("success");
    } catch (err) {
      setErreur(err?.response?.data?.detail || "Une erreur est survenue.");
      setStatus("error");
    }
  };

  const fieldStyle = {
    background: "white",
    border: `1px solid ${CITADELLE_COLORS.border}`,
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    color: CITADELLE_COLORS.blue,
    transition: "border-color 0.2s",
  };

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: CITADELLE_COLORS.blue };

  if (status === "success") {
    return (
      <div className="rounded-3xl overflow-hidden"
        style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 4px 24px rgba(15,39,71,0.08)" }}>
        <div className="p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(34,197,94,0.1)" }}>
            <CheckCircle size={32} style={{ color: "#22c55e" }} />
          </div>
          <h3 className="text-xl font-black mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            Demande envoyée !
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
            Notre équipe analyse votre dossier et vous contacte sous <strong>48h ouvrées</strong> avec un rapport de valorisation détaillé.
          </p>
          <Link to="/citadelle/annonces"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
            Parcourir les annonces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 4px 24px rgba(15,39,71,0.08)" }}>

      {/* En-tête */}
      <div className="px-7 py-5" style={{ background: CITADELLE_COLORS.night, borderBottom: `2px solid ${CITADELLE_COLORS.gold}` }}>
        <h2 className="font-black text-lg" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>
          Estimation professionnelle gratuite
        </h2>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          Rapport personnalisé · Réponse sous 48h · 100% gratuit
        </p>
      </div>

      {/* Promesses */}
      <div className="grid grid-cols-3 gap-0"
        style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
        {[
          { icon: Shield,   text: "Données confidentielles" },
          { icon: Clock,    text: "Réponse sous 48h" },
          { icon: Star,     text: "Sans engagement" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-1.5 py-4 px-2 text-center">
            <Icon size={16} style={{ color: CITADELLE_COLORS.gold }} />
            <p className="text-xs font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>{text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-7 space-y-5">

        {/* Nom + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Prénom &amp; Nom *</label>
            <input type="text" required value={form.nom} onChange={set("nom")}
              placeholder="Jean Dupont" style={fieldStyle}
              data-testid="form-nom" />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" required value={form.email} onChange={set("email")}
              placeholder="jean@exemple.fr" style={fieldStyle}
              data-testid="form-email" />
          </div>
        </div>

        {/* URL du site */}
        <div>
          <label style={labelStyle}>URL du site à estimer</label>
          <input type="url" value={form.url_site} onChange={set("url_site")}
            placeholder="https://monsite.fr" style={fieldStyle}
            data-testid="form-url" />
        </div>

        {/* Type de site */}
        <div>
          <label style={labelStyle}>Type de business *</label>
          <select required value={form.type_site} onChange={set("type_site")}
            style={fieldStyle} data-testid="form-type">
            {SITE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* CA + Bénéfice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>CA mensuel moyen (€)</label>
            <input type="number" min="0" value={form.ca_mensuel} onChange={set("ca_mensuel")}
              placeholder="Ex : 8 000" style={fieldStyle}
              data-testid="form-ca" />
          </div>
          <div>
            <label style={labelStyle}>Bénéfice net mensuel (€)</label>
            <input type="number" min="0" value={form.benefice_mensuel} onChange={set("benefice_mensuel")}
              placeholder="Ex : 2 000" style={fieldStyle}
              data-testid="form-benefice" />
          </div>
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Informations complémentaires</label>
          <textarea value={form.message} onChange={set("message")} rows={4}
            placeholder="Ancienneté, trafic mensuel, outils utilisés, motivations de vente..."
            style={{ ...fieldStyle, resize: "vertical" }}
            data-testid="form-message" />
        </div>

        {erreur && (
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: "#ef4444" }}>{erreur}</p>
          </div>
        )}

        <button type="submit" disabled={status === "loading"}
          data-testid="form-submit-btn"
          className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: CITADELLE_COLORS.blue, color: "white" }}>
          {status === "loading" ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi en cours...</>
          ) : (
            <><Send size={16} /> Envoyer ma demande d'estimation</>
          )}
        </button>

        <p className="text-xs text-center" style={{ color: CITADELLE_COLORS.textMuted }}>
          Vos données sont traitées conformément à notre{" "}
          <Link to="/citadelle/confidentialite" className="underline" style={{ color: CITADELLE_COLORS.gold }}>
            politique de confidentialité
          </Link>
        </p>
      </form>
    </div>
  );
}

// ── FAQ AEO ───────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
      className="rounded-2xl overflow-hidden transition-all"
      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, background: "white" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left transition-all hover:bg-gray-50"
        style={{ cursor: "pointer" }}>
        <h3 itemProp="name" className="font-bold text-sm pr-4" style={{ color: CITADELLE_COLORS.blue }}>
          {question}
        </h3>
        {open ? <ChevronUp size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
               : <ChevronDown size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />}
      </button>
      {open && (
        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer"
          className="px-5 pb-5" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}`, paddingTop: 16 }}>
          <p itemProp="text" className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function CitadelleEstimation() {
  const formRef = useRef(null);
  const [prefillType, setPrefillType] = useState(null);
  usePageSchemas();

  return (
    <CitadelleLayout pageTitle="Estimation de valeur de site internet — La Citadelle Numérique">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 md:py-20"
        style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}
        data-testid="estimation-hero">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(201,164,92,0.09) 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: CITADELLE_COLORS.gold, filter: "blur(100px)" }} />

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-semibold tracking-wider uppercase"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}>
            <TrendingUp size={13} />
            Outil gratuit · Méthode SDE professionnelle
          </div>

          {/* H1 optimisé SEO/GEO */}
          <h1 className="font-black mb-4 leading-tight"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(2rem, 6vw, 3.2rem)", color: "white" }}>
            Estimation de la valeur de<br />
            <span style={{ color: CITADELLE_COLORS.gold }}>votre site internet</span>
          </h1>
          <p className="mb-8 leading-relaxed" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", maxWidth: 580, margin: "0 auto 2rem" }}>
            Utilisez notre outil avancé à 5 paramètres (bénéfice net, type, ancienneté, SEO, croissance)
            pour obtenir une fourchette de valorisation précise — ou demandez une analyse professionnelle complète.
            Méthode utilisée par les experts en cession de business digital en <strong style={{ color: "rgba(255,255,255,0.9)" }}>France</strong>.
          </p>

          {/* Pills stats */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: BarChart2, text: "Méthode SDE standard" },
              { icon: Leaf,      text: "5 paramètres d'ajustement" },
              { icon: Shield,    text: "Estimation gratuite sous 48h" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
                <Icon size={14} style={{ color: CITADELLE_COLORS.gold }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deux colonnes ── */}
      <section className="py-14" style={{ background: CITADELLE_COLORS.bg }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Colonne gauche — Estimateur sticky */}
            <div style={{ position: "sticky", top: 24 }}>
              <AdvancedEstimator
                onResult={(r) => setPrefillType(r?.siteType || null)}
                formRef={formRef}
              />
            </div>

            {/* Colonne droite — Formulaire */}
            <div ref={formRef}>
              <ContactForm prefillType={prefillType} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Table comparative des multiples ── */}
      <section className="py-14" style={{ background: "white" }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="font-black text-center mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.4rem, 3vw, 1.9rem)", color: CITADELLE_COLORS.blue }}>
            Multiples de valorisation par type de site
          </h2>
          <p className="text-center mb-8 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            Fourchettes appliquées avant ajustements SEO, croissance et diversification
          </p>

          <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: CITADELLE_COLORS.blue }}>
                  <th className="text-left p-4 font-bold text-white">Type de business</th>
                  {AGES.map(a => (
                    <th key={a.value} className="p-4 font-bold text-white text-center">{a.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SITE_TYPES.map((t, i) => (
                  <tr key={t.value} style={{ background: i % 2 === 0 ? "white" : CITADELLE_COLORS.bg }}>
                    <td className="p-4 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{t.label}</td>
                    {AGES.map(a => {
                      const [lo, hi] = MULTIPLES[t.value][a.value];
                      return (
                        <td key={a.value} className="p-4 text-center font-bold"
                          style={{ color: CITADELLE_COLORS.gold }}>
                          {lo}x – {hi}x
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: CITADELLE_COLORS.textMuted }}>
            Multiple × bénéfice net mensuel moyen. Méthode SDE — marché français 2026.
          </p>
        </div>
      </section>

      {/* ── FAQ AEO ── */}
      <section className="py-14" style={{ background: CITADELLE_COLORS.bg }}
        itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="font-black text-center mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.4rem, 3vw, 1.9rem)", color: CITADELLE_COLORS.blue }}>
            Questions fréquentes
          </h2>
          <p className="text-center mb-8 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            Valorisation · Méthodes · Estimation professionnelle en France
          </p>
          <div className="space-y-3">
            {[
              {
                question: "Comment estimer la valeur de mon site internet en France ?",
                answer: "La valeur d'un site internet en France se calcule avec la méthode du multiple SDE : Valeur = Bénéfice net mensuel × Multiple. Ce multiple ( 8x à 30x) est ajusté selon la qualité du trafic SEO organique, le taux de croissance mensuel et la diversification des revenus. Notre outil intègre ces 5 paramètres pour une fourchette réaliste."
              },
              {
                question: "Combien coûte une estimation professionnelle de site internet ?",
                answer: "La demande d'estimation professionnelle sur La Citadelle Numérique est entièrement gratuite et sans engagement. Notre équipe analyse vos données réelles (Analytics, Stripe, GSC) et vous remet un rapport de valorisation sous 48h ouvrées."
              },
              {
                question: "Quel est le multiple pour valoriser un SaaS en France ?",
                answer: "Un SaaS français mature (3 à 5 ans) se valorise entre 18x et 26x son bénéfice net mensuel. Avec une forte croissance et un faible churn, le multiple peut atteindre 22x à 30x. Un SaaS en démarrage (< 1 an) se valorisera plutôt 10x–15x."
              },
              {
                question: "Pourquoi le trafic SEO influence-t-il la valeur de mon site ?",
                answer: "Un trafic organique dominant (> 60%) signifie que les revenus ne dépendent pas de publicités payantes. C'est un actif stable et prévisible qui réduit le risque pour l'acheteur et justifie une prime de valorisation de 7 à 15% par rapport à un site 100% dépendant des ads."
              },
              {
                question: "Quelle différence entre l'estimateur gratuit et l'estimation professionnelle ?",
                answer: "L'estimateur gratuit donne une fourchette basée sur des paramètres déclaratifs. L'estimation professionnelle inclut la vérification des revenus réels (captures Stripe/PayPal), l'analyse du trafic Google Analytics et Search Console, la comparaison avec des transactions récentes similaires, et un rapport écrit défendable face à un acheteur."
              },
            ].map(item => (
              <FaqItem key={item.question} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-14 relative overflow-hidden" style={{ background: CITADELLE_COLORS.night }}>
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
          backgroundSize: "30px 30px"
        }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-black mb-4"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "white" }}>
            Prêt à vendre votre actif numérique ?
          </h2>
          <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Publiez votre annonce gratuitement après avoir obtenu votre estimation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/citadelle/inscription"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              Créer mon compte gratuit <ArrowRight size={15} />
            </Link>
            <Link to="/citadelle/annonces"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}>
              Voir les annonces
            </Link>
          </div>
        </div>
      </section>
    </CitadelleLayout>
  );
}
