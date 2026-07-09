/**
 * Analytics — La Citadelle Numérique (back-office)
 * LOT 1 : visiteurs uniques, pages vues, utilisateurs actifs, courbe temporelle,
 * top pages, conversations entamées par annonce.
 */

import { useState, useEffect } from "react";
import {
  BarChart3, Users, Eye, MousePointerClick, MessageSquare, Smartphone, Monitor, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const GOLD = "#C9A45C";

const PERIODS = [
  { key: "24h", label: "24 h" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 jours" },
];
const SCOPES = [
  { key: "all", label: "Tout le site" },
  { key: "citadelle", label: "La Citadelle" },
  { key: "syndicat", label: "Syndicat du Code" },
];

const fmtDay = (d) => {
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
};

function KpiCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
      data-testid={`kpi-${label}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
          <Icon size={16} style={{ color: GOLD }} />
        </div>
        <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <span className="text-2xl font-bold">{value ?? "—"}</span>
      {hint && <span className="text-xs opacity-60">{hint}</span>}
    </div>
  );
}

export default function AdminCitadelleAnalytics() {
  const [period, setPeriod] = useState("7d");
  const [scope, setScope] = useState("all");
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [pages, setPages] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { period, scope };
        const [ov, ts, tp, eng] = await Promise.all([
          api.get("/citadelle/admin/analytics/overview", { params }),
          api.get("/citadelle/admin/analytics/timeseries", { params }),
          api.get("/citadelle/admin/analytics/top-pages", { params: { ...params, limit: 15 } }),
          api.get("/citadelle/admin/analytics/listings-engagement", { params: { limit: 15 } }),
        ]);
        setOverview(ov.data);
        setSeries(ts.data.series || []);
        setPages(tp.data.pages || []);
        setEngagement(eng.data.listings || []);
      } catch (err) {
        console.error("Erreur chargement analytics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [period, scope]);

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-citadelle-analytics">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
            <BarChart3 size={18} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Statistiques de fréquentation</h1>
            <p className="text-xs opacity-60">Suivi anonyme et respectueux du RGPD (adresses IP hachées, jamais stockées en clair).</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2" data-testid="analytics-period">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: period === p.key ? GOLD : "var(--admin-bg-card, rgba(255,255,255,0.05))",
                  color: period === p.key ? "#081729" : "inherit",
                  border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                }}
                data-testid={`period-${p.key}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2" data-testid="analytics-scope">
            {SCOPES.map((s) => (
              <button key={s.key} onClick={() => setScope(s.key)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: scope === s.key ? "rgba(201,164,92,0.2)" : "transparent",
                  color: scope === s.key ? GOLD : "inherit",
                  border: `1px solid ${scope === s.key ? GOLD : "var(--admin-border, rgba(255,255,255,0.1))"}`,
                }}
                data-testid={`scope-${s.key}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center opacity-60" data-testid="analytics-loading">Chargement…</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard icon={Eye} label="Pages vues" value={overview?.page_views} />
              <KpiCard icon={Users} label="Visiteurs uniques" value={overview?.unique_visitors} />
              <KpiCard icon={MousePointerClick} label="Sessions" value={overview?.sessions} />
              <KpiCard icon={TrendingUp} label="Membres actifs" value={overview?.active_users} hint="connectés" />
              <KpiCard icon={MessageSquare} label="Conversations" value={overview?.conversations_started} hint="entamées (période)" />
              <KpiCard icon={Smartphone} label="Mobile / Desktop"
                value={`${overview?.devices?.mobile ?? 0} / ${overview?.devices?.desktop ?? 0}`} />
            </div>

            {/* Courbe temporelle */}
            <div className="rounded-xl p-4"
              style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
              data-testid="analytics-timeseries">
              <h2 className="text-sm font-semibold mb-4 opacity-80">Vues et visiteurs par jour</h2>
              {series.length === 0 ? (
                <p className="text-sm opacity-60 py-10 text-center">Aucune donnée sur cette période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} />
                    <Tooltip
                      labelFormatter={fmtDay}
                      contentStyle={{ background: "#081729", border: `1px solid ${GOLD}`, borderRadius: 8, fontSize: 12 }}
                      formatter={(v, n) => [v, n === "views" ? "Pages vues" : "Visiteurs"]}
                    />
                    <Area type="monotone" dataKey="views" stroke={GOLD} fill="url(#gViews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="visitors" stroke="#3B82F6" fill="url(#gVis)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top pages + Engagement annonces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl p-4"
                style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
                data-testid="analytics-top-pages">
                <h2 className="text-sm font-semibold mb-3 opacity-80">Pages les plus vues</h2>
                {pages.length === 0 ? (
                  <p className="text-sm opacity-60 py-6 text-center">Aucune donnée.</p>
                ) : (
                  <div className="space-y-1">
                    {pages.map((p) => (
                      <div key={p.path} className="flex items-center justify-between gap-3 py-1.5 border-b" style={{ borderColor: "var(--admin-border, rgba(255,255,255,0.06))" }}>
                        <span className="text-sm truncate opacity-90" title={p.path}>{p.path}</span>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {p.views} <span className="opacity-50 font-normal text-xs">vues · {p.visitors} visit.</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl p-4"
                style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
                data-testid="analytics-listings-engagement">
                <h2 className="text-sm font-semibold mb-3 opacity-80">Annonces avec le plus d'échanges</h2>
                {engagement.length === 0 ? (
                  <p className="text-sm opacity-60 py-6 text-center">Aucune conversation pour l'instant.</p>
                ) : (
                  <div className="space-y-1">
                    {engagement.map((l) => (
                      <div key={l.listing_id} className="flex items-center justify-between gap-3 py-1.5 border-b" style={{ borderColor: "var(--admin-border, rgba(255,255,255,0.06))" }}>
                        <span className="text-sm truncate opacity-90" title={l.listing_title}>{l.listing_title || l.listing_slug}</span>
                        <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                          <MessageSquare size={13} style={{ color: GOLD }} /> {l.conversations}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
