/**
 * Créer une annonce — La Citadelle Numérique
 * Formulaire multi-étapes (4 étapes)
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Globe, ShoppingCart, Cloud, Monitor, Users, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, MoreHorizontal, Store, Package, Mail, Youtube, Camera, Smartphone, Linkedin, MessageSquare, MessagesSquare, FileText, Newspaper, Bot, LayoutTemplate, Database, Star } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CitadelleImageUpload } from "@/components/citadelle/CitadelleImageUpload";
import CommissionInfoPopup from "@/components/citadelle/CommissionInfoPopup";
import ListingQualityHelper from "@/components/citadelle/ListingQualityHelper";
import BoostModal from "@/components/citadelle/BoostModal";
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

const EXTRA_TYPE_OPTIONS = [
  { value: "shopify_store",   label: "Boutique Shopify",              icon: Store,          desc: "Shopify, dropshipping" },
  { value: "amazon_fba",      label: "Amazon FBA",                    icon: Package,        desc: "Business Amazon FBA / Merch" },
  { value: "newsletter",      label: "Newsletter",                    icon: Mail,           desc: "Newsletter payante ou sponsorisée" },
  { value: "youtube_channel", label: "Chaîne YouTube",                icon: Youtube,        desc: "Chaîne monétisée" },
  { value: "instagram",       label: "Compte Instagram",              icon: Camera,         desc: "Compte ou page Instagram" },
  { value: "tiktok",          label: "Compte TikTok",                 icon: Smartphone,     desc: "Compte TikTok monétisé" },
  { value: "linkedin_page",   label: "Page LinkedIn Entreprise",      icon: Linkedin,       desc: "Page entreprise LinkedIn" },
  { value: "discord_server",  label: "Serveur Discord",               icon: MessageSquare,  desc: "Communauté Discord" },
  { value: "forum",           label: "Forum",                         icon: MessagesSquare, desc: "Forum ou communauté en ligne" },
  { value: "blog",            label: "Blog",                          icon: FileText,       desc: "Blog monétisé" },
  { value: "online_media",    label: "Média en ligne",                icon: Newspaper,      desc: "Magazine, journal, media digital" },
  { value: "ai_automation",   label: "Agents IA / Automatisations",   icon: Bot,            desc: "Outils IA, scripts, workflows" },
  { value: "template_plugin", label: "Templates / Thèmes / Plugins",  icon: LayoutTemplate, desc: "Assets numériques revendables" },
  { value: "database_api",    label: "Bases de données / APIs",       icon: Database,       desc: "APIs, datasets, bases de données" },
];

const STEPS = ["Type & Titre", "Données clés", "Détails", "Récapitulatif"];

const initialForm = {
  type: "", title: "", short_description: "",
  price: "", price_negotiable: false,
  monthly_revenue: "", monthly_traffic: "", age_months: "", niche: "",
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);
  const [boostModal, setBoostModal] = useState(false);
  const [showCommissionPopup, setShowCommissionPopup] = useState(false);
  const [commissionAcknowledged, setCommissionAcknowledged] = useState(false);
  const [commission, setCommission] = useState({ rate: 0.05, minimum_eur: 49 });
  const [showOtherPanel, setShowOtherPanel] = useState(false);
  const { isAuthenticated } = useCitadelleAuth();
  const navigate = useNavigate();

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
            <h2 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>Connexion requise</h2>
            <p className="text-sm mb-5" style={{ color: CITADELLE_COLORS.textMuted }}>Vous devez être connecté pour publier une annonce.</p>
            <Link to="/citadelle/connexion" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              Se connecter
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
      if (!form.type) return "Sélectionnez un type d'actif";
      if (form.title.trim().length < 5) return "Le titre doit contenir au moins 5 caractères";
      if (form.short_description.trim().length < 20) return "La description courte doit contenir au moins 20 caractères";
    }
    if (step === 1) {
      if (!form.price || parseFloat(form.price) <= 0) return "Saisissez un prix valide (> 0)";
      if (parseFloat(form.price) < minPrice) return `Le prix ${form.is_auction ? "de départ / réserve" : "de vente"} minimum est de ${minPrice} € (frais de traitement minimum de ${commission.minimum_eur} €).`;
      if (form.is_auction && form.auction_buy_now_price && parseFloat(form.auction_buy_now_price) < minPrice) return `Le prix d'achat immédiat minimum est de ${minPrice} € (frais de traitement minimum de ${commission.minimum_eur} €).`;
    }
    if (step === 2) {
      if (form.description.trim().length < 50) return "La description détaillée doit contenir au moins 50 caractères";
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
      setError("Merci d'indiquer si nous pouvons partager votre annonce sur nos réseaux sociaux.");
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
        monthly_traffic: form.monthly_traffic ? parseInt(form.monthly_traffic) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        niche: form.niche.trim() || null,
        technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean),
        url_preview: form.is_adult ? null : (form.url_preview.trim() || null),
        url_public: form.is_adult ? false : !!form.url_public,
        images: form.is_adult ? [] : form.images.filter(Boolean),
        is_adult: form.is_adult,
        allow_social_share: !!form.allow_social_share,
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
        setError(detail || "Une erreur est survenue");
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
            Annonce soumise !
          </h2>
          <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
            Votre annonce est en attente de validation par notre équipe. Vous recevrez une notification dès sa publication (sous 24h).
          </p>

          {/* Proposition « Annonce à la Une » */}
          {createdListing?.id && (
            <div className="p-5 rounded-2xl mb-6 text-left" data-testid="post-submit-boost"
              style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.25)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} style={{ color: CITADELLE_COLORS.gold }} />
                <p className="text-sm font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                  Donnez un coup de projecteur à votre annonce
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                Passez votre annonce « à la Une » pour apparaître dans le carrousel mis en avant sur l'accueil et la liste des annonces. Dès 19 €.
              </p>
              <button
                type="button"
                onClick={() => setBoostModal(true)}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="post-submit-boost-btn">
                <Star size={14} /> Mettre à la Une
              </button>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link to="/citadelle/espace-membre/mes-annonces" className="px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ border: `1px solid ${CITADELLE_COLORS.blue}`, color: CITADELLE_COLORS.blue }}>
              Mes annonces
            </Link>
            <Link to="/citadelle/annonces" className="px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              Voir les annonces
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
            Publier une annonce
          </h1>
          <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>Gratuit · Validé sous 24h · Commission 5% à la vente uniquement</p>
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
              <label className="block text-sm font-semibold mb-3" style={labelStyle}>Type d'actif *</label>
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
                        : "Autre type d'actif"}
                    </p>
                    <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                      Newsletter, YouTube, FBA, IA, Templates...
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
                    Sélectionnez la catégorie exacte :
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
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>Titre de l'annonce *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="Ex: Blog culinaire 2 500€/mois — 45k visiteurs"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}
                data-testid="create-listing-title" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>Accroche courte * <span className="font-normal text-xs">(20-300 caractères)</span></label>
              <textarea value={form.short_description} onChange={e => set("short_description", e.target.value)}
                rows={3} placeholder="Résumé percutant visible dans les résultats de recherche..."
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle}
                data-testid="create-listing-short-desc" />
              <p className="text-xs mt-1 text-right" style={{ color: form.short_description.length >= 290 ? "#ef4444" : CITADELLE_COLORS.textMuted }}>{form.short_description.length}/300</p>
            </div>
          </div>
        )}

        {/* Étape 2 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>
                  {form.is_auction ? "Prix de départ / réserve (€) *" : "Prix de vente (€) *"}
                </label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)}
                  onFocus={handlePriceFocus}
                  placeholder="5000" min={minPrice} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}
                  data-testid="create-listing-price" />
                <p className="text-xs mt-1.5 px-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Minimum&nbsp;: <strong style={{ color: CITADELLE_COLORS.blue }}>{minPrice} €</strong> (frais de traitement min. {commission.minimum_eur} €)
                </p>
                {commissionEst !== null && (
                  <p className="text-xs mt-1.5 px-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Commission estimée&nbsp;: <strong>{commissionEst.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong>
                    &nbsp;·&nbsp;Vous recevrez&nbsp;: <strong style={{ color: CITADELLE_COLORS.blue }}>{(priceNum - commissionEst).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong>
                  </p>
                )}
              </div>
              <div className="flex items-end pb-3">
                {!form.is_auction && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: CITADELLE_COLORS.blue }}>
                    <input type="checkbox" checked={form.price_negotiable} onChange={e => set("price_negotiable", e.target.checked)} className="w-4 h-4 rounded" />
                    Prix négociable
                  </label>
                )}
              </div>
            </div>

            {/* Section Enchères */}
            <div className="p-4 rounded-2xl" style={{ background: "rgba(201,164,92,0.05)", border: `1px solid rgba(201,164,92,0.2)` }}>
              <label className="flex items-center gap-3 cursor-pointer mb-1">
                <input type="checkbox" checked={form.is_auction} onChange={e => set("is_auction", e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>Mettre en enchère</span>
              </label>
              <p className="text-xs ml-7 mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                Les acheteurs enchérissent sur votre annonce. Le prix de départ est le prix saisi ci-dessus.
              </p>

              {form.is_auction && (
                <div className="space-y-4 mt-3">
                  <div className="flex items-center gap-3 ml-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: CITADELLE_COLORS.blue }}>
                      <input type="checkbox" checked={form.auction_show_reserve} onChange={e => set("auction_show_reserve", e.target.checked)} className="w-4 h-4 rounded" />
                      Afficher le prix de départ publiquement
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={labelStyle}>Durée de l'enchère (jours)</label>
                      <input type="number" value={form.auction_duration_days}
                        onChange={e => set("auction_duration_days", Math.min(31, Math.max(3, parseInt(e.target.value) || 7)))}
                        min="3" max="31" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>Entre 3 et 31 jours</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={labelStyle}>Prix d'achat immédiat (€) <span className="font-normal">(optionnel)</span></label>
                      <input type="number" value={form.auction_buy_now_price}
                        onChange={e => set("auction_buy_now_price", e.target.value)}
                        placeholder="Ex: 12000" min={minPrice} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>Permet un achat direct sans enchère (min. {minPrice} €)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>Revenus mensuels (€)</label>
                <input type="number" value={form.monthly_revenue} onChange={e => set("monthly_revenue", e.target.value)}
                  placeholder="1200" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>Trafic mensuel (visiteurs)</label>
                <input type="number" value={form.monthly_traffic} onChange={e => set("monthly_traffic", e.target.value)}
                  placeholder="15000" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>Ancienneté (mois)</label>
                <input type="number" value={form.age_months} onChange={e => set("age_months", e.target.value)}
                  placeholder="24" min="0" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={labelStyle}>Niche / Secteur</label>
                <input value={form.niche} onChange={e => set("niche", e.target.value)}
                  placeholder="Cuisine, Finance, Sport..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>Description détaillée * <span className="font-normal text-xs">(minimum 50 caractères)</span></label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                rows={8} placeholder="Décrivez votre actif en détail : histoire, raison de la vente, points forts, potentiel de croissance..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle}
                data-testid="create-listing-desc" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>Technologies <span className="font-normal text-xs">(séparées par des virgules)</span></label>
              <input value={form.technologies} onChange={e => set("technologies", e.target.value)}
                placeholder="WordPress, WooCommerce, Stripe..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_adult} onChange={e => set("is_adult", e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5" data-testid="create-listing-adult" />
                <span>
                  <span className="block text-sm font-semibold" style={{ color: "#DC2626" }}>Contenu adulte (18+)</span>
                  <span className="block text-xs mt-1" style={labelStyle}>
                    Si coché : aucune image ni lien du site ne seront affichés sur l'annonce. Un bandeau « Contenu adulte » sera présenté et la consultation du détail sera réservée aux comptes vérifiés.
                  </span>
                </span>
              </label>
            </div>
            {!form.is_adult && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={labelStyle}>URL du site <span className="font-normal text-xs">(optionnel)</span></label>
                  <input value={form.url_preview} onChange={e => set("url_preview", e.target.value)}
                    placeholder="https://monsite.fr" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}
                    data-testid="create-listing-url" />
                  <label className="flex items-start gap-3 cursor-pointer mt-3 p-3 rounded-xl" style={{ background: "rgba(201,164,92,0.06)", border: "1px solid rgba(201,164,92,0.2)" }}>
                    <input type="checkbox" checked={form.url_public} onChange={e => set("url_public", e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5" data-testid="create-listing-url-public" />
                    <span>
                      <span className="block text-sm font-semibold" style={labelStyle}>Rendre l'URL visible publiquement sur l'annonce</span>
                      <span className="block text-xs mt-1" style={labelStyle}>
                        Si décoché, l'adresse reste confidentielle : elle ne sera communiquée à l'acheteur qu'à la manifestation d'un intérêt sérieux ou à l'entame du processus de vente sécurisé.
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
                { label: "Type", value: [...TYPE_OPTIONS, ...EXTRA_TYPE_OPTIONS].find(t => t.value === form.type)?.label },
                { label: "Titre", value: form.title },
                { label: "Prix", value: `${parseFloat(form.price).toLocaleString("fr-FR")} €${form.price_negotiable ? " (négociable)" : ""}` },
                { label: "Revenus/mois", value: form.monthly_revenue ? `${parseFloat(form.monthly_revenue).toLocaleString("fr-FR")} €` : "Non renseigné" },
                { label: "Trafic/mois", value: form.monthly_traffic ? `${parseInt(form.monthly_traffic).toLocaleString("fr-FR")} visiteurs` : "Non renseigné" },
                { label: "Ancienneté", value: form.age_months ? `${form.age_months} mois` : "Non renseignée" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: CITADELLE_COLORS.textMuted }}>{label}</span>
                  <span className="font-semibold text-right ml-4" style={{ color: CITADELLE_COLORS.blue }}>{value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)`, color: CITADELLE_COLORS.textMuted }}>
              Votre annonce sera soumise à validation (sous 24h) avant publication. Commission de 5% uniquement si la vente aboutit.
            </div>

            {/* Consentement partage réseaux sociaux — choix obligatoire */}
            <div className="p-4 rounded-2xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }} data-testid="social-share-consent">
              <p className="text-sm font-semibold mb-1" style={{ color: CITADELLE_COLORS.blue }}>
                Souhaitez-vous que nous partagions votre annonce sur nos réseaux sociaux ? <span style={{ color: "#DC2626" }}>*</span>
              </p>
              <p className="text-xs mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                La Citadelle Numérique pourra mettre en avant votre annonce sur ses comptes (LinkedIn, Facebook, X…) pour maximiser sa visibilité. Choix obligatoire.
              </p>
              <div className="flex gap-3">
                {[{ v: true, label: "Oui, partagez-la" }, { v: false, label: "Non merci" }].map(opt => {
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
            <ChevronLeft size={16} /> Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="create-listing-submit">
              {loading ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                       : <><CheckCircle size={16} /> Soumettre l'annonce</>}
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
