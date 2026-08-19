/**
 * Bouton + modal de signalement d'une conversation à l'admin — La Citadelle Numérique.
 * Réutilisable pour les conversations de transaction et pré-vente.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const REASON_VALUES = ["arnaque", "contournement", "inapproprie", "litige", "autre"];

export function ReportConversationButton({ conversationType, conversationId, compact = false, color = "#DC2626" }) {
  const { t } = useTranslation();
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
      toast.success(t("report.toast_success"));
      setOpen(false); setReason(""); setMessage("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("report.toast_error"));
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
        title={t("report.btn_title")}
      >
        <Flag size={13} /> {t("report.title_short")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }} data-testid="report-modal">
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} style={{ color: "#DC2626" }} />
              <h3 className="font-bold text-lg" style={{ color: CITADELLE_COLORS.blue }}>{t("report.title_full")}</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("report.desc")}
            </p>
            <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>{t("report.reason_label")}</label>
            <select
              value={reason} onChange={e => setReason(e.target.value)} data-testid="report-reason"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
              <option value="">{t("report.reason_select")}</option>
              {REASON_VALUES.map(v => <option key={v} value={v}>{t(`report.reason_${v}`)}</option>)}
            </select>
            <label className="block text-sm font-medium mb-1" style={{ color: CITADELLE_COLORS.blue }}>{t("report.details_label")}</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} rows={4} data-testid="report-message"
              placeholder={t("report.details_ph")}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }} data-testid="report-cancel-btn">
                {t("report.cancel")}
              </button>
              <button onClick={submit} disabled={sending || !reason || message.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "#DC2626", color: "white" }} data-testid="report-submit-btn">
                {t("report.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
