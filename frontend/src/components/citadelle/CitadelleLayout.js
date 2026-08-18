/**
 * Layout principal — La Citadelle Numérique
 * Navigation + Footer avec la charte graphique officielle
 * Couleurs: Bleu Citadelle #0F2747, Or #C9A45C
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Shield, ExternalLink, Menu, X, LogIn, LogOut,
  ChevronRight, Globe, ShoppingCart, Cloud, Monitor, Users,
  Mail, Phone, Bell
} from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import { CITADELLE_CONFIG, CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";
import citadelleApi from "@/services/citadelleApi";
import CitadelleChatWidget from "@/components/citadelle/CitadelleChatWidget";
import ModerationBanner from "@/components/citadelle/ModerationBanner";
import SellerNoticeModal from "@/components/citadelle/SellerNoticeModal";
import RecentSaleBanner from "@/components/citadelle/RecentSaleBanner";

// ── SVG Drapeaux (pas d'emoji — bug Windows/Chrome) ─────────────────────────
const FlagFR = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
    <rect width="7" height="14" fill="#002395"/>
    <rect x="7" width="6" height="14" fill="#EDEDED"/>
    <rect x="13" width="7" height="14" fill="#ED2939"/>
  </svg>
);
const FlagEN = () => (
  <svg width="20" height="14" viewBox="0 0 60 40" aria-hidden="true">
    <rect width="60" height="40" fill="#012169"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/>
  </svg>
);

// ── Sélecteur de langue ───────────────────────────────────────────────────────
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isEN = i18n.language === "en";
  return (
    <button
      onClick={() => i18n.changeLanguage(isEN ? "fr" : "en")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
      style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
      data-testid="lang-switcher"
      aria-label={isEN ? "Passer en français" : "Switch to English"}
    >
      {isEN ? <FlagFR /> : <FlagEN />}
      {isEN ? "FR" : "EN"}
    </button>
  );
};

// ── Navigation ───────────────────────────────────────────────────────────────

const CitadelleNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useCitadelleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [activityCount, setActivityCount] = useState(0);

  // Liens nav traduits
  const NAV_LINKS = [
    { href: "/citadelle/annonces", label: t("nav.listings") },
    { href: "/citadelle/vendre",   label: t("nav.sell") },
    { href: "/citadelle/services", label: t("nav.services") },
    { href: "/citadelle/parutions",label: t("nav.parutions") },
  ];

  useEffect(() => {
    if (!isAuthenticated) { setActivityCount(0); return; }
    const fetchCount = () => {
      citadelleApi.get("/member/activity")
        .then(res => setActivityCount(res.data.count || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/citadelle");
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: CITADELLE_COLORS.white,
          borderColor: CITADELLE_COLORS.border,
          boxShadow: "0 1px 12px rgba(15,39,71,0.06)"
        }}
        data-testid="citadelle-nav"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-32 flex items-center justify-between">
          {/* Logo */}
          <Link to="/citadelle" className="flex items-center gap-3" data-testid="citadelle-logo">
            <img src={CITADELLE_CONFIG.logo} alt={CITADELLE_CONFIG.name} className="h-28 w-auto" />
          </Link>

          {/* Liens desktop */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-semibold transition-colors duration-200"
                style={{
                  color: location.pathname === link.href ? CITADELLE_COLORS.gold : CITADELLE_COLORS.blue
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link
                  to="/citadelle/espace-membre"
                  className="relative p-2 rounded-lg transition-all hover:bg-black/5"
                  style={{ color: CITADELLE_COLORS.blue }}
                  data-testid="citadelle-nav-bell"
                  title={t("nav.notifications")}
                >
                  <Bell size={20} />
                  {activityCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
                      style={{ background: "#DC2626" }}
                      data-testid="citadelle-nav-bell-count"
                    >
                      {activityCount > 9 ? "9+" : activityCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/citadelle/espace-membre"
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                  style={{ color: CITADELLE_COLORS.gold, border: `1px solid ${CITADELLE_COLORS.gold}` }}
                  data-testid="citadelle-nav-espace"
                >
                  {t("nav.my_space")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-all"
                  style={{ color: CITADELLE_COLORS.textMuted }}
                  data-testid="citadelle-nav-logout"
                >
                  <LogOut size={15} />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/citadelle/connexion"
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                  style={{ color: CITADELLE_COLORS.blue }}
                  data-testid="citadelle-nav-login"
                >
                  <LogIn size={15} />
                  {t("nav.login")}
                </Link>
                <Link
                  to="/citadelle/inscription"
                  className="text-sm font-bold px-5 py-2.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="citadelle-nav-register"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* Hamburger mobile */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: CITADELLE_COLORS.blue }}
            data-testid="citadelle-mobile-toggle"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col pt-32 md:hidden"
          style={{ background: CITADELLE_COLORS.night }}
        >
          <div className="flex flex-col gap-2 p-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 rounded-lg text-base font-medium"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/citadelle/espace-membre"
                    onClick={() => setMenuOpen(false)}
                    className="text-center py-3 rounded-lg font-semibold"
                    style={{ border: `1px solid ${CITADELLE_COLORS.gold}`, color: CITADELLE_COLORS.gold }}
                  >
                    {t("nav.my_space")}
                  </Link>
                  <button onClick={handleLogout} className="py-3 rounded-lg text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/citadelle/connexion" onClick={() => setMenuOpen(false)} className="text-center py-3 rounded-lg" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {t("nav.login")}
                  </Link>
                  <Link
                    to="/citadelle/inscription"
                    onClick={() => setMenuOpen(false)}
                    className="text-center py-3 rounded-lg font-bold"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
              {/* Sélecteur de langue mobile */}
              <div className="flex justify-center mt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Footer ───────────────────────────────────────────────────────────────────

const CitadelleFooter = () => {
  const { t } = useTranslation();
  return (
  <footer style={{ background: CITADELLE_COLORS.night, borderTop: "1px solid rgba(201,164,92,0.2)" }} data-testid="citadelle-footer">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
        {/* Marque */}
        <div>
          <img src={CITADELLE_CONFIG.logo} alt={CITADELLE_CONFIG.name} className="h-14 w-auto mb-4" />
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            {CITADELLE_CONFIG.description}
          </p>
          <p className="text-xs mt-3 font-semibold tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>
            {t("footer.tagline")}
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>{t("footer.navigation")}</h4>
          <ul className="space-y-2">
            {[
              { href: "/citadelle/annonces", label: t("footer.links.listings") },
              { href: "/citadelle/vendre",   label: t("footer.links.sell") },
              { href: "/citadelle/services", label: t("footer.links.services") },
              { href: "/citadelle/blog",     label: t("footer.links.blog") },
            ].map(link => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm transition-colors hover:opacity-100" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services Vendeurs */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>{t("footer.sellers")}</h4>
          <ul className="space-y-2">
            {t("footer.seller_services", { returnObjects: true }).map(s => (
              <li key={s}>
                <Link to="/citadelle/services" className="text-sm transition-colors hover:opacity-100" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services Acheteurs */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>{t("footer.buyers")}</h4>
          <ul className="space-y-2">
            {t("footer.buyer_services", { returnObjects: true }).map(s => (
              <li key={s}>
                <Link to="/citadelle/services" className="text-sm transition-colors hover:opacity-100" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + Légal */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: CITADELLE_COLORS.gold }}>{t("footer.info")}</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/citadelle/contact" className="text-sm flex items-center gap-2 transition-colors hover:opacity-100" style={{ color: "rgba(255,255,255,0.55)" }}>
                <Mail size={13} />
                {t("footer.links.contact")}
              </Link>
            </li>
            <li>
              <a href="/informations-pour-les-ia" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.55)" }} data-testid="footer-infos-ia-link">
                {t("footer.links.ia_info")}
              </a>
            </li>
            <li>
              <a href="/aide" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.55)" }} data-testid="footer-aide-link">
                {t("footer.links.faq")}
              </a>
            </li>
            {[
              { href: "/citadelle/cgv",              label: t("footer.links.cgv") },
              { href: "/citadelle/cgu",              label: t("footer.links.cgu") },
              { href: "/citadelle/confidentialite",  label: t("footer.links.privacy") },
              { href: "/citadelle/mentions-legales", label: t("footer.links.legal") },
            ].map(link => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(201,164,92,0.15)" }}>
            <a
              href="https://syndicatducode.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium transition-all"
              style={{ color: "rgba(201,164,92,0.7)" }}
            >
              <Shield size={12} />
              {t("footer.syndicate")}
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} La Citadelle Numérique. {t("footer.copyright")}
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          {t("footer.tagline")}
        </p>
      </div>
    </div>
  </footer>
  );
};

// ── Layout principal ──────────────────────────────────────────────────────────

const CitadelleLayout = ({ children, pageTitle }) => {
  useCitadellePageMeta(pageTitle);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <CitadelleNav />
      <ModerationBanner />
      <RecentSaleBanner />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <CitadelleFooter />
      <CitadelleChatWidget />
      <SellerNoticeModal />
    </div>
  );
};

export default CitadelleLayout;
