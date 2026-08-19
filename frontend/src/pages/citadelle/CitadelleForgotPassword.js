/**
 * Mot de passe oublié — La Citadelle Numérique
 * Saisie de l'email pour recevoir le lien de réinitialisation
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CONFIG } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";
import { SeoNoIndex } from "@/components/citadelle/SeoNoIndex";

export default function CitadelleForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  useCitadellePageMeta(t('auth.forgot_title'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(t('auth.err_email_input')); return; }
    setLoading(true);
    setError("");
    try {
      await citadelleApi.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      // On ne révèle pas si l'email existe — message générique
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

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
          data-testid="forgot-password-card"
        >
          {sent ? (
            /* ── État succès ── */
            <div className="text-center" data-testid="forgot-success">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.1)" }}>
                <CheckCircle size={28} style={{ color: "#22C55E" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: CITADELLE_COLORS.white }}>
                {t('auth.email_sent_title')}
              </h1>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t('auth.email_sent_desc_1')} <strong style={{ color: CITADELLE_COLORS.white }}>{email}</strong>{t('auth.email_sent_desc_2')}
              </p>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                {t('auth.email_sent_spam')}
              </p>
              <Link
                to="/citadelle/connexion"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              >
                {t('auth.back_to_login')}
              </Link>
            </div>
          ) : (
            /* ── Formulaire ── */
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-1" style={{ color: CITADELLE_COLORS.white }}>
                  {t('auth.forgot_title')}
                </h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {t('auth.forgot_sub')}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4"
                  style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {t('auth.email_label')}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="votre@email.fr"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white"
                      }}
                      data-testid="forgot-email-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02]"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="forgot-submit-btn"
                >
                  {loading
                    ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                    : t('auth.send_link')}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Link
                  to="/citadelle/connexion"
                  className="inline-flex items-center gap-1 font-medium transition-colors"
                  style={{ color: CITADELLE_COLORS.gold }}
                >
                  <ArrowLeft size={14} /> {t('auth.back_to_login')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
