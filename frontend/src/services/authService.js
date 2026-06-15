/**
 * Service d'authentification - Appels API
 */

import api from "./api";

// Clé de stockage du token
const TOKEN_KEY = "syndicat_auth_token";
const USER_KEY = "syndicat_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/** @deprecated Utiliser api.js directement — header ajouté automatiquement */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const register = async (email, password) => {
  const response = await api.post("/auth/register", { email, password });
  return response.data;
};

export const login = async (email, password, rememberMe = false) => {
  const response = await api.post("/auth/login", { email, password, remember_me: rememberMe });
  const { access_token, user } = response.data;
  setAuthData(access_token, user);
  return response.data;
};

export const logout = () => {
  clearAuthData();
};

export const chooseRole = async (role) => {
  const response = await api.post("/auth/choose-role", { role });
  const { access_token, user } = response.data;
  setAuthData(access_token, user);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    new_password: newPassword
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const isAuthenticated = () => {
  return !!getToken();
};
