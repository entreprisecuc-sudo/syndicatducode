/**
 * Politique de Confidentialité — La Citadelle Numérique
 * Contenu bilingue (FR/EN) rendu depuis i18n via Markdown.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

export default function CitadelleConfidentialite() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('legal.confidentialite_title')} | La Citadelle Numérique`;
  }, [t]);

  return (
    <CitadelleLayout>
      <div className="py-14 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: CITADELLE_COLORS.gold }}>{t('legal.confidentialite_badge')}</p>
        <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>{t('legal.confidentialite_title')}</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>{t('legal.confidentialite_updated')}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-14 blog-content" data-testid="confidentialite-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{t('legalDocs.confidentialite_md')}</ReactMarkdown>
      </div>
    </CitadelleLayout>
  );
}
