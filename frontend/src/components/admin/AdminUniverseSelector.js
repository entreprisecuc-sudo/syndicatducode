/**
 * AdminUniverseSelector
 * Écran de sélection d'univers admin : Le Syndicat du Code | La Citadelle Numérique
 * Affiche les stats clés + actions en attente de chaque univers.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Users, Briefcase, Mail, CreditCard,
  Globe, ArrowLeftRight, FileText, Bell, AlertCircle,
} from "lucide-react";
import api from "@/services/api";

const UNIVERSE_KEY = "admin_selected_universe";

// ── Mini carte de stat ──────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl"
    style={{ background: "rgba(255,255,255,0.06)" }}>
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}22` }}>
      <Icon size={15} style={{ color }} />
    </div>
    <div>
      <p className="text-xs opacity-60 text-white">{label}</p>
      <p className="text-base font-black text-white leading-tight">{value ?? "—"}</p>
    </div>
  </div>
);

// ── Pastille d'action à faire ───────────────────────────────────────────────
const ActionBadge = ({ count, label, urgent }) => {
  if (!count) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: urgent ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.18)" }}>
      <AlertCircle size={13} style={{ color: urgent ? "#f87171" : "#fbbf24" }} />
      <span className="text-xs font-semibold text-white">
        {count} {label}
      </span>
    </div>
  );
};

export default function AdminUniverseSelector() {
  const navigate = useNavigate();
  const [syndicatStats, setSyndicatStats] = useState(null);
  const [citadelleStats, setCitadelleStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(r => setSyndicatStats(r.data)).catch(() => {});
    api.get("/admin/citadelle-stats").then(r => setCitadelleStats(r.data)).catch(() => {});
  }, []);

  const goTo = (universe, path) => {
    localStorage.setItem(UNIVERSE_KEY, universe);
    window.dispatchEvent(new Event("admin_universe_changed"));
    navigate(path);
  };

  const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1a1f35 100%)" }}>

      {/* Titre */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2"
          style={{ color: "rgba(255,255,255,0.4)" }}>ADMINISTRATION</p>
        <h1 className="text-3xl font-black text-white">Choisir un univers</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          Sélectionnez l'espace d'administration à gérer
        </p>
      </div>

      {/* Deux panneaux */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Panneau Le Syndicat du Code ───────────────────────────────── */}
        <div className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1f1035 0%, #0d1b3e 100%)",
                   border: "1px solid rgba(233,69,96,0.25)", boxShadow: "0 8px 40px rgba(233,69,96,0.12)" }}>

          {/* Header */}
          <div className="p-6 pb-4"
            style={{ background: "linear-gradient(135deg, rgba(233,69,96,0.2) 0%, rgba(31,64,104,0.3) 100%)" }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(233,69,96,0.25)" }}>
                <Briefcase size={18} style={{ color: "#e94560" }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white leading-tight">Le Syndicat du Code</h2>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Plateforme développeurs & commerciaux</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-5 grid grid-cols-2 gap-3 flex-1">
            <Stat icon={Users}      label="Utilisateurs actifs"   value={syndicatStats?.users?.active}                  color="#e94560" />
            <Stat icon={Briefcase}  label="Projets ouverts"       value={syndicatStats?.projects?.open}                 color="#6366f1" />
            <Stat icon={Mail}       label="Contacts en attente"   value={syndicatStats?.contacts?.pending}              color="#f59e0b" />
            <Stat icon={CreditCard} label="Abonnés actifs"        value={syndicatStats?.subscriptions?.subscriptions_active} color="#10b981" />
          </div>

          {/* Actions à faire */}
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            <ActionBadge count={syndicatStats?.contacts?.pending}            label="contact(s) en attente"   urgent={false} />
            <ActionBadge count={syndicatStats?.projects?.candidatures}       label="candidature(s)"          urgent={false} />
            <ActionBadge count={syndicatStats?.users?.pending}               label="compte(s) à valider"     urgent={true}  />
          </div>

          {/* CTA */}
          <div className="p-5 pt-0">
            <button
              onClick={() => goTo("syndicat", "/syndicat-admin/syndicat-home")}
              data-testid="access-syndicat-btn"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #e94560, #6366f1)", color: "white" }}>
              Accéder au Syndicat
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Panneau La Citadelle Numérique ────────────────────────────── */}
        <div className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f2747 100%)",
                   border: "1px solid rgba(201,164,92,0.3)", boxShadow: "0 8px 40px rgba(201,164,92,0.1)" }}>

          {/* Header */}
          <div className="p-6 pb-4"
            style={{ background: "linear-gradient(135deg, rgba(201,164,92,0.15) 0%, rgba(15,39,71,0.4) 100%)" }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(201,164,92,0.2)" }}>
                <Globe size={18} style={{ color: "#C9A45C" }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white leading-tight">La Citadelle Numérique</h2>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Marketplace d'actifs numériques</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-5 grid grid-cols-2 gap-3 flex-1">
            <Stat icon={Globe}          label="Annonces actives"        value={citadelleStats?.listings?.active}              color="#C9A45C" />
            <Stat icon={ArrowLeftRight} label="Transactions en cours"   value={citadelleStats?.transactions?.active}          color="#60a5fa" />
            <Stat icon={Bell}           label="Abonnés newsletter"      value={citadelleStats?.newsletter?.subscribers}       color="#a78bfa" />
            <Stat icon={FileText}       label={`CA total`}              value={fmt(citadelleStats?.invoices?.ca_total)}       color="#34d399" />
          </div>

          {/* Actions à faire */}
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            <ActionBadge count={citadelleStats?.listings?.pending_validation}   label="annonce(s) à valider"         urgent={false} />
            <ActionBadge count={citadelleStats?.transactions?.awaiting_admin}   label="transaction(s) en attente"    urgent={true}  />
            <ActionBadge count={citadelleStats?.services?.orders_pending}       label="commande(s) service en att."  urgent={false} />
          </div>

          {/* CTA */}
          <div className="p-5 pt-0">
            <button
              onClick={() => goTo("citadelle", "/syndicat-admin/citadelle")}
              data-testid="access-citadelle-btn"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #C9A45C, #0F2747)", color: "white" }}>
              Accéder à la Citadelle
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Note utilisateurs partagés */}
      <p className="mt-8 text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
        La gestion des utilisateurs est accessible depuis les deux univers
      </p>
    </div>
  );
}
