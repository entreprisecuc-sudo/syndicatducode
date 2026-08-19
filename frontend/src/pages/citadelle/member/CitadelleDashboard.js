/**
 * Espace membre — La Citadelle Numérique
 * Tableau de bord repensé : en-tête premium, rangée de KPI cliquables,
 * puis un split "Gestion & Services" / "Administration".
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, LogOut, PlusCircle, LayoutList, ArrowRightLeft,
  MessageSquare, ShieldCheck, Briefcase, User, FileText, ChevronRight,
  Eye, Edit2, Clock, CheckCircle, ShoppingBag, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import { useCitadelleModeration } from "@/hooks/useCitadelleModeration";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import MemberActivityPanel from "@/components/citadelle/MemberActivityPanel";
import MemberEarningsPanel from "@/components/citadelle/MemberEarningsPanel";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const C = CITADELLE_COLORS;

/* Clés de raison de retrait — le label est résolu via t() dans le rendu */
const WITHDRAW_REASONS = [
  { key: "sold" },
  { key: "not_exist" },
  { key: "no_longer_selling" },
];

/* Carte KPI cliquable — chiffre clé + libellé, navigue au clic */
function KpiCard({ icon: Icon, label, value, href, testId }) {
  return (
    <Link
      to={href}
      data-testid={testId}
      className="group flex flex-col justify-between p-5 rounded-2xl bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      style={{ border: `1px solid ${C.border}` }}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(201,164,92,0.1)" }}>
          <Icon size={20} strokeWidth={1.5} style={{ color: C.gold }} />
        </div>
        <ChevronRight size={18} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
          style={{ color: C.blue }} />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold leading-none" style={{ color: C.blue }}>{value}</p>
        <p className="text-sm mt-1.5" style={{ color: C.textMuted }}>{label}</p>
      </div>
    </Link>
  );
}

/* Ligne d'accès à une section (colonnes Gestion / Administration) */
function SectionLink({ icon: Icon, title, desc, href, testId }) {
  return (
    <Link
      to={href}
      data-testid={testId}
      className="group flex items-center gap-4 p-4 rounded-xl bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: `1px solid ${C.border}` }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(15,39,71,0.06)" }}>
        <Icon size={20} strokeWidth={1.5} style={{ color: C.blue }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm transition-colors group-hover:text-[#C9A45C]" style={{ color: C.blue }}>{title}</p>
        <p className="text-xs truncate" style={{ color: C.textMuted }}>{desc}</p>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
        style={{ color: C.blue }} />
    </Link>
  );
}

export default function CitadelleDashboard() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useCitadelleAuth();
  const { banned } = useCitadelleModeration();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages]         = useState(0);
  const [unreadTransactions, setUnreadTransactions] = useState(0);
  const [activeListings, setActiveListings]         = useState(0);
  const [myListings, setMyListings]                 = useState([]);
  const [withdrawModal, setWithdrawModal]           = useState({ open: false, listingId: null, listingTitle: "" });
  const [withdrawReason, setWithdrawReason]         = useState(null);
  const [withdrawing, setWithdrawing]               = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCounts = async () => {
      try {
        const [resMsg, resTx, resListings] = await Promise.all([
          citadelleApi.get("/messages-unread-count"),
          citadelleApi.get("/transactions/unread-count"),
          citadelleApi.get("/listings/my"),
        ]);
        setUnreadMessages(resMsg.data.unread || 0);
        setUnreadTransactions(resTx.data.unread || 0);
        const listings = resListings.data.listings || [];
        setActiveListings(listings.filter((l) => l.status === "active").length);
        setMyListings(listings.filter((l) => ["active", "pending"].includes(l.status)));
      } catch { /* silence */ }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const openWithdrawModal = (listing) => {
    setWithdrawReason(null);
    setWithdrawModal({ open: true, listingId: listing.id, listingTitle: listing.title });
  };

  const handleWithdraw = async () => {
    if (!withdrawReason) return;
    setWithdrawing(true);
    try {
      await citadelleApi.post(`/listings/${withdrawModal.listingId}/withdraw`, { reason: withdrawReason });
      setMyListings((prev) => prev.filter((l) => l.id !== withdrawModal.listingId));
      setWithdrawModal({ open: false, listingId: null, listingTitle: "" });
      setWithdrawReason(null);
    } catch { /* silence */ }
    finally { setWithdrawing(false); }
  };

  if (!isAuthenticated) {
    navigate("/citadelle/connexion");
    return null;
  }

  // Membre banni : accès strictement limité aux factures et documents de transmission.
  if (banned) {
    return (
      <CitadelleLayout>
        <div className="min-h-screen py-10 px-4" style={{ background: C.bg }}>
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-2xl bg-white" style={{ border: `1px solid ${C.border}` }} data-testid="banned-restricted-view">
              <h1 className="text-xl font-bold mb-2" style={{ color: C.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {t('member.banned_title')}
              </h1>
              <p className="text-sm mb-6" style={{ color: C.textMuted }}>
                {t('member.banned_desc')}
              </p>
              <div className="space-y-3">
                <SectionLink icon={FileText} title={t('member.nav_invoices_title')} desc={t('member.banned_invoices_desc')}
                  href="/citadelle/espace-membre/factures" testId="banned-link-invoices" />
                <SectionLink icon={ShieldCheck} title={t('member.banned_transmissions_title')} desc={t('member.banned_transmissions_desc')}
                  href="/citadelle/espace-membre/transmissions" testId="banned-link-transmissions" />
              </div>
              <button
                onClick={() => { logout(); navigate("/citadelle"); }}
                className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                style={{ border: `1px solid ${C.border}`, color: C.textMuted }}
                data-testid="banned-logout">
                <LogOut size={15} /> {t('member.logout')}
              </button>
            </div>
          </div>
        </div>
      </CitadelleLayout>
    );
  }

  return (
    <CitadelleLayout>
      <div className="min-h-screen py-10 px-4" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto">

          {/* ── En-tête (validé) ─────────────────────────────── */}
          <div className="mb-8 p-8 rounded-2xl" style={{ background: `linear-gradient(135deg, ${C.night} 0%, ${C.blue} 100%)` }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} style={{ color: C.gold }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.gold }}>
                    {t('member.space_badge')}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {t('member.hello', { name: user?.first_name || 'Membre' })}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {t('member.welcome_sub')}
                </p>
              </div>
              <button
                onClick={() => { logout(); navigate("/citadelle"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                data-testid="citadelle-member-logout"
              >
                <LogOut size={15} />
                {t('member.logout')}
              </button>
            </div>

            {/* "À traiter" — 3 dernières notifications, sur fond bleu */}
            <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <MemberActivityPanel dark limit={3} viewAllHref="/citadelle/espace-membre/notifications" />
            </div>
          </div>

          {/* ── Rangée KPI + CTA ─────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* CTA principal — fond Navy plein, placé en tête à gauche */}
            <Link
              to="/citadelle/espace-membre/mes-annonces/creer"
              data-testid="cta-publier-annonce"
              className="group flex flex-col justify-between p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: C.blue, border: `1px solid ${C.blue}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(201,164,92,0.18)" }}>
                <PlusCircle size={22} strokeWidth={1.5} style={{ color: C.gold }} />
              </div>
              <div className="mt-4">
                <p className="text-base font-bold text-white leading-tight">{t('member.publish_cta')}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{t('member.publish_cta_sub')}</p>
              </div>
            </Link>

            <KpiCard icon={LayoutList} label={t('member.kpi_listings')} value={activeListings}
              href="/citadelle/espace-membre/mes-annonces" testId="kpi-annonces-actives" />
            <KpiCard icon={ArrowRightLeft} label={t('member.kpi_transactions')} value={unreadTransactions}
              href="/citadelle/espace-membre/transactions" testId="kpi-transactions" />
            <KpiCard icon={MessageSquare} label={t('member.kpi_messages')} value={unreadMessages}
              href="/citadelle/espace-membre/messages" testId="kpi-messages" />
          </div>

          {/* ── Contenu principal : pleine largeur ───────────── */}
          <div className="space-y-8">
            <MemberEarningsPanel />

            {/* Administration (gauche) + Gestion & Services (droite) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Administration — encadré bleu */}
              <div className="rounded-2xl p-5 md:p-6" style={{ border: `2px solid ${C.blue}`, background: "rgba(15,39,71,0.02)" }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: C.blue }}>
                  {t('member.section_admin')}
                </h2>
                <div className="flex flex-col gap-3">
                  <SectionLink icon={User} title={t('member.nav_profile_title')} desc={t('member.nav_profile_desc')}
                    href="/citadelle/espace-membre/profil" testId="nav-mon-profil" />
                  <SectionLink icon={FileText} title={t('member.nav_invoices_title')} desc={t('member.nav_invoices_desc')}
                    href="/citadelle/espace-membre/factures" testId="nav-mes-factures" />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: C.blue }}>
                  {t('member.section_management')}
                </h2>
                <div className="flex flex-col gap-3">
                  <SectionLink icon={ShieldCheck} title={t('member.nav_transmissions_title')} desc={t('member.nav_transmissions_desc')}
                    href="/citadelle/espace-membre/transmissions" testId="nav-mes-transmissions" />
                  <SectionLink icon={Briefcase} title={t('member.nav_services_title')} desc={t('member.nav_services_desc')}
                    href="/citadelle/espace-membre/mes-services" testId="nav-mes-services" />
                </div>
              </div>
            </div>

            {/* ── Annonces en cours de publication ──────────────────── */}
            <div className="rounded-2xl p-5 md:p-6" style={{ border: `1.5px solid ${C.border}`, background: "white" }}
              data-testid="dashboard-active-listings">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.blue }}>
                  {t('member.active_listings_title')}
                </h2>
                <Link to="/citadelle/espace-membre/mes-annonces"
                  className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: C.gold }}>
                  {t('member.all_listings_link')} <ChevronRight size={13} />
                </Link>
              </div>

              {myListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(201,164,92,0.08)" }}>
                    <LayoutList size={22} strokeWidth={1.5} style={{ color: C.gold }} />
                  </div>
                  <p className="text-sm text-center" style={{ color: C.textMuted }}>
                    {t('member.empty_listings')}
                  </p>
                  <Link to="/citadelle/espace-membre/mes-annonces/creer"
                    className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: C.blue, color: "white" }}>
                    {t('member.publish_cta')}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myListings.map((listing) => {
                    const isActive  = listing.status === "active";
                    const isPending = listing.status === "pending";
                    return (
                      <div key={listing.id}
                        className="flex items-center gap-4 p-3 rounded-xl"
                        style={{ background: C.bg, border: `1px solid ${C.border}` }}
                        data-testid={`dashboard-listing-${listing.id}`}>

                        {/* Vignette */}
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{ background: "#E8EEF5" }}>
                          {listing.images?.[0]
                            ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">🏷️</div>
                          }
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: C.blue }}>
                            {listing.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Badge statut */}
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: isActive ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                                color:      isActive ? "#16A34A" : "#B45309",
                              }}>
                              {isPending && <Clock size={11} />}
                              {isActive ? t('member.status_published') : t('member.status_pending_validation')}
                            </span>
                            {listing.price && (
                              <span className="text-xs font-bold" style={{ color: C.gold }}>
                                {Number(listing.price).toLocaleString("fr-FR")} €
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isActive && (
                            <Link to={`/citadelle/annonces/${listing.slug}`}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{ background: "rgba(15,39,71,0.06)", color: C.blue }}
                              title={t('member.action_view')}>
                              <Eye size={14} />
                            </Link>
                          )}
                          <Link to={`/citadelle/espace-membre/mes-annonces/${listing.id}/modifier`}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: "rgba(15,39,71,0.06)", color: C.blue }}
                            title={t('member.action_edit')}>
                            <Edit2 size={14} />
                          </Link>
                          <button onClick={() => openWithdrawModal(listing)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(100,116,139,0.1)", color: "#64748B" }}
                            title={t('member.action_withdraw')}
                            data-testid={`dashboard-withdraw-btn-${listing.id}`}>
                            <LogOut size={13} /> {t('member.action_withdraw')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── Modal retrait annonce ─────────────────────────────────────────── */}
      {withdrawModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,23,41,0.75)" }}
          data-testid="dashboard-withdraw-modal">
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "white", boxShadow: "0 24px 64px rgba(15,39,71,0.25)" }}>
            {/* En-tête modal */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: C.night, borderBottom: `1px solid rgba(201,164,92,0.2)` }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: C.gold }}>{t('member.withdraw_modal_badge')}</p>
                <h2 className="text-base font-black text-white">{t('member.withdraw_modal_title')}</h2>
              </div>
              <button onClick={() => setWithdrawModal({ open: false, listingId: null, listingTitle: "" })}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: "white" }}
                data-testid="dashboard-withdraw-modal-close">
                <X size={18} />
              </button>
            </div>
            {/* Corps modal */}
            <div className="px-6 py-5">
              <p className="text-sm mb-1" style={{ color: C.textMuted }}>{t('member.withdraw_listing_label')}</p>
              <p className="text-sm font-bold mb-5 truncate" style={{ color: C.blue }}>
                "{withdrawModal.listingTitle}"
              </p>
              <p className="text-sm font-semibold mb-3" style={{ color: C.blue }}>
                {t('member.withdraw_reason_question')}
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {WITHDRAW_REASONS.map(({ key }) => (
                  <button key={key}
                    onClick={() => setWithdrawReason(key)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                    style={{
                      border: `1.5px solid ${withdrawReason === key ? C.blue : C.border}`,
                      background: withdrawReason === key ? "rgba(15,39,71,0.05)" : "white",
                      color: C.blue,
                      fontWeight: withdrawReason === key ? "600" : "400",
                    }}>
                    <span className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                      style={{ borderColor: withdrawReason === key ? C.blue : C.border }}>
                      {withdrawReason === key && (
                        <span className="w-2 h-2 rounded-full" style={{ background: C.blue }} />
                      )}
                    </span>
                    {t(`member.withdraw_reason_${key}`)}
                  </button>
                ))}
              </div>
              <button onClick={handleWithdraw}
                disabled={!withdrawReason || withdrawing}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: C.blue, color: "white" }}
                data-testid="dashboard-withdraw-confirm-btn">
                {withdrawing ? t('member.withdraw_loading') : t('member.withdraw_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </CitadelleLayout>
  );
}
