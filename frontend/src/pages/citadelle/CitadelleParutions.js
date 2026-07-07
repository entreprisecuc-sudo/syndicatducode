/**
 * Les Parutions — La Citadelle Numérique
 * Page hub regroupant Le Blog, Le Guide de La Citadelle et Les Chroniques de La Garde.
 * Met en avant les 3 dernières parutions publiées de chaque rubrique + redirection + newsletter.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, Compass, Shield, ArrowRight, Calendar, User, Sparkles } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import NewsletterSection from "@/components/citadelle/NewsletterSection";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, getListingImageUrl } from "@/config/citadelleConstants";

const EMERALD = "#059669";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

// Configuration des 3 rubriques (DRY)
const RUBRIQUES = [
  {
    key: "blog", tag: "Article", title: "Le Blog", icon: BookOpen,
    subtitle: "Conseils pratiques et actualités pour acheter et vendre vos actifs numériques.",
    href: "/citadelle/blog", cta: "Voir tout le blog", variant: "light",
    params: { limit: 3 }, scheduledCategory: null,
  },
  {
    key: "guides", tag: "Guide", title: "Le Guide de La Citadelle", icon: Compass,
    subtitle: "Des guides experts et complets, étape par étape, pour maîtriser chaque sujet.",
    href: "/citadelle/guides", cta: "Voir tous les guides", variant: "emerald",
    params: { category: "guide-la-citadelle", limit: 3 }, scheduledCategory: "guide-la-citadelle",
  },
  {
    key: "chroniques", tag: "Chronique", title: "Les Chroniques de La Garde", icon: Shield,
    subtitle: "Analyses exclusives et regards d'expert signés La Garde.",
    href: "/citadelle/chroniques", cta: "Voir toutes les chroniques", variant: "dark",
    params: { category: "chroniques-la-garde", limit: 3 }, scheduledCategory: "chroniques-la-garde",
  },
];

const clamp = (lines) => ({
  display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden",
});

/** Carte d'une parution — s'adapte à la rubrique via `variant` */
function ParutionCard({ post, variant, tag }) {
  const dark = variant === "dark";
  const accent = variant === "emerald" ? EMERALD : CITADELLE_COLORS.gold;
  const titleColor = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const metaColor = dark ? "rgba(255,255,255,0.55)" : CITADELLE_COLORS.textMuted;
  return (
    <Link
      to={`/citadelle/blog/${post.slug}`}
      data-testid={`parution-card-${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: dark ? CITADELLE_COLORS.blue : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(201,164,92,0.22)" : CITADELLE_COLORS.border}`,
        boxShadow: dark ? "none" : "0 10px 30px rgba(15,39,71,0.06)",
        backdropFilter: dark ? "blur(6px)" : "none",
      }}
    >
      <div className="overflow-hidden" style={{ aspectRatio: "16 / 10", background: CITADELLE_COLORS.bg }}>
        {post.cover_image_url && (
          <img
            src={getListingImageUrl(post.cover_image_url)} alt={post.title} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col gap-2 p-5 flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{tag}</span>
        <h3 className="text-base md:text-lg font-bold leading-snug" style={{ color: titleColor, fontFamily: "'Montserrat', sans-serif", ...clamp(2) }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm leading-relaxed" style={{ color: metaColor, ...clamp(2) }}>{post.excerpt}</p>
        )}
        <div className="flex items-center gap-4 mt-auto pt-2 text-xs" style={{ color: metaColor }}>
          {post.published_at && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.published_at)}</span>}
          {post.author_name && <span className="flex items-center gap-1"><User size={12} /> {post.author_name}</span>}
        </div>
      </div>
    </Link>
  );
}

/** État vide gracieux : teaser de la prochaine parution programmée */
function EmptyTeaser({ next, variant }) {
  const dark = variant === "dark";
  const accent = variant === "emerald" ? EMERALD : CITADELLE_COLORS.gold;
  const titleColor = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const metaColor = dark ? "rgba(255,255,255,0.6)" : CITADELLE_COLORS.textMuted;
  return (
    <div
      className="md:col-span-3 flex flex-col items-center text-center rounded-2xl p-10"
      style={{
        background: dark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
        border: `1px dashed ${dark ? "rgba(201,164,92,0.4)" : accent}`,
      }}
      data-testid={`empty-state-${variant}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
        style={{ background: dark ? "rgba(201,164,92,0.12)" : `${accent}14` }}>
        <Sparkles size={22} style={{ color: accent }} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>
        Prochaine parution à venir
      </p>
      {next ? (
        <>
          <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: titleColor, fontFamily: "'Montserrat', sans-serif", ...clamp(2) }}>
            {next.title}
          </h3>
          <p className="flex items-center gap-2 text-sm" style={{ color: metaColor }}>
            <Calendar size={14} style={{ color: accent }} /> Parution le {formatDate(next.scheduled_at)}
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: metaColor }}>De nouvelles publications arrivent très bientôt. Revenez vite !</p>
      )}
    </div>
  );
}

/** Une section de rubrique */
function RubriqueSection({ rubrique, posts, next }) {
  const { variant, icon: Icon, title, subtitle, href, cta, tag } = rubrique;
  const dark = variant === "dark";
  const accent = variant === "emerald" ? EMERALD : CITADELLE_COLORS.gold;
  const sectionBg = variant === "light" ? CITADELLE_COLORS.bg : variant === "emerald" ? "#FFFFFF" : CITADELLE_COLORS.night;
  const headingColor = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const subColor = dark ? "rgba(255,255,255,0.6)" : CITADELLE_COLORS.textMuted;

  const ctaStyle =
    variant === "light"
      ? { background: "transparent", color: CITADELLE_COLORS.blue, border: `1px solid ${CITADELLE_COLORS.blue}` }
      : variant === "emerald"
      ? { background: EMERALD, color: "#FFFFFF" }
      : { background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night };

  return (
    <section className="py-16 md:py-24" style={{ background: sectionBg }} data-testid={`section-${rubrique.key}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* En-tête de section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
              style={{ background: dark ? "rgba(201,164,92,0.14)" : `${accent}14`, border: `1px solid ${accent}33` }}>
              <Icon size={24} style={{ color: accent }} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: headingColor, fontFamily: "'Montserrat', sans-serif" }}>
                {title}
              </h2>
              <p className="text-sm md:text-base mt-1 max-w-xl" style={{ color: subColor }}>{subtitle}</p>
            </div>
          </div>
          <Link
            to={href}
            data-testid={`see-all-${rubrique.key}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all hover:scale-105"
            style={ctaStyle}
          >
            {cta} <ArrowRight size={15} />
          </Link>
        </div>

        {/* Grille des parutions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.length > 0
            ? posts.map((p) => <ParutionCard key={p.slug} post={p} variant={variant} tag={tag} />)
            : <EmptyTeaser next={next} variant={variant} />}
        </div>
      </div>
    </section>
  );
}

export default function CitadelleParutions() {
  const [state, setState] = useState({}); // { blog: {posts, next}, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = {};
      await Promise.all(
        RUBRIQUES.map(async (r) => {
          const [listRes, nextRes] = await Promise.all([
            citadelleApi.get("/blog", { params: r.params }).catch(() => ({ data: { posts: [] } })),
            r.scheduledCategory
              ? citadelleApi.get("/blog/next-scheduled", { params: { category: r.scheduledCategory } }).catch(() => ({ data: { next: null } }))
              : Promise.resolve({ data: { next: null } }),
          ]);
          result[r.key] = { posts: listRes.data.posts || [], next: nextRes.data.next || null };
        })
      );
      setState(result);
      setLoading(false);
    })();
  }, []);

  return (
    <CitadelleLayout>
      <Helmet>
        <title>Les Parutions | La Citadelle Numérique</title>
        <meta name="description" content="Le Blog, Le Guide de La Citadelle et Les Chroniques de La Garde : retrouvez les dernières parutions pour acheter et vendre vos actifs numériques en toute confiance." />
      </Helmet>

      {/* Hero */}
      <section className="pt-20 pb-12 md:pt-28 md:pb-16" style={{ background: CITADELLE_COLORS.bg }} data-testid="parutions-hero-section">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="w-24 h-1 rounded-full mb-6" style={{ background: CITADELLE_COLORS.gold }} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight" style={{ color: CITADELLE_COLORS.night, fontFamily: "'Montserrat', sans-serif" }}>
            Les Parutions
          </h1>
          <p className="text-base md:text-lg mt-4 max-w-2xl" style={{ color: CITADELLE_COLORS.textMuted }}>
            Explorez nos articles, guides experts et chroniques exclusives de La Garde — tout ce qu'il faut savoir pour acheter, vendre et valoriser vos actifs numériques.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="py-24 text-center" data-testid="parutions-loading">
          <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: `${CITADELLE_COLORS.gold}30`, borderTopColor: CITADELLE_COLORS.gold }} />
        </div>
      ) : (
        RUBRIQUES.map((r) => (
          <RubriqueSection key={r.key} rubrique={r} posts={state[r.key]?.posts || []} next={state[r.key]?.next || null} />
        ))
      )}

      <NewsletterSection />
    </CitadelleLayout>
  );
}
