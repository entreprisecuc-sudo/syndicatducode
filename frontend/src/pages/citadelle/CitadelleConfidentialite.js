/**
 * Politique de Confidentialité (RGPD) — La Citadelle Numérique
 */
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { Helmet } from "react-helmet-async";
import { CITADELLE_COLORS, CITADELLE_PUBLIC_URL } from "@/config/citadelleConstants";

const Section = ({ num, title, children }) => (
  <div className="mb-8">
    <h2 className="font-bold text-lg mb-3 pb-2" style={{ color: CITADELLE_COLORS.blue, borderBottom: `2px solid ${CITADELLE_COLORS.gold}`, fontFamily: "'Montserrat', sans-serif" }}>
      {num}. {title}
    </h2>
    <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#444" }}>
      {children}
    </div>
  </div>
);

const Sub = ({ title, children }) => (
  <div className="mt-4">
    <h3 className="font-semibold mb-1.5" style={{ color: CITADELLE_COLORS.blue }}>{title}</h3>
    {children}
  </div>
);

const TableRow = ({ col1, col2, col3 }) => (
  <tr className="border-b" style={{ borderColor: "#eee" }}>
    <td className="py-2 pr-4 font-medium align-top" style={{ color: CITADELLE_COLORS.blue, minWidth: "160px" }}>{col1}</td>
    <td className="py-2 pr-4 align-top">{col2}</td>
    <td className="py-2 align-top" style={{ color: "#666" }}>{col3}</td>
  </tr>
);

export default function CitadelleConfidentialite() {
  return (
    <CitadelleLayout>
      <Helmet>
        <title>Politique de Confidentialité (RGPD) | La Citadelle Numérique</title>
        <meta name="description" content="Politique de confidentialité de La Citadelle Numérique conforme au RGPD : données collectées, finalités, durée de conservation et exercice de vos droits." />
        <link rel="canonical" href={`${CITADELLE_PUBLIC_URL}/citadelle/confidentialite`} />
      </Helmet>
      <div className="py-14 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: CITADELLE_COLORS.gold }}>La Citadelle Numérique</p>
        <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>Politique de Confidentialité</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Conforme RGPD — Dernière mise à jour : juin 2026 — Version 1.0</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-14" data-testid="confidentialite-content">

        <div className="p-4 rounded-xl mb-10 text-sm" style={{ background: "rgba(201,164,92,0.08)", border: `1px solid ${CITADELLE_COLORS.gold}30`, color: "#555" }}>
          La protection de vos données personnelles est une priorité pour La Citadelle Numérique.
          La présente politique de confidentialité décrit la manière dont <strong>JOERKE.B SASU</strong> collecte,
          utilise et protège vos données, conformément au Règlement Général sur la Protection des Données
          (RGPD — UE 2016/679) et à la loi Informatique et Libertés.
        </div>

        <Section num="1" title="Responsable du traitement">
          <p><strong>Identité :</strong> JOERKE.B SASU</p>
          <p><strong>SIREN :</strong> 892 906 728</p>
          <p><strong>Adresse :</strong> 11 Rue Urbain IV, 10000 Troyes, France</p>
          <p><strong>Email de contact :</strong> lagarde@lacitadellenumerique.fr</p>
          <p><strong>Représentant légal :</strong> Arnaud Becam</p>
        </Section>

        <Section num="2" title="Données collectées">
          <p>Dans le cadre de l'utilisation de la plateforme, nous collectons les catégories de données suivantes :</p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `2px solid ${CITADELLE_COLORS.gold}` }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Catégorie</th>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Données</th>
                  <th className="text-left py-2 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Source</th>
                </tr>
              </thead>
              <tbody>
                <TableRow col1="Identification" col2="Nom, prénom, adresse email, mot de passe (hashé)" col3="Formulaire d'inscription" />
                <TableRow col1="Annonces" col2="Titre, description, prix, captures d'écran, données de trafic" col3="Publication d'annonce" />
                <TableRow col1="Transactions" col2="Montant, statut, historique, identifiants des parties" col3="Processus de vente" />
                <TableRow col1="Paiements" col2="Statut de paiement, ID de session Stripe (pas de données CB)" col3="Stripe (prestataire agréé)" />
                <TableRow col1="Communications" col2="Messages échangés via la messagerie interne" col3="Utilisation de la messagerie" />
                <TableRow col1="Navigation" col2="Adresse IP, type de navigateur, pages visitées, horodatages" col3="Cookies techniques" />
                <TableRow col1="Facturation" col2="SIREN, adresse de facturation (professionnels)" col3="Formulaire de facturation" />
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs italic" style={{ color: "#888" }}>
            Nous ne collectons pas de données sensibles au sens de l'article 9 du RGPD (origines ethniques, opinions politiques, santé, etc.).
          </p>
        </Section>

        <Section num="3" title="Finalités et bases légales du traitement">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `2px solid ${CITADELLE_COLORS.gold}` }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Finalité</th>
                  <th className="text-left py-2 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Base légale (RGPD)</th>
                </tr>
              </thead>
              <tbody>
                <TableRow col1="Gestion des comptes utilisateurs" col2="Exécution du contrat (Art. 6.1.b)" col3="" />
                <TableRow col1="Publication et gestion des annonces" col2="Exécution du contrat (Art. 6.1.b)" col3="" />
                <TableRow col1="Traitement des transactions" col2="Exécution du contrat (Art. 6.1.b)" col3="" />
                <TableRow col1="Envoi d'emails transactionnels" col2="Exécution du contrat (Art. 6.1.b)" col3="" />
                <TableRow col1="Newsletter (avec consentement)" col2="Consentement (Art. 6.1.a)" col3="" />
                <TableRow col1="Prévention de la fraude" col2="Intérêt légitime (Art. 6.1.f)" col3="" />
                <TableRow col1="Obligations légales et comptables" col2="Obligation légale (Art. 6.1.c)" col3="" />
                <TableRow col1="Amélioration du service (analytics)" col2="Intérêt légitime (Art. 6.1.f)" col3="" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section num="4" title="Durée de conservation">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `2px solid ${CITADELLE_COLORS.gold}` }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Données</th>
                  <th className="text-left py-2 font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <TableRow col1="Données de compte actif" col2="Durée de la relation contractuelle + 3 ans" col3="" />
                <TableRow col1="Données de transaction" col2="10 ans (obligation comptable et fiscale)" col3="" />
                <TableRow col1="Messages de messagerie" col2="3 ans après clôture de la transaction" col3="" />
                <TableRow col1="Données de connexion (logs)" col2="12 mois (obligation légale LCEN)" col3="" />
                <TableRow col1="Données de newsletter" col2="Jusqu'au désabonnement + 3 ans" col3="" />
                <TableRow col1="Données post-suppression du compte" col2="3 ans (intérêt légitime — litiges potentiels)" col3="" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section num="5" title="Partage des données">
          <p>Vos données personnelles ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Stripe</strong> — prestataire de paiement (données de transaction, statut de paiement uniquement)</li>
            <li><strong>Prestataires d'hébergement</strong> — pour l'hébergement des données de la plateforme</li>
            <li><strong>Partenaires du Syndicat du Code</strong> — uniquement dans le cadre de l'exécution d'un service commandé, avec votre accord</li>
            <li><strong>Autorités compétentes</strong> — en cas d'obligation légale (réquisition judiciaire, etc.)</li>
          </ul>
          <p className="mt-2">Tout prestataire agissant pour le compte de JOERKE.B est soumis à un accord de sous-traitance conforme au RGPD.</p>
        </Section>

        <Section num="6" title="Transferts hors Union Européenne">
          <p>
            Les données sont hébergées au sein de l'Union Européenne ou dans des pays bénéficiant d'une décision d'adéquation de la Commission européenne.
          </p>
          <p>
            En cas de transfert vers des pays tiers (notamment les États-Unis via Stripe), celui-ci est encadré par les
            Clauses Contractuelles Types approuvées par la Commission européenne.
          </p>
        </Section>

        <Section num="7" title="Vos droits (RGPD)">
          <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
            <li><strong>Droit à l'effacement</strong> — supprimer vos données (« droit à l'oubli »)</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> — s'opposer à certains traitements (notamment à des fins de marketing)</li>
            <li><strong>Droit à la limitation</strong> — limiter le traitement dans certains cas</li>
            <li><strong>Droit de retrait du consentement</strong> — retirer à tout moment un consentement donné (ex. : newsletter)</li>
          </ul>
          <Sub title="Comment exercer vos droits ?">
            <p>Par email : <strong>lagarde@lacitadellenumerique.fr</strong></p>
            <p>Par courrier : JOERKE.B — 11 Rue Urbain IV, 10000 Troyes, France</p>
            <p className="mt-1">Délai de réponse : <strong>30 jours</strong> à compter de la réception de votre demande.</p>
            <p className="mt-2 text-xs" style={{ color: "#888" }}>
              En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la
              <strong> CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) — www.cnil.fr
            </p>
          </Sub>
        </Section>

        <Section num="8" title="Cookies">
          <Sub title="Cookies techniques (strictement nécessaires)">
            <p>La plateforme utilise des cookies techniques indispensables à son fonctionnement (session, authentification).
            Ces cookies ne nécessitent pas votre consentement.</p>
          </Sub>
          <Sub title="Cookies analytiques">
            <p>Des cookies analytiques peuvent être utilisés pour améliorer le service.
            Leur dépôt est soumis à votre consentement préalable.</p>
          </Sub>
          <Sub title="Mesure d'audience interne (sans cookie)">
            <p>Nous réalisons une mesure d'audience interne et anonyme pour comprendre la fréquentation
            de la plateforme (pages consultées, nombre de visiteurs). Cette mesure n'utilise pas de cookie
            publicitaire : votre adresse IP est immédiatement anonymisée (hachée) et n'est jamais conservée
            en clair. Aucune donnée n'est transmise à des tiers à des fins commerciales.</p>
          </Sub>
          <Sub title="Durée de vie des cookies">
            <p>Les cookies de session expirent à la fermeture du navigateur.
            Les cookies persistants ont une durée maximale de 13 mois, conformément aux recommandations de la CNIL.</p>
          </Sub>
        </Section>

        <Section num="9" title="Sécurité des données">
          <p>JOERKE.B met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre
          tout accès non autorisé, perte, altération ou destruction :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chiffrement des connexions (HTTPS/TLS)</li>
            <li>Hashage des mots de passe (bcrypt)</li>
            <li>Accès aux données restreint aux personnes habilitées</li>
            <li>Sauvegardes régulières des données</li>
          </ul>
        </Section>

        <Section num="10" title="Modification de la politique de confidentialité">
          <p>
            La présente politique peut être mise à jour pour refléter des évolutions légales ou des modifications du service.
            La date de mise à jour est indiquée en haut du document.
            Toute modification substantielle sera notifiée par email aux utilisateurs inscrits.
          </p>
        </Section>

        <Section num="11" title="Contact">
          <p>Pour toute question relative à la protection de vos données :</p>
          <p><strong>Email :</strong> lagarde@lacitadellenumerique.fr</p>
          <p><strong>Courrier :</strong> JOERKE.B — 11 Rue Urbain IV, 10000 Troyes, France</p>
          <p className="mt-2">
            Autorité de contrôle compétente : <strong>CNIL</strong> — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — www.cnil.fr
          </p>
        </Section>

        <p className="text-xs text-center mt-10 pb-4" style={{ color: "#bbb" }}>
          Politique de confidentialité v1.0 — JOERKE.B SASU — Juin 2026
        </p>
      </div>
    </CitadelleLayout>
  );
}
