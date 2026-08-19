/**
 * Mes transactions — Espace membre La Citadelle Numérique
 * Vue unifiée : achats (offres envoyées) + ventes (offres reçues)
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Store, Clock, CheckCircle, XCircle, AlertTriangle, CreditCard, Shield, ArrowRight } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const STATUS_CONFIG = {
  offer_sent:            { color: "#F59E0B", icon: Clock },
  offer_accepted:        { color: "#22C55E", icon: CheckCircle },
  offer_refused:         { color: "#DC2626", icon: XCircle },
  offer_countered:       { color: "#3B82F6", icon: ArrowRight },
  payment_done:          { color: "#8B5CF6", icon: CreditCard },
  credentials_submitted: { color: "#F59E0B", icon: Shield },
  admin_verified:        { color: "#22C55E", icon: Shield },
  completed:             { color: "#22C55E", icon: CheckCircle },
  disputed:              { color: "#DC2626", icon: AlertTriangle },
  cancelled:             { color: "#6B7280", icon: XCircle },
};

export default function CitadelleMyTransactions() {
  const { t, i18n } = useTranslation();
  const { user } = useCitadelleAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buying"); // "buying" | "selling"

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get("/transactions/my");
      setTransactions(res.data.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const userId = user?.id;
  const buying = transactions.filter(t => t.buyer_id === userId);
  const selling = transactions.filter(t => t.seller_id === userId);
  const list = tab === "buying" ? buying : selling;

  return (
    <CitadelleLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10" data-testid="my-transactions">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
              {t("member.tx_title")}
            </h1>
            <p className="text-sm mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("member.tx_buy_count", { count: buying.length })} · {t("member.tx_sell_count", { count: selling.length })}
            </p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "buying", label: t("member.tab_buying"), icon: ShoppingCart, count: buying.length },
            { key: "selling", label: t("member.tab_selling"), icon: Store, count: selling.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t.key ? CITADELLE_COLORS.gold : "transparent",
                color: tab === t.key ? CITADELLE_COLORS.night : CITADELLE_COLORS.textMuted,
                border: tab === t.key ? "none" : `1px solid ${CITADELLE_COLORS.border}`
              }}
              data-testid={`tab-${t.key}`}>
              <t.icon size={15} /> {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: tab === t.key ? "rgba(0,0,0,0.15)" : "rgba(201,164,92,0.15)", color: CITADELLE_COLORS.gold }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <p className="text-4xl mb-3">{tab === "buying" ? "🛒" : "🏪"}</p>
            <p className="text-sm font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>
              {tab === "buying" ? t("member.tx_empty_buying") : t("member.tx_empty_selling")}
            </p>
            {tab === "buying" && (
              <Link to="/citadelle/annonces" className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
                {t("member.msgs_browse")}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(tx => {
              const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.cancelled;
              const statusKey = STATUS_CONFIG[tx.status] ? tx.status : "cancelled";
              const StatusIcon = cfg.icon;
              const amount = tx.payment_amount || tx.counter_amount || tx.offer_amount;
              return (
                <Link key={tx.id} to={`/citadelle/espace-membre/transactions/${tx.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`transaction-row-${tx.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: CITADELLE_COLORS.blue }}>
                      {tx.listing_title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {tab === "buying" ? `${t("member.role_seller")} : ${tx.seller_email}` : `${t("member.role_buyer")} : ${tx.buyer_email}`}
                      {" · "}
                      {new Date(tx.updated_at).toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR")}
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>
                    {amount?.toLocaleString(i18n.language === "en" ? "en-GB" : "fr-FR")} €
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: `${cfg.color}15`, color: cfg.color }}>
                    <StatusIcon size={12} /> {t(`member.tx_status.${statusKey}`)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}
