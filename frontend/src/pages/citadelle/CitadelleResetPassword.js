/**
 * Réinitialisation du mot de passe — La Citadelle Numérique
 * Formulaire pour saisir un nouveau mot de passe via le token reçu par email
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CONFIG } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";
import { SeoNoIndex } from "@/components/citadelle/SeoNoIndex";

export default function CitadelleResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm]           = useState({ password: "", confirm: "" });
  const [showPassword, setShowPw] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  useCitadellePageMeta(t('auth.reset_title'));

  const token = searchParams.get("token");

  // Token absent → rediriger vers "Mot de passe oublié"
  useEffect(() => {
    if (!token) navigate("/citadelle/mot-de-passe-oublie");
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError(t('auth.err_password_length')); return;
    }
    if (form.password !== form.confirm) {
      setError(t('auth.err_password_match')); return;
    }

    setLoading(true);
    try {
      await citadelleApi.post("/auth/reset-password", {
        token,
        new_password: form.password
      });
      setSuccess(true);
      // Redirection automatique vers la connexion après 3 secondes
      setTimeout(() => navigate("/citadelle/connexion"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('auth.err_reset_expired'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: CITADELLE_COLORS.night }}
    >
      <SeoNoIndex />
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/citadelle" className="inline-flex items-center gap-2">
            <Shield size={28} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.white }}>
              {CITADELLE_CONFIG.name}
            </span>
          </Link>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.2)", backdropFilter: "blur(12px)" }}
          data-testid="reset-password-card"
        >
          {success ? (
            /* ── État succès ── */
            <div className="text-center" data-testid="reset-success">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.1)" }}>
                <CheckCircle size={28} style={{ color: "#22C55E" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: CITADELLE_COLORS.white }}>
                {t('auth.reset_success_title')}
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t('auth.reset_success_sub')}
              </p>
            </div>
          ) : (
            /* ── Formulaire ── */
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-1" style={{ color: CITADELLE_COLORS.white }}>
                  {t('auth.reset_title')}
                </h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {t('auth.reset_sub')}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4"
                  style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}
                  data-testid="reset-error">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {t('auth.new_password_label')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Minimum 8 caractères"
                      autoFocus
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white"
                      }}
                      data-testid="reset-new-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {t('auth.password_rules')}
                  </p>
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {t('auth.confirm_password_label')}
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Répétez votre mot de passe"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white"
                    }}
                    data-testid="reset-confirm-password-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02]"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="reset-submit-btn"
                >
                  {loading
                    ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                    : t('auth.save_password')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
