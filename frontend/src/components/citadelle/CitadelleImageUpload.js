/**
 * CitadelleImageUpload — Composant partagé
 * Gestion des images d'annonces : URL manuelle OU upload de fichier
 * Utilisé dans CitadelleCreateListing et CitadelleEditListing
 *
 * Props :
 *   images       : string[] — tableau des URLs (5 max)
 *   onChange     : (images: string[]) => void
 *   inputStyle   : objet style pour les inputs
 *   labelStyle   : objet style pour les labels
 */

import { useState, useRef } from "react";
import { Upload, Link2, X, Image as ImageIcon, Loader } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const MAX_IMAGES   = 5;
const MAX_SIZE_MB  = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Un slot image unique : toggle URL / Upload
 */
function ImageSlot({ index, value, onUpdate, inputStyle }) {
  const [mode, setMode]           = useState(value ? "url" : "url"); // "url" | "upload"
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const handleUrlChange = (e) => {
    setUploadError("");
    onUpdate(e.target.value);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Validation côté client
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Format non supporté. Utilisez JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Fichier trop lourd (max ${MAX_SIZE_MB} Mo).`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await citadelleApi.post("/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onUpdate(res.data.url);
      setMode("url"); // Repasse en mode URL pour afficher le chemin obtenu
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      // Reset l'input fichier pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    onUpdate("");
    setUploadError("");
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>
          Image {index + 1}
        </span>

        {/* Toggle URL / Upload */}
        <div className="flex gap-1 ml-auto">
          <button
            type="button"
            onClick={() => { setMode("url"); setUploadError(""); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={mode === "url"
              ? { background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }
              : { border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.textMuted }}
          >
            <Link2 size={11} /> URL
          </button>
          <button
            type="button"
            onClick={() => { setMode("upload"); setUploadError(""); fileInputRef.current?.click(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={mode === "upload"
              ? { background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }
              : { border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.textMuted }}
          >
            <Upload size={11} /> Fichier
          </button>
        </div>
      </div>

      {/* Input caché pour l'upload de fichier */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        data-testid={`image-file-input-${index}`}
      />

      {/* Prévisualisation si image présente */}
      {value && (
        <div className="flex items-center gap-3 mb-1.5 p-2 rounded-xl"
          style={{ background: "rgba(201,164,92,0.06)", border: `1px solid rgba(201,164,92,0.2)` }}>
          <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            <img
              src={value.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${value}` : value}
              alt={`Aperçu ${index + 1}`}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
            <span className="hidden items-center justify-center w-full h-full">
              <ImageIcon size={14} style={{ color: CITADELLE_COLORS.textMuted }} />
            </span>
          </div>
          <span className="flex-1 text-xs truncate" style={{ color: CITADELLE_COLORS.textMuted }}>
            {value.split("/").pop()}
          </span>
          <button type="button" onClick={handleClear}
            className="flex-shrink-0 p-1 rounded-lg transition-all hover:opacity-70"
            style={{ color: CITADELLE_COLORS.textMuted }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Zone de saisie URL */}
      <div className="relative">
        {uploading ? (
          <div className="w-full px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={inputStyle}>
            <Loader size={14} className="animate-spin flex-shrink-0" style={{ color: CITADELLE_COLORS.gold }} />
            <span style={{ color: CITADELLE_COLORS.textMuted }}>Upload en cours…</span>
          </div>
        ) : (
          <input
            value={value}
            onChange={handleUrlChange}
            placeholder={`https://exemple.com/image-${index + 1}.jpg`}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
            data-testid={`image-url-input-${index}`}
          />
        )}
      </div>

      {/* Erreur upload */}
      {uploadError && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#DC2626" }}>
          <X size={11} /> {uploadError}
        </p>
      )}
    </div>
  );
}

/**
 * Composant principal — grille de 5 slots images
 */
export function CitadelleImageUpload({ images, onChange, inputStyle, labelStyle }) {
  // S'assurer qu'on a toujours 5 slots
  const slots = [...images, "", "", "", "", ""].slice(0, MAX_IMAGES);

  const handleUpdate = (index, value) => {
    const updated = [...slots];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold" style={labelStyle}>
          Captures d'écran
        </label>
        <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
          {slots.filter(Boolean).length}/{MAX_IMAGES} — JPEG, PNG, WebP · max {MAX_SIZE_MB} Mo
        </span>
      </div>

      {slots.map((img, i) => (
        <ImageSlot
          key={i}
          index={i}
          value={img}
          onUpdate={(val) => handleUpdate(i, val)}
          inputStyle={inputStyle}
        />
      ))}
    </div>
  );
}
