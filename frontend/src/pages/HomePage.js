/**
 * Page d'accueil
 * Compose toutes les sections de la landing page
 */

import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyUsSection from "@/components/sections/WhyUsSection";
import ProcessSection from "@/components/sections/ProcessSection";
import AudienceSection from "@/components/sections/AudienceSection";
import ContactSection from "@/components/sections/ContactSection";
import DevisModal from "@/components/modals/DevisModal";
import PublicAlerts from "@/components/PublicAlerts";

const HomePage = () => (
  <>
    <PublicAlerts />
    <Navigation />
    <HeroSection />
    <ServicesSection />
    <WhyUsSection />
    <ProcessSection />
    <AudienceSection />
    <ContactSection />
    <Footer />
    <DevisModal />
  </>
);

export default HomePage;
