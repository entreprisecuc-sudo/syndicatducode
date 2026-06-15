/**
 * CGU — Conditions Générales d'Utilisation — La Citadelle Numérique
 */
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

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

export default function CitadelleCGU() {
  return (
    <CitadelleLayout>
      <div className="py-14 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: CITADELLE_COLORS.gold }}>La Citadelle Numérique</p>
        <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>Conditions Générales d'Utilisation</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Dernière mise à jour : juin 2026 — Version 1.0</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-14" data-testid="cgu-content">

        <div className="p-4 rounded-xl mb-10 text-sm" style={{ background: "rgba(201,164,92,0.08)", border: `1px solid ${CITADELLE_COLORS.gold}30`, color: "#555" }}>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
          <strong> La Citadelle Numérique</strong>, exploitée par la société <strong>JOERKE.B SASU</strong> (SIREN 892 906 728),
          dont le siège est situé 11 Rue Urbain IV, 10000 Troyes, France.
          En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes CGU.
        </div>

        <Section num="1" title="Définitions">
          <p><strong>Plateforme :</strong> le site internet La Citadelle Numérique accessible à l'adresse lacitadellenumerique.fr.</p>
          <p><strong>Éditeur :</strong> la société JOERKE.B SASU, exploitante de la plateforme.</p>
          <p><strong>Utilisateur :</strong> toute personne physique ou morale accédant à la plateforme.</p>
          <p><strong>Membre :</strong> utilisateur disposant d'un compte enregistré et actif.</p>
          <p><strong>Vendeur :</strong> membre proposant un actif numérique à la vente.</p>
          <p><strong>Acheteur :</strong> membre souhaitant acquérir un actif numérique.</p>
          <p><strong>Annonce :</strong> publication d'un actif numérique à vendre sur la plateforme.</p>
          <p><strong>La Garde :</strong> équipe opérationnelle de La Citadelle Numérique chargée du suivi des transactions et de la médiation.</p>
        </Section>

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
        </Section>

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

        <Section num="5" title="Propriété intellectuelle des contenus publiés">
          <p>L'utilisateur est seul responsable des contenus (textes, images, données) qu'il publie sur la plateforme.
          Il garantit détenir tous les droits nécessaires sur ces contenus.</p>
          <p>En publiant une annonce, l'utilisateur accorde à JOERKE.B une licence d'utilisation non exclusive, mondiale et gratuite
          pour reproduire, afficher et distribuer ces contenus dans le cadre de l'exploitation de la plateforme.</p>
        </Section>

        <Section num="6" title="Responsabilité de la plateforme">
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
        </Section>

        <Section num="7" title="Suspension et suppression de compte">
          <p>JOERKE.B se réserve le droit de suspendre ou supprimer tout compte en cas de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violation des présentes CGU</li>
            <li>Comportement frauduleux avéré</li>
            <li>Inactivité prolongée (plus de 24 mois)</li>
            <li>Demande de l'utilisateur lui-même</li>
          </ul>
          <p className="mt-2">En cas de suspension pour manquement, l'utilisateur sera notifié par email avec un délai de contestation de 7 jours ouvrables.</p>
        </Section>

        <Section num="8" title="Médiation et litiges">
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

        <Section num="9" title="Modification des CGU">
          <p>JOERKE.B se réserve le droit de modifier les présentes CGU à tout moment.
          Les utilisateurs seront informés de toute modification substantielle par email et/ou par notification sur la plateforme.
          La poursuite de l'utilisation de la plateforme après notification vaut acceptation des nouvelles CGU.</p>
        </Section>

        <Section num="10" title="Contact">
          <p>Pour toute question relative aux présentes CGU :</p>
          <p><strong>Email :</strong> lagarde@lacitadellenumerique.fr</p>
          <p><strong>Courrier :</strong> JOERKE.B — 11 Rue Urbain IV, 10000 Troyes, France</p>
        </Section>

        <p className="text-xs text-center mt-10 pb-4" style={{ color: "#bbb" }}>
          CGU v1.0 — JOERKE.B SASU — Juin 2026
        </p>
      </div>
    </CitadelleLayout>
  );
}
