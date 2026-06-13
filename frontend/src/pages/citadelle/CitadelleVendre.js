/**
 * Page Vendre — La Citadelle Numérique
 * Page commerciale de conversion dédiée aux vendeurs
 * Sections : Hero → Avantages → Étapes → Modes de vente →
 *            Services vendeurs → Pourquoi évaluer → La Garde →
 *            FAQ → CTA final
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, TrendingUp, Users, HeartHandshake, ArrowRight,
  ChevronRight, ChevronDown, CheckCircle, Tag, Gavel,
  Star, Award, BarChart2, Wrench, Lock, Sparkles,
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// ── Données statiques ─────────────────────────────────────────────────────────

const AVANTAGES = [
  {
    icon: Shield,
    titre: "Transaction sécurisée",
    texte: "Toutes les ventes sont protégées par notre système de transaction sécurisée. Les fonds sont placés en séquestre jusqu'à la validation finale du transfert.",
  },
  {
    icon: Users,
    titre: "Réseau d'acheteurs qualifiés",
    texte: "Votre projet est présenté à une audience ciblée d'investisseurs et d'entrepreneurs activement à la recherche d'actifs numériques.",
  },
  {
    icon: TrendingUp,
    titre: "Expertise indépendante",
    texte: "Possibilité d'obtenir une évaluation professionnelle de votre projet par nos experts certifiés afin de valoriser votre annonce au juste prix.",
  },
  {
    icon: HeartHandshake,
    titre: "Accompagnement personnalisé",
    texte: "La Garde et les partenaires du Syndicat du Code peuvent vous accompagner avant, pendant et après la vente selon vos besoins.",
  },
];

const ETAPES = [
  {
    num: "01",
    titre: "Publiez votre annonce gratuitement",
    texte: "Créez votre annonce en quelques minutes. Publication gratuite, validation par notre équipe sous 24h.",
    services: [],
  },
  {
    num: "02",
    titre: "Recevez les premières demandes",
    texte: "Les acheteurs intéressés vous contactent directement via notre messagerie sécurisée. Répondez à leurs questions et échangez librement.",
    services: [],
  },
  {
    num: "03",
    titre: "Choisissez les services adaptés",
    texte: "Boostez votre vente avec les services professionnels de La Citadelle :",
    services: ["Évaluation Standard", "Évaluation Expert Certifiée", "Valorisation Avant Vente", "Refonte Avant Vente"],
  },
  {
    num: "04",
    titre: "Finalisez via notre système sécurisé",
    texte: "Acceptez l'offre de votre choix. Le paiement est sécurisé et les fonds bloqués jusqu'à la livraison complète du projet.",
    services: [],
  },
  {
    num: "05",
    titre: "Transférez votre projet",
    texte: "Transmettez les accès à l'acheteur avec ou sans assistance technique de nos partenaires. La Garde supervise la clôture.",
    services: [],
  },
];

const MODES_VENTE = [
  {
    icon: Tag,
    titre: "Prix fixe",
    texte: "Définissez librement le prix de vente de votre actif. L'acheteur peut contacter et acheter au prix affiché.",
    badge: "Le plus courant",
    badgeColor: CITADELLE_COLORS.gold,
  },
  {
    icon: ChevronRight,
    titre: "Prix négociable",
    texte: "Les acheteurs peuvent proposer une offre inférieure à votre prix. Vous gardez le contrôle total en acceptant ou refusant.",
    badge: null,
    badgeColor: null,
  },
  {
    icon: Gavel,
    titre: "Vente aux enchères",
    texte: "Définissez un prix minimum, une durée et laissez les acheteurs enchérir. La Transaction Sécurisée est active sur toutes les enchères.",
    badge: "Popularité croissante",
    badgeColor: CITADELLE_COLORS.blue,
  },
];

const SERVICES_VENDEUR = [
  {
    icon: Star,
    titre: "Évaluation Standard",
    texte: "Connaître rapidement la valeur de son projet grâce à notre méthode d'analyse propriétaire.",
    type: "Gratuit",
  },
  {
    icon: Award,
    titre: "Évaluation Expert Certifiée",
    texte: "Obtenir une expertise complète, signée et opposable pour maximiser votre prix de vente.",
    type: "Sur devis",
  },
  {
    icon: BarChart2,
    titre: "Valorisation Avant Vente",
    texte: "Optimiser votre annonce et mettre en valeur les atouts de votre projet pour attirer les meilleurs acheteurs.",
    type: "Sur devis",
  },
  {
    icon: Wrench,
    titre: "Refonte Avant Vente",
    texte: "Augmenter la valeur perçue de votre projet grâce à une refonte technique ou graphique avant publication.",
    type: "Sur devis",
  },
];

const FAQ_ITEMS = [
  {
    question: "Combien coûte la publication d'une annonce ?",
    reponse: "La publication d'une annonce est entièrement gratuite. Aucun frais n'est appliqué tant que votre projet n'est pas vendu.",
  },
  {
    question: "Quel est le montant de la commission ?",
    reponse: "La commission de La Citadelle est de 5% du prix de vente final, avec un minimum de 49 €. Elle est uniquement prélevée en cas de vente aboutie.",
  },
  {
    question: "Puis-je vendre aux enchères ?",
    reponse: "Oui. Lors de la création de votre annonce, activez le mode Enchères, définissez un prix de réserve et une durée. Les acheteurs enchérissent jusqu'à la clôture.",
  },
  {
    question: "Puis-je faire évaluer mon projet ?",
    reponse: "Absolument. Nos services d'évaluation (Standard et Expert Certifiée) sont accessibles depuis la page Services. Une évaluation professionnelle rassure les acheteurs et valorise votre projet.",
  },
  {
    question: "Qui réalise les refontes ?",
    reponse: "Les refontes sont réalisées par les partenaires certifiés du Syndicat du Code, sous supervision de La Garde. Chaque intervention fait l'objet d'un devis et d'un suivi personnalisé.",
  },
  {
    question: "Comment fonctionne la transaction sécurisée ?",
    reponse: "Lorsqu'une offre est acceptée, les fonds de l'acheteur sont bloqués dans notre système de séquestre. Le vendeur transmet les accès, La Garde vérifie, et les fonds sont libérés après validation. Aucun transfert sans confirmation.",
  },
  {
    question: "Que se passe-t-il en cas de litige ?",
    reponse: "La Garde dispose d'un système de gestion des litiges intégré. L'acheteur ou le vendeur peut ouvrir un litige. Nos experts analysent la situation et proposent une résolution juste dans les meilleurs délais.",
  },
];

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

  const toggleFaq = (index) => setOpenFaq(prev => prev === index ? null : index);

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
            <SectionLabel><Shield size={13} /> Pour les vendeurs</SectionLabel>

            <h1
              className="font-bold leading-tight mb-6"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                color: "white",
              }}
            >
              Vendez votre projet numérique{" "}
              <span style={{ color: CITADELLE_COLORS.gold }}>en toute confiance.</span>
            </h1>

            <p
              className="mb-10 leading-relaxed"
              style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", maxWidth: "540px" }}
            >
              Sites internet, SaaS, e-commerce, applications web, blogs ou actifs numériques.
              Publiez votre annonce gratuitement et bénéficiez d'un accompagnement professionnel.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                to="/citadelle/espace-membre/mes-annonces/creer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="vendre-cta-publier"
              >
                Publier mon annonce
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/citadelle/services"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                data-testid="vendre-cta-services"
              >
                Découvrir nos services
                <ChevronRight size={18} />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { value: "Gratuit", label: "Publication d'annonce" },
                { value: "5%", label: "Commission à la vente" },
                { value: "100%", label: "Transactions sécurisées" },
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
            <SectionLabel><Sparkles size={13} /> Nos engagements</SectionLabel>
            <SectionTitle center>Pourquoi vendre sur La Citadelle ?</SectionTitle>
            <SectionSubtitle center>
              Une plateforme pensée pour les vendeurs sérieux, avec les outils et l'accompagnement pour réussir chaque transaction.
            </SectionSubtitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AVANTAGES.map(({ icon: Icon, titre, texte }) => (
              <div
                key={titre}
                className="p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "white",
                  border: `1px solid ${CITADELLE_COLORS.border}`,
                  boxShadow: "0 2px 12px rgba(15,39,71,0.06)",
                }}
                data-testid={`avantage-${titre.substring(0, 10).replace(/\s/g, "-")}`}
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
            ))}
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
            <SectionLabel><CheckCircle size={13} /> Processus</SectionLabel>
            <SectionTitle light center>Comment ça fonctionne ?</SectionTitle>
            <SectionSubtitle light center>
              De la création de votre annonce jusqu'au transfert final, La Garde vous accompagne à chaque étape.
            </SectionSubtitle>
          </div>

          <div className="relative">
            {/* Ligne verticale de connexion */}
            <div
              className="absolute left-8 top-0 bottom-0 w-px hidden md:block"
              style={{ background: "rgba(201,164,92,0.2)" }}
            />

            <div className="space-y-6">
              {ETAPES.map((etape, i) => (
                <div
                  key={etape.num}
                  className="relative flex gap-6 p-6 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(201,164,92,0.15)",
                  }}
                  data-testid={`etape-${etape.num}`}
                >
                  {/* Numéro */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm relative z-10"
                    style={{
                      background: "rgba(201,164,92,0.15)",
                      color: CITADELLE_COLORS.gold,
                      fontFamily: "'Montserrat', sans-serif",
                      border: "1px solid rgba(201,164,92,0.3)",
                    }}
                  >
                    {etape.num}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1.5" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>
                      {etape.titre}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {etape.texte}
                    </p>
                    {etape.services.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {etape.services.map(s => (
                          <span
                            key={s}
                            className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{
                              background: "rgba(201,164,92,0.12)",
                              color: CITADELLE_COLORS.gold,
                              border: "1px solid rgba(201,164,92,0.2)",
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
            <SectionLabel><Tag size={13} /> Flexibilité</SectionLabel>
            <SectionTitle center>Modes de vente disponibles</SectionTitle>
            <SectionSubtitle center>
              Choisissez le mode de vente adapté à votre stratégie et à la nature de votre actif.
            </SectionSubtitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MODES_VENTE.map(({ icon: Icon, titre, texte, badge, badgeColor }) => (
              <div
                key={titre}
                className="relative p-7 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: CITADELLE_COLORS.bg,
                  border: `1px solid ${CITADELLE_COLORS.border}`,
                }}
                data-testid={`mode-${titre.replace(/\s/g, "-").toLowerCase()}`}
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
            ))}
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
            <SectionLabel><Star size={13} /> Services vendeurs</SectionLabel>
            <SectionTitle light center>Services dédiés aux vendeurs</SectionTitle>
            <SectionSubtitle light center>
              Valorisez votre projet et maximisez vos chances de vendre au meilleur prix.
            </SectionSubtitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES_VENDEUR.map(({ icon: Icon, titre, texte, type }, i) => (
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
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/citadelle/services"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="vendre-cta-voir-services"
            >
              Voir tous les services
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
              <SectionLabel><Award size={13} /> Évaluation</SectionLabel>
              <SectionTitle>Pourquoi faire évaluer son projet ?</SectionTitle>
              <p className="text-base leading-relaxed mb-8" style={{ color: CITADELLE_COLORS.textMuted }}>
                Un prix cohérent inspire confiance. Une évaluation professionnelle rassure les acheteurs
                et raccourcit le délai de vente. Une valorisation réalisée par La Citadelle
                améliore la visibilité de votre annonce dans notre réseau.
              </p>

              <div className="space-y-4">
                {[
                  "Un prix cohérent inspire immédiatement confiance aux acheteurs potentiels.",
                  "Une évaluation professionnelle rassure et déclenche les offres sérieuses.",
                  "Une valorisation ciblée améliore la visibilité de votre annonce dans notre réseau.",
                ].map((point, i) => (
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
                    Évalué par La Citadelle
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Badge affiché sur votre annonce — rassure les acheteurs et augmente la crédibilité.
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
                    Évaluation Expert Certifiée
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Rapport complet signé par un expert — référence pour les transactions importantes.
                  </p>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: CITADELLE_COLORS.textMuted }}>
                Ces badges sont attribués après validation par notre équipe. Non cessibles.
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

          <SectionLabel><Lock size={13} /> Sécurité & Confiance</SectionLabel>

          <h2
            className="font-bold mb-6 mt-4"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "white" }}
          >
            La Garde veille sur chaque transaction
          </h2>

          <p className="text-base leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)", maxWidth: "600px", margin: "0 auto 1rem" }}>
            La Garde accompagne les vendeurs et les acheteurs afin d'assurer des transactions transparentes,
            sécurisées et professionnelles.
          </p>

          <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "580px", margin: "0 auto 2.5rem" }}>
            Nos experts peuvent intervenir depuis l'évaluation du projet jusqu'à la validation finale du transfert.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Séquestre des fonds",
              "Vérification des accès",
              "Gestion des litiges",
              "Transmission sécurisée",
            ].map(item => (
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
            <SectionLabel>Questions fréquentes</SectionLabel>
            <SectionTitle center>Vous avez des questions ?</SectionTitle>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => toggleFaq(i)}
              />
            ))}
          </div>

          <p className="text-sm text-center mt-8" style={{ color: CITADELLE_COLORS.textMuted }}>
            Une question non répertoriée ?{" "}
            <Link to="/citadelle/contact" className="font-semibold hover:underline" style={{ color: CITADELLE_COLORS.gold }}>
              Contactez-nous
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
            Prêt à vendre votre projet ?
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", maxWidth: "500px", margin: "0 auto 2.5rem" }}>
            Publiez votre annonce gratuitement et trouvez le bon acheteur grâce à La Citadelle Numérique.
          </p>
          <Link
            to="/citadelle/espace-membre/mes-annonces/creer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="vendre-cta-final-btn"
          >
            Publier mon annonce
            <ArrowRight size={22} />
          </Link>
          <p className="mt-5 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Gratuit · Validé sous 24h · Commission 5% uniquement si la vente aboutit
          </p>
        </div>
      </section>

    </CitadelleLayout>
  );
}
