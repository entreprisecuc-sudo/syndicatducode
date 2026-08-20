/**
 * Application principale
 * Point d'entrée du routeur React
 */

import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminThemeProvider } from "@/context/AdminThemeContext";
import { PublicRoute, RoleRoute } from "@/components/auth/ProtectedRoute";
import AnalyticsTracker from "@/components/AnalyticsTracker";

// Scroll en haut à chaque changement de route
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// La Citadelle Numérique doit toujours être servie sur lacitadellenumerique.fr
// Redirige automatiquement si un user arrive sur syndicatducode.fr/citadelle/*
function DomainGuard() {
  const { pathname } = useLocation();
  useEffect(() => {
    const hostname = window.location.hostname;
    const isSyndicatDomain = hostname === 'syndicatducode.fr' || hostname === 'www.syndicatducode.fr';
    if (isSyndicatDomain && pathname.startsWith('/citadelle')) {
      window.location.replace('https://www.lacitadellenumerique.fr' + pathname + window.location.search);
    }
  }, [pathname]);
  return null;
}

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
import CitadelleGoogleCallback from "@/pages/citadelle/CitadelleGoogleCallback";
import CitadelleRegister from "@/pages/citadelle/CitadelleRegister";
import CitadelleForgotPassword from "@/pages/citadelle/CitadelleForgotPassword";
import CitadelleResetPassword from "@/pages/citadelle/CitadelleResetPassword";
import CitadelleDashboard from "@/pages/citadelle/member/CitadelleDashboard";
import { CitadelleAuthProvider } from "@/context/CitadelleAuthContext";

// Pages La Citadelle Numérique — Phase B (Marketplace Annonces)
import CitadelleListings from "@/pages/citadelle/CitadelleListings";
// Lazy loading des 4 composants les plus lourds (économise ~160KB JS au chargement initial)
const CitadelleListingDetail    = lazy(() => import("@/pages/citadelle/CitadelleListingDetail"));
const CitadelleTransactionDetail = lazy(() => import("@/pages/citadelle/member/CitadelleTransactionDetail"));
const CitadelleProfile          = lazy(() => import("@/pages/citadelle/member/CitadelleProfile"));
const CitadelleEstimation       = lazy(() => import("@/pages/citadelle/CitadelleEstimation"));
import CitadelleMyListings from "@/pages/citadelle/member/CitadelleMyListings";
import CitadelleCreateListing from "@/pages/citadelle/member/CitadelleCreateListing";
import CitadelleEditListing from "@/pages/citadelle/member/CitadelleEditListing";
import CitadelleMyTransactions from "@/pages/citadelle/member/CitadelleMyTransactions";
import CitadelleMyInvoices from "@/pages/citadelle/member/CitadelleMyInvoices";
import AdminCitadelleInvoices from "@/pages/admin/AdminCitadelleInvoices";
import CitadelleMyMessages from "@/pages/citadelle/member/CitadelleMyMessages";
import CitadelleMyServices from "@/pages/citadelle/member/CitadelleMyServices";
import CitadelleConversationDetail from "@/pages/citadelle/member/CitadelleConversationDetail";
import AdminCitadelleListings from "@/pages/admin/AdminCitadelleListings";
import AdminCitadelleTransactions from "@/pages/admin/AdminCitadelleTransactions";
import AdminCitadelleReports from "@/pages/admin/AdminCitadelleReports";
import AdminCitadelleServices from "@/pages/admin/AdminCitadelleServices";
import AdminCitadelleNewsletter from "@/pages/admin/AdminCitadelleNewsletter";
import AdminCitadelleCommission from "@/pages/admin/AdminCitadelleCommission";
import AdminCitadelleUsers from "@/pages/admin/AdminCitadelleUsers";
import CitadelleBlog from "@/pages/citadelle/CitadelleBlog";
import CitadelleParutions from "@/pages/citadelle/CitadelleParutions";
import CitadelleChroniques from "@/pages/citadelle/CitadelleChroniques";
import CitadelleGuides from "@/pages/citadelle/CitadelleGuides";
import CitadelleBlogPost from "@/pages/citadelle/CitadelleBlogPost";
import CitadelleContact from "@/pages/citadelle/CitadelleContact";
import CitadelleVendre from "@/pages/citadelle/CitadelleVendre";
import CitadellePaymentSuccess from "@/pages/citadelle/CitadellePaymentSuccess";
import CitadelleMentionsLegales from "@/pages/citadelle/CitadelleMentionsLegales";
import CitadelleCGU from "@/pages/citadelle/CitadelleCGU";
import CitadelleCGV from "@/pages/citadelle/CitadelleCGV";
import CitadelleConfidentialite from "@/pages/citadelle/CitadelleConfidentialite";
import AdminCitadelleBlog from "@/pages/admin/AdminCitadelleBlog";
import AdminCitadelleAnalytics from "@/pages/admin/AdminCitadelleAnalytics";
import AdminCitadelleTransmission from "@/pages/admin/AdminCitadelleTransmission";
import CitadelleMyTransmissions from "@/pages/citadelle/member/CitadelleMyTransmissions";import CitadelleVerifyTransmission from "@/pages/citadelle/CitadelleVerifyTransmission";
import CitadelleNotifications from "@/pages/citadelle/member/CitadelleNotifications";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminLiveApp from "@/pages/admin/AdminLiveApp";
import AdminInstallApp from "@/pages/admin/AdminInstallApp";

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
    <HelmetProvider>
    <AuthProvider>
      <CitadelleAuthProvider>
      <ModalProvider>
        <AdminThemeProvider>
          <div className="App">
            <Toaster position="top-center" richColors closeButton />
            <BrowserRouter>
              {/* Scroll en haut à chaque navigation */}
              <ScrollToTop />
              <DomainGuard />
              {/* Suivi statistique anonyme (RGPD) */}
              <AnalyticsTracker />
              {/* Alertes globales (bannières et popups) */}
              <GlobalAlerts />
            
            <Suspense fallback={
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}>
                <div style={{width:32,height:32,border:'3px solid #C9A45C',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            }>
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
              
              {/* Connexion admin dédiée */}
              <Route path="/papaenmousse1981" element={<AdminLoginPage />} />

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
                path="/syndicat-admin/syndicat-home" 
                element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} 
              />
              <Route
                path="/admin-live"
                element={<RoleRoute allowedRoles={["admin"]}><AdminLiveApp /></RoleRoute>}
              />
              <Route
                path="/admin-live/installer"
                element={<RoleRoute allowedRoles={["admin"]}><AdminInstallApp /></RoleRoute>}
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
              <Route path="/citadelle/auth/google/callback" element={<CitadelleGoogleCallback />} />
              <Route path="/auth/google" element={<CitadelleGoogleCallback />} />
              <Route path="/citadelle/inscription" element={<CitadelleRegister />} />
              <Route path="/citadelle/mot-de-passe-oublie" element={<CitadelleForgotPassword />} />
              <Route path="/citadelle/reinitialiser-mot-de-passe" element={<CitadelleResetPassword />} />
              <Route path="/citadelle/annonces" element={<CitadelleListings />} />
              <Route path="/citadelle/annonces/:slug" element={<CitadelleListingDetail />} />
              <Route path="/citadelle/services" element={<CitadelleServices />} />
              <Route path="/citadelle/vendre" element={<CitadelleVendre />} />
              <Route path="/citadelle/estimation" element={<CitadelleEstimation />} />
              <Route path="/citadelle/paiement/confirmation" element={<CitadellePaymentSuccess />} />
              <Route path="/citadelle/mentions-legales" element={<CitadelleMentionsLegales />} />
              <Route path="/citadelle/cgu" element={<CitadelleCGU />} />
              <Route path="/citadelle/cgv" element={<CitadelleCGV />} />
              <Route path="/citadelle/confidentialite" element={<CitadelleConfidentialite />} />
              <Route path="/citadelle/blog" element={<CitadelleBlog />} />
              <Route path="/citadelle/parutions" element={<CitadelleParutions />} />
              <Route path="/citadelle/chroniques" element={<CitadelleChroniques />} />
              <Route path="/citadelle/guides" element={<CitadelleGuides />} />
              <Route path="/citadelle/blog/:slug" element={<CitadelleBlogPost />} />
              <Route path="/citadelle/contact" element={<CitadelleContact />} />
              <Route path="/verifier-transmission/:dossier" element={<CitadelleVerifyTransmission />} />

              {/* Citadelle — Espace membre (routes spécifiques avant le wildcard) */}
              <Route path="/citadelle/espace-membre/mes-annonces/creer" element={<CitadelleCreateListing />} />
              <Route path="/citadelle/espace-membre/mes-annonces/:id/modifier" element={<CitadelleEditListing />} />
              <Route path="/citadelle/espace-membre/mes-annonces" element={<CitadelleMyListings />} />
              <Route path="/citadelle/espace-membre/transactions/:id" element={<CitadelleTransactionDetail />} />
              <Route path="/citadelle/espace-membre/transactions" element={<CitadelleMyTransactions />} />
              <Route path="/citadelle/espace-membre/transmissions" element={<CitadelleMyTransmissions />} />
              <Route path="/citadelle/espace-membre/factures" element={<CitadelleMyInvoices />} />
              <Route path="/citadelle/espace-membre/messages/:id" element={<CitadelleConversationDetail />} />
              <Route path="/citadelle/espace-membre/messages" element={<CitadelleMyMessages />} />
              <Route path="/citadelle/espace-membre/mes-services" element={<CitadelleMyServices />} />
              <Route path="/citadelle/espace-membre/profil" element={<CitadelleProfile />} />
              <Route path="/citadelle/espace-membre/notifications" element={<CitadelleNotifications />} />
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
                path="/syndicat-admin/citadelle/signalements"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleReports /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/transmission/:transactionId"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleTransmission /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/factures"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleInvoices /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/services"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleServices /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/commission"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleCommission /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/newsletter"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleNewsletter /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/blog"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleBlog /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/analytics"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleAnalytics /></RoleRoute>}
              />
              <Route
                path="/syndicat-admin/citadelle/utilisateurs"
                element={<RoleRoute allowedRoles={["admin"]}><AdminCitadelleUsers /></RoleRoute>}
              />

              {/* ============================================ */}
              {/* REDIRECTION DASHBOARD GÉNÉRIQUE */}
              {/* ============================================ */}
              
              <Route 
                path="/dashboard" 
                element={<RoleRoute allowedRoles={["commercial", "developer", "admin"]}><CommercialDashboard /></RoleRoute>} 
              />

            </Routes>
            </Suspense>
          </BrowserRouter>
        </div>
        </AdminThemeProvider>
      </ModalProvider>
      </CitadelleAuthProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
