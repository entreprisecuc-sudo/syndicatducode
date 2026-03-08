/**
 * Page Profil - Espace Développeur
 * Avec upload de photo de profil
 */

import { useState, useEffect, useRef } from "react";
import { Camera, X, Github, Linkedin, Globe, Save, Loader2, Building2, CreditCard, User } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Technologies disponibles
const TECHNOLOGIES = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js",
  "Python", "Django", "FastAPI", "PHP", "Laravel", "Ruby", "Rails",
  "Java", "Spring", "C#", ".NET", "Go", "Rust",
  "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes"
];

const DeveloperProfile = () => {
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
    pseudo: "",
    phone: "",
    city: "",
    bio: "",
    // Liens professionnels
    github: "",
    linkedin: "",
    portfolio: "",
    // Informations professionnelles
    experience: "",
    availability: "full",
    skills: [],
    // Informations entreprise
    company_name: "",
    siret: "",
    tva_number: "",
    // Informations bancaires
    iban: "",
    bic: "",
    // Choix d'affichage
    display_name_choice: "name"
  });

  // Charger le profil existant au montage
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/me`, {
        headers: getAuthHeaders()
      });
      
      const profile = response.data.profile || {};
      
      // Mettre à jour le formulaire avec les données existantes
      setFormData(prev => ({
        ...prev,
        // Informations personnelles
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        pseudo: profile.pseudo || "",
        phone: profile.phone || "",
        city: profile.city || "",
        bio: profile.bio || "",
        // Liens professionnels
        github: profile.github || "",
        linkedin: profile.linkedin || "",
        portfolio: profile.portfolio || "",
        // Informations professionnelles
        experience: profile.experience || "",
        availability: profile.availability || "full",
        skills: profile.skills || [],
        // Informations entreprise
        company_name: profile.company_name || "",
        siret: profile.siret || "",
        tva_number: profile.tva_number || "",
        // Informations bancaires
        iban: profile.iban || "",
        bic: profile.bic || "",
        // Choix d'affichage
        display_name_choice: profile.display_name_choice || "name"
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

  const toggleSkill = (skill) => {
    const skills = formData.skills.includes(skill)
      ? formData.skills.filter(s => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await axios.put(`${API_URL}/profile/me`, formData, {
        headers: getAuthHeaders()
      });
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
          const response = await axios.post(
            `${API_URL}/profile/photo`,
            { image_data: reader.result },
            { headers: getAuthHeaders() }
          );
          
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
      await axios.delete(`${API_URL}/profile/photo`, {
        headers: getAuthHeaders()
      });
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
                Partenaire Développeur
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
                  Pseudo / Nom d'artiste
                </label>
                <input
                  type="text"
                  name="pseudo"
                  value={formData.pseudo}
                  onChange={handleChange}
                  placeholder="Votre pseudo (optionnel)"
                  className="w-full"
                  data-testid="profile-pseudo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Afficher sur "Nos talents"
                </label>
                <select
                  name="display_name_choice"
                  value={formData.display_name_choice}
                  onChange={handleChange}
                  className="w-full"
                  data-testid="profile-display-choice"
                >
                  <option value="name">Mon prénom et nom</option>
                  <option value="pseudo">Mon pseudo</option>
                  <option value="company">Mon entreprise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="06 00 00 00 00"
                  className="w-full"
                  data-testid="profile-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Ville
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Votre ville"
                  className="w-full"
                  data-testid="profile-city"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Bio / Présentation
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Présentez-vous en quelques mots..."
                className="w-full"
                data-testid="profile-bio"
              />
            </div>
          </div>

          {/* Profil professionnel */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Profil professionnel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Années d'expérience
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full"
                  data-testid="profile-experience"
                >
                  <option value="">Sélectionner...</option>
                  <option value="0-2">0-2 ans</option>
                  <option value="2-5">2-5 ans</option>
                  <option value="5-10">5-10 ans</option>
                  <option value="10+">10+ ans</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Disponibilité
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full"
                  data-testid="profile-availability"
                >
                  <option value="full">Temps plein</option>
                  <option value="partial">Temps partiel</option>
                  <option value="weekends">Week-ends uniquement</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>
            </div>

            {/* Liens */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  GitHub
                </label>
                <div className="relative">
                  <Github size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full pl-10"
                    data-testid="profile-github"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  LinkedIn
                </label>
                <div className="relative">
                  <Linkedin size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-10"
                    data-testid="profile-linkedin"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Portfolio / Site web
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="https://monsite.com"
                    className="w-full pl-10"
                    data-testid="profile-portfolio"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div 
            className="p-6 rounded-xl mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Compétences techniques
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Sélectionnez les technologies que vous maîtrisez
            </p>

            <div className="flex flex-wrap gap-2" data-testid="skills-container">
              {TECHNOLOGIES.map((tech) => {
                const isSelected = formData.skills.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleSkill(tech)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected ? "text-white" : ""
                    }`}
                    style={{ 
                      background: isSelected ? "var(--sage)" : "var(--bg-section)",
                      color: isSelected ? "white" : "var(--text-secondary)"
                    }}
                    data-testid={`skill-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
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

export default DeveloperProfile;
