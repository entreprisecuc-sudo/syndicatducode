/**
 * CitadelleAuthModal
 * Modal de connexion/inscription contextuel affiché sur les pages d'annonces.
 * Inclut Google OAuth + Email classique, sans quitter la page.
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */

import { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, User, AlertCircle } from "lucide-react";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import citadelleApi from "@/services/citadelleApi";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import { startCitadelleGoogleLogin } from "@/services/citadelleGoogleAuth";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function CitadelleAuthModal({ isOpen, onClose, onSuccess, listingTitle }) {
  const { login } = useCitadelleAuth();
  const [tab, setTab] = useState("login");

  // Formulaire connexion
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Formulaire inscription
  const [regForm, setRegForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    // Sauvegarder l'URL courante pour y revenir après Google Auth
    sessionStorage.setItem("citadelle_return_url", window.location.pathname);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    startCitadelleGoogleLogin();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await citadelleApi.post("/auth/login", loginForm);
      login(res.data.access_token, res.data.user);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setLoginError(err.response?.data?.detail || "Email ou mot de passe incorrect");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    try {
      const res = await citadelleApi.post("/auth/register", {
        ...regForm,
        cgu_accepted: true
      });
      login(res.data.access_token, res.data.user);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setRegError(err.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setRegLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: `1px solid rgba(255,255,255,0.12)`,
    color: CITADELLE_COLORS.text,
    borderRadius: "10px"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: `linear-gradient(160deg, #0d1b2a 0%, #0a1628 100%)`, border: `1px solid rgba(212,175,55,0.2)` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: CITADELLE_COLORS.text }}>
              {listingTitle ? "Accédez à cette annonce" : "Espace Citadelle"}
            </h2>
            {listingTitle && (
              <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.gold }}>
                {listingTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: CITADELLE_COLORS.textMuted }}>
            <X size={18} />
          </button>
        </div>

        {/* Bouton Google */}
        <div className="px-6 pb-4">
          <button onClick={handleGoogleLogin} type="button" data-testid="google-auth-btn"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "white", color: "#333" }}>
            <GoogleIcon />
            Continuer avec Google
          </button>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-3 px-6 pb-4">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Onglets */}
        <div className="flex mx-6 mb-4 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-sm font-medium transition-all"
              style={{
                background: tab === t ? CITADELLE_COLORS.gold : "transparent",
                color: tab === t ? CITADELLE_COLORS.night : CITADELLE_COLORS.textMuted,
                borderRadius: "10px"
              }}>
              {t === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          ))}
        </div>

        {/* Formulaire connexion */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="px-6 pb-6 space-y-3">
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                <AlertCircle size={14} />{loginError}
              </div>
            )}
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }} />
              <input type="email" placeholder="Email" required value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                className="w-full pl-9 pr-4 py-3 text-sm outline-none" style={inputStyle} />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }} />
              <input type={showLoginPwd ? "text" : "password"} placeholder="Mot de passe" required
                value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                className="w-full pl-9 pr-10 py-3 text-sm outline-none" style={inputStyle} />
              <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }}>
                {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button type="submit" disabled={loginLoading} data-testid="modal-login-btn"
              className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        )}

        {/* Formulaire inscription */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="px-6 pb-6 space-y-3">
            {regError && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                <AlertCircle size={14} />{regError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }} />
                <input type="text" placeholder="Prénom" required value={regForm.first_name}
                  onChange={e => setRegForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }} />
                <input type="text" placeholder="Nom" required value={regForm.last_name}
                  onChange={e => setRegForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }} />
              <input type="email" placeholder="Email" required value={regForm.email}
                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                className="w-full pl-9 pr-4 py-3 text-sm outline-none" style={inputStyle} />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }} />
              <input type={showRegPwd ? "text" : "password"} placeholder="Mot de passe (8 car. min.)" required
                value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                className="w-full pl-9 pr-10 py-3 text-sm outline-none" style={inputStyle} />
              <button type="button" onClick={() => setShowRegPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }}>
                {showRegPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              En créant un compte, vous acceptez nos <span style={{ color: CITADELLE_COLORS.gold }}>CGU</span>.
            </p>
            <button type="submit" disabled={regLoading} data-testid="modal-register-btn"
              className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {regLoading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
