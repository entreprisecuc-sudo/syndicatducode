/**
 * Composant de route protégée
 * Redirige vers la connexion si non authentifié
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Route protégée - nécessite une authentification
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Affiche un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sage)]"></div>
      </div>
    );
  }

  // Redirige vers la connexion si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Route nécessitant un choix de rôle
 * Redirige vers le choix du rôle si pas encore fait
 */
export const RoleRequiredRoute = ({ children }) => {
  const { isAuthenticated, loading, needsRoleChoice } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sage)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirige vers le choix du rôle si nécessaire
  if (needsRoleChoice()) {
    return <Navigate to="/choose-role" replace />;
  }

  return children;
};

/**
 * Route réservée à un rôle spécifique
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user, needsRoleChoice } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sage)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsRoleChoice()) {
    return <Navigate to="/choose-role" replace />;
  }

  // Vérifie le rôle
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Route publique - redirige vers le dashboard si déjà connecté
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, needsRoleChoice, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sage)]"></div>
      </div>
    );
  }

  // Redirige selon l'état de l'utilisateur
  if (isAuthenticated) {
    if (needsRoleChoice()) {
      return <Navigate to="/choose-role" replace />;
    }
    
    // Redirige vers l'espace approprié selon le rôle
    const redirectPath = user?.role === "commercial" 
      ? "/espace-commercial" 
      : user?.role === "developer"
        ? "/espace-developpeur"
        : "/dashboard";
    
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};
