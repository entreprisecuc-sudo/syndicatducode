/**
 * Page Facturation - Espace Membre (Développeur / Commercial)
 * Voir le montant à facturer, soumettre des factures, historique
 */

import { useState, useEffect } from "react";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getToken } from "@/services/authService";
import { API_URL } from "@/config/constants";
import api from "@/services/api";
import { formatCurrency, downloadInvoiceFile } from "@/utils/billingUtils";
import InvoiceSubmitForm from "@/components/billing/InvoiceSubmitForm";
import InvoiceList from "@/components/billing/InvoiceList";
import InvoiceViewModal from "@/components/billing/InvoiceViewModal";

const MemberBilling = () => {
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, invoice: null, pdfUrl: null, loading: false });

  const openViewModal = async (invoice) => {
    setViewModal({ open: true, invoice, pdfUrl: null, loading: true });
    if (invoice.file_name?.toLowerCase().endsWith('.pdf')) {
      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/invoices/file/${invoice.id}?token=${token}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setViewModal(prev => ({ ...prev, pdfUrl: url, loading: false }));
      } catch (err) {
        console.error("Erreur chargement PDF:", err);
        setViewModal(prev => ({ ...prev, loading: false }));
      }
    } else {
      setViewModal(prev => ({ ...prev, loading: false }));
    }
  };

  const closeViewModal = () => {
    if (viewModal.pdfUrl) window.URL.revokeObjectURL(viewModal.pdfUrl);
    setViewModal({ open: false, invoice: null, pdfUrl: null, loading: false });
  };

  useEffect(() => { fetchBillingInfo(); }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invoices/my-billing');
      setBillingInfo(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des informations de facturation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--sage)" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Facturation
      </h1>

      {/* Carte montant à facturer */}
      <div
        className="p-6 rounded-xl mb-6"
        style={{ background: "linear-gradient(135deg, var(--sage) 0%, var(--sage-dark) 100%)", color: "white" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm mb-1">Montant à facturer</p>
            <p className="text-4xl font-bold">{formatCurrency(billingInfo?.amount_to_invoice || 0)}</p>
            {billingInfo?.billing_note && (
              <p className="text-white/70 text-sm mt-2">Note : {billingInfo.billing_note}</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Upload size={20} />
            Soumettre une facture
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total facturé</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(billingInfo?.total_invoiced || 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total payé</p>
          <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
            {formatCurrency(billingInfo?.total_paid || 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>En attente</p>
          <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
            {formatCurrency((billingInfo?.total_invoiced || 0) - (billingInfo?.total_paid || 0))}
          </p>
        </div>
      </div>

      {/* Formulaire de soumission */}
      {showForm && (
        <InvoiceSubmitForm
          onSubmitSuccess={() => { setShowForm(false); fetchBillingInfo(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Historique des factures */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Historique des factures
          </h2>
        </div>
        <InvoiceList
          invoices={billingInfo?.invoices || []}
          onView={openViewModal}
          onDownload={downloadInvoiceFile}
        />
      </div>

      {/* Note d'information */}
      <div
        className="mt-6 p-4 rounded-lg flex items-start gap-3"
        style={{ background: "#3b82f620", border: "1px solid #3b82f6" }}
      >
        <AlertCircle size={20} style={{ color: "#3b82f6" }} className="shrink-0 mt-0.5" />
        <div className="text-sm" style={{ color: "#3b82f6" }}>
          <p className="font-medium mb-1">Comment ça fonctionne ?</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Le Syndicat vous indique le montant à facturer</li>
            <li>Vous créez votre facture avec ce montant</li>
            <li>Vous uploadez votre facture (PDF ou Excel)</li>
            <li>L'équipe valide et procède au paiement</li>
          </ol>
        </div>
      </div>

      {/* Modal visualisation */}
      <InvoiceViewModal
        viewModal={viewModal}
        onClose={closeViewModal}
        onDownload={downloadInvoiceFile}
      />
    </DashboardLayout>
  );
};

export default MemberBilling;
