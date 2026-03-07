import { ArrowLeft, Briefcase, Code, Mail } from "lucide-react";
import { CONFIG } from "@/config/constants";

const Rejoindre = () => {
  return (
    <div className="legal-page">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-sage hover:underline">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </a>
        
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Rejoignez le Syndicat</h1>
          <p className="text-lg" style={{color: 'var(--text-muted)'}}>Notre loi. Unis par le code.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* OPTION 1 - Commercial */}
          <div className="recruit-card">
            <div className="recruit-icon">
              <Briefcase size={32} color="white" />
            </div>
            <span className="recruit-badge">OPTION 1</span>
            <h2 className="text-2xl font-bold mb-2">Rejoindre le Syndicat</h2>
            <p className="text-lg font-semibold mb-6" style={{color: 'var(--sage)'}}>En tant que commercial freelance</p>
            
            <p className="mb-4" style={{color: 'var(--text-secondary)'}}>
              <strong>Tu sais vendre.</strong><br />
              Tu sais écouter un besoin, poser un cadre, conclure proprement.
            </p>
            <p className="mb-6" style={{color: 'var(--text-secondary)'}}>
              Nous cherchons des commerciaux indépendants pour représenter le Syndicat, proposer nos solutions et développer notre réseau.
            </p>

            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{color: 'var(--text-primary)'}}>Ce que nous attendons</h3>
              <ul className="recruit-list">
                <li>Statut freelance / indépendant</li>
                <li>Sérieux, fiabilité, sens du relationnel</li>
                <li>Compréhension du digital, du web ou du logiciel</li>
                <li>Respect des règles et des engagements</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{color: 'var(--text-primary)'}}>Ce que nous proposons</h3>
              <ul className="recruit-list">
                <li>Une offre claire, sans discours flou</li>
                <li>Des prestations solides à défendre</li>
                <li>Un cadre structuré, sans micromanagement</li>
                <li>Une collaboration basée sur la confiance</li>
              </ul>
            </div>

            <p className="text-sm mb-6" style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
              👉 Pas de conditions publiques.<br />
              Chaque collaboration est étudiée individuellement.
            </p>

            <div className="recruit-cta">
              <p className="font-semibold mb-2">Intéressé ?</p>
              <a href={`mailto:${CONFIG.email}`} className="inline-flex items-center gap-2" style={{color: 'var(--sage)'}}>
                <Mail size={18} />
                {CONFIG.email}
              </a>
            </div>
          </div>

          {/* OPTION 2 - Développeur */}
          <div className="recruit-card">
            <div className="recruit-icon">
              <Code size={32} color="white" />
            </div>
            <span className="recruit-badge">OPTION 2</span>
            <h2 className="text-2xl font-bold mb-2">Rejoindre le Syndicat</h2>
            <p className="text-lg font-semibold mb-6" style={{color: 'var(--sage)'}}>En tant que développeur freelance</p>
            
            <p className="mb-4" style={{color: 'var(--text-secondary)'}}>
              <strong>Tu es développeur.</strong><br />
              Tu sais produire du code propre.<br />
              Tu respectes les délais et les règles.
            </p>
            <p className="mb-6" style={{color: 'var(--text-secondary)'}}>
              Nous collaborons avec des développeurs indépendants pour :
            </p>
            <ul className="recruit-list mb-6">
              <li>travailler avec nos équipes sur des projets clients,</li>
              <li>intervenir en renfort sur des projets existants,</li>
              <li>ou collaborer sur ton propre projet, avec notre soutien.</li>
            </ul>

            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{color: 'var(--text-primary)'}}>Profils recherchés</h3>
              <ul className="recruit-list">
                <li>Freelance confirmé ou autonome</li>
                <li>Web, logiciel, backend, frontend, fullstack</li>
                <li>Capacité à travailler en équipe</li>
                <li>Respect des standards et des engagements</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{color: 'var(--text-primary)'}}>Ce que nous offrons</h3>
              <ul className="recruit-list">
                <li>Des projets sérieux, cadrés</li>
                <li>Une organisation claire</li>
                <li>Des échanges directs, sans intermédiaire inutile</li>
                <li>Un collectif, pas une plateforme impersonnelle</li>
              </ul>
            </div>

            <p className="text-sm mb-6" style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
              👉 Ici, le code passe avant le discours.
            </p>

            <div className="recruit-cta">
              <p className="font-semibold mb-2">Intéressé ?</p>
              <a href="mailto:atelier@syndicatducode.fr" className="inline-flex items-center gap-2" style={{color: 'var(--sage)'}}>
                <Mail size={18} />
                atelier@syndicatducode.fr
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rejoindre;
