/**
 * Contexte d'authentification — La Citadelle Numérique
 * Totalement indépendant du contexte Syndicat du Code
 */

import { createContext, useContext, useState, useEffect } from "react";
import citadelleApi from "@/services/citadelleApi";

const CitadelleAuthContext = createContext(null);

const STORAGE_KEY = "citadelle_token";
const STORAGE_USER_KEY = "citadelle_user";

export const CitadelleAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydratation depuis localStorage au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (accessToken, userData) => {
    localStorage.setItem(STORAGE_KEY, accessToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);

    // Auto-inscription silencieuse à la newsletter (fire and forget — n'impacte pas la connexion)
    citadelleApi.post(
      "/newsletter/subscribe-member",
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).catch(() => {}); // Silencieux en cas d'erreur
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(merged));
    setUser(merged);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <CitadelleAuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </CitadelleAuthContext.Provider>
  );
};

export const useCitadelleAuth = () => {
  const ctx = useContext(CitadelleAuthContext);
  if (!ctx) throw new Error("useCitadelleAuth doit être utilisé dans CitadelleAuthProvider");
  return ctx;
};
