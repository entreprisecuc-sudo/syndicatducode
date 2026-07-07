/**
 * Les Chroniques de La Garde — page dédiée (collection premium numérotée)
 * Distincte du blog général : identité visuelle propre (navy éditorial + or),
 * couverture commune, articles numérotés n°1, n°2…
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ScrollText, Calendar, ChevronRight, ShieldCheck } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, getListingImageUrl } from "@/config/citadelleConstants";

const COVER = "https://static.prod-images.emergentagent.com/jobs/bb5bc88e-9c1e-46ed-99db-f8c3b00e681b/images/a3715841dcdcf63556e7291c96bfed68897dde1bcdc4d9117c9150c2fe3c386e.png";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

const chroniqueNumber = (slug = "") => {
  const m = slug.match(/chroniques-la-garde-(\d+)-/);
  return m ? parseInt(m[1], 10) : 999;
};

export default function CitadelleChroniques() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await citadelleApi.get("/blog", { params: { category: "chroniques-la-garde", limit: 200 } });
        const list = (res.data.posts || []).sort((a, b) => chroniqueNumber(a.slug) - chroniqueNumber(b.slug));
        setPosts(list);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <CitadelleLayout pageTitle="Les Chroniques de La Garde">
      <Helmet>
        <title>Les Chroniques de La Garde — Analyses d'experts sur les actifs numériques | La Citadelle Numérique</title>
        <meta name="description" content="La rubrique premium de La Garde : analyses d'experts, retours d'expérience et conseils sur l'achat, la vente et la transmission d'actifs numériques. Une nouvelle chronique chaque jeudi." />
        <link rel="canonical" href="https://lacitadellenumerique.fr/citadelle/chroniques" />
      </Helmet>

      {/* ── Hero éditorial navy ─────────────────────────────────────────── */}
      <div style={{ background: CITADELLE_COLORS.night || "#0B1D36", position: "relative", overflow: "hidden" }} data-testid="chroniques-hero">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-[1fr_auto] items-center gap-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: CITADELLE_COLORS.gold }}>
              <ShieldCheck size={15} /> Rubrique premium
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight"
              style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}>
              Les Chroniques de La Garde
            </h1>
            <p className="text-sm md:text-base mt-4 max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
              Analyses d'experts, retours d'expérience et conseils issus de l'observation du marché des actifs
              numériques. Une nouvelle chronique chaque jeudi — une bibliothèque de référence qui s'enrichit au fil du temps.
            </p>
          </div>
          <div className="hidden md:block w-52 h-52 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border: `1px solid rgba(201,164,92,0.35)`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <img src={COVER} alt="Les Chroniques de La Garde" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── Collection numérotée ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12" data-testid="chroniques-list">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center" data-testid="chroniques-empty">
            <ScrollText size={48} className="mx-auto mb-4" style={{ color: CITADELLE_COLORS.gold, opacity: 0.35 }} />
            <p className="text-lg font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
              La première chronique paraît très bientôt
            </p>
            <p className="text-sm mt-2" style={{ color: CITADELLE_COLORS.textMuted }}>
              Revenez chaque jeudi pour découvrir la nouvelle analyse de La Garde.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => {
              const num = chroniqueNumber(post.slug);
              const shortTitle = post.title.replace(/^Les Chroniques de La Garde\s*:\s*/i, "");
              return (
                <Link
                  key={post.id}
                  to={`/citadelle/blog/${post.slug}`}
                  className="group grid grid-cols-1 sm:grid-cols-[180px_1fr] rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`chronique-card-${num}`}
                >
                  {/* Couverture + numéro */}
                  <div className="relative h-40 sm:h-full min-h-[140px] overflow-hidden" style={{ background: CITADELLE_COLORS.night || "#0B1D36" }}>
                    <img src={getListingImageUrl(post.cover_image_url) || COVER} alt={post.title}
                      className="w-full h-full object-cover opacity-90" loading="lazy" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night || "#0B1D36" }}>
                      Chronique n°{num}
                    </span>
                  </div>
                  {/* Contenu */}
                  <div className="p-6 flex flex-col">
                    <h2 className="font-bold text-lg leading-snug mb-2 break-words"
                      style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif", overflowWrap: "anywhere" }}>
                      {shortTitle}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm leading-relaxed mb-4"
                        style={{ color: CITADELLE_COLORS.textMuted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="flex items-center gap-1 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        <Calendar size={12} /> {formatDate(post.published_at)}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold transition-colors group-hover:gap-2"
                        style={{ color: CITADELLE_COLORS.gold }}>
                        Lire <ChevronRight size={15} />
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
