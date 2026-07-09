/**
 * ShareBar — boutons de partage pour augmenter l'audience des articles.
 * Sans dépendance externe : liens de partage standards + copie du lien + partage natif (mobile).
 */
import { useState } from "react";
import { Share2, Mail, Link2, Check } from "lucide-react";

// Logos de marque en SVG inline (fiables, mono-couleur via currentColor)
const BRAND = {
  linkedin: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  facebook: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z",
  x: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65z",
  whatsapp: "M.05 24l1.69-6.16a11.87 11.87 0 0 1-1.6-5.95C.14 5.32 5.46 0 12 0a11.82 11.82 0 0 1 8.4 3.49A11.82 11.82 0 0 1 24 11.9c0 6.54-5.32 11.86-11.86 11.86a11.9 11.9 0 0 1-5.68-1.45L.05 24zm6.6-3.8c1.68.99 3.28 1.59 5.3 1.59 5.43 0 9.86-4.42 9.86-9.86 0-5.44-4.4-9.87-9.85-9.87a9.86 9.86 0 0 0-9.86 9.86c0 2.08.61 3.64 1.63 5.27l-.99 3.62 3.91-1.02zM17.9 14.6c-.07-.12-.27-.19-.56-.34-.29-.15-1.71-.85-1.98-.94-.27-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.44-.86-.76-1.44-1.7-1.6-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.56-.47-.48-.65-.49l-.56-.01c-.19 0-.51.07-.77.36-.27.29-1.01.99-1.01 2.41 0 1.42 1.04 2.79 1.18 2.98.15.19 2.04 3.11 4.94 4.36.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37z",
};

const BrandIcon = ({ d, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);

const BTN = "w-10 h-10 rounded-full inline-flex items-center justify-center border border-[#DDE3EA] text-[#0F2747] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A45C] hover:text-[#C9A45C] hover:shadow-md";

export function ShareBar({ url, title }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const networks = [
    { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "x", label: "X (Twitter)", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: "whatsapp", label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${t}%20${u}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponible : ignoré */ }
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* annulé */ }
    } else {
      copy();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="share-bar">
      <span className="text-sm font-semibold flex items-center gap-2 text-[#5F6672]">
        <Share2 size={16} className="text-[#C9A45C]" /> Partager :
      </span>
      <div className="flex items-center gap-2">
        {networks.map((n) => (
          <a key={n.key} href={n.href} target="_blank" rel="noopener noreferrer nofollow"
            title={n.label} aria-label={`Partager sur ${n.label}`} className={BTN} data-testid={`share-${n.key}`}>
            <BrandIcon d={BRAND[n.key]} />
          </a>
        ))}
        <a href={`mailto:?subject=${t}&body=${u}`} title="E-mail" aria-label="Partager par e-mail" className={BTN} data-testid="share-email">
          <Mail size={18} />
        </a>
        <button type="button" onClick={copy} title="Copier le lien" aria-label="Copier le lien" className={BTN} data-testid="share-copy">
          {copied ? <Check size={18} className="text-emerald-600" /> : <Link2 size={18} />}
        </button>
        <button type="button" onClick={nativeShare} title="Partager" aria-label="Partager" className={`${BTN} sm:hidden`} data-testid="share-native">
          <Share2 size={18} />
        </button>
      </div>
      {copied && <span className="text-xs text-emerald-600" data-testid="share-copied">Lien copié !</span>}
    </div>
  );
}

export default ShareBar;
