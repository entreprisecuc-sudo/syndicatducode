/**
 * Tableau de bord - Espace Développeur
 */

import { Code, FileText, Briefcase, Users, Zap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import InfoCard from "@/components/dashboard/InfoCard";
import AnnouncementsList from "@/components/dashboard/AnnouncementsList";

const DeveloperDashboard = () => {
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
          Bienvenue, Partenaire Développeur !
        </h2>
        <p className="text-white/80 text-sm">
          Accédez aux opportunités de missions et développez votre réseau avec Le Syndicat du Code.
        </p>
      </div>

      {/* Annonces */}
      <div className="mb-6">
        <AnnouncementsList maxItems={3} />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={Code}
          label="Missions disponibles"
          value="0"
          sublabel="Actuellement"
        />
        <StatCard 
          icon={Briefcase}
          label="Candidatures"
          value="0"
          sublabel="En cours"
          color="#3b82f6"
        />
        <StatCard 
          icon={Zap}
          label="Statut"
          value="Actif"
          sublabel="Membre Syndicat"
          color="#10b981"
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
          icon={Code}
          title="Opportunités de missions"
          description="Consultez les projets disponibles et postulez aux missions qui vous correspondent."
          linkTo="/espace-developpeur/opportunites"
          linkLabel="Voir les missions"
        />
        <InfoCard 
          icon={FileText}
          title="Documents Syndicat"
          description="Consultez les règles, process et ressources du Syndicat."
          linkTo="/espace-developpeur/documents"
          linkLabel="Consulter"
          color="#3b82f6"
        />
        <InfoCard 
          icon={Users}
          title="Mon profil développeur"
          description="Complétez vos compétences et expériences pour matcher avec les projets."
          linkTo="/espace-developpeur/profil"
          linkLabel="Compléter"
          color="#8b5cf6"
        />
      </div>

      {/* Info Syndicat */}
      <div 
        className="mt-6 p-5 rounded-xl"
        style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)" }}
      >
        <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          À propos du Syndicat
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          En tant que partenaire développeur, vous faites partie d'un réseau de freelances qualifiés. 
          Le Syndicat vous met en relation avec des clients et gère la partie commerciale et administrative 
          pour que vous puissiez vous concentrer sur ce que vous faites de mieux : coder.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default DeveloperDashboard;
