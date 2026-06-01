/**
 * Composant upload de photo de profil
 * Partagé entre DeveloperProfile et CommercialProfile
 */

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { API_URL } from "@/config/constants";
import api from "@/services/api";

const ProfilePhotoUpload = ({ photoUrl, firstName, lastName, userEmail, roleLabel, onPhotoUpdate, onError }) => {
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      onError("Format non supporté. Utilisez JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const response = await api.post('/profile/photo', { image_data: reader.result });
          onPhotoUpdate(`${API_URL}${response.data.photo_url}?t=${Date.now()}`);
        } catch (err) {
          onError(err.response?.data?.detail || "Erreur lors de l'upload");
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      onError("Erreur lors de la lecture du fichier");
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Supprimer votre photo de profil ?")) return;
    try {
      await api.delete('/profile/photo');
      onPhotoUpdate(null);
    } catch (err) {
      onError(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : userEmail;

  return (
    <div
      className="p-6 rounded-xl mb-6"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            data-testid="profile-photo-input"
          />

          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer transition-opacity group-hover:opacity-80"
            style={{ background: photoUrl ? "transparent" : "var(--sage)" }}
            onClick={handlePhotoClick}
            data-testid="profile-photo-container"
          >
            {uploadingPhoto ? (
              <Loader2 className="animate-spin" size={32} />
            ) : photoUrl ? (
              <img src={photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              userEmail?.charAt(0).toUpperCase()
            )}
          </div>

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

        <div className="text-center sm:text-left flex-1">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {displayName}
          </h2>
          <p className="text-sm" style={{ color: "var(--sage)" }}>{roleLabel}</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Cliquez sur la photo pour la modifier (JPG, PNG, WEBP - max 5 Mo)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload;
