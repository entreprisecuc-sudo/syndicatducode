/**
 * Authentification Google personnalisée — La Citadelle Numérique.
 * Redirige vers l'écran de consentement Google (OAuth 2.0, flux code d'autorisation).
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */

export const GOOGLE_REDIRECT_PATH = "/auth/google";

export function startCitadelleGoogleLogin() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const redirectUri = window.location.origin + GOOGLE_REDIRECT_PATH;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
