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

import { CitadelleAuthProvider } from "@/context/CitadelleAuthContext";

// ─── CHARGEMENT IMMÉDIAT : pages critiques du premier rendu ───────────────────
// Citadelle : page d'accueil + auth + annonces (visitées dès l'arrivée)
import CitadelleHome         from "@/pages/citadelle/CitadelleHome";
import CitadelleListings     from "@/pages/citadelle/CitadelleListings";
import CitadelleLogin        from "@/pages/citadelle/CitadelleLogin";
import CitadelleRegister     from "@/pages/citadelle/CitadelleRegister";
import CitadelleGoogleCallback   from "@/pages/citadelle/CitadelleGoogleCallback";
import CitadelleForgotPassword   from "@/pages/citadelle/CitadelleForgotPassword";
import CitadelleResetPassword    from "@/pages/citadelle/CitadelleResetPassword";

// ─── LAZY LOADING : tout le reste (jamais sur la page d'accueil) ──────────────
// Syndicat du Code — pages publiques
const HomePage         = lazy(() => import("@/pages/HomePage"));
const CGV              = lazy(() => import("@/pages/CGV"));
const CGU              = lazy(() => import("@/pages/CGU"));
const RGPD             = lazy(() => import("@/pages/RGPD"));
const Rejoindre        = lazy(() => import("@/pages/Rejoindre"));
const MembersPage      = lazy(() => import("@/pages/MembersPage"));
const MemberDetailPage = lazy(() => import("@/pages/MemberDetailPage"));

// Syndicat du Code — authentification
const LoginPage          = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage       = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage  = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const ChooseRolePage     = lazy(() => import("@/pages/auth/ChooseRolePage"));

// Syndicat du Code — espaces membres
const CommercialDashboard    = lazy(() => import("@/pages/commercial/CommercialDashboard"));
const CommercialProfile      = lazy(() => import("@/pages/commercial/CommercialProfile"));
const CommercialDocuments    = lazy(() => import("@/pages/commercial/CommercialDocuments"));
const CommercialAffaires     = lazy(() => import("@/pages/commercial/CommercialAffaires"));
const DeveloperDashboard     = lazy(() => import("@/pages/developer/DeveloperDashboard"));
const DeveloperProfile       = lazy(() => import("@/pages/developer/DeveloperProfile"));
const DeveloperDocuments     = lazy(() => import("@/pages/developer/DeveloperDocuments"));
const DeveloperOpportunities = lazy(() => import("@/pages/developer/DeveloperOpportunities"));
const DeveloperProjects      = lazy(() => import("@/pages/developer/DeveloperProjects"));
const DeveloperSubscription  = lazy(() => import("@/pages/developer/DeveloperSubscription"));
const DeveloperBook          = lazy(() => import("@/pages/developer/DeveloperBook"));
const DeveloperMessages      = lazy(() => import("@/pages/developer/DeveloperMessages"));
const ProjectRoom            = lazy(() => import("@/pages/developer/ProjectRoom"));
const MemberPartners         = lazy(() => import("@/pages/shared/MemberPartners"));
const MemberBilling          = lazy(() => import("@/pages/shared/MemberBilling"));

// Admin Syndicat du Code
const AdminLoginPage          = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminDashboard          = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers              = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminContacts           = lazy(() => import("@/pages/admin/AdminContacts"));
const AdminLogs               = lazy(() => import("@/pages/admin/AdminLogs"));
const AdminProjects           = lazy(() => import("@/pages/admin/AdminProjects"));
const AdminProjectDetail      = lazy(() => import("@/pages/admin/AdminProjectDetail"));
const AdminAnnouncements      = lazy(() => import("@/pages/admin/AdminAnnouncements"));
const AdminAlerts             = lazy(() => import("@/pages/admin/AdminAlerts"));
const AdminSubscriptions      = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminPartners           = lazy(() => import("@/pages/admin/AdminPartners"));
const AdminPortfolioValidation = lazy(() => import("@/pages/admin/AdminPortfolioValidation"));
const AdminUserDetail         = lazy(() => import("@/pages/admin/AdminUserDetail"));
const AdminBruteForce         = lazy(() => import("@/pages/admin/AdminBruteForce"));
const AdminBackup             = lazy(() => import("@/pages/admin/AdminBackup"));
const AdminProjectRooms       = lazy(() => import("@/pages/admin/AdminProjectRooms"));
const AdminProjectRoomDetail  = lazy(() => import("@/pages/admin/AdminProjectRoomDetail"));
const AdminLiveApp            = lazy(() => import("@/pages/admin/AdminLiveApp"));
const AdminInstallApp         = lazy(() => import("@/pages/admin/AdminInstallApp"));

// Admin La Citadelle Numérique (jamais chargé sur la homepage)
const AdminCitadelle            = lazy(() => import("@/pages/admin/AdminCitadelle"));
const AdminCitadelleInvoices    = lazy(() => import("@/pages/admin/AdminCitadelleInvoices"));
const AdminCitadelleListings    = lazy(() => import("@/pages/admin/AdminCitadelleListings"));
const AdminCitadelleTransactions = lazy(() => import("@/pages/admin/AdminCitadelleTransactions"));
const AdminCitadelleReports     = lazy(() => import("@/pages/admin/AdminCitadelleReports"));
const AdminCitadelleServices    = lazy(() => import("@/pages/admin/AdminCitadelleServices"));
const AdminCitadelleNewsletter  = lazy(() => import("@/pages/admin/AdminCitadelleNewsletter"));
const AdminCitadelleCommission  = lazy(() => import("@/pages/admin/AdminCitadelleCommission"));
const AdminCitadelleUsers       = lazy(() => import("@/pages/admin/AdminCitadelleUsers"));
const AdminCitadelleBlog        = lazy(() => import("@/pages/admin/AdminCitadelleBlog"));
const AdminCitadelleAnalytics   = lazy(() => import("@/pages/admin/AdminCitadelleAnalytics"));
const AdminCitadelleTransmission = lazy(() => import("@/pages/admin/AdminCitadelleTransmission"));

// La Citadelle Numérique — espace membre
const CitadelleDashboard        = lazy(() => import("@/pages/citadelle/member/CitadelleDashboard"));
const CitadelleMyListings       = lazy(() => import("@/pages/citadelle/member/CitadelleMyListings"));
const CitadelleCreateListing    = lazy(() => import("@/pages/citadelle/member/CitadelleCreateListing"));
const CitadelleEditListing      = lazy(() => import("@/pages/citadelle/member/CitadelleEditListing"));
const CitadelleMyTransactions   = lazy(() => import("@/pages/citadelle/member/CitadelleMyTransactions"));
const CitadelleMyInvoices       = lazy(() => import("@/pages/citadelle/member/CitadelleMyInvoices"));
const CitadelleMyMessages       = lazy(() => import("@/pages/citadelle/member/CitadelleMyMessages"));
const CitadelleMyServices       = lazy(() => import("@/pages/citadelle/member/CitadelleMyServices"));
const CitadelleConversationDetail = lazy(() => import("@/pages/citadelle/member/CitadelleConversationDetail"));
const CitadelleMyTransmissions  = lazy(() => import("@/pages/citadelle/member/CitadelleMyTransmissions"));
const CitadelleNotifications    = lazy(() => import("@/pages/citadelle/member/CitadelleNotifications"));
const CitadelleTransactionDetail = lazy(() => import("@/pages/citadelle/member/CitadelleTransactionDetail"));
const CitadelleProfile          = lazy(() => import("@/pages/citadelle/member/CitadelleProfile"));

// La Citadelle Numérique — pages secondaires
const CitadelleListingDetail    = lazy(() => import("@/pages/citadelle/CitadelleListingDetail"));
const CitadelleEstimation       = lazy(() => import("@/pages/citadelle/CitadelleEstimation"));
const CitadelleServices         = lazy(() => import("@/pages/citadelle/CitadelleServices"));
const CitadelleVendre           = lazy(() => import("@/pages/citadelle/CitadelleVendre"));
const CitadelleContact          = lazy(() => import("@/pages/citadelle/CitadelleContact"));
const CitadellePaymentSuccess   = lazy(() => import("@/pages/citadelle/CitadellePaymentSuccess"));
const CitadelleBlog             = lazy(() => import("@/pages/citadelle/CitadelleBlog"));
const CitadelleParutions        = lazy(() => import("@/pages/citadelle/CitadelleParutions"));
const CitadelleChroniques       = lazy(() => import("@/pages/citadelle/CitadelleChroniques"));
const CitadelleGuides           = lazy(() => import("@/pages/citadelle/CitadelleGuides"));
const CitadelleBlogPost         = lazy(() => import("@/pages/citadelle/CitadelleBlogPost"));
const CitadelleMentionsLegales  = lazy(() => import("@/pages/citadelle/CitadelleMentionsLegales"));
const CitadelleCGU              = lazy(() => import("@/pages/citadelle/CitadelleCGU"));
const CitadelleCGV              = lazy(() => import("@/pages/citadelle/CitadelleCGV"));
const CitadelleConfidentialite  = lazy(() => import("@/pages/citadelle/CitadelleConfidentialite"));
const CitadelleVerifyTransmission = lazy(() => import("@/pages/citadelle/CitadelleVerifyTransmission"));

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
