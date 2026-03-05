/**
 * Application principale
 * Point d'entrée du routeur React
 */

import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "@/context/ModalContext";

// Pages
import HomePage from "@/pages/HomePage";
import CGV from "@/pages/CGV";
import CGU from "@/pages/CGU";
import RGPD from "@/pages/RGPD";
import Rejoindre from "@/pages/Rejoindre";

// Composants de layout
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import DevisModal from "@/components/modals/DevisModal";

/**
 * Layout pour les pages légales et secondaires
 * Réutilise Navigation, Footer et DevisModal
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
 * Gère le routage et le contexte global
 */
function App() {
  return (
    <ModalProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<HomePage />} />
            
            {/* Pages légales */}
            <Route path="/cgv" element={<PageLayout><CGV /></PageLayout>} />
            <Route path="/cgu" element={<PageLayout><CGU /></PageLayout>} />
            <Route path="/rgpd" element={<PageLayout><RGPD /></PageLayout>} />
            
            {/* Recrutement */}
            <Route path="/rejoindre" element={<PageLayout><Rejoindre /></PageLayout>} />
          </Routes>
        </BrowserRouter>
      </div>
    </ModalProvider>
  );
}

export default App;
