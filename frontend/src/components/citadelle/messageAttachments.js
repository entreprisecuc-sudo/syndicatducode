/**
 * Pièces jointes de messagerie — La Citadelle Numérique
 * Composants réutilisables : bouton d'ajout, aperçu avant envoi, rendu dans les bulles.
 * Formats : images (JPG, PNG, WebP) + PDF. Max 25 Mo, 5 fichiers par message.
 */

import { useRef, useState } from "react";
import { Paperclip, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import citadelleApi from "@/services/citadelleApi";
import {
  CITADELLE_COLORS,
  getListingImageUrl,
  isImageFile,
  getFileLabel,
} from "@/config/citadelleConstants";

export const MAX_ATTACHMENTS = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE = 25 * 1024 * 1024; // 25 Mo

export async function uploadAttachment(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await citadelleApi.post("/messages/upload-attachment", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { url, name, content_type, size }
}

// Bouton trombone + input caché. Téléverse jusqu'à MAX_ATTACHMENTS fichiers.
export function AttachmentButton({ attachments, setAttachments, disabled, color = CITADELLE_COLORS.gold }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const slots = MAX_ATTACHMENTS - attachments.length;
    if (slots <= 0) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} pièces jointes par message.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of files.slice(0, slots)) {
        if (f.size > MAX_SIZE) { toast.error(`« ${f.name} » dépasse 25 Mo.`); continue; }
        try { uploaded.push(await uploadAttachment(f)); }
        catch (err) { toast.error(err?.response?.data?.detail || `Échec de l'envoi de « ${f.name} ».`); }
      }
      if (uploaded.length) setAttachments([...attachments, ...uploaded]);
    } finally { setUploading(false); }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={onSelect} data-testid="attachment-input" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all hover:opacity-80"
        style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color }}
        title="Joindre un fichier (image ou PDF)"
        data-testid="attachment-btn"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
      </button>
    </>
  );
}

// Aperçu des pièces jointes en attente (avant envoi), avec suppression.
export function AttachmentPreview({ attachments, setAttachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="px-4 pt-3 flex flex-wrap gap-2" data-testid="attachment-preview">
      {attachments.map((a, i) => (
        <div key={i} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg text-xs"
          style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue, maxWidth: 200 }}>
          {isImageFile(a.url)
            ? <img src={getListingImageUrl(a.url)} alt={a.name} className="w-7 h-7 rounded object-cover" />
            : <FileText size={14} style={{ color: CITADELLE_COLORS.gold }} />}
          <span className="truncate">{a.name || getFileLabel(a.url)}</span>
          <button type="button" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
            className="p-0.5 rounded hover:opacity-70" title="Retirer" data-testid="attachment-remove">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Rendu des pièces jointes dans une bulle de message (images = miniatures cliquables, PDF = puce fichier).
export function MessageAttachments({ attachments, mine }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {attachments.map((a, i) => {
        const url = getListingImageUrl(a.url);
        if (isImageFile(a.url)) {
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" data-testid="attachment-image">
              <img src={url} alt={a.name || "pièce jointe"} className="rounded-lg object-cover"
                style={{ maxWidth: 160, maxHeight: 160, border: `1px solid ${CITADELLE_COLORS.border}` }} />
            </a>
          );
        }
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
            style={{
              background: mine ? "rgba(255,255,255,0.15)" : CITADELLE_COLORS.bg,
              border: `1px solid ${mine ? "rgba(255,255,255,0.25)" : CITADELLE_COLORS.border}`,
              color: mine ? "white" : CITADELLE_COLORS.blue,
            }}
            data-testid="attachment-file">
            <FileText size={14} /> <span className="truncate" style={{ maxWidth: 140 }}>{a.name || getFileLabel(a.url)}</span>
          </a>
        );
      })}
    </div>
  );
}
