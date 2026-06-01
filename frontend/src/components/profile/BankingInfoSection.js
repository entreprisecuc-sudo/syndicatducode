/**
 * Section Informations Bancaires
 * Partagée entre DeveloperProfile et CommercialProfile
 */

import { CreditCard } from "lucide-react";

const BankingInfoSection = ({ formData, onChange, subtitle }) => (
  <div
    className="p-6 rounded-xl mb-6"
    style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
  >
    <div className="flex items-center gap-2 mb-4">
      <CreditCard size={20} style={{ color: "var(--sage)" }} />
      <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
        Informations Bancaires
      </h3>
    </div>
    <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
      {subtitle || "Pour recevoir les paiements"}
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          IBAN
        </label>
        <input
          type="text"
          name="iban"
          value={formData.iban}
          onChange={onChange}
          placeholder="FR76 1234 5678 9012 3456 7890 123"
          className="w-full"
          data-testid="profile-iban"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          BIC / SWIFT
        </label>
        <input
          type="text"
          name="bic"
          value={formData.bic}
          onChange={onChange}
          placeholder="BNPAFRPP"
          className="w-full"
          data-testid="profile-bic"
        />
      </div>
    </div>
    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
      🔒 Ces informations sont stockées de manière sécurisée et utilisées uniquement pour les virements.
    </p>
  </div>
);

export default BankingInfoSection;
