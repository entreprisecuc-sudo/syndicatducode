/**
 * Contexte de thème Admin
 * Gère le mode sombre/clair pour l'interface d'administration
 */

import { createContext, useContext, useState, useEffect } from "react";

// Clé localStorage
const ADMIN_THEME_KEY = "syndicat_admin_theme";

// Thèmes disponibles
export const ADMIN_THEMES = {
  dark: {
    name: "Sombre",
    bg: "#1a1a2e",
    bgSidebar: "#16213e",
    bgCard: "#16213e",
    bgSection: "#1f4068",
    bgHover: "#1f4068",
    border: "#1f4068",
    text: "#ffffff",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
    accent: "#e94560"
  },
  light: {
    name: "Clair",
    bg: "#f3f4f6",
    bgSidebar: "#ffffff",
    bgCard: "#ffffff",
    bgSection: "#f9fafb",
    bgHover: "#e5e7eb",
    border: "#e5e7eb",
    text: "#111827",
    textSecondary: "#4b5563",
    textMuted: "#9ca3af",
    accent: "#e94560"
  }
};

const AdminThemeContext = createContext();

export const AdminThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Récupérer le thème sauvegardé ou utiliser dark par défaut
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ADMIN_THEME_KEY);
      return saved && ADMIN_THEMES[saved] ? saved : "dark";
    }
    return "dark";
  });

  // Sauvegarder le thème dans localStorage
  useEffect(() => {
    localStorage.setItem(ADMIN_THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const currentTheme = ADMIN_THEMES[theme];

  return (
    <AdminThemeContext.Provider value={{ theme, currentTheme, toggleTheme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return context;
};

export default AdminThemeContext;
