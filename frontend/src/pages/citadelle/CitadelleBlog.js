/**
 * Blog — La Citadelle Numérique
 * Liste publique des articles avec filtrage par catégorie
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Calendar, User } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, BLOG_CATEGORIES, getListingImageUrl } from "@/config/citadelleConstants";

const CATEGORY_ALL = { slug: "", label: "Tous" };

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

export default function CitadelleBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory]);

  const fetchPosts = async (category) => {
    setLoading(true);
    try {
      const params = category ? { category } : {};
      const res = await citadelleApi.get("/blog", { params });
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const allCategories = [CATEGORY_ALL, ...BLOG_CATEGORIES];

  return (
    <CitadelleLayout pageTitle="Blog">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12" data-testid="citadelle-blog">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            Blog
          </h1>
          <p className="text-sm mt-3 max-w-xl" style={{ color: CITADELLE_COLORS.textMuted }}>
            Actualités, conseils et analyses sur le marché des actifs numériques.
          </p>
        </div>

        {/* Filtres catégories */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="blog-categories">
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
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.2 }} />
            <p className="text-lg font-semibold" style={{ color: CITADELLE_COLORS.textMuted }}>
              Aucun article pour le moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map(post => {
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

                    {/* Titre */}
                    <h2 className="font-bold text-lg leading-snug mb-2"
                      style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                      {post.title}
                    </h2>

                    {/* Extrait */}
                    {post.excerpt && (
                      <p className="text-sm leading-relaxed mb-4"
                        style={{ color: CITADELLE_COLORS.textMuted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt}
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
