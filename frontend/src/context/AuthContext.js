/**
 * Contexte d'authentification
 * Gère l'état de connexion global de l'application
 */

import { createContext, useContext, useState, useEffect } from "react";
import { 
  getStoredUser, 
  getToken, 
  logout as logoutService,
  getCurrentUser,
  setAuthData
} from "@/services/authService";

// Création du contexte
const AuthContext = createContext(null);

/**
 * Hook personnalisé pour accéder au contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

/**
 * Provider d'authentification
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifie l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const storedUser = getStoredUser();
      
      if (token && storedUser) {
        try {
          // Vérifie que le token est encore valide
          const freshUser = await getCurrentUser();
          setUser(freshUser);
          setAuthData(token, freshUser);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalide, on déconnecte
          logoutService();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Met à jour l'utilisateur après connexion
   */
  const loginUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  /**
   * Met à jour l'utilisateur après choix du rôle
   */
  const updateUser = (userData) => {
    setUser(userData);
  };

  /**
   * Déconnexion
   */
  const logout = () => {
    logoutService();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Vérifie si l'utilisateur doit choisir un rôle
   */
  const needsRoleChoice = () => {
    return user && !user.role;
  };

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    loginUser,
    updateUser,
    logout,
    needsRoleChoice,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
