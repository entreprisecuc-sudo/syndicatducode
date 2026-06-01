/**
 * Page Profil - Espace Développeur
 * Avec upload de photo de profil
 */

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/constants";
import api from "@/services/api";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import CompanyInfoSection from "@/components/profile/CompanyInfoSection";
import BankingInfoSection from "@/components/profile/BankingInfoSection";
import PersonalInfoSection from "@/components/developer/profile/PersonalInfoSection";
import ProfessionalInfoSection from "@/components/developer/profile/ProfessionalInfoSection";
import SkillsSection from "@/components/developer/profile/SkillsSection";

const DeveloperProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", pseudo: "", phone: "", city: "", bio: "",
    github: "", linkedin: "", portfolio: "",
    experience: "", availability: "full", skills: [],
    company_name: "", siret: "", tva_number: "",
    iban: "", bic: "",
    display_name_choice: "name"
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      const profile = response.data.profile || {};
      setFormData(prev => ({
        ...prev,
        first_name:          profile.first_name          || "",
        last_name:           profile.last_name           || "",
        pseudo:              profile.pseudo              || "",
        phone:               profile.phone               || "",
        city:                profile.city                || "",
        bio:                 profile.bio                 || "",
        github:              profile.github              || "",
        linkedin:            profile.linkedin            || "",
        portfolio:           profile.portfolio           || "",
        experience:          profile.experience          || "",
        availability:        profile.availability        || "full",
        skills:              profile.skills              || [],
        company_name:        profile.company_name        || "",
        siret:               profile.siret               || "",
        tva_number:          profile.tva_number          || "",
        iban:                profile.iban                || "",
        bic:                 profile.bic                 || "",
        display_name_choice: profile.display_name_choice || "name"
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
          roleLabel="Partenaire Développeur"
          onPhotoUpdate={setPhotoUrl}
          onError={setError}
        />

        <form onSubmit={handleSubmit}>
          <PersonalInfoSection formData={formData} onChange={handleChange} />
          <ProfessionalInfoSection formData={formData} onChange={handleChange} />
          <CompanyInfoSection
            formData={formData}
            onChange={handleChange}
            subtitle="Ces informations sont nécessaires pour la facturation et les paiements"
          />
          <BankingInfoSection
            formData={formData}
            onChange={handleChange}
            subtitle="Pour recevoir les paiements de vos missions"
          />
          <SkillsSection selectedSkills={formData.skills} onToggle={toggleSkill} />

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

export default DeveloperProfile;
