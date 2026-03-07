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
import MembersPage from "@/pages/MembersPage";
import MemberDetailPage from "@/pages/MemberDetailPage";

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
  DeveloperOpportunities,
  DeveloperProjects,
  DeveloperSubscription,
  DeveloperBook,
  DeveloperMessages
} from "@/pages/developer";

// Pages Admin
import {
  AdminDashboard,
  AdminUsers,
  AdminContacts,
  AdminLogs,
  AdminProjects,
  AdminProjectDetail,
  AdminAnnouncements,
  AdminAlerts,
  AdminSubscriptions,
  AdminPartners,
  AdminPortfolioValidation
} from "@/pages/admin";

// Page partagée (tous les membres)
import MemberPartners from "@/pages/shared/MemberPartners";

// Composants de layout
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import DevisModal from "@/components/modals/DevisModal";
import GlobalAlerts from "@/components/GlobalAlerts";

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
            {/* Alertes globales (bannières et popups) */}
            <GlobalAlerts />
            
            <Routes>
              {/* ============================================ */}
              {/* PAGES PUBLIQUES */}
              {/* ============================================ */}
              
              <Route path="/" element={<HomePage />} />
              <Route path="/cgv" element={<PageLayout><CGV /></PageLayout>} />
              <Route path="/cgu" element={<PageLayout><CGU /></PageLayout>} />
              <Route path="/rgpd" element={<PageLayout><RGPD /></PageLayout>} />
              <Route path="/rejoindre" element={<PageLayout><Rejoindre /></PageLayout>} />
              <Route path="/membres" element={<MembersPage />} />
              <Route path="/membres/:memberId" element={<MemberDetailPage />} />

              {/* ============================================ */}
              {/* PAGES D'AUTHENTIFICATION */}
              {/* ============================================ */}
              
              {/* Routes françaises (principales) */}
              <Route path="/connexion" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/inscription" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
              <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
              <Route path="/choisir-role" element={<ChooseRolePage />} />
              
              {/* Routes anglaises (rétrocompatibilité) */}
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
              <Route 
                path="/espace-commercial/partenaires" 
                element={<RoleRoute allowedRoles={["commercial"]}><MemberPartners /></RoleRoute>} 
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
              <Route 
                path="/espace-developpeur/projets" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperProjects /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/abonnement" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperSubscription /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/book" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperBook /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/messages" 
                element={<RoleRoute allowedRoles={["developer"]}><DeveloperMessages /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/partenaires" 
                element={<RoleRoute allowedRoles={["developer"]}><MemberPartners /></RoleRoute>} 
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
              <Route 
                path="/syndicat-admin/projets" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminProjects /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/projets/:projectId" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminProjectDetail /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/annonces" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminAnnouncements /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/alertes" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminAlerts /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/abonnements" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminSubscriptions /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/partenaires" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminPartners /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/validation-books" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminPortfolioValidation /></RoleRoute>} 
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
