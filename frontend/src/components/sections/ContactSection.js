/**
 * Section Contact
 * Formulaire de contact avec upload de fichiers
 */

import { Mail, Paperclip, FileText, X } from "lucide-react";
import useContactForm from "@/hooks/useContactForm";
import { CONFIG, ACCEPTED_FILE_TYPES } from "@/config/constants";

const ContactSection = () => {
  const {
    formData,
    files,
    status,
    loading,
    handleChange,
    handleFileChange,
    removeFile,
    handleSubmit
  } = useContactForm();

  return (
    <section id="contact" className="section" data-testid="contact-section">
      <div className="glow-orb glow-orb-1"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* En-tête de section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="section-title">
            Prêt à <span className="gradient-text">digitaliser</span> votre activité ?
          </h2>
          <p className="section-subtitle px-4">
            Contactez-nous pour discuter de votre projet
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Formulaire */}
          <div className="contact-form" data-testid="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 md:space-y-6">
                {/* Champ Nom */}
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    data-testid="contact-name"
                  />
                </div>
                
                {/* Champ Email */}
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Votre email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="contact-email"
                  />
                </div>
                
                {/* Champ Téléphone */}
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Votre téléphone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    data-testid="contact-phone"
                  />
                </div>
                
                {/* Champ Message */}
                <div>
                  <textarea
                    name="message"
                    placeholder="Décrivez votre projet..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    data-testid="contact-message"
                  ></textarea>
                </div>
                
                {/* Upload de fichiers */}
                <div>
                  <label 
                    className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--sage)]"
                    style={{ borderColor: 'var(--border-color)', background: 'var(--bg-section)' }}
                    data-testid="contact-file-upload"
                  >
                    <Paperclip size={20} style={{ color: 'var(--sage)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Joindre des fichiers (images, vidéos, documents...)
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
                    className="mt-2 text-sm" 
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Présentez vos idées : maquettes, croquis, même un simple dessin sur papier nous aide à comprendre votre vision !
                  </p>
                  
                  {/* Liste des fichiers sélectionnés */}
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ background: 'var(--bg-section)' }}
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={16} style={{ color: 'var(--sage)' }} />
                            <span 
                              className="text-sm" 
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {file.name}
                            </span>
                            <span 
                              className="text-xs" 
                              style={{ color: 'var(--text-muted)' }}
                            >
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Message de statut */}
                {status.message && (
                  <div 
                    className={`p-4 rounded-lg ${
                      status.type === "success" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}
                    data-testid="contact-status"
                  >
                    {status.message}
                  </div>
                )}
                
                {/* Bouton de soumission */}
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={loading}
                  data-testid="contact-submit"
                >
                  {loading ? "Envoi en cours..." : "Obtenir un devis gratuit"}
                </button>
              </div>
            </form>
          </div>
          
          {/* Informations de contact */}
          <div className="flex flex-col justify-center items-start">
            <div className="contact-info-item" data-testid="contact-email-info">
              <div className="contact-icon">
                <Mail size={24} color="white" />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Email
                </p>
                <p className="font-semibold text-lg">{CONFIG.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
