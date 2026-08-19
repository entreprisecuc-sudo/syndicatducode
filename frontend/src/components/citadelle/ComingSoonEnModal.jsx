/**
 * ComingSoonEnModal — Pop-up provisoire (EN uniquement)
 * Informe que les articles seront bientôt disponibles en anglais.
 * S'affiche à chaque visite tant que la langue active est l'anglais.
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages, X } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

export default function ComingSoonEnModal() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(i18n.language === "en");

  // Réouvrir dès que la langue passe à l'anglais
  useEffect(() => {
    if (i18n.language === "en") setOpen(true);
    else setOpen(false);
  }, [i18n.language]);

  if (!open || i18n.language !== "en") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
      onClick={() => setOpen(false)}
      data-testid="coming-soon-en-overlay"
    >
      <div
        className="w-full max-w-md p-7 rounded-2xl text-center relative"
        style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 20px 60px rgba(15,39,71,0.25)" }}
        onClick={(e) => e.stopPropagation()}
        data-testid="coming-soon-en-modal"
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute p-1 rounded-lg"
          style={{ color: CITADELLE_COLORS.textMuted, top: 14, right: 14 }}
          aria-label="Close"
          data-testid="coming-soon-en-close"
        >
          <X size={20} />
        </button>

        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{ width: 56, height: 56, background: "rgba(201,164,92,0.14)", border: `1px solid ${CITADELLE_COLORS.gold}` }}
        >
          <Languages size={26} style={{ color: CITADELLE_COLORS.gold }} />
        </div>

        <h2
          className="font-black text-xl mb-2"
          style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
        >
          {t("coming_soon_en.title")}
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
          {t("coming_soon_en.body")}
        </p>

        <button
          onClick={() => setOpen(false)}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="coming-soon-en-cta"
        >
          {t("coming_soon_en.cta")}
        </button>
      </div>
    </div>
  );
}
