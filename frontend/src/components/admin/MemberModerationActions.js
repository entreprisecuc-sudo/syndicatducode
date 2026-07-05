/**
 * Actions de modération d'un membre Citadelle (admin).
 * Réutilisé sur la page Signalements et la page Membres Citadelle.
 * Avertir / Suspendre (1-2 sem) / Bannir + Réactiver. Chaque action notifie le membre par email.
 */

import { useState } from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const ACTIONS = [
  { value: "warning", label: "Avertissement", color: "#C9A45C" },
  { value: "suspend1", label: "Suspension — 1 semaine", color: "#F97316" },
  { value: "suspend2", label: "Suspension — 2 semaines", color: "#F97316" },
  { value: "ban", label: "Bannissement (suppression)", color: "#DC2626" },
];
const REASONS = [
  "Contournement (échange de coordonnées)",
  "Arnaque suspectée",
  "Contenu inapproprié",
  "Comportement abusif",
  "Non-respect des règles",
  "Autre",
];

export function MemberModerationActions({ userId, label, status = "active", onDone }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("warning");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!reason.trim() || busy) return;
    setBusy(true);
    try {
      const body = { reason: reason.trim(), note: note.trim() };
      let url;
      if (action === "warning") url = `/citadelle/admin/members/${userId}/warn`;
      else if (action === "suspend1") { url = `/citadelle/admin/members/${userId}/suspend`; body.weeks = 1; }
      else if (action === "suspend2") { url = `/citadelle/admin/members/${userId}/suspend`; body.weeks = 2; }
      else { url = `/citadelle/admin/members/${userId}/ban`; }
      await api.post(url, body);
      toast.success("Sanction appliquée. Email envoyé au membre.");
      setOpen(false); setReason(""); setNote("");
      onDone && onDone();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'action.");
    } finally { setBusy(false); }
  };

  const reactivate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/citadelle/admin/members/${userId}/reactivate`);
      toast.success("Membre réactivé.");
      onDone && onDone();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(true)} disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
          style={{ border: "1px solid rgba(220,38,38,0.4)", color: "#DC2626" }}
          data-testid="moderation-open-btn" title={`Sanctionner ${label || "ce membre"}`}>
          <ShieldAlert size={13} /> Sanctionner
        </button>
        {status !== "active" && (
          <button onClick={reactivate} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ border: "1px solid #22C55E", color: "#22C55E" }}
            data-testid="moderation-reactivate-btn">
            <RotateCcw size={13} /> Réactiver
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: "var(--admin-bg-card, #1a1f2e)", border: "1px solid var(--admin-border, rgba(255,255,255,0.12))", color: "var(--admin-text, #E5E7EB)" }} data-testid="moderation-modal">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={18} style={{ color: "#DC2626" }} />
              <h3 className="font-bold text-lg">Sanctionner un membre</h3>
            </div>
            <p className="text-xs opacity-60 mb-4">{label}</p>

            <label className="block text-sm font-medium mb-1">Action</label>
            <select value={action} onChange={e => setAction(e.target.value)} data-testid="moderation-action"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "inherit" }}>
              {ACTIONS.map(a => <option key={a.value} value={a.value} style={{ color: "#111" }}>{a.label}</option>)}
            </select>

            <label className="block text-sm font-medium mb-1">Motif</label>
            <select value={reason} onChange={e => setReason(e.target.value)} data-testid="moderation-reason"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "inherit" }}>
              <option value="" style={{ color: "#111" }}>Sélectionnez un motif…</option>
              {REASONS.map(r => <option key={r} value={r} style={{ color: "#111" }}>{r}</option>)}
            </select>

            <label className="block text-sm font-medium mb-1">Précisions (optionnel)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} data-testid="moderation-note"
              placeholder="Contexte transmis dans l'email au membre…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-2"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "inherit" }} />

            {action === "ban" && (
              <p className="text-xs mb-3" style={{ color: "#DC2626" }}>
                ⚠️ Le bannissement bloque la connexion et retire les annonces actives du membre. L'historique est conservé.
              </p>
            )}

            <div className="flex gap-3 mt-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "inherit" }} data-testid="moderation-cancel-btn">
                Annuler
              </button>
              <button onClick={apply} disabled={busy || !reason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "#DC2626", color: "white" }} data-testid="moderation-confirm-btn">
                Appliquer la sanction
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
