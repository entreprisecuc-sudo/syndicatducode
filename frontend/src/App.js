/**
 * Application principale
 * Point d'entrée du routeur React
 */

import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminThemeProvider } from "@/context/AdminThemeContext";
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
import ProjectRoom from "@/pages/developer/ProjectRoom";

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
  AdminPortfolioValidation,
  AdminUserDetail,
  AdminBruteForce,
  AdminBackup
} from "@/pages/admin";
import AdminProjectRooms from "@/pages/admin/AdminProjectRooms";
import AdminProjectRoomDetail from "@/pages/admin/AdminProjectRoomDetail";
import AdminCitadelle from "@/pages/admin/AdminCitadelle";

// Pages La Citadelle Numérique — Socle
import CitadelleHome from "@/pages/citadelle/CitadelleHome";
import CitadelleServices from "@/pages/citadelle/CitadelleServices";
import CitadelleLogin from "@/pages/citadelle/CitadelleLogin";
import CitadelleRegister from "@/pages/citadelle/CitadelleRegister";
import CitadelleForgotPassword from "@/pages/citadelle/CitadelleForgotPassword";
import CitadelleResetPassword from "@/pages/citadelle/CitadelleResetPassword";
import CitadelleDashboard from "@/pages/citadelle/member/CitadelleDashboard";
import { CitadelleAuthProvider } from "@/context/CitadelleAuthContext";

// Pages La Citadelle Numérique — Phase B (Marketplace Annonces)
import CitadelleListings from "@/pages/citadelle/CitadelleListings";
import CitadelleListingDetail from "@/pages/citadelle/CitadelleListingDetail";
import CitadelleMyListings from "@/pages/citadelle/member/CitadelleMyListings";
import CitadelleCreateListing from "@/pages/citadelle/member/CitadelleCreateListing";
import CitadelleEditListing from "@/pages/citadelle/member/CitadelleEditListing";
import CitadelleProfile from "@/pages/citadelle/member/CitadelleProfile";
import CitadelleMyTransactions from "@/pages/citadelle/member/CitadelleMyTransactions";
import CitadelleTransactionDetail from "@/pages/citadelle/member/CitadelleTransactionDetail";
import CitadelleMyMessages from "@/pages/citadelle/member/CitadelleMyMessages";
import CitadelleConversationDetail from "@/pages/citadelle/member/CitadelleConversationDetail";
import AdminCitadelleListings from "@/pages/admin/AdminCitadelleListings";
import AdminCitadelleTransactions from "@/pages/admin/AdminCitadelleTransactions";
import AdminCitadelleServices from "@/pages/admin/AdminCitadelleServices";

// Pages partagées (tous les membres)
import MemberPartners from "@/pages/shared/MemberPartners";
import MemberBilling from "@/pages/shared/MemberBilling";

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
      <CitadelleAuthProvider>
      <ModalProvider>
        <AdminThemeProvider>
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
              <Route 
                path="/espace-commercial/facturation" 
                element={<RoleRoute allowedRoles={["commercial"]}><MemberBilling /></RoleRoute>} 
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
              <Route 
                path="/espace-developpeur/projet/:roomId" 
                element={<RoleRoute allowedRoles={["developer"]}><ProjectRoom /></RoleRoute>} 
              />
              <Route 
                path="/espace-developpeur/facturation" 
                element={<RoleRoute allowedRoles={["developer"]}><MemberBilling /></RoleRoute>} 
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
                path="/syndicat-admin/utilisateurs/:userId" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminUserDetail /></RoleRoute>} 
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
                path="/syndicat-admin/espaces-projets" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminProjectRooms /></RoleRoute>} 
              />
              <Route 
                path="/syndicat-admin/espace-projet/:roomId" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminProjectRoomDetail /></RoleRoute>} 
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
              <Route
                path="/syndicat-admin/securite"
                element={<RoleRoute allowedRoles={["admin"]}><AdminBruteForce /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/sauvegarde"
                element={<RoleRoute allowedRoles={["admin"]}><AdminBackup /></RoleRoute>}
              />

              {/* ============================================ */}
              {/* LA CITADELLE NUMÉRIQUE */}
              {/* ============================================ */}

              {/* Citadelle — Pages publiques */}
              <Route path="/citadelle" element={<CitadelleHome />} />
              <Route path="/citadelle/connexion" element={<CitadelleLogin />} />
              <Route path="/citadelle/inscription" element={<CitadelleRegister />} />
              <Route path="/citadelle/mot-de-passe-oublie" element={<CitadelleForgotPassword />} />
              <Route path="/citadelle/reinitialiser-mot-de-passe" element={<CitadelleResetPassword />} />
              <Route path="/citadelle/annonces" element={<CitadelleListings />} />
              <Route path="/citadelle/annonces/:slug" element={<CitadelleListingDetail />} />
              <Route path="/citadelle/services" element={<CitadelleServices />} />

              {/* Citadelle — Espace membre (routes spécifiques avant le wildcard) */}
              <Route path="/citadelle/espace-membre/mes-annonces/creer" element={<CitadelleCreateListing />} />
              <Route path="/citadelle/espace-membre/mes-annonces/:id/modifier" element={<CitadelleEditListing />} />
              <Route path="/citadelle/espace-membre/mes-annonces" element={<CitadelleMyListings />} />
              <Route path="/citadelle/espace-membre/transactions/:id" element={<CitadelleTransactionDetail />} />
              <Route path="/citadelle/espace-membre/transactions" element={<CitadelleMyTransactions />} />
              <Route path="/citadelle/espace-membre/messages/:id" element={<CitadelleConversationDetail />} />
              <Route path="/citadelle/espace-membre/messages" element={<CitadelleMyMessages />} />
              <Route path="/citadelle/espace-membre/profil" element={<CitadelleProfile />} />
              <Route path="/citadelle/espace-membre" element={<CitadelleDashboard />} />
              <Route path="/citadelle/espace-membre/*" element={<CitadelleDashboard />} />

              {/* Admin Citadelle */}
              <Route
                path="/syndicat-admin/citadelle"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelle /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/annonces"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleListings /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/transactions"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleTransactions /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/services"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleServices /></RoleRoute>}
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
        </AdminThemeProvider>
      </ModalProvider>
      </CitadelleAuthProvider>
    </AuthProvider>
  );
}

export default App;
