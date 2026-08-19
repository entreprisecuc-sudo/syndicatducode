/**
 * Créer une annonce — La Citadelle Numérique
 * Formulaire multi-étapes (4 étapes)
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, ShoppingCart, Cloud, Monitor, Users, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, MoreHorizontal, Store, Package, Mail, Youtube, Camera, Smartphone, Linkedin, MessageSquare, MessagesSquare, FileText, Newspaper, Bot, LayoutTemplate, Database, Star } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CitadelleImageUpload } from "@/components/citadelle/CitadelleImageUpload";
import CommissionInfoPopup from "@/components/citadelle/CommissionInfoPopup";
import ListingQualityHelper from "@/components/citadelle/ListingQualityHelper";
import BoostModal from "@/components/citadelle/BoostModal";
import SellerServicesUpsell from "@/components/citadelle/SellerServicesUpsell";
import SecurityContactNotice from "@/components/citadelle/SecurityContactNotice";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_VALUES = ["website", "ecommerce", "saas", "webapp", "social_account", "domain"];
const TYPE_ICONS = { website: Globe, ecommerce: ShoppingCart, saas: Cloud, webapp: Monitor, social_account: Users, domain: Globe };
const EXTRA_VALUES = ["shopify_store", "amazon_fba", "newsletter", "youtube_channel", "instagram", "tiktok", "linkedin_page", "discord_server", "forum", "blog", "online_media", "ai_automation", "template_plugin", "database_api"];
const EXTRA_ICONS = { shopify_store: Store, amazon_fba: Package, newsletter: Mail, youtube_channel: Youtube, instagram: Camera, tiktok: Smartphone, linkedin_page: Linkedin, discord_server: MessageSquare, forum: MessagesSquare, blog: FileText, online_media: Newspaper, ai_automation: Bot, template_plugin: LayoutTemplate, database_api: Database };

const initialForm = {
  type: "", title: "", short_description: "",
  price: "", price_negotiable: false,
  monthly_revenue: "", monthly_charges: "", monthly_traffic: "",
  age_months: "", niche: "",
  traffic_sources: "", main_keywords: "",
  region: "", registered_clients: "",
  ideal_buyer: "", weekly_hours: "",
  strengths: "", weaknesses: "",
  description: "", technologies: "", url_preview: "", url_public: false,
  images: ["", "", "", "", ""],
  is_adult: false,
  allow_social_share: null,
  // Enchères
  is_auction: false,
  auction_show_reserve: false,
  auction_duration_days: 7,
  auction_buy_now_price: "",
};

export default function CitadelleCreateListing() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);
  const [boostModal, setBoostModal] = useState(false);
  const [upsellStep, setUpsellStep] = useState("boost"); // "boost" | "services" | "done"
  const [showCommissionPopup, setShowCommissionPopup] = useState(false);
  const [commissionAcknowledged, setCommissionAcknowledged] = useState(false);
  const [commission, setCommission] = useState({ rate: 0.05, minimum_eur: 49 });
  const [showOtherPanel, setShowOtherPanel] = useState(false);
  const { isAuthenticated, user } = useCitadelleAuth();
  const navigate = useNavigate();

  const TYPE_OPTIONS = TYPE_VALUES.map(v => ({ value: v, icon: TYPE_ICONS[v], label: t(`listing_form.types.${v}.label`), desc: t(`listing_form.types.${v}.desc`) }));
  const EXTRA_TYPE_OPTIONS = EXTRA_VALUES.map(v => ({ value: v, icon: EXTRA_ICONS[v], label: t(`listing_form.extra_types.${v}.label`), desc: t(`listing_form.extra_types.${v}.desc`) }));
  const STEPS = t("listing_form.steps", { returnObjects: true });

  // "Autre" est actif si le type sélectionné appartient aux catégories supplémentaires
  const isOtherSelected = EXTRA_TYPE_OPTIONS.some(o => o.value === form.type);

  const handleOtherClick = () => {
    const next = !showOtherPanel;
    setShowOtherPanel(next);
    // Si on ferme le panneau alors qu'un type "Autre" était sélectionné, on réinitialise
    if (!next && isOtherSelected) set("type", "");
  };

  useEffect(() => {
    citadelleApi.get("/settings/commission")
      .then(r => setCommission(r.data))
      .catch(() => {});
  }, []);

  const handlePriceFocus = () => {
    if (!commissionAcknowledged) setShowCommissionPopup(true);
  };

  const handleCommissionAcknowledge = () => {
    setCommissionAcknowledged(true);
    setShowCommissionPopup(false);
  };

  // Calcul indicateur commission en temps réel
  const priceNum = parseFloat(form.price);
  const commissionEst = priceNum > 0 ? Math.max(priceNum * commission.rate, commission.minimum_eur) : null;
  // Prix de vente minimum = frais minimum + 1 € (garantit un net vendeur positif)
  const minPrice = (commission.minimum_eur || 0) + 1;

  if (!isAuthenticated) {
    return (
      <CitadelleLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">🔒</p>
            <h2 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>{t("listing_form.auth_required")}</h2>
            <p className="text-sm mb-5" style={{ color: CITADELLE_COLORS.textMuted }}>{t("listing_form.auth_required_sub")}</p>
            <Link to="/citadelle/connexion" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {t("listing_form.login")}
            </Link>
          </div>
        </div>
      </CitadelleLayout>
    );
  }

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError("");
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.type) return t("listing_form.err_select_type");
      if (form.title.trim().length < 5) return t("listing_form.err_title_min");
      if (form.short_description.trim().length < 20) return t("listing_form.err_shortdesc_min");
    }
    if (step === 1) {
      if (!form.price || parseFloat(form.price) <= 0) return t("listing_form.err_price_valid");
      if (parseFloat(form.price) < minPrice) return form.is_auction ? t("listing_form.err_price_min_auction", { min: minPrice, fees: commission.minimum_eur }) : t("listing_form.err_price_min_sale", { min: minPrice, fees: commission.minimum_eur });
      if (form.is_auction && form.auction_buy_now_price && parseFloat(form.auction_buy_now_price) < minPrice) return t("listing_form.err_buynow_min", { min: minPrice, fees: commission.minimum_eur });
    }
    if (step === 2) {
      if (form.description.trim().length < 50) return t("listing_form.err_desc_min");
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
    setError("");
  };

  const prev = () => { setStep(s => s - 1); setError(""); };

  const handleSubmit = async () => {
    if (form.allow_social_share === null) {
      setError(t("listing_form.err_social_required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        price_negotiable: form.price_negotiable,
        monthly_revenue: form.monthly_revenue ? parseFloat(form.monthly_revenue) : null,
        monthly_charges: form.monthly_charges !== "" ? parseFloat(form.monthly_charges) : null,
        monthly_traffic: form.monthly_traffic ? parseInt(form.monthly_traffic) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        niche: form.niche.trim() || null,
        technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean),
        url_preview: form.is_adult ? null : (form.url_preview.trim() || null),
        url_public: form.is_adult ? false : !!form.url_public,
        images: form.is_adult ? [] : form.images.filter(Boolean),
        is_adult: form.is_adult,
        allow_social_share: !!form.allow_social_share,
        // Trafic & référencement
        traffic_sources: form.traffic_sources.trim() || null,
        main_keywords: form.main_keywords.trim() || null,
        // Informations techniques
        region: form.region.trim() || null,
        registered_clients: form.registered_clients ? parseInt(form.registered_clients) : null,
        // Détails de la cession
        ideal_buyer: form.ideal_buyer.trim() || null,
        weekly_hours: form.weekly_hours ? parseInt(form.weekly_hours) : null,
        strengths: form.strengths.trim() || null,
        weaknesses: form.weaknesses.trim() || null,
        // Enchères
        is_auction: form.is_auction,
        auction_show_reserve: form.auction_show_reserve,
        auction_duration_days: form.is_auction ? parseInt(form.auction_duration_days) : 7,
        auction_buy_now_price: form.is_auction && form.auction_buy_now_price ? parseFloat(form.auction_buy_now_price) : null,
      };
      await citadelleApi.post("/listings", payload).then(res => setCreatedListing(res.data));
      setSubmitted(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Erreur de validation Pydantic → tableau d'objets
        setError(detail.map(e => e.msg || JSON.stringify(e)).join(" — "));
      } else {
        setError(detail || t("listing_form.err_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <CitadelleLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={64} style={{ color: CITADELLE_COLORS.gold }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            {t("listing_form.submitted_title")}
          </h2>
          <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("listing_form.submitted_sub")}
          </p>

          <SecurityContactNotice className="mb-6 text-left" />

          {/* Proposition « Annonce à la Une » puis services vendeur */}
          {createdListing?.id && upsellStep === "boost" && (
            <div className="p-5 rounded-2xl mb-6 text-left" data-testid="post-submit-boost"
              style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.25)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} style={{ color: CITADELLE_COLORS.gold }} />
                <p className="text-sm font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                  {t("listing_form.boost_title")}
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("listing_form.boost_sub")}
              </p>
              <button
                type="button"
                onClick={() => setBoostModal(true)}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="post-submit-boost-btn">
                <Star size={14} /> {t("listing_form.boost_cta")}
              </button>
              <button
                type="button"
                onClick={() => setUpsellStep("services")}
                className="w-full mt-2 py-2 text-xs font-semibold"
                style={{ color: CITADELLE_COLORS.textMuted }}
                data-testid="post-submit-boost-decline">
                {t("listing_form.boost_decline")}
              </button>
            </div>
          )}

          {createdListing?.id && upsellStep === "services" && (
            <SellerServicesUpsell user={user} onDecline={() => setUpsellStep("done")} />
          )}

          <div className="flex gap-3 justify-center">
            <Link to="/citadelle/espace-membre/mes-annonces" className="px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ border: `1px solid ${CITADELLE_COLORS.blue}`, color: CITADELLE_COLORS.blue }}>
              {t("listing_form.my_listings")}
            </Link>
            <Link to="/citadelle/annonces" className="px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {t("listing_form.view_listings")}
            </Link>
          </div>
        </div>
      </div>
      <BoostModal
        isOpen={boostModal}
        onClose={() => setBoostModal(false)}
        listingId={createdListing?.id}
        listingTitle={createdListing?.title}
      />
    </CitadelleLayout>
  );

  const inputStyle = { background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue };
  const labelStyle = { color: CITADELLE_COLORS.blue };

  return (
    <>
    <CitadelleLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-10" data-testid="create-listing-form">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            {t("listing_form.create_title")}
          </h1>
          <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>{t("listing_form.create_sub")}</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{ background: i < step ? CITADELLE_COLORS.gold : i === step ? CITADELLE_COLORS.blue : CITADELLE_COLORS.border,
                           color: i <= step ? "white" : CITADELLE_COLORS.textMuted }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-xs mt-1 hidden md:block" style={{ color: i === step ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border }} />
              )}
            </div>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4"
            style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Score de qualité + conseils bienveillants */}
        <ListingQualityHelper form={form} step={step} />

        {/* Étape 1 */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3" style={labelStyle}>{t("listing_form.type_label")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                  <button key={value} type="button" onClick={() => { set("type", value); setShowOtherPanel(false); }}
                    className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                    style={{ border: form.type === value ? `2px solid ${CITADELLE_COLORS.gold}` : `1px solid ${CITADELLE_COLORS.border}`,
                             background: form.type === value ? "rgba(201,164,92,0.06)" : "white" }}>
                    <Icon size={20} style={{ color: form.type === value ? CITADELLE_COLORS.gold : CITADELLE_COLORS.textMuted }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{label}</p>
                      <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>{desc}</p>
                    </div>
                  </button>
                ))}

                {/* Carte "Autre" — 7ème carte pleine largeur */}
                <button type="button" onClick={handleOtherClick}
                  className="flex items-center gap-3 p-4 rounded-xl text-left transition-all sm:col-span-2"
                  data-testid="type-autre-card"
                  style={{
                    border: (showOtherPanel || isOtherSelected) ? `2px solid ${CITADELLE_COLORS.gold}` : `1px dashed ${CITADELLE_COLORS.border}`,
                    background: (showOtherPanel || isOtherSelected) ? "rgba(201,164,92,0.06)" : "white",
                  }}>
                  <MoreHorizontal size={20} style={{ color: (showOtherPanel || isOtherSelected) ? CITADELLE_COLORS.gold : CITADELLE_COLORS.textMuted }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                      {isOtherSelected
                        ? EXTRA_TYPE_OPTIONS.find(o => o.value === form.type)?.label
                        : t("listing_form.other_selected_fallback")}
                    </p>
                    <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {t("listing_form.other_desc")}
                    </p>
                  </div>
                  <ChevronRight size={16} className="transition-transform" style={{
                    color: CITADELLE_COLORS.textMuted,
                    transform: showOtherPanel ? "rotate(90deg)" : "rotate(0deg)",
                  }} />
                </button>
              </div>

              {/* Panneau expansible — catégories "Autre" */}
              <div style={{
                maxHeight: showOtherPanel ? "600px" : "0",
                opacity: showOtherPanel ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s ease, opacity 0.2s ease",
              }}>
                <div className="pt-4 pb-1 px-1">
                  <p className="text-xs font-semibold mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {t("listing_form.other_select_prompt")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EXTRA_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
                      const active = form.type === value;
                      return (
                        <button key={value} type="button"
                          onClick={() => set("type", value)}
                          data-testid={`extra-type-${value}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                          style={{
                            border: active ? `1.5px solid ${CITADELLE_COLORS.gold}` : `1px solid ${CITADELLE_COLORS.border}`,
                            background: active ? "rgba(201,164,92,0.12)" : CITADELLE_COLORS.bg,
                            color: active ? CITADELLE_COLORS.blue : CITADELLE_COLORS.textMuted,
                            fontWeight: active ? 700 : 500,
                          }}>
                          <Icon size={12} style={{ color: active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.textMuted }} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.title_label")}</label>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder={t("listing_form.title_ph")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}
                data-testid="create-listing-title" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.shortdesc_label")} <span className="font-normal text-xs">{t("listing_form.shortdesc_hint")}</span></label>
              <textarea value={form.short_description} onChange={e => set("short_description", e.target.value)}
                rows={3} placeholder={t("listing_form.shortdesc_ph")}
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle}
                data-testid="create-listing-short-desc" />
              <p className="text-xs mt-1 text-right" style={{ color: form.short_description.length >= 290 ? "#ef4444" : CITADELLE_COLORS.textMuted }}>{form.short_description.length}/300</p>
            </div>
            <SecurityContactNotice />
          </div>
        )}

        {/* Étape 2 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {form.is_auction ? t("listing_form.price_label_auction") : t("listing_form.price_label_sale")}
                </label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)}
                  onFocus={handlePriceFocus}
                  placeholder="5000" min={minPrice} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}
                  data-testid="create-listing-price" />
                <p className="text-xs mt-1.5 px-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {t("listing_form.price_min_note")}<strong style={{ color: CITADELLE_COLORS.blue }}>{minPrice} €</strong> {t("listing_form.price_fees_note", { fees: commission.minimum_eur })}
                </p>
                {commissionEst !== null && (
                  <p className="text-xs mt-1.5 px-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {t("listing_form.commission_est")}<strong>{commissionEst.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong>
                    &nbsp;·&nbsp;{t("listing_form.you_receive")}<strong style={{ color: CITADELLE_COLORS.blue }}>{(priceNum - commissionEst).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong>
                  </p>
                )}
              </div>
              <div className="flex items-end pb-3">
                {!form.is_auction && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: CITADELLE_COLORS.blue }}>
                    <input type="checkbox" checked={form.price_negotiable} onChange={e => set("price_negotiable", e.target.checked)} className="w-4 h-4 rounded" />
                    {t("listing_form.price_negotiable")}
                  </label>
                )}
              </div>
            </div>

            {/* Section Enchères */}
            <div className="p-4 rounded-2xl" style={{ background: "rgba(201,164,92,0.05)", border: `1px solid rgba(201,164,92,0.2)` }}>
              <label className="flex items-center gap-3 cursor-pointer mb-1">
                <input type="checkbox" checked={form.is_auction} onChange={e => set("is_auction", e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>{t("listing_form.auction_enable")}</span>
              </label>
              <p className="text-xs ml-7 mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("listing_form.auction_desc")}
              </p>

              {form.is_auction && (
                <div className="space-y-4 mt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.auction_duration")}</label>
                      <input type="number" value={form.auction_duration_days}
                        onChange={e => set("auction_duration_days", Math.min(31, Math.max(3, parseInt(e.target.value) || 7)))}
                        min="3" max="31" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>{t("listing_form.auction_duration_hint")}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.auction_buynow")} <span className="font-normal">{t("listing_form.optional")}</span></label>
                      <input type="number" value={form.auction_buy_now_price}
                        onChange={e => set("auction_buy_now_price", e.target.value)}
                        placeholder="Ex: 12000" min={minPrice} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>{t("listing_form.auction_buynow_hint", { min: minPrice })}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.revenue_label")}
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>+12 pts</span>
                </label>
                <input type="number" value={form.monthly_revenue} onChange={e => set("monthly_revenue", e.target.value)}
                  placeholder="1200" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.charges_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span>
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>+5 pts</span>
                </label>
                <input type="number" value={form.monthly_charges} onChange={e => set("monthly_charges", e.target.value)}
                  placeholder="350" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.traffic_label")}
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>+8 pts</span>
                </label>
                <input type="number" value={form.monthly_traffic} onChange={e => set("monthly_traffic", e.target.value)}
                  placeholder="15000" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.traffic_sources_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span>
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>+4 pts</span>
                </label>
                <input value={form.traffic_sources} onChange={e => set("traffic_sources", e.target.value)}
                  placeholder={t("listing_form.traffic_sources_ph")} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.age_label")}</label>
                <input type="number" value={form.age_months} onChange={e => set("age_months", e.target.value)}
                  placeholder="24" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.niche_label")}</label>
                <input value={form.niche} onChange={e => set("niche", e.target.value)}
                  placeholder={t("listing_form.niche_ph")} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.region_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span></label>
                <input value={form.region} onChange={e => set("region", e.target.value)}
                  placeholder={t("listing_form.region_ph")} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.clients_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span></label>
                <input type="number" value={form.registered_clients} onChange={e => set("registered_clients", e.target.value)}
                  placeholder="250" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Repreneur idéal + Temps consacré */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.ideal_buyer_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span>
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>+5 pts</span>
                </label>
                <textarea value={form.ideal_buyer} onChange={e => set("ideal_buyer", e.target.value)}
                  rows={3} placeholder={t("listing_form.ideal_buyer_ph")}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.weekly_hours_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span>
                </label>
                <input type="number" value={form.weekly_hours} onChange={e => set("weekly_hours", e.target.value)}
                  placeholder="5" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("listing_form.weekly_hours_hint")}</p>
              </div>
            </div>
            {/* Points forts / Points faibles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.strengths_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span></label>
                <textarea value={form.strengths} onChange={e => set("strengths", e.target.value)}
                  rows={4} placeholder={t("listing_form.strengths_ph")}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ ...inputStyle, borderColor: "rgba(34,197,94,0.3)" }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.weaknesses_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span>
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>+4 pts</span>
                </label>
                <textarea value={form.weaknesses} onChange={e => set("weaknesses", e.target.value)}
                  rows={4} placeholder={t("listing_form.weaknesses_ph")}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ ...inputStyle, borderColor: "rgba(239,68,68,0.3)" }} />
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("listing_form.weaknesses_hint")}</p>
              </div>
            </div>
            {/* Description + Techno */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.desc_label")} <span className="font-normal text-xs">{t("listing_form.desc_hint")}</span></label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                rows={8} placeholder={t("listing_form.desc_ph")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle}
                data-testid="create-listing-desc" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.tech_label")} <span className="font-normal text-xs">{t("listing_form.tech_hint")}</span></label>
              <input value={form.technologies} onChange={e => set("technologies", e.target.value)}
                placeholder={t("listing_form.tech_ph")} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_adult} onChange={e => set("is_adult", e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5" data-testid="create-listing-adult" />
                <span>
                  <span className="block text-sm font-semibold" style={{ color: "#DC2626" }}>{t("listing_form.adult_label")}</span>
                  <span className="block text-xs mt-1" style={labelStyle}>
                    {t("listing_form.adult_desc")}
                  </span>
                </span>
              </label>
            </div>
            {!form.is_adult && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.url_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span></label>
                  <input value={form.url_preview} onChange={e => set("url_preview", e.target.value)}
                    placeholder={t("listing_form.url_ph")} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}
                    data-testid="create-listing-url" />
                  <label className="flex items-start gap-3 cursor-pointer mt-3 p-3 rounded-xl" style={{ background: "rgba(201,164,92,0.06)", border: "1px solid rgba(201,164,92,0.2)" }}>
                    <input type="checkbox" checked={form.url_public} onChange={e => set("url_public", e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5" data-testid="create-listing-url-public" />
                    <span>
                      <span className="block text-sm font-semibold" style={labelStyle}>{t("listing_form.url_public_label")}</span>
                      <span className="block text-xs mt-1" style={labelStyle}>
                        {t("listing_form.url_public_desc")}
                      </span>
                    </span>
                  </label>
                </div>
                <CitadelleImageUpload
                  images={form.images}
                  onChange={(imgs) => set("images", imgs)}
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                />
              </>
            )}
          </div>
        )}

        {/* Étape 4 — Récap */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl space-y-3" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
              {[
                { label: t("listing_form.recap_type"), value: [...TYPE_OPTIONS, ...EXTRA_TYPE_OPTIONS].find(o => o.value === form.type)?.label },
                { label: t("listing_form.recap_title"), value: form.title },
                { label: t("listing_form.recap_price"), value: `${parseFloat(form.price).toLocaleString("fr-FR")} €${form.price_negotiable ? t("listing_form.recap_negotiable") : ""}` },
                { label: t("listing_form.recap_revenue"), value: form.monthly_revenue ? `${parseFloat(form.monthly_revenue).toLocaleString("fr-FR")} €` : t("listing_form.not_provided") },
                { label: t("listing_form.recap_traffic"), value: form.monthly_traffic ? `${parseInt(form.monthly_traffic).toLocaleString("fr-FR")}${t("listing_form.recap_traffic_unit")}` : t("listing_form.not_provided") },
                { label: t("listing_form.recap_age"), value: form.age_months ? `${form.age_months}${t("listing_form.recap_age_unit")}` : t("listing_form.not_provided_f") },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: CITADELLE_COLORS.textMuted }}>{label}</span>
                  <span className="font-semibold text-right ml-4" style={{ color: CITADELLE_COLORS.blue }}>{value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)`, color: CITADELLE_COLORS.textMuted }}>
              {t("listing_form.recap_note")}
            </div>

            {/* Consentement partage réseaux sociaux — choix obligatoire */}
            <div className="p-4 rounded-2xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }} data-testid="social-share-consent">
              <p className="text-sm font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                {t("listing_form.social_q")} <span style={{ color: "#DC2626" }}>*</span>
              </p>
              <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("listing_form.social_desc")}
              </p>
              <div className="flex gap-3">
                {[{ v: true, label: t("listing_form.social_yes") }, { v: false, label: t("listing_form.social_no") }].map(opt => {
                  const active = form.allow_social_share === opt.v;
                  return (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => set("allow_social_share", opt.v)}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: active ? CITADELLE_COLORS.gold : "transparent",
                        color: active ? CITADELLE_COLORS.night : CITADELLE_COLORS.blue,
                        border: `1px solid ${active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                      }}
                      data-testid={`social-share-${opt.v ? "yes" : "no"}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
          <button onClick={prev} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            <ChevronLeft size={16} /> {t("listing_form.prev")}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {t("listing_form.next")} <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="create-listing-submit">
              {loading ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                       : <><CheckCircle size={16} /> {t("listing_form.submit")}</>}
            </button>
          )}
        </div>
      </div>
    </CitadelleLayout>
    {showCommissionPopup && (
      <CommissionInfoPopup onAcknowledge={handleCommissionAcknowledge} />
    )}
  </>
  );
}
