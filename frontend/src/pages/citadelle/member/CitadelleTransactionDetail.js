/**
 * Détail transaction — La Citadelle Numérique
 * Affiche le fil de la transaction + actions contextuelles selon le rôle et le statut
 */

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Send, CheckCircle, XCircle, CreditCard, Shield, Lock,
  AlertTriangle, Clock, ArrowRight, MessageSquare, Scale, Ban, Info, X
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { AttachmentButton, AttachmentPreview, MessageAttachments } from "@/components/citadelle/messageAttachments";
import { ReportConversationButton } from "@/components/citadelle/ReportConversationButton";

const STATUS_CONFIG = {
  offer_sent:            { labelKey: "transaction.status_offer_sent",            color: "#F59E0B" },
  offer_accepted:        { labelKey: "transaction.status_offer_accepted",        color: "#22C55E" },
  offer_refused:         { labelKey: "transaction.status_offer_refused",         color: "#DC2626" },
  offer_countered:       { labelKey: "transaction.status_offer_countered",       color: "#3B82F6" },
  payment_done:          { labelKey: "transaction.status_payment_done",          color: "#8B5CF6" },
  credentials_submitted: { labelKey: "transaction.status_credentials_submitted", color: "#F59E0B" },
  admin_verified:        { labelKey: "transaction.status_admin_verified",        color: "#22C55E" },
  completed:             { labelKey: "transaction.status_completed",             color: "#22C55E" },
  disputed:              { labelKey: "transaction.status_disputed",              color: "#DC2626" },
  cancelled:             { labelKey: "transaction.status_cancelled",             color: "#6B7280" },
};

export default function CitadelleTransactionDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useCitadelleAuth();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "confirming" | "success" | "cancelled"
  const [message, setMessage] = useState("");
  const [msgAttachments, setMsgAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [sanitizedWarning, setSanitizedWarning] = useState(false);
  const [sanitizedDisputeWarning, setSanitizedDisputeWarning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [counterModal, setCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState("");
  const messagesEndRef = useRef(null);

  // États pour la gestion des litiges
  const [disputeModal, setDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelInfo, setCancelInfo] = useState(null);
  const [cancelInfoLoading, setCancelInfoLoading] = useState(false);
  const [disputeMessages, setDisputeMessages] = useState([]);
  const [disputeMessage, setDisputeMessage] = useState("");
  const [disputeAttachments, setDisputeAttachments] = useState([]);
  const [sendingDispute, setSendingDispute] = useState(false);
  const disputeEndRef = useRef(null);

  // État pour l'annulation vendeur en litige
  const [sellerCancelModal, setSellerCancelModal] = useState(false);
  const [sellerCancelInfo, setSellerCancelInfo] = useState(null);
  const [sellerCancelInfoLoading, setSellerCancelInfoLoading] = useState(false);

  // Bannière KYC vendeur (soft block — peut être fermée)
  const [kycBannerDismissed, setKycBannerDismissed] = useState(false);

  // Retrait de proposition (acheteur, avant paiement)
  const [withdrawModal, setWithdrawModal] = useState(false);

  const fetchSellerCancelInfo = async () => {
    setSellerCancelInfoLoading(true);
    try {
      const res = await citadelleApi.get(`/transactions/${id}/cancellation-fee`);
      setSellerCancelInfo(res.data);
    } catch { setSellerCancelInfo(null); }
    finally { setSellerCancelInfoLoading(false); }
  };

  useEffect(() => { fetchTransaction(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [tx?.messages?.length]);
  useEffect(() => { disputeEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [disputeMessages.length]);

  // Polling toutes les 3 secondes pour conversation fluide
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await citadelleApi.get(`/transactions/${id}`);
        setTx(prev => {
          if (!prev || res.data.messages?.length !== prev.messages?.length || res.data.status !== prev.status) return res.data;
          return prev;
        });
      } catch { /* silence */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  // Gestion retour depuis Stripe Checkout
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    if (paymentParam === "success") {
      setPaymentStatus("confirming");
      citadelleApi.post(`/transactions/${id}/confirm-payment`)
        .then(() => { setPaymentStatus("success"); fetchTransaction(); })
        .catch(() => setPaymentStatus("error"));
    } else if (paymentParam === "cancelled") {
      setPaymentStatus("cancelled");
    }
  }, [id]); // eslint-disable-line

  // Polling des messages litige (vendeur et admin uniquement)
  useEffect(() => {
    if (!tx || !user) return;
    const isSeller = tx.seller_id === user?.id;
    const isAdmin = user?.role === "admin";
    if (!isSeller && !isAdmin) return;
    if (tx.status !== "disputed") return;

    const interval = setInterval(async () => {
      try {
        const res = await citadelleApi.get(`/transactions/${id}/dispute-messages`);
        setDisputeMessages(prev => {
          if (res.data.dispute_messages?.length !== prev.length) return res.data.dispute_messages;
          return prev;
        });
      } catch { /* silence */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, tx?.status, user]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get(`/transactions/${id}`);
      setTx(res.data);
      // Charger les messages litige si applicable
      const isSeller = res.data.seller_id === user?.id;
      const isAdmin = user?.role === "admin";
      if ((isSeller || isAdmin) && res.data.status === "disputed") {
        fetchDisputeMessages();
      }
    } catch { setTx(null); }
    finally { setLoading(false); }
  };

  const fetchDisputeMessages = async () => {
    try {
      const res = await citadelleApi.get(`/transactions/${id}/dispute-messages`);
      setDisputeMessages(res.data.dispute_messages || []);
    } catch { /* silence */ }
  };

  const fetchCancelInfo = async () => {
    setCancelInfoLoading(true);
    try {
      const res = await citadelleApi.get(`/transactions/${id}/cancellation-fee`);
      setCancelInfo(res.data);
    } catch { setCancelInfo(null); }
    finally { setCancelInfoLoading(false); }
  };

  const sendMessage = async () => {
    if ((!message.trim() && msgAttachments.length === 0) || sending) return;
    setSending(true);
    setSanitizedWarning(false);
    try {
      const res = await citadelleApi.post(`/transactions/${id}/message`, { content: message.trim(), attachments: msgAttachments });
      if (res.data.sanitized) setSanitizedWarning(true);
      setMessage("");
      setMsgAttachments([]);
      await fetchTransaction();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const sendDisputeMessage = async () => {
    if ((!disputeMessage.trim() && disputeAttachments.length === 0) || sendingDispute) return;
    setSendingDispute(true);
    setSanitizedDisputeWarning(false);
    try {
      const res = await citadelleApi.post(`/transactions/${id}/dispute-messages`, { content: disputeMessage.trim(), attachments: disputeAttachments });
      if (res.data.sanitized) setSanitizedDisputeWarning(true);
      setDisputeMessage("");
      setDisputeAttachments([]);
      await fetchDisputeMessages();
    } catch { /* ignore */ }
    finally { setSendingDispute(false); }
  };

  const doAction = async (endpoint, body = null) => {
    setActionLoading(true);
    try {
      const res = await citadelleApi.post(`/transactions/${id}/${endpoint}`, body);
      // Paiement Stripe : redirection vers Stripe Checkout
      if (endpoint === "pay" && res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      await fetchTransaction();
    } catch (err) {
      alert(err.response?.data?.detail || t("transaction.err_generic"));
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
      </div>
    </CitadelleLayout>
  );

  if (!tx) return (
    <CitadelleLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🏰</p>
        <h1 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.not_found")}</h1>
        <Link to="/citadelle/espace-membre/transactions" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
          <ArrowLeft size={16} /> {t("transaction.back")}
        </Link>
      </div>
    </CitadelleLayout>
  );

  const isBuyer = tx.buyer_id === user?.id;
  const isSeller = tx.seller_id === user?.id;
  const isAdmin = user?.role === "admin";
  const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.cancelled;
  const finalAmount = tx.payment_amount || tx.counter_amount || tx.offer_amount;

  // Statuts où les fonds sont en séquestre
  const STATUTS_SEQUESTRE = ["payment_done", "credentials_submitted", "admin_verified", "disputed"];

  // Statuts avant paiement où l'acheteur peut retirer sa proposition
  const STATUTS_RETRAIT = ["offer_sent", "offer_countered", "offer_accepted"];

  return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8" data-testid="transaction-detail">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/citadelle/espace-membre/transactions" className="p-2 rounded-lg" style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              {tx.listing_title}
            </h1>
            <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              {isBuyer ? `${t("transaction.seller_label")} : ${tx.seller_email}` : `${t("transaction.buyer_label")} : ${tx.buyer_email}`}
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: `${statusCfg.color}15`, color: statusCfg.color }}>
            {t(statusCfg.labelKey)}
          </span>
        </div>

        {/* Résumé montant */}
        <div className="p-4 rounded-xl mb-6 flex items-center justify-between" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <span className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.agreed_amount")}</span>
          <span className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            {finalAmount?.toLocaleString("fr-FR")} €
          </span>
        </div>

        {/* Actions contextuelles */}
        <div className="space-y-3 mb-6">

          {/* Bannière fonds bloqués — visible par l'acheteur pendant le séquestre */}
          {isBuyer && STATUTS_SEQUESTRE.includes(tx.status) && tx.status !== "disputed" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(15,39,71,0.06)", border: `1px solid ${CITADELLE_COLORS.blue}30` }}>
              <Shield size={16} style={{ color: CITADELLE_COLORS.blue, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.escrow_title")}</p>
                <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {t("transaction.escrow_desc", { amount: finalAmount?.toLocaleString("fr-FR") })}
                </p>
              </div>
            </div>
          )}

          {/* Bannière litige en cours — visible par l'acheteur */}
          {isBuyer && tx.status === "disputed" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <Scale size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#DC2626" }}>{t("transaction.dispute_banner_title")}</p>
                <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {tx.dispute_reason && <>{t("transaction.dispute_reason_label")} : {tx.dispute_reason}<br /></>}
                  {t("transaction.dispute_banner_desc")}
                </p>
              </div>
            </div>
          )}

          {/* Bouton ouvrir un litige — acheteur, séquestre hors litige */}
          {isBuyer && ["payment_done", "credentials_submitted", "admin_verified"].includes(tx.status) && (
            <button
              onClick={() => setDisputeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.03)" }}
              data-testid="btn-open-dispute">
              <AlertTriangle size={13} /> {t("transaction.open_dispute_btn")}
            </button>
          )}

          {/* Bouton annuler l'achat — acheteur, séquestre, après 7 jours */}
          {isBuyer && STATUTS_SEQUESTRE.includes(tx.status) && (
            <button
              onClick={() => { fetchCancelInfo(); setCancelModal(true); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}
              data-testid="btn-cancel-purchase">
              <Ban size={13} /> {t("transaction.cancel_purchase_btn")}
            </button>
          )}
          {/* Vendeur : accepter/refuser/contre-offre */}
          {isSeller && tx.status === "offer_sent" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(201,164,92,0.06)", border: `1px solid rgba(201,164,92,0.2)` }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                {t("transaction.offer_received", { amount: tx.offer_amount?.toLocaleString("fr-FR") })}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => doAction("accept")} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#22C55E", color: "white" }} data-testid="btn-accept">
                  <CheckCircle size={14} /> {t("transaction.accept")}
                </button>
                <button onClick={() => setCounterModal(true)} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.blue, color: "white" }} data-testid="btn-counter">
                  <ArrowRight size={14} /> {t("transaction.counter")}
                </button>
                <button onClick={() => doAction("refuse")} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#DC2626", color: "white" }} data-testid="btn-refuse">
                  <XCircle size={14} /> {t("transaction.refuse")}
                </button>
              </div>
            </div>
          )}

          {/* Acheteur : accepter contre-offre */}
          {isBuyer && tx.status === "offer_countered" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                {t("transaction.counter_from_seller", { amount: tx.counter_amount?.toLocaleString("fr-FR") })}
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>{tx.counter_message}</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => doAction("accept-counter")} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#22C55E", color: "white" }} data-testid="btn-accept-counter">
                  <CheckCircle size={14} /> {t("transaction.accept_counter")}
                </button>
                <button onClick={() => setCounterModal(true)} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.blue, color: "white" }} data-testid="btn-buyer-counter">
                  <ArrowRight size={14} /> {t("transaction.new_proposal")}
                </button>
              </div>
            </div>
          )}

          {/* Acheteur : payer */}
          {isBuyer && tx.status === "offer_accepted" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                {t("transaction.offer_accepted_pay_title")}
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.escrow_until_final")}
              </p>
              <button onClick={() => doAction("pay")} disabled={actionLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }} data-testid="btn-pay">
                <CreditCard size={15} /> {t("transaction.pay_amount", { amount: finalAmount?.toLocaleString("fr-FR") })}
              </button>
            </div>
          )}

          {/* Acheteur : retirer sa proposition — avant paiement (offre envoyée / contre-offre / acceptée) */}
          {isBuyer && STATUTS_RETRAIT.includes(tx.status) && (
            <button
              onClick={() => setWithdrawModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}
              data-testid="btn-withdraw-offer">
              <Ban size={13} /> {t("transaction.withdraw_offer_btn")}
            </button>
          )}

          {/* Vendeur : proposition de seconde chance (déclenchée par l'admin) */}
          {isSeller && tx.second_chance_requested && !tx.second_chance_done && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(201,164,92,0.08)", border: `1px solid ${CITADELLE_COLORS.gold}` }} data-testid="seller-second-chance-banner">
              <p className="text-sm font-bold flex items-center gap-2" style={{ color: CITADELLE_COLORS.blue }}>
                <ArrowRight size={16} style={{ color: CITADELLE_COLORS.gold }} /> {t("transaction.second_chance_title")}
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.second_chance_desc", { amount: tx.second_chance_next_bidder?.amount ? ` (${tx.second_chance_next_bidder.amount.toLocaleString("fr-FR")} €)` : "" })}
              </p>
              <div className="flex gap-2">
                <button onClick={() => doAction("confirm-second-chance")} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="btn-confirm-second-chance">
                  <CheckCircle size={14} /> {t("transaction.confirm")}
                </button>
                <button onClick={() => doAction("decline-second-chance")} disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{ color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid="btn-decline-second-chance">
                  {t("transaction.refuse")}
                </button>
              </div>
            </div>
          )}
          {isSeller && tx.second_chance_done && (
            <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#16A34A" }} data-testid="seller-second-chance-done">
              {t("transaction.second_chance_done")}
            </div>
          )}

          {/* Bannière KYC vendeur — soft block, fonds en séquestre + profil incomplet */}
          {isSeller && STATUTS_SEQUESTRE.includes(tx.status) && !kycBannerDismissed && (!user?.phone || !user?.date_of_birth) && (
            <KycSellerBanner
              user={user}
              onDismiss={() => setKycBannerDismissed(true)}
            />
          )}

          {/* Vendeur : transmettre les accès */}
          {isSeller && tx.status === "payment_done" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                {t("transaction.payment_received_title")}
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.credentials_submit_desc")}
              </p>
              <button onClick={() => setCredentialsModal(true)} disabled={actionLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }} data-testid="btn-credentials">
                <Shield size={15} /> {t("transaction.transmit_access")}
              </button>
            </div>
          )}

          {/* Statuts d'attente */}
          {tx.status === "credentials_submitted" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.credentials_submitted_wait")}
              </p>
            </div>
          )}

          {tx.status === "completed" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={16} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>{t("transaction.sale_completed")}</p>
                {isBuyer && (
                  <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {tx.credentials_transmitted
                      ? t("transaction.access_transmitted_secure")
                      : t("transaction.funds_escrow_soon")}
                  </p>
                )}
                {isSeller && (
                  <div className="mt-2 space-y-1.5">
                    {tx.net_seller_amount != null && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.net_received")}</span>
                        <span className="font-bold text-sm" style={{ color: "#22C55E" }}>
                          {tx.net_seller_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                        </span>
                      </div>
                    )}
                    {tx.commission_amount != null && (
                      <div className="flex items-center justify-between text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        <span>{t("transaction.platform_commission")}</span>
                        <span>{tx.commission_amount?.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                      </div>
                    )}
                    {tx.stripe_transfer_id ? (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22C55E" }}>
                        <CheckCircle size={11} />
                        <span>{t("transaction.stripe_transfer_done")}</span>
                        <span className="font-mono opacity-50 text-xs">{tx.stripe_transfer_id}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#d97706" }}>
                        <AlertTriangle size={11} />
                        <span>{t("transaction.manual_transfer_processing")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acheteur : voir les credentials transmis par l'admin */}
          {isBuyer && tx.status === "completed" && tx.credentials?.data && (
            <div className="p-4 rounded-xl" style={{ background: CITADELLE_COLORS.night, border: "1px solid rgba(201,164,92,0.3)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} style={{ color: CITADELLE_COLORS.gold }} />
                <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.gold }}>{t("transaction.secure_access_title")}</span>
              </div>
              <pre className="text-sm whitespace-pre-wrap p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: CITADELLE_COLORS.white }}>
                {tx.credentials.data}
              </pre>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                {t("transaction.transmitted_by_admin")}
              </p>
            </div>
          )}

          {/* Acheteur : en attente de transmission */}
          {isBuyer && tx.status === "completed" && !tx.credentials?.data && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.admin_preparing_transmission")}
              </p>
            </div>
          )}
        </div>

        {/* Messagerie */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: CITADELLE_COLORS.bg, borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
            <MessageSquare size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.conversation")}</span>
            <span className="text-xs ml-auto" style={{ color: CITADELLE_COLORS.textMuted }}>{tx.messages?.length || 0} {t("transaction.messages_suffix")}</span>
            <ReportConversationButton conversationType="transaction" conversationId={tx.id} compact />
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto" style={{ background: "white" }}>
            {tx.messages?.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === "system" ? "justify-center" : msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                {msg.type === "system" ? (
                  <p className="text-xs px-3 py-1.5 rounded-full max-w-md text-center" style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted }}>
                    {msg.content}
                  </p>
                ) : (
                  <div className="max-w-xs">
                    <p className="text-xs mb-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {msg.sender_email === user?.email ? t("transaction.you") : msg.sender_email}
                    </p>
                    <div className="px-3 py-2 rounded-xl text-sm" style={{
                      background: msg.sender_id === user?.id ? CITADELLE_COLORS.blue : CITADELLE_COLORS.bg,
                      color: msg.sender_id === user?.id ? "white" : CITADELLE_COLORS.blue
                    }}>
                      {msg.content}
                      <MessageAttachments attachments={msg.attachments} mine={msg.sender_id === user?.id} />
                    </div>
                    <p className="text-xs mt-0.5 text-right" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {new Date(msg.sent_at).toLocaleTimeString(i18n.language === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          {!["offer_refused", "cancelled", "completed"].includes(tx.status) && (
            <div style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}>
              {sanitizedWarning && (
                <div className="px-4 pt-3 pb-1">
                  <div
                    className="px-4 py-2.5 rounded-xl text-xs"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#92400E" }}
                    data-testid="sanitized-warning-tx"
                  >
                    {t("transaction.sanitized_warning")}
                  </div>
                </div>
              )}
              <AttachmentPreview attachments={msgAttachments} setAttachments={setMsgAttachments} />
              <div className="px-4 py-3 flex gap-2">
                <AttachmentButton attachments={msgAttachments} setAttachments={setMsgAttachments} disabled={sending} />
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={t("transaction.message_placeholder")}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="message-input"
                />
                <button onClick={sendMessage} disabled={sending || (!message.trim() && msgAttachments.length === 0)}
                  className="px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="send-message-btn">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Litige — visible uniquement Vendeur et Admin, en cas de litige ouvert */}
        {(isSeller || isAdmin) && tx.status === "disputed" && (
          <div className="rounded-2xl overflow-hidden mt-4" style={{ border: "1px solid rgba(220,38,38,0.3)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: "rgba(220,38,38,0.05)", borderBottom: "1px solid rgba(220,38,38,0.2)" }}>
              <Scale size={15} style={{ color: "#DC2626" }} />
              <span className="text-sm font-bold" style={{ color: "#DC2626" }}>{t("transaction.dispute_chat_title")}</span>
              <span className="text-xs ml-auto px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
                {t("transaction.dispute_chat_badge")}
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto" style={{ background: "white" }}>
              {disputeMessages.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {t("transaction.dispute_no_messages")}
                </p>
              ) : disputeMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === (isAdmin ? "admin" : user?.id) ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-xs">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {msg.sender_role === "admin" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(15,39,71,0.1)", color: CITADELLE_COLORS.blue }}>
                          La Garde
                        </span>
                      )}
                      <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {msg.sender_role === "admin" ? "La Garde" : t("transaction.you")}
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-xl text-sm" style={{
                      background: msg.sender_role === "admin" ? CITADELLE_COLORS.night : (msg.sender_id === user?.id ? CITADELLE_COLORS.blue : CITADELLE_COLORS.bg),
                      color: msg.sender_role === "admin" ? CITADELLE_COLORS.gold : (msg.sender_id === user?.id ? "white" : CITADELLE_COLORS.blue)
                    }}>
                      {msg.content}
                      <MessageAttachments attachments={msg.attachments} mine={msg.sender_role !== "admin" && msg.sender_id === user?.id} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {new Date(msg.sent_at).toLocaleTimeString(i18n.language === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={disputeEndRef} />
            </div>
            <div style={{ borderTop: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.03)" }}>
              {sanitizedDisputeWarning && (
                <div className="px-4 pt-3 pb-1">
                  <div
                    className="px-4 py-2.5 rounded-xl text-xs"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#92400E" }}
                    data-testid="sanitized-warning-dispute"
                  >
                    {t("transaction.sanitized_warning")}
                  </div>
                </div>
              )}
              <AttachmentPreview attachments={disputeAttachments} setAttachments={setDisputeAttachments} />
              <div className="px-4 py-3 flex gap-2">
                <AttachmentButton attachments={disputeAttachments} setAttachments={setDisputeAttachments} disabled={sendingDispute} color="#DC2626" />
                <input
                  value={disputeMessage}
                  onChange={e => setDisputeMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendDisputeMessage()}
                  placeholder={t("transaction.dispute_message_placeholder")}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "white", border: "1px solid rgba(220,38,38,0.2)", color: CITADELLE_COLORS.blue }}
                  data-testid="dispute-message-input"
                />
                <button onClick={sendDisputeMessage} disabled={sendingDispute || (!disputeMessage.trim() && disputeAttachments.length === 0)}
                  className="px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all"
                  style={{ background: "#DC2626", color: "white" }}
                  data-testid="dispute-send-btn">
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Bouton annulation vendeur — visible uniquement pour le vendeur */}
            {isSeller && (
              <div className="px-4 pb-4 pt-2" style={{ background: "rgba(220,38,38,0.03)" }}>
                <button
                  onClick={() => { fetchSellerCancelInfo(); setSellerCancelModal(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}
                  data-testid="btn-seller-cancel">
                  <Ban size={14} /> {t("transaction.cancel_sale_btn")}
                </button>
              </div>
            )}

          </div>
        )}

        {/* Modal panneau de facturation — Annulation vendeur en litige */}
        {sellerCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
              {/* En-tête */}
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: CITADELLE_COLORS.night }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.2)" }}>
                  <Scale size={18} style={{ color: "#DC2626" }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "white" }}>{t("transaction.billing_panel")}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t("transaction.seller_cancel_subtitle")}</p>
                </div>
              </div>

              {/* Corps */}
              {sellerCancelInfoLoading ? (
                <div className="px-6 py-10 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
                  <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.calculating_fees")}</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  {/* Récapitulatif transaction */}
                  <div className="p-4 rounded-xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                    <p className="text-xs font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.tx_summary")}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.listing")}</span>
                        <span className="font-medium truncate ml-4 text-right" style={{ color: CITADELLE_COLORS.blue, maxWidth: "180px" }}>{tx.listing_title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.escrow_amount")}</span>
                        <span className="font-bold" style={{ color: CITADELLE_COLORS.blue }}>{finalAmount?.toLocaleString("fr-FR")} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.buyer_label")}</span>
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{tx.buyer_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Facturation des frais de service */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.2)" }}>
                    <p className="text-xs font-bold mb-3" style={{ color: "#DC2626" }}>{t("transaction.cancel_service_fees")}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.service_fee_your_charge")}</span>
                        <span className="font-black" style={{ color: "#DC2626" }}>
                          {(sellerCancelInfo?.cancellation_fee ?? 49).toLocaleString("fr-FR")} €
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1.5" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.buyer_refund")}</span>
                        <span className="font-bold" style={{ color: "#22C55E" }}>
                          {(sellerCancelInfo?.refund_amount ?? (finalAmount - 49))?.toLocaleString("fr-FR")} €
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avertissement */}
                  <div className="p-3 rounded-xl flex items-start gap-2.5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
                    <AlertTriangle size={14} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {t("transaction.seller_cancel_warning_1")} <strong>{t("transaction.seller_cancel_warning_strong")}</strong>{t("transaction.seller_cancel_warning_2")}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setSellerCancelModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  {t("transaction.dont_cancel")}
                </button>
                <button
                  onClick={async () => {
                    await doAction("cancel-as-seller");
                    setSellerCancelModal(false);
                  }}
                  disabled={actionLoading || sellerCancelInfoLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-all"
                  style={{ background: "#DC2626", color: "white" }}
                  data-testid="seller-cancel-confirm-btn">
                  {t("transaction.confirm_pay_fees")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal ouverture litige */}
        {disputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} style={{ color: "#DC2626" }} />
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.open_dispute_title")}</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.dispute_modal_desc")}
              </p>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                rows={5}
                placeholder={t("transaction.dispute_reason_placeholder")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                data-testid="dispute-reason-input"
              />
              <p className="text-xs mt-1 text-right" style={{ color: CITADELLE_COLORS.textMuted }}>{disputeReason.length}/2000</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setDisputeModal(false); setDisputeReason(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  {t("transaction.cancel")}
                </button>
                <button
                  onClick={async () => {
                    await doAction("open-dispute", { reason: disputeReason });
                    setDisputeModal(false); setDisputeReason("");
                    fetchDisputeMessages();
                  }}
                  disabled={disputeReason.length < 10 || actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: "#DC2626", color: "white" }}
                  data-testid="dispute-submit-btn">
                  {t("transaction.open_dispute_submit")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal annulation achat */}
        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Ban size={18} style={{ color: CITADELLE_COLORS.blue }} />
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.cancel_purchase_btn")}</h3>
              </div>
              {cancelInfoLoading ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
                </div>
              ) : cancelInfo ? (
                <>
                  {cancelInfo.peut_annuler ? (
                    <>
                      <div className="p-4 rounded-xl mb-4" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.amount_paid")}</span>
                          <span className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{cancelInfo.payment_amount?.toLocaleString("fr-FR")} €</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color: "#DC2626" }}>{t("transaction.cancellation_fee")}</span>
                          <span className="font-semibold" style={{ color: "#DC2626" }}>— {cancelInfo.cancellation_fee?.toLocaleString("fr-FR")} €</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
                          <span className="font-bold" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.estimated_refund")}</span>
                          <span className="font-black" style={{ color: "#22C55E" }}>{cancelInfo.refund_amount?.toLocaleString("fr-FR")} €</span>
                        </div>
                      </div>
                      <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {t("transaction.cancel_fee_note", { fee: cancelInfo.cancellation_fee?.toLocaleString("fr-FR") })}
                      </p>
                      <div className="flex gap-3">
                        <button onClick={() => setCancelModal(false)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                          style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                          {t("transaction.dont_cancel")}
                        </button>
                        <button
                          onClick={async () => {
                            await doAction("cancel-purchase");
                            setCancelModal(false);
                          }}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                          style={{ background: "#DC2626", color: "white" }}
                          data-testid="cancel-confirm-btn">
                          {t("transaction.confirm_cancellation")}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-xl mb-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                        <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                          {t("transaction.cancel_available_in", { days: cancelInfo.jours_restants })}
                        </p>
                      </div>
                      <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {t("transaction.urgent_open_dispute")}
                      </p>
                      <button onClick={() => setCancelModal(false)}
                        className="w-full py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                        {t("transaction.close")}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: CITADELLE_COLORS.textMuted }}>{t("transaction.load_error")}</p>
              )}
            </div>
          </div>
        )}
        {/* Modal retrait de proposition — acheteur, avant paiement */}
        {withdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Ban size={18} style={{ color: CITADELLE_COLORS.blue }} />
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.withdraw_title")}</h3>
              </div>
              <div className="p-4 rounded-xl mb-4 flex items-start gap-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Info size={16} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {t("transaction.withdraw_no_payment_1")} <strong>{t("transaction.withdraw_no_payment_strong")}</strong>{t("transaction.withdraw_no_payment_2")}
                  {tx.status === "offer_accepted" && t("transaction.withdraw_accepted_note")}
                </p>
              </div>
              <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.withdraw_final_note")}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setWithdrawModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="withdraw-cancel-btn">
                  {t("transaction.dont_withdraw")}
                </button>
                <button
                  onClick={async () => {
                    await doAction("withdraw-offer");
                    setWithdrawModal(false);
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: "#DC2626", color: "white" }}
                  data-testid="withdraw-confirm-btn">
                  {t("transaction.confirm_withdraw")}
                </button>
              </div>
            </div>
          </div>
        )}
        {counterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: CITADELLE_COLORS.blue }}>
                {isBuyer ? t("transaction.new_proposal_title") : t("transaction.counter_title")}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.amount_label")}</label>
                  <input type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                    placeholder={t("transaction.your_price")} min="1" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                    data-testid="counter-amount" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.message_label")}</label>
                  <textarea value={counterMsg} onChange={e => setCounterMsg(e.target.value)} rows={3}
                    placeholder={isBuyer ? t("transaction.justify_new_proposal") : t("transaction.justify_counter")}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                    data-testid="counter-message" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setCounterModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  {t("transaction.cancel")}
                </button>
                <button onClick={async () => {
                  await doAction(isBuyer ? "buyer-counter" : "counter", { amount: parseFloat(counterAmount), message: counterMsg });
                  setCounterModal(false); setCounterAmount(""); setCounterMsg("");
                }} disabled={!counterAmount || !counterMsg || counterMsg.length < 10}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="counter-submit">
                  {t("transaction.send")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal credentials */}
        {credentialsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} style={{ color: CITADELLE_COLORS.gold }} />
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>{t("transaction.transmit_access")}</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                {t("transaction.credentials_modal_desc")}
              </p>
              <textarea value={credentialsData} onChange={e => setCredentialsData(e.target.value)} rows={6}
                placeholder={t("transaction.credentials_placeholder")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                data-testid="credentials-data" />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setCredentialsModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  {t("transaction.cancel")}
                </button>
                <button onClick={async () => {
                  await doAction("credentials", { data: credentialsData });
                  setCredentialsModal(false); setCredentialsData("");
                }} disabled={credentialsData.length < 10}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="credentials-submit">
                  {t("transaction.transmit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}


// ── Bannière KYC vendeur (soft block) ─────────────────────────────────────────
function KycSellerBanner({ user, onDismiss }) {
  const { t } = useTranslation();
  const missing = [];
  if (!user?.phone)         missing.push(t("transaction.kyc_phone"));
  if (!user?.date_of_birth) missing.push(t("transaction.kyc_dob"));
  if (!missing.length)      return null;

  const verb = missing.length > 1 ? t("transaction.kyc_are_missing") : t("transaction.kyc_is_missing");

  return (
    <div
      className="p-4 rounded-xl flex items-start gap-3 relative"
      style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.3)" }}
      data-testid="kyc-seller-banner"
    >
      <Info size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: CITADELLE_COLORS.gold }}>
          {t("transaction.kyc_title")}
        </p>
        <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
          {t("transaction.kyc_desc", { missing: missing.join(t("transaction.kyc_join")), verb })}
        </p>
        <Link
          to="/citadelle/espace-membre/profil"
          className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="kyc-banner-profile-link"
        >
          {t("transaction.kyc_complete_btn")}
        </Link>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: CITADELLE_COLORS.textMuted }}
        data-testid="kyc-banner-dismiss"
        title={t("transaction.close")}
      >
        <X size={14} />
      </button>
    </div>
  );
}
