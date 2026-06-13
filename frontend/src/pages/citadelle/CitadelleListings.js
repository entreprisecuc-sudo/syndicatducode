/**
 * Page liste des annonces — La Citadelle Numérique
 * Recherche, filtres, pagination
 */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ArrowRight, Shield } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import ListingCard from "@/components/citadelle/ListingCard";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CATEGORIES } from "@/config/citadelleConstants";

const BUDGET_OPTIONS = [
  { value: "", label: "Tous budgets" },
  { value: "0-5000", label: "< 5 000 €" },
  { value: "5000-20000", label: "5 000 – 20 000 €" },
  { value: "20000-50000", label: "20 000 – 50 000 €" },
  { value: "50000-100000", label: "50 000 – 100 000 €" },
  { value: "100000+", label: "> 100 000 €" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récent" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "revenue", label: "Revenus" },
];

export default function CitadelleListings() {
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
    <CitadelleLayout pageTitle="Annonces">
      {/* Header */}
      <div className="py-10 px-4 md:px-6" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}>
            Toutes les annonces
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {total > 0 ? `${total} actif${total > 1 ? "s" : ""} numérique${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}` : "Soyez le premier à publier"}
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
              placeholder="Rechercher..."
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
            <option value="">Tous les types</option>
            {CITADELLE_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>

          {/* Budget */}
          <select value={budget} onChange={e => updateFilter("budget", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            data-testid="listings-filter-budget">
            {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Tri */}
          <select value={sort} onChange={e => updateFilter("sort", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            data-testid="listings-sort">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {(q || type || budget) && (
            <button onClick={() => setSearchParams({})} className="text-sm px-3 py-2 rounded-lg transition-all"
              style={{ color: CITADELLE_COLORS.gold, border: `1px solid ${CITADELLE_COLORS.gold}` }}>
              Effacer
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
                Vendeurs
              </p>
              <h2 className="text-lg md:text-xl font-black text-white leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Votre actif numérique mérite la Citadelle
              </h2>
              <p className="text-sm mt-1 hidden md:block" style={{ color: "rgba(255,255,255,0.5)" }}>
                Publiez votre site, SaaS ou newsletter — La Garde vérifie et met en valeur votre annonce sous 24h.
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link to="/citadelle/espace-membre/annonces/nouvelle"
            className="relative flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110 whitespace-nowrap"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="cta-vendre-annonce">
            Publier mon annonce
            <ArrowRight size={15} />
          </Link>
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
            <h2 className="text-xl font-bold mb-2" style={{ color: CITADELLE_COLORS.blue }}>Aucune annonce pour le moment</h2>
            <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
              {q || type || budget ? "Essayez d'élargir vos critères de recherche" : "Soyez le premier à publier un actif numérique"}
            </p>
            <Link to="/citadelle/inscription" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              Publier une annonce
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
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
          </>
        )}
      </div>
    </CitadelleLayout>
  );
}
