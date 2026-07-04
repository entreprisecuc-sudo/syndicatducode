/**
 * Encart "Mes gains" — Espace membre vendeur La Citadelle Numérique
 * Total encaissé, fonds en attente (séquestre), détail par vente,
 * et bouton "Recevoir mes fonds" (virement Stripe vers le compte bancaire).
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Wallet, Clock, ArrowDownToLine, Loader2, CheckCircle2 } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const eur = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 });

const STATUS_LABEL = {
  payment_done: "En séquestre",
  credentials_submitted: "Accès transmis",
  admin_verified: "Vérifiée",
  disputed: "Litige",
  completed: "Encaissée",
};

export default function MemberEarningsPanel() {
  const [data, setData] = useState(null);
  const [available, setAvailable] = useState(0);
  const [connected, setConnected] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [message, setMessage] = useState("");

  const loadBalance = () => {
    citadelleApi.get("/stripe-connect/balance")
      .then((r) => { setAvailable(r.data.available || 0); setConnected(r.data.connected); })
      .catch(() => {});
  };

  useEffect(() => {
    citadelleApi.get("/member/earnings").then((r) => setData(r.data)).catch(() => setData({ sales: [], total_received: 0, total_pending: 0 }));
    loadBalance();
  }, []);

  const handlePayout = async () => {
    setPayingOut(true);
    setMessage("");
    try {
      const res = await citadelleApi.post("/stripe-connect/payout");
      setMessage(`Virement de ${eur(res.data.amount)} € lancé vers votre banque ✓`);
      loadBalance();
    } catch (e) {
      setMessage(e?.response?.data?.detail || "Erreur lors du virement.");
    } finally {
      setPayingOut(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  if (!data) return null;
  // N'afficher l'encart que si le vendeur a une activité de vente ou un compte connecté
  if (!connected && (data.sales || []).length === 0) return null;

  return (
    <div className="mb-8" data-testid="member-earnings-panel">
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: CITADELLE_COLORS.blue }}>
        Mes gains
      </h2>

      {/* Cartes récap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-4 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} style={{ color: "#16A34A" }} />
            <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>Total encaissé</span>
          </div>
          <p className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue }} data-testid="earnings-total-received">
            {eur(data.total_received)} €
          </p>
        </div>

        <div className="p-4 rounded-2xl" style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} style={{ color: "#D97706" }} />
            <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>En attente (séquestre)</span>
          </div>
          <p className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue }} data-testid="earnings-total-pending">
            {eur(data.total_pending)} €
          </p>
        </div>

        <div className="p-4 rounded-2xl flex flex-col justify-between"
          style={{ background: CITADELLE_COLORS.blue, border: `1px solid ${CITADELLE_COLORS.blue}` }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownToLine size={16} style={{ color: CITADELLE_COLORS.gold }} />
            <span className="text-xs text-white/70">Disponible sur Stripe</span>
          </div>
          <p className="text-xl font-black text-white mb-2" data-testid="earnings-available">{eur(available)} €</p>
          <button
            onClick={handlePayout}
            disabled={payingOut || available <= 0 || !connected}
            data-testid="payout-btn"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          >
            {payingOut ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
            {payingOut ? "Virement en cours…" : "Recevoir mes fonds"}
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
          style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A" }} data-testid="payout-message">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Détail par vente */}
      {(data.sales || []).length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
          {data.sales.map((s) => (
            <Link
              key={s.id}
              to={s.route}
              data-testid={`earnings-sale-${s.id}`}
              className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-black/[0.02]"
              style={{ background: "white", borderBottom: `1px solid ${CITADELLE_COLORS.border}` }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: CITADELLE_COLORS.blue }}>{s.title}</p>
                <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                  Vente {eur(s.gross)} € · commission {eur(s.commission)} € · {STATUS_LABEL[s.status] || s.status}
                </p>
              </div>
              <span className="text-sm font-black flex-shrink-0"
                style={{ color: s.status === "completed" ? "#16A34A" : "#D97706" }}>
                {s.status === "completed" ? "+" : ""}{eur(s.net)} €
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
