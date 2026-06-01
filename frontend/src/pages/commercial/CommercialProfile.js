/**
 * Page Profil - Espace Commercial
 * Avec upload de photo et informations professionnelles
 */

import { useState, useEffect, useRef } from "react";
import { Camera, X, Phone, MapPin, Building2, Save, Loader2, CreditCard } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/constants";
import api from "@/services/api";

const CommercialProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [photoUrl, setPhotoUrl] = useState(null);
  const [formData, setFormData] = useState({
    // Informations personnelles
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    bio: "",
    // Informations entreprise
    company_name: "",
    siret: "",
    tva_number: "",
    // Informations bancaires
    iban: "",
    bic: ""
  });

  // Charger le profil existant au montage
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      
      const profile = response.data.profile || {};
      
      // Mettre à jour le formulaire avec les données existantes
      setFormData(prev => ({
        ...prev,
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        bio: profile.bio || "",
        company_name: profile.company_name || "",
        siret: profile.siret || "",
        tva_number: profile.tva_number || "",
        iban: profile.iban || "",
        bic: profile.bic || ""
      }));
      
      // Photo de profil
      if (profile.photo_url) {
        setPhotoUrl(`${API_URL}${profile.photo_url}`);
      }
      
    } catch (err) {
      console.error("Erreur chargement profil:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await api.put(`/profile/me`, formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Gestion de l'upload de photo
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, PNG ou WEBP.");
      return;
    }

    // Vérifier la taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploadingPhoto(true);
    setError("");

    try {
      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const response = await api.post(`/profile/photo`,  { image_data: reader.result });
          
          // Mettre à jour l'URL de la photo avec timestamp pour éviter le cache
          setPhotoUrl(`${API_URL}${response.data.photo_url}?t=${Date.now()}`);
          setSuccess(true);
        } catch (err) {
          setError(err.response?.data?.detail || "Erreur lors de l'upload");
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Erreur lors de la lecture du fichier");
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Supprimer votre photo de profil ?")) return;

    try {
      await api.delete('/profile/photo');
      setPhotoUrl(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  // Affichage du chargement initial
  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--sage)" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Mon profil
      </h1>

      <div className="max-w-3xl">
        {/* En-tête profil avec photo */}
        <div 
          className="p-6 rounded-xl mb-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Zone photo de profil */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                data-testid="profile-photo-input"
              />
              
              {/* Photo ou placeholder */}
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer transition-opacity group-hover:opacity-80"
                style={{ background: photoUrl ? "transparent" : "var(--sage)" }}
                onClick={handlePhotoClick}
                data-testid="profile-photo-container"
              >
                {uploadingPhoto ? (
                  <Loader2 className="animate-spin" size={32} />
                ) : photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.email?.charAt(0).toUpperCase()
                )}
              </div>

              {/* Bouton caméra (overlay) */}
              <button
                type="button"
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 p-1.5 rounded-full text-white transition-colors"
                style={{ background: "var(--sage)" }}
                title="Changer la photo"
                data-testid="change-photo-btn"
              >
                <Camera size={16} />
              </button>

              {/* Bouton supprimer (si photo existe) */}
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer la photo"
                  data-testid="delete-photo-btn"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Infos utilisateur */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {formData.first_name && formData.last_name 
                  ? `${formData.first_name} ${formData.last_name}`
                  : user?.email
                }
              </h2>
              <p className="text-sm" style={{ color: "var(--sage)" }}>
                Partenaire Commercial
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {user?.email}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Cliquez sur la photo pour la modifier (JPG, PNG, WEBP - max 5 Mo)
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informations personnelles */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Informations personnelles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Prénom
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                  className="w-full"
                  data-testid="profile-firstname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Nom
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="w-full"
                  data-testid="profile-lastname"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Téléphone
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="06 00 00 00 00"
                    className="w-full pl-10"
                    data-testid="profile-phone"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Ville
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Votre ville"
                    className="w-full pl-10"
                    data-testid="profile-city"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Présentation (optionnel)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Quelques mots sur vous et votre activité..."
                className="w-full"
                data-testid="profile-bio"
              />
            </div>
          </div>

          {/* Informations Entreprise */}
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
              Ces informations sont nécessaires pour la facturation et les paiements de commissions
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                onChange={handleChange}
                placeholder="FR12345678901 (optionnel)"
                className="w-full"
                data-testid="profile-tva"
              />
            </div>
          </div>

          {/* Informations Bancaires */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} style={{ color: "var(--sage)" }} />
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Informations Bancaires
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Pour recevoir vos commissions sur les projets apportés
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  className="w-full"
                  data-testid="profile-iban"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  name="bic"
                  value={formData.bic}
                  onChange={handleChange}
                  placeholder="BNPAFRPP"
                  className="w-full"
                  data-testid="profile-bic"
                />
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              🔒 Ces informations sont stockées de manière sécurisée et utilisées uniquement pour les virements.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-100 text-red-700 mb-4" data-testid="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-lg text-sm bg-green-100 text-green-700 mb-4" data-testid="success-message">
              Profil mis à jour avec succès !
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2"
            disabled={loading}
            data-testid="save-profile-btn"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CommercialProfile;
