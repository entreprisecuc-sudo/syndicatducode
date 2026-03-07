/**
 * Modal de contact - Page membre publique
 * Formulaire pour contacter un développeur
 */

import { useState, useEffect } from "react";
import { 
  X, User, Mail, Phone, FileText, Send, 
  Loader2, CheckCircle, MessageCircle
} from "lucide-react";
import { API_URL } from "@/config/constants";
import axios from "axios";

export const ContactModal = ({ isOpen, onClose, memberId, memberName }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    sender_name: "",
    sender_email: "",
    sender_phone: "",
    subject: "",
    content: "",
    project_type: ""
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError("");
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_URL}/messages/send`, {
        developer_id: memberId,
        ...formData
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "#16213e" }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 flex items-center justify-between p-4 z-10"
          style={{ background: "#16213e", borderBottom: "1px solid #1f4068" }}
        >
          <h2 className="font-semibold text-lg text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-red-500" />
            Contacter {memberName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Message envoyé !
              </h3>
              <p className="text-gray-400 mb-6">
                Votre message a été transmis à {memberName}. 
                Il vous répondra dans les plus brefs délais.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium"
                style={{ background: "#e94560", color: "white" }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Votre nom *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      name="sender_name"
                      value={formData.sender_name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      required
                      className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Votre email *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      name="sender_email"
                      value={formData.sender_email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      required
                      className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      name="sender_phone"
                      value={formData.sender_phone}
                      onChange={handleChange}
                      placeholder="06 00 00 00 00"
                      className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                      style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                    />
                  </div>
                </div>
                
                {/* Type de projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Type de projet
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="site_web">Site web</option>
                    <option value="application">Application mobile</option>
                    <option value="logiciel">Logiciel / CRM / ERP</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="maintenance">Maintenance / TMA</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Sujet */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sujet *
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Objet de votre message"
                    required
                    className="w-full pl-10 px-3 py-2.5 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Votre message *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Décrivez votre projet ou votre demande..."
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                  style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                style={{ background: "#e94560", color: "white" }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
