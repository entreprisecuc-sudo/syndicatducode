/**
 * Application principale
 * Point d'entrée du routeur React
 */

import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import { PublicRoute, RoleRoute } from "@/components/auth/ProtectedRoute";

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

// Pages Espace Commercial
import {
  CommercialDashboard,
  CommercialProfile,
  CommercialDocuments,
  CommercialAffaires
} from "@/pages/commercial";

// Pages Espace Développeur
import {
  DeveloperDashboard,
  DeveloperProfile,
  DeveloperDocuments,
  DeveloperOpportunities
} from "@/pages/developer";

// Pages Admin
import {
  AdminDashboard,
  AdminUsers,
  AdminContacts,
  AdminLogs
} from "@/pages/admin";

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
              
              <Route path="/" element={<HomePage />} />
              <Route path="/cgv" element={<PageLayout><CGV /></PageLayout>} />
              <Route path="/cgu" element={<PageLayout><CGU /></PageLayout>} />
              <Route path="/rgpd" element={<PageLayout><RGPD /></PageLayout>} />
              <Route path="/rejoindre" element={<PageLayout><Rejoindre /></PageLayout>} />

              {/* ============================================ */}
              {/* PAGES D'AUTHENTIFICATION */}
              {/* ============================================ */}
              
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/choose-role" element={<ChooseRolePage />} />

              {/* ============================================ */}
              {/* ESPACE COMMERCIAL */}
              {/* ============================================ */}
              
              <Route 
                path="/espace-commercial" 
                element={<RoleRoute allowedRoles={["commercial"]}><CommercialDashboard /></RoleRoute>} 
              />
              <Route 
                path="/espace-commercial/profil" 
                element={<RoleRoute allowedRoles={["commercial"]}><CommercialProfile /></RoleRoute>} 
              />
              <Route 
                path="/espace-commercial/documents" 
                element={<RoleRoute allowedRoles={["commercial"]}><CommercialDocuments /></RoleRoute>} 
              />
              <Route 
                path="/espace-commercial/affaires" 
                element={<RoleRoute allowedRoles={["commercial"]}><CommercialAffaires /></RoleRoute>} 
              />

              {/* ============================================ */}
              {/* ESPACE DÉVELOPPEUR */}
              {/* ============================================ */}
              
              <Route 
                path="/espace-developpeur" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperDashboard /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/profil" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperProfile /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/documents" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperDocuments /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/opportunites" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperOpportunities /></RoleRoute>} 
              />

              {/* ============================================ */}
              {/* BACK-OFFICE ADMIN (URL secrète) */}
              {/* ============================================ */}
              
              <Route 
                path="/syndicat-admin" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/utilisateurs" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminUsers /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/contacts" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminContacts /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/logs" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminLogs /></RoleRoute>} 
              />

              {/* ============================================ */}
              {/* REDIRECTION DASHBOARD GÉNÉRIQUE */}
              {/* ============================================ */}
              
              <Route 
                path="/dashboard" 
                element={<RoleRoute allowedRoles={["commercial", "developer", "admin"]}><CommercialDashboard /></RoleRoute>} 
              />

            </Routes>
          </BrowserRouter>
        </div>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
