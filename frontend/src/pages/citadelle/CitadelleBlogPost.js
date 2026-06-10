/**
 * Article de blog — La Citadelle Numérique
 * Lecture d'un article au format Markdown avec react-markdown
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, User, ExternalLink, BookOpen } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, BLOG_CATEGORIES, getListingImageUrl } from "@/config/citadelleConstants";

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

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

  const categoryLabel = BLOG_CATEGORIES.find(c => c.slug === post.category)?.label || post.category;

  return (
    <CitadelleLayout pageTitle={post.title}>
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-12" data-testid="blog-post-article">

        {/* Retour */}
        <Link to="/citadelle/blog"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:opacity-80 transition-opacity"
          style={{ color: CITADELLE_COLORS.textMuted }}>
          <ArrowLeft size={14} /> Retour au blog
        </Link>

        {/* Image de couverture */}
        {post.cover_image_url && (
          <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
            <img
              src={getListingImageUrl(post.cover_image_url)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
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
        </div>

        {/* Contenu Markdown */}
        <div className="blog-content" data-testid="blog-post-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content_md}
          </ReactMarkdown>
        </div>

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
