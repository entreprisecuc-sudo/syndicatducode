/**
 * Mes Factures — Espace membre La Citadelle Numérique
 * Affiche les factures liées aux achats de services
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Download, Search, Receipt, AlertCircle } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_STYLES = {
  not_required: { color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
  pending:      { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  submitted:    { color: "#22C55E", bg: "rgba(34,197,94,0.08)" },
};

function statusBadge(status, t) {
  const key = STATUS_STYLES[status] ? status : "not_required";
  const { color, bg } = STATUS_STYLES[key];
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: bg, color }}>
      {t(`member.inv_status_${key}`)}
    </span>
  );
}

export default function CitadelleMyInvoices() {
  const { t, i18n } = useTranslation();
  const { token } = useCitadelleAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    citadelleApi.get("/invoices/my")
      .then(r => setInvoices(r.data.invoices || []))
      .catch(() => setError(t("member.inv_load_error")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(inv =>
    search === "" ||
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.service_title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (invoiceId, invoiceNumber) => {
    const url = `${BACKEND_URL}/api/citadelle/invoices/${invoiceId}/pdf`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${invoiceNumber}.pdf`);
    // Ajout du token via fetch pour le téléchargement authentifié
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => alert(t("member.inv_download_error")));
  };

  const fmt = (n) => new Intl.NumberFormat(i18n.language === "en" ? "en-GB" : "fr-FR", { style: "currency", currency: "EUR" }).format(n);
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR") : "—";

  if (loading) return (
    <CitadelleLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: `${CITADELLE_COLORS.border} transparent ${CITADELLE_COLORS.gold} transparent` }} />
      </div>
    </CitadelleLayout>
  );

  return (
    <CitadelleLayout>
      <div className="min-h-screen py-12 px-4" style={{ background: CITADELLE_COLORS.bg }}>
        <div className="max-w-4xl mx-auto" data-testid="my-invoices-page">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(201,164,92,0.12)" }}>
            <Receipt size={20} style={{ color: CITADELLE_COLORS.gold }} />
          </div>
          <div>
            <h2 className="font-black text-base" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              {t("member.inv_title")}
            </h2>
            <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
              {t("member.inv_count", { count: invoices.length })}
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        {invoices.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: CITADELLE_COLORS.textMuted }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("member.inv_search_ph")} data-testid="invoice-search"
              className="pl-8 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`,
                       color: CITADELLE_COLORS.blue, width: 220 }} />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl mb-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {filtered.length === 0 && !error ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: CITADELLE_COLORS.bg, border: `1px dashed ${CITADELLE_COLORS.border}` }}>
          <FileText size={32} className="mx-auto mb-3" style={{ color: CITADELLE_COLORS.textMuted }} />
          <p className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>
            {search ? t("member.inv_empty_search") : t("member.inv_empty")}
          </p>
          <p className="text-sm mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("member.inv_empty_sub")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${CITADELLE_COLORS.border}` }}>
          {/* En-tête tableau */}
          <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide"
            style={{ background: CITADELLE_COLORS.night, color: "rgba(255,255,255,0.6)" }}>
            <span className="col-span-3">{t("member.inv_col_invoice")}</span>
            <span className="col-span-3">{t("member.inv_col_date")}</span>
            <span className="col-span-3">{t("member.inv_col_service")}</span>
            <span className="col-span-1 text-right">{t("member.inv_col_amount")}</span>
            <span className="col-span-1 text-center">{t("member.inv_col_status")}</span>
            <span className="col-span-1"></span>
          </div>

          {filtered.map((inv, i) => (
            <div key={inv.id}
              className="grid grid-cols-12 px-5 py-4 items-center gap-2 transition-colors hover:bg-[#f8f9fb]"
              style={{ borderTop: i > 0 ? `1px solid ${CITADELLE_COLORS.border}` : "none",
                       background: "white" }}
              data-testid={`invoice-row-${inv.id}`}>

              {/* Numéro */}
              <div className="col-span-5 sm:col-span-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,164,92,0.10)" }}>
                  <FileText size={14} style={{ color: CITADELLE_COLORS.gold }} />
                </div>
                <span className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>
                  {inv.invoice_number}
                </span>
              </div>

              {/* Date */}
              <span className="col-span-3 sm:col-span-3 text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                {fmtDate(inv.created_at)}
              </span>

              {/* Service */}
              <span className="col-span-5 sm:col-span-3 text-sm font-medium truncate"
                style={{ color: CITADELLE_COLORS.blue }}>
                {inv.service_title}
              </span>

              {/* Montant */}
              <span className="hidden sm:block col-span-1 text-sm font-black text-right"
                style={{ color: CITADELLE_COLORS.blue }}>
                {fmt(inv.amount_ttc)}
              </span>

              {/* Statut PDP */}
              <div className="hidden sm:flex col-span-1 justify-center">
                {statusBadge(inv.pdp_status, t)}
              </div>

              {/* Télécharger */}
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button onClick={() => handleDownload(inv.id, inv.invoice_number)}
                  data-testid={`download-invoice-${inv.id}`}
                  title={t("member.inv_download_title")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(201,164,92,0.1)", color: CITADELLE_COLORS.gold }}>
                  <Download size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note PDP */}
      <p className="text-xs mt-4 text-center" style={{ color: CITADELLE_COLORS.textMuted }}>
        {t("member.inv_pdp_note")}
      </p>
        </div>
      </div>
    </CitadelleLayout>
  );
}
