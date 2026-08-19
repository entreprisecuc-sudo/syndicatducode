/**
 * Modifier une annonce — La Citadelle Numérique
 * Formulaire pré-rempli avec les données existantes
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Globe, ShoppingCart, Cloud, Monitor, Users,
  ChevronLeft, CheckCircle, AlertCircle, ArrowLeft
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CitadelleImageUpload } from "@/components/citadelle/CitadelleImageUpload";
import CommissionInfoPopup from "@/components/citadelle/CommissionInfoPopup";
import ListingQualityHelper from "@/components/citadelle/ListingQualityHelper";
import SecurityContactNotice from "@/components/citadelle/SecurityContactNotice";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_OPTIONS = [
  { value: "website",        label: "Site internet",   icon: Globe,         desc: "Site vitrine, blog, portfolio" },
  { value: "ecommerce",      label: "E-commerce",      icon: ShoppingCart,  desc: "Boutique en ligne" },
  { value: "saas",           label: "SaaS",            icon: Cloud,         desc: "Logiciel en tant que service" },
  { value: "webapp",         label: "Application web", icon: Monitor,       desc: "Outil ou app en ligne" },
  { value: "social_account", label: "Réseau social",   icon: Users,         desc: "Compte ou page" },
  { value: "domain",         label: "Nom de domaine",  icon: Globe,         desc: "Domaine, extension premium" },
];

export default function CitadelleEditListing() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useCitadelleAuth();

  const [form, setForm] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showCommissionPopup, setShowCommissionPopup] = useState(false);
  const [commissionAcknowledged, setCommissionAcknowledged] = useState(false);
  const [commission, setCommission] = useState({ rate: 0.05, minimum_eur: 49 });

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

  // Chargement de l'annonce existante
  useEffect(() => {
    if (authLoading) return; // Wait for auth context to finish loading
    if (!isAuthenticated) {
      navigate("/citadelle/connexion");
      return;
    }
    loadListing();
  }, [id, isAuthenticated, authLoading]);

  const loadListing = async () => {
    setLoadingData(true);
    try {
      const res = await citadelleApi.get("/listings/my");
      const listing = res.data.listings.find(l => l.id === id);
      if (!listing) {
        setNotFound(true);
        return;
      }
      // Pré-remplir le formulaire avec les données existantes
      setForm({
        title: listing.title || "",
        short_description: listing.short_description || "",
        price: String(listing.price || ""),
        price_negotiable: listing.price_negotiable || false,
        monthly_revenue: listing.monthly_revenue != null ? String(listing.monthly_revenue) : "",
        monthly_traffic: listing.monthly_traffic != null ? String(listing.monthly_traffic) : "",
        age_months: listing.age_months != null ? String(listing.age_months) : "",
        niche: listing.niche || "",
        description: listing.description || "",
        technologies: (listing.technologies || []).join(", "),
        url_preview: listing.url_preview || "",
        url_public: !!listing.url_public,
        images: [...(listing.images || []), "", "", "", "", ""].slice(0, 5),
        is_adult: !!listing.is_adult,
        allow_social_share: !!listing.allow_social_share,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoadingData(false);
    }
  };

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError("");
  };

  const minPrice = (commission.minimum_eur || 0) + 1;

  const validate = () => {
    if (form.title.trim().length < 5) return t("listing_form.err_title_min");
    if (form.short_description.trim().length < 20) return t("listing_form.err_shortdesc_min_edit");
    if (!form.price || parseFloat(form.price) <= 0) return t("listing_form.err_price_valid_edit");
    if (parseFloat(form.price) < minPrice) return t("listing_form.err_price_min_sale", { min: minPrice, fees: commission.minimum_eur });
    if (form.description.trim().length < 50) return t("listing_form.err_desc_min_edit");
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        price_negotiable: form.price_negotiable,
        monthly_revenue: form.monthly_revenue ? parseFloat(form.monthly_revenue) : null,
        monthly_traffic: form.monthly_traffic ? parseInt(form.monthly_traffic) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        niche: form.niche.trim() || null,
        technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean),
        url_preview: form.is_adult ? null : (form.url_preview.trim() || null),
        url_public: form.is_adult ? false : !!form.url_public,
        images: form.is_adult ? [] : form.images.filter(Boolean),
        is_adult: form.is_adult,
        allow_social_share: !!form.allow_social_share,
      };
      await citadelleApi.patch(`/listings/${id}`, payload);
      navigate("/citadelle/espace-membre/mes-annonces");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(e => e.msg || JSON.stringify(e)).join(" — ") : detail || t("listing_form.err_generic_save"));
    } finally {
      setSaving(false);
    }
  };

  // ── États de chargement / erreurs ──────────────────────────────────────────

  if (loadingData) return (
    <CitadelleLayout>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
      </div>
    </CitadelleLayout>
  );

  if (notFound) return (
    <CitadelleLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🏰</p>
        <h1 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>{t("listing_form.not_found")}</h1>
        <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
          {t("listing_form.not_found_sub")}
        </p>
        <Link to="/citadelle/espace-membre/mes-annonces"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
          <ArrowLeft size={16} /> {t("listing_form.my_listings")}
        </Link>
      </div>
    </CitadelleLayout>
  );

  const inputStyle = {
    background: CITADELLE_COLORS.bg,
    border: `1px solid ${CITADELLE_COLORS.border}`,
    color: CITADELLE_COLORS.blue
  };
  const labelStyle = { color: CITADELLE_COLORS.blue };

  return (
    <>
    <CitadelleLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-10" data-testid="edit-listing-form">

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/citadelle/espace-membre/mes-annonces"
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
              {t("listing_form.edit_title")}
            </h1>
            <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("listing_form.edit_sub")}
            </p>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-6"
            style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Score de qualité + conseils bienveillants */}
        <ListingQualityHelper form={form} step={3} />

        <div className="space-y-6">
          {/* Type d'actif (lecture seule — non modifiable après création) */}
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)`, color: CITADELLE_COLORS.textMuted }}>
            {t("listing_form.type_locked")}
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              {t("listing_form.title_label")}
            </label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder={t("listing_form.title_ph")}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
              data-testid="edit-listing-title"
            />
          </div>

          {/* Accroche courte */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              {t("listing_form.shortdesc_label")} <span className="font-normal text-xs">{t("listing_form.shortdesc_hint")}</span>
            </label>
            <textarea
              value={form.short_description}
              onChange={e => set("short_description", e.target.value)}
              rows={3}
              placeholder={t("listing_form.shortdesc_ph")}
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1 text-right" style={{ color: form.short_description.length >= 290 ? "#ef4444" : CITADELLE_COLORS.textMuted }}>
              {form.short_description.length}/300
            </p>
          </div>

          <SecurityContactNotice />

          {/* Prix */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.price_label_sale")}</label>
              <input
                type="number"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                onFocus={handlePriceFocus}
                placeholder="5000" min={minPrice}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
                data-testid="edit-listing-price"
              />
              <p className="text-xs mt-1.5 px-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("listing_form.price_min_note")}<strong style={{ color: CITADELLE_COLORS.blue }}>{minPrice} €</strong> {t("listing_form.price_fees_note", { fees: commission.minimum_eur })}
              </p>
              {(() => {
                const p = parseFloat(form.price);
                if (!p || p <= 0) return null;
                const com = Math.max(p * commission.rate, commission.minimum_eur);
                return (
                  <p className="text-xs mt-1.5 px-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {t("listing_form.commission_word")}<strong>{com.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong>
                    &nbsp;·&nbsp;{t("listing_form.you_receive")}<strong style={{ color: CITADELLE_COLORS.blue }}>{(p - com).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong>
                  </p>
                );
              })()}
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: CITADELLE_COLORS.blue }}>
                <input
                  type="checkbox"
                  checked={form.price_negotiable}
                  onChange={e => set("price_negotiable", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                {t("listing_form.price_negotiable")}
              </label>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.revenue_label")}</label>
              <input type="number" value={form.monthly_revenue} onChange={e => set("monthly_revenue", e.target.value)}
                placeholder="1200" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>{t("listing_form.traffic_label")}</label>
              <input type="number" value={form.monthly_traffic} onChange={e => set("monthly_traffic", e.target.value)}
                placeholder="15000" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {/* Description détaillée */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              {t("listing_form.desc_label")} <span className="font-normal text-xs">{t("listing_form.desc_hint")}</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={8}
              placeholder={t("listing_form.desc_ph_edit")}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
              data-testid="edit-listing-desc"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              {t("listing_form.tech_label")} <span className="font-normal text-xs">{t("listing_form.tech_hint")}</span>
            </label>
            <input value={form.technologies} onChange={e => set("technologies", e.target.value)}
              placeholder={t("listing_form.tech_ph")}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>

          {/* Contenu adulte */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_adult} onChange={e => set("is_adult", e.target.checked)}
                className="w-4 h-4 rounded mt-0.5" data-testid="edit-listing-adult" />
              <span>
                <span className="block text-sm font-semibold" style={{ color: "#DC2626" }}>{t("listing_form.adult_label")}</span>
                <span className="block text-xs mt-1" style={labelStyle}>
                  {t("listing_form.adult_desc_edit")}
                </span>
              </span>
            </label>
          </div>

          {!form.is_adult && (
            <>
              {/* URL du site */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {t("listing_form.url_label")} <span className="font-normal text-xs">{t("listing_form.optional")}</span>
                </label>
                <input value={form.url_preview} onChange={e => set("url_preview", e.target.value)}
                  placeholder={t("listing_form.url_ph")}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                <label className="flex items-start gap-3 cursor-pointer mt-3 p-3 rounded-xl" style={{ background: "rgba(201,164,92,0.06)", border: "1px solid rgba(201,164,92,0.2)" }}>
                  <input type="checkbox" checked={form.url_public} onChange={e => set("url_public", e.target.checked)}
                    className="w-4 h-4 rounded mt-0.5" data-testid="edit-listing-url-public" />
                  <span>
                    <span className="block text-sm font-semibold" style={labelStyle}>{t("listing_form.url_public_label")}</span>
                    <span className="block text-xs mt-1" style={labelStyle}>
                      {t("listing_form.url_public_desc")}
                    </span>
                  </span>
                </label>
              </div>

              {/* Captures d'écran */}
              <CitadelleImageUpload
                images={form.images}
                onChange={(imgs) => set("images", imgs)}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            </>
          )}

          {/* Consentement partage réseaux sociaux */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.06)", border: `1px solid rgba(201,164,92,0.2)` }} data-testid="edit-social-share">
            <p className="text-sm font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
              {t("listing_form.social_share_title")}
            </p>
            <p className="text-xs mb-3" style={labelStyle}>
              {t("listing_form.social_share_q")}
            </p>
            <div className="flex gap-3">
              {[{ v: true, label: t("listing_form.social_yes") }, { v: false, label: t("listing_form.social_no") }].map(opt => {
                const active = !!form.allow_social_share === opt.v;
                return (
                  <button key={String(opt.v)} type="button" onClick={() => set("allow_social_share", opt.v)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: active ? CITADELLE_COLORS.gold : "transparent",
                      color: active ? CITADELLE_COLORS.night : CITADELLE_COLORS.blue,
                      border: `1px solid ${active ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
                    }}
                    data-testid={`edit-social-share-${opt.v ? "yes" : "no"}`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between mt-8 pt-6"
          style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
          <Link to="/citadelle/espace-membre/mes-annonces"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            <ChevronLeft size={16} /> {t("listing_form.cancel")}
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="edit-listing-save"
          >
            {saving
              ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
              : <><CheckCircle size={16} /> {t("listing_form.save")}</>
            }
          </button>
        </div>

      </div>
    </CitadelleLayout>
    {showCommissionPopup && (
      <CommissionInfoPopup onAcknowledge={handleCommissionAcknowledge} />
    )}
    </>
  );
}
