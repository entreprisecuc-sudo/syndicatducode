/**
 * Page Facturation - Espace Membre (Développeur / Commercial)
 * Voir le montant à facturer, soumettre des factures, historique
 */

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, Euro, Clock, CheckCircle, 
  XCircle, Eye, Loader2, AlertCircle, Download, X
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getAuthHeaders, getToken } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Configuration des statuts
const STATUS_CONFIG = {
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20", icon: Clock },
  validated: { label: "Validée", color: "#3b82f6", bg: "#3b82f620", icon: Eye },
  paid: { label: "Payée", color: "#10b981", bg: "#10b98120", icon: CheckCircle },
  rejected: { label: "Rejetée", color: "#ef4444", bg: "#ef444420", icon: XCircle }
};

// Fonction pour télécharger un fichier avec authentification
const downloadInvoiceFile = async (invoiceId, fileName) => {
  const token = getToken();
  // download=true pour forcer le téléchargement
  const url = `${API_URL}/invoices/file/${invoiceId}?token=${token}&download=true`;
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || `facture_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  } catch (err) {
    console.error("Erreur téléchargement:", err);
    alert("Erreur lors du téléchargement");
  }
};

const MemberBilling = () => {
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState(null);
  const [error, setError] = useState("");
  
  // Formulaire de soumission
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  // Modal de visualisation
  const [viewModal, setViewModal] = useState({ open: false, invoice: null, pdfUrl: null, loading: false });

  // Fonction pour ouvrir la modale et charger le PDF
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

  // Fermer la modale et libérer l'URL
  const closeViewModal = () => {
    if (viewModal.pdfUrl) {
      window.URL.revokeObjectURL(viewModal.pdfUrl);
    }
    setViewModal({ open: false, invoice: null, pdfUrl: null, loading: false });
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/invoices/my-billing`, {
        headers: getAuthHeaders()
      });
      setBillingInfo(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des informations de facturation");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Format non autorisé. Veuillez sélectionner un fichier PDF ou Excel.");
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("Le fichier ne doit pas dépasser 10 Mo");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !amount) return;

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append("amount", parseFloat(amount));
      formData.append("file", file);
      if (invoiceNumber) formData.append("invoice_number", invoiceNumber);
      if (description) formData.append("description", description);
      
      await axios.post(`${API_URL}/invoices/submit`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data"
        }
      });
      
      // Réinitialiser le formulaire
      setAmount("");
      setInvoiceNumber("");
      setDescription("");
      setFile(null);
      setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Rafraîchir les données
      fetchBillingInfo();
      
      alert("Facture soumise avec succès !");
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
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
      {/* Titre */}
      <h1 
        className="text-xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Facturation
      </h1>

      {/* Carte montant à facturer */}
      <div 
        className="p-6 rounded-xl mb-6"
        style={{ 
          background: "linear-gradient(135deg, var(--sage) 0%, var(--sage-dark) 100%)",
          color: "white"
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm mb-1">Montant à facturer</p>
            <p className="text-4xl font-bold">
              {formatCurrency(billingInfo?.amount_to_invoice || 0)}
            </p>
            {billingInfo?.billing_note && (
              <p className="text-white/70 text-sm mt-2">
                Note : {billingInfo.billing_note}
              </p>
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
        <div 
          className="p-4 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total facturé</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(billingInfo?.total_invoiced || 0)}
          </p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total payé</p>
          <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
            {formatCurrency(billingInfo?.total_paid || 0)}
          </p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>En attente</p>
          <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
            {formatCurrency(
              (billingInfo?.total_invoiced || 0) - (billingInfo?.total_paid || 0)
            )}
          </p>
        </div>
      </div>

      {/* Formulaire de soumission */}
      {showForm && (
        <div 
          className="p-6 rounded-xl mb-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--sage)" }}
        >
          <h2 
            className="font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Soumettre une nouvelle facture
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Montant */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="Ex: 1500.00"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ 
                    background: "var(--bg-section)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>
              
              {/* Numéro de facture */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Numéro de facture
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: FAC-2026-001"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ 
                    background: "var(--bg-section)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Description optionnelle..."
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  background: "var(--bg-section)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
              />
            </div>
            
            {/* Upload fichier */}
            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Fichier de facture (PDF ou Excel) *
              </label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-sage"
                style={{ borderColor: file ? "var(--sage)" : "var(--border-color)" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2" style={{ color: "var(--sage)" }}>
                    <FileText size={24} />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)" }}>
                    <Upload size={32} className="mx-auto mb-2" />
                    <p>Cliquez pour sélectionner un fichier</p>
                    <p className="text-xs mt-1">PDF ou Excel, max 10 Mo</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Boutons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !file || !amount}
                className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2"
                style={{ background: "var(--sage)" }}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {submitting ? "Envoi..." : "Soumettre la facture"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-lg font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
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
        
        {billingInfo?.invoices?.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucune facture soumise</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
            {billingInfo?.invoices?.map((invoice) => {
              const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={invoice.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ background: "var(--bg-section)" }}
                    >
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
                    {/* Visualiser */}
                    <button
                      onClick={() => setViewModal({ open: true, invoice })}
                      className="p-2 rounded-lg transition-colors hover:bg-gray-100 flex items-center gap-1"
                      style={{ color: "var(--sage)" }}
                      title="Visualiser"
                    >
                      <Eye size={18} />
                    </button>
                    {/* Télécharger */}
                    <button
                      onClick={() => downloadInvoiceFile(invoice.id, invoice.file_name)}
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
        )}
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

      {/* Modal de visualisation de facture */}
      {viewModal.open && viewModal.invoice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setViewModal({ open: false, invoice: null })}
        >
          <div 
            className="relative w-full max-w-4xl h-[85vh] rounded-xl overflow-hidden"
            style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la modale */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-section)" }}
            >
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {viewModal.invoice.invoice_number || "Facture"}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {viewModal.invoice.file_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadInvoiceFile(viewModal.invoice.id, viewModal.invoice.file_name)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                  style={{ background: "var(--sage)" }}
                >
                  <Download size={18} />
                  Télécharger
                </button>
                <button
                  onClick={() => setViewModal({ open: false, invoice: null })}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-200"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Contenu - iframe pour PDF */}
            <div className="h-[calc(85vh-80px)]">
              {viewModal.invoice.file_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`${API_URL}/invoices/file/${viewModal.invoice.id}?token=${getToken()}`}
                  className="w-full h-full"
                  title="Visualisation facture"
                />
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
                    onClick={() => downloadInvoiceFile(viewModal.invoice.id, viewModal.invoice.file_name)}
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
      )}
    </DashboardLayout>
  );
};

export default MemberBilling;
