/**
 * Bandeau de modération — La Citadelle Numérique
 * Affiché en haut de l'espace Citadelle quand le membre est averti / suspendu / banni.
 */

import { AlertTriangle, Ban, Info } from "lucide-react";
import { useCitadelleModeration } from "@/hooks/useCitadelleModeration";

const STYLES = {
  warning:   { bg: "#FEF3C7", border: "#F59E0B", color: "#92400E", icon: Info,           title: "Avertissement" },
  suspended: { bg: "#FFEDD5", border: "#F97316", color: "#9A3412", icon: AlertTriangle,   title: "Compte suspendu" },
  banned:    { bg: "#FEE2E2", border: "#DC2626", color: "#991B1B", icon: Ban,             title: "Compte banni" },
};

export default function ModerationBanner() {
  const { banner } = useCitadelleModeration();
  if (!banner) return null;

  const s = STYLES[banner.level];
  const Icon = s.icon;
  const fmt = (d) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div data-testid={`moderation-banner-${banner.level}`}
      style={{ background: s.bg, borderBottom: `2px solid ${s.border}`, color: s.color }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-start gap-3">
        <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-sm">
          <p className="font-bold">
            {s.title}
            {banner.until && banner.level !== "banned" ? ` — jusqu'au ${fmt(banner.until)}` : ""}
          </p>
          {banner.reason && <p className="mt-0.5"><strong>Motif :</strong> {banner.reason}</p>}
          {banner.note && <p className="mt-0.5">{banner.note}</p>}
          {banner.level === "suspended" && (
            <p className="mt-1 text-xs opacity-90">
              Vous pouvez consulter votre compte et vos factures, mais vous ne pouvez pas acheter, vendre ni enchérir durant cette période.
            </p>
          )}
          {banner.level === "banned" && (
            <p className="mt-1 text-xs opacity-90">
              Accès limité à vos factures et à vos documents de transmission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
