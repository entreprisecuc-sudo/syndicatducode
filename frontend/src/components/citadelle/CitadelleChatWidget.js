/**
 * Widget de chat flottant — Espace membre La Citadelle Numérique
 * Visible sur toutes les pages de l'espace membre.
 * Bleu : conversations entre membres | Rouge : messages de La Garde
 * Synchronisé avec le chat de CitadelleTransactionDetail.js
 */

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// Statuts où une conversation est active
const STATUTS_ACTIFS = [
  "offer_sent", "offer_counter", "payment_pending", "payment_done",
  "credentials_submitted", "admin_verified", "disputed"
];

/**
 * Construit la liste unifiée des messages à afficher :
 * - Messages normaux de la transaction (bleu)
 * - Messages litige dispute_messages (rouge pour La Garde)
 * Triés chronologiquement.
 */
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

export default function CitadelleChatWidget() {
  const { user } = useCitadelleAuth();
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [messages, setMessages] = useState([]);
  const [disputeMessages, setDisputeMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMsgCount = useRef(0);
  const isFirstLoad = useRef(true);
  // AudioContext créé au premier clic (obligatoire pour les navigateurs modernes)
  const audioCtxRef = useRef(null);

  // ── Initialise l'AudioContext lors d'une interaction utilisateur ──────────
  const initAudio = () => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch { /* non supporté */ }
    }
  };

  // ── Son médiéval : accord de cloches de château (Do–Sol–Do) ──────────────
  const playMedievalSound = async () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();

      const notes = [
        { freq: 523.25, delay: 0,    vol: 0.15 },  // Do5
        { freq: 783.99, delay: 0.07, vol: 0.12 },  // Sol5
        { freq: 1046.5, delay: 0.14, vol: 0.07 },  // Do6
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
  };

  // ── Déclencher le son pour chaque nouveau message reçu ───────────────────
  useEffect(() => {
    const nonSystem = messages.filter(m => !m.is_system);
    if (!isFirstLoad.current && nonSystem.length > prevMsgCount.current) {
      const dernierMsg = nonSystem[nonSystem.length - 1];
      if (dernierMsg && !dernierMsg.is_mine) {
        playMedievalSound();
      }
    }
    prevMsgCount.current = nonSystem.length;
    if (nonSystem.length > 0) isFirstLoad.current = false;
  }, [messages]);

  // Charger les transactions actives (polling 5s)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await citadelleApi.get("/transactions/my");
        const actives = (res.data.transactions || []).filter(tx =>
          STATUTS_ACTIFS.includes(tx.status)
        );
        setTransactions(actives);
        if (actives.length === 1 && !selectedTx) {
          setSelectedTx(actives[0]);
        }
      } catch { /* silence */ }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Charger les messages de la transaction sélectionnée (polling 3s)
  useEffect(() => {
    if (!selectedTx) return;
    prevMsgCount.current = 0;
    isFirstLoad.current = true;    const load = async () => {
      try {
        const resTx = await citadelleApi.get(`/transactions/${selectedTx.id}`);
        const tx = resTx.data;

        // Charger les dispute_messages si vendeur en litige
        let dMsgs = [];
        const isSeller = tx.seller_id === user?.id;
        if (isSeller && tx.status === "disputed") {
          try {
            const resDm = await citadelleApi.get(`/transactions/${selectedTx.id}/dispute-messages`);
            dMsgs = resDm.data.dispute_messages || [];
          } catch { /* non accessible à l'acheteur */ }
        }

        setDisputeMessages(dMsgs);
        setMessages(buildMessages(tx, dMsgs, user?.email));
      } catch { /* silence */ }
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [selectedTx?.id, user]);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  const sendMessage = async () => {
    if (!message.trim() || sending || !selectedTx) return;
    setSending(true);
    try {
      await citadelleApi.post(`/transactions/${selectedTx.id}/message`, {
        content: message.trim()
      });
      setMessage("");
      // Recharger immédiatement
      const res = await citadelleApi.get(`/transactions/${selectedTx.id}`);
      setMessages(buildMessages(res.data, disputeMessages, user?.email));
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (!user) return null;

  const unread = transactions.length;

  return (
    <>
      {/* ── Bulle flottante ── */}
      <button
        onClick={() => { initAudio(); setOpen(!open); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110"
        style={{ background: CITADELLE_COLORS.night, border: `2px solid ${CITADELLE_COLORS.gold}` }}
        data-testid="chat-widget-btn"
      >
        {!open && unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: "#DC2626", color: "white" }}
          >
            {unread}
          </span>
        )}
        {open
          ? <X size={20} style={{ color: CITADELLE_COLORS.gold }} />
          : <MessageCircle size={20} style={{ color: CITADELLE_COLORS.gold }} />
        }
      </button>

      {/* ── Panneau de chat ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            width: "320px",
            height: "460px",
            background: "white",
            border: `1px solid ${CITADELLE_COLORS.border}`,
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
            style={{ background: CITADELLE_COLORS.night }}
          >
            {selectedTx && transactions.length > 1 && (
              <button onClick={() => setSelectedTx(null)} className="flex-shrink-0">
                <ChevronLeft size={16} style={{ color: CITADELLE_COLORS.gold }} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              {selectedTx ? (
                <>
                  <p className="text-xs font-bold truncate" style={{ color: "white" }}>
                    {selectedTx.listing_title || "Transaction"}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {selectedTx.status === "disputed" ? "Litige en cours" : "En cours"}
                  </p>
                </>
              ) : (
                <p className="text-xs font-bold" style={{ color: "white" }}>Mes conversations</p>
              )}
            </div>
            <div
              className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ background: "#22C55E" }}
            />
          </div>

          {/* ── Vue liste des transactions ── */}
          {!selectedTx ? (
            <div className="flex-1 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
                  <MessageCircle size={36} style={{ color: CITADELLE_COLORS.border }} />
                  <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Aucune conversation active pour le moment.
                  </p>
                </div>
              ) : (
                transactions.map(tx => (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:opacity-70 transition-all"
                    style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: CITADELLE_COLORS.blue }}>
                        {tx.listing_title || "Transaction"}
                      </p>
                      <p className="text-xs truncate" style={{ color: tx.status === "disputed" ? "#DC2626" : CITADELLE_COLORS.textMuted }}>
                        {tx.status === "disputed" ? "Litige en cours" : "En cours"}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: CITADELLE_COLORS.textMuted, flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* ── Zone messages ── */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {messages.filter(m => !m.is_system).length === 0 ? (
                  <p className="text-xs text-center pt-8" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Démarrez la conversation...
                  </p>
                ) : (
                  messages.map((msg, i) => {
                    // Message système → centré discret
                    if (msg.is_system) return (
                      <div key={i} className="flex justify-center">
                        <span
                          className="text-xs px-3 py-1 rounded-full text-center max-w-[90%]"
                          style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted }}
                        >
                          {msg.content}
                        </span>
                      </div>
                    );

                    // Message de La Garde → rouge, aligné gauche
                    if (msg.is_admin) return (
                      <div key={i} className="flex justify-start">
                        <div className="max-w-[80%]">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Shield size={10} style={{ color: "#DC2626" }} />
                            <p className="text-xs font-bold" style={{ color: "#DC2626" }}>La Garde</p>
                          </div>
                          <div
                            className="px-3 py-2 rounded-2xl rounded-tl-sm text-sm"
                            style={{
                              background: "rgba(220,38,38,0.07)",
                              color: "#DC2626",
                              border: "1px solid rgba(220,38,38,0.15)",
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );

                    // Message de l'utilisateur actuel → bleu, aligné droite
                    if (msg.is_mine) return (
                      <div key={i} className="flex justify-end">
                        <div
                          className="px-3 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[80%]"
                          style={{ background: CITADELLE_COLORS.blue, color: "white" }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );

                    // Message de l'autre membre → bleu clair, aligné gauche
                    return (
                      <div key={i} className="flex justify-start">
                        <div
                          className="px-3 py-2 rounded-2xl rounded-tl-sm text-sm max-w-[80%]"
                          style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue, border: `1px solid ${CITADELLE_COLORS.border}` }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Zone de saisie ── */}
              <div
                className="px-3 py-3 flex gap-2 flex-shrink-0"
                style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}
              >
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Votre message..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: CITADELLE_COLORS.bg,
                    border: `1px solid ${CITADELLE_COLORS.border}`,
                    color: CITADELLE_COLORS.blue,
                  }}
                  data-testid="widget-message-input"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !message.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-80 flex-shrink-0"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="widget-send-btn"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
