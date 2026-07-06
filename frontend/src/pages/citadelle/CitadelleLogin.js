/**
 * Page de connexion — La Citadelle Numérique
 * Authentification indépendante (platform: citadelle)
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CONFIG } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";
import CGUAcceptanceModal from "@/components/citadelle/CGUAcceptanceModal";
import { startCitadelleGoogleLogin } from "@/services/citadelleGoogleAuth";

export default function CitadelleLogin() {
  const [form, setForm] = useState({ email: "", password: "", remember_me: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // CGU : modale si l'utilisateur existant n'a pas encore accepté
  const [showCGU, setShowCGU] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null); // { token, user }
  const [cguLoading, setCguLoading] = useState(false);
  const { login } = useCitadelleAuth();
  const navigate = useNavigate();
  useCitadellePageMeta("Connexion");
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const res = await citadelleApi.post("/auth/login", form);
      // Si l'utilisateur n'a pas encore accepté les CGU/CGV → afficher la modale
      if (!res.data.user.cgu_accepted) {
        setPendingAuth({ token: res.data.access_token, user: res.data.user });
        setShowCGU(true);
      } else {
        login(res.data.access_token, res.data.user);
        navigate("/citadelle/espace-membre");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  // Acceptation CGU depuis la page de connexion (utilisateur existant)
  const handleCGUAccept = async () => {
    setCguLoading(true);
    try {
      await citadelleApi.patch(
        "/auth/accept-cgu",
        {},
        { headers: { Authorization: `Bearer ${pendingAuth.token}` } }
      );
      login(pendingAuth.token, { ...pendingAuth.user, cgu_accepted: true });
      setShowCGU(false);
      navigate("/citadelle/espace-membre");
    } catch (err) {
      setError("Erreur lors de l'enregistrement du consentement. Veuillez réessayer.");
      setShowCGU(false);
    } finally {
      setCguLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>

      {/* Motif de fond */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/citadelle">
            <img src={CITADELLE_CONFIG.logo} alt={CITADELLE_CONFIG.name} className="h-20 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}>
            Connexion
          </h1>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            Accédez à votre espace La Citadelle Numérique
          </p>
        </div>

        {/* Formulaire */}
        <div className="p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.2)", backdropFilter: "blur(12px)" }}>

          {/* Bouton Google */}
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem("citadelle_return_url", "/citadelle/espace-membre");
              // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
              startCitadelleGoogleLogin();
            }}
            data-testid="citadelle-google-login-btn"
            className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "white", color: "#333" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="citadelle-login-form">

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }} data-testid="citadelle-login-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                Adresse email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="votre@email.fr"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                data-testid="citadelle-login-email"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  data-testid="citadelle-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Se souvenir de moi + mot de passe oublié */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.6)" }}>
                <input
                  type="checkbox"
                  checked={form.remember_me}
                  onChange={(e) => setForm(prev => ({ ...prev, remember_me: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer accent-[#C9A45C]"
                  data-testid="citadelle-login-remember-me"
                />
                Se souvenir de moi
              </label>
              <Link
                to="/citadelle/mot-de-passe-oublie"
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: CITADELLE_COLORS.gold }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              data-testid="citadelle-login-submit"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
              ) : (
                <>
                  <LogIn size={16} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Liens */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Pas encore de compte ?{" "}
              <Link to="/citadelle/inscription" className="font-semibold transition-colors" style={{ color: CITADELLE_COLORS.gold }} data-testid="citadelle-login-register-link">
                Créer un compte
              </Link>
            </p>
            <Link to="/citadelle" className="block text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Sécurité */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Shield size={12} />
          Connexion sécurisée — Données chiffrées
        </div>
      </div>

      {/* Modale CGU/CGV — affichée si l'utilisateur n'a pas encore accepté */}
      {showCGU && <CGUAcceptanceModal onAccept={handleCGUAccept} loading={cguLoading} />}
    </div>
  );
}
