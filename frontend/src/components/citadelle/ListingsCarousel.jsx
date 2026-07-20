/**
 * ListingsCarousel — La Citadelle Numérique
 * Carrousel des annonces « à la Une » (souscripteurs) + complément aléatoire.
 * Défilement automatique en boucle. Variantes dark (accueil) et light (liste).
 * Design premium navy + or (blueprint design_guidelines.json). Aucune pastille.
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ChevronLeft, ChevronRight, Eye, Castle } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { getListingImageUrl, isImageFile, CITADELLE_CONFIG } from "@/config/citadelleConstants";

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
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + 244, behavior: "smooth" });
    }, 3500);
    return () => clearInterval(id);
  }, [listings]);

  if (!listings.length) return null;

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * 244, behavior: "smooth" });

  const headTitle = dark ? "text-white/90" : "text-[#081729]";
  const arrowBtn = dark
    ? "w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300 backdrop-blur-md"
    : "w-9 h-9 rounded-full border border-[#0F2747]/10 flex items-center justify-center text-[#0F2747]/60 hover:bg-[#0F2747]/5 hover:text-[#0F2747] hover:border-[#0F2747]/20 transition-all duration-300";

  const cardClasses = dark
    ? "flex-none w-[220px] flex flex-col overflow-hidden group cursor-pointer rounded-xl bg-[#101F33]/90 backdrop-blur-xl border border-white/[0.06] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:border-[#C9A45C]/40 hover:shadow-[0_10px_34px_rgba(0,0,0,0.55)] hover:-translate-y-1.5"
    : "flex-none w-[220px] flex flex-col overflow-hidden group cursor-pointer rounded-xl bg-white border border-[#0F2747]/[0.07] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:border-[#C9A45C]/40 hover:shadow-[0_10px_30px_rgba(15,39,71,0.10)] hover:-translate-y-1.5";

  const titleCls = dark
    ? "text-white/80 group-hover:text-white transition-colors duration-300 truncate text-[13px] font-medium"
    : "text-[#081729] group-hover:text-[#0F2747] transition-colors duration-300 truncate text-[13px] font-medium";
  const priceCls = "text-[#C9A45C] text-[16px] font-semibold";
  const viewsCls = dark
    ? "text-white/40 group-hover:text-white/60 transition-colors duration-300 flex items-center gap-1.5 text-[11px] mt-2 pt-2 border-t border-white/[0.05]"
    : "text-[#0F2747]/40 group-hover:text-[#0F2747]/60 transition-colors duration-300 flex items-center gap-1.5 text-[11px] mt-2 pt-2 border-t border-[#0F2747]/[0.06]";

  const placeholderWrap = dark
    ? "bg-white flex items-center justify-center relative overflow-hidden h-full w-full"
    : "bg-gradient-to-br from-[#0F2747] to-[#081729] flex items-center justify-center relative overflow-hidden h-full w-full";
  const placeholderDots = "absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_center,_#C9A45C_1px,_transparent_1px)] bg-[size:12px_12px]";

  return (
    <div className="mt-6" data-testid="listings-carousel" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <TrendingUp size={16} className="text-[#C9A45C]" />
          <h2 className={`text-sm font-semibold uppercase tracking-[0.2em] ${headTitle}`}>{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/citadelle/annonces" className="text-sm text-[#C9A45C] hover:text-[#D9BB7A] transition-colors duration-300 flex items-center gap-1.5 font-medium">
            Voir tout <span aria-hidden>→</span>
          </Link>
          <div className="hidden sm:flex gap-2 ml-1">
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Précédent" className={arrowBtn} data-testid="carousel-prev"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Suivant" className={arrowBtn} data-testid="carousel-next"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div ref={ref} className="flex gap-6 overflow-x-auto pb-3 snap-x" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`[data-testid="listings-carousel"] > div::-webkit-scrollbar{display:none}`}</style>
        {listings.map((l) => {
          const img = l.images?.filter(Boolean).find(isImageFile);
          const cover = l.is_adult ? null : (img ? getListingImageUrl(img) : null);
          return (
            <Link key={l.id} to={`/citadelle/annonces/${l.slug}`} className={cardClasses} data-testid={`carousel-card-${l.slug}`}>
              {/* Zone visuelle */}
              <div className="h-[120px] w-full relative overflow-hidden" style={{ background: "#081729" }}>
                {l.is_adult ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1626,#2d1b2e)" }}>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", border: "1px solid #f87171" }}>18+</span>
                  </div>
                ) : cover ? (
                  <>
                    <img src={cover} alt={l.title}
                      className="w-full h-full object-cover transform transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <div className={`absolute inset-0 pointer-events-none z-10 ${dark ? "bg-gradient-to-t from-[#101F33] via-transparent to-transparent opacity-70 mix-blend-multiply" : "bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500"}`} />
                  </>
                ) : (
                  <div className={placeholderWrap}>
                    {dark ? (
                      <img src={CITADELLE_CONFIG.logo} alt={CITADELLE_CONFIG.name}
                        className="relative z-10 max-h-[86px] w-auto object-contain px-4 opacity-95" />
                    ) : (
                      <>
                        <div className={placeholderDots} />
                        <Castle size={26} strokeWidth={1} className="relative z-10 text-[#C9A45C]/45" />
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Contenu */}
              <div className="p-4 flex flex-col gap-1.5">
                <p className={titleCls}>{l.title}</p>
                <span className={priceCls}>{l.price?.toLocaleString("fr-FR")} €</span>
                <span className={viewsCls}>
                  <Eye size={13} className="opacity-70" /> {(l.views_count ?? 0)} vue{(l.views_count ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
