/**
 * Contexte pour la gestion du modal de devis
 * Permet d'ouvrir/fermer le modal depuis n'importe quel composant
 */

import { createContext, useContext, useState } from "react";

// Création du contexte
const ModalContext = createContext();

/**
 * Hook personnalisé pour accéder au contexte du modal
 * @returns {Object} { isModalOpen, openModal, closeModal }
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal doit être utilisé dans un ModalProvider");
  }
  return context;
};

/**
 * Provider pour le contexte du modal
 * Enveloppe l'application pour fournir l'état du modal
 */
export const ModalProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <ModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalContext;
