/**
 * Service d'authentification - Appels API
 */

import axios from "axios";
import { API_URL } from "@/config/constants";

// Clé de stockage du token
const TOKEN_KEY = "syndicat_auth_token";
const USER_KEY = "syndicat_user";

/**
 * Récupère le token stocké
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Récupère l'utilisateur stocké
 */
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Stocke les données d'authentification
 */
export const setAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Supprime les données d'authentification
 */
export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Configure axios avec le token d'authentification
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    email,
    password
  });
  return response.data;
};

/**
 * Connexion utilisateur
 */
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  
  const { access_token, user } = response.data;
  setAuthData(access_token, user);
  
  return response.data;
};

/**
 * Déconnexion
 */
export const logout = () => {
  clearAuthData();
};

/**
 * Choix du rôle
 */
export const chooseRole = async (role) => {
  const response = await axios.post(
    `${API_URL}/auth/choose-role`,
    { role },
    { headers: getAuthHeaders() }
  );
  
  const { access_token, user } = response.data;
  setAuthData(access_token, user);
  
  return response.data;
};

/**
 * Demande de réinitialisation de mot de passe
 */
export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, {
    email
  });
  return response.data;
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (token, newPassword) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, {
    token,
    new_password: newPassword
  });
  return response.data;
};

/**
 * Récupère les infos de l'utilisateur connecté
 */
export const getCurrentUser = async () => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = () => {
  return !!getToken();
};
