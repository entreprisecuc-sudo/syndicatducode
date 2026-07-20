/**
 * RecentSaleBanner — La Citadelle Numérique
 * Bannière de preuve sociale : annonce une vente récente conclue par La Garde.
 * Affichée UNE fois par session (connexion/reconnexion) dans l'espace membre,
 * pendant 60 s, en haut, puis disparaît.
 */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_ALL_CATEGORIES } from "@/config/citadelleConstants";

const SESSION_KEY = "citadelle_sale_banner_seen";
const DURATION_MS = 60 * 1000;

export default function RecentSaleBanner() {
  const { isAuthenticated } = useCitadelleAuth();
  const location = useLocation();
  const [sale, setSale] = useState(null);
  const [visible, setVisible] = useState(false);

  const inMemberSpace = location.pathname.startsWith("/citadelle/espace-membre");

  useEffect(() => {
    if (!isAuthenticated || !inMemberSpace) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let hideTimer;
    citadelleApi.get("/listings/recent-sales", { params: { limit: 8 } })
      .then(res => {
        const sales = res.data?.sales || [];
        if (!sales.length) return;
        // Variété : une vente au hasard parmi les plus récentes
        const pick = sales[Math.floor(Math.random() * Math.min(sales.length, 5))];
        setSale(pick);
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "1");
        hideTimer = setTimeout(() => setVisible(false), DURATION_MS);
      })
      .catch(() => {});

    return () => clearTimeout(hideTimer);
  }, [isAuthenticated, inMemberSpace]);

  if (!visible || !sale) return null;

  const typeLabel = CITADELLE_ALL_CATEGORIES.find(c => c.slug === sale.type)?.label || "Actif numérique";
  const price = sale.price ? `${sale.price.toLocaleString("fr-FR")} €` : null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: `linear-gradient(90deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)`, borderBottom: `2px solid ${CITADELLE_COLORS.gold}`, animation: "citadelleSaleSlide 0.5s ease-out" }}
      data-testid="recent-sale-banner"
    >
      <style>{`@keyframes citadelleSaleSlide{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
        {/* Pastille live */}
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: CITADELLE_COLORS.gold }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: CITADELLE_COLORS.gold }} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline" style={{ color: CITADELLE_COLORS.gold }}>En direct</span>
        </span>

        <ShieldCheck size={18} style={{ color: CITADELLE_COLORS.gold }} className="flex-shrink-0" />

        <p className="text-sm text-white flex-1 truncate">
          <span className="font-black" style={{ fontFamily: "'Montserrat', sans-serif" }}>Nouvelle vente sécurisée par La Garde&nbsp;!</span>
          <span className="hidden md:inline" style={{ color: "rgba(255,255,255,0.75)" }}>
            {" "}« {sale.title} » — {typeLabel}{price ? ` vendu ${price}` : ""} via La Citadelle.
          </span>
          <span className="md:hidden" style={{ color: "rgba(255,255,255,0.75)" }}>
            {" "}{typeLabel}{price ? ` vendu ${price}` : ""}.
          </span>
        </p>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="flex-shrink-0 p-1 rounded-md transition-colors hover:bg-white/10"
          aria-label="Fermer"
          data-testid="recent-sale-banner-close"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
