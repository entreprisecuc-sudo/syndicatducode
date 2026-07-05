/**
 * Lien discret + modal pour signaler l'enchère courante comme suspecte.
 * Le signalement n'est visible que des administrateurs.
 */

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

export function ReportBidButton({ listingId }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      await citadelleApi.post(`/listings/${listingId}/report-bid`, { message: message.trim() });
      toast.success("Signalement transmis à notre équipe. Merci !");
      setOpen(false);
      setMessage("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'envoi du signalement.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid="report-bid-btn"
        className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ color: CITADELLE_COLORS.textMuted }}
        title="Signaler cette enchère à l'administrateur"
      >
        <Flag size={12} /> Signaler cette enchère
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }} data-testid="report-bid-modal">
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} style={{ color: "#DC2626" }} />
              <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>Signaler cette enchère</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
              Une enchère vous paraît suspecte (montant disproportionné, comportement anormal) ?
              Notre équipe la vérifiera discrètement. Le signalement reste confidentiel.
            </p>
            <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>Précisions (facultatif)</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} rows={4} data-testid="report-bid-message"
              placeholder="Expliquez pourquoi cette enchère vous semble suspecte…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }} data-testid="report-bid-cancel-btn">
                Annuler
              </button>
              <button onClick={submit} disabled={sending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "#DC2626", color: "white" }} data-testid="report-bid-submit-btn">
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
