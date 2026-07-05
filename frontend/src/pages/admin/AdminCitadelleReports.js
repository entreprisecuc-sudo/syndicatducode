/**
 * Page admin — Signalements La Citadelle Numérique
 * Liste des conversations signalées par les utilisateurs, avec suivi de statut.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flag, ArrowLeft, ShoppingCart, MessageSquare, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { MemberModerationActions } from "@/components/admin/MemberModerationActions";
import { MessageAttachments } from "@/components/citadelle/messageAttachments";

const STATUS_META = {
  open: { label: "Ouvert", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
  reviewed: { label: "En cours", color: "#C9A45C", bg: "rgba(201,164,92,0.14)" },
  resolved: { label: "Résolu", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
};
const FILTERS = [
  { value: "", label: "Tous" },
  { value: "open", label: "Ouverts" },
  { value: "reviewed", label: "En cours" },
  { value: "resolved", label: "Résolus" },
];

export default function AdminCitadelleReports() {
  const [reports, setReports] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [convModal, setConvModal] = useState(null);
  const [convData, setConvData] = useState(null);
  const [convLoading, setConvLoading] = useState(false);

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/citadelle/admin/reports", { params: filter ? { status: filter } : {} });
      setReports(res.data.reports || []);
      setOpenCount(res.data.open_count || 0);
    } catch (err) {
      console.error("Erreur chargement signalements:", err);
    } finally { setLoading(false); }
  };

  const updateStatus = async (report, status) => {
    try {
      await api.patch(`/citadelle/admin/reports/${report.id}`, { status, admin_notes: notes[report.id] ?? report.admin_notes ?? "" });
      await load();
    } catch (err) { console.error("Erreur maj signalement:", err); }
  };

  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString("fr-FR"); } catch { return iso; } };

  const openConversation = async (report) => {
    setConvModal(report);
    setConvData(null);
    setConvLoading(true);
    try {
      const res = await api.get(`/citadelle/admin/reports/${report.id}/conversation`);
      setConvData(res.data);
    } catch {
      setConvData({ found: false, messages: [] });
    } finally { setConvLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" style={{ color: "var(--admin-text)" }} data-testid="admin-citadelle-reports">
        <div className="flex items-center gap-3">
          <Link to="/syndicat-admin/citadelle" className="p-2 rounded-lg" style={{ border: "1px solid rgba(201,164,92,0.3)", color: "#C9A45C" }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.15)" }}>
            <Flag size={20} style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Signalements</h1>
            <p className="text-sm opacity-60">{openCount} signalement(s) ouvert(s) à traiter</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === f.value ? "rgba(201,164,92,0.15)" : "transparent",
                border: `1px solid ${filter === f.value ? "#C9A45C" : "rgba(255,255,255,0.12)"}`,
                color: filter === f.value ? "#C9A45C" : "inherit",
              }}
              data-testid={`report-filter-${f.value || "all"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <p className="text-sm opacity-50">Chargement…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm opacity-50" data-testid="reports-empty">Aucun signalement.</p>
        ) : (
          <div className="space-y-4">
            {reports.map(r => {
              const meta = STATUS_META[r.status] || STATUS_META.open;
              const TypeIcon = r.conversation_type === "transaction" ? ShoppingCart : MessageSquare;
              return (
                <div key={r.id} className="p-5 rounded-xl" style={{ background: "var(--admin-bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }} data-testid="report-card">
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={16} style={{ color: "#C9A45C" }} />
                      <span className="font-semibold text-sm">{r.reason_label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                    <span className="text-xs opacity-50">{fmtDate(r.created_at)}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs opacity-80 mb-3">
                    <p><span className="opacity-60">Signalé par :</span> {r.reporter_email} ({r.reporter_role === "buyer" ? "acheteur" : "vendeur"})</p>
                    <p><span className="opacity-60">Type :</span> {r.conversation_type === "transaction" ? "Transaction" : "Pré-vente"}</p>
                    <p><span className="opacity-60">Annonce :</span> {r.listing_title || "—"}</p>
                    <p><span className="opacity-60">Acheteur / Vendeur :</span> {r.buyer_email || "—"} / {r.seller_email || "—"}</p>
                  </div>

                  <div className="p-3 rounded-lg text-sm mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {r.message}
                  </div>

                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <button onClick={() => openConversation(r)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(201,164,92,0.12)", color: "#C9A45C", border: "1px solid rgba(201,164,92,0.3)" }}
                      data-testid="report-view-conversation">
                      <MessageSquare size={12} /> Voir la conversation
                    </button>
                    {r.conversation_type === "transaction" && (
                      <Link to={`/syndicat-admin/citadelle/transactions?tx=${r.conversation_id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#C9A45C" }} data-testid="report-open-conversation">
                        <ExternalLink size={12} /> Ouvrir la transaction
                      </Link>
                    )}
                  </div>

                  {(r.buyer_id || r.seller_id) && (
                    <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                      <p className="text-xs opacity-70 mb-2">Modération des participants :</p>
                      <div className="space-y-2">
                        {r.buyer_id && (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs">Acheteur — {r.buyer_email}</span>
                            <MemberModerationActions userId={r.buyer_id} label={`Acheteur — ${r.buyer_email}`} onDone={load} />
                          </div>
                        )}
                        {r.seller_id && (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs">Vendeur — {r.seller_email}</span>
                            <MemberModerationActions userId={r.seller_id} label={`Vendeur — ${r.seller_email}`} onDone={load} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2 flex-wrap pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <input
                      value={notes[r.id] ?? r.admin_notes ?? ""}
                      onChange={e => setNotes({ ...notes, [r.id]: e.target.value })}
                      placeholder="Note interne (optionnel)…"
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "inherit" }}
                      data-testid="report-notes-input" />
                    {r.status !== "reviewed" && (
                      <button onClick={() => updateStatus(r, "reviewed")} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ border: "1px solid #C9A45C", color: "#C9A45C" }} data-testid="report-mark-reviewed">
                        Marquer en cours
                      </button>
                    )}
                    {r.status !== "resolved" && (
                      <button onClick={() => updateStatus(r, "resolved")} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "#22C55E", color: "white" }} data-testid="report-mark-resolved">
                        Résoudre
                      </button>
                    )}
                    {r.status !== "open" && (
                      <button onClick={() => updateStatus(r, "open")} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ border: "1px solid #DC2626", color: "#DC2626" }} data-testid="report-reopen">
                        Rouvrir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal — conversation signalée complète */}
        {convModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: "var(--admin-bg-card, #16213e)", border: "1px solid var(--admin-border, rgba(255,255,255,0.12))", color: "var(--admin-text)", maxHeight: "85vh" }} data-testid="conversation-modal">
              <div className="flex items-center justify-between gap-3 p-4" style={{ borderBottom: "1px solid var(--admin-border, rgba(255,255,255,0.1))" }}>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2"><MessageSquare size={16} style={{ color: "#C9A45C" }} /> Conversation signalée</h3>
                  <p className="text-xs opacity-60">{convModal.reason_label} · {convModal.listing_title || "—"}</p>
                </div>
                <button onClick={() => setConvModal(null)} className="text-sm px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--admin-border, rgba(255,255,255,0.2))", color: "inherit" }} data-testid="conversation-close-btn">Fermer</button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3">
                {convLoading ? (
                  <p className="text-sm opacity-50">Chargement de la conversation…</p>
                ) : !convData?.found ? (
                  <p className="text-sm opacity-60" data-testid="conversation-not-found">Conversation introuvable ou vide (aucun message enregistré).</p>
                ) : (
                  <>
                    {[...(convData.messages || []), ...(convData.dispute_messages || [])]
                      .filter(m => m.type !== "system")
                      .map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border, rgba(255,255,255,0.08))" }} data-testid="conversation-message">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: "#C9A45C" }}>{m.sender_email || m.sender_id}</span>
                          <span className="text-xs opacity-40">{fmtDate(m.sent_at)}</span>
                        </div>
                        {m.content && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                        <MessageAttachments attachments={m.attachments} mine={false} />
                      </div>
                    ))}
                    {[...(convData.messages || []), ...(convData.dispute_messages || [])].filter(m => m.type !== "system").length === 0 && (
                      <p className="text-sm opacity-60">Aucun message dans cette conversation.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
