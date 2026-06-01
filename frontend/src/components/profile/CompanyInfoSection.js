/**
 * Section Informations Entreprise
 * Partagée entre DeveloperProfile et CommercialProfile
 */

import { Building2 } from "lucide-react";

const CompanyInfoSection = ({ formData, onChange, subtitle }) => (
  <div
    className="p-6 rounded-xl mb-6"
    style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
  >
    <div className="flex items-center gap-2 mb-4">
      <Building2 size={20} style={{ color: "var(--sage)" }} />
      <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
        Informations Entreprise
      </h3>
    </div>
    <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
      {subtitle || "Ces informations sont nécessaires pour la facturation et les paiements"}
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Nom de l'entreprise
        </label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={onChange}
          placeholder="Raison sociale ou auto-entrepreneur"
          className="w-full"
          data-testid="profile-company-name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Numéro SIRET
        </label>
        <input
          type="text"
          name="siret"
          value={formData.siret}
          onChange={onChange}
          placeholder="123 456 789 00012"
          className="w-full"
          maxLength={17}
          data-testid="profile-siret"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Numéro de TVA intracommunautaire
      </label>
      <input
        type="text"
        name="tva_number"
        value={formData.tva_number}
        onChange={onChange}
        placeholder="FR12345678901 (optionnel)"
        className="w-full"
        data-testid="profile-tva"
      />
    </div>
  </div>
);

export default CompanyInfoSection;
