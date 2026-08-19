/**
 * Page Vendre — La Citadelle Numérique
 * Page commerciale de conversion dédiée aux vendeurs
 * Sections : Hero → Avantages → Étapes → Modes de vente →
 *            Services vendeurs → Pourquoi évaluer → La Garde →
 *            FAQ → CTA final
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, TrendingUp, Users, HeartHandshake, ArrowRight,
  ChevronRight, ChevronDown, CheckCircle, Tag, Gavel,
  Star, Award, BarChart2, Wrench, Lock, Sparkles,
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useTranslation } from "react-i18next";

// ── Icônes par section (le texte vient de i18n : section `vendre`) ────────────

const AVANTAGES_ICONS = [Shield, Users, TrendingUp, HeartHandshake];
const MODES_ICONS = [
  { icon: Tag, badgeColor: CITADELLE_COLORS.gold },
  { icon: ChevronRight, badgeColor: null },
  { icon: Gavel, badgeColor: CITADELLE_COLORS.blue },
];
const SERVICES_ICONS = [Star, Award, BarChart2, Wrench];

// ── Composants de sections ────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <div
    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold tracking-wider uppercase"
    style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children, light = false, center = false }) => (
  <h2
    className={`font-bold mb-4 ${center ? "text-center" : ""}`}
    style={{
      fontFamily: "'Montserrat', sans-serif",
      fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
      color: light ? "white" : CITADELLE_COLORS.blue,
    }}
  >
    {children}
  </h2>
);

const SectionSubtitle = ({ children, light = false, center = false }) => (
  <p
    className={`text-base leading-relaxed mb-10 ${center ? "text-center" : ""}`}
    style={{ color: light ? "rgba(255,255,255,0.65)" : CITADELLE_COLORS.textMuted, maxWidth: center ? "560px" : undefined, margin: center ? "0 auto 2.5rem" : undefined }}
  >
    {children}
  </p>
);

// ── FAQ Accordéon ─────────────────────────────────────────────────────────────

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: `1px solid ${isOpen ? CITADELLE_COLORS.gold : CITADELLE_COLORS.border}`, background: isOpen ? "rgba(201,164,92,0.04)" : "white" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        data-testid={`faq-item-${item.question.substring(0, 20).replace(/\s/g, "-")}`}
      >
        <span className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{item.question}</span>
        <ChevronDown
          size={18}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: CITADELLE_COLORS.gold, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
            {item.reponse}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function CitadelleVendre() {
  const [openFaq, setOpenFaq] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('vendre.hero_h1') + " | La Citadelle Numérique";
  }, [t]);

  const toggleFaq = (index) => setOpenFaq(prev => prev === index ? null : index);

  const avantages = t('vendre.avantages', { returnObjects: true });
  const etapes = t('vendre.etapes', { returnObjects: true });
  const modes = t('vendre.modes', { returnObjects: true });
  const servicesVendeur = t('vendre.services', { returnObjects: true });
  const faqItems = t('vendre.faq', { returnObjects: true });
  const evalPoints = t('vendre.eval_points', { returnObjects: true });
  const gardeChips = t('vendre.garde_chips', { returnObjects: true });

  return (
    <CitadelleLayout>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)`,
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
        }}
        data-testid="vendre-hero"
      >
        {/* Motif de fond */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Orbes */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: CITADELLE_COLORS.gold, filter: "blur(120px)" }} />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full opacity-8" style={{ background: "#1a4a8a", filter: "blur(80px)" }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <SectionLabel><Shield size={13} /> {t('vendre.hero_badge')}</SectionLabel>

            <h1
              className="font-bold leading-tight mb-6"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                color: "white",
              }}
            >
              {t('vendre.hero_h1')}{" "}
              <span style={{ color: CITADELLE_COLORS.gold }}>{t('vendre.hero_h1_accent')}</span>
            </h1>

            <p
              className="mb-10 leading-relaxed"
              style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", maxWidth: "540px" }}
            >
              {t('vendre.hero_sub2')}
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                to="/citadelle/espace-membre/mes-annonces/creer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="vendre-cta-publier"
              >
                {t('vendre.hero_cta_publish')}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/citadelle/services"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                data-testid="vendre-cta-services"
              >
                {t('vendre.hero_cta_estimate')}
                <ChevronRight size={18} />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { value: t('vendre.stat_free_v'), label: t('vendre.stat_free_l') },
                { value: t('vendre.stat_comm_v'), label: t('vendre.stat_comm_l') },
                { value: t('vendre.stat_sec_v'), label: t('vendre.stat_sec_l') },
              ].map(({ value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,164,92,0.15)" }}
                  >
                    <CheckCircle size={18} style={{ color: CITADELLE_COLORS.gold }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>{value}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — POURQUOI VENDRE SUR LA CITADELLE ?
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: CITADELLE_COLORS.bg }} data-testid="vendre-avantages">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <SectionLabel><Sparkles size={13} /> {t('vendre.label_engagements')}</SectionLabel>
            <SectionTitle center>{t('vendre.why_title')}</SectionTitle>
            <SectionSubtitle center>
              {t('vendre.why_sub')}
            </SectionSubtitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map(({ titre, texte }, idx) => {
              const Icon = AVANTAGES_ICONS[idx];
              return (
              <div
                key={titre}
                className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "white",
                  border: `1px solid ${CITADELLE_COLORS.border}`,
                  boxShadow: "0 2px 12px rgba(15,39,71,0.06)",
                }}
                data-testid={`avantage-${idx}`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(201,164,92,0.1)" }}
                >
                  <Icon size={22} style={{ color: CITADELLE_COLORS.gold }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                  {titre}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {texte}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — COMMENT ÇA FONCTIONNE ?
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}
        data-testid="vendre-etapes"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <SectionLabel><CheckCircle size={13} /> {t('vendre.label_process')}</SectionLabel>
            <SectionTitle light center>{t('vendre.process_title')}</SectionTitle>
            <SectionSubtitle light center>
              {t('vendre.process_sub')}
            </SectionSubtitle>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Ligne de connexion verticale dorée */}
            <div
              className="absolute hidden md:block"
              style={{
                left: "1.65rem",
                top: "3.5rem",
                bottom: "3.5rem",
                width: "1px",
                background: "linear-gradient(to bottom, transparent 0%, rgba(201,164,92,0.45) 8%, rgba(201,164,92,0.45) 92%, transparent 100%)",
              }}
            />

            <div className="space-y-0">
              {etapes.map((etape, i) => (
                <div
                  key={etape.num}
                  className="relative flex gap-6 md:gap-10 py-7 group transition-all duration-300"
                  style={{
                    borderBottom: i < etapes.length - 1 ? "2px solid rgba(201,164,92,0.25)" : "none",
                  }}
                  data-testid={`etape-${etape.num}`}
                >
                  {/* Badge numéro — fond doré plein pour lisibilité maximale */}

                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: CITADELLE_COLORS.gold,
                        color: CITADELLE_COLORS.night,
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: "1rem",
                        boxShadow: "0 4px 18px rgba(201,164,92,0.35)",
                      }}
                    >
                      {etape.num}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pt-1 transition-transform duration-300 group-hover:-translate-y-0.5">
                    <h3
                      className="font-bold mb-2 transition-colors duration-200"
                      style={{
                        color: "white",
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: "1.05rem",
                      }}
                    >
                      {etape.titre}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
                      {etape.texte}
                    </p>
                    {etape.services.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {etape.services.map(s => (
                          <span
                            key={s}
                            className="text-xs px-3 py-1.5 rounded-full font-medium"
                            style={{
                              background: "rgba(201,164,92,0.1)",
                              color: CITADELLE_COLORS.gold,
                              border: "1px solid rgba(201,164,92,0.28)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — MODES DE VENTE
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: "white" }} data-testid="vendre-modes">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <SectionLabel><Tag size={13} /> {t('vendre.label_flexibility')}</SectionLabel>
            <SectionTitle center>{t('vendre.modes_title')}</SectionTitle>
            <SectionSubtitle center>
              {t('vendre.modes_sub')}
            </SectionSubtitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modes.map(({ titre, texte, badge }, idx) => {
              const { icon: Icon, badgeColor } = MODES_ICONS[idx];
              return (
              <div
                key={titre}
                className="relative p-7 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: CITADELLE_COLORS.bg,
                  border: `1px solid ${CITADELLE_COLORS.border}`,
                }}
                data-testid={`mode-${idx}`}
              >
                {badge && (
                  <span
                    className="absolute top-4 right-4 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: `${badgeColor}15`, color: badgeColor, border: `1px solid ${badgeColor}30` }}
                  >
                    {badge}
                  </span>
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(201,164,92,0.1)" }}
                >
                  <Icon size={22} style={{ color: CITADELLE_COLORS.gold }} />
                </div>
                <h3 className="font-bold text-lg mb-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                  {titre}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {texte}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — SERVICES DÉDIÉS AUX VENDEURS
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-20"
        style={{ background: CITADELLE_COLORS.blue }}
        data-testid="vendre-services"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <SectionLabel><Star size={13} /> {t('vendre.label_seller_services')}</SectionLabel>
            <SectionTitle light center>{t('vendre.seller_services_title')}</SectionTitle>
            <SectionSubtitle light center>
              {t('vendre.seller_services_sub')}
            </SectionSubtitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {servicesVendeur.map(({ titre, texte, type }, i) => {
              const Icon = SERVICES_ICONS[i];
              return (
              <div
                key={titre}
                className="p-6 rounded-2xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(201,164,92,0.18)",
                }}
                data-testid={`service-vendeur-${i + 1}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(201,164,92,0.12)" }}
                  >
                    <Icon size={18} style={{ color: CITADELLE_COLORS.gold }} />
                  </div>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(201,164,92,0.12)", color: CITADELLE_COLORS.gold, border: "1px solid rgba(201,164,92,0.2)" }}
                  >
                    {type}
                  </span>
                </div>

                <div className="h-px" style={{ background: "rgba(201,164,92,0.15)" }} />

                <div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: "white" }}>{titre}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{texte}</p>
                </div>
              </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/citadelle/services"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="vendre-cta-voir-services"
            >
              {t('vendre.see_all_services')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — POURQUOI FAIRE ÉVALUER SON PROJET ?
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: CITADELLE_COLORS.bg }} data-testid="vendre-evaluer">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Contenu */}
            <div>
              <SectionLabel><Award size={13} /> {t('vendre.label_evaluation')}</SectionLabel>
              <SectionTitle>{t('vendre.why_eval_title')}</SectionTitle>
              <p className="text-base leading-relaxed mb-8" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t('vendre.why_eval_p')}
              </p>

              <div className="space-y-4">
                {evalPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(201,164,92,0.15)" }}
                    >
                      <CheckCircle size={14} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: CITADELLE_COLORS.textMuted }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-5">
              <div
                className="p-6 rounded-2xl flex items-center gap-5 transition-all hover:-translate-y-0.5"
                style={{ background: "white", border: `2px solid ${CITADELLE_COLORS.gold}`, boxShadow: `0 4px 24px rgba(201,164,92,0.15)` }}
                data-testid="badge-evalue-citadelle"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(201,164,92,0.1)" }}
                >
                  <Shield size={26} style={{ color: CITADELLE_COLORS.gold }} />
                </div>
                <div>
                  <p className="font-black text-base" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                    {t('vendre.badge_evaluated_title')}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {t('vendre.badge_evaluated_desc')}
                  </p>
                </div>
              </div>

              <div
                className="p-6 rounded-2xl flex items-center gap-5 transition-all hover:-translate-y-0.5"
                style={{ background: "white", border: `2px solid ${CITADELLE_COLORS.blue}`, boxShadow: `0 4px 24px rgba(15,39,71,0.1)` }}
                data-testid="badge-expert-certifie"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(15,39,71,0.06)" }}
                >
                  <Award size={26} style={{ color: CITADELLE_COLORS.blue }} />
                </div>
                <div>
                  <p className="font-black text-base" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                    {t('vendre.badge_expert_title')}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {t('vendre.badge_expert_desc')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t('vendre.badges_note')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — LA GARDE VEILLE SUR CHAQUE TRANSACTION
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}
        data-testid="vendre-la-garde"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: CITADELLE_COLORS.gold, filter: "blur(100px)" }} />

        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}
          >
            <Shield size={36} style={{ color: CITADELLE_COLORS.gold }} />
          </div>

          <SectionLabel><Lock size={13} /> {t('vendre.label_security')}</SectionLabel>

          <h2
            className="font-bold mb-6 mt-4"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "white" }}
          >
            {t('vendre.garde_title')}
          </h2>

          <p className="text-base leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)", maxWidth: "600px", margin: "0 auto 1rem" }}>
            {t('vendre.garde_p1')}
          </p>

          <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "580px", margin: "0 auto 2.5rem" }}>
            {t('vendre.garde_p2')}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {gardeChips.map(item => (
              <div
                key={item}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "rgba(201,164,92,0.12)", border: "1px solid rgba(201,164,92,0.2)", color: "rgba(255,255,255,0.85)" }}
              >
                <CheckCircle size={14} style={{ color: CITADELLE_COLORS.gold }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 8 — FAQ
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: "white" }} data-testid="vendre-faq">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <SectionLabel>{t('vendre.faq_title')}</SectionLabel>
            <SectionTitle center>{t('vendre.faq_h2')}</SectionTitle>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => toggleFaq(i)}
              />
            ))}
          </div>

          <p className="text-sm text-center mt-8" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t('vendre.faq_not_listed')}{" "}
            <Link to="/citadelle/contact" className="font-semibold hover:underline" style={{ color: CITADELLE_COLORS.gold }}>
              {t('vendre.faq_contact')}
            </Link>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 9 — CTA FINAL
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}
        data-testid="vendre-cta-final"
      >
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: CITADELLE_COLORS.gold, filter: "blur(100px)" }} />

        <div className="relative max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2
            className="font-bold mb-5"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)", color: "white" }}
          >
            {t('vendre.cta_title')}
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", maxWidth: "500px", margin: "0 auto 2.5rem" }}>
            {t('vendre.cta_sub')}
          </p>
          <Link
            to="/citadelle/espace-membre/mes-annonces/creer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="vendre-cta-final-btn"
          >
            {t('vendre.hero_cta_publish')}
            <ArrowRight size={22} />
          </Link>
          <p className="mt-5 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t('vendre.cta_note')}
          </p>
        </div>
      </section>

    </CitadelleLayout>
  );
}
