/**
 * Blog — La Citadelle Numérique
 * Liste publique des articles avec filtrage par catégorie et recherche plein texte
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, ChevronRight, Calendar, User, Search, X } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, BLOG_CATEGORIES, getListingImageUrl } from "@/config/citadelleConstants";

const CATEGORY_ALL = { slug: "", label: "Tous" };

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

/** Surligne les occurrences d'un terme dans un texte */
function Highlight({ text = "", query = "" }) {
  if (!query.trim() || !text) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: "rgba(201,164,92,0.3)", color: CITADELLE_COLORS.blue, borderRadius: 2, padding: "0 1px" }}>{part}</mark>
          : part
      )}
    </>
  );
}

export default function CitadelleBlog() {
  const [allPosts, setAllPosts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const inputRef = useRef(null);

  // Chargement unique de tous les articles
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await citadelleApi.get("/blog", { params: { limit: 200 } });
        setAllPosts(res.data.posts || []);
      } catch {
        setAllPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrage côté client : catégorie + recherche
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPosts.filter(p => {
      const matchCat = !activeCategory || p.category === activeCategory;
      if (!q) return matchCat;
      const haystack = `${p.title} ${p.excerpt || ""} ${p.category || ""}`.toLowerCase();
      return matchCat && haystack.includes(q);
    });
  }, [allPosts, activeCategory, searchQuery]);

  const allCategories = [CATEGORY_ALL, ...BLOG_CATEGORIES];
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <CitadelleLayout pageTitle="Blog">
      <Helmet>
        <title>Blog — Achat, vente et valorisation d'actifs numériques | La Citadelle Numérique</title>
        <meta name="description" content="Conseils, analyses et guides sur l'achat et la vente de sites web, SaaS, boutiques e-commerce. Retrouvez nos articles experts pour maximiser la valeur de vos actifs numériques." />
        <meta property="og:title" content="Blog La Citadelle Numérique | Actifs numériques & marketplace" />
        <meta property="og:description" content="Guides, conseils et analyses pour acheter et vendre des actifs numériques. Plus de 56 articles experts." />
        <link rel="canonical" href="https://lacitadellenumerique.fr/citadelle/blog" />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12" data-testid="citadelle-blog">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            Blog
          </h1>
          <p className="text-sm mt-3 max-w-xl" style={{ color: CITADELLE_COLORS.textMuted }}>
            Actualités, conseils et analyses sur le marché des actifs numériques.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6" data-testid="blog-search-wrapper">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{
              background: "white",
              border: `1.5px solid ${hasSearch ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
              boxShadow: hasSearch ? "0 0 0 3px rgba(201,164,92,0.12)" : "none",
            }}
          >
            <Search size={16} style={{ color: hasSearch ? CITADELLE_COLORS.gold : CITADELLE_COLORS.textMuted, flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article, un sujet, un mot-clé…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: CITADELLE_COLORS.blue }}
              data-testid="blog-search-input"
              aria-label="Rechercher dans le blog"
            />
            {hasSearch && (
              <button
                onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                className="p-0.5 rounded-full transition-opacity hover:opacity-70"
                style={{ color: CITADELLE_COLORS.textMuted }}
                data-testid="blog-search-clear"
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Compteur de résultats */}
          {!loading && hasSearch && (
            <p className="absolute -bottom-5 left-1 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              {filtered.length === 0
                ? "Aucun résultat"
                : `${filtered.length} article${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {/* Filtres catégories */}
        <div className="flex flex-wrap gap-2 mb-8 mt-8" data-testid="blog-categories">
          {allCategories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeCategory === cat.slug ? CITADELLE_COLORS.gold : "transparent",
                color: activeCategory === cat.slug ? CITADELLE_COLORS.night : CITADELLE_COLORS.textMuted,
                border: `1px solid ${activeCategory === cat.slug ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
              }}
              data-testid={`blog-filter-${cat.slug || "all"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Search size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.2 }} />
            <p className="text-lg font-semibold" style={{ color: CITADELLE_COLORS.textMuted }}>
              {hasSearch ? `Aucun article pour « ${searchQuery} »` : "Aucun article pour le moment"}
            </p>
            {hasSearch && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm underline"
                style={{ color: CITADELLE_COLORS.gold }}
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(post => {
              const catLabel = BLOG_CATEGORIES.find(c => c.slug === post.category)?.label || post.category;
              return (
                <Link
                  key={post.id}
                  to={`/citadelle/blog/${post.slug}`}
                  className="block rounded-2xl transition-all hover:-translate-y-1 overflow-hidden"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`blog-post-card-${post.id}`}
                >
                  {/* Image de couverture */}
                  {post.cover_image_url && (
                    <div className="w-full h-44 overflow-hidden">
                      <img
                        src={getListingImageUrl(post.cover_image_url)}
                        alt={post.cover_image_alt || post.seo_title || post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Catégorie */}
                    {post.category && (
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block"
                        style={{ background: "rgba(201,164,92,0.12)", color: CITADELLE_COLORS.gold }}>
                        {catLabel}
                      </span>
                    )}

                    {/* Titre avec surlignage */}
                    <h2 className="font-bold text-lg leading-snug mb-2"
                      style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                      <Highlight text={post.title} query={searchQuery} />
                    </h2>

                    {/* Extrait avec surlignage */}
                    {post.excerpt && (
                      <p className="text-sm leading-relaxed mb-4"
                        style={{ color: CITADELLE_COLORS.textMuted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        <Highlight text={post.excerpt} query={searchQuery} />
                      </p>
                    )}

                    {/* Méta */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-3 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        <span className="flex items-center gap-1"><User size={11} />{post.author_name}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.published_at)}</span>
                      </div>
                      <ChevronRight size={16} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}

