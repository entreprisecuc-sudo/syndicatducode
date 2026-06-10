/**
 * Détail transaction — La Citadelle Numérique
 * Affiche le fil de la transaction + actions contextuelles selon le rôle et le statut
 */

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Send, CheckCircle, XCircle, CreditCard, Shield, Lock,
  AlertTriangle, Clock, ArrowRight, MessageSquare
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
  const [actionLoading, setActionLoading] = useState(false);
  const [counterModal, setCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchTransaction(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [tx?.messages?.length]);

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

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get(`/transactions/${id}`);
      setTx(res.data);
    } catch { setTx(null); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await citadelleApi.post(`/transactions/${id}/message`, { content: message.trim() });
      setMessage("");
      await fetchTransaction();
    } catch { /* ignore */ }
    finally { setSending(false); }
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
  const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.cancelled;
  const finalAmount = tx.payment_amount || tx.counter_amount || tx.offer_amount;

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
                  {isBuyer ? "Les accès sont disponibles ci-dessous." : "Les fonds ont été libérés."}
                </p>
              </div>
            </div>
          )}

          {/* Acheteur : voir les credentials après completion */}
          {isBuyer && tx.status === "completed" && tx.credentials?.data && (
            <div className="p-4 rounded-xl" style={{ background: CITADELLE_COLORS.night, border: "1px solid rgba(201,164,92,0.3)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} style={{ color: CITADELLE_COLORS.gold }} />
                <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.gold }}>Accès de votre actif numérique</span>
              </div>
              <pre className="text-sm whitespace-pre-wrap p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: CITADELLE_COLORS.white }}>
                {tx.credentials.data}
              </pre>
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
            <div className="px-4 py-3 flex gap-2" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}>
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
          )}
        </div>

        {/* Modal contre-offre */}
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
