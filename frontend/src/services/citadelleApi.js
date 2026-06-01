/**
 * Service API — La Citadelle Numérique
 * Instance Axios dédiée, préfixée /api/citadelle/
 */

import axios from "axios";
import { CITADELLE_API_URL } from "@/config/citadelleConstants";

const citadelleApi = axios.create({
  baseURL: CITADELLE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur request : injecte le token Citadelle si présent
citadelleApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("citadelle_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur response : gestion 401 (token expiré)
citadelleApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("citadelle_token");
      localStorage.removeItem("citadelle_user");
      // Redirection vers la page de connexion Citadelle
      if (window.location.pathname.startsWith("/citadelle/espace-membre")) {
        window.location.href = "/citadelle/connexion";
      }
    }
    return Promise.reject(error);
  }
);

export default citadelleApi;
