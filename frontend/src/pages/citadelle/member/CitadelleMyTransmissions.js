/**
 * Espace membre — Transmissions & Commandes (La Garde)
 * - Transmissions : Attestation de Transmission (acheteur) / Titre de Cession (vendeur).
 * - Commandes : historique des services commandés par le membre.
 */
import { useState, useEffect } from "react";
import {
  ShieldCheck, Download, FileText, Loader2, Package,
  Clock, AlertCircle, CheckCircle, Ban,
} from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS as C } from "@/config/citadelleConstants";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";

const ORDER_STATUS = {
  en_attente: { label: "En attente", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", Icon: Clock },
  en_cours:   { label: "En cours",   color: "#3B82F6", bg: "rgba(59,130,246,0.1)", Icon: AlertCircle },
  termine:    { label: "Terminé",    color: "#22C55E", bg: "rgba(34,197,94,0.1)",  Icon: CheckCircle },
  annule:     { label: "Annulé",     color: "#DC2626", bg: "rgba(220,38,38,0.1)",  Icon: Ban },
};

const formatDate = (isoStr) => {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export default function CitadelleMyTransmissions() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    citadelleApi.get("/transmissions/my")
      .then(({ data }) => setItems(data.transmissions || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    citadelleApi.get("/services/my-orders")
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, []);

  const download = async (t) => {
    setBusy(t.id);
    try {
      const res = await citadelleApi.get(`/transmissions/${t.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t.role === "buyer" ? "attestation" : "titre-de-cession"}-${t.dossier_number}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setBusy(""); }
  };

  return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10" data-testid="my-transmissions">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck style={{ color: C.gold }} size={26} />
          <div>
            <h1 className="text-2xl font-black" style={{ color: C.blue }}>Transmissions &amp; Commandes</h1>
            <p className="text-sm" style={{ color: C.textMuted }}>Vos documents La Garde et l'historique de vos services</p>
          </div>
        </div>

        {/* ── Section 1 : Transmissions ─────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-base font-bold mb-4" style={{ color: C.blue }}>Mes transmissions</h2>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: C.gold }} /></div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: C.border }} data-testid="my-transmissions-empty">
              <FileText size={40} style={{ color: C.border }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: C.textMuted }}>Aucun document de transmission pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: C.border }} data-testid={`transmission-item-${t.id}`}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,.12)" }}>
                    <ShieldCheck size={20} style={{ color: C.gold }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate" style={{ color: C.blue }}>{t.asset_title}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>
                      {t.role === "buyer" ? "Attestation de Transmission" : "Titre de Cession"} · Dossier {t.dossier_number}
                    </p>
                  </div>
                  <button onClick={() => download(t)} disabled={busy === t.id} data-testid={`download-transmission-${t.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold flex-shrink-0 disabled:opacity-60" style={{ background: C.blue }}>
                    {busy === t.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Séparateur */}
        <div className="mb-10" style={{ height: 1, background: C.border }} />

        {/* ── Section 2 : Commandes ─────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold mb-4" style={{ color: C.blue }}>Mes commandes</h2>

          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: C.bg }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center rounded-2xl"
              style={{ background: "rgba(201,164,92,0.04)", border: "1px dashed rgba(201,164,92,0.25)" }}
              data-testid="my-orders-empty">
              <Package size={36} className="mx-auto mb-3" style={{ color: C.textMuted, opacity: 0.35 }} />
              <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                Vous n'avez encore passé aucune commande.
              </p>
              <p className="text-xs mt-1" style={{ color: C.textMuted, opacity: 0.7 }}>
                Découvrez les services dans l'onglet « Mes services » et commandez directement.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="my-orders-list">
              {orders.map(order => {
                const statusCfg = ORDER_STATUS[order.status] || ORDER_STATUS.en_attente;
                const StatusIcon = statusCfg.Icon;
                return (
                  <div key={order.id}
                    className="p-4 rounded-xl"
                    style={{ background: "white", border: `1px solid ${C.border}` }}
                    data-testid={`my-order-row-${order.id}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-sm" style={{ color: C.blue }}>
                            {order.service_title}
                          </p>
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            <StatusIcon size={10} />
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: C.textMuted }}>
                          Commandé le {formatDate(order.created_at)} · Réf. {order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <p className="font-black text-base shrink-0" style={{ color: C.gold }}>
                        {order.amount?.toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    {order.admin_note && (
                      <p className="text-xs mt-2 pl-3 border-l-2 italic"
                        style={{ color: C.textMuted, borderColor: C.gold + "55" }}>
                        Note : {order.admin_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </CitadelleLayout>
  );
}
