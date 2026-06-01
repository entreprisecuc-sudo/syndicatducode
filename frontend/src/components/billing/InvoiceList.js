/**
 * Liste des factures soumises par le membre
 */

import { FileText, Eye, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { STATUS_CONFIG, formatDate, formatCurrency } from "@/utils/billingUtils";

// Icônes par statut (séparées du config pour éviter les imports React dans les utilitaires)
const STATUS_ICONS = {
  pending:   Clock,
  validated: Eye,
  paid:      CheckCircle,
  rejected:  XCircle
};

const InvoiceList = ({ invoices, onView, onDownload }) => {
  if (!invoices?.length) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
        <FileText size={48} className="mx-auto mb-3 opacity-50" />
        <p>Aucune facture soumise</p>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
      {invoices.map((invoice) => {
        const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
        const StatusIcon = STATUS_ICONS[invoice.status] || Clock;

        return (
          <div
            key={invoice.id}
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg" style={{ background: "var(--bg-section)" }}>
                <FileText size={24} style={{ color: "var(--sage)" }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {invoice.invoice_number || `Facture du ${formatDate(invoice.created_at)}`}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {invoice.description || invoice.file_name}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Soumise le {formatDate(invoice.created_at)}
                </p>
                {invoice.admin_note && (
                  <p
                    className="text-xs mt-1 p-2 rounded"
                    style={{
                      background: invoice.status === "rejected" ? "#ef444420" : "#3b82f620",
                      color: invoice.status === "rejected" ? "#ef4444" : "#3b82f6"
                    }}
                  >
                    Note admin : {invoice.admin_note}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(invoice.amount)}
              </p>
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm"
                style={{ background: statusConfig.bg, color: statusConfig.color }}
              >
                <StatusIcon size={14} />
                {statusConfig.label}
              </span>
              <button
                onClick={() => onView(invoice)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "var(--sage)" }}
                title="Visualiser"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => onDownload(invoice.id, invoice.file_name)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "var(--sage)" }}
                title="Télécharger"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceList;
