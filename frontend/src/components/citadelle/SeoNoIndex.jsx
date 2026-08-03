/**
 * SeoNoIndex — Empêche l'indexation des pages privées/techniques par les moteurs.
 * Émet la balise <meta name="robots" content="noindex, follow" />.
 * Réutilisable (DRY) sur les pages sans valeur SEO : connexion, inscription,
 * réinitialisation de mot de passe, callback OAuth, confirmation de paiement, etc.
 */
import { Helmet } from "react-helmet-async";

export const SeoNoIndex = () => (
  <Helmet>
    <meta name="robots" content="noindex, follow" />
  </Helmet>
);
