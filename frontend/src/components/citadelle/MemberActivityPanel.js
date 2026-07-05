/**
 * Panneau "À traiter" — Espace membre La Citadelle Numérique
 * Vue directe des interactions : messages non lus, propositions d'achat,
 * paiements à effectuer, accès à transmettre, litiges. Chaque ligne mène
 * d'un clic à l'endroit de traitement.
 *
 * Props :
 *  - dark        : rendu sur fond bleu (typo claire) pour l'en-tête
 *  - limit       : nombre max de notifications affichées (les plus récentes)
 *  - viewAllHref : si défini et qu'il reste des notifs au-delà de `limit`,
 *                  affiche un bouton "Voir tout" vers cette page
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare, Handshake, CreditCard, KeyRound, AlertCircle, CheckCircle2, ChevronRight, ArrowRight,
} from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const TYPE_ICON = {
  message: MessageSquare,
  offer: Handshake,
  payment: CreditCard,
  delivery: KeyRound,
  dispute: AlertCircle,
};

const LEVEL_COLOR = {
  urgent: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
};

export default function MemberActivityPanel({ dark = false, limit = null, viewAllHref = null, hideTitle = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = () => {
      citadelleApi.get("/member/activity")
        .then((res) => setItems(res.data.items || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const shown = limit ? items.slice(0, limit) : items;
  const remaining = limit ? Math.max(0, items.length - limit) : 0;

  // Palette selon le contexte (fond bleu ou fond clair)
  const titleColor  = dark ? CITADELLE_COLORS.gold : CITADELLE_COLORS.blue;
  const textMain    = dark ? "#FFFFFF" : CITADELLE_COLORS.blue;
  const textMuted   = dark ? "rgba(255,255,255,0.6)" : CITADELLE_COLORS.textMuted;
  const cardBg      = dark ? "rgba(255,255,255,0.07)" : "white";
  const cardBorder  = dark ? "rgba(255,255,255,0.14)" : CITADELLE_COLORS.border;
  const emptyBg     = dark ? "rgba(34,197,94,0.12)" : "rgba(22,163,74,0.05)";
  const emptyBorder = dark ? "rgba(34,197,94,0.35)" : "rgba(22,163,74,0.2)";

  return (
    <div data-testid="member-activity-panel">
      <div className="flex items-center justify-between mb-3">
        {!hideTitle && (
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: titleColor }}>
            À traiter
          </h2>
        )}
        {items.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
            style={{ background: "rgba(220,38,38,0.15)", color: dark ? "#FCA5A5" : "#DC2626" }}
            data-testid="member-activity-count">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: emptyBg, border: `1px solid ${emptyBorder}` }}
          data-testid="member-activity-empty">
          <CheckCircle2 size={20} style={{ color: dark ? "#4ADE80" : "#16A34A" }} />
          <p className="text-sm" style={{ color: dark ? "rgba(255,255,255,0.85)" : CITADELLE_COLORS.textMuted }}>
            Tout est à jour — aucune interaction en attente.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((item, i) => {
            const Icon = TYPE_ICON[item.type] || MessageSquare;
            const color = LEVEL_COLOR[item.level] || CITADELLE_COLORS.gold;
            return (
              <Link
                key={`${item.type}-${i}`}
                to={item.route}
                data-testid={`member-activity-item-${item.type}-${i}`}
                className="group flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:scale-[1.005]"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: dark ? `${color}30` : `${color}15` }}>
                  <Icon size={17} style={{ color: dark ? "#FFFFFF" : color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: textMain }}>
                      {item.title}
                    </p>
                    {item.count > 1 && (
                      <span className="text-[10px] font-bold px-1.5 rounded-full text-white flex-shrink-0"
                        style={{ background: "#DC2626" }}>
                        {item.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: textMuted }}>
                    {item.preview}
                  </p>
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: textMuted }}>
                  {timeAgo(item.created_at)}
                </span>
                <ChevronRight size={16} className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ color: dark ? "#FFFFFF" : CITADELLE_COLORS.blue }} />
              </Link>
            );
          })}

          {viewAllHref && remaining > 0 && (
            <Link
              to={viewAllHref}
              data-testid="member-activity-view-all"
              className="group flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.005]"
              style={{
                background: dark ? "rgba(201,164,92,0.15)" : "rgba(201,164,92,0.1)",
                border: `1px solid ${dark ? "rgba(201,164,92,0.4)" : "rgba(201,164,92,0.3)"}`,
                color: CITADELLE_COLORS.gold,
              }}
            >
              Voir tout ({items.length})
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
