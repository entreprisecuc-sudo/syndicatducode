/**
 * Les Parutions — La Citadelle Numérique
 * Hub éditorial : carrousel des derniers articles (Blog) en haut,
 * puis 2 colonnes — Le Guide de La Citadelle (gauche) & Les Chroniques de La Garde (droite).
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  BookOpen, Compass, Shield, ArrowRight, Calendar, Sparkles, ChevronLeft, ChevronRight,
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import NewsletterSection from "@/components/citadelle/NewsletterSection";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, getListingImageUrl } from "@/config/citadelleConstants";

const EMERALD = "#059669";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

const clamp = (lines) => ({
  display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden",
});

/** Carrousel des derniers articles du blog */
function ArticlesCarousel({ posts }) {
  const [idx, setIdx] = useState(0);
  const n = posts.length;

  useEffect(() => {
    if (n <= 1) return undefined;
    const timer = setInterval(() => setIdx((p) => (p + 1) % n), 6000);
    return () => clearInterval(timer);
  }, [n]);

  if (!n) return null;
  const go = (d) => setIdx((p) => (p + d + n) % n);

  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 20px 50px rgba(15,39,71,0.10)" }}
      data-testid="parutions-carousel">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {posts.map((post) => (
          <Link key={post.slug} to={`/citadelle/blog/${post.slug}`}
            className="group w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2"
            data-testid={`carousel-slide-${post.slug}`}>
            <div className="overflow-hidden" style={{ aspectRatio: "16 / 10", background: CITADELLE_COLORS.bg }}>
              {post.cover_image_url && (
                <img src={getListingImageUrl(post.cover_image_url)} alt={post.title} loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 p-8 md:p-12" style={{ background: CITADELLE_COLORS.blue }}>
              <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: CITADELLE_COLORS.gold }}>
                Article
              </span>
              <h3 className="text-xl md:text-2xl font-bold leading-snug"
                style={{ color: "#FFFFFF", fontFamily: "'Montserrat', sans-serif", ...clamp(3) }}>
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", ...clamp(1) }}>{post.excerpt}</p>
              )}
              <span className="flex items-center gap-2 text-sm font-semibold mt-2" style={{ color: CITADELLE_COLORS.goldLight }}>
                Lire l'article <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Flèches */}
      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Précédent" data-testid="carousel-prev"
            className="absolute left-3 top-[28%] md:top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <ChevronLeft size={20} style={{ color: CITADELLE_COLORS.blue }} />
          </button>
          <button onClick={() => go(1)} aria-label="Suivant" data-testid="carousel-next"
            className="absolute right-3 top-[28%] md:top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <ChevronRight size={20} style={{ color: CITADELLE_COLORS.blue }} />
          </button>
          {/* Points */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {posts.map((p, i) => (
              <button key={p.slug} onClick={() => setIdx(i)} aria-label={`Aller à l'article ${i + 1}`}
                data-testid={`carousel-dot-${i}`}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 22 : 8, height: 8,
                  background: i === idx ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.5)",
                }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Colonne d'une rubrique (Guide / Chronique) avec sa dernière parution */
function RubriqueColumn({ variant, icon: Icon, title, href, cta, tag, item, isTeaser }) {
  const dark = variant === "dark";
  const accent = variant === "emerald" ? EMERALD : CITADELLE_COLORS.gold;
  const bg = dark ? CITADELLE_COLORS.night : "#FFFFFF";
  const cardBg = dark ? CITADELLE_COLORS.blue : "#FFFFFF";
  const headingColor = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const titleColor = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const metaColor = dark ? "rgba(255,255,255,0.6)" : CITADELLE_COLORS.textMuted;
  const border = dark ? "rgba(201,164,92,0.22)" : CITADELLE_COLORS.border;

  return (
    <div className="rounded-3xl p-6 md:p-8 flex flex-col" style={{ background: bg, border: `1px solid ${border}` }}
      data-testid={`column-${variant === "emerald" ? "guides" : "chroniques"}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: dark ? "rgba(201,164,92,0.14)" : `${accent}14`, border: `1px solid ${accent}33` }}>
            <Icon size={20} style={{ color: accent }} />
          </div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: headingColor, fontFamily: "'Montserrat', sans-serif" }}>
            {title}
          </h2>
        </div>
        <Link to={href} data-testid={`see-all-${variant === "emerald" ? "guides" : "chroniques"}`}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap transition-all hover:gap-2"
          style={{ color: accent }}>
          {cta} <ArrowRight size={14} />
        </Link>
      </div>

      {/* Dernière parution */}
      {item ? (
        <Link to={isTeaser ? href : `/citadelle/blog/${item.slug}`}
          className="group flex flex-col rounded-2xl overflow-hidden flex-1"
          style={{ background: cardBg, border: `1px solid ${border}` }}
          data-testid={`latest-${variant === "emerald" ? "guide" : "chronique"}`}>
          <div className="overflow-hidden" style={{ aspectRatio: "16 / 9", background: CITADELLE_COLORS.bg }}>
            {item.cover_image_url && (
              <img src={getListingImageUrl(item.cover_image_url)} alt={item.title} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
          </div>
          <div className="flex flex-col gap-2 p-5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
              {isTeaser ? "Prochaine parution" : tag}
            </span>
            <h3 className="text-base md:text-lg font-bold leading-snug"
              style={{ color: titleColor, fontFamily: "'Montserrat', sans-serif", ...clamp(2) }}>
              {item.title}
            </h3>
            {item.excerpt && (
              <p className="text-sm" style={{ color: metaColor, ...clamp(1) }}>{item.excerpt}</p>
            )}
            <span className="flex items-center gap-1.5 text-xs mt-1" style={{ color: metaColor }}>
              <Calendar size={12} style={{ color: accent }} />
              {isTeaser ? `Parution le ${formatDate(item.scheduled_at)}` : formatDate(item.published_at)}
            </span>
          </div>
        </Link>
      ) : (
        <div className="flex flex-col items-center justify-center text-center rounded-2xl p-8 flex-1"
          style={{ border: `1px dashed ${accent}` }} data-testid={`empty-${variant}`}>
          <Sparkles size={22} style={{ color: accent }} className="mb-3" />
          <p className="text-sm" style={{ color: metaColor }}>De nouvelles publications arrivent bientôt.</p>
        </div>
      )}

      {/* CTA mobile */}
      <Link to={href} className="sm:hidden inline-flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl font-bold text-sm"
        style={variant === "emerald" ? { background: EMERALD, color: "#fff" } : { background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function CitadelleParutions() {
  const [data, setData] = useState({ blog: [], guides: null, guidesNext: null, chroniques: null, chroniquesNext: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const safe = (p) => p.catch(() => ({ data: {} }));
      const [blogR, guidesR, guidesN, chroR, chroN] = await Promise.all([
        safe(citadelleApi.get("/blog", { params: { limit: 6 } })),
        safe(citadelleApi.get("/blog", { params: { category: "guide-la-citadelle", limit: 1 } })),
        safe(citadelleApi.get("/blog/next-scheduled", { params: { category: "guide-la-citadelle" } })),
        safe(citadelleApi.get("/blog", { params: { category: "chroniques-la-garde", limit: 1 } })),
        safe(citadelleApi.get("/blog/next-scheduled", { params: { category: "chroniques-la-garde" } })),
      ]);
      setData({
        blog: blogR.data.posts || [],
        guides: (guidesR.data.posts || [])[0] || null,
        guidesNext: guidesN.data.next || null,
        chroniques: (chroR.data.posts || [])[0] || null,
        chroniquesNext: chroN.data.next || null,
      });
      setLoading(false);
    })();
  }, []);

  const guideItem = data.guides || data.guidesNext;
  const chroItem = data.chroniques || data.chroniquesNext;

  return (
    <CitadelleLayout>
      <Helmet>
        <title>Les Parutions | La Citadelle Numérique</title>
        <meta name="description" content="Les dernières publications de La Citadelle Numérique : articles, guides et chroniques consacrés aux actifs numériques, à leur valorisation, leur acquisition et leur transmission." />
      </Helmet>

      <div style={{ background: CITADELLE_COLORS.bg }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-16 md:pb-24">
          {/* Eyebrow + accès blog */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-1 rounded-full" style={{ background: CITADELLE_COLORS.gold }} />
              <span className="text-sm font-semibold uppercase tracking-[0.15em]" style={{ color: CITADELLE_COLORS.gold }}>
                Les Parutions
              </span>
            </div>
            <Link to="/citadelle/blog" data-testid="see-all-blog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.blue, color: "#FFFFFF" }}>
              <BookOpen size={15} /> <span className="hidden sm:inline">Voir tous les articles</span><span className="sm:hidden">Articles</span> <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="py-24 text-center" data-testid="parutions-loading">
              <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: `${CITADELLE_COLORS.gold}30`, borderTopColor: CITADELLE_COLORS.gold }} />
            </div>
          ) : (
            <>
              {/* Carrousel des derniers articles */}
              <ArticlesCarousel posts={data.blog} />

              {/* Titre léger */}
              <p className="text-center max-w-3xl mx-auto my-12 md:my-16 text-sm md:text-base leading-relaxed"
                style={{ color: CITADELLE_COLORS.textMuted }} data-testid="parutions-intro">
                Retrouvez les dernières publications de La Citadelle Numérique : articles, guides et chroniques
                consacrés aux actifs numériques, à leur valorisation, leur acquisition et leur transmission.
              </p>

              {/* 2 colonnes : Guides (gauche) — Chroniques (droite) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RubriqueColumn
                  variant="emerald" icon={Compass} title="Le Guide de La Citadelle"
                  href="/citadelle/guides" cta="Voir tous les guides" tag="Guide"
                  item={guideItem} isTeaser={!data.guides && !!data.guidesNext}
                />
                <RubriqueColumn
                  variant="dark" icon={Shield} title="Les Chroniques de La Garde"
                  href="/citadelle/chroniques" cta="Voir toutes les chroniques" tag="Chronique"
                  item={chroItem} isTeaser={!data.chroniques && !!data.chroniquesNext}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <NewsletterSection />
    </CitadelleLayout>
  );
}
