/**
 * Détail transaction — La Citadelle Numérique
 * Affiche le fil de la transaction + actions contextuelles selon le rôle et le statut
 */

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Send, CheckCircle, XCircle, CreditCard, Shield, Lock,
  AlertTriangle, Clock, ArrowRight, MessageSquare, Scale, Ban
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const STATUS_CONFIG = {
  offer_sent:            { label: "Offre envoyée",     color: "#F59E0B" },
  offer_accepted:        { label: "Offre acceptée",    color: "#22C55E" },
  offer_refused:         { label: "Offre refusée",     color: "#DC2626" },
  offer_countered:       { label: "Contre-offre",      color: "#3B82F6" },
  payment_done:          { label: "Paiement effectué", color: "#8B5CF6" },
  credentials_submitted: { label: "Accès transmis",    color: "#F59E0B" },
  admin_verified:        { label: "Accès vérifiés",    color: "#22C55E" },
  completed:             { label: "Vente finalisée",   color: "#22C55E" },
  disputed:              { label: "Litige en cours",   color: "#DC2626" },
  cancelled:             { label: "Annulée",           color: "#6B7280" },
};

export default function CitadelleTransactionDetail() {
  const { id } = useParams();
  const { user } = useCitadelleAuth();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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
  const [sendingDispute, setSendingDispute] = useState(false);
  const disputeEndRef = useRef(null);

  // État pour l'annulation vendeur en litige
  const [sellerCancelModal, setSellerCancelModal] = useState(false);
  const [sellerCancelInfo, setSellerCancelInfo] = useState(null);
  const [sellerCancelInfoLoading, setSellerCancelInfoLoading] = useState(false);

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
    if (!message.trim() || sending) return;
    setSending(true);
    setSanitizedWarning(false);
    try {
      const res = await citadelleApi.post(`/transactions/${id}/message`, { content: message.trim() });
      if (res.data.sanitized) setSanitizedWarning(true);
      setMessage("");
      await fetchTransaction();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const sendDisputeMessage = async () => {
    if (!disputeMessage.trim() || sendingDispute) return;
    setSendingDispute(true);
    setSanitizedDisputeWarning(false);
    try {
      const res = await citadelleApi.post(`/transactions/${id}/dispute-messages`, { content: disputeMessage.trim() });
      if (res.data.sanitized) setSanitizedDisputeWarning(true);
      setDisputeMessage("");
      await fetchDisputeMessages();
    } catch { /* ignore */ }
    finally { setSendingDispute(false); }
  };

  const doAction = async (endpoint, body = null) => {
    setActionLoading(true);
    try {
      await citadelleApi.post(`/transactions/${id}/${endpoint}`, body);
      await fetchTransaction();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
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
        <h1 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>Transaction introuvable</h1>
        <Link to="/citadelle/espace-membre/transactions" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
          <ArrowLeft size={16} /> Retour
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
              {isBuyer ? `Vendeur : ${tx.seller_email}` : `Acheteur : ${tx.buyer_email}`}
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: `${statusCfg.color}15`, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>

        {/* Résumé montant */}
        <div className="p-4 rounded-xl mb-6 flex items-center justify-between" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <span className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>Montant convenu</span>
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
                <p className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>Fonds bloqués — La Garde veille</p>
                <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Vos fonds ({finalAmount?.toLocaleString("fr-FR")} €) sont sécurisés en séquestre.
                  Ils seront libérés uniquement après validation des accès par l'administrateur.
                </p>
              </div>
            </div>
          )}

          {/* Bannière litige en cours — visible par l'acheteur */}
          {isBuyer && tx.status === "disputed" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <Scale size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#DC2626" }}>Litige en cours — La Garde examine votre dossier</p>
                <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {tx.dispute_reason && <>Motif : {tx.dispute_reason}<br /></>}
                  L'administrateur et le vendeur examinent votre demande. Vous serez notifié de l'issue.
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
              <AlertTriangle size={13} /> Signaler un problème / Ouvrir un litige
            </button>
          )}

          {/* Bouton annuler l'achat — acheteur, séquestre, après 7 jours */}
          {isBuyer && STATUTS_SEQUESTRE.includes(tx.status) && (
            <button
              onClick={() => { fetchCancelInfo(); setCancelModal(true); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ color: CITADELLE_COLORS.textMuted, border: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}
              data-testid="btn-cancel-purchase">
              <Ban size={13} /> Annuler l'achat
            </button>
          )}
          {/* Vendeur : accepter/refuser/contre-offre */}
          {isSeller && tx.status === "offer_sent" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(201,164,92,0.06)", border: `1px solid rgba(201,164,92,0.2)` }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                Offre reçue : {tx.offer_amount?.toLocaleString("fr-FR")} €
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => doAction("accept")} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#22C55E", color: "white" }} data-testid="btn-accept">
                  <CheckCircle size={14} /> Accepter
                </button>
                <button onClick={() => setCounterModal(true)} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.blue, color: "white" }} data-testid="btn-counter">
                  <ArrowRight size={14} /> Contre-offre
                </button>
                <button onClick={() => doAction("refuse")} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#DC2626", color: "white" }} data-testid="btn-refuse">
                  <XCircle size={14} /> Refuser
                </button>
              </div>
            </div>
          )}

          {/* Acheteur : accepter contre-offre */}
          {isBuyer && tx.status === "offer_countered" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                Contre-offre du vendeur : {tx.counter_amount?.toLocaleString("fr-FR")} €
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>{tx.counter_message}</p>
              <div className="flex gap-2">
                <button onClick={() => doAction("accept-counter")} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "#22C55E", color: "white" }} data-testid="btn-accept-counter">
                  <CheckCircle size={14} /> Accepter la contre-offre
                </button>
              </div>
            </div>
          )}

          {/* Acheteur : payer */}
          {isBuyer && tx.status === "offer_accepted" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                Offre acceptée — Procédez au paiement
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                Les fonds seront placés en séquestre jusqu'à la finalisation de la vente.
              </p>
              <button onClick={() => doAction("pay")} disabled={actionLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }} data-testid="btn-pay">
                <CreditCard size={15} /> Payer {finalAmount?.toLocaleString("fr-FR")} € (simulé)
              </button>
            </div>
          )}

          {/* Vendeur : transmettre les accès */}
          {isSeller && tx.status === "payment_done" && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
                Paiement reçu — Transmettez les accès
              </p>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                Les accès seront envoyés à l'administrateur pour vérification. Ils ne seront transmis à l'acheteur qu'après validation.
              </p>
              <button onClick={() => setCredentialsModal(true)} disabled={actionLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }} data-testid="btn-credentials">
                <Shield size={15} /> Transmettre les accès
              </button>
            </div>
          )}

          {/* Statuts d'attente */}
          {tx.status === "credentials_submitted" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                Les accès ont été transmis. L'administrateur est en cours de vérification.
              </p>
            </div>
          )}

          {tx.status === "completed" && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={16} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>Vente finalisée</p>
                <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {isBuyer
                    ? (tx.credentials_transmitted
                      ? "Les accès vous ont été transmis de manière sécurisée."
                      : "Les fonds sont en séquestre. L'administrateur va vous transmettre les accès sous peu.")
                    : "Les fonds ont été libérés."}
                </p>
              </div>
            </div>
          )}

          {/* Acheteur : voir les credentials transmis par l'admin */}
          {isBuyer && tx.status === "completed" && tx.credentials?.data && (
            <div className="p-4 rounded-xl" style={{ background: CITADELLE_COLORS.night, border: "1px solid rgba(201,164,92,0.3)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} style={{ color: CITADELLE_COLORS.gold }} />
                <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.gold }}>Accès sécurisés de votre actif numérique</span>
              </div>
              <pre className="text-sm whitespace-pre-wrap p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: CITADELLE_COLORS.white }}>
                {tx.credentials.data}
              </pre>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Transmis par l'administrateur — Conservez ces informations en lieu sûr.
              </p>
            </div>
          )}

          {/* Acheteur : en attente de transmission */}
          {isBuyer && tx.status === "completed" && !tx.credentials?.data && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                L'administrateur prépare la transmission sécurisée de vos accès.
              </p>
            </div>
          )}
        </div>

        {/* Messagerie */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: CITADELLE_COLORS.bg, borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
            <MessageSquare size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Conversation</span>
            <span className="text-xs ml-auto" style={{ color: CITADELLE_COLORS.textMuted }}>{tx.messages?.length || 0} messages</span>
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
                      {msg.sender_email === user?.email ? "Vous" : msg.sender_email}
                    </p>
                    <div className="px-3 py-2 rounded-xl text-sm" style={{
                      background: msg.sender_id === user?.id ? CITADELLE_COLORS.blue : CITADELLE_COLORS.bg,
                      color: msg.sender_id === user?.id ? "white" : CITADELLE_COLORS.blue
                    }}>
                      {msg.content}
                    </div>
                    <p className="text-xs mt-0.5 text-right" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {new Date(msg.sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
                    Certaines informations de contact ont été masquées afin de maintenir les échanges sur La Citadelle.
                  </div>
                </div>
              )}
              <div className="px-4 py-3 flex gap-2">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Votre message..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="message-input"
                />
                <button onClick={sendMessage} disabled={sending || !message.trim()}
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
              <span className="text-sm font-bold" style={{ color: "#DC2626" }}>Chat Litige — Confidentiel</span>
              <span className="text-xs ml-auto px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
                Vendeur · La Garde
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto" style={{ background: "white" }}>
              {disputeMessages.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Aucun message pour l'instant. Exposez votre situation à l'administrateur.
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
                        {msg.sender_role === "admin" ? "La Garde" : "Vous"}
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-xl text-sm" style={{
                      background: msg.sender_role === "admin" ? CITADELLE_COLORS.night : (msg.sender_id === user?.id ? CITADELLE_COLORS.blue : CITADELLE_COLORS.bg),
                      color: msg.sender_role === "admin" ? CITADELLE_COLORS.gold : (msg.sender_id === user?.id ? "white" : CITADELLE_COLORS.blue)
                    }}>
                      {msg.content}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {new Date(msg.sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
                    Certaines informations de contact ont été masquées afin de maintenir les échanges sur La Citadelle.
                  </div>
                </div>
              )}
              <div className="px-4 py-3 flex gap-2">
                <input
                  value={disputeMessage}
                  onChange={e => setDisputeMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendDisputeMessage()}
                  placeholder="Votre message au vendeur / à La Garde..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "white", border: "1px solid rgba(220,38,38,0.2)", color: CITADELLE_COLORS.blue }}
                  data-testid="dispute-message-input"
                />
                <button onClick={sendDisputeMessage} disabled={sendingDispute || !disputeMessage.trim()}
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
                  <Ban size={14} /> Annuler la vente
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
                  <p className="font-bold text-sm" style={{ color: "white" }}>Panneau de facturation</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Annulation vendeur — Litige en cours</p>
                </div>
              </div>

              {/* Corps */}
              {sellerCancelInfoLoading ? (
                <div className="px-6 py-10 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
                  <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>Calcul des frais en cours...</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  {/* Récapitulatif transaction */}
                  <div className="p-4 rounded-xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                    <p className="text-xs font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>Récapitulatif de la transaction</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>Annonce</span>
                        <span className="font-medium truncate ml-4 text-right" style={{ color: CITADELLE_COLORS.blue, maxWidth: "180px" }}>{tx.listing_title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>Montant en séquestre</span>
                        <span className="font-bold" style={{ color: CITADELLE_COLORS.blue }}>{finalAmount?.toLocaleString("fr-FR")} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>Acheteur</span>
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>{tx.buyer_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Facturation des frais de service */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.2)" }}>
                    <p className="text-xs font-bold mb-3" style={{ color: "#DC2626" }}>Frais de service d'annulation</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>Frais de service (à votre charge)</span>
                        <span className="font-black" style={{ color: "#DC2626" }}>
                          {(sellerCancelInfo?.cancellation_fee ?? 49).toLocaleString("fr-FR")} €
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1.5" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
                        <span style={{ color: CITADELLE_COLORS.textMuted }}>Remboursement acheteur</span>
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
                      Cette action est <strong>définitive et irréversible</strong>. Les frais de service seront collectés et l'acheteur sera remboursé du reste. L'annonce sera remise en vente.
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
                  Ne pas annuler
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
                  Confirmer et payer les frais
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
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>Ouvrir un litige</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                Décrivez précisément le problème rencontré. L'administrateur (La Garde) examinera votre dossier et contactera le vendeur.
              </p>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                rows={5}
                placeholder="Ex : Le vendeur n'a pas transmis les accès dans les délais convenus..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                data-testid="dispute-reason-input"
              />
              <p className="text-xs mt-1 text-right" style={{ color: CITADELLE_COLORS.textMuted }}>{disputeReason.length}/2000</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setDisputeModal(false); setDisputeReason(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  Annuler
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
                  Ouvrir le litige
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
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>Annuler l'achat</h3>
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
                          <span style={{ color: CITADELLE_COLORS.textMuted }}>Montant payé</span>
                          <span className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>{cancelInfo.payment_amount?.toLocaleString("fr-FR")} €</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color: "#DC2626" }}>Frais d'annulation</span>
                          <span className="font-semibold" style={{ color: "#DC2626" }}>— {cancelInfo.cancellation_fee?.toLocaleString("fr-FR")} €</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
                          <span className="font-bold" style={{ color: CITADELLE_COLORS.blue }}>Remboursement estimé</span>
                          <span className="font-black" style={{ color: "#22C55E" }}>{cancelInfo.refund_amount?.toLocaleString("fr-FR")} €</span>
                        </div>
                      </div>
                      <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                        Les frais d'annulation de {cancelInfo.cancellation_fee?.toLocaleString("fr-FR")} € sont prélevés conformément aux conditions générales. Le remboursement est traité sous 5 à 10 jours ouvrés.
                      </p>
                      <div className="flex gap-3">
                        <button onClick={() => setCancelModal(false)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                          style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                          Ne pas annuler
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
                          Confirmer l'annulation
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-xl mb-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                        <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                          L'annulation sera disponible dans <strong>{cancelInfo.jours_restants} jour(s)</strong>.
                          Vous pourrez annuler 7 jours après le paiement.
                        </p>
                      </div>
                      <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                        Si vous avez un problème urgent, vous pouvez ouvrir un litige pour alerter La Garde.
                      </p>
                      <button onClick={() => setCancelModal(false)}
                        className="w-full py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                        Fermer
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: CITADELLE_COLORS.textMuted }}>Impossible de charger les informations.</p>
              )}
            </div>
          </div>
        )}
        {counterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: CITADELLE_COLORS.blue }}>Contre-offre</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Montant (€)</label>
                  <input type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                    placeholder="Votre prix" min="1" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                    data-testid="counter-amount" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Message</label>
                  <textarea value={counterMsg} onChange={e => setCounterMsg(e.target.value)} rows={3}
                    placeholder="Justifiez votre contre-offre..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                    data-testid="counter-message" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setCounterModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  Annuler
                </button>
                <button onClick={async () => {
                  await doAction("counter", { amount: parseFloat(counterAmount), message: counterMsg });
                  setCounterModal(false); setCounterAmount(""); setCounterMsg("");
                }} disabled={!counterAmount || !counterMsg || counterMsg.length < 10}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="counter-submit">
                  Envoyer
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
                <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>Transmettre les accès</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
                Ces informations seront transmises à l'administrateur pour vérification. Elles ne seront envoyées à l'acheteur qu'après validation.
              </p>
              <textarea value={credentialsData} onChange={e => setCredentialsData(e.target.value)} rows={6}
                placeholder="Identifiants, URL admin, clés API, instructions de transfert..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                data-testid="credentials-data" />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setCredentialsModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
                  Annuler
                </button>
                <button onClick={async () => {
                  await doAction("credentials", { data: credentialsData });
                  setCredentialsModal(false); setCredentialsData("");
                }} disabled={credentialsData.length < 10}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="credentials-submit">
                  Transmettre
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}
