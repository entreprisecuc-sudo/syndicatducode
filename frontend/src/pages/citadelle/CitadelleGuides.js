/**
 * Le Guide de La Citadelle — page dédiée (collection premium numérotée)
 * Identité visuelle propre et distincte des Chroniques :
 * émeraude profond + terracotta/cuivre, guides pratiques numérotés n°1, n°2…
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, Calendar, ChevronRight, GraduationCap, Clock } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { getListingImageUrl } from "@/config/citadelleConstants";

// Charte propre aux Guides (distincte du navy+or des Chroniques)
const GUIDE_COLORS = {
  night: "#0C3A2E",       // émeraude profond
  accent: "#E08A57",      // terracotta / cuivre
  accentSoft: "#EFA97B",
  heading: "#123A31",     // vert foncé (titres)
  textMuted: "#5F6672",
  border: "#E2E8E3",
  bg: "#F4F7F5",
};

const COVER = "https://static.prod-images.emergentagent.com/jobs/bb5bc88e-9c1e-46ed-99db-f8c3b00e681b/images/66002060c59ba2d51baa5b1675ce3a4b8daaa9f95e009d30d079e8865d119fe1.png";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

const guideNumber = (slug = "") => {
  const m = slug.match(/guide-la-citadelle-(\d+)-/);
  return m ? parseInt(m[1], 10) : 999;
};

export default function CitadelleGuides() {
  const [posts, setPosts] = useState([]);
  const [nextPost, setNextPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [listRes, nextRes] = await Promise.all([
          citadelleApi.get("/blog", { params: { category: "guide-la-citadelle", limit: 200 } }),
          citadelleApi.get("/blog/next-scheduled", { params: { category: "guide-la-citadelle" } }).catch(() => ({ data: { next: null } })),
        ]);
        const list = (listRes.data.posts || []).sort((a, b) => guideNumber(a.slug) - guideNumber(b.slug));
        setPosts(list);
        setNextPost(nextRes.data?.next || null);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <CitadelleLayout>
      <Helmet>
        <title>Le Guide de La Citadelle — Guides pratiques pour acheter et vendre des actifs numériques</title>
        <meta name="description" content="Les guides pratiques de La Citadelle : vendre, acheter, estimer, migrer et sécuriser un site, un SaaS ou une application. Des méthodes complètes, étape par étape, chaque samedi." />
        <link rel="canonical" href="https://lacitadellenumerique.fr/citadelle/guides" />
      </Helmet>

      {/* ── Hero éditorial émeraude ─────────────────────────────────────── */}
      <div style={{ background: GUIDE_COLORS.night, position: "relative", overflow: "hidden" }} data-testid="guides-hero">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-[1fr_auto] items-center gap-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: GUIDE_COLORS.accent }}>
              <GraduationCap size={16} /> Collection premium
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight"
              style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}>
              Le Guide de La Citadelle
            </h1>
            <p className="text-sm md:text-base mt-4 max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Des guides pratiques et complets pour maîtriser chaque étape de la vie d'un actif numérique :
              vendre, acheter, estimer, migrer, sécuriser. Un nouveau guide chaque samedi — une bibliothèque
              de référence qui s'enrichit au fil du temps.
            </p>
          </div>
          <div className="hidden md:block w-52 h-52 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border: `1px solid rgba(224,138,87,0.4)`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <img src={COVER} alt="Le Guide de La Citadelle" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── Encart « prochain guide à paraître » ────────────────────────── */}
      {nextPost && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 -mb-2" data-testid="guides-next-teaser">
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] rounded-2xl overflow-hidden"
            style={{ background: "white", border: `1px solid ${GUIDE_COLORS.accent}`, boxShadow: "0 10px 40px rgba(224,138,87,0.15)" }}>
            <div className="relative h-40 sm:h-full min-h-[140px] overflow-hidden" style={{ background: GUIDE_COLORS.night }}>
              <img src={getListingImageUrl(nextPost.cover_image_url) || COVER} alt={nextPost.title}
                className="w-full h-full object-cover opacity-90" loading="lazy" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ background: GUIDE_COLORS.accent, color: "white" }}>
                <Clock size={12} /> À paraître
              </span>
            </div>
            <div className="p-6 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: GUIDE_COLORS.accent }}>
                Prochain guide — n°{guideNumber(nextPost.slug)}
              </span>
              <h2 className="font-bold text-lg leading-snug mb-2 break-words"
                style={{ color: GUIDE_COLORS.heading, fontFamily: "'Montserrat', sans-serif", overflowWrap: "anywhere" }}
                data-testid="guides-next-title">
                {nextPost.title.replace(/^Le Guide de La Citadelle\s*:\s*/i, "")}
              </h2>
              {nextPost.excerpt && (
                <p className="text-sm leading-relaxed mb-3"
                  style={{ color: GUIDE_COLORS.textMuted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {nextPost.excerpt}
                </p>
              )}
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: GUIDE_COLORS.heading }} data-testid="guides-next-date">
                <Calendar size={14} style={{ color: GUIDE_COLORS.accent }} /> Parution le {formatDate(nextPost.scheduled_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Collection numérotée ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12" data-testid="guides-list">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: GUIDE_COLORS.bg }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center" data-testid="guides-empty">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: GUIDE_COLORS.accent, opacity: 0.4 }} />
            <p className="text-lg font-semibold" style={{ color: GUIDE_COLORS.heading }}>
              Le premier guide paraît très bientôt
            </p>
            <p className="text-sm mt-2" style={{ color: GUIDE_COLORS.textMuted }}>
              Revenez chaque samedi pour découvrir le nouveau guide de La Citadelle.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => {
              const num = guideNumber(post.slug);
              const shortTitle = post.title.replace(/^Le Guide de La Citadelle\s*:\s*/i, "");
              return (
                <Link
                  key={post.id}
                  to={`/citadelle/blog/${post.slug}`}
                  className="group grid grid-cols-1 sm:grid-cols-[180px_1fr] rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{ background: "white", border: `1px solid ${GUIDE_COLORS.border}` }}
                  data-testid={`guide-card-${num}`}
                >
                  {/* Couverture + numéro */}
                  <div className="relative h-40 sm:h-full min-h-[140px] overflow-hidden" style={{ background: GUIDE_COLORS.night }}>
                    <img src={getListingImageUrl(post.cover_image_url) || COVER} alt={post.title}
                      className="w-full h-full object-cover opacity-95" loading="lazy" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: GUIDE_COLORS.accent, color: "white" }}>
                      Guide n°{num}
                    </span>
                  </div>
                  {/* Contenu */}
                  <div className="p-6 flex flex-col">
                    <h2 className="font-bold text-lg leading-snug mb-2 break-words"
                      style={{ color: GUIDE_COLORS.heading, fontFamily: "'Montserrat', sans-serif", overflowWrap: "anywhere" }}>
                      {shortTitle}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm leading-relaxed mb-4"
                        style={{ color: GUIDE_COLORS.textMuted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="flex items-center gap-1 text-xs" style={{ color: GUIDE_COLORS.textMuted }}>
                        <Calendar size={12} /> {formatDate(post.published_at)}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold transition-colors group-hover:gap-2"
                        style={{ color: GUIDE_COLORS.accent }}>
                        Lire le guide <ChevronRight size={15} />
                      </span>
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
