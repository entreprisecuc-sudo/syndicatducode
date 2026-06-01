/**
 * Modal de rejet avec raison obligatoire
 */

import { useState } from "react";
import { AlertTriangle, XCircle, Loader2 } from "lucide-react";

const RejectModal = ({ isOpen, onClose, onConfirm, projectTitle }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Veuillez indiquer une raison de rejet");
      return;
    }
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl p-6"
        style={{ background: "var(--admin-bg-card)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-500/20">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Rejeter ce projet</h3>
            <p className="text-sm text-gray-400">{projectTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Raison du rejet *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez pourquoi ce projet est rejeté..."
            rows={4}
            required
            className="w-full px-3 py-2 rounded-lg text-sm resize-none mb-4"
            style={{
              background: "var(--admin-bg-section)",
              border: "1px solid var(--admin-border)",
              color: "white"
            }}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#1f4068", color: "#9ca3af" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              {loading ? "Rejet..." : "Confirmer le rejet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;
