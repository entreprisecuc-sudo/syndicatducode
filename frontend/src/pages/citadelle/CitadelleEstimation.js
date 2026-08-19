/**
 * Page Estimateur Pro — La Citadelle Numérique
 * Outil avancé d'estimation + formulaire de demande d'estimation professionnelle
 * SEO/GEO/AEO : JSON-LD FAQPage + Service + microdata Schema.org
 * i18n : FR / EN via react-i18next
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, ArrowRight, CheckCircle, ChevronDown, ChevronUp,
  BarChart2, Leaf, Layers, Send, Shield, Clock, Star, AlertCircle,
  Zap, Crown, CreditCard,
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { isPromoOn, promoDiscounted } from "@/utils/promo";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";

// ── Constantes (valeurs stables — labels traduits via i18n) ─────────────────────

const SITE_TYPE_VALUES  = ["contenu", "ecommerce", "saas", "application", "social"];
const EXTRA_TYPE_VALUES = [
  "shopify_store", "amazon_fba", "newsletter", "youtube_channel", "instagram",
  "tiktok", "linkedin_page", "discord_server", "forum", "blog",
  "online_media", "ai_automation", "template_plugin", "database_api",
];
const AGE_VALUES        = ["lt1", "1-3", "3-5", "5plus"];
const DIV_OPTIONS       = [{ value: 1, badge: "-7%" }, { value: 2, badge: "+3%" }, { value: 3, badge: "+7%" }];

// Nouveaux types — mappés vers les multiples existants pour le calcul
const TYPE_MAPPING = {
  shopify_store: "ecommerce", amazon_fba: "ecommerce",
  newsletter: "contenu", forum: "contenu", blog: "contenu", online_media: "contenu",
  youtube_channel: "social", instagram: "social", tiktok: "social",
  linkedin_page: "social", discord_server: "social",
  ai_automation: "saas", template_plugin: "saas", database_api: "saas",
};

const MULTIPLES = {
  saas:        { lt1: [10,15], "1-3": [14,20], "3-5": [18,26], "5plus": [22,30] },
  ecommerce:   { lt1: [8,12],  "1-3": [12,18], "3-5": [15,22], "5plus": [18,25] },
  contenu:     { lt1: [8,12],  "1-3": [12,18], "3-5": [14,20], "5plus": [16,24] },
  application: { lt1: [8,12],  "1-3": [12,18], "3-5": [15,22], "5plus": [18,26] },
  social:      { lt1: [4,7],   "1-3": [5,9],   "3-5": [7,12],  "5plus": [9,15]  },
};

// Helpers labels traduits
const siteTypes  = (t) => SITE_TYPE_VALUES.map(v => ({ value: v, label: t(`estimation.site_types.${v}`) }));
const extraTypes = (t) => EXTRA_TYPE_VALUES.map(v => ({ value: v, label: t(`estimation.extra_types.${v}`) }));
const ages       = (t) => AGE_VALUES.map(v => ({ value: v, label: t(`estimation.ages.${v}`) }));
const divOptions = (t) => DIV_OPTIONS.map(o => ({ ...o, label: t(`estimation.div_options.${o.value}`) }));

const formatEur = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const pct = (mult) => {
  const diff = Math.round((mult - 1) * 100);
  return diff > 0 ? `+${diff}%` : `${diff}%`;
};

// ── Algorithme d'estimation ───────────────────────────────────────────────────

function compute(t, { revenue, siteType, age, seoPercent, growthPercent, diversification }) {
  const multKey = TYPE_MAPPING[siteType] || siteType;
  const [baseLow, baseHigh] = MULTIPLES[multKey][age];

  // Ajustement SEO
  let seoMult, seoLabel, seoColor;
  if (seoPercent >= 60)      { seoMult = 1.07; seoLabel = t("estimation.compute.seo_dominant"); seoColor = "#22c55e"; }
  else if (seoPercent >= 30) { seoMult = 1.03; seoLabel = t("estimation.compute.seo_solid");    seoColor = "#84cc16"; }
  else if (seoPercent >= 20) { seoMult = 1.0;  seoLabel = t("estimation.compute.seo_moderate"); seoColor = CITADELLE_COLORS.gold; }
  else                       { seoMult = 0.93; seoLabel = t("estimation.compute.seo_weak");     seoColor = "#ef4444"; }

  // Ajustement croissance
  let growthMult, growthLabel, growthColor;
  if (growthPercent > 10)      { growthMult = 1.10; growthLabel = t("estimation.compute.growth_strong");  growthColor = "#22c55e"; }
  else if (growthPercent >= 5) { growthMult = 1.05; growthLabel = t("estimation.compute.growth_good");    growthColor = "#84cc16"; }
  else if (growthPercent >= 0) { growthMult = 1.0;  growthLabel = t("estimation.compute.growth_stable");  growthColor = CITADELLE_COLORS.gold; }
  else                         { growthMult = 0.88; growthLabel = t("estimation.compute.growth_decline"); growthColor = "#ef4444"; }

  // Ajustement diversification
  let divMult, divLabel, divColor;
  if (diversification >= 3)       { divMult = 1.07; divLabel = t("estimation.compute.div_3plus"); divColor = "#22c55e"; }
  else if (diversification === 2) { divMult = 1.03; divLabel = t("estimation.compute.div_2");     divColor = "#84cc16"; }
  else                            { divMult = 0.93; divLabel = t("estimation.compute.div_1");     divColor = "#ef4444"; }

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

// ── JSON-LD Schemas (construits dynamiquement depuis les traductions) ──────────

function usePageSchemas(t, lang) {
  useEffect(() => {
    const faq = t("estimation.faq", { returnObjects: true }) || [];
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (Array.isArray(faq) ? faq : []).map(item => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: t("estimation.schema_service_name"),
        provider: { "@type": "Organization", name: "La Citadelle Numérique", url: "https://lacitadellenumerique.fr" },
        description: t("estimation.schema_service_desc"),
        areaServed: "France",
        serviceType: "Valorisation de business digital",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: t("estimation.schema_service_offer") },
      },
    ];
    const scripts = schemas.map((schema, i) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = `estimation-schema-${i}`;
      s.text = JSON.stringify(schema);
      document.head.appendChild(s);
      return s;
    });
    return () => scripts.forEach(s => s.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
}

// ── Composant Estimateur ──────────────────────────────────────────────────────

function AdvancedEstimator({ onResult, formRef }) {
  const { t } = useTranslation();
  const SITE_TYPES  = siteTypes(t);
  const EXTRA_TYPES = extraTypes(t);
  const AGES        = ages(t);
  const DIVERSIFICATION_OPTIONS = divOptions(t);

  const [revenue, setRevenue]           = useState("");
  const [siteType, setSiteType]         = useState("contenu");
  const [age, setAge]                   = useState("1-3");
  const [seoPercent, setSeoPercent]     = useState(40);
  const [growthPercent, setGrowthPercent] = useState(3);
  const [diversification, setDiversification] = useState(2);
  const [result, setResult]             = useState(null);
  const [showExtraTypes, setShowExtraTypes] = useState(false);

  const calculate = (e) => {
    e.preventDefault();
    const rev = parseFloat(revenue);
    if (!rev || rev <= 0) return;
    const res = compute(t, { revenue: rev, siteType, age, seoPercent, growthPercent, diversification });
    setResult(res);
    onResult({ revenue: rev, siteType });
  };

  const reset = () => { setResult(null); setRevenue(""); onResult(null); setShowExtraTypes(false); };

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
          {t("estimation.estimator_title")}
        </h2>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          {t("estimation.estimator_subtitle")}
        </p>
      </div>

      {!result ? (
        <form onSubmit={calculate} className="p-7 space-y-7">

          {/* 1. Bénéfice net */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
              {t("estimation.revenue_label")}
            </label>
            <p className="text-xs mb-2" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("estimation.revenue_help")}
            </p>
            <input
              type="number" min="1" value={revenue}
              onChange={e => setRevenue(e.target.value)}
              placeholder={t("estimation.revenue_ph")}
              required data-testid="adv-estimator-revenue"
              style={{ ...inputStyle, fontSize: 18, fontWeight: 700, border: `1px solid ${revenue ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}` }}
            />
          </div>

          {/* 2. Type de business */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
              {t("estimation.type_label")}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SITE_TYPES.map(t2 => (
                <button key={t2.value} type="button" onClick={() => { setSiteType(t2.value); setShowExtraTypes(false); }}
                  data-testid={`adv-type-${t2.value}`}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                  style={{
                    background: siteType === t2.value ? `rgba(201,164,92,0.12)` : CITADELLE_COLORS.bg,
                    border: `1px solid ${siteType === t2.value ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                    color: siteType === t2.value ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                    fontWeight: siteType === t2.value ? 700 : 500,
                  }}>
                  {t2.label}
                </button>
              ))}

              {/* Bouton "Autres types" */}
              <button type="button" onClick={() => setShowExtraTypes(v => !v)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  background: EXTRA_TYPES.some(x => x.value === siteType) ? `rgba(201,164,92,0.12)` : CITADELLE_COLORS.bg,
                  border: `1px dashed ${EXTRA_TYPES.some(x => x.value === siteType) ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                  color: EXTRA_TYPES.some(x => x.value === siteType) ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                  fontWeight: EXTRA_TYPES.some(x => x.value === siteType) ? 700 : 500,
                }}>
                {EXTRA_TYPES.some(x => x.value === siteType)
                  ? `${t("estimation.other_prefix")}${EXTRA_TYPES.find(x => x.value === siteType)?.label}`
                  : `${t("estimation.other_toggle")} ${showExtraTypes ? "▲" : "▼"}`}
              </button>
            </div>

            {/* Panneau "Autres types" expansible */}
            <div style={{
              maxHeight: showExtraTypes ? "500px" : "0",
              opacity: showExtraTypes ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.35s ease, opacity 0.2s ease",
            }}>
              <div className="pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {EXTRA_TYPES.map(x => {
                    const active = siteType === x.value;
                    return (
                      <button key={x.value} type="button"
                        onClick={() => setSiteType(x.value)}
                        className="px-3 py-1.5 rounded-full text-xs transition-all"
                        style={{
                          border: active ? `1.5px solid ${CITADELLE_COLORS.gold}` : `1px solid ${CITADELLE_COLORS.border}`,
                          background: active ? "rgba(201,164,92,0.12)" : "white",
                          color: active ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                          fontWeight: active ? 700 : 500,
                        }}>
                        {x.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ancienneté */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
              {t("estimation.age_label")}
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
              {t("estimation.seo_label")}
              <span className="ml-2 font-black" style={{ color: CITADELLE_COLORS.gold }}>{seoPercent}%</span>
            </label>
            <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("estimation.seo_help")}
            </p>
            <input type="range" min="0" max="100" value={seoPercent}
              onChange={e => setSeoPercent(Number(e.target.value))}
              data-testid="adv-seo-range" style={sliderStyle} />
            <div className="flex justify-between text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              <span>{t("estimation.seo_min")}</span><span>{t("estimation.seo_max")}</span>
            </div>
          </div>

          {/* 5. Taux de croissance */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
              {t("estimation.growth_label")}
              <span className="ml-2 font-black" style={{ color: growthPercent < 0 ? "#ef4444" : CITADELLE_COLORS.gold }}>
                {growthPercent > 0 ? "+" : ""}{growthPercent}%
              </span>
            </label>
            <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("estimation.growth_help")}
            </p>
            <input type="range" min="-20" max="30" value={growthPercent}
              onChange={e => setGrowthPercent(Number(e.target.value))}
              data-testid="adv-growth-range" style={sliderStyle} />
            <div className="flex justify-between text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              <span>{t("estimation.growth_min")}</span><span>{t("estimation.growth_max")}</span>
            </div>
          </div>

          {/* 6. Diversification revenus */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
              {t("estimation.div_label")}
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
            {t("estimation.calculate_btn")}
          </button>
          <p className="text-center text-xs mt-2" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("estimation.calculate_note")}
          </p>
        </form>

      ) : (
        /* ── Résultat ── */
        <div className="p-7">

          {/* Fourchette finale */}
          <div className="text-center mb-6 py-6 rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.blue} 0%, #1a3a6b 100%)` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              {t("estimation.result_label")}
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
                {t("estimation.base", { low: result.baseLow, high: result.baseHigh })}
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
              <strong>{t("estimation.indicative_strong")}</strong>{t("estimation.indicative_rest")}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02]"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="adv-cta-form">
              {t("estimation.cta_pro")}
              <ArrowRight size={17} />
            </button>
            <button onClick={reset}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
              style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}` }}
              data-testid="adv-reset-btn">
              {t("estimation.reset")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sélecteur de service + formulaire → Stripe Checkout ──────────────────────
// Les titres restent en français pour la correspondance API (matching par titre).

const ESTIMATION_SERVICES = [
  {
    id: "7fd80984-9770-4078-9b18-cd0182677d6a",
    slug: "standard",
    title: "Estimation Standard",
    price: 49,
    icon: Zap,
    badge: null,
  },
  {
    id: "72b653c4-6def-4053-bfb1-7441c03c0bcf",
    slug: "expert",
    title: "Estimation Expert",
    price: 149,
    icon: Crown,
    badge: "Recommandé",
  },
];

function ContactForm({ prefillType }) {
  const { t } = useTranslation();
  const { user } = useCitadelleAuth();
  const SITE_TYPES = siteTypes(t);

  // Prices loaded dynamically from API — ESTIMATION_SERVICES as fallback
  const [liveServices, setLiveServices] = useState(ESTIMATION_SERVICES);
  const [promo, setPromo] = useState(null);
  const [selectedService, setSelectedService] = useState(ESTIMATION_SERVICES[0].id);
  const [form, setForm] = useState({
    nom: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
    email: user?.email || "",
    url_site: "",
    type_site: prefillType || "contenu",
    benefice_mensuel: "", ca_mensuel: "", message: "",
  });
  const [status, setStatus]   = useState("idle"); // idle | loading | error
  const [erreur, setErreur]   = useState("");

  // Charger les prix réels depuis l'API à chaque affichage
  useEffect(() => {
    citadelleApi.get("/services").then(res => {
      const apiServices = res.data?.services || [];
      // Correspondance stable par titre (résiste à un re-seed des services → nouveaux UUID)
      const merged = ESTIMATION_SERVICES.map(svc => {
        const found = apiServices.find(s => s.title === svc.title);
        return found
          ? { ...svc, id: found.id, price: found.price != null ? found.price : svc.price }
          : svc;
      });
      setLiveServices(merged);
      // Aligner l'ID sélectionné sur l'ID réel renvoyé par l'API (par titre)
      setSelectedService(prev => {
        const prevSvc = ESTIMATION_SERVICES.find(s => s.id === prev);
        const match = prevSvc && merged.find(s => s.title === prevSvc.title);
        return (match || merged[0]).id;
      });
    }).catch(() => { /* fallback sur ESTIMATION_SERVICES déjà en state */ });
    citadelleApi.get("/promo").then(res => setPromo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (prefillType) setForm(f => ({ ...f, type_site: prefillType }));
  }, [prefillType]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading"); setErreur("");

    const typeSiteLabel = SITE_TYPES.find(x => x.value === form.type_site)?.label || form.type_site;

    // Résumé du dossier transmis dans le message (stocké en DB + email)
    const clientMessage = [
      form.url_site   ? `${t("estimation.msg_url")} : ${form.url_site}` : null,
      `${t("estimation.msg_type")} : ${typeSiteLabel}`,
      form.ca_mensuel        ? `${t("estimation.msg_ca")} : ${form.ca_mensuel} €` : null,
      form.benefice_mensuel  ? `${t("estimation.msg_benefice")} : ${form.benefice_mensuel} €` : null,
      form.message           ? `${t("estimation.msg_notes")} : ${form.message}` : null,
    ].filter(Boolean).join("\n");

    try {
      const res = await citadelleApi.post("/payments/service/checkout", {
        service_id:     selectedService,
        client_name:    form.nom,
        client_email:   form.email,
        client_message: clientMessage,
        origin_url:     window.location.origin,
        cancel_path:    "/citadelle/estimation",
      });
      // Redirection vers Stripe Checkout
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setErreur(err?.response?.data?.detail || t("estimation.error_generic"));
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

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 4px 24px rgba(15,39,71,0.08)" }}>

      {/* En-tête */}
      <div className="px-7 py-5" style={{ background: CITADELLE_COLORS.night, borderBottom: `2px solid ${CITADELLE_COLORS.gold}` }}>
        <h2 className="font-black text-lg" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>
          {t("estimation.form_title")}
        </h2>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          {t("estimation.form_subtitle")}
        </p>
      </div>

      {/* Promesses */}
      <div className="grid grid-cols-3 gap-0"
        style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
        {[
          { icon: Shield,   text: t("estimation.promise_confidential") },
          { icon: Clock,    text: t("estimation.promise_response") },
          { icon: Star,     text: t("estimation.promise_experts") },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-1.5 py-4 px-2 text-center">
            <Icon size={16} style={{ color: CITADELLE_COLORS.gold }} />
            <p className="text-xs font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>{text}</p>
          </div>
        ))}
      </div>

      <div className="p-7 space-y-6">

        {/* ── Sélecteur de service ── */}
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>
            {t("estimation.choose_plan")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveServices.map(svc => {
              const active = selectedService === svc.id;
              const Icon   = svc.icon;
              const svcTitle    = t(`estimation.services.${svc.slug}.title`);
              const svcDelay    = t(`estimation.services.${svc.slug}.delay`);
              const svcFeatures = t(`estimation.services.${svc.slug}.features`, { returnObjects: true });
              const svcBadge    = svc.badge ? t(`estimation.services.${svc.slug}.badge`) : null;
              return (
                <button key={svc.id} type="button" onClick={() => setSelectedService(svc.id)}
                  data-testid={`service-selector-${svc.slug}`}
                  className="relative p-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                  style={{
                    border: active ? `2px solid ${CITADELLE_COLORS.gold}` : `1px solid ${CITADELLE_COLORS.border}`,
                    background: active ? "rgba(201,164,92,0.06)" : CITADELLE_COLORS.bg,
                    boxShadow: active ? `0 0 0 3px rgba(201,164,92,0.15)` : "none",
                    outline: active ? `2px solid ${CITADELLE_COLORS.gold}` : "none",
                    outlineOffset: 2,
                  }}>
                  {svcBadge && (
                    <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-xs font-black"
                      style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                      {svcBadge}
                    </span>
                  )}
                  {isPromoOn(promo, svc.price) && (
                    <span className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-xs font-black"
                      data-testid={`promo-pill-${svc.slug}`}
                      style={{ background: "#16a34a", color: "white" }}>
                      -{promo.discount_percent}%
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} style={{ color: active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.textMuted }} />
                    <span className="text-sm font-black" style={{ color: CITADELLE_COLORS.blue }}>{svcTitle}</span>
                  </div>
                  <div className="text-xl font-black mb-1" style={{ color: active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                    {isPromoOn(promo, svc.price) ? (
                      <span className="inline-flex items-baseline gap-2">
                        <span style={{ textDecoration: "line-through", opacity: 0.45, fontSize: "0.7em" }}>{svc.price} €</span>
                        <span>{promoDiscounted(svc.price, promo)} €</span>
                      </span>
                    ) : (
                      <>{svc.price} €</>
                    )}
                  </div>
                  <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>{svcDelay}</p>
                  <ul className="space-y-1">
                    {(Array.isArray(svcFeatures) ? svcFeatures : []).map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        <CheckCircle size={11} className="mt-0.5 shrink-0" style={{ color: CITADELLE_COLORS.gold }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nom + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>{t("estimation.form_nom_label")}</label>
              <input type="text" required value={form.nom} onChange={set("nom")}
                placeholder={t("estimation.form_nom_ph")} style={fieldStyle}
                data-testid="form-nom" />
            </div>
            <div>
              <label style={labelStyle}>{t("estimation.form_email_label")}</label>
              <input type="email" required value={form.email} onChange={set("email")}
                placeholder={t("estimation.form_email_ph")} style={fieldStyle}
                data-testid="form-email" />
            </div>
          </div>

          {/* URL du site */}
          <div>
            <label style={labelStyle}>{t("estimation.form_url_label")}</label>
            <input type="url" value={form.url_site} onChange={set("url_site")}
              placeholder={t("estimation.form_url_ph")} style={fieldStyle}
              data-testid="form-url" />
          </div>

          {/* Type de site */}
          <div>
            <label style={labelStyle}>{t("estimation.form_type_label")}</label>
            <select required value={form.type_site} onChange={set("type_site")}
              style={fieldStyle} data-testid="form-type">
              {SITE_TYPES.map(x => (
                <option key={x.value} value={x.value}>{x.label}</option>
              ))}
            </select>
          </div>

          {/* CA + Bénéfice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>{t("estimation.form_ca_label")}</label>
              <input type="number" min="0" value={form.ca_mensuel} onChange={set("ca_mensuel")}
                placeholder={t("estimation.form_ca_ph")} style={fieldStyle}
                data-testid="form-ca" />
            </div>
            <div>
              <label style={labelStyle}>{t("estimation.form_benefice_label")}</label>
              <input type="number" min="0" value={form.benefice_mensuel} onChange={set("benefice_mensuel")}
                placeholder={t("estimation.form_benefice_ph")} style={fieldStyle}
                data-testid="form-benefice" />
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={labelStyle}>{t("estimation.form_message_label")}</label>
            <textarea value={form.message} onChange={set("message")} rows={4}
              placeholder={t("estimation.form_message_ph")}
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

          {/* Bouton paiement */}
          <button type="submit" disabled={status === "loading"}
            data-testid="form-submit-btn"
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
            {status === "loading" ? (
              <><div className="w-4 h-4 border-2 border-night/30 border-t-night rounded-full animate-spin" /> {t("estimation.submit_loading")}</>
            ) : (
              <><CreditCard size={16} /> {t("estimation.submit_pay")} {(() => {
                const sel = liveServices.find(s => s.id === selectedService);
                const p = sel?.price;
                return isPromoOn(promo, p) ? promoDiscounted(p, promo) : p;
              })()} €</>
            )}
          </button>

          <p className="text-xs text-center" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("estimation.secure_a")}
            <span className="font-bold" style={{ color: CITADELLE_COLORS.blue }}>Stripe</span>
            {t("estimation.secure_b")}
            <Link to="/citadelle/confidentialite" className="underline" style={{ color: CITADELLE_COLORS.gold }}>
              {t("estimation.secure_privacy")}
            </Link>
          </p>
        </form>
      </div>
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
  const { t, i18n } = useTranslation();
  const formRef = useRef(null);
  const [prefillType, setPrefillType] = useState(null);
  usePageSchemas(t, i18n.language);

  const SITE_TYPES = siteTypes(t);
  const AGES       = ages(t);
  const faqItems   = t("estimation.faq", { returnObjects: true });

  useEffect(() => {
    document.title = t("estimation.page_title");
  }, [t, i18n.language]);

  return (
    <CitadelleLayout>
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
            {t("estimation.hero_badge")}
          </div>

          {/* H1 optimisé SEO/GEO */}
          <h1 className="font-black mb-4 leading-tight"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(2rem, 6vw, 3.2rem)", color: "white" }}>
            {t("estimation.hero_h1_1")}<br />
            <span style={{ color: CITADELLE_COLORS.gold }}>{t("estimation.hero_h1_accent")}</span>
          </h1>
          <p className="mb-8 leading-relaxed" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", maxWidth: 580, margin: "0 auto 2rem" }}>
            {t("estimation.hero_sub_a")}
            <strong style={{ color: "rgba(255,255,255,0.9)" }}>{t("estimation.hero_sub_france")}</strong>
            {t("estimation.hero_sub_b")}
          </p>

          {/* Pills stats */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: BarChart2, text: t("estimation.hero_pills.0") },
              { icon: Leaf,      text: t("estimation.hero_pills.1") },
              { icon: Shield,    text: t("estimation.hero_pills.2") },
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
            {t("estimation.table_title")}
          </h2>
          <p className="text-center mb-8 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("estimation.table_sub")}
          </p>

          <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: CITADELLE_COLORS.blue }}>
                  <th className="text-left p-4 font-bold text-white">{t("estimation.table_col_type")}</th>
                  {AGES.map(a => (
                    <th key={a.value} className="p-4 font-bold text-white text-center">{a.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SITE_TYPES.map((x, i) => (
                  <tr key={x.value} style={{ background: i % 2 === 0 ? "white" : CITADELLE_COLORS.bg }}>
                    <td className="p-4 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{x.label}</td>
                    {AGES.map(a => {
                      const [lo, hi] = MULTIPLES[x.value][a.value];
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
            {t("estimation.table_footnote")}
          </p>
        </div>
      </section>

      {/* ── FAQ AEO ── */}
      <section className="py-14" style={{ background: CITADELLE_COLORS.bg }}
        itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="font-black text-center mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.4rem, 3vw, 1.9rem)", color: CITADELLE_COLORS.blue }}>
            {t("estimation.faq_title")}
          </h2>
          <p className="text-center mb-8 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("estimation.faq_sub")}
          </p>
          <div className="space-y-3">
            {(Array.isArray(faqItems) ? faqItems : []).map(item => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
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
            {t("estimation.cta_title")}
          </h2>
          <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t("estimation.cta_sub")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/citadelle/inscription"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {t("estimation.cta_create")} <ArrowRight size={15} />
            </Link>
            <Link to="/citadelle/annonces"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)" }}>
              {t("estimation.cta_listings")}
            </Link>
          </div>
        </div>
      </section>
    </CitadelleLayout>
  );
}
