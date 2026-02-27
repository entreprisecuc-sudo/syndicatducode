import { ArrowLeft } from "lucide-react";

const RGPD = () => {
  return (
    <div className="legal-page">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-20">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-sage hover:underline">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </a>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">POLITIQUE DE CONFIDENTIALITÉ</h1>
          <p className="text-lg font-semibold" style={{color: 'var(--sage)'}}>LE SYNDICAT DU CODE</p>
          <p style={{color: 'var(--text-muted)'}}>Notre loi. Unis par le code.</p>
        </div>

        <div className="legal-content">
          <section className="mb-8">
            <h2>1. Responsable du traitement</h2>
            <p>Le responsable du traitement des données personnelles collectées sur le site est :</p>
            <p>
              <strong>JOERKE.B</strong>,<br />
              Société par actions simplifiée unipersonnelle (SASU) au capital social de 250 €,<br />
              siège social : 11 rue Urbain IV, 10000 Troyes,<br />
              immatriculée au Registre du Commerce et des Sociétés de Troyes sous le numéro 892 906 728,<br />
              représentée par Monsieur Arnaud Becam, Président,
            </p>
            <p>📧 Contact : <a href="mailto:atelier@syndicatducode.fr" style={{color: 'var(--sage)'}}>atelier@syndicatducode.fr</a></p>
            <p>Ci-après désigné « Le Syndicat du Code ».</p>
          </section>

          <section className="mb-8">
            <h2>2. Données personnelles collectées</h2>
            <p>Le Syndicat du Code est susceptible de collecter les données personnelles suivantes :</p>
            <ul>
              <li>identité (nom, prénom),</li>
              <li>coordonnées (adresse e-mail, numéro de téléphone),</li>
              <li>informations transmises via les formulaires de contact,</li>
              <li>données techniques de navigation (adresse IP, type de navigateur, système d'exploitation).</li>
            </ul>
            <p>Aucune donnée sensible au sens du RGPD n'est collectée.</p>
          </section>

          <section className="mb-8">
            <h2>3. Finalités du traitement</h2>
            <p>Les données personnelles collectées sont utilisées exclusivement pour les finalités suivantes :</p>
            <ul>
              <li>répondre aux demandes envoyées via le site,</li>
              <li>gérer les échanges commerciaux et contractuels,</li>
              <li>assurer le suivi des projets et prestations,</li>
              <li>améliorer le fonctionnement et la sécurité du site,</li>
              <li>respecter les obligations légales et réglementaires.</li>
            </ul>
            <p>Les données ne sont jamais utilisées à des fins commerciales non sollicitées.</p>
          </section>

          <section className="mb-8">
            <h2>4. Base légale du traitement</h2>
            <p>Les traitements de données personnelles reposent sur :</p>
            <ul>
              <li>le consentement de l'Utilisateur,</li>
              <li>l'exécution de mesures précontractuelles ou contractuelles,</li>
              <li>le respect d'obligations légales,</li>
              <li>l'intérêt légitime du Syndicat du Code (sécurité, amélioration du site).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>5. Durée de conservation</h2>
            <p>Les données personnelles sont conservées uniquement pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées, et notamment :</p>
            <ul>
              <li>données de contact : 3 ans à compter du dernier échange,</li>
              <li>données contractuelles : durée légale de conservation applicable,</li>
              <li>données techniques : durée strictement nécessaire au fonctionnement et à la sécurité du site.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>6. Destinataires des données</h2>
            <p>Les données personnelles sont destinées exclusivement au Syndicat du Code.</p>
            <p>Elles peuvent être accessibles, dans la limite de leurs missions, à des prestataires techniques (hébergement, maintenance), soumis à une obligation de confidentialité.</p>
            <p>Aucune donnée n'est vendue, cédée ou louée à des tiers.</p>
          </section>

          <section className="mb-8">
            <h2>7. Sécurité des données</h2>
            <p>Le Syndicat du Code met en œuvre des mesures techniques et organisationnelles appropriées afin de garantir la sécurité, l'intégrité et la confidentialité des données personnelles.</p>
            <p>Toute tentative d'accès non autorisé ou de compromission fera l'objet de mesures correctives immédiates.</p>
          </section>

          <section className="mb-8">
            <h2>8. Droits des utilisateurs</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), l'Utilisateur dispose des droits suivants :</p>
            <ul>
              <li>droit d'accès à ses données,</li>
              <li>droit de rectification,</li>
              <li>droit à l'effacement (droit à l'oubli),</li>
              <li>droit à la limitation du traitement,</li>
              <li>droit d'opposition,</li>
              <li>droit à la portabilité de ses données,</li>
              <li>droit de retirer son consentement à tout moment.</li>
            </ul>
            <p>Pour exercer ses droits, l'Utilisateur peut adresser sa demande à :<br />
            📧 <a href="mailto:atelier@syndicatducode.fr" style={{color: 'var(--sage)'}}>atelier@syndicatducode.fr</a></p>
            <p>Une réponse sera apportée dans un délai maximal d'un (1) mois.</p>
          </section>

          <section className="mb-8">
            <h2>9. Cookies</h2>
            <p>Le site peut utiliser des cookies strictement nécessaires à son bon fonctionnement.</p>
            <p>Lorsque des cookies soumis à consentement sont utilisés, un bandeau d'information permet à l'Utilisateur de gérer ses préférences conformément à la réglementation en vigueur.</p>
          </section>

          <section className="mb-8">
            <h2>10. Transfert hors Union européenne</h2>
            <p>Aucune donnée personnelle n'est transférée en dehors de l'Union européenne sans garanties appropriées et conformes au RGPD.</p>
          </section>

          <section className="mb-8">
            <h2>11. Réclamation auprès de la CNIL</h2>
            <p>Si l'Utilisateur estime, après avoir contacté le Syndicat du Code, que ses droits ne sont pas respectés, il peut introduire une réclamation auprès de l'autorité de contrôle compétente :</p>
            <p>
              <strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong><br />
              Site : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{color: 'var(--sage)'}}>www.cnil.fr</a>
            </p>
          </section>

          <section className="mb-8">
            <h2>12. Modification de la politique de confidentialité</h2>
            <p>Le Syndicat du Code se réserve le droit de modifier la présente Politique de Confidentialité à tout moment.</p>
            <p>La version applicable est celle publiée sur le site à la date de consultation.</p>
          </section>

          <p className="text-center mt-12" style={{color: 'var(--text-muted)'}}>
            <em>Dernière mise à jour : 2026</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RGPD;
