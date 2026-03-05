/**
 * Hook personnalisé pour la gestion du formulaire de contact
 * Réutilisable entre DevisModal et ContactSection (DRY)
 */

import { useState } from "react";
import axios from "axios";
import { API_URL } from "@/config/constants";

/**
 * Hook pour gérer le formulaire de contact
 * @param {Function} onSuccess - Callback appelé après soumission réussie
 * @returns {Object} État et handlers du formulaire
 */
const useContactForm = (onSuccess = null) => {
  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  
  // État des fichiers joints
  const [files, setFiles] = useState([]);
  
  // État de l'UI
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Gère les changements des champs du formulaire
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Gère la sélection de fichiers
   */
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  /**
   * Supprime un fichier de la liste
   */
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  /**
   * Réinitialise le formulaire
   */
  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", message: "" });
    setFiles([]);
    setStatus({ type: "", message: "" });
    setSubmitted(false);
  };

  /**
   * Soumet le formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone || "");
      formDataToSend.append("message", formData.message);
      
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });

      await axios.post(`${API_URL}/contact`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setSubmitted(true);
      setStatus({ 
        type: "success", 
        message: "Demande envoyée ! Un membre du Syndicat va vous contacter au plus vite." 
      });
      
      // Callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: "Erreur lors de l'envoi. Veuillez réessayer." 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    // État
    formData,
    files,
    status,
    loading,
    submitted,
    // Handlers
    handleChange,
    handleFileChange,
    removeFile,
    handleSubmit,
    resetForm,
    // Setters pour cas spéciaux
    setSubmitted,
    setStatus
  };
};

export default useContactForm;
