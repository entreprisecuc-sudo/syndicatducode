import { ArrowLeft } from "lucide-react";

const CGU = () => {
  return (
    <div className="legal-page">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-sage hover:underline">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </a>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
          <p className="text-lg font-semibold" style={{color: 'var(--sage)'}}>LE SYNDICAT DU CODE</p>
          <p style={{color: 'var(--text-muted)'}}>Notre loi. Unis par le code.</p>
        </div>

        <div className="legal-content">
          <section className="mb-8">
            <h2>Article 1 – Éditeur du site</h2>
            <p>Le présent site est édité par :</p>
            <p>
              <strong>JOERKE.B</strong>,<br />
              Société par actions simplifiée unipersonnelle (SASU) au capital social de 250 €,<br />
              dont le siège social est situé 11 rue Urbain IV, 10000 Troyes,<br />
              immatriculée au Registre du Commerce et des Sociétés de Troyes sous le numéro 892 906 728,<br />
              représentée par Monsieur Arnaud Becam, en qualité de Président,
            </p>
            <p>📧 Adresse de contact : <a href="mailto:atelier@syndicatducode.fr" style={{color: 'var(--sage)'}}>atelier@syndicatducode.fr</a></p>
            <p>Ci-après désignée « Le Syndicat du Code » ou « l'Éditeur ».</p>
          </section>

          <section className="mb-8">
            <h2>Article 2 – Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation ont pour objet de définir les modalités d'accès et d'utilisation du site internet du Syndicat du Code.</p>
            <p>Toute navigation sur le site implique l'acceptation pleine et entière des présentes CGU, sans réserve.</p>
          </section>

          <section className="mb-8">
            <h2>Article 3 – Accès au site</h2>
            <p>Le site est accessible gratuitement à tout utilisateur disposant d'un accès à internet.</p>
            <p>Le Syndicat du Code se réserve le droit, à tout moment et sans préavis, de :</p>
            <ul>
              <li>suspendre, interrompre ou limiter l'accès au site,</li>
              <li>procéder à des opérations de maintenance ou de mise à jour.</li>
            </ul>
            <p>Aucune indemnité ne pourra être réclamée en cas d'indisponibilité temporaire ou définitive du site.</p>
          </section>

          <section className="mb-8">
            <h2>Article 4 – Utilisation du site</h2>
            <p>L'Utilisateur s'engage à utiliser le site de manière loyale, conforme à la loi et aux présentes CGU.</p>
            <p>Sont strictement interdits :</p>
            <ul>
              <li>toute tentative d'intrusion, de détournement ou d'altération du site,</li>
              <li>toute utilisation frauduleuse, malveillante ou illicite,</li>
              <li>toute action susceptible de porter atteinte au bon fonctionnement du site ou à l'image du Syndicat du Code.</li>
            </ul>
            <p>Toute utilisation abusive pourra entraîner des poursuites civiles et/ou pénales.</p>
          </section>

          <section className="mb-8">
            <h2>Article 5 – Propriété intellectuelle</h2>
            <p>L'ensemble des éléments composant le site, notamment :</p>
            <ul>
              <li>textes, contenus, logos, visuels, graphismes,</li>
              <li>structure, code source et architecture,</li>
            </ul>
            <p>est protégé par les dispositions du Code de la propriété intellectuelle.</p>
            <p>Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable du Syndicat du Code est strictement interdite.</p>
          </section>

          <section className="mb-8">
            <h2>Article 6 – Contenus du site</h2>
            <p>Les informations diffusées sur le site sont fournies à titre indicatif.</p>
            <p>Le Syndicat du Code s'efforce d'en assurer l'exactitude, mais ne garantit ni leur exhaustivité ni leur mise à jour permanente.</p>
            <p>Le Syndicat du Code se réserve le droit de modifier ou supprimer tout contenu à tout moment, sans préavis.</p>
          </section>

          <section className="mb-8">
            <h2>Article 7 – Liens hypertextes</h2>
            <p>Le site peut contenir des liens vers des sites internet tiers.</p>
            <p>Le Syndicat du Code n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité ou leur fonctionnement.</p>
          </section>

          <section className="mb-8">
            <h2>Article 8 – Responsabilité</h2>
            <p>L'utilisation du site se fait sous la responsabilité exclusive de l'Utilisateur.</p>
            <p>Le Syndicat du Code ne pourra être tenu responsable :</p>
            <ul>
              <li>des dommages directs ou indirects liés à l'utilisation du site,</li>
              <li>des interruptions, bugs, erreurs ou indisponibilités,</li>
              <li>des dommages causés par l'utilisation d'un matériel ou logiciel inadapté.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Article 9 – Données personnelles</h2>
            <p>Les données personnelles collectées via le site sont traitées conformément à la réglementation en vigueur, notamment le Règlement Général sur la Protection des Données (RGPD).</p>
            <p>Pour toute question relative aux données personnelles, l'Utilisateur peut contacter le Syndicat du Code à l'adresse suivante :<br />
            📧 <a href="mailto:atelier@syndicatducode.fr" style={{color: 'var(--sage)'}}>atelier@syndicatducode.fr</a></p>
            <p>Les modalités complètes de traitement sont détaillées dans la <a href="/rgpd" style={{color: 'var(--sage)'}}>Politique de Confidentialité</a> du site.</p>
          </section>

          <section className="mb-8">
            <h2>Article 10 – Sécurité</h2>
            <p>Toute tentative d'atteinte à la sécurité du site (intrusion, extraction de données, perturbation volontaire) sera considérée comme une action hostile.</p>
            <p>Le Syndicat du Code se réserve le droit de mettre en œuvre toute mesure nécessaire afin de protéger son infrastructure, ses données et ses utilisateurs.</p>
          </section>

          <section className="mb-8">
            <h2>Article 11 – Modification des CGU</h2>
            <p>Le Syndicat du Code se réserve le droit de modifier les présentes CGU à tout moment.</p>
            <p>Les CGU applicables sont celles en vigueur à la date de navigation sur le site. Il appartient à l'Utilisateur de les consulter régulièrement.</p>
          </section>

          <section className="mb-8">
            <h2>Article 12 – Droit applicable et juridiction compétente</h2>
            <p>Les présentes Conditions Générales d'Utilisation sont soumises au droit français.</p>
            <p>Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux de Troyes, sauf disposition légale impérative contraire.</p>
          </section>

          <p className="text-center mt-12" style={{color: 'var(--text-muted)'}}>
            <em>Dernière mise à jour : 2026</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CGU;
