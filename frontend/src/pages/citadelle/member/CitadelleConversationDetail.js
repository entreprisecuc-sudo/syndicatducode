/**
 * Détail conversation — La Citadelle Numérique
 * Échange pré-vente acheteur ↔ vendeur sur une annonce
 */

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, MessageSquare, ExternalLink } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { AttachmentButton, AttachmentPreview, MessageAttachments } from "@/components/citadelle/messageAttachments";

export default function CitadelleConversationDetail() {
  const { id } = useParams();
  const { user } = useCitadelleAuth();
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [sanitizedWarning, setSanitizedWarning] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchConversation(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages?.length]);

  // Polling toutes les 3 secondes pour conversation fluide
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await citadelleApi.get(`/messages/${id}`);
        setConv(prev => {
          if (!prev || res.data.messages?.length !== prev.messages?.length) return res.data;
          return prev;
        });
      } catch { /* silence */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get(`/messages/${id}`);
      setConv(res.data);
    } catch { setConv(null); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return;
    setSending(true);
    setSanitizedWarning(false);
    try {
      const res = await citadelleApi.post(`/messages/${id}/reply`, { content: message.trim(), attachments });
      if (res.data.sanitized) setSanitizedWarning(true);
      setMessage("");
      setAttachments([]);
      await fetchConversation();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (loading) return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
      </div>
    </CitadelleLayout>
  );

  if (!conv) return (
    <CitadelleLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🏰</p>
        <h1 className="text-xl font-bold mb-3" style={{ color: CITADELLE_COLORS.blue }}>Conversation introuvable</h1>
        <Link to="/citadelle/espace-membre/messages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>
    </CitadelleLayout>
  );

  const isBuyer = conv.buyer_id === user?.id;
  const otherEmail = isBuyer ? conv.seller_email : conv.buyer_email;

  return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8" data-testid="conversation-detail">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/citadelle/espace-membre/messages" className="p-2 rounded-lg"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              {conv.listing_title}
            </h1>
            <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              {isBuyer ? "Vendeur" : "Acheteur"} : {otherEmail}
            </p>
          </div>
          <Link to={`/citadelle/annonces/${conv.listing_slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.textMuted }}>
            <ExternalLink size={12} /> Voir l'annonce
          </Link>
        </div>

        {/* Messages */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: CITADELLE_COLORS.bg, borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}>
            <MessageSquare size={15} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Conversation</span>
            <span className="text-xs ml-auto" style={{ color: CITADELLE_COLORS.textMuted }}>{conv.messages?.length || 0} messages</span>
          </div>

          {/* Bannière conversation bloquée */}
          {conv.is_blocked && (
            <div className="px-4 py-3 flex items-start gap-2.5"
              style={{ background: "rgba(220,38,38,0.05)", borderBottom: `1px solid rgba(220,38,38,0.15)` }}>
              <span style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }}>⛔</span>
              <p className="text-xs leading-relaxed" style={{ color: "#B91C1C" }}>
                Cette conversation est fermée — ce site a été vendu. Merci de votre intérêt.
              </p>
            </div>
          )}

          <div className="p-4 space-y-3 min-h-64 max-h-[28rem] overflow-y-auto" style={{ background: "white" }}>
            {conv.messages?.map(msg => (
              msg.is_system ? (
                /* Message système — annonce vendue */
                <div key={msg.id} className="flex justify-center">
                  <div className="px-4 py-3 rounded-xl text-xs text-center max-w-sm leading-relaxed"
                    style={{ background: "rgba(220,38,38,0.06)", color: "#B91C1C", border: "1px solid rgba(220,38,38,0.15)" }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Message normal */
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-xs">
                    <p className="text-xs mb-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {msg.sender_email === user?.email ? "Vous" : msg.sender_email}
                    </p>
                    <div className="px-3 py-2 rounded-xl text-sm" style={{
                      background: msg.sender_id === user?.id ? CITADELLE_COLORS.blue : CITADELLE_COLORS.bg,
                      color: msg.sender_id === user?.id ? "white" : CITADELLE_COLORS.blue
                    }}>
                      {msg.content}
                      <MessageAttachments attachments={msg.attachments} mine={msg.sender_id === user?.id} />
                    </div>
                    <p className="text-xs mt-0.5 text-right" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {new Date(msg.sent_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie — désactivée si conversation bloquée */}
          {conv.is_blocked ? (
            <div className="px-4 py-4 text-center"
              style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}>
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                Les échanges sont fermés pour cette annonce.
              </p>
              <Link to="/citadelle/annonces"
                className="inline-block mt-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                Voir les autres annonces
              </Link>
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}`, background: CITADELLE_COLORS.bg }}>
              {/* Avertissement masquage contact */}
              {sanitizedWarning && (
                <div className="px-4 pt-3 pb-1 flex items-start gap-2">
                  <div
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#92400E" }}
                    data-testid="sanitized-warning"
                  >
                    Certaines informations de contact ont été masquées afin de maintenir les échanges sur La Citadelle.
                  </div>
                </div>
              )}
              <AttachmentPreview attachments={attachments} setAttachments={setAttachments} />
              <div className="px-4 py-3 flex gap-2">
                <AttachmentButton attachments={attachments} setAttachments={setAttachments} disabled={sending} />
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Votre message..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}
                  data-testid="message-input"
                />
                <button onClick={sendMessage} disabled={sending || (!message.trim() && attachments.length === 0)}
                  className="px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                  data-testid="send-message-btn">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CitadelleLayout>
  );
}
