/**
 * Widget de chat flottant — La Citadelle Numérique
 * Une bulle principale → liste des conversations → vue chat.
 *
 * Chaque transaction peut générer deux conversations dans la liste :
 *  - mode "normal"  → échanges vendeur/acheteur (bleu)
 *  - mode "litige"  → chat La Garde (rouge), visible vendeur uniquement
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Shield, ChevronLeft } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// Statuts de transaction avec une conversation active
const STATUTS_ACTIFS = [
  "offer_sent", "offer_accepted", "offer_countered",
  "payment_pending", "payment_done",
  "credentials_submitted", "admin_verified", "disputed",
];

// ── Vue chat ──────────────────────────────────────────────────────────────────
// mode "normal"  → messages normaux vendeur/acheteur
// mode "litige"  → messages de litige La Garde (vendeur uniquement)
function VueChat({ tx, mode, onRetour, user, audioCtxRef }) {
  const estLitige = mode === "litige";
  const couleur = estLitige ? "#DC2626" : "#1D4ED8";

  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const finMessagesRef = useRef(null);
  const nbPrecedent = useRef(0);
  const premierChargement = useRef(true);

  // Son médiéval sur nouveau message reçu
  const jouerSon = useCallback(async () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();
      const notes = [
        { freq: 523.25, delai: 0,    vol: 0.15 },
        { freq: 783.99, delai: 0.07, vol: 0.12 },
        { freq: 1046.5, delai: 0.14, vol: 0.07 },
      ];
      notes.forEach(({ freq, delai, vol }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delai);
        gain.gain.setValueAtTime(vol, ctx.currentTime + delai);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delai + 1.6);
        osc.start(ctx.currentTime + delai);
        osc.stop(ctx.currentTime + delai + 1.6);
      });
    } catch { /* non supporté */ }
  }, [audioCtxRef]);

  // Chargement + polling 3 secondes
  useEffect(() => {
    nbPrecedent.current = 0;
    premierChargement.current = true;
    setMessages([]);

    const charger = async () => {
      try {
        let msgs = [];
        if (estLitige) {
          // Messages du chat litige
          const res = await citadelleApi.get(`/transactions/${tx.id}/dispute-messages`);
          msgs = res.data.dispute_messages || [];
        } else {
          // Messages normaux vendeur/acheteur
          const res = await citadelleApi.get(`/transactions/${tx.id}`);
          msgs = (res.data.messages || []).filter(m => m.type !== "system");
        }

        // Son sur nouveau message entrant
        if (!premierChargement.current && msgs.length > nbPrecedent.current) {
          const dernier = msgs[msgs.length - 1];
          const estMonMsg = estLitige
            ? dernier?.sender_role !== "admin"
            : dernier?.sender_id === user?.id;
          if (dernier && !estMonMsg) jouerSon();
        }
        nbPrecedent.current = msgs.length;
        if (msgs.length > 0) premierChargement.current = false;

        setMessages(msgs);
      } catch { /* silence */ }
    };

    charger();
    const intervalle = setInterval(charger, 3000);
    return () => clearInterval(intervalle);
  }, [tx.id, mode, user, estLitige, jouerSon]);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    finMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const envoyerMessage = async () => {
    if (!saisie.trim() || envoiEnCours) return;
    setEnvoiEnCours(true);
    try {
      const endpoint = estLitige
        ? `/transactions/${tx.id}/dispute-messages`
        : `/transactions/${tx.id}/message`;
      await citadelleApi.post(endpoint, { content: saisie.trim() });
      setSaisie("");
    } catch { /* silence */ }
    finally { setEnvoiEnCours(false); }
  };

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
        style={{ background: couleur }}>
        <button onClick={onRetour} className="p-0.5 rounded-lg flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.85)" }} title="Retour">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-white">
            {tx.listing_title || "Transaction"}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            {estLitige ? "La Garde — Confidentiel" : "Conversation"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-center pt-8" style={{ color: CITADELLE_COLORS.textMuted }}>
            Démarrez la conversation...
          </p>
        )}

        {messages.map((msg, i) => {
          // ── Chat litige ──
          if (estLitige) {
            const estAdmin = msg.sender_role === "admin";
            if (estAdmin) return (
              <div key={msg.id || i} className="flex justify-start">
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
            return (
              <div key={msg.id || i} className="flex justify-end">
                <div className="px-3 py-1.5 rounded-2xl rounded-tr-sm text-sm max-w-[82%] text-white"
                  style={{ background: "#DC2626" }}>
                  {msg.content}
                </div>
              </div>
            );
          }

          // ── Chat normal ──
          const estMoi = msg.sender_id === user?.id;
          const estAdmin = msg.type === "admin";

          if (estAdmin) return (
            <div key={msg.id || i} className="flex justify-start">
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

          if (estMoi) return (
            <div key={msg.id || i} className="flex justify-end">
              <div className="px-3 py-1.5 rounded-2xl rounded-tr-sm text-sm max-w-[82%] text-white"
                style={{ background: "#1D4ED8" }}>
                {msg.content}
              </div>
            </div>
          );

          return (
            <div key={msg.id || i} className="flex justify-start">
              <div className="px-3 py-1.5 rounded-2xl rounded-tl-sm text-sm max-w-[82%]"
                style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={finMessagesRef} />
      </div>

      {/* Saisie */}
      <div className="px-3 py-2.5 flex gap-2 flex-shrink-0"
        style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
        <input
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          onKeyDown={e => e.key === "Enter" && envoyerMessage()}
          placeholder="Votre message..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
        />
        <button onClick={envoyerMessage} disabled={envoiEnCours || !saisie.trim()}
          className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          style={{ background: couleur, color: "white" }}>
          <Send size={13} />
        </button>
      </div>
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CitadelleChatWidget() {
  const { user } = useCitadelleAuth();
  const [transactions, setTransactions] = useState([]);
  const [panelOuvert, setPanelOuvert] = useState(false);
  // { tx, mode } — mode = "normal" | "litige"
  const [selection, setSelection] = useState(null);
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { /* non supporté */ }
    }
  };

  // Chargement des transactions actives (polling 8s)
  useEffect(() => {
    if (!user) return;
    const charger = async () => {
      try {
        const res = await citadelleApi.get("/transactions/my");
        const actives = (res.data.transactions || []).filter(
          tx => STATUTS_ACTIFS.includes(tx.status)
        );
        setTransactions(actives);
      } catch { /* silence */ }
    };
    charger();
    const intervalle = setInterval(charger, 8000);
    return () => clearInterval(intervalle);
  }, [user]);

  // Génère la liste des items : 1 item normal + 1 item litige (si vendeur + litige)
  const itemsListe = transactions.flatMap(tx => {
    const items = [{ tx, mode: "normal" }];
    // Ajouter la conversation litige si l'utilisateur est vendeur
    if (tx.status === "disputed" && tx.last_dispute_message !== null && tx.last_dispute_message !== undefined) {
      items.push({ tx, mode: "litige" });
    }
    return items;
  });

  const ouvrirPanel = () => { initAudio(); setPanelOuvert(true); };
  const fermerPanel = () => { setPanelOuvert(false); setSelection(null); };
  const ouvrirChat  = (tx, mode) => setSelection({ tx, mode });
  const revenirListe = () => setSelection(null);

  if (!user) return null;

  return (
    <>
      {/* ── Panneau ── */}
      {panelOuvert && (
        <div className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ bottom: "178px", right: "24px", width: "300px", height: "420px", background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>

          {selection ? (
            <VueChat
              tx={selection.tx}
              mode={selection.mode}
              onRetour={revenirListe}
              user={user}
              audioCtxRef={audioCtxRef}
            />
          ) : (
            <>
              {/* Header liste */}
              <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
                style={{ background: CITADELLE_COLORS.night }}>
                <p className="flex-1 text-xs font-bold text-white">Mes conversations</p>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
              </div>

              {/* Liste */}
              <div className="overflow-y-auto flex-1">
                {itemsListe.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: CITADELLE_COLORS.textMuted }}>
                    Aucune conversation active.
                  </p>
                ) : itemsListe.map(({ tx, mode }) => {
                  const estLitige = mode === "litige";
                  const couleur = estLitige ? "#DC2626" : "#1D4ED8";
                  const initiales = (tx.listing_title || "?")
                    .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
                  const apercu = estLitige
                    ? (tx.last_dispute_message?.sender_role === "admin" ? "La Garde : " : "Vous : ")
                      + (tx.last_dispute_message?.content || "")
                    : tx.last_message
                      ? (tx.last_message.sender_id === user?.id ? "Vous : " : "") + tx.last_message.content
                      : "En cours";

                  return (
                    <button
                      key={`${tx.id}_${mode}`}
                      onClick={() => ouvrirChat(tx, mode)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}
                      data-testid={`chat-conversation-${tx.id}-${mode}`}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: couleur }}>
                        {estLitige ? <Shield size={14} /> : (initiales || <MessageCircle size={14} />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: CITADELLE_COLORS.blue }}>
                          {tx.listing_title || "Transaction"}
                        </p>
                        <p className="text-xs truncate" style={{ color: estLitige ? "#DC2626" : CITADELLE_COLORS.textMuted }}>
                          {apercu}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bulle principale noire/dorée ── */}
      <button
        onClick={panelOuvert ? fermerPanel : ouvrirPanel}
        className="fixed z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110"
        style={{ bottom: "100px", right: "24px", background: CITADELLE_COLORS.night, border: `2px solid ${CITADELLE_COLORS.gold}` }}
        data-testid="chat-widget-btn"
        title="Mes conversations"
      >
        {itemsListe.length > 0 && !panelOuvert && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night, fontSize: "10px" }}>
            {itemsListe.length}
          </span>
        )}
        {panelOuvert
          ? <X size={20} style={{ color: CITADELLE_COLORS.gold }} />
          : <MessageCircle size={20} style={{ color: CITADELLE_COLORS.gold }} />
        }
      </button>
    </>
  );
}
