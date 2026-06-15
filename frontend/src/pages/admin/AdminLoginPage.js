/**
 * Page de connexion — Espace Administration
 * Accessible via /admin-access
 * Réservé aux comptes avec role: "admin"
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { login, forgotPassword } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

// Couleurs de la Citadelle (reprise cohérence visuelle admin)
const COLORS = {
  night: "#0F2747",
  blue: "#1A3A6B",
  gold: "#C9A45C",
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  // Vue active : "login" ou "forgot"
  const [view, setView] = useState("login");

  // Formulaire de connexion
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Formulaire mot de passe oublié
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLoginChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setLoginError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setLoginError("Veuillez remplir tous les champs");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const response = await login(credentials.email, credentials.password, rememberMe);
      if (response.user.role !== "admin") {
        setLoginError("Accès refusé — Ce compte n'a pas les droits administrateur.");
        return;
      }
      loginUser(response.user);
      navigate("/syndicat-admin");
    } catch (err) {
      setLoginError(err.response?.data?.detail || "Email ou mot de passe incorrect");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
    } catch {
      // Ne pas révéler si l'email existe (sécurité)
    } finally {
      setForgotLoading(false);
      setForgotSent(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, ${COLORS.night} 0%, ${COLORS.blue} 100%)` }}
    >
      {/* Motif de fond discret */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(201,164,92,0.15)", border: "1px solid rgba(201,164,92,0.3)" }}
          >
            <Shield size={28} style={{ color: COLORS.gold }} />
          </div>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}
          >
            Espace Administration
          </h1>
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            La Citadelle Numérique — Accès restreint
          </p>
        </div>

        {/* Carte principale */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,164,92,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* ── VUE : CONNEXION ── */}
          {view === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" data-testid="admin-login-form">
              <p className="text-sm font-semibold text-center mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Connexion administrateur
              </p>

              {loginError && (
                <div
                  className="flex items-start gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}
                  data-testid="admin-login-error"
                >
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleLoginChange}
                    placeholder="admin@exemple.fr"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    data-testid="admin-login-email"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    data-testid="admin-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Se souvenir de moi + mot de passe oublié */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[#C9A45C]"
                    data-testid="admin-login-remember-me"
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => { setView("forgot"); setLoginError(""); }}
                  className="text-xs hover:opacity-80 transition-opacity"
                  style={{ color: COLORS.gold }}
                  data-testid="admin-forgot-link"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ background: COLORS.gold, color: COLORS.night }}
                data-testid="admin-login-submit"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.night }} />
                ) : (
                  <>
                    <Shield size={15} />
                    Accéder au panneau admin
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── VUE : MOT DE PASSE OUBLIÉ ── */}
          {view === "forgot" && !forgotSent && (
            <form onSubmit={handleForgotSubmit} className="space-y-4" data-testid="admin-forgot-form">
              <button
                type="button"
                onClick={() => setView("login")}
                className="flex items-center gap-1.5 text-xs mb-2 hover:opacity-80 transition-opacity"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <ArrowLeft size={13} />
                Retour à la connexion
              </button>

              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                Réinitialisation du mot de passe
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Entrez votre adresse email d'administrateur. Un lien de réinitialisation vous sera envoyé.
              </p>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="admin@exemple.fr"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    data-testid="admin-forgot-email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading || !forgotEmail}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: COLORS.gold, color: COLORS.night }}
                data-testid="admin-forgot-submit"
              >
                {forgotLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.night }} />
                ) : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          )}

          {/* ── VUE : SUCCÈS MOT DE PASSE OUBLIÉ ── */}
          {view === "forgot" && forgotSent && (
            <div className="text-center space-y-4" data-testid="admin-forgot-success">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(34,197,94,0.15)" }}
              >
                <CheckCircle size={22} style={{ color: "#4ade80" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                Email envoyé
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Si un compte administrateur existe avec <strong style={{ color: "rgba(255,255,255,0.7)" }}>{forgotEmail}</strong>,
                un lien de réinitialisation a été envoyé. Vérifiez vos spams.
              </p>
              <button
                onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); }}
                className="text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ color: COLORS.gold }}
                data-testid="admin-forgot-back"
              >
                Retour à la connexion
              </button>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <p className="text-center mt-5 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          Accès sécurisé — La Citadelle Numérique
        </p>
      </div>
    </div>
  );
}
