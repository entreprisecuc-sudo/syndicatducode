/**
 * Onglet Documents - Détail utilisateur admin
 * Placeholder pour la gestion des documents utilisateur
 */

import { FileText } from "lucide-react";

export const DocumentsTab = ({ userId }) => {
  return (
    <div 
      className="p-8 rounded-xl text-center transition-colors duration-300"
      style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
    >
      <FileText size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
      <p style={{ color: "var(--admin-text-secondary)" }}>Aucun document disponible</p>
      <p className="text-sm mt-2" style={{ color: "var(--admin-text-muted)" }}>
        Cette fonctionnalité sera disponible prochainement
      </p>
    </div>
  );
};

export default DocumentsTab;
