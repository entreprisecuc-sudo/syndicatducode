/**
 * Widget de chat flottant — La Citadelle Numérique
 * Une bulle principale → liste des conversations → vue chat.
 *
 * Chaque transaction peut générer deux conversations dans la liste :
 *  - mode "normal"  → échanges vendeur/acheteur (bleu)
 *  - mode "litige"  → chat La Garde (rouge), visible vendeur uniquement
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Shield, ChevronLeft, Trash2 } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { AttachmentButton, AttachmentPreview, MessageAttachments } from "@/components/citadelle/messageAttachments";

// Clé localStorage pour les conversations masquées
const MASQUEES_KEY = "citadelle_conv_masquees";

// { "txId_mode": { sent_at: "..." } }
const chargerMasquees  = () => { try { return JSON.parse(localStorage.getItem(MASQUEES_KEY) || "{}"); } catch { return {}; } };
const sauvegarderMasquees = (m) => localStorage.setItem(MASQUEES_KEY, JSON.stringify(m));

// Statuts de transaction avec une conversation active
const STATUTS_ACTIFS = [
  "offer_sent", "offer_accepted", "offer_countered",
  "payment_pending", "payment_done",
  "credentials_submitted", "admin_verified", "disputed",
];

// ── Vue chat ──────────────────────────────────────────────────────────────────
// mode "normal"  → messages normaux vendeur/acheteur
// mode "litige"  → messages de litige La Garde (vendeur uniquement)
function VueChat({ tx, mode, onRetour, user, jouerSon }) {
  const estLitige = mode === "litige";
  const couleur = estLitige ? "#DC2626" : "#1D4ED8";

  const [messages, setMessages] = useState([]);
  const [saisie, setSaisie] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const finMessagesRef = useRef(null);
  const nbPrecedent = useRef(0);
  const premierChargement = useRef(true);

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
    if ((!saisie.trim() && attachments.length === 0) || envoiEnCours) return;
    setEnvoiEnCours(true);
    try {
      const endpoint = estLitige
        ? `/transactions/${tx.id}/dispute-messages`
        : `/transactions/${tx.id}/message`;
      await citadelleApi.post(endpoint, { content: saisie.trim(), attachments });
      setSaisie("");
      setAttachments([]);
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
                    <MessageAttachments attachments={msg.attachments} mine={false} />
                  </div>
                </div>
              </div>
            );
            return (
              <div key={msg.id || i} className="flex justify-end">
                <div className="px-3 py-1.5 rounded-2xl rounded-tr-sm text-sm max-w-[82%] text-white"
                  style={{ background: "#DC2626" }}>
                  {msg.content}
                  <MessageAttachments attachments={msg.attachments} mine={true} />
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
                  <MessageAttachments attachments={msg.attachments} mine={false} />
                </div>
              </div>
            </div>
          );

          if (estMoi) return (
            <div key={msg.id || i} className="flex justify-end">
              <div className="px-3 py-1.5 rounded-2xl rounded-tr-sm text-sm max-w-[82%] text-white"
                style={{ background: "#1D4ED8" }}>
                {msg.content}
                <MessageAttachments attachments={msg.attachments} mine={true} />
              </div>
            </div>
          );

          return (
            <div key={msg.id || i} className="flex justify-start">
              <div className="px-3 py-1.5 rounded-2xl rounded-tl-sm text-sm max-w-[82%]"
                style={{ background: CITADELLE_COLORS.bg, color: CITADELLE_COLORS.blue, border: `1px solid ${CITADELLE_COLORS.border}` }}>
                {msg.content}
                <MessageAttachments attachments={msg.attachments} mine={false} />
              </div>
            </div>
          );
        })}
        <div ref={finMessagesRef} />
      </div>

      {/* Saisie */}
      <div className="flex-shrink-0" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
        <AttachmentPreview attachments={attachments} setAttachments={setAttachments} />
        <div className="px-3 py-2.5 flex gap-2">
          <AttachmentButton attachments={attachments} setAttachments={setAttachments} disabled={envoiEnCours} color={couleur} />
          <input
            value={saisie}
            onChange={e => setSaisie(e.target.value)}
            onKeyDown={e => e.key === "Enter" && envoyerMessage()}
            placeholder="Votre message..."
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
          />
          <button onClick={envoyerMessage} disabled={envoiEnCours || (!saisie.trim() && attachments.length === 0)}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            style={{ background: couleur, color: "white" }}>
            <Send size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CitadelleChatWidget() {
  const { user } = useCitadelleAuth();
  const [transactions, setTransactions] = useState([]);
  const [masquees, setMasquees] = useState(chargerMasquees);
  const [panelOuvert, setPanelOuvert] = useState(false);
  const [selection, setSelection] = useState(null);
  // Mémorise les sent_at des derniers messages pour détecter les nouveaux
  const sentAtPrecedents = useRef({});
  // Autorisé à jouer le son après la première interaction utilisateur
  const sonAutorise = useRef(false);

  // Son médiéval — arpège luth en Ré mineur (mode Dorien, timbre triangle)
  // Ré4 → La4 → Ré5 → Fa5 : fanfare de château montante
  const jouerSon = useCallback(() => {
    if (!sonAutorise.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Ré mineur arpeggé — timbre luth (triangle) + harmonique douce (sine)
      const notes = [
        { freq: 293.66, delai: 0,    vol: 0.22, dur: 1.4 }, // Ré4
        { freq: 440.00, delai: 0.09, vol: 0.19, dur: 1.3 }, // La4
        { freq: 587.33, delai: 0.18, vol: 0.15, dur: 1.2 }, // Ré5
        { freq: 698.46, delai: 0.27, vol: 0.10, dur: 1.0 }, // Fa5
      ];

      notes.forEach(({ freq, delai, vol, dur }) => {
        // Oscillateur principal : onde triangle (luth/harpe)
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delai);
        gain.gain.setValueAtTime(vol, ctx.currentTime + delai);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delai + dur);
        osc.start(ctx.currentTime + delai);
        osc.stop(ctx.currentTime + delai + dur);

        // Harmonique légère (octave sup, sine, volume réduit) — donne la brillance médiévale
        const oscH  = ctx.createOscillator();
        const gainH = ctx.createGain();
        oscH.connect(gainH);
        gainH.connect(ctx.destination);
        oscH.type = "sine";
        oscH.frequency.setValueAtTime(freq * 2, ctx.currentTime + delai);
        gainH.gain.setValueAtTime(vol * 0.3, ctx.currentTime + delai);
        gainH.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delai + dur * 0.6);
        oscH.start(ctx.currentTime + delai);
        oscH.stop(ctx.currentTime + delai + dur * 0.6);
      });

      // Fermer le contexte proprement après la dernière note
      setTimeout(() => { try { ctx.close(); } catch {} }, 2000);
    } catch { /* non supporté */ }
  }, []);

  // Déverrouillage audio au premier clic utilisateur (politique Autoplay navigateurs)
  useEffect(() => {
    const debloquer = () => {
      sonAutorise.current = true;
      document.removeEventListener("click", debloquer);
    };
    document.addEventListener("click", debloquer);
    return () => document.removeEventListener("click", debloquer);
  }, []);

  // Alias utilisé lors de l'ouverture du panneau (premier clic = déverrouillage audio)
  const initAudio = () => { sonAutorise.current = true; };

  // Chargement des transactions actives (polling 5s)
  // + détection nouveaux messages pour le son (même panneau fermé)
  // + vérification réapparition des conversations masquées si nouveau message
  useEffect(() => {
    if (!user) return;
    const premierAppel = { valeur: true };

    const charger = async () => {
      try {
        const res = await citadelleApi.get("/transactions/my");
        const actives = (res.data.transactions || []).filter(
          tx => STATUTS_ACTIFS.includes(tx.status)
        );
        setTransactions(actives);

        // Détection nouveaux messages entrants → son médiéval
        if (!premierAppel.valeur) {
          for (const tx of actives) {
            // Message normal
            const cle = `${tx.id}_normal`;
            const sentAt = tx.last_message?.sent_at || "";
            const precedent = sentAtPrecedents.current[cle] || "";
            if (sentAt && sentAt !== precedent && tx.last_message?.sender_id !== user?.id) {
              jouerSon();
              break; // Un seul son par cycle
            }
            // Message litige
            const cleLitige = `${tx.id}_litige`;
            const sentAtLitige = tx.last_dispute_message?.sent_at || "";
            const precedentLitige = sentAtPrecedents.current[cleLitige] || "";
            if (sentAtLitige && sentAtLitige !== precedentLitige
                && tx.last_dispute_message?.sender_role === "admin") {
              jouerSon();
              break;
            }
          }
        }
        premierAppel.valeur = false;

        // Mémoriser les sent_at actuels
        for (const tx of actives) {
          sentAtPrecedents.current[`${tx.id}_normal`]  = tx.last_message?.sent_at || "";
          sentAtPrecedents.current[`${tx.id}_litige`]  = tx.last_dispute_message?.sent_at || "";
        }

        // Vérifier réapparition des conversations masquées si nouveau message
        setMasquees(precedentes => {
          const mises_a_jour = { ...precedentes };
          let modifie = false;
          for (const cle of Object.keys(mises_a_jour)) {
            const [txId, mode] = cle.split(/_(.+)/);
            const tx = actives.find(t => t.id === txId);
            if (!tx) continue;
            const sentAt = mode === "litige"
              ? tx.last_dispute_message?.sent_at || ""
              : tx.last_message?.sent_at || "";
            if (sentAt !== mises_a_jour[cle].sent_at) {
              delete mises_a_jour[cle];
              modifie = true;
            }
          }
          if (modifie) { sauvegarderMasquees(mises_a_jour); return mises_a_jour; }
          return precedentes;
        });
      } catch { /* silence */ }
    };

    charger();
    const intervalle = setInterval(charger, 5000);
    return () => clearInterval(intervalle);
  }, [user, jouerSon]);

  // Masquer une conversation (icône corbeille)
  const masquerConversation = (tx, mode, e) => {
    e.stopPropagation();
    const cle = `${tx.id}_${mode}`;
    const sentAt = mode === "litige"
      ? tx.last_dispute_message?.sent_at || ""
      : tx.last_message?.sent_at || "";
    const mises_a_jour = { ...masquees, [cle]: { sent_at: sentAt } };
    setMasquees(mises_a_jour);
    sauvegarderMasquees(mises_a_jour);
  };

  // Génère la liste des items : 1 item normal + 1 item litige (si vendeur + litige)
  // Filtrer les conversations masquées
  const itemsListe = transactions.flatMap(tx => {
    const items = [{ tx, mode: "normal" }];
    if (tx.status === "disputed" && tx.last_dispute_message !== null && tx.last_dispute_message !== undefined) {
      items.push({ tx, mode: "litige" });
    }
    return items;
  }).filter(({ tx, mode }) => !masquees[`${tx.id}_${mode}`]);

  const ouvrirPanel  = () => { initAudio(); setPanelOuvert(true); };
  const fermerPanel  = () => { setPanelOuvert(false); setSelection(null); };
  const ouvrirChat   = (tx, mode) => setSelection({ tx, mode });
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
              jouerSon={jouerSon}
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
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left group"
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
                      {/* Icône corbeille — visible au survol */}
                      <button
                        onClick={(e) => masquerConversation(tx, mode, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-opacity flex-shrink-0"
                        style={{ color: CITADELLE_COLORS.textMuted }}
                        title="Masquer cette conversation"
                        data-testid={`chat-masquer-${tx.id}-${mode}`}
                      >
                        <Trash2 size={13} />
                      </button>
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
