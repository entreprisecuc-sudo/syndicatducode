/**
 * Page d'accueil — La Citadelle Numérique
 * Charte graphique : Bleu Citadelle #0F2747 / Or Prestige #C9A45C
 * Sections : Hero (+ barre de recherche) → Catégories → Comment ça marche → Services → CTA
 */

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Shield, TrendingUp, Lock, Globe, ShoppingCart, Cloud,
  Monitor, Users, ArrowRight, Star, Search, SlidersHorizontal,
  ShieldCheck, ArrowRightLeft, FileSearch, ChevronRight, ChevronLeft
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import NewsletterSection from "@/components/citadelle/NewsletterSection";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CATEGORIES, CITADELLE_SERVICES, CITADELLE_CONFIG, getListingImageUrl, isImageFile } from "@/config/citadelleConstants";

// ── Icônes par slug ───────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  Globe, ShoppingCart, Cloud, Monitor, Users
};

const SERVICE_ICONS = {
  TrendingUp, ShieldCheck, ArrowRightLeft, FileSearch
};

// ── Constantes Estimateur ────────────────────────────────────────────────────

const SITE_TYPES = [
  { value: "contenu",     label: "Site de contenu / Blog" },
  { value: "ecommerce",   label: "E-commerce / Boutique" },
  { value: "saas",        label: "SaaS / Application web" },
  { value: "application", label: "Application mobile" },
  { value: "social",      label: "Compte / Réseau social" },
];

const AGES = [
  { value: "lt1",  label: "< 1 an" },
  { value: "1-3",  label: "1 — 3 ans" },
  { value: "3-5",  label: "3 — 5 ans" },
  { value: "5plus",label: "5 ans et +" },
];

// Multiples bas/haut par type × ancienneté — Marché français 2026 (méthode SDE)
const MULTIPLES = {
  saas:        { lt1: [10,15], "1-3": [14,20], "3-5": [18,26], "5plus": [22,30] },
  ecommerce:   { lt1: [8,12],  "1-3": [12,18], "3-5": [15,22], "5plus": [18,25] },
  contenu:     { lt1: [8,12],  "1-3": [12,18], "3-5": [14,20], "5plus": [16,24] },
  application: { lt1: [8,12],  "1-3": [12,18], "3-5": [15,22], "5plus": [18,26] },
  social:      { lt1: [4,7],   "1-3": [5,9],   "3-5": [7,12],  "5plus": [9,15]  },
};

const formatEur = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// Schema.org JSON-LD — FAQ AEO pour rich snippets Google
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Combien vaut mon site internet ?",
      acceptedAnswer: { "@type": "Answer", text: "La valeur d'un site internet se calcule en multipliant son bénéfice net mensuel moyen par un multiple de marché (8x à 30x selon le type et l'ancienneté). Un site de contenu générant 1 000 €/mois vaut généralement entre 12 000 € et 18 000 € sur le marché français." }
    },
    {
      "@type": "Question",
      name: "Comment estimer la valeur d'un site web en France ?",
      acceptedAnswer: { "@type": "Answer", text: "En France, la méthode standard est le multiple de SDE : Valeur = Bénéfice net mensuel × Multiple. Ce multiple varie de 8x pour un site récent à 30x pour un SaaS mature bien établi. La Citadelle Numérique propose une estimation gratuite et professionnelle." }
    },
    {
      "@type": "Question",
      name: "Quel est le prix d'un site internet rentable à vendre ?",
      acceptedAnswer: { "@type": "Answer", text: "Un site rentable se vend entre 12 et 22 fois son bénéfice net mensuel en France. Les SaaS bien établis peuvent atteindre 22 à 30 fois. L'ancienneté, la qualité SEO et la diversification des revenus influencent fortement le multiple de valorisation." }
    },
  ]
};

function useEstimatorSchema() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "estimator-faq-schema";
    script.text = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);
    return () => { document.getElementById("estimator-faq-schema")?.remove(); };
  }, []);
}


// ── Section Estimateur ────────────────────────────────────────────────────────

const EstimatorSection = () => {
  const [revenue, setRevenue]   = useState("");
  const [siteType, setSiteType] = useState("contenu");
  const [age, setAge]           = useState("1-3");
  const [result, setResult]     = useState(null);
  useEstimatorSchema();

  const calculate = (e) => {
    e.preventDefault();
    const rev = parseFloat(revenue);
    if (!rev || rev <= 0) return;
    const [low, high] = MULTIPLES[siteType][age];
    setResult({ price_low: rev * low, price_high: rev * high, rev, mult_low: low, mult_high: high });
  };

  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{ background: CITADELLE_COLORS.night }}
      data-testid="citadelle-estimator"
      aria-labelledby="estimator-heading"
    >
      {/* Motif de fond */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(201,164,92,0.08) 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />
      <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
        style={{ background: CITADELLE_COLORS.gold, filter: "blur(100px)" }} />

      <div className="relative max-w-3xl mx-auto px-4 md:px-6">

        {/* En-tête SEO/GEO */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-semibold tracking-wider uppercase"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}>
            <TrendingUp size={13} />
            Outil <strong>GRATUIT</strong> · Estimation instantanée
          </div>
          <h2
            id="estimator-heading"
            className="font-black mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", color: "white" }}
          >
            Combien vaut votre site internet ?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.05rem" }}>
            Estimez la valeur de votre business digital en 30 secondes &mdash; France &amp; Europe
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.2)", backdropFilter: "blur(12px)" }}>

          {!result ? (
            /* ── Formulaire ── */
            <form onSubmit={calculate} className="p-8 md:p-10 space-y-7">

              {/* Bénéfice net */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Bénéfice net mensuel moyen (€)
                </label>
                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Revenus bruts &minus; toutes les charges (hébergement, outils, publicité…)
                </p>
                <input
                  type="number" min="1" value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  placeholder="Ex : 1 500"
                  required
                  data-testid="estimator-revenue-input"
                  className="w-full px-5 py-4 rounded-xl outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1px solid ${revenue ? CITADELLE_COLORS.gold : "rgba(201,164,92,0.3)"}`,
                    color: "white", fontSize: "1.25rem", fontWeight: 700,
                  }}
                />
              </div>

              {/* Type de business */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Type de business
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SITE_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setSiteType(t.value)}
                      data-testid={`estimator-type-${t.value}`}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                      style={{
                        background: siteType === t.value ? "rgba(201,164,92,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${siteType === t.value ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.1)"}`,
                        color: siteType === t.value ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.55)",
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ancienneté */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Ancienneté du site
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AGES.map(a => (
                    <button key={a.value} type="button" onClick={() => setAge(a.value)}
                      data-testid={`estimator-age-${a.value}`}
                      className="py-3 rounded-xl text-sm font-medium text-center transition-all"
                      style={{
                        background: age === a.value ? "rgba(201,164,92,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${age === a.value ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.1)"}`,
                        color: age === a.value ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.55)",
                      }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!revenue}
                data-testid="estimator-calculate-btn"
                className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                Estimer gratuitement — résultat instantané
              </button>
              <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                Sans inscription · Sans engagement · 100% gratuit
              </p>
            </form>

          ) : (
            /* ── Résultat ── */
            <div className="p-8 md:p-10">
              <div className="text-center mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "rgba(255,255,255,0.45)" }}>
                  Valeur estimée de votre site
                </p>
                <div className="flex items-baseline justify-center gap-3 flex-wrap">
                  <span className="font-black" style={{
                    fontSize: "clamp(2rem, 8vw, 3.8rem)", color: CITADELLE_COLORS.gold,
                    fontFamily: "'Montserrat', sans-serif", lineHeight: 1,
                  }}>
                    {formatEur(result.price_low)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "2rem" }}>&mdash;</span>
                  <span className="font-black" style={{
                    fontSize: "clamp(2rem, 8vw, 3.8rem)", color: CITADELLE_COLORS.goldLight,
                    fontFamily: "'Montserrat', sans-serif", lineHeight: 1,
                  }}>
                    {formatEur(result.price_high)}
                  </span>
                </div>
                <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Multiple de {result.mult_low}x à {result.mult_high}x &times; {formatEur(result.rev)} de bénéfice net mensuel
                </p>
              </div>

              {/* Barre dégradé */}
              <div className="rounded-full h-1.5 mb-7" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="rounded-full h-1.5"
                  style={{ width: "100%", background: `linear-gradient(to right, ${CITADELLE_COLORS.gold}, ${CITADELLE_COLORS.goldLight})` }} />
              </div>

              {/* Nuance */}
              <div className="rounded-2xl p-5 mb-6"
                style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.2)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>
                  <strong style={{ color: CITADELLE_COLORS.gold }}>Cette fourchette est indicative.</strong>{" "}
                  Le prix réel dépend de la stabilité des revenus, de la qualité du SEO, des actifs inclus et de l'état technique.
                  Une estimation professionnelle peut affiner ce résultat de ±30%.
                </p>
              </div>

              {/* CTA service */}
              <div className="space-y-3">
                <Link to="/citadelle/estimation"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02]"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="estimator-cta-service">
                  Obtenir une estimation professionnelle
                  <ArrowRight size={17} />
                </Link>
                <button onClick={() => { setResult(null); setRevenue(""); }}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="estimator-reset-btn">
                  Recommencer une estimation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── FAQ AEO — Schema.org microdata + contenu visible ── */}
        <div className="mt-14 space-y-4" itemScope itemType="https://schema.org/FAQPage">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
            Questions fréquentes · Valorisation de site internet
          </p>
          {[
            {
              q: "Combien vaut mon site internet ?",
              a: "La valeur de votre site se calcule en multipliant votre bénéfice net mensuel moyen par un multiple de marché (8x à 30x selon le type et l'ancienneté). Un site de contenu générant 1 000 €/mois vaut généralement entre 12 000 € et 18 000 € sur le marché français.",
            },
            {
              q: "Comment estimer la valeur d'un site web en France ?",
              a: "La méthode standard en France est le multiple de SDE : Valeur = Bénéfice net mensuel × Multiple. Ce multiple varie de 8x (site récent) à 30x (SaaS mature). Notre équipe réalise des estimations professionnelles gratuites basées sur vos vraies données.",
            },
            {
              q: "Quel est le prix d'un site internet rentable à vendre ?",
              a: "Un site rentable se vend entre 12 et 22 fois son bénéfice net mensuel en France. Les SaaS bien établis peuvent atteindre 22 à 30 fois. L'ancienneté, la diversification des revenus et la qualité SEO influencent fortement le multiple.",
            },
          ].map(({ q, a }) => (
            <div key={q} itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 itemProp="name" className="font-semibold text-sm mb-2" style={{ color: CITADELLE_COLORS.gold }}>
                {q}
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ── Section Barre de recherche ────────────────────────────────────────────────

const BUDGET_OPTIONS = [
  { value: "", label: "Tous les budgets" },
  { value: "0-5000", label: "Moins de 5 000 €" },
  { value: "5000-20000", label: "5 000 € — 20 000 €" },
  { value: "20000-50000", label: "20 000 € — 50 000 €" },
  { value: "50000-100000", label: "50 000 € — 100 000 €" },
  { value: "100000+", label: "Plus de 100 000 €" },
];

const SearchBar = () => {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (type) params.set("type", type);
    if (budget) params.set("budget", budget);
    navigate(`/citadelle/annonces?${params.toString()}`);
  };

  const sepStyle = {
    width: "1px",
    alignSelf: "stretch",
    background: "rgba(255,255,255,0.12)",
    flexShrink: 0,
    margin: "10px 0",
  };

  return (
    <div className="relative z-10 mt-8 mx-4 md:mx-0" data-testid="citadelle-searchbar">
      {/* Desktop — barre pill unifiée */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center rounded-full overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(201,164,92,0.35)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        {/* Mot-clé */}
        <div className="flex items-center gap-2.5 flex-1 px-5 py-4">
          <Search size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Mot-clé, niche, technologie..."
            className="bg-transparent outline-none text-sm w-full placeholder-white/40"
            style={{ color: "white" }}
            data-testid="citadelle-search-keyword"
          />
        </div>

        <div style={sepStyle} />

        {/* Type d'actif */}
        <div className="flex items-center gap-2.5 px-5 py-4 w-48">
          <SlidersHorizontal size={15} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
            style={{ color: type ? "white" : "rgba(255,255,255,0.45)" }}
            data-testid="citadelle-search-type"
          >
            <option value="" style={{ background: "#0F2747" }}>Type d'actif</option>
            {CITADELLE_CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug} style={{ background: "#0F2747" }}>{c.label}</option>
            ))}
          </select>
        </div>

        <div style={sepStyle} />

        {/* Budget */}
        <div className="flex items-center gap-2.5 px-5 py-4 w-52">
          <TrendingUp size={15} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
          <select
            value={budget}
            onChange={e => setBudget(e.target.value)}
            className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
            style={{ color: budget ? "white" : "rgba(255,255,255,0.45)" }}
            data-testid="citadelle-search-budget"
          >
            {BUDGET_OPTIONS.map(o => (
              <option key={o.value} value={o.value} style={{ background: "#0F2747" }}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Bouton */}
        <div className="p-2 pr-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 hover:brightness-110"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="citadelle-search-submit"
          >
            <Search size={15} />
            Rechercher
          </button>
        </div>
      </form>

      {/* Mobile — empilement vertical */}
      <form onSubmit={handleSearch} className="flex md:hidden flex-col gap-3">
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}
        >
          <Search size={16} style={{ color: CITADELLE_COLORS.gold }} />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Mot-clé, niche, technologie..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "white" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}
          >
            <SlidersHorizontal size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
              style={{ color: type ? "white" : "rgba(255,255,255,0.45)" }}
            >
              <option value="" style={{ background: "#0F2747" }}>Type</option>
              {CITADELLE_CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug} style={{ background: "#0F2747" }}>{c.label}</option>
              ))}
            </select>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}
          >
            <TrendingUp size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <select
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
              style={{ color: budget ? "white" : "rgba(255,255,255,0.45)" }}
            >
              {BUDGET_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: "#0F2747" }}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="citadelle-search-submit-mobile"
        >
          <Search size={16} />
          Rechercher
        </button>
      </form>
    </div>
  );
};

// ── Section Hero ─────────────────────────────────────────────────────────────

const HeroSection = () => (
  <section
    className="relative overflow-hidden"
    style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)`, minHeight: "90vh", display: "flex", alignItems: "center" }}
    data-testid="citadelle-hero"
  >
    {/* Motif de fond */}
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
      backgroundSize: "40px 40px"
    }} />
    {/* Orbes lumineux */}
    <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: CITADELLE_COLORS.gold, filter: "blur(120px)" }} />
    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: CITADELLE_COLORS.blue, filter: "blur(80px)" }} />

    <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20 w-full">
      <div className="max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold tracking-wider uppercase"
          style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}>
          <Shield size={14} />
          Plateforme française sécurisée
        </div>

        {/* Titre */}
        <h1 className="font-bold leading-tight mb-6" style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "white"
        }}>
          Achetez.{" "}
          <span style={{ color: CITADELLE_COLORS.gold }}>Vendez.</span>{" "}
          Sécurisez.
        </h1>

        <p className="mb-8 leading-relaxed" style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.7)", maxWidth: "560px" }}>
          {CITADELLE_CONFIG.description}
          {" "}Des milliers d'actifs numériques vérifiés, des transactions entièrement sécurisées.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            to="/citadelle/annonces"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.blue, color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            data-testid="citadelle-hero-cta-annonces"
          >
            Voir les annonces
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/citadelle/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="citadelle-hero-cta-publier"
          >
            Publier gratuitement
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Barre de recherche */}
        <SearchBar />

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-8">
          {[
            { value: "100%", label: "Transactions sécurisées", icon: Lock },
            { value: "Gratuit", label: "Publication d'annonce", icon: Star },
            { value: "5%", label: "Commission à la vente", icon: TrendingUp },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.15)" }}>
                <Icon size={18} style={{ color: CITADELLE_COLORS.gold }} />
              </div>
              <div>
                <p className="font-bold text-sm md:text-base" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>{value}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Carrousel des dernières annonces */}
        <HeroListingsCarousel />
      </div>
    </div>
  </section>
);

// ── Carrousel des dernières annonces (Hero) ─────────────────────────────────
const PLACEHOLDER_HOME = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' fill='%230F2747'%3E%3Crect width='400' height='240'/%3E%3Ctext x='50%25' y='50%25' fill='%23C9A45C' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E🏰%3C/text%3E%3C/svg%3E";

const HeroListingsCarousel = () => {
  const [listings, setListings] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    citadelleApi.get("/listings", { params: { limit: 10, sort: "recent" } })
      .then(res => setListings((res.data.listings || []).filter(l => l.status === "active")))
      .catch(() => {});
  }, []);

  if (!listings.length) return null;

  const scrollBy = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <div className="mt-10" data-testid="hero-listings-carousel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: CITADELLE_COLORS.gold }} />
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.85)" }}>
            Dernières annonces
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/citadelle/annonces" className="text-xs font-semibold transition-all hover:opacity-80" style={{ color: CITADELLE_COLORS.gold }}>
            Voir tout →
          </Link>
          <div className="hidden sm:flex gap-1.5 ml-1">
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Précédent"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,164,92,0.25)", color: CITADELLE_COLORS.gold }}
              data-testid="carousel-prev">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Suivant"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,164,92,0.25)", color: CITADELLE_COLORS.gold }}
              data-testid="carousel-next">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`[data-testid="hero-listings-carousel"] div::-webkit-scrollbar{display:none}`}</style>
        {listings.map((l) => {
          const img = l.images?.filter(Boolean).find(isImageFile);
          const cover = l.is_adult ? null : (img ? getListingImageUrl(img) : PLACEHOLDER_HOME);
          return (
            <Link
              key={l.id}
              to={`/citadelle/annonces/${l.slug}`}
              className="group flex-shrink-0 w-[220px] rounded-2xl overflow-hidden snap-start transition-all duration-200 hover:-translate-y-1"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,164,92,0.18)", backdropFilter: "blur(8px)" }}
              data-testid={`carousel-card-${l.slug}`}
            >
              <div className="relative h-28 overflow-hidden" style={{ background: CITADELLE_COLORS.night }}>
                {l.is_adult ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1626,#2d1b2e)" }}>
                    <span className="text-xs font-black px-2 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", border: "1px solid #f87171" }}>18+</span>
                  </div>
                ) : (
                  <img src={cover} alt={l.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.target.src = PLACEHOLDER_HOME; }} />
                )}
                {l.is_featured && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                    <Star size={9} /> Recommandé
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold line-clamp-1 mb-1" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>
                  {l.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black" style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>
                    {l.price?.toLocaleString("fr-FR")} €
                  </span>
                  {l.monthly_revenue != null && (
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {l.monthly_revenue.toLocaleString("fr-FR")} €/mois
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ── Section Catégories ────────────────────────────────────────────────────────

const CategoriesSection = () => (
  <section className="py-20" style={{ background: CITADELLE_COLORS.bg }} data-testid="citadelle-categories">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: CITADELLE_COLORS.blue }}>
          Que souhaitez-vous acheter ?
        </h2>
        <p style={{ color: CITADELLE_COLORS.textMuted }}>Explorez les annonces par catégorie d'actif numérique</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CITADELLE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon] || Globe;
          return (
            <Link
              key={cat.slug}
              to={`/citadelle/annonces?type=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1"
              style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 2px 8px rgba(15,39,71,0.05)" }}
              data-testid={`citadelle-category-${cat.slug}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `rgba(15,39,71,0.06)` }}>
                <Icon size={22} style={{ color: CITADELLE_COLORS.blue }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{cat.label}</p>
                <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>{cat.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

// ── Section Comment ça marche ─────────────────────────────────────────────────

const HowItWorksSection = () => (
  <section className="py-20" style={{ background: CITADELLE_COLORS.blue }} data-testid="citadelle-how-it-works">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: "white" }}>
          Comment ça marche ?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)" }}>Un processus simple, transparent et sécurisé en 3 étapes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            step: "01",
            icon: Globe,
            title: "Publiez votre actif",
            desc: "Créez votre annonce gratuitement en quelques minutes. Notre équipe la valide sous 24h avant publication.",
            color: CITADELLE_COLORS.gold
          },
          {
            step: "02",
            icon: Users,
            title: "Négociez en confiance",
            desc: "Échangez avec les acheteurs via notre messagerie sécurisée. Vos données restent protégées jusqu'à la signature.",
            color: CITADELLE_COLORS.gold
          },
          {
            step: "03",
            icon: Lock,
            title: "Sécurisez la transaction",
            desc: "Les fonds sont placés en séquestre Stripe. Le transfert se fait sous supervision. Libération après validation acheteur.",
            color: CITADELLE_COLORS.gold
          },
        ].map(({ step, icon: Icon, title, desc, color }) => (
          <div key={step} className="relative p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,164,92,0.2)" }}>
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl font-black" style={{ color: "rgba(201,164,92,0.25)", fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{step}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.15)" }}>
                <Icon size={22} style={{ color: CITADELLE_COLORS.gold }} />
              </div>
            </div>
            <h3 className="font-bold mb-3 text-lg" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Section Services ──────────────────────────────────────────────────────────

const ServicesSection = () => (
  <section className="py-20" style={{ background: "white" }} data-testid="citadelle-services">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: CITADELLE_COLORS.blue }}>
          Nos services d'accompagnement
        </h2>
        <p style={{ color: CITADELLE_COLORS.textMuted }}>Des experts pour valoriser et sécuriser votre transaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CITADELLE_SERVICES.map((service) => {
          const Icon = SERVICE_ICONS[service.icon] || Shield;
          return (
            <div
              key={service.slug}
              className="group p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}
              data-testid={`citadelle-service-${service.slug}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                style={{ background: `rgba(15,39,71,0.08)` }}>
                <Icon size={22} style={{ color: CITADELLE_COLORS.blue }} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>{service.label}</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>{service.description}</p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(201,164,92,0.12)", color: CITADELLE_COLORS.gold }}>
                {service.price}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ── Section CTA Final ─────────────────────────────────────────────────────────

const CTASection = () => (
  <section className="py-20 relative overflow-hidden" style={{ background: CITADELLE_COLORS.night }} data-testid="citadelle-cta">
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
      backgroundSize: "30px 30px"
    }} />
    <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
        <Shield size={30} style={{ color: CITADELLE_COLORS.gold }} />
      </div>
      <h2 className="font-black mb-4" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", color: "white" }}>
        Prêt à vendre votre actif numérique ?
      </h2>
      <p className="mb-8 text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
        Rejoignez la plateforme française de référence. Publication gratuite, commission de 5% uniquement à la vente.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/citadelle/inscription"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="citadelle-cta-publier"
        >
          Créer mon compte gratuit
          <ChevronRight size={18} />
        </Link>
        <Link
          to="/citadelle/annonces"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)" }}
        >
          Parcourir les annonces
        </Link>
      </div>
      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Aucun frais d'inscription · Annonce publiée sous 24h · Transactions sécurisées par Stripe
      </p>
    </div>
  </section>
);

// ── Page principale ───────────────────────────────────────────────────────────

export default function CitadelleHome() {
  return (
    <CitadelleLayout pageTitle="Accueil">
      <Helmet>
        <title>La Citadelle Numérique | Marketplace d'actifs numériques</title>
        <meta name="description" content="Achetez et vendez des sites web, SaaS, boutiques e-commerce et actifs numériques en toute sécurité. La marketplace française de référence pour les transactions d'actifs digitaux." />
        <meta property="og:title" content="La Citadelle Numérique | Marketplace d'actifs numériques" />
        <meta property="og:description" content="Achetez et vendez des sites web, SaaS, boutiques e-commerce et actifs numériques en toute sécurité. La marketplace française de référence." />
        <meta property="og:url" content="https://lacitadellenumerique.fr/citadelle" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://lacitadellenumerique.fr/citadelle" />
      </Helmet>
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
      <EstimatorSection />
      <ServicesSection />
      <NewsletterSection />
      <CTASection />
    </CitadelleLayout>
  );
}
