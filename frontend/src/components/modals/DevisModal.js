/**
 * Modal de demande de devis
 * Formulaire popup accessible depuis n'importe quelle page
 */

import { X, Check, Paperclip, FileText } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import useContactForm from "@/hooks/useContactForm";
import { ACCEPTED_FILE_TYPES } from "@/config/constants";

const DevisModal = () => {
  const { isModalOpen, closeModal } = useModal();
  
  const {
    formData,
    files,
    status,
    loading,
    submitted,
    handleChange,
    handleFileChange,
    removeFile,
    handleSubmit,
    resetForm
  } = useContactForm();

  // Ferme le modal et réinitialise le formulaire
  const handleClose = () => {
    resetForm();
    closeModal();
  };

  // Ne rend rien si le modal est fermé
  if (!isModalOpen) return null;

  // Affichage après soumission réussie
  if (submitted) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
          
          <div className="text-center py-8">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" 
              style={{ background: 'linear-gradient(135deg, var(--sage-dark), var(--sage))' }}
            >
              <Check size={40} color="white" />
            </div>
            <h2 
              className="text-2xl md:text-3xl font-bold mb-4" 
              style={{ color: 'var(--sage-dark)' }}
            >
              Demande envoyée !
            </h2>
            <p 
              className="text-lg mb-2" 
              style={{ color: 'var(--text-secondary)' }}
            >
              Un membre du Syndicat va vous contacter au plus vite.
            </p>
            <p 
              className="text-sm" 
              style={{ color: 'var(--text-muted)' }}
            >
              Notre loi. Unis par le code.
            </p>
            <button onClick={handleClose} className="btn-primary mt-8">
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <X size={24} />
        </button>
        
        {/* En-tête */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Demander un devis</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Pas de rançon. Un prix. Technologies actuelles incluses.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Champ Nom */}
            <input
              type="text"
              name="name"
              placeholder="Votre nom"
              value={formData.name}
              onChange={handleChange}
              required
              data-testid="modal-contact-name"
            />
            
            {/* Champ Email */}
            <input
              type="email"
              name="email"
              placeholder="Votre email"
              value={formData.email}
              onChange={handleChange}
              required
              data-testid="modal-contact-email"
            />
            
            {/* Champ Téléphone */}
            <input
              type="tel"
              name="phone"
              placeholder="Votre téléphone"
              value={formData.phone}
              onChange={handleChange}
              required
              data-testid="modal-contact-phone"
            />
            
            {/* Champ Message */}
            <textarea
              name="message"
              placeholder="Décrivez votre projet..."
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              data-testid="modal-contact-message"
            ></textarea>
            
            {/* Upload de fichiers */}
            <div>
              <label 
                className="flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--sage)]"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-section)' }}
              >
                <Paperclip size={18} style={{ color: 'var(--sage)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Joindre des fichiers
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept={ACCEPTED_FILE_TYPES}
                />
              </label>
              <p 
                className="mt-1 text-xs" 
                style={{ color: 'var(--text-muted)' }}
              >
                Présentez vos idées : maquettes, croquis, même un simple dessin !
              </p>
              
              {/* Liste des fichiers sélectionnés */}
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 rounded-lg text-sm"
                      style={{ background: 'var(--bg-section)' }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{ color: 'var(--sage)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {file.name}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile(index)} 
                        className="text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Message d'erreur */}
            {status.message && status.type === "error" && (
              <div className="p-3 rounded-lg text-sm bg-red-100 text-red-700">
                {status.message}
              </div>
            )}
            
            {/* Bouton de soumission */}
            <button 
              type="submit" 
              className="btn-primary w-full" 
              disabled={loading}
            >
              {loading ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevisModal;
