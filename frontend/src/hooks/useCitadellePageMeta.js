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
    // Favicon Citadelle (toujours appliqué)
    const faviconElements = Array.from(document.querySelectorAll("link[rel*='icon']"));
    const originalFavicons = faviconElements.map(el => ({
      el,
      href: el.getAttribute("href"),
    }));
    faviconElements.forEach(el => el.setAttribute("href", CITADELLE_FAVICON));

    // Titre : uniquement si pageTitle fourni. Sinon, on laisse React Helmet
    // (ou le SEO propre à la page) gérer le <title>, sans l'écraser.
    let originalTitle;
    if (pageTitle) {
      originalTitle = document.title;
      document.title = `${pageTitle} | La Citadelle Numérique`;
    }

    return () => {
      if (pageTitle && originalTitle !== undefined) {
        document.title = originalTitle;
      }
      originalFavicons.forEach(({ el, href }) => el.setAttribute("href", href));
    };
  }, [pageTitle]);
}
