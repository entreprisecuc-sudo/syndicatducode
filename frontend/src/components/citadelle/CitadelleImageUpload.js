/**
 * CitadelleImageUpload — Composant partagé
 * Zone de glisser-déposer visuelle pour les fichiers joints d'une annonce
 * (images, PDF, DOC — 5 max, 10 Mo). Option d'ajout par URL également.
 * Utilisé dans CitadelleCreateListing et CitadelleEditListing.
 *
 * Props :
 *   images     : string[] — tableau des URLs
 *   onChange   : (images: string[]) => void
 *   inputStyle : objet style pour les inputs
 *   labelStyle : objet style pour le label
 */

import { useState, useRef } from "react";
import { UploadCloud, Link2, X, Image as ImageIcon, Loader, FileText, Plus } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, getListingImageUrl, isImageFile } from "@/config/citadelleConstants";

const MAX_FILES   = 5;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function CitadelleImageUpload({ images, onChange, inputStyle, labelStyle }) {
  const filled = (images || []).filter(Boolean);
  const remaining = MAX_FILES - filled.length;

  const [dragActive, setDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef(null);

  const validate = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `« ${file.name} » : format non supporté (JPEG, PNG, WebP, GIF, PDF, DOC).`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `« ${file.name} » : fichier trop lourd (max ${MAX_SIZE_MB} Mo).`;
    }
    return null;
  };

  const uploadOne = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await citadelleApi.post("/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  };

  const handleFiles = async (fileList) => {
    setError("");
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (remaining <= 0) {
      setError(`Vous avez atteint le maximum de ${MAX_FILES} fichiers.`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`Seulement ${remaining} fichier(s) supplémentaire(s) possible(s).`);
    }
    for (const f of toUpload) {
      const err = validate(f);
      if (err) { setError(err); return; }
    }
    setUploadingCount(toUpload.length);
    try {
      const urls = await Promise.all(toUpload.map(uploadOne));
      onChange([...filled, ...urls]);
    } catch (e) {
      setError(e.response?.data?.detail || "Erreur lors de l'upload d'un fichier.");
    } finally {
      setUploadingCount(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx) => {
    setError("");
    onChange(filled.filter((_, i) => i !== idx));
  };

  const handleAddUrl = () => {
    const val = urlValue.trim();
    if (!val) return;
    if (remaining <= 0) { setError(`Vous avez atteint le maximum de ${MAX_FILES} fichiers.`); return; }
    onChange([...filled, val]);
    setUrlValue("");
    setShowUrl(false);
    setError("");
  };

  const disabled = remaining <= 0;

  return (
    <div data-testid="citadelle-file-upload">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold" style={labelStyle}>
          Fichiers joints
        </label>
        <span className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
          {filled.length}/{MAX_FILES} — Images, PDF, DOC · max {MAX_SIZE_MB} Mo
        </span>
      </div>

      {/* Zone de glisser-déposer */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={(e) => !disabled && handleDrop(e)}
        className="rounded-2xl px-6 py-8 text-center transition-all cursor-pointer"
        style={{
          border: `2px dashed ${dragActive ? CITADELLE_COLORS.gold : "rgba(201,164,92,0.35)"}`,
          background: dragActive ? "rgba(201,164,92,0.10)" : "rgba(201,164,92,0.04)",
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        data-testid="image-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="image-file-input"
        />

        {uploadingCount > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <Loader size={26} className="animate-spin" style={{ color: CITADELLE_COLORS.gold }} />
            <p className="text-sm font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>
              Envoi de {uploadingCount} fichier{uploadingCount > 1 ? "s" : ""}…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
              style={{ background: "rgba(201,164,92,0.12)" }}
            >
              <UploadCloud size={26} style={{ color: CITADELLE_COLORS.gold }} />
            </div>
            <p className="text-sm font-bold" style={{ color: CITADELLE_COLORS.night }}>
              {disabled ? "Maximum de fichiers atteint" : "Glissez-déposez vos fichiers ici"}
            </p>
            {!disabled && (
              <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                ou <span style={{ color: CITADELLE_COLORS.gold, fontWeight: 600 }}>cliquez pour parcourir</span> ·
                {" "}JPEG, PNG, WebP, GIF, PDF, DOC — {remaining} restant{remaining > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#DC2626" }} data-testid="upload-error">
          <X size={12} /> {error}
        </p>
      )}

      {/* Aperçus des fichiers joints */}
      {filled.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {filled.map((url, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden"
              style={{ border: `1px solid ${CITADELLE_COLORS.border}`, background: "#fff" }}
              data-testid={`file-preview-${i}`}
            >
              <div className="aspect-[4/3] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                {isImageFile(url) ? (
                  <>
                    <img
                      src={getListingImageUrl(url)}
                      alt={`Fichier ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    />
                    <span className="hidden items-center justify-center w-full h-full">
                      <ImageIcon size={22} style={{ color: CITADELLE_COLORS.textMuted }} />
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 px-2">
                    <FileText size={26} style={{ color: CITADELLE_COLORS.gold }} />
                    <span className="text-[10px] uppercase font-bold" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {(url.split(".").pop() || "doc").slice(0, 4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Badge image principale */}
              {i === 0 && (
                <span
                  className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                >
                  Principale
                </span>
              )}

              {/* Nom du fichier */}
              <p className="text-[11px] truncate px-2 py-1.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                {url.split("/").pop()}
              </p>

              {/* Bouton suppression */}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full transition-all hover:scale-110"
                style={{ background: "rgba(15,39,71,0.85)", color: "#fff" }}
                data-testid={`file-remove-${i}`}
                title="Retirer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ajout par URL (option repliée) */}
      {!disabled && (
        <div className="mt-3">
          {!showUrl ? (
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-80"
              style={{ color: CITADELLE_COLORS.gold }}
              data-testid="toggle-url-input"
            >
              <Link2 size={13} /> Ajouter plutôt via une URL
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
                placeholder="https://exemple.com/mon-image.jpg"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                data-testid="image-url-add-input"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-4 rounded-xl text-sm font-bold flex items-center gap-1 transition-all hover:opacity-90"
                style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                data-testid="image-url-add-btn"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
