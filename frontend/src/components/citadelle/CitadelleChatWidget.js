/**
 * Widget de chat flottant — La Citadelle Numérique
 * Une seule bulle principale avec liste de conversations et vue chat intégrée.
 * Rouge : La Garde (litige) | Bleu : conversation standard
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

// Couleur d'une transaction : rouge si litige, bleu sinon
const couleurTx = (tx) => tx.status === "disputed" ? "#DC2626" : "#1D4ED8";

// ── Vue chat d'une conversation sélectionnée ──────────────────────────────────
// Affiche uniquement la conversation normale vendeur/acheteur (tx.messages).
// Le chat litige (La Garde) reste accessible sur la page de détail de la transaction.
function VueChat({ tx, onRetour, user, audioCtxRef }) {
  const couleur = couleurTx(tx);
  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const finMessagesRef = useRef(null);
  const nbPrecedent = useRef(0);
  const premierChargement = useRef(true);

  // Son médiéval sur nouveau message reçu (contexte AudioContext partagé)
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
    } catch { /* silence */ }
  }, [audioCtxRef]);

  // Chargement + polling des messages normaux toutes les 3 secondes
  useEffect(() => {
    nbPrecedent.current = 0;
    premierChargement.current = true;

    const charger = async () => {
      try {
        const res = await citadelleApi.get(`/transactions/${tx.id}`);
        // On extrait uniquement les messages normaux (vendeur/acheteur)
        const msgs = (res.data.messages || []).filter(m => m.type !== "system");
        setMessages(res.data.messages || []);
        // Vérification nouveau message entrant
        if (!premierChargement.current && msgs.length > nbPrecedent.current) {
          const dernier = msgs[msgs.length - 1];
          if (dernier && dernier.sender_id !== user?.id) jouerSon();
        }
        nbPrecedent.current = msgs.length;
        if (msgs.length > 0) premierChargement.current = false;
      } catch { /* silence */ }
    };

    charger();
    const intervalle = setInterval(charger, 3000);
    return () => clearInterval(intervalle);
  }, [tx.id, user, jouerSon]);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    finMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const envoyerMessage = async () => {
    if (!saisie.trim() || envoiEnCours) return;
    setEnvoiEnCours(true);
    try {
      await citadelleApi.post(`/transactions/${tx.id}/message`, { content: saisie.trim() });
      setSaisie("");
      const res = await citadelleApi.get(`/transactions/${tx.id}`);
      setMessages(res.data.messages || []);
    } catch { /* silence */ }
    finally { setEnvoiEnCours(false); }
  };

  const messagesVisibles = messages.filter(m => m.type !== "system");

  return (
    <>
      {/* Header avec bouton retour */}
      <div
        className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
        style={{ background: couleur }}
      >
        <button
          onClick={onRetour}
          className="p-0.5 rounded-lg flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.85)" }}
          title="Retour à la liste"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-white">
            {tx.listing_title || "Transaction"}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            {tx.status === "disputed" ? "Litige en cours" : "En cours"}
          </p>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {/* Messages système (séparateurs) */}
        {messages.map((msg, i) => {
          if (msg.type === "system") return (
            <div key={msg.id || i} className="flex justify-center">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.textMuted }}
              >
                {msg.content}
              </span>
            </div>
          );

          const estMoi = msg.sender_id === user?.id;
          const estAdmin = msg.type === "admin";

          // Message de l'administrateur dans la conversation normale
          if (estAdmin) return (
            <div key={msg.id || i} className="flex justify-start">
              <div className="max-w-[82%]">
                <div className="flex items-center gap-1 mb-0.5">
                  <Shield size={9} style={{ color: "#DC2626" }} />
                  <p className="text-xs font-bold" style={{ color: "#DC2626" }}>La Garde</p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-2xl rounded-tl-sm text-sm"
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

          // Mon message
          if (estMoi) return (
            <div key={msg.id || i} className="flex justify-end">
              <div
                className="px-3 py-1.5 rounded-2xl rounded-tr-sm text-sm max-w-[82%] text-white"
                style={{ background: couleur }}
              >
                {msg.content}
              </div>
            </div>
          );

          // Message de l'autre partie
          return (
            <div key={msg.id || i} className="flex justify-start">
              <div
                className="px-3 py-1.5 rounded-2xl rounded-tl-sm text-sm max-w-[82%]"
                style={{
                  background: CITADELLE_COLORS.bg,
                  color: CITADELLE_COLORS.blue,
                  border: `1px solid ${CITADELLE_COLORS.border}`,
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Message si aucune conversation */}
        {messagesVisibles.length === 0 && (
          <p className="text-xs text-center pt-8" style={{ color: CITADELLE_COLORS.textMuted }}>
            Démarrez la conversation...
          </p>
        )}
        <div ref={finMessagesRef} />
      </div>

      {/* Zone de saisie */}
      <div
        className="px-3 py-2.5 flex gap-2 flex-shrink-0"
        style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}
      >
        <input
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          onKeyDown={e => e.key === "Enter" && envoyerMessage()}
          placeholder="Votre message..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: CITADELLE_COLORS.bg,
            border: `1px solid ${CITADELLE_COLORS.border}`,
            color: CITADELLE_COLORS.blue,
          }}
        />
        <button
          onClick={envoyerMessage}
          disabled={envoiEnCours || !saisie.trim()}
          className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          style={{ background: couleur, color: "white" }}
        >
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
  const [txSelectionnee, setTxSelectionnee] = useState(null);
  const audioCtxRef = useRef(null);

  // Initialisation de l'AudioContext (requiert un geste utilisateur)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch { /* non supporté */ }
    }
  };

  // Chargement des transactions actives avec polling toutes les 8 secondes
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

  const ouvrirPanel = () => {
    initAudio();
    setPanelOuvert(true);
  };

  const fermerPanel = () => {
    setPanelOuvert(false);
    setTxSelectionnee(null);
  };

  const ouvrirChat = (tx) => setTxSelectionnee(tx);
  const revenirListe = () => setTxSelectionnee(null);

  if (!user) return null;

  return (
    <>
      {/* ── Panneau principal (liste ou chat) ── */}
      {panelOuvert && (
        <div
          className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            bottom: "178px",
            right: "24px",
            width: "300px",
            height: "400px",
            background: "white",
            border: `1px solid ${CITADELLE_COLORS.border}`,
          }}
        >
          {txSelectionnee ? (
            // ── Vue chat de la conversation sélectionnée ──
            <VueChat
              tx={txSelectionnee}
              onRetour={revenirListe}
              user={user}
              audioCtxRef={audioCtxRef}
            />
          ) : (
            // ── Vue liste des conversations ──
            <>
              <div
                className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
                style={{ background: CITADELLE_COLORS.night }}
              >
                <p className="flex-1 text-xs font-bold text-white">Mes conversations</p>
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#22C55E" }}
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {transactions.length === 0 ? (
                  <p
                    className="text-xs text-center py-8"
                    style={{ color: CITADELLE_COLORS.textMuted }}
                  >
                    Aucune conversation active.
                  </p>
                ) : transactions.map((tx) => {
                  const couleur = couleurTx(tx);
                  const initiales = (tx.listing_title || "?")
                    .split(" ")
                    .slice(0, 2)
                    .map(w => w[0]?.toUpperCase())
                    .join("");
                  return (
                    <button
                      key={tx.id}
                      onClick={() => ouvrirChat(tx)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      style={{ borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}
                      data-testid={`chat-conversation-${tx.id}`}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: couleur }}
                      >
                        {initiales || <MessageCircle size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: CITADELLE_COLORS.blue }}
                        >
                          {tx.listing_title || "Transaction"}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{
                            color: tx.status === "disputed"
                              ? "#DC2626"
                              : CITADELLE_COLORS.textMuted,
                          }}
                        >
                          {tx.last_message
                            ? (tx.last_message.sender_id === user?.id ? "Vous : " : "")
                              + tx.last_message.content
                            : (tx.status === "disputed" ? "Litige — La Garde" : "En cours")
                          }
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
        style={{
          bottom: "100px",
          right: "24px",
          background: CITADELLE_COLORS.night,
          border: `2px solid ${CITADELLE_COLORS.gold}`,
        }}
        data-testid="chat-widget-btn"
        title="Mes conversations"
      >
        {/* Badge : nombre de conversations actives */}
        {transactions.length > 0 && !panelOuvert && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold"
            style={{
              background: CITADELLE_COLORS.gold,
              color: CITADELLE_COLORS.night,
              fontSize: "10px",
            }}
          >
            {transactions.length}
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
