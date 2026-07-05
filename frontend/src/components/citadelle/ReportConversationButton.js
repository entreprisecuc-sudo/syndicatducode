/**
 * Bouton + modal de signalement d'une conversation à l'admin — La Citadelle Numérique.
 * Réutilisable pour les conversations de transaction et pré-vente.
 */

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const REASONS = [
  { value: "arnaque", label: "Arnaque suspectée" },
  { value: "contournement", label: "Contournement (échange de coordonnées)" },
  { value: "inapproprie", label: "Contenu inapproprié" },
  { value: "litige", label: "Litige" },
  { value: "autre", label: "Autre" },
];

export function ReportConversationButton({ conversationType, conversationId, compact = false, color = "#DC2626" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!reason || message.trim().length < 5 || sending) return;
    setSending(true);
    try {
      await citadelleApi.post("/reports", {
        conversation_type: conversationType,
        conversation_id: conversationId,
        reason,
        message: message.trim(),
      });
      toast.success("Signalement transmis à notre équipe. Merci !");
      setOpen(false); setReason(""); setMessage("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'envoi du signalement.");
    } finally { setSending(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid="report-conversation-btn"
        className={compact
          ? "flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
          : "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"}
        style={compact ? { color } : { color, border: "1px solid rgba(220,38,38,0.25)" }}
        title="Signaler cette conversation à l'administrateur"
      >
        <Flag size={13} /> Signaler
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }} data-testid="report-modal">
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} style={{ color: "#DC2626" }} />
              <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>Signaler cette conversation</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
              Notre équipe examinera ce signalement sous 48h. Décrivez le problème rencontré.
            </p>
            <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Motif</label>
            <select
              value={reason} onChange={e => setReason(e.target.value)} data-testid="report-reason"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
              <option value="">Sélectionnez un motif…</option>
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Détails</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} rows={4} data-testid="report-message"
              placeholder="Expliquez le problème (min. 5 caractères)…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }} data-testid="report-cancel-btn">
                Annuler
              </button>
              <button onClick={submit} disabled={sending || !reason || message.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "#DC2626", color: "white" }} data-testid="report-submit-btn">
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
