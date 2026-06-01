/**
 * Instance Axios centralisée - Le Syndicat du Code
 *
 * - Ajoute automatiquement le token JWT sur chaque requête
 * - Gère les erreurs 401 (token expiré) globalement
 * - baseURL configurée depuis les variables d'environnement
 */

import axios from "axios";
import { API_URL } from "@/config/constants";

const TOKEN_KEY = "syndicat_auth_token";

const api = axios.create({
  baseURL: API_URL
});

// Intercepteur requête : ajoute le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : gère les 401 globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/connexion")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("syndicat_user");
      window.location.href = "/connexion";
    }
    return Promise.reject(error);
  }
);

export default api;
