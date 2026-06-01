/**
 * Utilitaires partagés pour la facturation
 */

import { getToken } from "@/services/authService";
import { API_URL } from "@/config/constants";

export const STATUS_CONFIG = {
  pending:   { label: "En attente", color: "#f59e0b", bg: "#f59e0b20" },
  validated: { label: "Validée",    color: "#3b82f6", bg: "#3b82f620" },
  paid:      { label: "Payée",      color: "#10b981", bg: "#10b98120" },
  rejected:  { label: "Rejetée",    color: "#ef4444", bg: "#ef444420" }
};

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

export const formatCurrency = (value) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

export const downloadInvoiceFile = async (invoiceId, fileName) => {
  const token = getToken();
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
