/**
 * Onglet Factures - Admin User Detail
 * Permet de définir le montant à facturer et voir/gérer les factures
 */

import { useState, useEffect } from "react";
import { 
  Euro, FileText, CheckCircle, XCircle, Clock, Eye, 
  Loader2, Download, Trash2, Edit2, Save, X
} from "lucide-react";
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
  const url = `${API_URL}/invoices/file/${invoiceId}?token=${token}`;
  
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
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

const BillingTab = ({ userId, userEmail }) => {
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState(null);
  
  // Formulaire montant
  const [editingAmount, setEditingAmount] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);
  
  // Actions facture
  const [updatingInvoice, setUpdatingInvoice] = useState(null);
  
  // Modal de visualisation
  const [viewModal, setViewModal] = useState({ open: false, invoice: null });

  useEffect(() => {
    fetchBillingInfo();
  }, [userId]);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/invoices/admin/user/${userId}/billing`, {
        headers: getAuthHeaders()
      });
      setBillingInfo(response.data);
      setNewAmount(response.data.amount_to_invoice?.toString() || "0");
      setNewNote(response.data.billing_note || "");
    } catch (err) {
      console.error("Erreur chargement facturation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAmount = async () => {
    try {
      setSavingAmount(true);
      await axios.put(
        `${API_URL}/invoices/admin/user/${userId}/billing`,
        { amount: parseFloat(newAmount) || 0, note: newNote || null },
        { headers: getAuthHeaders() }
      );
      setEditingAmount(false);
      fetchBillingInfo();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSavingAmount(false);
    }
  };

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      setUpdatingInvoice(invoiceId);
      await axios.put(
        `${API_URL}/invoices/admin/${invoiceId}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      fetchBillingInfo();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setUpdatingInvoice(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    
    try {
      await axios.delete(`${API_URL}/invoices/admin/${invoiceId}`, {
        headers: getAuthHeaders()
      });
      fetchBillingInfo();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
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
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--admin-accent)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Carte montant à facturer */}
      <div 
        className="p-6 rounded-xl"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: "var(--admin-text)" }}>
            Montant à facturer
          </h3>
          {!editingAmount ? (
            <button
              onClick={() => setEditingAmount(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ background: "var(--admin-accent)", color: "white" }}
            >
              <Edit2 size={14} />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveAmount}
                disabled={savingAmount}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white"
                style={{ background: "#10b981" }}
              >
                {savingAmount ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setEditingAmount(false);
                  setNewAmount(billingInfo?.amount_to_invoice?.toString() || "0");
                  setNewNote(billingInfo?.billing_note || "");
                }}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--admin-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {editingAmount ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--admin-text-secondary)" }}>
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  background: "var(--admin-bg-section)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--admin-text-secondary)" }}>
                Note (optionnelle)
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                placeholder="Ex: Mission projet X - Mars 2026"
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  background: "var(--admin-bg-section)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <p 
              className="text-4xl font-bold mb-2"
              style={{ color: "var(--admin-accent)" }}
            >
              {formatCurrency(billingInfo?.amount_to_invoice)}
            </p>
            {billingInfo?.billing_note && (
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                {billingInfo.billing_note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-xl"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Total facturé</p>
          <p className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
            {formatCurrency(billingInfo?.total_invoiced)}
          </p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Total payé</p>
          <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
            {formatCurrency(billingInfo?.total_paid)}
          </p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>En attente</p>
          <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
            {billingInfo?.pending_count || 0} facture(s)
          </p>
        </div>
      </div>

      {/* Liste des factures */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--admin-border)" }}>
          <h3 className="font-semibold" style={{ color: "var(--admin-text)" }}>
            Factures soumises ({billingInfo?.invoices?.length || 0})
          </h3>
        </div>

        {billingInfo?.invoices?.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--admin-text-muted)" }}>
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucune facture soumise par cet utilisateur</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
            {billingInfo?.invoices?.map((invoice) => {
              const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const isUpdating = updatingInvoice === invoice.id;
              
              return (
                <div key={invoice.id} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info facture */}
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ background: "var(--admin-bg-section)" }}
                      >
                        <FileText size={24} style={{ color: "var(--admin-accent)" }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "var(--admin-text)" }}>
                          {invoice.invoice_number || `Facture du ${formatDate(invoice.created_at)}`}
                        </p>
                        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                          {invoice.description || invoice.file_name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--admin-text-muted)" }}>
                          Soumise le {formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Montant et statut */}
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>
                        {formatCurrency(invoice.amount)}
                      </p>
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                    {/* Changer statut */}
                    <span className="text-xs mr-2" style={{ color: "var(--admin-text-muted)" }}>
                      Changer le statut :
                    </span>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => handleUpdateStatus(invoice.id, key)}
                          disabled={invoice.status === key || isUpdating}
                          className={`px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                            invoice.status === key ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
                          }`}
                          style={{ background: config.bg, color: config.color }}
                        >
                          {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                          {config.label}
                        </button>
                      );
                    })}

                    {/* Visualiser */}
                    <button
                      onClick={() => openInvoiceFile(invoice.id, false)}
                      className="ml-auto p-2 rounded-lg transition-colors hover:opacity-80 flex items-center gap-1"
                      style={{ background: "var(--admin-bg-section)", color: "var(--admin-text)" }}
                      title="Visualiser la facture"
                    >
                      <Eye size={16} />
                      <span className="text-xs hidden sm:inline">Voir</span>
                    </button>

                    {/* Télécharger */}
                    <button
                      onClick={() => openInvoiceFile(invoice.id, true)}
                      className="p-2 rounded-lg transition-colors hover:opacity-80 flex items-center gap-1"
                      style={{ background: "var(--admin-bg-section)", color: "var(--admin-accent)" }}
                      title="Télécharger la facture"
                    >
                      <Download size={16} />
                      <span className="text-xs hidden sm:inline">Télécharger</span>
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="p-2 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: "#ef444420", color: "#ef4444" }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingTab;
