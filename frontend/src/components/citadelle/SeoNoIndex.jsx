/**
 * SeoNoIndex — Empêche l'indexation des pages privées/techniques par les moteurs.
 * Émet la balise <meta name="robots" content="noindex, follow" />.
 * Réutilisable (DRY) sur les pages sans valeur SEO : connexion, inscription,
 * réinitialisation de mot de passe, callback OAuth, confirmation de paiement, etc.
 */
import { useEffect } from "react";

export const SeoNoIndex = () => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
    return () => {
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
    };
  }, []);
  return null;
};
