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
} from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import MemberActivityPanel from "@/components/citadelle/MemberActivityPanel";
import MemberEarningsPanel from "@/components/citadelle/MemberEarningsPanel";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const C = CITADELLE_COLORS;

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
  const { user, logout, isAuthenticated } = useCitadelleAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages]         = useState(0);
  const [unreadTransactions, setUnreadTransactions] = useState(0);
  const [activeListings, setActiveListings]         = useState(0);

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
        setActiveListings((resListings.data.listings || []).filter((l) => l.status === "active").length);
      } catch { /* silence */ }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    navigate("/citadelle/connexion");
    return null;
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
                    Espace Membre
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Bonjour, {user?.first_name || "Membre"} !
                </h1>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Bienvenue sur votre espace La Citadelle Numérique
                </p>
              </div>
              <button
                onClick={() => { logout(); navigate("/citadelle"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                data-testid="citadelle-member-logout"
              >
                <LogOut size={15} />
                Déconnexion
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
                <p className="text-base font-bold text-white leading-tight">Publier une annonce</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>Mettez votre actif en vente</p>
              </div>
            </Link>

            <KpiCard icon={LayoutList} label="Annonces actives" value={activeListings}
              href="/citadelle/espace-membre/mes-annonces" testId="kpi-annonces-actives" />
            <KpiCard icon={ArrowRightLeft} label="Transactions en cours" value={unreadTransactions}
              href="/citadelle/espace-membre/transactions" testId="kpi-transactions" />
            <KpiCard icon={MessageSquare} label="Messages non lus" value={unreadMessages}
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
                  Administration
                </h2>
                <div className="flex flex-col gap-3">
                  <SectionLink icon={User} title="Mon profil" desc="Modifier mes informations"
                    href="/citadelle/espace-membre/profil" testId="nav-mon-profil" />
                  <SectionLink icon={FileText} title="Mes factures" desc="Téléchargez vos PDF"
                    href="/citadelle/espace-membre/factures" testId="nav-mes-factures" />
                </div>
              </div>

              {/* Gestion & Services */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: C.blue }}>
                  Gestion & Services
                </h2>
                <div className="flex flex-col gap-3">
                  <SectionLink icon={ShieldCheck} title="Mes transmissions" desc="Vos attestations de La Garde"
                    href="/citadelle/espace-membre/transmissions" testId="nav-mes-transmissions" />
                  <SectionLink icon={Briefcase} title="Mes services" desc="Évaluations et audits"
                    href="/citadelle/espace-membre/mes-services" testId="nav-mes-services" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CitadelleLayout>
  );
}
