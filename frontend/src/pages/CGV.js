import { ArrowLeft } from "lucide-react";

const CGV = () => {
  return (
    <div className="legal-page">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-sage hover:underline">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </a>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">CONDITIONS GÉNÉRALES DE VENTE</h1>
          <p className="text-lg font-semibold" style={{color: 'var(--sage)'}}>LE SYNDICAT DU CODE</p>
          <p style={{color: 'var(--text-muted)'}}>Notre loi. Unis par le code.</p>
        </div>

        <div className="legal-content">
          <section className="mb-8">
            <h2>Article 1 – L'Organisation</h2>
            <p>Les présentes Conditions Générales de Vente sont conclues entre :</p>
            <p>
              <strong>JOERKE.B</strong>,<br />
              Société par actions simplifiée unipersonnelle (SASU) au capital social de 250 €,<br />
              dont le siège social est situé 11 rue Urbain IV, 10000 Troyes,<br />
              immatriculée au Registre du Commerce et des Sociétés de Troyes sous le numéro 892 906 728,<br />
              représentée par Monsieur Arnaud Becam, agissant en qualité de Président,<br />
              ci-après désignée « Le Syndicat du Code » ou « le Prestataire »,
            </p>
            <p>
              et toute personne physique ou morale sollicitant les services du Prestataire,<br />
              ci-après désignée « le Client ».
            </p>
          </section>

          <section className="mb-8">
            <h2>Article 2 – Objet</h2>
            <p>Le Syndicat du Code fournit des prestations de développement informatique sur mesure, incluant notamment :</p>
            <ul>
              <li>création de sites internet et plateformes web,</li>
              <li>développement de logiciels, CRM et ERP personnalisés,</li>
              <li>intégration de technologies actuelles et solutions d'automatisation,</li>
              <li>conseil, accompagnement et maintenance technique.</li>
            </ul>
            <p>Toute commande implique l'adhésion pleine et entière du Client aux présentes Conditions Générales.</p>
          </section>

          <section className="mb-8">
            <h2>Article 3 – Champ d'application</h2>
            <p>Les présentes CGV constituent le cadre contractuel unique entre les parties. Elles prévalent sur tout autre document, y compris les conditions générales d'achat du Client.</p>
            <p>Aucune dérogation ne sera applicable sans accord écrit du Prestataire.</p>
          </section>

          <section className="mb-8">
            <h2>Article 4 – Engagement contractuel</h2>
            <p>L'accord est réputé ferme et définitif après :</p>
            <ul>
              <li>validation écrite d'un devis,</li>
              <li>et, le cas échéant, paiement de l'acompte convenu.</li>
            </ul>
            <p>Toute demande sortant du périmètre validé fera l'objet d'un ajustement contractuel ou d'un devis complémentaire.</p>
          </section>

          <section className="mb-8">
            <h2>Article 5 – Prix et paiement</h2>
            <p>Les prix sont exprimés en euros (€), hors taxes, sauf indication contraire.</p>
            <p><strong>Règle du Syndicat :</strong></p>
            <ul>
              <li>le prix est fixé,</li>
              <li>les technologies actuelles sont incluses,</li>
              <li>aucune renégociation n'est admise après validation.</li>
            </ul>
            <p>Tout retard de paiement pourra entraîner la suspension immédiate des prestations, sans préjudice des sommes dues.</p>
          </section>

          <section className="mb-8">
            <h2>Article 6 – Délais</h2>
            <p>Les délais communiqués sont indicatifs.</p>
            <p>Le Syndicat du Code ne pourra être tenu responsable d'un retard résultant :</p>
            <ul>
              <li>d'un manquement du Client (retard d'informations, validations tardives),</li>
              <li>de demandes de modifications en cours de projet,</li>
              <li>d'un cas de force majeure.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Article 7 – Obligations du Client</h2>
            <p>Le Client s'engage à :</p>
            <ul>
              <li>fournir des informations exactes, complètes et exploitables,</li>
              <li>coopérer activement au bon déroulement des prestations,</li>
              <li>disposer des droits nécessaires sur tous les contenus transmis.</li>
            </ul>
            <p>Le Client reste seul responsable de l'usage et du contenu des solutions livrées.</p>
          </section>

          <section className="mb-8">
            <h2>Article 8 – Propriété intellectuelle</h2>
            <p>Les livrables restent la propriété du Syndicat du Code jusqu'au paiement intégral des sommes dues.</p>
            <p>Après règlement complet :</p>
            <ul>
              <li>le Client bénéficie d'un droit d'utilisation conforme au périmètre défini au devis,</li>
              <li>toute reproduction, modification ou revente hors cadre contractuel est interdite sans accord écrit.</li>
            </ul>
            <p>Le Syndicat du Code se réserve le droit de mentionner ses réalisations à des fins de référence.</p>
          </section>

          <section className="mb-8">
            <h2>Article 9 – Maintenance et support</h2>
            <p>Aucune maintenance n'est incluse par défaut.</p>
            <p>Toute prestation de maintenance ou de support fait l'objet :</p>
            <ul>
              <li>soit d'un contrat distinct,</li>
              <li>soit d'une facturation spécifique.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>Article 10 – Responsabilité</h2>
            <p>Le Syndicat du Code est soumis à une obligation de moyens, non de résultat.</p>
            <p>Sa responsabilité ne saurait être engagée pour :</p>
            <ul>
              <li>des dommages indirects, pertes de données ou pertes d'exploitation,</li>
              <li>des défaillances liées à des services tiers,</li>
              <li>une mauvaise utilisation des livrables par le Client.</li>
            </ul>
            <p>En tout état de cause, la responsabilité du Prestataire est plafonnée au montant effectivement payé par le Client.</p>
          </section>

          <section className="mb-8">
            <h2>Article 11 – Résiliation</h2>
            <p>En cas de manquement grave par l'une des parties, le contrat pourra être résilié après mise en demeure restée sans effet.</p>
            <p>Les travaux engagés et sommes déjà versées restent dus au Syndicat du Code.</p>
          </section>

          <section className="mb-8">
            <h2>Article 12 – Confidentialité</h2>
            <p>Les parties s'engagent à une confidentialité stricte sur l'ensemble des informations échangées.</p>
            <p>Cette obligation perdure pendant trois (3) ans après la fin des relations contractuelles.</p>
          </section>

          <section className="mb-8">
            <h2>Article 13 – Données personnelles</h2>
            <p>Le Syndicat du Code respecte la réglementation en vigueur relative à la protection des données personnelles, notamment le RGPD.</p>
          </section>

          <section className="mb-8">
            <h2>Article 14 – Force majeure</h2>
            <p>Aucune partie ne pourra être tenue responsable d'un manquement résultant d'un événement de force majeure reconnu par la jurisprudence française.</p>
          </section>

          <section className="mb-8">
            <h2>Article 15 – Loi applicable et juridiction compétente</h2>
            <p>Les présentes CGV sont régies par le droit français.</p>
            <p>Tout litige relèvera de la compétence exclusive des tribunaux de Troyes, sauf disposition légale impérative contraire.</p>
          </section>

          <p className="text-center mt-12" style={{color: 'var(--text-muted)'}}>
            <em>Dernière mise à jour : 2026</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CGV;
