/**
 * Page Profil - Espace Commercial
 */

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Building, Save } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

const CommercialProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    city: "",
    bio: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation - à connecter au backend plus tard
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSuccess(true);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Mon profil
      </h1>

      <div className="max-w-2xl">
        {/* En-tête profil */}
        <div 
          className="p-6 rounded-xl mb-6 flex flex-col sm:flex-row items-center gap-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: "var(--sage)" }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {formData.firstName && formData.lastName 
                ? `${formData.firstName} ${formData.lastName}`
                : user?.email
              }
            </h2>
            <p className="text-sm" style={{ color: "var(--sage)" }}>
              Partenaire Commercial
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div 
            className="p-6 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Informations personnelles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Prénom
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Votre prénom"
                    className="w-full pl-10"
                  />
                </div>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Nom
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Téléphone */}
            <div className="mb-4">
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
                />
              </div>
            </div>

            {/* Société */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Société (optionnel)
              </label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nom de votre société"
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Ville */}
            <div className="mb-4">
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
                />
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
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
              />
            </div>

            {/* Message succès */}
            {success && (
              <div className="p-3 rounded-lg text-sm bg-green-100 text-green-700 mb-4">
                Profil mis à jour avec succès !
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={loading}
            >
              <Save size={18} />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CommercialProfile;
