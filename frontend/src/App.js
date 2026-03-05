/**
 * Application principale
 * Point d'entrée du routeur React
 */

import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import { PublicRoute } from "@/components/auth/ProtectedRoute";

// Pages publiques
import HomePage from "@/pages/HomePage";
import CGV from "@/pages/CGV";
import CGU from "@/pages/CGU";
import RGPD from "@/pages/RGPD";
import Rejoindre from "@/pages/Rejoindre";

// Pages d'authentification
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ChooseRolePage
} from "@/pages/auth";

// Composants de layout
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import DevisModal from "@/components/modals/DevisModal";

/**
 * Layout pour les pages légales et secondaires
 */
const PageLayout = ({ children }) => (
  <>
    <Navigation />
    {children}
    <Footer />
    <DevisModal />
  </>
);

/**
 * Composant App principal
 */
function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              {/* ============================================ */}
              {/* PAGES PUBLIQUES */}
              {/* ============================================ */}
              
              {/* Page d'accueil */}
              <Route path="/" element={<HomePage />} />
              
              {/* Pages légales */}
              <Route path="/cgv" element={<PageLayout><CGV /></PageLayout>} />
              <Route path="/cgu" element={<PageLayout><CGU /></PageLayout>} />
              <Route path="/rgpd" element={<PageLayout><RGPD /></PageLayout>} />
              
              {/* Recrutement */}
              <Route path="/rejoindre" element={<PageLayout><Rejoindre /></PageLayout>} />

              {/* ============================================ */}
              {/* PAGES D'AUTHENTIFICATION */}
              {/* ============================================ */}
              
              {/* Connexion - redirige si déjà connecté */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              
              {/* Inscription - redirige si déjà connecté */}
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } 
              />
              
              {/* Mot de passe oublié */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Réinitialisation mot de passe */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Choix du rôle (première connexion) */}
              <Route path="/choose-role" element={<ChooseRolePage />} />

              {/* ============================================ */}
              {/* ESPACES MEMBRES (à créer en Phase 3) */}
              {/* ============================================ */}
              
              {/* Placeholder - sera remplacé en Phase 3 */}
              <Route 
                path="/espace-commercial" 
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <p>Espace Commercial - À venir</p>
                  </div>
                } 
              />
              <Route 
                path="/espace-developpeur" 
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <p>Espace Développeur - À venir</p>
                  </div>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <p>Dashboard - À venir</p>
                  </div>
                } 
              />

            </Routes>
          </BrowserRouter>
        </div>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
