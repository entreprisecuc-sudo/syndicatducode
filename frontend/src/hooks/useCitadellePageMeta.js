/**
 * Hook — Métadonnées des pages La Citadelle Numérique
 * Change le <title> et le favicon du navigateur au montage,
 * restaure les valeurs du Syndicat du Code au démontage.
 *
 * @param {string} [pageTitle] - Titre spécifique de la page (ex: "Connexion", "Annonces")
 *                               Titre par défaut si omis.
 */

import { useEffect } from "react";

const CITADELLE_FAVICON = "/citadelle-logo.png";
const CITADELLE_DEFAULT_TITLE = "La Citadelle Numérique | Marketplace d'actifs numériques";

export function useCitadellePageMeta(pageTitle) {
  useEffect(() => {
    // Sauvegarde des valeurs originales (Syndicat du Code)
    const originalTitle = document.title;
    const faviconElements = Array.from(document.querySelectorAll("link[rel*='icon']"));
    const originalFavicons = faviconElements.map(el => ({
      el,
      href: el.getAttribute("href"),
    }));

    // Application du titre Citadelle
    document.title = pageTitle
      ? `${pageTitle} | La Citadelle Numérique`
      : CITADELLE_DEFAULT_TITLE;

    // Remplacement des favicons par le logo Citadelle
    faviconElements.forEach(el => el.setAttribute("href", CITADELLE_FAVICON));

    // Restauration à la sortie des pages Citadelle
    return () => {
      document.title = originalTitle;
      originalFavicons.forEach(({ el, href }) => el.setAttribute("href", href));
    };
  }, [pageTitle]);
}
