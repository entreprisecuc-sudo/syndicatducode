/**
 * Page Documents - Espace Commercial
 */

import { FileText, Download, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Documents disponibles (statique pour MVP)
const DOCUMENTS = [
  {
    id: 1,
    title: "Contrat de partenariat commercial",
    description: "Conditions générales du partenariat commercial avec Le Syndicat du Code.",
    type: "PDF",
    category: "Contrat"
  },
  {
    id: 2,
    title: "Grille de commissions",
    description: "Barème des commissions selon le type de projet apporté.",
    type: "PDF",
    category: "Commercial"
  },
  {
    id: 3,
    title: "Guide du partenaire commercial",
    description: "Tout ce qu'il faut savoir pour bien démarrer votre partenariat.",
    type: "PDF",
    category: "Guide"
  }
];

const CommercialDocuments = () => {
  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Documents
      </h1>

      {/* Introduction */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Documents partenaires
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Retrouvez ici tous les documents relatifs à votre partenariat commercial avec Le Syndicat du Code.
        </p>
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {DOCUMENTS.map((doc) => (
          <div 
            key={doc.id}
            className="p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-lg shrink-0"
                style={{ background: "var(--bg-section)" }}
              >
                <FileText size={24} style={{ color: "var(--sage)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {doc.title}
                  </h3>
                  <span 
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "var(--bg-section)", color: "var(--text-muted)" }}
                  >
                    {doc.type}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {doc.description}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--sage)" }}>
                  {doc.category}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:shrink-0">
              <button 
                className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-2"
                onClick={() => alert("Document disponible prochainement")}
              >
                <Download size={16} />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <p 
        className="text-sm mt-6 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Des questions ? Contactez-nous à{" "}
        <a href="mailto:atelier@syndicatducode.fr" style={{ color: "var(--sage)" }}>
          atelier@syndicatducode.fr
        </a>
      </p>
    </DashboardLayout>
  );
};

export default CommercialDocuments;
