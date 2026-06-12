/**
 * Widget de chat flottant multi-bulles — La Citadelle Numérique
 * Une bulle colorée par conversation active, fermable individuellement.
 * Bleu : messages membres | Rouge : messages de La Garde
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Shield, ChevronDown } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// Statuts où une conversation est active
const STATUTS_ACTIFS = [
  "offer_sent", "offer_counter", "payment_pending", "payment_done",
  "credentials_submitted", "admin_verified", "disputed",
];

// Palette de couleurs pour les bulles (une par conversation)
const BUBBLE_PALETTE = [
  "#1D4ED8", // bleu
  "#059669", // vert
  "#7C3AED", // violet
  "#D97706", // ambre
  "#0891B2", // cyan
];

// Construit la liste unifiée des messages (normaux + litige)
const buildMessages = (tx, disputeMsgs, userEmail) => {
  const normal = (tx.messages || []).map(m => ({
    id: m.id || m.timestamp,
    content: m.content,
    is_system: m.type === "system",
    is_admin: false,
    is_mine: m.sender_email === userEmail,
    timestamp: m.timestamp || m.sent_at,
  }));

  const dispute = (disputeMsgs || []).map(m => ({
    id: m.id,
    content: m.content,
    is_system: false,
    is_admin: m.sender_role === "admin",
    is_mine: m.sender_role !== "admin",
    is_dispute: true,
    timestamp: m.sent_at,
  }));

  return [...normal, ...dispute].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
};

// ── Composant d'une bulle de chat ────────────────────────────────────────────
function ChatBubble({ tx, color, positionIndex, onClose, user, audioCtxRef }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [disputeMessages, setDisputeMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const prevMsgCount = useRef(0);
  const isFirstLoad = useRef(true);

  // Son médiéval (contexte partagé depuis le parent)
  const playMedievalSound = useCallback(async () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();
      const notes = [
        { freq: 523.25, delay: 0,    vol: 0.15 },
        { freq: 783.99, delay: 0.07, vol: 0.12 },
        { freq: 1046.5, delay: 0.14, vol: 0.07 },
      ];
      notes.forEach(({ freq, delay, vol }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 1.6);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 1.6);
      });
    } catch { /* silence */ }
  }, [audioCtxRef]);

  // Polling des messages (3s)
  useEffect(() => {
    prevMsgCount.current = 0;
    isFirstLoad.current = true;

    const load = async () => {
      try {
        const resTx = await citadelleApi.get(`/transactions/${tx.id}`);
        const txData = resTx.data;

        let dMsgs = [];
        const isSeller = txData.seller_id === user?.id;
        if (isSeller && txData.status === "disputed") {
          try {
            const rd = await citadelleApi.get(`/transactions/${tx.id}/dispute-messages`);
            dMsgs = rd.data.dispute_messages || [];
          } catch { /* acheteur : pas d'accès */ }
        }

        setDisputeMessages(dMsgs);
        setMessages(buildMessages(txData, dMsgs, user?.email));
      } catch { /* silence */ }
    };

    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [tx.id, user]);

  // Son + compteur non lus
  useEffect(() => {
    const nonSystem = messages.filter(m => !m.is_system);
    if (!isFirstLoad.current && nonSystem.length > prevMsgCount.current) {
      const last = nonSystem[nonSystem.length - 1];
      if (last && !last.is_mine) {
        playMedievalSound();
        if (!expanded) setUnreadCount(c => c + (nonSystem.length - prevMsgCount.current));
      }
    }
    prevMsgCount.current = nonSystem.length;
    if (nonSystem.length > 0) isFirstLoad.current = false;
  }, [messages, expanded, playMedievalSound]);

  // Scroll au dernier message
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages.length, expanded]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await citadelleApi.post(`/transactions/${tx.id}/message`, { content: message.trim() });
      setMessage("");
      const res = await citadelleApi.get(`/transactions/${tx.id}`);
      setMessages(buildMessages(res.data, disputeMessages, user?.email));
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  // Position horizontale : droite → gauche selon l'index
  const rightPx = 24 + (positionIndex + 1) * 72;

  // Initiales de l'annonce pour la bulle minimisée
  const initiales = (tx.listing_title || "?")
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="fixed z-40"
      style={{ bottom: "24px", right: `${rightPx}px` }}
    >
      {/* ── Fenêtre étendue ── */}
      {expanded && (
        <div
          className="absolute rounded-2xl overflow-hidden shadow-2xl flex flex-col mb-3"
          style={{
            bottom: "60px",
            right: "0",
            width: "300px",
            height: "420px",
            background: "white",
            border: `1px solid ${CITADELLE_COLORS.border}`,
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2.5 flex items-center gap-2 flex-shrink-0 cursor-pointer"
            style={{ background: color }}
            onClick={() => setExpanded(false)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{tx.listing_title || "Transaction"}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                {tx.status === "disputed" ? "Litige en cours" : "En cours"}
              </p>
            </div>
            <ChevronDown size={14} color="white" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.filter(m => !m.is_system).length === 0 ? (
              <p className="text-xs text-center pt-8" style={{ color: CITADELLE_COLORS.textMuted }}>
                Démarrez la conversation...
              </p>
            ) : messages.map((msg, i) => {
              if (msg.is_system) return (
                <div key={i} className="flex justify-center">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted }}>
                    {msg.content}
                  </span>
                </div>
              );

              if (msg.is_admin) return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[82%]">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Shield size={9} style={{ color: "#DC2626" }} />
                      <p className="text-xs font-bold" style={{ color: "#DC2626" }}>La Garde</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-2xl rounded-tl-sm text-sm"
                      style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );

              if (msg.is_mine) return (
                <div key={i} className="flex justify-end">
                  <div className="px-3 py-1.5 rounded-2xl rounded-tr-sm text-sm max-w-[82%] text-white"
                    style={{ background: color }}>
                    {msg.content}
                  </div>
                </div>
              );

              return (
                <div key={i} className="flex justify-start">
                  <div className="px-3 py-1.5 rounded-2xl rounded-tl-sm text-sm max-w-[82%]"
                    style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 flex gap-2 flex-shrink-0" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Votre message..."
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
            />
            <button onClick={sendMessage} disabled={sending || !message.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
              style={{ background: color, color: "white" }}>
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Bulle minimisée ── */}
      <div className="relative">
        {/* Badge non lus */}
        {!expanded && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center z-10"
            style={{ background: "#DC2626", color: "white" }}>
            {unreadCount}
          </span>
        )}

        {/* Bouton fermer la bulle */}
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
          title="Fermer cette conversation"
        >
          <X size={9} />
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 text-sm font-bold text-white select-none"
          style={{ background: color }}
          title={tx.listing_title}
        >
          {initiales || <MessageCircle size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CitadelleChatWidget() {
  const { user } = useCitadelleAuth();
  const [transactions, setTransactions] = useState([]);
  const [closedBubbles, setClosedBubbles] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("citadelle_closed_bubbles") || "[]")); }
    catch { return new Set(); }
  });
  const audioCtxRef = useRef(null);

  // Initialiser l'AudioContext au premier clic (obligatoire navigateurs modernes)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { /* non supporté */ }
    }
  };

  // Charger les transactions actives (polling 8s)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await citadelleApi.get("/transactions/my");
        const actives = (res.data.transactions || []).filter(tx => STATUTS_ACTIFS.includes(tx.status));
        setTransactions(actives);
      } catch { /* silence */ }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const closeBubble = (txId) => {
    setClosedBubbles(prev => {
      const next = new Set(prev);
      next.add(txId);
      try { localStorage.setItem("citadelle_closed_bubbles", JSON.stringify([...next])); }
      catch { /* silence */ }
      return next;
    });
  };

  if (!user) return null;

  // Conversations visibles (non fermées)
  const visibleTx = transactions.filter(tx => !closedBubbles.has(tx.id));

  return (
    <>
      {visibleTx.map((tx, i) => (
        <ChatBubble
          key={tx.id}
          tx={tx}
          color={BUBBLE_PALETTE[i % BUBBLE_PALETTE.length]}
          positionIndex={i}
          onClose={() => closeBubble(tx.id)}
          user={user}
          audioCtxRef={audioCtxRef}
          onClick={initAudio}
        />
      ))}

      {/* Bulle principale (accès rapide à toutes les convs) */}
      <button
        onClick={initAudio}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110"
        style={{ background: CITADELLE_COLORS.night, border: `2px solid ${CITADELLE_COLORS.gold}` }}
        data-testid="chat-widget-btn"
        title="Mes conversations"
      >
        <MessageCircle size={20} style={{ color: CITADELLE_COLORS.gold }} />
      </button>
    </>
  );
}
