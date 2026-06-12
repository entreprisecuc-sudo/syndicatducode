/**
 * Administration des transactions — La Citadelle Numérique
 * Vérification des accès, finalisation des ventes, gestion des litiges, config frais
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Shield, CheckCircle, XCircle, Eye, AlertTriangle, Clock,
  CreditCard, ChevronRight, Send, Lock, Scale, Ban, Settings, RefreshCw
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const STATUS_CONFIG = {
  offer_sent:            { label: "Offre envoyée",     color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  offer_accepted:        { label: "Offre acceptée",    color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  offer_refused:         { label: "Refusée",           color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  offer_countered:       { label: "Contre-offre",      color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  payment_done:          { label: "Payée",             color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  credentials_submitted: { label: "Accès transmis",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  admin_verified:        { label: "Accès vérifiés",    color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  completed:             { label: "Finalisée",         color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  disputed:              { label: "Litige",            color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  cancelled:             { label: "Annulée",           color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

export default function AdminCitadelleTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("credentials_submitted");
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // États chat litige
  const [disputeMessages, setDisputeMessages] = useState([]);
  const [disputeMessage, setDisputeMessage] = useState("");
  const [sendingDispute, setSendingDispute] = useState(false);
  const disputeEndRef = useRef(null);

  // États config frais
  const [showConfig, setShowConfig] = useState(false);
  const [disputeConfig, setDisputeConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => { fetchTransactions(); }, [activeTab]);
  useEffect(() => { disputeEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [disputeMessages.length]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const res = await api.get("/citadelle/admin/transactions", { params: { ...params, limit: 50 } });
      setTransactions(res.data.transactions);
      setCounts(res.data.counts || {});
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  };

  const openDetail = async (txId) => {
    setDetailLoading(true);
    setDisputeMessages([]);
    try {
      const res = await api.get(`/citadelle/admin/transactions/${txId}`);
      setSelectedTx(res.data);
      // Charger messages litige si applicable
      if (res.data.status === "disputed") {
        fetchDisputeMessages(txId);
      }
    } catch { alert("Erreur chargement détail"); }
    finally { setDetailLoading(false); }
  };

  const fetchDisputeMessages = async (txId) => {
    const id = txId || selectedTx?.id;
    if (!id) return;
    try {
      const res = await api.get(`/citadelle/transactions/${id}/dispute-messages`);
      setDisputeMessages(res.data.dispute_messages || []);
    } catch { /* silence */ }
  };

  const sendDisputeMessage = async () => {
    if (!disputeMessage.trim() || sendingDispute || !selectedTx) return;
    setSendingDispute(true);
    try {
      await api.post(`/citadelle/transactions/${selectedTx.id}/dispute-messages`, { content: disputeMessage.trim() });
      setDisputeMessage("");
      await fetchDisputeMessages();
    } catch { /* ignore */ }
    finally { setSendingDispute(false); }
  };

  const fetchDisputeConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await api.get("/citadelle/admin/dispute-config");
      setDisputeConfig(res.data);
    } catch { setDisputeConfig(null); }
    finally { setConfigLoading(false); }
  };

  const saveDisputeConfig = async () => {
    if (!disputeConfig) return;
    setConfigLoading(true);
    try {
      await api.patch("/citadelle/admin/dispute-config", disputeConfig);
      alert("Configuration sauvegardée.");
    } catch { alert("Erreur lors de la sauvegarde."); }
    finally { setConfigLoading(false); }
  };

  const doAction = async (endpoint, body = null) => {
    if (!selectedTx) return;
    setActionLoading(true);
    try {
      await api.post(`/citadelle/admin/transactions/${selectedTx.id}/${endpoint}`, body);
      await fetchTransactions();
      // Recharger le détail
      const res = await api.get(`/citadelle/admin/transactions/${selectedTx.id}`);
      setSelectedTx(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    } finally { setActionLoading(false); }
  };

  const TABS = [
    { key: "credentials_submitted", label: "À vérifier",      count: counts.credentials_submitted },
    { key: "admin_verified",        label: "À finaliser",      count: counts.admin_verified },
    { key: "payment_done",          label: "En attente accès", count: counts.payment_done },
    { key: "disputed",              label: "Litiges",          count: counts.disputed },
    { key: "completed",             label: "Finalisées",       count: counts.completed },
    { key: "all",                   label: "Toutes",           count: null },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-citadelle-transactions">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
            <CreditCard size={18} style={{ color: "#C9A45C" }} />
          </div>
          <h1 className="text-xl font-bold">Transactions — La Citadelle Numérique</h1>
          <button
            onClick={() => { setShowConfig(!showConfig); if (!disputeConfig) fetchDisputeConfig(); }}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}
            data-testid="btn-dispute-config">
            <Settings size={13} /> Frais d'annulation
          </button>
        </div>

        {/* Section config des frais d'annulation */}
        {showConfig && (
          <div className="p-5 rounded-xl" style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Scale size={14} style={{ color: "#C9A45C" }} /> Configuration des frais d'annulation
            </h3>
            {configLoading ? (
              <div className="text-center py-4"><Clock size={20} className="animate-spin mx-auto opacity-30" /></div>
            ) : disputeConfig ? (
              <div className="space-y-3">
                <p className="text-xs opacity-50">Frais prélevés lors d'une annulation acheteur selon le montant de la transaction.</p>
                {disputeConfig.tranches?.map((tranche, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs flex-1" style={{ opacity: 0.7 }}>{tranche.label || `Tranche ${idx + 1}`}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-50">Frais :</span>
                      <input
                        type="number"
                        value={tranche.fee}
                        onChange={e => {
                          const updated = [...disputeConfig.tranches];
                          updated[idx] = { ...updated[idx], fee: parseFloat(e.target.value) };
                          setDisputeConfig({ ...disputeConfig, tranches: updated });
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg text-xs outline-none text-center"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      <span className="text-xs opacity-50">€</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="text-xs flex-1" style={{ opacity: 0.7 }}>Frais par défaut (fallback)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={disputeConfig.default_fee}
                      onChange={e => setDisputeConfig({ ...disputeConfig, default_fee: parseFloat(e.target.value) })}
                      className="w-20 px-2 py-1.5 rounded-lg text-xs outline-none text-center"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <span className="text-xs opacity-50">€</span>
                  </div>
                </div>
                <button
                  onClick={saveDisputeConfig}
                  disabled={configLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                  style={{ background: "#C9A45C", color: "#081729" }}
                  data-testid="save-config-btn">
                  <CheckCircle size={13} /> Sauvegarder la configuration
                </button>
              </div>
            ) : (
              <p className="text-xs opacity-50 text-center py-2">Impossible de charger la configuration.</p>
            )}
          </div>
        )}

        {/* Onglets */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedTx(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "#C9A45C" : "var(--admin-bg-card, rgba(255,255,255,0.05))",
                color: activeTab === tab.key ? "#081729" : "inherit",
                border: "1px solid var(--admin-border, rgba(255,255,255,0.1))"
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(201,164,92,0.2)", color: "#C9A45C" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste */}
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--admin-border, rgba(255,255,255,0.08))" }} />)
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center opacity-50">
                <p className="text-3xl mb-2">🏰</p>
                <p className="text-sm">Aucune transaction</p>
              </div>
            ) : transactions.map(tx => {
              const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.cancelled;
              return (
                <button key={tx.id} onClick={() => openDetail(tx.id)}
                  className="w-full text-left flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                  style={{
                    background: selectedTx?.id === tx.id ? "rgba(201,164,92,0.1)" : "var(--admin-bg-card, rgba(255,255,255,0.05))",
                    border: selectedTx?.id === tx.id ? "1px solid rgba(201,164,92,0.3)" : "1px solid var(--admin-border, rgba(255,255,255,0.1))"
                  }}
                  data-testid={`admin-tx-row-${tx.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{tx.listing_title}</p>
                    <p className="text-xs opacity-50 mt-0.5">{tx.buyer_email} → {tx.seller_email}</p>
                  </div>
                  <span className="text-sm font-bold">{(tx.payment_amount || tx.offer_amount)?.toLocaleString("fr-FR")} €</span>
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <ChevronRight size={14} className="opacity-40" />
                </button>
              );
            })}
          </div>

          {/* Détail */}
          <div>
            {detailLoading ? (
              <div className="p-8 text-center"><Clock size={24} className="animate-spin mx-auto opacity-30" /></div>
            ) : selectedTx ? (
              <div className="p-5 rounded-xl space-y-4" style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
                <h3 className="font-bold">{selectedTx.listing_title}</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="opacity-50">Acheteur</span><p className="font-medium">{selectedTx.buyer_email}</p></div>
                  <div><span className="opacity-50">Vendeur</span><p className="font-medium">{selectedTx.seller_email}</p></div>
                  <div><span className="opacity-50">Offre initiale</span><p className="font-medium">{selectedTx.offer_amount?.toLocaleString("fr-FR")} €</p></div>
                  <div><span className="opacity-50">Montant final</span><p className="font-bold">{(selectedTx.payment_amount || selectedTx.offer_amount)?.toLocaleString("fr-FR")} €</p></div>
                </div>

                {/* Credentials */}
                {selectedTx.credentials?.data && (
                  <div className="p-4 rounded-xl" style={{ background: "rgba(201,164,92,0.08)", border: "1px solid rgba(201,164,92,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={14} style={{ color: "#C9A45C" }} />
                      <span className="text-xs font-bold" style={{ color: "#C9A45C" }}>Accès transmis par le vendeur</span>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                      {selectedTx.credentials.data}
                    </pre>
                    {selectedTx.credentials.verified_by_admin && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#22C55E" }}>
                        <CheckCircle size={12} /> Vérifié le {new Date(selectedTx.credentials.verified_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    {selectedTx.credentials_transmitted && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#C9A45C" }}>
                        <Send size={12} /> Accès transmis à l'acheteur le {new Date(selectedTx.credentials_transmitted_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions admin */}
                <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
                  {selectedTx.status === "credentials_submitted" && (
                    <>
                      <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                        placeholder="Notes de vérification (optionnel)..."
                        className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <button onClick={() => doAction("verify", { notes: adminNotes })} disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}
                        data-testid="admin-verify-btn">
                        <CheckCircle size={14} /> Confirmer les accès
                      </button>
                    </>
                  )}
                  {selectedTx.status === "admin_verified" && (
                    <button onClick={() => doAction("complete")} disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "#C9A45C", color: "#081729" }}
                      data-testid="admin-complete-btn">
                      <CreditCard size={14} /> Finaliser la vente (libérer les fonds)
                    </button>
                  )}
                  {/* Transmettre les accès à l'acheteur */}
                  {selectedTx.status === "completed" && !selectedTx.credentials_transmitted && selectedTx.credentials?.data && (
                    <button onClick={() => doAction("transmit")} disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #C9A45C 0%, #D9BB7A 100%)", color: "#081729" }}
                      data-testid="admin-transmit-btn">
                      <Lock size={14} /> Transmettre les accès à l'acheteur
                    </button>
                  )}
                  {!["completed", "cancelled", "offer_refused"].includes(selectedTx.status) && (
                    <button onClick={() => {
                      const reason = prompt("Motif du litige :");
                      if (reason && reason.length >= 10) doAction("dispute", { reason });
                    }} disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium opacity-60 hover:opacity-100 disabled:opacity-40"
                      style={{ color: "#DC2626" }}>
                      <AlertTriangle size={12} /> Ouvrir un litige
                    </button>
                  )}

                  {/* Actions spécifiques au litige */}
                  {selectedTx.status === "disputed" && (
                    <div className="space-y-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#DC2626" }}>
                        <Scale size={12} /> Résolution du litige
                      </p>
                      <button onClick={() => { if (window.confirm("Reprendre le cours normal de la transaction ?")) doAction("resolve-dispute"); }}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}
                        data-testid="admin-resolve-dispute-btn">
                        <RefreshCw size={14} /> Résoudre — Reprendre le cours normal
                      </button>
                      <button onClick={() => { if (window.confirm("Annuler définitivement la vente et rembourser l'acheteur ?")) doAction("cancel-transaction"); }}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "rgba(220,38,38,0.15)", color: "#DC2626" }}
                        data-testid="admin-cancel-transaction-btn">
                        <Ban size={14} /> Annuler la vente — Rembourser l'acheteur
                      </button>
                    </div>
                  )}
                </div>

                {/* Chat Litige — visible uniquement si litige ouvert */}
                {selectedTx.status === "disputed" && (
                  <div className="pt-3" style={{ borderTop: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#DC2626" }}>
                      <Scale size={12} /> Chat Litige (Vendeur · La Garde)
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                      {disputeMessages.length === 0 ? (
                        <p className="text-xs opacity-40 text-center py-3">Aucun message dans le chat litige.</p>
                      ) : disputeMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[80%]">
                            <div className="flex items-center gap-1 mb-0.5">
                              {msg.sender_role === "admin" && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(201,164,92,0.2)", color: "#C9A45C", fontSize: "10px" }}>La Garde</span>
                              )}
                              <span className="text-xs opacity-40" style={{ fontSize: "10px" }}>{msg.sender_email}</span>
                            </div>
                            <div className="px-3 py-2 rounded-lg text-xs" style={{
                              background: msg.sender_role === "admin" ? "rgba(201,164,92,0.15)" : "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)"
                            }}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={disputeEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={disputeMessage}
                        onChange={e => setDisputeMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendDisputeMessage()}
                        placeholder="Message à La Garde / au vendeur..."
                        className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                        data-testid="admin-dispute-message-input"
                      />
                      <button onClick={sendDisputeMessage} disabled={sendingDispute || !disputeMessage.trim()}
                        className="px-3 py-2 rounded-lg disabled:opacity-40"
                        style={{ background: "#DC2626", color: "white" }}
                        data-testid="admin-dispute-send-btn">
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages récents */}
                {selectedTx.messages?.length > 0 && (
                  <div className="pt-3" style={{ borderTop: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
                    <p className="text-xs font-bold mb-2 opacity-50">Derniers messages</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedTx.messages.slice(-5).map(msg => (
                        <div key={msg.id} className="text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <span className="font-medium opacity-60">{msg.type === "system" ? "Système" : msg.sender_email} :</span>{" "}
                          <span className="opacity-80">{msg.content.substring(0, 100)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center opacity-30">
                <Eye size={32} className="mx-auto mb-2" />
                <p className="text-sm">Sélectionnez une transaction</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
