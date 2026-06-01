/**
 * Formulaire de soumission d'une nouvelle facture
 * Gère son propre état (montant, numéro, description, fichier)
 */

import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import api from "@/services/api";

const InvoiceSubmitForm = ({ onSubmitSuccess, onCancel }) => {
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

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

      await api.post('/invoices/submit', formData);

      // Réinitialiser le formulaire
      setAmount("");
      setInvoiceNumber("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("Facture soumise avec succès !");
      onSubmitSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="p-6 rounded-xl mb-6"
      style={{ background: "var(--bg-card)", border: "1px solid var(--sage)" }}
    >
      <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Soumettre une nouvelle facture
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
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
              style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Numéro de facture
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ex: FAC-2026-001"
              className="w-full px-4 py-2 rounded-lg"
              style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description optionnelle..."
            className="w-full px-4 py-2 rounded-lg"
            style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Fichier de facture (PDF ou Excel) *
          </label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !file || !amount}
            className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2"
            style={{ background: "var(--sage)" }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {submitting ? "Envoi..." : "Soumettre la facture"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceSubmitForm;
