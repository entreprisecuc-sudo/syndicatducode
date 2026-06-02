/**
 * Modifier une annonce — La Citadelle Numérique
 * Formulaire pré-rempli avec les données existantes
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Globe, ShoppingCart, Cloud, Monitor, Users,
  ChevronLeft, CheckCircle, AlertCircle, ArrowLeft
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_OPTIONS = [
  { value: "website",        label: "Site internet",   icon: Globe,         desc: "Site vitrine, blog, portfolio" },
  { value: "ecommerce",      label: "E-commerce",      icon: ShoppingCart,  desc: "Boutique en ligne" },
  { value: "saas",           label: "SaaS",            icon: Cloud,         desc: "Logiciel en tant que service" },
  { value: "webapp",         label: "Application web", icon: Monitor,       desc: "Outil ou app en ligne" },
  { value: "social_account", label: "Réseau social",   icon: Users,         desc: "Compte ou page" },
];

export default function CitadelleEditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useCitadelleAuth();

  const [form, setForm] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Chargement de l'annonce existante
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/citadelle/connexion");
      return;
    }
    loadListing();
  }, [id, isAuthenticated]);

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
        images: [...(listing.images || []), "", "", ""].slice(0, 3),
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

  const validate = () => {
    if (form.title.trim().length < 5) return "Le titre doit contenir au moins 5 caractères";
    if (form.short_description.trim().length < 20) return "L'accroche doit contenir au moins 20 caractères";
    if (!form.price || parseFloat(form.price) <= 0) return "Prix invalide (doit être > 0)";
    if (form.description.trim().length < 50) return "La description doit contenir au moins 50 caractères";
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
        url_preview: form.url_preview.trim() || null,
        images: form.images.filter(Boolean),
      };
      await citadelleApi.patch(`/listings/${id}`, payload);
      navigate("/citadelle/espace-membre/mes-annonces");
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de la sauvegarde");
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
        <h1 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>Annonce introuvable</h1>
        <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
          Cette annonce n'existe pas ou vous n'êtes pas autorisé à la modifier.
        </p>
        <Link to="/citadelle/espace-membre/mes-annonces"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
          <ArrowLeft size={16} /> Mes annonces
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
              Modifier l'annonce
            </h1>
            <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
              Après modification, l'annonce repassera en validation (sous 24h)
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

        <div className="space-y-6">
          {/* Type d'actif (lecture seule — non modifiable après création) */}
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(201,164,92,0.07)", border: `1px solid rgba(201,164,92,0.2)`, color: CITADELLE_COLORS.textMuted }}>
            Le type d'actif ne peut pas être modifié après la création de l'annonce.
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              Titre de l'annonce *
            </label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Ex: Blog culinaire 2 500€/mois — 45k visiteurs"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
              data-testid="edit-listing-title"
            />
          </div>

          {/* Accroche courte */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              Accroche courte * <span className="font-normal text-xs">(20-300 caractères)</span>
            </label>
            <textarea
              value={form.short_description}
              onChange={e => set("short_description", e.target.value)}
              rows={3}
              placeholder="Résumé percutant visible dans les résultats de recherche..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1 text-right" style={{ color: CITADELLE_COLORS.textMuted }}>
              {form.short_description.length}/300
            </p>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={labelStyle}>Prix de vente (€) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="5000" min="1"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
                data-testid="edit-listing-price"
              />
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: CITADELLE_COLORS.blue }}>
                <input
                  type="checkbox"
                  checked={form.price_negotiable}
                  onChange={e => set("price_negotiable", e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Prix négociable
              </label>
            </div>
          </div>

          {/* Métriques */}
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

          {/* Description détaillée */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              Description détaillée * <span className="font-normal text-xs">(minimum 50 caractères)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={8}
              placeholder="Décrivez votre actif en détail..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
              data-testid="edit-listing-desc"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              Technologies <span className="font-normal text-xs">(séparées par des virgules)</span>
            </label>
            <input value={form.technologies} onChange={e => set("technologies", e.target.value)}
              placeholder="WordPress, WooCommerce, Stripe..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>

          {/* URL du site */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              URL du site <span className="font-normal text-xs">(masquée jusqu'à transaction)</span>
            </label>
            <input value={form.url_preview} onChange={e => set("url_preview", e.target.value)}
              placeholder="https://monsite.fr"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>

          {/* Captures d'écran */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={labelStyle}>
              Captures d'écran <span className="font-normal text-xs">(URLs d'images, 3 max)</span>
            </label>
            {form.images.map((img, i) => (
              <input key={i} value={img}
                onChange={e => { const arr = [...form.images]; arr[i] = e.target.value; set("images", arr); }}
                placeholder={`URL image ${i + 1}`}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-2"
                style={inputStyle}
              />
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between mt-8 pt-6"
          style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
          <Link to="/citadelle/espace-membre/mes-annonces"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            <ChevronLeft size={16} /> Annuler
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
              : <><CheckCircle size={16} /> Enregistrer les modifications</>
            }
          </button>
        </div>

      </div>
    </CitadelleLayout>
  );
}
