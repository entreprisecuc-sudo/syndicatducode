/**
 * Tableau de bord - Espace Commercial
 */

import { Briefcase, FileText, TrendingUp, Users } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import InfoCard from "@/components/dashboard/InfoCard";
import AnnouncementsList from "@/components/dashboard/AnnouncementsList";

const CommercialDashboard = () => {
  return (
    <DashboardLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--text-primary)" }}
      >
        Tableau de bord
      </h1>

      {/* Message de bienvenue */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ 
          background: "linear-gradient(135deg, var(--sage-dark), var(--sage))",
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-1">
          Bienvenue, Partenaire Commercial !
        </h2>
        <p className="text-white/80 text-sm">
          Suivez vos affaires et développez votre réseau avec Le Syndicat du Code.
        </p>
      </div>

      {/* Annonces */}
      <div className="mb-6">
        <AnnouncementsList maxItems={3} />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={Briefcase}
          label="Affaires apportées"
          value="0"
          sublabel="Ce mois"
        />
        <StatCard 
          icon={TrendingUp}
          label="En cours"
          value="0"
          sublabel="Projets actifs"
          color="#3b82f6"
        />
        <StatCard 
          icon={Users}
          label="Clients référés"
          value="0"
          sublabel="Total"
          color="#8b5cf6"
        />
        <StatCard 
          icon={FileText}
          label="Documents"
          value="3"
          sublabel="Disponibles"
          color="#f59e0b"
        />
      </div>

      {/* Actions rapides */}
      <h3 
        className="font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Actions rapides
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard 
          icon={Briefcase}
          title="Déclarer une affaire"
          description="Signalez un nouveau prospect ou client que vous apportez au Syndicat."
          linkTo="/espace-commercial/affaires"
          linkLabel="Déclarer"
        />
        <InfoCard 
          icon={FileText}
          title="Documents partenaires"
          description="Consultez les contrats, règles et supports de vente."
          linkTo="/espace-commercial/documents"
          linkLabel="Consulter"
          color="#3b82f6"
        />
        <InfoCard 
          icon={Users}
          title="Mon profil"
          description="Complétez vos informations pour faciliter les échanges."
          linkTo="/espace-commercial/profil"
          linkLabel="Compléter"
          color="#8b5cf6"
        />
      </div>
    </DashboardLayout>
  );
};

export default CommercialDashboard;
