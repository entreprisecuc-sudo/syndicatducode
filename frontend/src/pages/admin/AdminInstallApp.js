/**
 * AdminInstallApp — Page unique d'installation de l'app admin "Papa en Mousse".
 * Réservée aux admins. Simplifie l'installation PWA :
 *  - Android/Chrome : bouton one-tap "Installer" (prompt natif "Voulez-vous installer ?")
 *  - iPhone/Safari  : instructions visuelles (Partager → Sur l'écran d'accueil)
 *  - QR code à faire scanner à un collègue.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, CheckCircle, Share, PlusSquare, QrCode, Smartphone } from "lucide-react";

const GOLD = "#C9A45C";
const NIGHT = "#0a0f1e";

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export default function AdminInstallApp() {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [ios] = useState(isIOS());

  const installUrl = window.location.origin + "/admin-live/installer";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(installUrl)}&bgcolor=0a0f1e&color=C9A45C&qzone=2`;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: NIGHT }} data-testid="admin-install-page">
      <header className="px-4 py-4 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={() => navigate("/admin-live")} data-testid="install-back-btn"
          className="p-2 rounded-xl hover:opacity-70 transition-opacity" style={{ background: "rgba(255,255,255,0.06)" }}>
          <ArrowLeft size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>
        <div className="flex items-center gap-2">
          <Smartphone size={18} style={{ color: GOLD }} />
          <h1 className="text-white font-bold">Installer l'application</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-5">

        <div className="text-center">
          <img src="/pem-icon-192.png" alt="Papa en Mousse"
            className="w-20 h-20 rounded-2xl mx-auto mb-3" style={{ boxShadow: "0 8px 30px rgba(201,164,92,0.25)" }} />
          <h2 className="text-white font-bold text-lg">Papa en Mousse</h2>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Alertes admin en temps réel. Installation directe, sans passer par un store.
          </p>
        </div>

        {/* Déjà installée */}
        {installed ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }} data-testid="install-already-done">
            <CheckCircle size={32} className="mx-auto mb-2" style={{ color: "#34d399" }} />
            <p className="text-white font-bold">Application déjà installée</p>
            <button onClick={() => navigate("/admin-live")} data-testid="install-open-app-btn"
              className="mt-4 w-full py-3 rounded-xl font-bold text-sm" style={{ background: GOLD, color: NIGHT }}>
              Ouvrir l'application
            </button>
          </div>
        ) : ios ? (
          /* Instructions iPhone / Safari */
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.25)" }} data-testid="install-ios-instructions">
            <p className="text-sm text-white font-semibold text-center">Sur iPhone (Safari), en 3 étapes :</p>
            {[
              { icon: <Share size={18} style={{ color: GOLD }} />, txt: <>Appuyez sur <strong className="text-white">Partager</strong> en bas de l'écran.</> },
              { icon: <PlusSquare size={18} style={{ color: GOLD }} />, txt: <>Choisissez <strong className="text-white">« Sur l'écran d'accueil »</strong>.</> },
              { icon: <CheckCircle size={18} style={{ color: GOLD }} />, txt: <>Appuyez sur <strong className="text-white">Ajouter</strong>. C'est prêt !</> },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,164,92,0.15)" }}>{s.icon}</div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{s.txt}</p>
              </div>
            ))}
            <p className="text-xs text-center pt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              ⚠️ Ouvrez cette page avec <strong>Safari</strong> (l'installation n'est pas possible depuis Chrome sur iPhone).
            </p>
          </div>
        ) : installPrompt ? (
          /* Android / Chrome — bouton one-tap */
          <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.3)" }} data-testid="install-android-block">
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Appuyez sur le bouton ci-dessous, puis confirmez <strong className="text-white">« Installer »</strong> dans la fenêtre qui apparaît.
            </p>
            <button onClick={handleInstall} data-testid="install-now-btn"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02]"
              style={{ background: GOLD, color: NIGHT }}>
              <Download size={18} /> Installer l'application
            </button>
          </div>
        ) : (
          /* Fallback : prompt pas encore disponible */
          <div className="rounded-2xl p-5 text-center space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} data-testid="install-fallback-block">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              Sur <strong className="text-white">Android</strong>, ouvrez cette page dans <strong className="text-white">Chrome</strong>.
              Si le bouton n'apparaît pas, ouvrez le menu <strong className="text-white">⋮</strong> puis
              <strong className="text-white"> « Installer l'application »</strong>.
            </p>
            <button onClick={() => window.location.reload()} data-testid="install-retry-btn"
              className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: "rgba(201,164,92,0.15)", color: GOLD, border: "1px solid rgba(201,164,92,0.3)" }}>
              Réessayer
            </button>
          </div>
        )}

        {/* QR code de partage */}
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} data-testid="install-qr-block">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCode size={16} style={{ color: GOLD }} />
            <p className="text-sm text-white font-semibold">Partager à un collègue</p>
          </div>
          <img src={qrUrl} alt="QR code installation" className="mx-auto rounded-xl bg-white p-1" style={{ width: 200, height: 200 }} />
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
            Faites scanner ce code : votre collègue arrivera directement sur cette page d'installation.
          </p>
        </div>

      </main>
    </div>
  );
}
