/**
 * Page Affaires - Espace Commercial
 */

import { useState } from "react";
import { Briefcase, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Statuts des affaires
const STATUS_CONFIG = {
  pending: { label: "En attente", icon: Clock, color: "#f59e0b", bg: "#fef3c7" },
  validated: { label: "Validée", icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
  rejected: { label: "Refusée", icon: XCircle, color: "#ef4444", bg: "#fee2e2" },
  in_progress: { label: "En cours", icon: AlertCircle, color: "#3b82f6", bg: "#dbeafe" }
};

// Données mockées (vide pour MVP)
const MOCK_AFFAIRES = [];

const CommercialAffaires = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    projectType: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSuccess(true);
    setLoading(false);
    setFormData({
      companyName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      projectType: "",
      description: ""
    });
    
    setTimeout(() => {
      setSuccess(false);
      setShowForm(false);
    }, 2000);
  };

  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Mes affaires
      </h1>

      {/* En-tête avec bouton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Suivi des affaires apportées
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Déclarez et suivez les prospects que vous apportez au Syndicat.
          </p>
        </div>
        <button 
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          Déclarer une affaire
        </button>
      </div>

      {/* Formulaire de déclaration */}
      {showForm && (
        <div 
          className="p-5 rounded-xl mb-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Nouvelle affaire
          </h3>

          {success ? (
            <div className="p-4 rounded-lg bg-green-100 text-green-700 text-center">
              <CheckCircle size={32} className="mx-auto mb-2" />
              <p className="font-medium">Affaire déclarée avec succès !</p>
              <p className="text-sm">Nous la traiterons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="Entreprise SARL"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Nom du contact *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    placeholder="Jean Dupont"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Email du contact *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    placeholder="contact@entreprise.fr"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Téléphone du contact
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="06 00 00 00 00"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Type de projet *
                </label>
                <select
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  required
                  className="w-full"
                >
                  <option value="">Sélectionner...</option>
                  <option value="site_vitrine">Site vitrine</option>
                  <option value="ecommerce">Site e-commerce</option>
                  <option value="crm_erp">CRM / ERP</option>
                  <option value="app_mobile">Application mobile</option>
                  <option value="ia">Intégration IA</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Description du besoin *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Décrivez brièvement le besoin du client..."
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Envoi..." : "Déclarer l'affaire"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Liste des affaires */}
      {MOCK_AFFAIRES.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <Briefcase size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Aucune affaire déclarée
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Commencez par déclarer votre première affaire en cliquant sur le bouton ci-dessus.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {MOCK_AFFAIRES.map((affaire) => {
            const status = STATUS_CONFIG[affaire.status];
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={affaire.id}
                className="p-5 rounded-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                {/* Contenu de l'affaire */}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CommercialAffaires;
