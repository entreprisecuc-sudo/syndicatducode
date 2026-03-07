/**
 * Composant Modal Admin réutilisable
 * Utilisé pour les formulaires de création/édition dans l'admin
 */

import { X } from "lucide-react";

/**
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Callback de fermeture
 * @param {string} title - Titre du modal
 * @param {React.ReactNode} children - Contenu du modal
 * @param {string} maxWidth - Largeur max (default: "max-w-2xl")
 */
const AdminModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-2xl" 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl transition-colors duration-300`}
        style={{ background: "var(--admin-bg-card)" }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 flex items-center justify-between p-4 border-b transition-colors duration-300"
          style={{ 
            background: "var(--admin-bg-card)", 
            borderColor: "var(--admin-border)" 
          }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: "var(--admin-text)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ 
              background: "var(--admin-bg-section)", 
              color: "var(--admin-text-secondary)" 
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Composants utilitaires pour le formulaire
 */
export const ModalFormGroup = ({ label, required, children }) => (
  <div className="mb-4">
    <label 
      className="block text-sm font-medium mb-2"
      style={{ color: "var(--admin-text-secondary)" }}
    >
      {label} {required && "*"}
    </label>
    {children}
  </div>
);

export const ModalInput = ({ type = "text", ...props }) => (
  <input
    type={type}
    className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
    style={{ 
      background: "var(--admin-bg-section)", 
      border: "1px solid var(--admin-border)",
      color: "var(--admin-text)"
    }}
    {...props}
  />
);

export const ModalTextarea = ({ rows = 4, ...props }) => (
  <textarea
    rows={rows}
    className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
    style={{ 
      background: "var(--admin-bg-section)", 
      border: "1px solid var(--admin-border)",
      color: "var(--admin-text)"
    }}
    {...props}
  />
);

export const ModalSelect = ({ children, ...props }) => (
  <select
    className="w-full rounded-lg py-2 px-3 transition-colors duration-300"
    style={{ 
      background: "var(--admin-bg-section)", 
      border: "1px solid var(--admin-border)",
      color: "var(--admin-text)"
    }}
    {...props}
  >
    {children}
  </select>
);

export const ModalActions = ({ children }) => (
  <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
    {children}
  </div>
);

export const ModalSubmitButton = ({ loading, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
    style={{ background: "var(--admin-accent)" }}
  >
    {loading ? "Enregistrement..." : children}
  </button>
);

export const ModalCancelButton = ({ onClick, children = "Annuler" }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-4 py-2 rounded-lg font-medium transition-colors"
    style={{ 
      background: "var(--admin-bg-section)", 
      color: "var(--admin-text-secondary)" 
    }}
  >
    {children}
  </button>
);

export default AdminModal;
