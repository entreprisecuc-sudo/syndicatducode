/**
 * AdminLiveApp — "Papa en Mousse"
 * Application PWA légère d'alertes admin.
 * Polling 30s + push notifications + valider/refuser inline + QR code installation.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ExternalLink, Bell, BellOff, RefreshCw, LogOut, Sword, QrCode } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const POLL_INTERVAL = 30000; // 30 secondes

// Son de notification (bip discret via Web Audio API)
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* silencieux si bloqué */ }
};

// Mettre à jour le favicon avec un badge numérique
const updateFaviconBadge = (count) => {
  const canvas = document.createElement("canvas");
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = "/pem-icon-192.png";
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 32, 32);
    if (count > 0) {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(24, 8, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(count > 9 ? "9+" : String(count), 24, 8);
    }
    const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
    link.rel = "icon"; link.href = canvas.toDataURL();
    document.head.appendChild(link);
  };
};

// Labels et couleurs par type d'alerte
const ALERT_TYPES = {
  listings:       { emoji: "🏰", color: "#C9A45C", universe: "Citadelle" },
  transactions:   { emoji: "🔄", color: "#60a5fa", universe: "Citadelle" },
  service_orders: { emoji: "🛒", color: "#a78bfa", universe: "Citadelle" },
  kyc:            { emoji: "🪪", color: "#f59e0b", universe: "Citadelle" },
  contacts:       { emoji: "📬", color: "#34d399", universe: "Syndicat"  },
  pending_users:  { emoji: "👤", color: "#fb923c", universe: "Syndicat"  },
  books:          { emoji: "📖", color: "#e879f9", universe: "Syndicat"  },
};

// ── Composant carte d'alerte ──────────────────────────────────────────────────
const AlertCard = ({ type, alertData, onAction }) => {
  const meta = ALERT_TYPES[type] || {};
  const [loading, setLoading] = useState(null);

  if (!alertData.count) return null;

  const canReject = !["contacts"].includes(type);

  const handleAction = async (action, itemId) => {
    setLoading(`${action}-${itemId}`);
    try {
      await api.post(`/admin/push-alerts/${type}/${itemId}/${action}`);
      onAction();
    } catch { /* toast implicite */ } finally { setLoading(null); }
  };

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${meta.color}33` }}>
      {/* En-tête catégorie */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: `${meta.color}15`, borderBottom: `1px solid ${meta.color}25` }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.emoji}</span>
          <div>
            <p className="text-xs font-bold text-white">{alertData.label}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{meta.universe}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black" style={{ color: meta.color }}>{alertData.count}</span>
          <a href={alertData.link} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ background: `${meta.color}20` }}>
            <ExternalLink size={13} style={{ color: meta.color }} />
          </a>
        </div>
      </div>

      {/* Liste des items */}
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {alertData.items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
            <p className="text-xs text-white truncate flex-1 mr-3">
              {item.title || item.listing_title || item.service_title ||
               `${item.first_name || ""} ${item.last_name || item.user_name || item.email || item.id}`.trim()}
            </p>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => handleAction("validate", item.id)}
                disabled={!!loading}
                data-testid={`validate-${type}-${item.id}`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                {loading === `validate-${item.id}` ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                OK
              </button>
              {canReject && (
                <button onClick={() => handleAction("reject", item.id)}
                  disabled={!!loading}
                  data-testid={`reject-${type}-${item.id}`}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                  {loading === `reject-${item.id}` ? <RefreshCw size={11} className="animate-spin" /> : <XCircle size={11} />}
                  Non
                </button>
              )}
            </div>
          </div>
        ))}
        {alertData.count > 5 && (
          <p className="text-center text-xs py-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            +{alertData.count - 5} autres — voir dans l'admin complet
          </p>
        )}
      </div>
    </div>
  );
};

// ── App principale ────────────────────────────────────────────────────────────
export default function AdminLiveApp() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const prevTotal = useRef(0);

  // Protéger la route
  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
    if (!user) navigate("/papaenmousse1981");
  }, [user, navigate]);

  // Enregistrer le Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Capturer l'événement d'installation PWA
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Charger les alertes
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/admin/push-alerts/summary");
      const data = res.data;
      const total = Object.values(data).reduce((s, v) => s + (v.count || 0), 0);

      if (total > prevTotal.current && prevTotal.current !== null) {
        playBeep();
      }
      prevTotal.current = total;

      setSummary(data);
      setLastRefresh(new Date());
      updateFaviconBadge(total);
      document.title = total > 0 ? `(${total}) Papa en Mousse` : "Papa en Mousse";
    } catch { /* silencieux */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  // Activer les push notifications
  const enablePush = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const keyRes = await api.get("/admin/push-alerts/vapid-key");
    const rawKey = keyRes.data.public_key;

    const urlBase64 = rawKey.replace(/-/g, "+").replace(/_/g, "/");
    const padded    = urlBase64.padEnd(urlBase64.length + (4 - urlBase64.length % 4) % 4, "=");
    const raw       = window.atob(padded);
    const arr       = Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: arr,
    });

    await api.post("/admin/push-alerts/subscribe", subscription.toJSON());
    setPushEnabled(true);
  };

  const totalAlerts = summary
    ? Object.values(summary).reduce((s, v) => s + (v.count || 0), 0)
    : 0;

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #0a0f1e 0%, #0d1528 100%)", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(201,164,92,0.15)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(201,164,92,0.15)" }}>
            <Sword size={16} style={{ color: "#C9A45C" }} />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none">Papa en Mousse</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {lastRefresh ? `Màj ${lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Chargement…"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge total */}
          {totalAlerts > 0 && (
            <span className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: "#ef4444", color: "white" }}>
              {totalAlerts}
            </span>
          )}

          {/* Notifications push */}
          <button onClick={enablePush} disabled={pushEnabled} data-testid="enable-push-btn"
            title={pushEnabled ? "Notifications activées" : "Activer les notifications"}
            className="p-2 rounded-xl transition-all hover:opacity-70 disabled:opacity-40"
            style={{ background: pushEnabled ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)" }}>
            {pushEnabled ? <Bell size={15} style={{ color: "#34d399" }} /> : <BellOff size={15} style={{ color: "rgba(255,255,255,0.5)" }} />}
          </button>

          {/* Installation / QR */}
          <button onClick={() => navigate("/admin-live/installer")} data-testid="show-qr-btn"
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <QrCode size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>

          {/* Rafraîchir */}
          <button onClick={() => { setLoading(true); fetchSummary(); }} data-testid="refresh-btn"
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>

          {/* Déconnexion */}
          <button onClick={() => { logout(); navigate("/"); }} data-testid="logout-btn"
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <LogOut size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>
      </header>

      {/* Corps */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">

        {/* Bouton installation PWA */}
        {installPrompt && (
          <button onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}
            data-testid="install-pwa-btn"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold mb-4 transition-all hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg, #C9A45C22, #0F274733)", border: "1px solid rgba(201,164,92,0.4)", color: "#C9A45C" }}>
            Installer l'app sur cet appareil
          </button>
        )}

        {loading && !summary ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin" style={{ color: "#C9A45C" }} />
          </div>
        ) : totalAlerts === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(52,211,153,0.1)" }}>
              <CheckCircle size={32} style={{ color: "#34d399" }} />
            </div>
            <p className="text-white font-bold text-lg">Tout est en ordre !</p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Aucune alerte en attente</p>
          </div>
        ) : (
          Object.entries(summary).map(([type, data]) => (
            <AlertCard key={type} type={type} alertData={data} onAction={fetchSummary} />
          ))
        )}

        {/* Lien admin complet + QR */}
        <div className="mt-4 flex gap-3">
          <a href="/syndicat-admin" target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ExternalLink size={13} /> Admin complet
          </a>
          <button onClick={() => navigate("/admin-live/installer")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(201,164,92,0.08)", color: "#C9A45C", border: "1px solid rgba(201,164,92,0.2)" }}>
            <QrCode size={13} /> Installer / Partager l'app
          </button>
        </div>
      </main>
    </div>
  );
}
