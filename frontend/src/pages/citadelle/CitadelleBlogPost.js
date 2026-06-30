/**
 * Article de blog — La Citadelle Numérique
 * Lecture d'un article au format Markdown avec react-markdown
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Calendar, User, ExternalLink, BookOpen, Eye } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, BLOG_CATEGORIES, getListingImageUrl } from "@/config/citadelleConstants";

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const getCategoryLabel = (slug) =>
  BLOG_CATEGORIES.find(c => c.slug === slug)?.label || slug;

// Injection des balises meta SEO (nettoyées au démontage du composant)
function useSeoMeta(post) {
  useEffect(() => {
    if (!post) return;
    const title = post.seo_title || post.title;
    const desc = post.seo_description || post.excerpt || "";
    document.title = `${title} — La Citadelle Numérique`;

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setOg = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    setMeta("description", desc);
    setOg("og:title", title);
    setOg("og:description", desc);
    if (post.cover_image_url) setOg("og:image", getListingImageUrl(post.cover_image_url));

    return () => {
      document.title = "La Citadelle Numérique";
    };
  }, [post]);
}

// ── Carte article lié ──────────────────────────────────────────────────────────
function RelatedCard({ post }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={`/citadelle/blog/${post.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="related-article-card"
      style={{
        display: "block",
        background: hovered ? "rgba(15,39,71,0.06)" : "white",
        border: `1px solid ${hovered ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`,
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        transition: "border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(201,164,92,0.12)" : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Image de couverture ou placeholder */}
      <div style={{ height: 140, background: `linear-gradient(135deg, ${CITADELLE_COLORS.blue} 0%, #1a3a6b 100%)`, position: "relative", overflow: "hidden" }}>
        {post.cover_image_url
          ? <img src={getListingImageUrl(post.cover_image_url)} alt={post.cover_image_alt || post.seo_title || post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={36} style={{ color: "rgba(201,164,92,0.35)" }} />
            </div>
        }
        {/* Badge catégorie */}
        <span style={{
          position: "absolute", top: 10, left: 12,
          background: "rgba(201,164,92,0.9)", color: CITADELLE_COLORS.blue,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", padding: "3px 10px", borderRadius: 20,
        }}>
          {getCategoryLabel(post.category)}
        </span>
      </div>

      {/* Contenu */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, lineHeight: 1.4,
          color: CITADELLE_COLORS.blue, margin: "0 0 8px",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{
            fontSize: 12, color: CITADELLE_COLORS.textMuted, margin: "0 0 12px",
            lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {post.excerpt}
          </p>
        )}
        <span style={{
          fontSize: 12, fontWeight: 600, color: CITADELLE_COLORS.gold,
          display: "inline-flex", alignItems: "center", gap: 4,
          transition: "gap 0.2s",
        }}>
          Lire l'article <ArrowRight size={12} style={{ transition: "transform 0.2s", transform: hovered ? "translateX(3px)" : "none" }} />
        </span>
      </div>
    </Link>
  );
}

// ── Section articles liés ──────────────────────────────────────────────────────
function RelatedArticles({ slug }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!slug) return;
    citadelleApi.get(`/blog/${slug}/related`)
      .then(res => setRelated(res.data?.related || []))
      .catch(() => {});
  }, [slug]);

  if (related.length === 0) return null;

  return (
    <section data-testid="related-articles-section" style={{ marginTop: 56 }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h2 style={{
          fontSize: 18, fontWeight: 800, color: CITADELLE_COLORS.blue,
          margin: 0, whiteSpace: "nowrap",
          fontFamily: "'Montserrat', sans-serif",
        }}>
          Articles liés
        </h2>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${CITADELLE_COLORS.gold}55, transparent)` }} />
      </div>

      {/* Grille */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 20,
      }}>
        {related.map(p => <RelatedCard key={p.id || p.slug} post={p} />)}
      </div>
    </section>
  );
}

export default function CitadelleBlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    citadelleApi.get(`/blog/${slug}`)
      .then(res => setPost(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useSeoMeta(post);

  if (loading) {
    return (
      <CitadelleLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
          {[240, 180, 200].map((w, i) => (
            <div key={i} className="h-5 rounded animate-pulse" style={{ background: CITADELLE_COLORS.bg, maxWidth: w }} />
          ))}
        </div>
      </CitadelleLayout>
    );
  }

  if (notFound || !post) {
    return (
      <CitadelleLayout pageTitle="Article introuvable">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <BookOpen size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.2 }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: CITADELLE_COLORS.blue }}>Article introuvable</h1>
          <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
            Cet article n'existe pas ou a été supprimé.
          </p>
          <Link to="/citadelle/blog" className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.gold }}>
            ← Retour au blog
          </Link>
        </div>
      </CitadelleLayout>
    );
  }

  const categoryLabel = getCategoryLabel(post.category);

  return (
    <CitadelleLayout pageTitle={post.title}>
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-12" data-testid="blog-post-article">

        {/* Retour */}
        <Link to="/citadelle/blog"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:opacity-80 transition-opacity"
          style={{ color: CITADELLE_COLORS.textMuted }}>
          <ArrowLeft size={14} /> Retour au blog
        </Link>

        {/* Image de couverture avec figcaption SEO/AEO */}
        {post.cover_image_url && (
          <figure className="w-full rounded-2xl overflow-hidden mb-8" style={{ margin: 0 }}>
            <img
              src={getListingImageUrl(post.cover_image_url)}
              alt={post.cover_image_alt || post.seo_title || post.title}
              className="w-full h-64 md:h-80 object-cover"
              loading="lazy"
              width="1200"
              height="480"
            />
            {post.cover_image_alt && (
              <figcaption
                className="px-4 py-2 text-xs text-center"
                style={{ color: CITADELLE_COLORS.textMuted, background: "rgba(15,39,71,0.03)", borderTop: `1px solid ${CITADELLE_COLORS.border}` }}
              >
                {post.cover_image_alt}
              </figcaption>
            )}
          </figure>
        )}

        {/* Catégorie */}
        {post.category && (
          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block"
            style={{ background: "rgba(201,164,92,0.12)", color: CITADELLE_COLORS.gold }}>
            {categoryLabel}
          </span>
        )}

        {/* Titre */}
        <h1 className="text-2xl md:text-4xl font-black leading-tight mb-5"
          style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
          {post.title}
        </h1>

        {/* Méta auteur / date / partenaire */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6"
          style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
          <span className="flex items-center gap-2 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            <User size={14} /> {post.author_name}
          </span>
          <span className="flex items-center gap-2 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            <Calendar size={14} /> {formatDate(post.published_at)}
          </span>
          {post.partner_link && (
            <a href={post.partner_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: CITADELLE_COLORS.gold }}>
              <ExternalLink size={13} /> Article partenaire
            </a>
          )}
          {post.view_count > 0 && (
            <span className="flex items-center gap-1.5 text-sm ml-auto" style={{ color: CITADELLE_COLORS.textMuted }}>
              <Eye size={13} /> {post.view_count} lecture{post.view_count > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Contenu Markdown */}
        <div className="blog-content" data-testid="blog-post-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content_md}
          </ReactMarkdown>
        </div>

        {/* Articles liés */}
        <RelatedArticles slug={slug} />

        {/* Retour bas de page */}
        <div className="mt-12 pt-6" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
          <Link to="/citadelle/blog"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: CITADELLE_COLORS.gold }}>
            <ArrowLeft size={14} /> Retour au blog
          </Link>
        </div>
      </article>
    </CitadelleLayout>
  );
}
