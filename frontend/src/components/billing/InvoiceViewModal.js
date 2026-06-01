/**
 * Modal de visualisation d'une facture (PDF ou Excel)
 */

import { X, Download, Loader2, AlertCircle, FileText } from "lucide-react";

const InvoiceViewModal = ({ viewModal, onClose, onDownload }) => {
  if (!viewModal.open || !viewModal.invoice) return null;

  const { invoice, pdfUrl, loading } = viewModal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[85vh] rounded-xl overflow-hidden"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-section)" }}
        >
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {invoice.invoice_number || "Facture"}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{invoice.file_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(invoice.id, invoice.file_name)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
              style={{ background: "var(--sage)" }}
            >
              <Download size={18} />
              Télécharger
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-gray-200"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="h-[calc(85vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={48} className="animate-spin" style={{ color: "var(--sage)" }} />
            </div>
          ) : invoice.file_name?.toLowerCase().endsWith('.pdf') ? (
            pdfUrl ? (
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full"
                style={{ border: "none" }}
              >
                <embed src={pdfUrl} type="application/pdf" className="w-full h-full" />
                <p className="p-4 text-center" style={{ color: "var(--text-muted)" }}>
                  Votre navigateur ne supporte pas l'affichage des PDF.
                  <button
                    onClick={() => onDownload(invoice.id, invoice.file_name)}
                    className="ml-2 underline"
                    style={{ color: "var(--sage)" }}
                  >
                    Télécharger le fichier
                  </button>
                </p>
              </object>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <AlertCircle size={64} style={{ color: "#ef4444" }} className="mb-4" />
                <p style={{ color: "var(--text-primary)" }}>Erreur lors du chargement du PDF</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText size={64} style={{ color: "var(--sage)" }} className="mb-4" />
              <h4 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Fichier Excel
              </h4>
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                Les fichiers Excel ne peuvent pas être prévisualisés directement.
              </p>
              <button
                onClick={() => onDownload(invoice.id, invoice.file_name)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-white"
                style={{ background: "var(--sage)" }}
              >
                <Download size={20} />
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;
