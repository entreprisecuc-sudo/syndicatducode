/**
 * CGU — Conditions Générales d'Utilisation — La Citadelle Numérique
 * Version 2.0 — Juillet 2026
 * Ajout : Transaction Sécurisée, Séquestre, Commission, Stripe Connect, KYC
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

const Highlight = ({ children }) => (
  <div className="p-3 rounded-lg mt-2 text-sm" style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.2)" }}>
    {children}
  </div>
);

export default function CitadelleCGU() {
  return (
    <CitadelleLayout>
      <Helmet>
        <title>Conditions Générales d'Utilisation | La Citadelle Numérique</title>
        <meta name="description" content="Conditions Générales d'Utilisation de La Citadelle Numérique : accès à la plateforme, transaction sécurisée, séquestre, commission, Stripe Connect et vérification KYC." />
        <link rel="canonical" href={`${CITADELLE_PUBLIC_URL}/citadelle/cgu`} />
      </Helmet>
      <div className="py-14 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: CITADELLE_COLORS.gold }}>La Citadelle Numérique</p>
        <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>Conditions Générales d'Utilisation</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Dernière mise à jour : juillet 2026 — Version 2.0</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-14" data-testid="cgu-content">

        <div className="p-4 rounded-xl mb-6 text-sm" style={{ background: "rgba(201,164,92,0.08)", border: `1px solid ${CITADELLE_COLORS.gold}30`, color: "#555" }}>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
          <strong> La Citadelle Numérique</strong>, exploitée par la société <strong>JOERKE.B SASU</strong> (SIREN 892 906 728),
          dont le siège est situé 11 Rue Urbain IV, 10000 Troyes, France.
          En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes CGU.
        </div>

        {/* Bandeau changements v2.0 */}
        <div className="p-3 rounded-xl mb-10 text-xs" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", color: "#2563eb" }}>
          <strong>Mise à jour v2.0 (juillet 2026) :</strong> Ajout des articles 5, 6 et 7 relatifs à la Transaction Sécurisée, au mécanisme de séquestre, à la commission de la plateforme, à l'utilisation de Stripe Connect et à la vérification d'identité (KYC).
        </div>

        {/* ── Section 1 ── */}
        <Section num="1" title="Définitions">
          <p><strong>Plateforme :</strong> le site internet La Citadelle Numérique accessible à l'adresse lacitadellenumerique.fr.</p>
          <p><strong>Éditeur :</strong> la société JOERKE.B SASU, exploitante de la plateforme.</p>
          <p><strong>Utilisateur :</strong> toute personne physique ou morale accédant à la plateforme.</p>
          <p><strong>Membre :</strong> utilisateur disposant d'un compte enregistré et actif.</p>
          <p><strong>Vendeur :</strong> membre proposant un actif numérique à la vente.</p>
          <p><strong>Acheteur :</strong> membre souhaitant acquérir un actif numérique.</p>
          <p><strong>Annonce :</strong> publication d'un actif numérique à vendre sur la plateforme.</p>
          <p><strong>La Garde :</strong> équipe opérationnelle de La Citadelle Numérique chargée du suivi des transactions et de la médiation.</p>
          <p><strong>Transaction Sécurisée :</strong> mécanisme d'intermédiation financière par lequel les fonds de l'acheteur sont retenus en séquestre sur le compte de la plateforme jusqu'à validation de la transaction.</p>
          <p><strong>Séquestre :</strong> rétention temporaire des fonds de l'acheteur sur le compte de paiement de la plateforme (géré par Stripe), pendant la vérification des accès et la confirmation de la vente.</p>
          <p><strong>Commission :</strong> rémunération prélevée par la plateforme sur le montant total de chaque vente finalisée, conformément à l'article 6.</p>
          <p><strong>Stripe / Stripe Connect :</strong> prestataire de services de paiement agréé (Stripe Payments Europe Ltd, 1 Grand Canal Street Lower, Dublin 2, Irlande) utilisé par la plateforme pour le traitement des paiements et les virements aux vendeurs.</p>
          <p><strong>Compte Connect :</strong> compte Stripe Express créé au nom du vendeur pour permettre la réception automatique des fonds à l'issue de chaque vente.</p>
          <p><strong>KYC (Know Your Customer) :</strong> procédure de vérification d'identité imposée par la réglementation anti-blanchiment (LCB-FT) pour les vendeurs recevant des fonds via la plateforme.</p>
        </Section>

        {/* ── Section 2 ── */}
        <Section num="2" title="Accès à la plateforme">
          <p>L'accès à la plateforme est libre et gratuit pour la consultation des annonces publiées.</p>
          <p>La création d'un compte est nécessaire pour publier une annonce, contacter un vendeur ou réaliser une transaction.</p>
          <Sub title="Conditions d'accès">
            <p>Pour créer un compte, l'utilisateur doit :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Être âgé d'au moins <strong>18 ans</strong> (majorité légale pour contracter en France)</li>
              <li>Disposer d'une adresse email valide</li>
              <li>Accepter sans réserve les présentes CGU et les Conditions Générales de Vente</li>
              <li>Ne pas faire l'objet d'une suspension ou exclusion antérieure de la plateforme</li>
            </ul>
          </Sub>
          <Sub title="Obligations supplémentaires du vendeur">
            <p>Tout membre souhaitant vendre un actif numérique et recevoir des fonds via la plateforme doit, en outre :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Fournir ses <strong>date de naissance</strong> et <strong>numéro de téléphone</strong> dans son espace membre</li>
              <li>Compléter le processus de <strong>vérification d'identité (KYC)</strong> via Stripe Connect (article 7)</li>
              <li>Accepter les <a href="https://stripe.com/fr/connect-account/legal" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: CITADELLE_COLORS.blue }}>Conditions d'utilisation de Stripe Connect</a></li>
            </ul>
          </Sub>
        </Section>

        {/* ── Section 3 ── */}
        <Section num="3" title="Création et gestion du compte">
          <Sub title="Inscription">
            <p>L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription.
            Tout compte créé avec de fausses informations pourra être suspendu sans préavis.</p>
          </Sub>
          <Sub title="Sécurité du compte">
            <p>L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.
            Toute utilisation du compte effectuée avec ses identifiants est présumée faite par l'utilisateur lui-même.
            En cas de compromission, l'utilisateur doit contacter immédiatement La Garde à lagarde@lacitadellenumerique.fr.</p>
          </Sub>
          <Sub title="Compte unique">
            <p>Chaque utilisateur ne peut détenir qu'un seul compte actif. La création de comptes multiples est interdite
            et peut entraîner la suppression de l'ensemble des comptes concernés.</p>
          </Sub>
        </Section>

        {/* ── Section 4 ── */}
        <Section num="4" title="Obligations des utilisateurs">
          <p>L'utilisateur s'engage à :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utiliser la plateforme conformément à son objet et aux présentes CGU</li>
            <li>Ne pas publier de contenu illicite, trompeur, diffamatoire ou portant atteinte à des droits tiers</li>
            <li>Ne pas tenter de contourner les mécanismes de transaction de la plateforme (ex. : communiquer des coordonnées directes dans les messages pour finaliser une vente hors plateforme)</li>
            <li>Ne pas utiliser de dispositifs automatisés (robots, scrapers) sans autorisation écrite de l'éditeur</li>
            <li>Respecter les droits de propriété intellectuelle de la plateforme et des autres utilisateurs</li>
            <li>Signaler tout comportement suspect ou contenu illicite à La Garde</li>
          </ul>
          <Sub title="Interdictions spécifiques">
            <p>Sont strictement interdits sur la plateforme :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>La vente d'actifs illicites ou contrefaits</li>
              <li>La fraude, l'usurpation d'identité ou la manipulation de prix</li>
              <li>Le harcèlement, les menaces ou tout comportement abusif envers d'autres membres</li>
              <li>La publication de fausses informations sur un actif proposé à la vente</li>
              <li>Toute tentative de détournement de la Transaction Sécurisée</li>
            </ul>
          </Sub>
        </Section>

        {/* ── Section 5 (NOUVEAU) ── */}
        <Section num="5" title="Transaction Sécurisée et Mécanisme de Séquestre">
          <p>La Citadelle Numérique fonctionne exclusivement selon le modèle de la <strong>Transaction Sécurisée</strong> :
          aucune vente de gré à gré hors plateforme n'est autorisée entre membres inscrits.</p>

          <Sub title="Fonctionnement du séquestre">
            <p>Lorsque l'acheteur procède au paiement, les fonds sont retenus sur le compte de paiement de la plateforme
            (géré par Stripe) et ne sont pas immédiatement versés au vendeur. Ce mécanisme de séquestre garantit la protection
            des deux parties pendant la phase de vérification.</p>
            <Highlight>
              Les fonds ne sont libérés en faveur du vendeur <strong>qu'après validation complète</strong> de la transaction
              par La Garde (vérification des accès transmis, absence de litige, confirmation de l'acheteur).
            </Highlight>
          </Sub>

          <Sub title="Étapes de la Transaction Sécurisée">
            <ol className="list-decimal pl-5 space-y-1 mt-1">
              <li><strong>Offre :</strong> l'acheteur soumet une offre, le vendeur accepte (ou contre-propose)</li>
              <li><strong>Paiement :</strong> l'acheteur règle le montant total via Stripe Checkout — les fonds entrent en séquestre</li>
              <li><strong>Transmission des accès :</strong> le vendeur transmet les identifiants/codes d'accès à l'actif via la messagerie sécurisée</li>
              <li><strong>Vérification :</strong> La Garde vérifie la conformité des accès transmis</li>
              <li><strong>Finalisation :</strong> La Garde finalise la vente, libère les fonds et les vire au vendeur (déduction de la commission)</li>
            </ol>
          </Sub>

          <Sub title="Délais de traitement">
            <p>La Garde s'engage à traiter les demandes de vérification dans un délai de <strong>3 jours ouvrables</strong>
            suivant la transmission des accès par le vendeur. Ce délai peut être allongé en cas de litige ou de vérification complémentaire requise.</p>
          </Sub>

          <Sub title="Litiges et remboursements">
            <p>En cas de non-conformité des accès ou de litige déclaré par l'acheteur, La Garde peut :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Ouvrir une procédure de médiation entre les parties</li>
              <li>Ordonner le remboursement total de l'acheteur si la non-conformité est avérée</li>
              <li>Prélever des frais d'annulation selon le barème en vigueur (disponible dans les CGV)</li>
            </ul>
          </Sub>
        </Section>

        {/* ── Section 6 (NOUVEAU) ── */}
        <Section num="6" title="Commission et Frais de la Plateforme">
          <Sub title="Commission sur ventes">
            <Highlight>
              <p>La plateforme prélève une <strong>commission de 5 % du montant total de la vente</strong>,
              avec un <strong>minimum de 49 € par transaction</strong>.
              Cette commission est automatiquement déduite du montant versé au vendeur lors de la finalisation.</p>
            </Highlight>
            <p className="mt-2">Exemple : pour une vente de 1 000 €, la commission prélevée est de 50 €
            et le vendeur reçoit 950 €.</p>
          </Sub>

          <Sub title="Frais de paiement Stripe">
            <p>Les frais de traitement bancaire appliqués par Stripe (environ 1,4 % + 0,25 € pour les cartes européennes)
            sont inclus dans la commission plateforme et ne sont pas refacturés séparément à l'acheteur.</p>
          </Sub>

          <Sub title="Frais d'annulation">
            <p>En cas d'annulation d'une transaction après paiement, des frais d'annulation peuvent être applicables,
            selon le stade de la transaction et les conditions définies dans les Conditions Générales de Vente (CGV).
            Ces frais sont indiqués à l'acheteur préalablement à toute confirmation d'annulation.</p>
          </Sub>

          <Sub title="Facturation">
            <p>Un reçu de paiement est automatiquement envoyé par email à l'acheteur après chaque transaction finalisée.
            Le vendeur reçoit un relevé indiquant le montant brut, la commission prélevée et le montant net virement.</p>
          </Sub>
        </Section>

        {/* ── Section 7 (NOUVEAU) ── */}
        <Section num="7" title="Vérification d'Identité (KYC) et Stripe Connect">
          <p>Conformément aux obligations légales en matière de lutte contre le blanchiment de capitaux et le financement
          du terrorisme (LCB-FT — Directive européenne 2015/849/UE et loi française), la plateforme est tenue de vérifier
          l'identité des vendeurs recevant des fonds.</p>

          <Sub title="Données collectées par la plateforme">
            <p>Lors de la création ou de la mise à jour du profil vendeur, la plateforme collecte :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Prénom et nom</li>
              <li>Date de naissance (âge minimum 18 ans)</li>
              <li>Numéro de téléphone (format international)</li>
              <li>Adresse email</li>
            </ul>
            <p className="mt-2">Ces données sont utilisées <strong>exclusivement</strong> pour le pré-remplissage du formulaire
            d'onboarding Stripe Connect et ne sont pas communiquées à des tiers sans consentement explicite.</p>
          </Sub>

          <Sub title="Stripe Connect Express">
            <p>Pour recevoir des virements automatiques, chaque vendeur doit créer un
            <strong> Compte Connect Stripe Express</strong> en cliquant sur « Connecter mon compte Stripe »
            dans l'espace membre (onglet Paiements). Ce processus est géré directement par Stripe et implique :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>La vérification d'identité (pièce d'identité officielle) par les équipes Stripe</li>
              <li>La fourniture d'un RIB/IBAN pour les virements sortants</li>
              <li>L'acceptation des <a href="https://stripe.com/fr/connect-account/legal" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: CITADELLE_COLORS.blue }}>Conditions d'utilisation de Stripe Connect</a></li>
            </ul>
            <Highlight>
              La Citadelle Numérique <strong>ne collecte jamais</strong> de pièces d'identité directement.
              Toute la vérification documentaire est assurée par Stripe, prestataire de services de paiement agréé
              par la Banque Centrale d'Irlande (référence E00008990).
            </Highlight>
          </Sub>

          <Sub title="Délai de virement">
            <p>Après finalisation de la transaction par La Garde :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Compte Connect actif et vérifié :</strong> virement automatique instantané vers le compte Stripe Express du vendeur. Les fonds sont disponibles sur le compte bancaire du vendeur sous <strong>2 à 7 jours ouvrables</strong> selon sa banque.</li>
              <li><strong>Compte Connect en cours de vérification ou absent :</strong> virement manuel traité par La Garde dans un délai de <strong>5 à 10 jours ouvrables</strong>. Un email de confirmation est envoyé au vendeur.</li>
            </ul>
          </Sub>

          <Sub title="Compte Connect non créé">
            <p>L'absence de Compte Connect ne bloque pas la vente, mais impose un traitement manuel des virements.
            La plateforme décline toute responsabilité pour les retards de virement liés à l'absence ou à la non-vérification
            du Compte Connect du vendeur.</p>
          </Sub>
        </Section>

        {/* ── Section 8 (ex-5) ── */}
        <Section num="8" title="Propriété intellectuelle des contenus publiés">
          <p>L'utilisateur est seul responsable des contenus (textes, images, données) qu'il publie sur la plateforme.
          Il garantit détenir tous les droits nécessaires sur ces contenus.</p>
          <p>En publiant une annonce, l'utilisateur accorde à JOERKE.B une licence d'utilisation non exclusive, mondiale et gratuite
          pour reproduire, afficher et distribuer ces contenus dans le cadre de l'exploitation de la plateforme.</p>
        </Section>

        {/* ── Section 9 (ex-6) ── */}
        <Section num="9" title="Responsabilité de la plateforme">
          <Sub title="Statut d'hébergeur (LCEN)">
            <p>Conformément à la loi n°2004-575 du 21 juin 2004, La Citadelle Numérique agit en qualité d'hébergeur
            pour les contenus publiés par ses utilisateurs. Sa responsabilité ne peut être engagée qu'en cas
            de défaut de retrait d'un contenu manifestement illicite après notification valide.</p>
          </Sub>
          <Sub title="Disponibilité du service">
            <p>JOERKE.B s'efforce d'assurer la disponibilité permanente de la plateforme mais ne saurait être tenue
            responsable des interruptions liées à des opérations de maintenance, à des événements de force majeure
            ou à des défaillances techniques indépendantes de sa volonté.</p>
          </Sub>
          <Sub title="Prestataire de paiement">
            <p>La plateforme délègue la gestion des paiements à Stripe Inc. JOERKE.B ne peut être tenue responsable des
            incidents techniques, blocages ou retards directement imputables à Stripe ou à son infrastructure de paiement.</p>
          </Sub>
        </Section>

        {/* ── Section 10 (ex-7) ── */}
        <Section num="10" title="Suspension et suppression de compte">
          <p>JOERKE.B se réserve le droit de suspendre ou supprimer tout compte en cas de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violation des présentes CGU</li>
            <li>Comportement frauduleux avéré</li>
            <li>Fourniture de fausses informations lors de la procédure KYC</li>
            <li>Inactivité prolongée (plus de 24 mois)</li>
            <li>Demande de l'utilisateur lui-même</li>
          </ul>
          <p className="mt-2">En cas de suspension pour manquement, l'utilisateur sera notifié par email avec un délai de contestation de 7 jours ouvrables.</p>
          <p className="mt-2">La suppression d'un compte ne donne pas lieu à remboursement des transactions en cours, lesquelles sont traitées selon les CGV en vigueur.</p>
        </Section>

        {/* ── Section 11 (ex-8) ── */}
        <Section num="11" title="Médiation et litiges">
          <Sub title="Médiation interne — La Garde">
            <p>En cas de litige entre utilisateurs, La Garde intervient en qualité de médiateur interne.
            Son intervention ne constitue pas un arbitrage judiciaire et ses décisions ne sont pas exécutoires
            au sens juridique, sauf accord exprès des deux parties.</p>
          </Sub>
          <Sub title="Médiation de la consommation (B2C)">
            <p>Conformément à l'article L612-1 du Code de la consommation, les utilisateurs consommateurs
            peuvent recourir gratuitement à un médiateur de la consommation en cas de litige non résolu avec la plateforme.
            Les coordonnées du médiateur agréé sont disponibles sur demande à lagarde@lacitadellenumerique.fr.</p>
          </Sub>
          <Sub title="Droit applicable">
            <p>Les présentes CGU sont soumises au droit français. En cas de litige non résolu par voie amiable,
            les tribunaux du ressort de Troyes sont compétents, sauf disposition légale contraire applicable aux consommateurs.</p>
          </Sub>
        </Section>

        {/* ── Section 12 (ex-9) ── */}
        <Section num="12" title="Modification des CGU">
          <p>JOERKE.B se réserve le droit de modifier les présentes CGU à tout moment.
          Les utilisateurs seront informés de toute modification substantielle par email et/ou par notification sur la plateforme.
          La poursuite de l'utilisation de la plateforme après notification vaut acceptation des nouvelles CGU.</p>
        </Section>

        {/* ── Section 13 (ex-10) ── */}
        <Section num="13" title="Contact">
          <p>Pour toute question relative aux présentes CGU :</p>
          <p><strong>Email :</strong> lagarde@lacitadellenumerique.fr</p>
          <p><strong>Courrier :</strong> JOERKE.B — 11 Rue Urbain IV, 10000 Troyes, France</p>
        </Section>

        <p className="text-xs text-center mt-10 pb-4" style={{ color: "#bbb" }}>
          CGU v2.0 — JOERKE.B SASU — Juillet 2026
        </p>
      </div>
    </CitadelleLayout>
  );
}
