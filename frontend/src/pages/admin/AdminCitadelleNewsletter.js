/**
 * Page Admin — Newsletter La Citadelle Numérique
 * Gestion des abonnés, configuration scheduler, aperçu intégré, historique avec stats
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail, Users, Settings, Send, Eye, Trash2, RefreshCw,
  CheckCircle, AlertCircle, Bell, ToggleLeft, ToggleRight,
  BarChart2, TrendingUp, MousePointer, X, History
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

// ── Constantes ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const FREQUENCY_LABELS = { weekly: "Hebdomadaire", biweekly: "Bi-hebdomadaire", monthly: "Mensuelle" };
const FREQUENCY_OPTIONS = [
  { value: "weekly",   label: "Hebdomadaire (toutes les semaines)" },
  { value: "biweekly", label: "Bi-hebdomadaire (toutes les 2 semaines)" },
  { value: "monthly",  label: "Mensuelle (une fois par mois)" },
];

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDateShort = (iso) => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ── Composant principal ─────────────────────────────────────────────────────────

export default function AdminCitadelleNewsletter() {
  const [activeTab, setActiveTab]     = useState("config");
  const [stats, setStats]             = useState({ total: 0, active: 0, inactive: 0 });
  const [subscribers, setSubscribers] = useState([]);
  const [config, setConfig]           = useState(null);
  const [configForm, setConfigForm]   = useState(null);
  const [history, setHistory]         = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Aperçu intégré
  const [previewHtml, setPreviewHtml]         = useState("");
  const [previewLoading, setPreviewLoading]   = useState(false);
  const [historyPreviewHtml, setHistoryPreviewHtml] = useState("");
  const [historyPreviewOpen, setHistoryPreviewOpen] = useState(false);
  const [historyPreviewTitle, setHistoryPreviewTitle] = useState("");

  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  const previewIframeRef = useRef(null);

  // ── Chargement ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, configRes] = await Promise.all([
        api.get("/citadelle/admin/newsletter/subscribers"),
        api.get("/citadelle/admin/newsletter/config"),
      ]);
      setStats(subsRes.data.stats);
      setSubscribers(subsRes.data.subscribers);
      setConfig(configRes.data);
      setConfigForm(configRes.data);
    } catch (err) {
      showToast("error", "Erreur lors du chargement des données newsletter.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await api.get("/citadelle/admin/newsletter/preview");
      setPreviewHtml(res.data);
    } catch (err) {
      setPreviewHtml("<p style='padding:40px;color:#999;text-align:center;'>Impossible de charger l'aperçu. Aucune annonce active ?</p>");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/citadelle/admin/newsletter/history");
      setHistory(res.data.history || []);
      setHistoryLoaded(true);
    } catch (err) {
      showToast("error", "Erreur lors du chargement de l'historique.");
    }
  }, []);

  useEffect(() => {
    loadData();
    loadPreview(); // Chargement de l'aperçu au montage du composant
  }, [loadData, loadPreview]);

  useEffect(() => {
    if (activeTab === "history" && !historyLoaded) {
      loadHistory();
    }
  }, [activeTab, historyLoaded, loadHistory]);

  // ── Helpers UI ────────────────────────────────────────────────────────────────

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleSendNow = async () => {
    if (!window.confirm("Déclencher l'envoi immédiat du digest newsletter aux abonnés actifs ?")) return;
    setActionLoading(true);
    try {
      await api.post("/citadelle/admin/newsletter/send-now");
      showToast("success", "Envoi déclenché ! Les emails partiront dans quelques instants.");
      setTimeout(() => { setHistoryLoaded(false); if (activeTab === "history") loadHistory(); }, 5000);
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.patch("/citadelle/admin/newsletter/config", {
        frequency:    configForm.frequency,
        day_of_week:  parseInt(configForm.day_of_week),
        hour:         parseInt(configForm.hour),
        max_listings: parseInt(configForm.max_listings),
        is_active:    configForm.is_active,
      });
      setConfig(res.data);
      setConfigForm(res.data);
      showToast("success", "Configuration mise à jour et scheduler reprogrammé.");
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Erreur lors de la sauvegarde.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubscriber = async (subId, email) => {
    if (!window.confirm(`Supprimer l'abonné ${email} ?`)) return;
    try {
      await api.delete(`/citadelle/admin/newsletter/subscribers/${subId}`);
      setSubscribers((prev) => prev.filter((s) => s.id !== subId));
      showToast("success", "Abonné supprimé.");
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Erreur lors de la suppression.");
    }
  };

  const handleOpenHistoryPreview = async (historyId, sentAt) => {
    setHistoryPreviewTitle(`Newsletter du ${fmtDateShort(sentAt)}`);
    setHistoryPreviewHtml("");
    setHistoryPreviewOpen(true);
    try {
      const res = await api.get(`/citadelle/admin/newsletter/history/${historyId}/preview`);
      setHistoryPreviewHtml(res.data);
    } catch {
      setHistoryPreviewHtml("<p style='padding:40px;color:#999;text-align:center;'>Impossible de charger cet envoi.</p>");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-newsletter-page">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl"
            style={{
              background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.4)" : "rgba(220,38,38,0.4)"}`,
              color:  toast.type === "success" ? "#22C55E" : "#DC2626",
            }}
          >
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Modal aperçu historique */}
        {historyPreviewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            data-testid="admin-newsletter-history-preview-modal"
          >
            <div
              className="relative w-full rounded-2xl overflow-hidden flex flex-col"
              style={{
                maxWidth: "680px",
                maxHeight: "90vh",
                background: "#0F2747",
                border: "1px solid rgba(201,164,92,0.3)",
              }}
            >
              {/* Header modal */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "#C9A45C" }}>Aperçu</p>
                  <p className="text-xs opacity-60">{historyPreviewTitle}</p>
                </div>
                <button
                  onClick={() => setHistoryPreviewOpen(false)}
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <X size={18} />
                </button>
              </div>
              {/* Corps modal */}
              <div className="flex-1 overflow-hidden">
                {!historyPreviewHtml ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "#C9A45C", borderTopColor: "transparent" }} />
                  </div>
                ) : (
                  <iframe
                    srcDoc={historyPreviewHtml}
                    title={historyPreviewTitle}
                    style={{ width: "100%", height: "calc(90vh - 80px)", border: "none", display: "block" }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(201,164,92,0.15)" }}>
              <Bell size={20} style={{ color: "#C9A45C" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Newsletter Citadelle
              </h1>
              <p className="text-sm opacity-60">Alertes annonces hebdomadaires</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadPreview(); showToast("success", "Aperçu actualisé."); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ border: "1px solid rgba(201,164,92,0.4)", color: "#C9A45C" }}
              data-testid="admin-newsletter-refresh-preview-btn"
            >
              <RefreshCw size={14} />
              Actualiser l'aperçu
            </button>
            <button
              onClick={handleSendNow}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "#C9A45C", color: "#0F2747" }}
              data-testid="admin-newsletter-send-now-btn"
            >
              <Send size={15} />
              {actionLoading ? "Envoi..." : "Envoyer maintenant"}
            </button>
          </div>
        </div>

        {/* ── Stats rapides ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total abonnés",  value: stats.total,    icon: Users,       color: "#C9A45C" },
            { label: "Actifs",         value: stats.active,   icon: CheckCircle, color: "#22C55E" },
            { label: "Désabonnés",     value: stats.inactive, icon: AlertCircle, color: "#F59E0B" },
            { label: "Envois totaux",  value: history.length, icon: History,     color: "#818CF8" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl"
              style={{
                background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                border:     "1px solid var(--admin-border, rgba(255,255,255,0.1))",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={15} style={{ color }} />
                <span className="text-xs opacity-50">{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color, fontFamily: "'Montserrat', sans-serif" }}>
                {loading && label !== "Envois totaux" ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Layout principal : Gauche (tabs) + Droite (aperçu intégré) ────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* ── Colonne gauche — Tabs config/abonnés/historique ─────────────── */}
          <div className="space-y-4">

            {/* Sélecteur d'onglets */}
            <div className="flex gap-1 p-1 rounded-xl w-fit"
              style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))" }}>
              {[
                { key: "config",      label: "Configuration",             icon: Settings },
                { key: "subscribers", label: `Abonnés (${stats.active})`, icon: Users    },
                { key: "history",     label: "Historique",                icon: History  },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === key ? "#C9A45C" : "transparent",
                    color:      activeTab === key ? "#0F2747" : "inherit",
                  }}
                  data-testid={`admin-newsletter-tab-${key}`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Onglet Configuration ─────────────────────────────────────── */}
            {activeTab === "config" && configForm && (
              <form onSubmit={handleSaveConfig} className="space-y-4"
                data-testid="admin-newsletter-config-form">
                <div
                  className="p-5 rounded-xl space-y-4"
                  style={{
                    background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                    border:     "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                  }}
                >
                  <h2 className="text-xs font-semibold uppercase tracking-wider opacity-50">
                    Paramètres du scheduler
                  </h2>

                  {/* Toggle actif */}
                  <div className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div>
                      <p className="text-sm font-medium">Envoi automatique</p>
                      <p className="text-xs opacity-50 mt-0.5">Activer ou désactiver</p>
                    </div>
                    <button type="button"
                      onClick={() => setConfigForm({ ...configForm, is_active: !configForm.is_active })}
                      data-testid="admin-newsletter-toggle-active">
                      {configForm.is_active
                        ? <ToggleRight size={30} style={{ color: "#22C55E" }} />
                        : <ToggleLeft  size={30} style={{ color: "rgba(255,255,255,0.3)" }} />}
                    </button>
                  </div>

                  {/* Fréquence */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5 opacity-70">Fréquence</label>
                    <select
                      value={configForm.frequency}
                      onChange={(e) => setConfigForm({ ...configForm, frequency: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--admin-bg, rgba(0,0,0,0.3))", border: "1px solid rgba(255,255,255,0.15)", color: "inherit" }}
                      data-testid="admin-newsletter-frequency-select"
                    >
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Jour */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5 opacity-70">Jour d'envoi</label>
                    <div className="grid grid-cols-7 gap-1">
                      {DAY_LABELS.map((day, idx) => (
                        <button key={idx} type="button"
                          onClick={() => setConfigForm({ ...configForm, day_of_week: idx })}
                          className="py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{
                            background: configForm.day_of_week === idx ? "#C9A45C" : "rgba(255,255,255,0.06)",
                            color:      configForm.day_of_week === idx ? "#0F2747" : "inherit",
                            border:     `1px solid ${configForm.day_of_week === idx ? "#C9A45C" : "rgba(255,255,255,0.1)"}`,
                          }}
                          data-testid={`admin-newsletter-day-${idx}`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heure + Max annonces */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Heure (0-23h)", field: "hour",         min: 0, max: 23 },
                      { label: "Max annonces",   field: "max_listings", min: 1, max: 50 },
                    ].map(({ label, field, min, max }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium mb-1.5 opacity-70">{label}</label>
                        <input type="number" min={min} max={max}
                          value={configForm[field]}
                          onChange={(e) => setConfigForm({ ...configForm, [field]: parseInt(e.target.value) || min })}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "var(--admin-bg, rgba(0,0,0,0.3))", border: "1px solid rgba(255,255,255,0.15)", color: "inherit" }}
                          data-testid={`admin-newsletter-${field}-input`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Résumé */}
                  <div className="p-3 rounded-lg text-xs"
                    style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.2)" }}>
                    <p style={{ color: "#C9A45C" }}>
                      {configForm.is_active
                        ? `${FREQUENCY_LABELS[configForm.frequency]} · ${DAY_LABELS[configForm.day_of_week]} à ${configForm.hour}h00 · max ${configForm.max_listings} annonces`
                        : "Envoi automatique désactivé"
                      }
                    </p>
                    {config?.last_run_at && (
                      <p className="mt-0.5 opacity-70" style={{ color: "#C9A45C" }}>
                        Dernier envoi : {fmtDateShort(config.last_run_at)}
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: "#C9A45C", color: "#0F2747" }}
                    data-testid="admin-newsletter-save-config-btn">
                    <Settings size={14} />
                    {actionLoading ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                </div>
              </form>
            )}

            {/* ── Onglet Abonnés ─────────────────────────────────────────────── */}
            {activeTab === "subscribers" && (
              <div className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                  border:     "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                }}
                data-testid="admin-newsletter-subscribers-table"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <p className="text-sm font-semibold">{subscribers.length} abonné(s)</p>
                  <button onClick={loadData} className="p-1.5 rounded-lg transition-all hover:rotate-180"
                    style={{ color: "#C9A45C" }} title="Rafraîchir">
                    <RefreshCw size={14} />
                  </button>
                </div>

                {loading ? (
                  <div className="p-8 text-center opacity-50 text-sm">Chargement...</div>
                ) : subscribers.length === 0 ? (
                  <div className="p-8 text-center opacity-50">
                    <Mail size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun abonné.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          {["Email", "Statut", "Inscrit le", "Action"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider opacity-40">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map((sub, i) => (
                          <tr key={sub.id} style={{ borderBottom: i < subscribers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                            data-testid={`admin-newsletter-subscriber-row-${i}`}>
                            <td className="px-4 py-2.5">
                              <span className="font-medium">{sub.email}</span>
                              {sub.user_id && (
                                <span className="ml-1 text-xs px-1 py-0.5 rounded"
                                  style={{ background: "rgba(201,164,92,0.1)", color: "#C9A45C" }}>
                                  Membre
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  background: sub.is_active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                                  color:      sub.is_active ? "#22C55E" : "rgba(255,255,255,0.35)",
                                }}>
                                {sub.is_active ? "Actif" : "Désabonné"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 opacity-60">{fmtDateShort(sub.subscribed_at)}</td>
                            <td className="px-4 py-2.5">
                              <button onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                                className="p-1 rounded transition-all hover:scale-110"
                                style={{ color: "#DC2626" }}
                                data-testid={`admin-newsletter-delete-subscriber-${i}`}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet Historique ─────────────────────────────────────────── */}
            {activeTab === "history" && (
              <div className="space-y-3" data-testid="admin-newsletter-history-tab">
                {!historyLoaded ? (
                  <div className="p-8 text-center opacity-50 text-sm">Chargement...</div>
                ) : history.length === 0 ? (
                  <div
                    className="p-10 rounded-xl text-center"
                    style={{
                      background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                      border:     "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                    }}
                  >
                    <History size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm opacity-50">Aucun envoi enregistré pour le moment.</p>
                    <p className="text-xs opacity-30 mt-1">Les prochains envois apparaîtront ici avec leurs statistiques.</p>
                  </div>
                ) : (
                  history.map((record, i) => (
                    <HistoryCard
                      key={record.id}
                      record={record}
                      index={i}
                      onPreview={() => handleOpenHistoryPreview(record.id, record.sent_at)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Colonne droite — Aperçu intégré ─────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} style={{ color: "#C9A45C" }} />
                <h2 className="text-sm font-semibold">Aperçu de l'email</h2>
                <span className="text-xs opacity-40 ml-1">— Rendu en temps réel</span>
              </div>
              <button
                onClick={() => {
                  const url = `${process.env.REACT_APP_BACKEND_URL}/api/citadelle/admin/newsletter/preview`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105"
                style={{ border: "1px solid rgba(201,164,92,0.3)", color: "#C9A45C" }}
              >
                <Eye size={12} /> Plein écran
              </button>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border:     "1px solid rgba(201,164,92,0.2)",
                background: "#F0F4F8",
                minHeight:  "500px",
                position:   "relative",
              }}
              data-testid="admin-newsletter-preview-frame"
            >
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "#C9A45C", borderTopColor: "transparent" }} />
                  <p className="text-xs opacity-40">Chargement de l'aperçu...</p>
                </div>
              ) : previewHtml ? (
                <iframe
                  ref={previewIframeRef}
                  srcDoc={previewHtml}
                  title="Aperçu newsletter"
                  style={{
                    width: "100%",
                    height: "700px",
                    border: "none",
                    display: "block",
                  }}
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-xs opacity-40">Aucune annonce active pour l'aperçu.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}

// ── Carte Historique ────────────────────────────────────────────────────────────

function HistoryCard({ record, index, onPreview }) {
  const deliveryRate = pct(record.total_delivered, record.total_sent);
  const openRate     = pct(record.opens,  record.total_delivered);
  const clickRate    = pct(record.clicks, record.total_delivered);

  const PERIOD_MAP = { 7: "Hebdomadaire", 14: "Bi-hebdomadaire", 30: "Mensuel" };

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
        border:     "1px solid var(--admin-border, rgba(255,255,255,0.1))",
      }}
      data-testid={`admin-newsletter-history-card-${index}`}
    >
      {/* En-tête carte */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold">
            {new Date(record.sent_at).toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric"
            })}
          </p>
          <p className="text-xs opacity-50 mt-0.5">
            {PERIOD_MAP[record.period_days] || record.frequency} · {record.listings_count} annonce(s)
          </p>
        </div>
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{ border: "1px solid rgba(201,164,92,0.4)", color: "#C9A45C" }}
          data-testid={`admin-newsletter-history-preview-btn-${index}`}
        >
          <Eye size={12} />
          Voir l'email
        </button>
      </div>

      {/* Stats en ligne */}
      <div className="grid grid-cols-3 gap-2">
        {/* Délivrabilité */}
        <StatMini
          icon={<Mail size={13} />}
          label="Délivrés"
          value={`${record.total_delivered} / ${record.total_sent}`}
          rate={deliveryRate}
          color={deliveryRate >= 90 ? "#22C55E" : deliveryRate >= 70 ? "#F59E0B" : "#DC2626"}
        />
        {/* Ouvertures */}
        <StatMini
          icon={<BarChart2 size={13} />}
          label="Ouvertures"
          value={record.opens}
          rate={openRate}
          color="#818CF8"
          note="(pixel)"
        />
        {/* Clics */}
        <StatMini
          icon={<MousePointer size={13} />}
          label="Clics"
          value={record.clicks}
          rate={clickRate}
          color="#C9A45C"
        />
      </div>
    </div>
  );
}

// ── Mini stat dans la carte historique ─────────────────────────────────────────

function StatMini({ icon, label, value, rate, color, note }) {
  return (
    <div
      className="p-2.5 rounded-lg text-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
        {note && <span className="text-xs opacity-40">{note}</span>}
      </div>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
      <p className="text-xs opacity-50 mt-0.5">{rate}%</p>
    </div>
  );
}
