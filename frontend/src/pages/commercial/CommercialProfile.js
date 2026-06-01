/**
 * Page Profil - Espace Commercial
 * Avec upload de photo et informations professionnelles
 */

import { useState, useEffect } from "react";
import { Phone, MapPin, Save, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/constants";
import api from "@/services/api";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import CompanyInfoSection from "@/components/profile/CompanyInfoSection";
import BankingInfoSection from "@/components/profile/BankingInfoSection";

const CommercialProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", phone: "", city: "", bio: "",
    company_name: "", siret: "", tva_number: "",
    iban: "", bic: ""
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      const profile = response.data.profile || {};
      setFormData(prev => ({
        ...prev,
        first_name:   profile.first_name   || "",
        last_name:    profile.last_name    || "",
        phone:        profile.phone        || "",
        city:         profile.city         || "",
        bio:          profile.bio          || "",
        company_name: profile.company_name || "",
        siret:        profile.siret        || "",
        tva_number:   profile.tva_number   || "",
        iban:         profile.iban         || "",
        bic:          profile.bic          || ""
      }));
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
      await api.put('/profile/me', formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

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
      <h1 className="text-xl font-bold mb-6 lg:hidden" style={{ color: "var(--text-primary)" }}>
        Mon profil
      </h1>

      <div className="max-w-3xl">
        <ProfilePhotoUpload
          photoUrl={photoUrl}
          firstName={formData.first_name}
          lastName={formData.last_name}
          userEmail={user?.email}
          roleLabel="Partenaire Commercial"
          onPhotoUpdate={setPhotoUrl}
          onError={setError}
        />

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

          <CompanyInfoSection
            formData={formData}
            onChange={handleChange}
            subtitle="Ces informations sont nécessaires pour la facturation et les paiements de commissions"
          />
          <BankingInfoSection
            formData={formData}
            onChange={handleChange}
            subtitle="Pour recevoir vos commissions sur les projets apportés"
          />

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

          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2"
            disabled={loading}
            data-testid="save-profile-btn"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CommercialProfile;
