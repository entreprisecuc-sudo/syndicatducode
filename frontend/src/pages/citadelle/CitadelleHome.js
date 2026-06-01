/**
 * Page d'accueil — La Citadelle Numérique
 * Charte graphique : Bleu Citadelle #0F2747 / Or Prestige #C9A45C
 * Sections : Hero → Catégories → Comment ça marche → Services → CTA
 */

import { Link } from "react-router-dom";
import {
  Shield, TrendingUp, Lock, Globe, ShoppingCart, Cloud,
  Monitor, Users, CheckCircle, ArrowRight, Star,
  ShieldCheck, ArrowRightLeft, FileSearch, ChevronRight
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS, CITADELLE_CATEGORIES, CITADELLE_SERVICES, CITADELLE_CONFIG } from "@/config/citadelleConstants";

// ── Icônes par slug ───────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  Globe, ShoppingCart, Cloud, Monitor, Users
};

const SERVICE_ICONS = {
  TrendingUp, ShieldCheck, ArrowRightLeft, FileSearch
};

// ── Section Hero ─────────────────────────────────────────────────────────────

const HeroSection = () => (
  <section
    className="relative overflow-hidden"
    style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)`, minHeight: "90vh", display: "flex", alignItems: "center" }}
    data-testid="citadelle-hero"
  >
    {/* Motif de fond */}
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
      backgroundSize: "40px 40px"
    }} />
    {/* Orbes lumineux */}
    <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: CITADELLE_COLORS.gold, filter: "blur(120px)" }} />
    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: CITADELLE_COLORS.blue, filter: "blur(80px)" }} />

    <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 w-full">
      <div className="max-w-3xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold tracking-wider uppercase"
          style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)", color: CITADELLE_COLORS.gold }}>
          <Shield size={14} />
          Plateforme française sécurisée
        </div>

        {/* Titre */}
        <h1 className="font-bold leading-tight mb-6" style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "white"
        }}>
          Achetez.{" "}
          <span style={{ color: CITADELLE_COLORS.gold }}>Vendez.</span>{" "}
          Sécurisez.
        </h1>

        <p className="mb-8 leading-relaxed" style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.7)", maxWidth: "560px" }}>
          {CITADELLE_CONFIG.description}
          {" "}Des milliers d'actifs numériques vérifiés, des transactions entièrement sécurisées.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mb-12">
          <Link
            to="/citadelle/annonces"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.blue, color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            data-testid="citadelle-hero-cta-annonces"
          >
            Voir les annonces
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/citadelle/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid="citadelle-hero-cta-publier"
          >
            Publier gratuitement
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6">
          {[
            { value: "100%", label: "Transactions sécurisées", icon: Lock },
            { value: "Gratuit", label: "Publication d'annonce", icon: Star },
            { value: "5%", label: "Commission à la vente", icon: TrendingUp },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
                <Icon size={18} style={{ color: CITADELLE_COLORS.gold }} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>{value}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ── Section Catégories ────────────────────────────────────────────────────────

const CategoriesSection = () => (
  <section className="py-20" style={{ background: CITADELLE_COLORS.bg }} data-testid="citadelle-categories">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: CITADELLE_COLORS.blue }}>
          Que souhaitez-vous acheter ?
        </h2>
        <p style={{ color: CITADELLE_COLORS.textMuted }}>Explorez les annonces par catégorie d'actif numérique</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CITADELLE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon] || Globe;
          return (
            <Link
              key={cat.slug}
              to={`/citadelle/annonces?type=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1"
              style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}", boxShadow: "0 2px 8px rgba(15,39,71,0.05)` }}
              data-testid={`citadelle-category-${cat.slug}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `rgba(15,39,71,0.06)` }}>
                <Icon size={22} style={{ color: CITADELLE_COLORS.blue }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{cat.label}</p>
                <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>{cat.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

// ── Section Comment ça marche ─────────────────────────────────────────────────

const HowItWorksSection = () => (
  <section className="py-20" style={{ background: CITADELLE_COLORS.blue }} data-testid="citadelle-how-it-works">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: "white" }}>
          Comment ça marche ?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)" }}>Un processus simple, transparent et sécurisé en 3 étapes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            step: "01",
            icon: Globe,
            title: "Publiez votre actif",
            desc: "Créez votre annonce gratuitement en quelques minutes. Notre équipe la valide sous 24h avant publication.",
            color: CITADELLE_COLORS.gold
          },
          {
            step: "02",
            icon: Users,
            title: "Négociez en confiance",
            desc: "Échangez avec les acheteurs via notre messagerie sécurisée. Vos données restent protégées jusqu'à la signature.",
            color: CITADELLE_COLORS.gold
          },
          {
            step: "03",
            icon: Lock,
            title: "Sécurisez la transaction",
            desc: "Les fonds sont placés en séquestre Stripe. Le transfert se fait sous supervision. Libération après validation acheteur.",
            color: CITADELLE_COLORS.gold
          },
        ].map(({ step, icon: Icon, title, desc, color }) => (
          <div key={step} className="relative p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,164,92,0.2)" }}>
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl font-black" style={{ color: "rgba(201,164,92,0.25)", fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{step}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.15)" }}>
                <Icon size={22} style={{ color: CITADELLE_COLORS.gold }} />
              </div>
            </div>
            <h3 className="font-bold mb-3 text-lg" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Section Services ──────────────────────────────────────────────────────────

const ServicesSection = () => (
  <section className="py-20" style={{ background: "white" }} data-testid="citadelle-services">
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: CITADELLE_COLORS.blue }}>
          Nos services d'accompagnement
        </h2>
        <p style={{ color: CITADELLE_COLORS.textMuted }}>Des experts pour valoriser et sécuriser votre transaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CITADELLE_SERVICES.map((service) => {
          const Icon = SERVICE_ICONS[service.icon] || Shield;
          return (
            <div
              key={service.slug}
              className="group p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}
              data-testid={`citadelle-service-${service.slug}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                style={{ background: `rgba(15,39,71,0.08)` }}>
                <Icon size={22} style={{ color: CITADELLE_COLORS.blue }} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>{service.label}</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: CITADELLE_COLORS.textMuted }}>{service.description}</p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(201,164,92,0.12)", color: CITADELLE_COLORS.gold }}>
                {service.price}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ── Section CTA Final ─────────────────────────────────────────────────────────

const CTASection = () => (
  <section className="py-20 relative overflow-hidden" style={{ background: CITADELLE_COLORS.night }} data-testid="citadelle-cta">
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
      backgroundSize: "30px 30px"
    }} />
    <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}>
        <Shield size={30} style={{ color: CITADELLE_COLORS.gold }} />
      </div>
      <h2 className="font-black mb-4" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", color: "white" }}>
        Prêt à vendre votre actif numérique ?
      </h2>
      <p className="mb-8 text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
        Rejoignez la plateforme française de référence. Publication gratuite, commission de 5% uniquement à la vente.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/citadelle/inscription"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="citadelle-cta-publier"
        >
          Créer mon compte gratuit
          <ChevronRight size={18} />
        </Link>
        <Link
          to="/citadelle/annonces"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)" }}
        >
          Parcourir les annonces
        </Link>
      </div>
      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Aucun frais d'inscription · Annonce publiée sous 24h · Transactions sécurisées par Stripe
      </p>
    </div>
  </section>
);

// ── Page principale ───────────────────────────────────────────────────────────

export default function CitadelleHome() {
  return (
    <CitadelleLayout>
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
      <ServicesSection />
      <CTASection />
    </CitadelleLayout>
  );
}
