/**
 * CitadellePaymentSuccess — Page de confirmation de paiement Stripe
 * Récupère session_id depuis l'URL, poll le statut, affiche le résultat
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader, Shield, ArrowRight, TrendingUp, UserPlus } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import { SeoNoIndex } from "@/components/citadelle/SeoNoIndex";
import { useTranslation } from "react-i18next";

const MAX_POLLS = 8;
const POLL_INTERVAL_MS = 2500;

export default function CitadellePaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isAuthenticated } = useCitadelleAuth();

  const [state, setState] = useState("loading");
  const [data, setData] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setState("failed");
      return;
    }
    pollStatus(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const pollStatus = async (attempt) => {
    if (attempt >= MAX_POLLS) {
      setState("failed");
      return;
    }
    try {
      const res = await citadelleApi.get(`/payments/service/status/${sessionId}`);
      const { payment_status, status } = res.data;

      setAttempts(attempt + 1);

      if (payment_status === "paid") {
        setData(res.data);
        setState("paid");
        return;
      }
      if (status === "expired") {
        setState("expired");
        return;
      }
      // En attente — on repoll
      setTimeout(() => pollStatus(attempt + 1), POLL_INTERVAL_MS);
    } catch {
      setTimeout(() => pollStatus(attempt + 1), POLL_INTERVAL_MS);
    }
  };

  return (
    <CitadelleLayout>
      <SeoNoIndex />
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}
        data-testid="payment-success-page"
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl text-center"
          style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Logo Citadelle */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(15,39,71,0.06)" }}
          >
            <Shield size={26} style={{ color: CITADELLE_COLORS.blue }} />
          </div>

          {/* ── Chargement ── */}
          {state === "loading" && (
            <>
              <Loader size={40} className="animate-spin mx-auto mb-4" style={{ color: CITADELLE_COLORS.gold }} />
              <h2 className="font-black text-xl mb-2" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                {t('payment.verifying')}
              </h2>
              <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t('payment.verifying_sub')}
              </p>
              {attempts > 2 && (
                <p className="text-xs mt-3" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {t('payment.verifying_wait')}
                </p>
              )}
            </>
          )}

          {/* ── Succès ── */}
          {state === "paid" && (() => {
            const isEstimation = data?.service_title?.toLowerCase().includes("estimation");
            const registerUrl  = `/citadelle/inscription${data?.client_email ? `?email=${encodeURIComponent(data.client_email)}` : ""}`;
            return (
              <>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: isEstimation ? "rgba(201,164,92,0.12)" : "rgba(34,197,94,0.1)" }}
                >
                  {isEstimation
                    ? <TrendingUp size={32} style={{ color: CITADELLE_COLORS.gold }} />
                    : <CheckCircle size={36} style={{ color: "#22C55E" }} />}
                </div>
                <h2
                  className="font-black text-2xl mb-2"
                  style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
                  data-testid="payment-success-title"
                >
                  {isEstimation ? t('payment.estimation_success') : t('payment.paid_success')}
                </h2>
                {data?.service_title && (
                  <p className="text-sm font-semibold mb-1" style={{ color: CITADELLE_COLORS.gold }}>
                    {data.service_title}
                  </p>
                )}
                {data?.amount && (
                  <p className="text-3xl font-black my-3" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                    {Number(data.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </p>
                )}
                <p className="text-sm leading-relaxed mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {isEstimation
                    ? <>{t('payment.estimation_desc_before')}<strong>{t('payment.estimation_desc_delay')}</strong>{t('payment.estimation_desc_mid')}<strong>{data?.client_email}</strong>{t('payment.estimation_desc_after')}</>
                    : <>{t('payment.paid_desc_before')}<strong>{data?.client_email}</strong>{t('payment.paid_desc_after')}</>}
                </p>

                <div className="space-y-3">
                  {/* CTA principal */}
                  {isAuthenticated ? (
                    <Link
                      to="/citadelle/espace-membre/mes-services"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                      style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                      data-testid="payment-success-back-btn"
                    >
                      {t('payment.see_my_services')} <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link
                      to={registerUrl}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                      style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                      data-testid="payment-success-back-btn"
                    >
                      <UserPlus size={16} /> {t('payment.create_account')}
                    </Link>
                  )}

                  {/* CTA secondaire */}
                  <Link
                    to={isEstimation ? "/citadelle/annonces" : "/citadelle/services"}
                    className="block w-full py-3 rounded-xl text-sm font-medium"
                    style={{ color: CITADELLE_COLORS.textMuted }}
                  >
                    {isEstimation ? t('payment.browse_listings') : t('payment.back_services')}
                  </Link>
                </div>
              </>
            );
          })()}

          {/* ── Expiré ── */}
          {state === "expired" && (
            <>
              <XCircle size={40} className="mx-auto mb-4" style={{ color: "#EF4444" }} />
              <h2
                className="font-black text-xl mb-2"
                style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
              >
                {t('payment.expired_title')}
              </h2>
              <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t('payment.expired_desc')}
              </p>
              <Link
                to="/citadelle/services"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              >
                {t('payment.back_services')}
              </Link>
            </>
          )}

          {/* ── Échec ── */}
          {state === "failed" && (
            <>
              <XCircle size={40} className="mx-auto mb-4" style={{ color: "#EF4444" }} />
              <h2
                className="font-black text-xl mb-2"
                style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}
              >
                {t('payment.failed_title')}
              </h2>
              <p className="text-sm mb-6" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t('payment.failed_desc_before')}
                <a href="mailto:lagarde@lacitadellenumerique.fr" style={{ color: CITADELLE_COLORS.gold }}>
                  lagarde@lacitadellenumerique.fr
                </a>
              </p>
              <Link
                to="/citadelle/services"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
              >
                {t('payment.back_services')}
              </Link>
            </>
          )}
        </div>
      </div>
    </CitadelleLayout>
  );
}
