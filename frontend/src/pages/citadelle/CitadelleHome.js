/**
 * Page d'accueil — La Citadelle Numérique
 * Charte graphique : Bleu Citadelle #0F2747 / Or Prestige #C9A45C
 * Sections : Hero (+ barre de recherche) → Catégories → Comment ça marche → Services → CTA
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, TrendingUp, Lock, Globe, ShoppingCart, Cloud,
  Monitor, Users, ArrowRight, Star, Search, SlidersHorizontal,
  ShieldCheck, ArrowRightLeft, FileSearch, ChevronRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import NewsletterSection from "@/components/citadelle/NewsletterSection";
import ListingsCarousel from "@/components/citadelle/ListingsCarousel";
import { CITADELLE_COLORS, CITADELLE_CATEGORIES, CITADELLE_SERVICES } from "@/config/citadelleConstants";
import { localizeCategory, localizeHomeService } from "@/i18n/configCatalogEn";

// ── Icônes par slug ───────────────────────────────────────────────────────────

const CATEGORY_ICONS = { Globe, ShoppingCart, Cloud, Monitor, Users };
const SERVICE_ICONS = { TrendingUp, ShieldCheck, ArrowRightLeft, FileSearch };

// ── Constantes Estimateur (valeur + clé de traduction) ───────────────────────

const SITE_TYPES = [
  { value: "contenu",     key: "type_contenu" },
  { value: "ecommerce",   key: "type_ecommerce" },
  { value: "saas",        key: "type_saas" },
  { value: "application", key: "type_application" },
  { value: "social",      key: "type_social" },
];

const AGES = [
  { value: "lt1",   key: "age_lt1" },
  { value: "1-3",   key: "age_1_3" },
  { value: "3-5",   key: "age_3_5" },
  { value: "5plus", key: "age_5plus" },
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

// Met en gras (blanc) les mots-clés SEO à l'intérieur d'un paragraphe traduit
const boldKeywords = (text, keywords) => {
  let html = text;
  (keywords || []).forEach((kw) => {
    html = html.split(kw).join(`<strong style="color:#FFFFFF;font-weight:700">${kw}</strong>`);
  });
  return { __html: html };
};

// Schema.org JSON-LD — construit dynamiquement depuis les FAQ traduites (AEO)
function useEstimatorSchema(faqItems) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (faqItems || []).map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "estimator-faq-schema";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.getElementById("estimator-faq-schema")?.remove(); };
  }, [faqItems]);
}

// ── Section Estimateur ────────────────────────────────────────────────────────

const EstimatorSection = () => {
  const { t } = useTranslation();
  const [revenue, setRevenue]   = useState("");
  const [siteType, setSiteType] = useState("contenu");
  const [age, setAge]           = useState("1-3");
  const [result, setResult]     = useState(null);
  const faqItems = t("hp.est_faq", { returnObjects: true });
  useEstimatorSchema(faqItems);

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
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(201,164,92,0.08) 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />
      <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
        style={{ background: CITADELLE_COLORS.gold, filter: "blur(100px)" }} />

      <div className="relative max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-semibold tracking-wider uppercase"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}>
            <TrendingUp size={13} />
            {t("hp.est_tool")} <strong>{t("hp.est_free")}</strong> {t("hp.est_instant")}
          </div>
          <h2
            id="estimator-heading"
            className="font-black mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", color: "white" }}
          >
            {t("hp.est_title")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.05rem" }}>
            {t("hp.est_sub")}
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.2)", backdropFilter: "blur(12px)" }}>

          {!result ? (
            <form onSubmit={calculate} className="p-8 md:p-10 space-y-7">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {t("hp.est_label_revenue")}
                </label>
                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {t("hp.est_hint_revenue")}
                </p>
                <input
                  type="number" min="1" value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  placeholder={t("hp.est_ph_revenue")}
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

              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {t("hp.est_label_type")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SITE_TYPES.map(st => (
                    <button key={st.value} type="button" onClick={() => setSiteType(st.value)}
                      data-testid={`estimator-type-${st.value}`}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                      style={{
                        background: siteType === st.value ? "rgba(201,164,92,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${siteType === st.value ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.1)"}`,
                        color: siteType === st.value ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.55)",
                      }}>
                      {t(`hp.${st.key}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {t("hp.est_label_age")}
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
                      {t(`hp.${a.key}`)}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!revenue}
                data-testid="estimator-calculate-btn"
                className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                {t("hp.est_submit")}
              </button>
              <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                {t("hp.est_note")}
              </p>
            </form>

          ) : (
            <div className="p-8 md:p-10">
              <div className="text-center mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "rgba(255,255,255,0.45)" }}>
                  {t("hp.est_result_label")}
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
                  {t("hp.est_multiple", { low: result.mult_low, high: result.mult_high, rev: formatEur(result.rev) })}
                </p>
              </div>

              <div className="rounded-full h-1.5 mb-7" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="rounded-full h-1.5"
                  style={{ width: "100%", background: `linear-gradient(to right, ${CITADELLE_COLORS.gold}, ${CITADELLE_COLORS.goldLight})` }} />
              </div>

              <div className="rounded-2xl p-5 mb-6"
                style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.2)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>
                  <strong style={{ color: CITADELLE_COLORS.gold }}>{t("hp.est_nuance_strong")}</strong>{" "}
                  {t("hp.est_nuance")}
                </p>
              </div>

              <div className="space-y-3">
                <Link to="/citadelle/estimation"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02]"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="estimator-cta-service">
                  {t("hp.est_cta_pro")}
                  <ArrowRight size={17} />
                </Link>
                <button onClick={() => { setResult(null); setRevenue(""); }}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="estimator-reset-btn">
                  {t("hp.est_reset")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── FAQ AEO — Schema.org microdata + contenu visible ── */}
        <div className="mt-14 space-y-4" itemScope itemType="https://schema.org/FAQPage">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
            {t("hp.est_faq_label")}
          </p>
          {faqItems.map(({ q, a }) => (
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
  { value: "", key: "budget_all" },
  { value: "0-5000", key: "budget_lt5k" },
  { value: "5000-20000", key: "budget_5k20k" },
  { value: "20000-50000", key: "budget_20k50k" },
  { value: "50000-100000", key: "budget_50k100k" },
  { value: "100000+", key: "budget_gt100k" },
];

const SearchBar = () => {
  const { t, i18n } = useTranslation();
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

  const sepStyle = { width: "1px", alignSelf: "stretch", background: "rgba(255,255,255,0.12)", flexShrink: 0, margin: "10px 0" };

  return (
    <div className="relative z-10 mt-8 mx-4 md:mx-0" data-testid="citadelle-searchbar">
      {/* Desktop */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.35)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
      >
        <div className="flex items-center gap-2.5 flex-1 px-5 py-4">
          <Search size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
          <input
            type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder={t("hp.sb_keyword_ph")}
            className="bg-transparent outline-none text-sm w-full placeholder-white/40"
            style={{ color: "white" }} data-testid="citadelle-search-keyword"
          />
        </div>
        <div style={sepStyle} />
        <div className="flex items-center gap-2.5 px-5 py-4 w-48">
          <SlidersHorizontal size={15} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
          <select value={type} onChange={e => setType(e.target.value)}
            className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
            style={{ color: type ? "white" : "rgba(255,255,255,0.45)" }} data-testid="citadelle-search-type">
            <option value="" style={{ background: "#0F2747" }}>{t("hp.sb_type_default")}</option>
            {CITADELLE_CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug} style={{ background: "#0F2747" }}>{localizeCategory(c, i18n.language).label}</option>
            ))}
          </select>
        </div>
        <div style={sepStyle} />
        <div className="flex items-center gap-2.5 px-5 py-4 w-52">
          <TrendingUp size={15} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
          <select value={budget} onChange={e => setBudget(e.target.value)}
            className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
            style={{ color: budget ? "white" : "rgba(255,255,255,0.45)" }} data-testid="citadelle-search-budget">
            {BUDGET_OPTIONS.map(o => (
              <option key={o.value} value={o.value} style={{ background: "#0F2747" }}>{t(`hp.${o.key}`)}</option>
            ))}
          </select>
        </div>
        <div className="p-2 pr-2">
          <button type="submit"
            className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 hover:brightness-110"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="citadelle-search-submit">
            <Search size={15} />
            {t("hp.sb_search")}
          </button>
        </div>
      </form>

      {/* Mobile */}
      <form onSubmit={handleSearch} className="flex md:hidden flex-col gap-3">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}>
          <Search size={16} style={{ color: CITADELLE_COLORS.gold }} />
          <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder={t("hp.sb_keyword_ph")}
            className="bg-transparent outline-none text-sm w-full" style={{ color: "white" }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}>
            <SlidersHorizontal size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <select value={type} onChange={e => setType(e.target.value)}
              className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
              style={{ color: type ? "white" : "rgba(255,255,255,0.45)" }}>
              <option value="" style={{ background: "#0F2747" }}>{t("hp.sb_type_short")}</option>
              {CITADELLE_CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug} style={{ background: "#0F2747" }}>{localizeCategory(c, i18n.language).label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(201,164,92,0.25)" }}>
            <TrendingUp size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <select value={budget} onChange={e => setBudget(e.target.value)}
              className="bg-transparent outline-none text-sm w-full cursor-pointer appearance-none"
              style={{ color: budget ? "white" : "rgba(255,255,255,0.45)" }}>
              {BUDGET_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: "#0F2747" }}>{t(`hp.${o.key}`)}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="citadelle-search-submit-mobile">
          <Search size={16} />
          {t("hp.sb_search")}
        </button>
      </form>
    </div>
  );
};

// ── Section Hero ─────────────────────────────────────────────────────────────

const HeroSection = () => {
  const { t } = useTranslation();
  const cats = t("hp.hero_cats", { returnObjects: true });
  const stats = [
    { value: t("hp.stat_secured_v"), label: t("hp.stat_secured_l"), icon: Lock },
    { value: t("hp.stat_free_v"), label: t("hp.stat_free_l"), icon: Star },
    { value: t("hp.stat_commission_v"), label: t("hp.stat_commission_l"), icon: TrendingUp },
  ];
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)`, minHeight: "90vh", display: "flex", alignItems: "center" }}
      data-testid="citadelle-hero"
    >
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: CITADELLE_COLORS.gold, filter: "blur(120px)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: CITADELLE_COLORS.blue, filter: "blur(80px)" }} />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20 w-full">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold tracking-wider uppercase"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}>
            <Shield size={14} />
            {t("hp.badge")}
          </div>

          <h1 className="font-bold leading-tight mb-5" style={{ fontFamily: "'Montserrat', sans-serif", color: "white", fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
            {t("hp.hero_buy")}{" "}
            <span style={{ color: CITADELLE_COLORS.gold }}>{t("hp.hero_sell")}</span>{" "}
            {t("hp.hero_secure")}
          </h1>

          <p className="mb-5" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 600, color: "rgba(255,255,255,0.92)", maxWidth: "620px", lineHeight: 1.4 }}>
            {t("hp.hero_sub")}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-8" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", maxWidth: "720px" }} data-testid="citadelle-hero-categories">
            {cats.map((label, i) => (
              <span key={label} className="inline-flex items-center gap-3">
                {i > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: CITADELLE_COLORS.gold, display: "inline-block" }} />}
                {label}
              </span>
            ))}
            <span style={{ textTransform: "none", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{t("hp.hero_cat_more")}</span>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <Link to="/citadelle/annonces"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.blue, color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
              data-testid="citadelle-hero-cta-annonces">
              {t("hp.cta_browse")}
              <ArrowRight size={18} />
            </Link>
            <Link to="/citadelle/inscription"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="citadelle-hero-cta-publier">
              {t("hp.cta_publish")}
              <ChevronRight size={18} />
            </Link>
          </div>

          <SearchBar />

          <div className="flex flex-wrap gap-4 mt-8">
            {stats.map(({ value, label, icon: Icon }) => (
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

          <div className="mt-10">
            <ListingsCarousel variant="dark" title={t("hp.carousel_title")} limit={8} />
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Section Catégories ────────────────────────────────────────────────────────

const CategoriesSection = () => {
  const { t, i18n } = useTranslation();
  return (
    <section className="py-20" style={{ background: CITADELLE_COLORS.bg }} data-testid="citadelle-categories">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: CITADELLE_COLORS.blue }}>
            {t("hp.cat_title")}
          </h2>
          <p style={{ color: CITADELLE_COLORS.textMuted }}>{t("hp.cat_sub")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CITADELLE_CATEGORIES.map((rawCat) => {
            const cat = localizeCategory(rawCat, i18n.language);
            const Icon = CATEGORY_ICONS[cat.icon] || Globe;
            return (
              <Link
                key={cat.slug}
                to={`/citadelle/annonces?type=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 2px 8px rgba(15,39,71,0.05)" }}
                data-testid={`citadelle-category-${cat.slug}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ background: `rgba(15,39,71,0.06)` }}>
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
};

// ── Section SEO éditoriale ─────────────────────────────────────────────────────

const SeoContentSection = () => {
  const { t } = useTranslation();
  const why = [
    { icon: Lock, title: t("hp.seo_why1_title"), desc: t("hp.seo_why1_desc") },
    { icon: ShieldCheck, title: t("hp.seo_why2_title"), desc: t("hp.seo_why2_desc") },
    { icon: TrendingUp, title: t("hp.seo_why3_title"), desc: t("hp.seo_why3_desc") },
    { icon: Globe, title: t("hp.seo_why4_title"), desc: t("hp.seo_why4_desc") },
  ];
  const columns = [
    { title: t("hp.seo_sell_title"), steps: [t("hp.seo_sell1"), t("hp.seo_sell2"), t("hp.seo_sell3")], icon: TrendingUp, cta: { to: "/citadelle/vendre", label: t("hp.seo_sell_cta") } },
    { title: t("hp.seo_buy_title"), steps: [t("hp.seo_buy1"), t("hp.seo_buy2"), t("hp.seo_buy3")], icon: Search, cta: { to: "/citadelle/annonces", label: t("hp.seo_buy_cta") } },
  ];
  return (
    <section className="py-24" style={{ background: "white" }} data-testid="citadelle-seo-content">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="rounded-3xl p-8 md:p-14 mb-20 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)", backgroundSize: "36px 36px" }} />
          <div className="relative">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>
                {t("hp.seo_eyebrow")}
              </p>
              <h2 className="font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.7rem, 4vw, 2.4rem)", color: "white", lineHeight: 1.2 }}>
                {t("hp.seo_h2")}
              </h2>
              <p className="leading-relaxed" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)" }}
                dangerouslySetInnerHTML={boldKeywords(t("hp.seo_intro"), t("hp.seo_intro_kw", { returnObjects: true }))} />
            </div>
            <div className="max-w-3xl mx-auto space-y-5" style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.02rem", lineHeight: 1.8 }}>
              <p dangerouslySetInnerHTML={boldKeywords(t("hp.seo_p1"), t("hp.seo_p1_kw", { returnObjects: true }))} />
              <p dangerouslySetInnerHTML={boldKeywords(t("hp.seo_p2"), t("hp.seo_p2_kw", { returnObjects: true }))} />
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h3 className="font-bold text-center mb-10" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.3rem, 3vw, 1.7rem)", color: CITADELLE_COLORS.blue }}>
            {t("hp.seo_why_title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {why.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-5 p-7 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.14)" }}>
                  <Icon size={22} style={{ color: CITADELLE_COLORS.gold }} />
                </div>
                <div>
                  <p className="font-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue, fontSize: "1.05rem" }}>{title}</p>
                  <p className="leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted, fontSize: "0.95rem" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {columns.map(({ title, steps, icon: Icon, cta }) => (
            <div key={title} className="p-8 rounded-2xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: CITADELLE_COLORS.blue }}>
                  <Icon size={20} style={{ color: CITADELLE_COLORS.gold }} />
                </div>
                <h3 className="font-bold" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1.2rem", color: CITADELLE_COLORS.blue }}>{title}</h3>
              </div>
              <ol className="space-y-5">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "rgba(201,164,92,0.15)", color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>{i + 1}</span>
                    <p className="leading-relaxed" style={{ color: "#3A4658", fontSize: "0.97rem" }}>{step}</p>
                  </li>
                ))}
              </ol>
              <Link to={cta.to} className="inline-flex items-center gap-2 mt-7 font-semibold text-sm transition-colors" style={{ color: CITADELLE_COLORS.blue }}>
                {cta.label} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)", backgroundSize: "36px 36px" }} />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6" style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
              <Shield size={26} style={{ color: CITADELLE_COLORS.gold }} />
            </div>
            <h3 className="font-bold mb-5" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.3rem, 3vw, 1.8rem)", color: "white" }}>
              {t("hp.seo_guarantees_title")}
            </h3>
            <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem" }}
              dangerouslySetInnerHTML={boldKeywords(t("hp.seo_guarantees"), t("hp.seo_guarantees_kw", { returnObjects: true }))} />
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Section Comment ça marche ─────────────────────────────────────────────────

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const steps = [
    { step: "01", icon: Globe, title: t("hp.how1_title"), desc: t("hp.how1_desc") },
    { step: "02", icon: Users, title: t("hp.how2_title"), desc: t("hp.how2_desc") },
    { step: "03", icon: Lock, title: t("hp.how3_title"), desc: t("hp.how3_desc") },
  ];
  return (
    <section className="py-20" style={{ background: CITADELLE_COLORS.blue }} data-testid="citadelle-how-it-works">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: "white" }}>
            {t("hp.how_title")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>{t("hp.how_sub")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ step, icon: Icon, title, desc }) => (
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
};

// ── Section Services ──────────────────────────────────────────────────────────

const ServicesSection = () => {
  const { t, i18n } = useTranslation();
  return (
    <section className="py-20" style={{ background: "white" }} data-testid="citadelle-services">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: CITADELLE_COLORS.blue }}>
            {t("hp.svc_title")}
          </h2>
          <p style={{ color: CITADELLE_COLORS.textMuted }}>{t("hp.svc_sub")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CITADELLE_SERVICES.map((rawService) => {
            const service = localizeHomeService(rawService, i18n.language);
            const Icon = SERVICE_ICONS[service.icon] || Shield;
            return (
              <div
                key={service.slug}
                className="group p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}
                data-testid={`citadelle-service-${service.slug}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ background: `rgba(15,39,71,0.08)` }}>
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
};

// ── Section CTA Final ─────────────────────────────────────────────────────────

const CTASection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: CITADELLE_COLORS.night }} data-testid="citadelle-cta">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)", backgroundSize: "30px 30px" }} />
      <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
          <Shield size={30} style={{ color: CITADELLE_COLORS.gold }} />
        </div>
        <h2 className="font-black mb-4" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", color: "white" }}>
          {t("hp.cta_final_title")}
        </h2>
        <p className="mb-8 text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
          {t("hp.cta_final_sub")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/citadelle/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="citadelle-cta-publier">
            {t("hp.cta_final_btn")}
            <ChevronRight size={18} />
          </Link>
          <Link to="/citadelle/annonces"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)" }}>
            {t("hp.cta_final_browse")}
          </Link>
        </div>
        <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          {t("hp.cta_final_note")}
        </p>
      </div>
    </section>
  );
};

// ── Section FAQ ───────────────────────────────────────────────────────────────

const FaqSection = () => {
  const { t } = useTranslation();
  const faq = t("hp.home_faq", { returnObjects: true });
  return (
    <section className="py-16 md:py-24" style={{ background: "#FAFAF7" }} data-testid="home-faq">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h2 className="font-bold mb-8" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: CITADELLE_COLORS.night }}>
          {t("hp.faq_title")}
        </h2>
        <div className="space-y-4">
          {faq.map((item, i) => (
            <details key={i} className="rounded-xl bg-white p-5" style={{ border: "1px solid #E6E9EF" }} data-testid={`home-faq-item-${i}`}>
              <summary className="font-semibold cursor-pointer" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.night, listStyle: "none" }}>
                {item.q}
              </summary>
              <p className="mt-3 leading-relaxed" style={{ color: "#5A6B7E" }}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }) }}
      />
    </section>
  );
};

export default function CitadelleHome() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("hp.seo_h2") + " | La Citadelle Numérique";
  }, [t]);

  return (
    <CitadelleLayout>
      <HeroSection />
      <CategoriesSection />
      <SeoContentSection />
      <HowItWorksSection />
      <EstimatorSection />
      <ServicesSection />
      <NewsletterSection />
      <FaqSection />
      <CTASection />
    </CitadelleLayout>
  );
}
