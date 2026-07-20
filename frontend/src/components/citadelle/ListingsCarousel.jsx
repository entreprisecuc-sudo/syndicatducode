/**
 * ListingsCarousel — La Citadelle Numérique
 * Carrousel des annonces « à la Une » (souscripteurs) + complément aléatoire.
 * Défilement automatique en boucle. Utilisé sur l'accueil (dark) et la liste (light).
 *
 * Props : variant = "dark" | "light", title, limit (def 8)
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Star, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, getListingImageUrl, isImageFile } from "@/config/citadelleConstants";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' fill='%230F2747'%3E%3Crect width='400' height='240'/%3E%3Ctext x='50%25' y='50%25' fill='%23C9A45C' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E🏰%3C/text%3E%3C/svg%3E";

export default function ListingsCarousel({ variant = "dark", title = "Dernières annonces", limit = 8 }) {
  const [listings, setListings] = useState([]);
  const ref = useRef(null);
  const dark = variant === "dark";

  useEffect(() => {
    citadelleApi.get("/listings/carousel", { params: { limit } })
      .then(res => setListings(res.data.listings || []))
      .catch(() => {});
  }, [limit]);

  // Défilement automatique en boucle
  useEffect(() => {
    if (listings.length <= 1) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + 240, behavior: "smooth" });
    }, 3500);
    return () => clearInterval(id);
  }, [listings]);

  if (!listings.length) return null;

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  const cardBg = dark ? "rgba(255,255,255,0.05)" : "#FFFFFF";
  const cardBorder = dark ? "rgba(201,164,92,0.18)" : CITADELLE_COLORS.border;
  const titleColor = dark ? "rgba(255,255,255,0.85)" : CITADELLE_COLORS.blue;
  const cardTitleColor = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const btnStyle = dark
    ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,164,92,0.25)", color: CITADELLE_COLORS.gold }
    : { background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue };

  return (
    <div className="mt-6" data-testid="listings-carousel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: CITADELLE_COLORS.gold }} />
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: titleColor }}>{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/citadelle/annonces" className="text-xs font-semibold transition-all hover:opacity-80" style={{ color: CITADELLE_COLORS.gold }}>
            Voir tout →
          </Link>
          <div className="hidden sm:flex gap-1.5 ml-1">
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Précédent"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={btnStyle} data-testid="carousel-prev"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Suivant"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={btnStyle} data-testid="carousel-next"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`[data-testid="listings-carousel"] > div::-webkit-scrollbar{display:none}`}</style>
        {listings.map((l) => {
          const img = l.images?.filter(Boolean).find(isImageFile);
          const cover = l.is_adult ? null : (img ? getListingImageUrl(img) : PLACEHOLDER);
          return (
            <Link key={l.id} to={`/citadelle/annonces/${l.slug}`}
              className="group flex-shrink-0 w-[220px] rounded-2xl overflow-hidden snap-start transition-all duration-200 hover:-translate-y-1"
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: dark ? "blur(8px)" : "none" }}
              data-testid={`carousel-card-${l.slug}`}>
              <div className="relative h-28 overflow-hidden" style={{ background: CITADELLE_COLORS.night }}>
                {l.is_adult ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1626,#2d1b2e)" }}>
                    <span className="text-xs font-black px-2 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", border: "1px solid #f87171" }}>18+</span>
                  </div>
                ) : (
                  <img src={cover} alt={l.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.target.src = PLACEHOLDER; }} />
                )}
                {l.is_featured && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}><Star size={9} /> Recommandé</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold line-clamp-1 mb-1" style={{ color: cardTitleColor, fontFamily: "'Montserrat', sans-serif" }}>{l.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black" style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>{l.price?.toLocaleString("fr-FR")} €</span>
                  {l.monthly_revenue != null && (
                    <span className="text-[10px] flex items-center gap-1" style={{ color: dark ? "rgba(255,255,255,0.45)" : CITADELLE_COLORS.textMuted }}>
                      <Eye size={10} /> {(l.views_count ?? 0)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
