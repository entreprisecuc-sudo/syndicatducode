/**
 * Admin — Gestion des factures Citadelle
 * Téléchargement unitaire (PDF) et en lot (ZIP)
 */
import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Search, CheckSquare, Square, Package, AlertCircle, RefreshCw } from "lucide-react";
import api from "@/services/api";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import AdminLayout from "@/components/admin/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminCitadelleInvoices() {
  const [invoices,  setInvoices]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error,     setError]     = useState("");

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api.get(`/citadelle/admin/invoices${params}`);
      setInvoices(res.data.invoices || []);
      setTotal(res.data.total || 0);
    } catch {
      setError("Impossible de charger les factures.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === invoices.length) setSelected(new Set());
    else setSelected(new Set(invoices.map(i => i.id)));
  };

  const getToken = () => {
    return localStorage.getItem("syndicat_auth_token") || localStorage.getItem("auth_token") || "";
  };

  const downloadSingle = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/citadelle/admin/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement."); }
  };

  const downloadBulk = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/citadelle/admin/invoices/bulk-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ invoice_ids: Array.from(selected) }),
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `factures-citadelle-${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement ZIP."); }
    finally { setBulkLoading(false); }
  };

  const fmt     = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
  const totalCA = invoices.reduce((s, i) => s + (i.amount_ttc || 0), 0);

  return (
    <AdminLayout>
    <div data-testid="admin-invoices-page">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
            Factures Citadelle
          </h2>
          <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            {total} facture{total !== 1 ? "s" : ""} · CA total : <strong>{fmt(totalCA)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: CITADELLE_COLORS.textMuted }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Client, n° facture, service..." data-testid="admin-invoice-search"
              className="pl-8 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`,
                       color: CITADELLE_COLORS.blue, width: 260 }} />
          </div>

          {/* Télécharger sélection */}
          <button onClick={downloadBulk} disabled={selected.size === 0 || bulkLoading}
            data-testid="bulk-download-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-40"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
            {bulkLoading ? <RefreshCw size={14} className="animate-spin" /> : <Package size={14} />}
            {bulkLoading ? "En cours…" : `Télécharger ZIP${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: `${CITADELLE_COLORS.border} transparent ${CITADELLE_COLORS.gold} transparent` }} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: CITADELLE_COLORS.bg, border: `1px dashed ${CITADELLE_COLORS.border}` }}>
          <FileText size={32} className="mx-auto mb-3" style={{ color: CITADELLE_COLORS.textMuted }} />
          <p className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Aucune facture</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
          {/* En-tête */}
          <div className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide"
            style={{ background: CITADELLE_COLORS.night, color: "rgba(255,255,255,0.6)" }}>
            <div className="col-span-1 flex items-center">
              <button onClick={toggleAll} className="flex items-center">
                {selected.size === invoices.length
                  ? <CheckSquare size={16} style={{ color: CITADELLE_COLORS.gold }} />
                  : <Square size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
              </button>
            </div>
            <span className="col-span-2">N° Facture</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-3">Client</span>
            <span className="col-span-2">Service</span>
            <span className="col-span-1 text-right">TTC</span>
            <span className="col-span-1"></span>
          </div>

          {invoices.map((inv, i) => {
            const isSelected = selected.has(inv.id);
            return (
              <div key={inv.id}
                className="grid grid-cols-12 px-5 py-3.5 items-center gap-2 transition-colors"
                style={{
                  borderTop: i > 0 ? `1px solid ${CITADELLE_COLORS.border}` : "none",
                  background: isSelected ? "rgba(201,164,92,0.04)" : "white",
                }}
                data-testid={`admin-invoice-row-${inv.id}`}>

                {/* Checkbox */}
                <div className="col-span-1">
                  <button onClick={() => toggleSelect(inv.id)}
                    data-testid={`select-invoice-${inv.id}`}>
                    {isSelected
                      ? <CheckSquare size={16} style={{ color: CITADELLE_COLORS.gold }} />
                      : <Square size={16} style={{ color: CITADELLE_COLORS.border }} />}
                  </button>
                </div>

                {/* N° */}
                <span className="col-span-2 text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>
                  {inv.invoice_number}
                </span>

                {/* Date */}
                <span className="col-span-2 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {fmtDate(inv.created_at)}
                </span>

                {/* Client */}
                <div className="col-span-3">
                  <p className="text-sm font-medium truncate" style={{ color: CITADELLE_COLORS.blue }}>
                    {inv.client_name}
                  </p>
                  <p className="text-xs truncate" style={{ color: CITADELLE_COLORS.textMuted }}>
                    {inv.client_email}
                  </p>
                </div>

                {/* Service */}
                <span className="col-span-2 text-xs truncate" style={{ color: CITADELLE_COLORS.textMuted }}>
                  {inv.service_title}
                </span>

                {/* Montant */}
                <span className="col-span-1 text-sm font-black text-right"
                  style={{ color: CITADELLE_COLORS.blue }}>
                  {fmt(inv.amount_ttc)}
                </span>

                {/* Télécharger */}
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => downloadSingle(inv.id, inv.invoice_number)}
                    data-testid={`admin-download-invoice-${inv.id}`}
                    title="Télécharger PDF"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(201,164,92,0.1)", color: CITADELLE_COLORS.gold }}>
                    <Download size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
