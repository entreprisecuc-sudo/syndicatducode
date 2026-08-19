/**
 * Page liste des annonces — La Citadelle Numérique
 * Recherche, filtres, pagination
 */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ArrowRight, Shield } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import ListingCard from "@/components/citadelle/ListingCard";
import ListingsCarousel from "@/components/citadelle/ListingsCarousel";
import DevisModal from "@/components/modals/DevisModal";
import { useModal } from "@/context/ModalContext";
import citadelleApi from "@/services/citadelleApi";
import { useTranslation } from "react-i18next";
import { CITADELLE_COLORS, CITADELLE_ALL_CATEGORIES } from "@/config/citadelleConstants";
import { localizeCategory } from "@/i18n/configCatalogEn";

const BUDGET_OPTIONS = [
  { value: "", key: "budget_all" },
  { value: "0-5000", key: "budget_lt5k" },
  { value: "5000-20000", key: "budget_5k20k" },
  { value: "20000-50000", key: "budget_20k50k" },
  { value: "50000-100000", key: "budget_50k100k" },
  { value: "100000+", key: "budget_gt100k" },
];

const SORT_OPTIONS = [
  { value: "recent", key: "sort_recent" },
  { value: "price_asc", key: "sort_price_asc" },
  { value: "price_desc", key: "sort_price_desc" },
  { value: "revenue", key: "sort_revenue" },
];

export default function CitadelleListings() {
  const { openModal } = useModal();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const q      = searchParams.get("q") || "";
  const type   = searchParams.get("type") || "";
  const budget = searchParams.get("budget") || "";
  const sort   = searchParams.get("sort") || "recent";
  const page   = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  useEffect(() => {
    document.title = `${t('listings.page_title')} — La Citadelle Numérique`;
  }, [t]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (q) params.q = q;
      if (type) params.type = type;
      if (budget) params.budget = budget;
      const res = await citadelleApi.get("/listings", { params });
      setListings(res.data.listings);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error("Erreur chargement annonces:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const params = Object.fromEntries(searchParams.entries());
    if (value) params[key] = value;
    else delete params[key];
    params.page = "1";
    setSearchParams(params);
  };

  const goToPage = (p) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(p);
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  return (
    <CitadelleLayout>
      {/* Header */}
      <div className="py-10 px-4 md:px-6" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}>
            {t('listings.page_title')}
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {total > 0 ? t(total === 1 ? 'listings.subtitle_one' : 'listings.subtitle_other', { count: total }) : t('listings.subtitle_empty')}
          </p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="sticky top-[80px] z-30 border-b px-4 md:px-6 py-3" style={{ background: "white", borderColor: CITADELLE_COLORS.border }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 rounded-lg" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <Search size={15} style={{ color: CITADELLE_COLORS.textMuted }} />
            <input
              type="text"
              defaultValue={q}
              onKeyDown={e => { if (e.key === "Enter") updateFilter("q", e.target.value); }}
              onBlur={e => updateFilter("q", e.target.value)}
              placeholder={t('listings.search_placeholder')}
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: CITADELLE_COLORS.blue }}
              data-testid="listings-search"
            />
          </div>

          {/* Type */}
          <select value={type} onChange={e => updateFilter("type", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            data-testid="listings-filter-type">
            <option value="">{t('listings.all_types')}</option>
            {CITADELLE_ALL_CATEGORIES.map(c => { const lc = localizeCategory(c, i18n.language); return <option key={c.slug} value={c.slug}>{lc.label}</option>; })}
          </select>

          {/* Budget */}
          <select value={budget} onChange={e => updateFilter("budget", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            data-testid="listings-filter-budget">
            {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`listings.${o.key}`)}</option>)}
          </select>

          {/* Tri */}
          <select value={sort} onChange={e => updateFilter("sort", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            data-testid="listings-sort">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`listings.${o.key}`)}</option>)}
          </select>

          {(q || type || budget) && (
            <button onClick={() => setSearchParams({})} className="text-sm px-3 py-2 rounded-lg transition-all"
              style={{ color: CITADELLE_COLORS.gold, border: `1px solid ${CITADELLE_COLORS.gold}` }}>
              {t('listings.clear_filters')}
            </button>
          )}
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* ── Bandeau vendeur ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl mb-8 px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: CITADELLE_COLORS.night }}>

          {/* Ornements décoratifs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-5"
              style={{ background: CITADELLE_COLORS.gold }} />
            <div className="absolute -left-8 -bottom-12 w-40 h-40 rounded-full opacity-5"
              style={{ background: CITADELLE_COLORS.gold }} />
          </div>

          {/* Texte */}
          <div className="relative flex items-center gap-5">
            <div className="hidden md:flex w-12 h-12 rounded-xl items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.25)" }}>
              <Shield size={22} style={{ color: CITADELLE_COLORS.gold }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: CITADELLE_COLORS.gold }}>
                {t('listings.banner_label')}
              </p>
              <h2 className="text-lg md:text-xl font-black text-white leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {t('listings.banner_title')}
              </h2>
              <p className="text-sm mt-1 hidden md:block" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t('listings.banner_desc')}
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link to="/citadelle/espace-membre/annonces/nouvelle"
            className="relative flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110 whitespace-nowrap"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="cta-vendre-annonce">
            {t('listings.banner_cta')}
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Carrousel « À la Une » — indépendant des filtres (sous le bandeau) */}
        <ListingsCarousel variant="light" title={t('home.latest')} limit={8} />

        {/* ── Séparateur élégant entre « À la Une » et la grille ─────────── */}
        <div className="flex items-center gap-4 mt-16 mb-10" data-testid="listings-section-divider">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="inline-block w-2.5 h-2.5 rotate-45 rounded-[2px]" style={{ background: CITADELLE_COLORS.gold }} />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: CITADELLE_COLORS.blue }}>
              {t('listings.section_all')}
            </h2>
          </div>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${CITADELLE_COLORS.gold}, rgba(201,164,92,0))` }} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
                <div className="h-40" style={{ background: CITADELLE_COLORS.border }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded" style={{ background: CITADELLE_COLORS.border }} />
                  <div className="h-3 w-3/4 rounded" style={{ background: CITADELLE_COLORS.border }} />
                  <div className="h-6 w-1/2 rounded" style={{ background: CITADELLE_COLORS.border }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl mb-4">🏰</p>
            <h2 className="text-xl font-bold mb-2" style={{ color: CITADELLE_COLORS.blue }}>{t('listings.empty_title')}</h2>
            <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
              {q || type || budget ? t('listings.empty_filtered') : t('listings.empty_default')}
            </p>
            <Link to="/citadelle/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {t('listings.empty_cta')}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} search={`?${searchParams.toString()}`} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2" data-testid="listings-pagination">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                  className="p-2 rounded-lg disabled:opacity-40 transition-all"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => goToPage(p)}
                    className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                    style={p === page
                      ? { background: CITADELLE_COLORS.blue, color: "white" }
                      : { border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => goToPage(page + 1)} disabled={page >= pages}
                  className="p-2 rounded-lg disabled:opacity-40 transition-all"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Encart partenaire — Syndicat du Code (projet sur mesure) */}
            <div
              className="mt-14 mb-4 rounded-2xl overflow-hidden"
              data-testid="syndicat-partner-cta"
              style={{
                background: "#FFFFFF",
                border: `3px solid ${CITADELLE_COLORS.gold}`,
                boxShadow: "0 10px 30px rgba(15,39,71,0.08)",
              }}
            >
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-10">
                {/* Logo Syndicat à gauche */}
                <div className="flex-shrink-0">
                  <div
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center p-2 overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: `2px solid ${CITADELLE_COLORS.gold}`,
                    }}
                  >
                    <img
                      src="/logo.png"
                      alt="Le Syndicat du Code"
                      className="w-full h-full object-contain"
                      data-testid="syndicat-partner-logo"
                    />
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 text-center md:text-left">
                  <h3
                    className="text-2xl md:text-3xl font-bold mb-2"
                    style={{ color: CITADELLE_COLORS.blue }}
                  >
                    {t('listings.syndicat_title')}
                  </h3>
                  <p className="text-sm md:text-base" style={{ color: "#4A5568" }}>
                    {t('listings.syndicat_desc_a')}
                    <span className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                      {t('listings.syndicat_partner')}
                    </span>
                    {t('listings.syndicat_desc_b')}
                  </p>
                </div>

                {/* Bouton action Syndicat */}
                <div className="flex-shrink-0">
                  <button
                    onClick={openModal}
                    data-testid="syndicat-partner-cta-button"
                    className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg, var(--sage-dark, #2F4A38), var(--sage, #4A6B4F))" }}
                  >
                    {t('listings.syndicat_cta')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Syndicat (liaison uniquement, on reste sur La Citadelle) */}
      <DevisModal />
    </CitadelleLayout>
  );
}
