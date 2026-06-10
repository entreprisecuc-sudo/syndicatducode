/**
 * Page Admin — Newsletter La Citadelle Numérique
 * Gestion des abonnés, configuration du scheduler et prévisualisation de l'email
 */

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Users, Settings, Send, Eye, Trash2,
  RefreshCw, CheckCircle, AlertCircle, Bell, ToggleLeft, ToggleRight
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

// ── Constantes ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const FREQUENCY_LABELS = { weekly: "Hebdomadaire", biweekly: "Bi-hebdomadaire", monthly: "Mensuelle" };
const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Hebdomadaire (toutes les semaines)" },
  { value: "biweekly", label: "Bi-hebdomadaire (toutes les 2 semaines)" },
  { value: "monthly", label: "Mensuelle (une fois par mois)" },
];

// ── Composant principal ───────────────────────────────────────────────────────

export default function AdminCitadelleNewsletter() {
  const [activeTab, setActiveTab] = useState("stats"); // stats | config | subscribers
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [subscribers, setSubscribers] = useState([]);
  const [config, setConfig] = useState(null);
  const [configForm, setConfigForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: success|error, message }

  // ── Chargement des données ─────────────────────────────────────────────────

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers UI ─────────────────────────────────────────────────────────────

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSendNow = async () => {
    if (!window.confirm("Déclencher l'envoi immédiat du digest newsletter aux abonnés actifs ?")) return;
    setActionLoading(true);
    try {
      await api.post("/citadelle/admin/newsletter/send-now");
      showToast("success", "Envoi déclenché ! Les emails partiront dans quelques instants.");
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/citadelle/admin/newsletter/preview`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.patch("/citadelle/admin/newsletter/config", {
        frequency: configForm.frequency,
        day_of_week: parseInt(configForm.day_of_week),
        hour: parseInt(configForm.hour),
        max_listings: parseInt(configForm.max_listings),
        is_active: configForm.is_active,
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
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        active: subscribers.find((s) => s.id === subId)?.is_active ? prev.active - 1 : prev.active,
      }));
      showToast("success", "Abonné supprimé.");
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Erreur lors de la suppression.");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-newsletter-page">

        {/* Toast notification */}
        {toast && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl"
            style={{
              background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.4)" : "rgba(220,38,38,0.4)"}`,
              color: toast.type === "success" ? "#22C55E" : "#DC2626",
            }}
            data-testid="admin-newsletter-toast"
          >
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* ── En-tête ─────────────────────────────────────────────────── */}
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

          {/* Actions rapides */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ border: "1px solid rgba(201,164,92,0.4)", color: "#C9A45C" }}
              data-testid="admin-newsletter-preview-btn"
            >
              <Eye size={15} />
              Aperçu email
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

        {/* ── Statistiques ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total abonnés", value: stats.total, icon: Users, color: "#C9A45C" },
            { label: "Abonnés actifs", value: stats.active, icon: CheckCircle, color: "#22C55E" },
            { label: "Désabonnés", value: stats.inactive, icon: AlertCircle, color: "#F59E0B" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-5 rounded-xl"
              style={{
                background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
              }}
              data-testid={`admin-newsletter-stat-${label.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon size={18} style={{ color }} />
                <span className="text-sm opacity-60">{label}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color, fontFamily: "'Montserrat', sans-serif" }}>
                {loading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Onglets ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))" }}>
          {[
            { key: "config", label: "Configuration", icon: Settings },
            { key: "subscribers", label: `Abonnés (${stats.active})`, icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === key ? "#C9A45C" : "transparent",
                color: activeTab === key ? "#0F2747" : "inherit",
              }}
              data-testid={`admin-newsletter-tab-${key}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Onglet Configuration ─────────────────────────────────────── */}
        {activeTab === "config" && configForm && (
          <form onSubmit={handleSaveConfig} className="space-y-6" data-testid="admin-newsletter-config-form">
            <div
              className="p-6 rounded-xl space-y-5"
              style={{
                background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
              }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-50 mb-4">
                Paramètres du scheduler
              </h2>

              {/* État actif/inactif */}
              <div className="flex items-center justify-between py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-sm font-medium">Envoi automatique</p>
                  <p className="text-xs opacity-50 mt-0.5">Activer ou désactiver l&apos;envoi planifié</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, is_active: !configForm.is_active })}
                  className="transition-all hover:scale-105"
                  data-testid="admin-newsletter-toggle-active"
                >
                  {configForm.is_active
                    ? <ToggleRight size={32} style={{ color: "#22C55E" }} />
                    : <ToggleLeft size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
                  }
                </button>
              </div>

              {/* Fréquence */}
              <div>
                <label className="block text-sm font-medium mb-2">Fréquence d&apos;envoi</label>
                <select
                  value={configForm.frequency}
                  onChange={(e) => setConfigForm({ ...configForm, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: "var(--admin-bg, rgba(0,0,0,0.3))",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "inherit",
                  }}
                  data-testid="admin-newsletter-frequency-select"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Jour de la semaine */}
              <div>
                <label className="block text-sm font-medium mb-2">Jour d&apos;envoi</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_LABELS.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setConfigForm({ ...configForm, day_of_week: idx })}
                      className="py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{
                        background: configForm.day_of_week === idx ? "#C9A45C" : "rgba(255,255,255,0.06)",
                        color: configForm.day_of_week === idx ? "#0F2747" : "inherit",
                        border: `1px solid ${configForm.day_of_week === idx ? "#C9A45C" : "rgba(255,255,255,0.1)"}`,
                      }}
                      data-testid={`admin-newsletter-day-${idx}`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs opacity-50 mt-1.5">
                  Sélectionné : <strong>{DAY_LABELS[configForm.day_of_week]}</strong>
                </p>
              </div>

              {/* Heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Heure d&apos;envoi (0-23h)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={configForm.hour}
                    onChange={(e) => setConfigForm({ ...configForm, hour: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      background: "var(--admin-bg, rgba(0,0,0,0.3))",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "inherit",
                    }}
                    data-testid="admin-newsletter-hour-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre max d&apos;annonces</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={configForm.max_listings}
                    onChange={(e) => setConfigForm({ ...configForm, max_listings: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      background: "var(--admin-bg, rgba(0,0,0,0.3))",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "inherit",
                    }}
                    data-testid="admin-newsletter-max-listings-input"
                  />
                </div>
              </div>

              {/* Résumé */}
              <div
                className="p-4 rounded-lg text-sm"
                style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.2)" }}
              >
                <p style={{ color: "#C9A45C" }}>
                  <strong>Planning actuel :</strong>{" "}
                  {configForm.is_active
                    ? `Envoi ${FREQUENCY_LABELS[configForm.frequency]?.toLowerCase()} tous les ${DAY_LABELS[configForm.day_of_week]}s à ${configForm.hour}h00 · max ${configForm.max_listings} annonces`
                    : "Envoi automatique désactivé"
                  }
                </p>
                {config?.last_run_at && (
                  <p className="mt-1 opacity-70" style={{ color: "#C9A45C" }}>
                    Dernier envoi : {formatDate(config.last_run_at)}
                  </p>
                )}
              </div>

              {/* Bouton sauvegarder */}
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm
                           transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "#C9A45C", color: "#0F2747" }}
                data-testid="admin-newsletter-save-config-btn"
              >
                <Settings size={15} />
                {actionLoading ? "Sauvegarde..." : "Sauvegarder la configuration"}
              </button>
            </div>
          </form>
        )}

        {/* ── Onglet Abonnés ────────────────────────────────────────────── */}
        {activeTab === "subscribers" && (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
              border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
            }}
            data-testid="admin-newsletter-subscribers-table"
          >
            {/* En-tête tableau */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm font-semibold">
                {subscribers.length} abonné(s) au total
              </p>
              <button
                onClick={loadData}
                className="p-2 rounded-lg transition-all hover:rotate-180"
                style={{ color: "#C9A45C" }}
                title="Rafraîchir"
                data-testid="admin-newsletter-refresh-btn"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Corps du tableau */}
            {loading ? (
              <div className="p-8 text-center opacity-50 text-sm">Chargement...</div>
            ) : subscribers.length === 0 ? (
              <div className="p-8 text-center opacity-50">
                <Mail size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun abonné pour le moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-left"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {["Email", "Statut", "Inscrit le", "Dernier envoi", "Action"].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider opacity-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub, i) => (
                      <tr
                        key={sub.id}
                        className="transition-all"
                        style={{
                          borderBottom: i < subscribers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}
                        data-testid={`admin-newsletter-subscriber-row-${i}`}
                      >
                        <td className="px-5 py-3">
                          <span className="font-medium">{sub.email}</span>
                          {sub.user_id && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(201,164,92,0.1)", color: "#C9A45C" }}
                            >
                              Membre
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: sub.is_active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                              color: sub.is_active ? "#22C55E" : "rgba(255,255,255,0.35)",
                            }}
                          >
                            {sub.is_active ? "Actif" : "Désabonné"}
                          </span>
                        </td>
                        <td className="px-5 py-3 opacity-70">{formatDate(sub.subscribed_at)}</td>
                        <td className="px-5 py-3 opacity-70">{formatDate(sub.last_email_sent_at)}</td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{ color: "#DC2626" }}
                            title="Supprimer"
                            data-testid={`admin-newsletter-delete-subscriber-${i}`}
                          >
                            <Trash2 size={15} />
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

      </div>
    </AdminLayout>
  );
}
