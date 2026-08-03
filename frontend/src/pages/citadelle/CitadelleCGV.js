/**
 * CGV — Conditions Générales de Vente — La Citadelle Numérique
 */
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { Helmet } from "react-helmet-async";
import { CITADELLE_COLORS, CITADELLE_PUBLIC_URL } from "@/config/citadelleConstants";

const Section = ({ num, title, children }) => (
  <div className="mb-8">
    <h2 className="font-bold text-lg mb-3 pb-2" style={{ color: CITADELLE_COLORS.blue, borderBottom: `2px solid ${CITADELLE_COLORS.gold}`, fontFamily: "'Montserrat', sans-serif" }}>
      Article {num} — {title}
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

const InfoBox = ({ children }) => (
  <div className="p-4 rounded-xl my-4 text-sm" style={{ background: "rgba(201,164,92,0.08)", border: `1px solid ${CITADELLE_COLORS.gold}30`, color: "#555" }}>
    {children}
  </div>
);

export default function CitadelleCGV() {
  return (
    <CitadelleLayout>
      <Helmet>
        <title>Conditions Générales de Vente | La Citadelle Numérique</title>
        <meta name="description" content="Conditions Générales de Vente de La Citadelle Numérique : modalités de cession d'actifs numériques, séquestre, paiement sécurisé, commission et garanties." />
        <link rel="canonical" href={`${CITADELLE_PUBLIC_URL}/citadelle/cgv`} />
      </Helmet>
      <div className="py-14 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: CITADELLE_COLORS.gold }}>La Citadelle Numérique</p>
        <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>Conditions Générales de Vente</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Dernière mise à jour : juin 2026 — Version 1.0</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-14" data-testid="cgv-content">

        <InfoBox>
          Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les transactions réalisées via
          la plateforme <strong>La Citadelle Numérique</strong>, exploitée par <strong>JOERKE.B SASU</strong>
          (SIREN 892 906 728) — 11 Rue Urbain IV, 10000 Troyes, France.
          Elles complètent les Conditions Générales d'Utilisation (CGU).
        </InfoBox>

        <Section num="1" title="Objet et champ d'application">
          <p>
            Les présentes CGV régissent les relations commerciales entre JOERKE.B (ci-après « la Plateforme »)
            et ses utilisateurs (vendeurs et acheteurs) dans le cadre :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>De la mise en relation entre vendeurs et acheteurs d'actifs numériques</li>
            <li>De la Transaction Sécurisée proposée par la Plateforme</li>
            <li>Des services complémentaires (évaluation, audit, valorisation, etc.)</li>
          </ul>
          <p>
            La Plateforme agit en qualité d'<strong>intermédiaire de mise en relation</strong>. Elle n'est ni vendeur principal
            ni acquéreur des actifs présentés, sauf dans le cadre du service spécifique d'acquisition pour compte de tiers
            mentionné à l'Article 9.
          </p>
        </Section>

        <Section num="2" title="Actifs éligibles à la vente">
          <Sub title="Actifs autorisés">
            <ul className="list-disc pl-5 space-y-1">
              <li>Sites internet (vitrines, blogs, portfolios)</li>
              <li>Boutiques e-commerce</li>
              <li>Applications SaaS</li>
              <li>Applications web</li>
              <li>Noms de domaine</li>
              <li>Comptes de réseaux sociaux (sous réserve de conformité avec les CGU des plateformes concernées)</li>
              <li>Tout autre actif numérique à caractère commercial</li>
            </ul>
          </Sub>
          <Sub title="Actifs interdits">
            <p>Sont strictement interdits à la vente sur la Plateforme :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Les actifs illicites ou associés à des activités illégales</li>
              <li>Les sites de jeux d'argent non agréés par l'ANJ</li>
              <li>Les sites diffusant des contenus pornographiques non conformes à la réglementation</li>
              <li>Les actifs contrefaits ou portant atteinte aux droits de propriété intellectuelle</li>
              <li>Les faux comptes ou comptes acquis en violation des CGU de plateformes tierces</li>
              <li>Les actifs liés à des activités de phishing, malware ou fraude</li>
            </ul>
          </Sub>
        </Section>

        <Section num="3" title="Publication d'annonces">
          <Sub title="Gratuité de la publication">
            <p>La publication d'une annonce sur La Citadelle Numérique est <strong>entièrement gratuite</strong>.
            Aucun frais n'est appliqué au vendeur pour la création ou le maintien d'une annonce active.</p>
          </Sub>
          <Sub title="Validation administrative">
            <p>Toute annonce est soumise à une validation par l'équipe de La Garde avant publication.
            La Plateforme se réserve le droit de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Refuser une annonce ne respectant pas les présentes CGV</li>
              <li>Demander des informations complémentaires au vendeur</li>
              <li>Suspendre ou supprimer une annonce à tout moment en cas de manquement</li>
            </ul>
            <p className="mt-2">La validation ne constitue pas une garantie de l'exactitude des informations publiées,
            dont le vendeur reste seul responsable.</p>
          </Sub>
          <Sub title="Obligations du vendeur">
            <p>Le vendeur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Être le propriétaire légitime de l'actif proposé à la vente</li>
              <li>Fournir des informations exactes et complètes sur l'actif</li>
              <li>Ne pas publier la même annonce sur plusieurs plateformes concurrentes simultanément sans le signaler</li>
              <li>Honorer toute vente conclue via la Plateforme</li>
            </ul>
          </Sub>
        </Section>

        <Section num="4" title="Modes de vente">
          <Sub title="Prix fixe">
            <p>Le vendeur fixe librement le prix de vente de son actif. L'acheteur peut acquérir l'actif au prix affiché.</p>
          </Sub>
          <Sub title="Prix négociable">
            <p>Le vendeur autorise les acheteurs à soumettre une offre inférieure à son prix affiché.
            Le vendeur conserve le droit d'accepter, refuser ou contre-proposer sans obligation.</p>
          </Sub>
          <Sub title="Offres progressives (enchères)">
            <p>Le vendeur définit un prix minimum de réserve, une date de début et une date de fin.
            Les acheteurs soumettent des offres progressives jusqu'à la clôture.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Une offre retenue à la clôture <strong>engage l'acheteur</strong> si le prix minimum est atteint</li>
              <li>En dessous du prix minimum, aucune transaction n'est conclue</li>
              <li>Le paiement doit intervenir dans les <strong>48 heures</strong> suivant la clôture</li>
              <li>Tout défaut de paiement peut entraîner la suspension du compte acheteur</li>
            </ul>
            <InfoBox>
              ⚠️ Le terme « enchères » utilisé sur la plateforme désigne un mécanisme d'offres progressives entre particuliers et professionnels.
              Il ne constitue pas une vente aux enchères publiques au sens de la loi du 10 juillet 2000.
            </InfoBox>
          </Sub>
        </Section>

        <Section num="5" title="Commission de la Plateforme">
          <p>
            La Plateforme perçoit une commission sur chaque vente aboutie réalisée via La Citadelle Numérique.
            Le taux et le montant minimum de la commission sont indiqués sur la plateforme au moment de la publication de l'annonce
            et peuvent évoluer selon les conditions tarifaires en vigueur.
          </p>
          <p>La commission est à la charge du vendeur et est déduite automatiquement du montant qui lui est reversé
          lors de la libération des fonds.</p>
          <p>Aucune commission n'est prélevée en l'absence de vente aboutie.</p>
          <p className="text-xs italic mt-2" style={{ color: "#888" }}>
            La Plateforme se réserve le droit de modifier ses conditions tarifaires, avec notification préalable aux vendeurs.
          </p>
        </Section>

        <Section num="6" title="Transaction Sécurisée">
          <p>
            Toutes les ventes réalisées via La Citadelle Numérique utilisent obligatoirement le système de <strong>Transaction Sécurisée</strong>.
            Ce système permet de garantir la protection des fonds de l'acheteur et la sécurité du transfert de l'actif.
          </p>
          <Sub title="Processus de la Transaction Sécurisée">
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>L'acheteur effectue le paiement via le prestataire de paiement agréé (Stripe)</li>
              <li>Les fonds sont sécurisés auprès du prestataire de paiement</li>
              <li>Le vendeur transmet les accès et éléments de l'actif à La Garde</li>
              <li>La Garde vérifie la conformité des éléments transmis avec l'annonce</li>
              <li>La Garde transmet les accès vérifiés à l'acheteur</li>
              <li>L'acheteur dispose d'un <strong>délai de vérification de 5 jours ouvrables</strong></li>
              <li>À l'issue du délai ou en cas de validation explicite, les fonds sont libérés au vendeur (déduction faite de la commission)</li>
              <li>En cas de litige dans le délai de vérification, les fonds restent bloqués pendant la médiation</li>
            </ol>
          </Sub>
          <Sub title="Délai de vérification">
            <p>Le délai standard est de <strong>5 jours ouvrables</strong> à compter de la transmission des accès à l'acheteur.
            Ce délai peut être étendu jusqu'à 7 jours sur demande conjointe des deux parties, approuvée par La Garde.
            À l'expiration du délai sans contestation, la transaction est automatiquement validée.</p>
          </Sub>
        </Section>

        <Section num="7" title="Services complémentaires">
          <Sub title="Services vendeurs">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Évaluation Standard</strong> — estimation de la valeur marchande de l'actif</li>
              <li><strong>Évaluation Expert Certifiée</strong> — rapport d'expertise complet signé par un expert</li>
              <li><strong>Valorisation Avant Vente</strong> — optimisation de l'annonce et mise en valeur de l'actif</li>
              <li><strong>Refonte Avant Vente</strong> — intervention technique ou graphique avant publication</li>
            </ul>
          </Sub>
          <Sub title="Services acheteurs">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Audit Avant Achat</strong> — analyse technique et financière de l'actif</li>
              <li><strong>Audit Sécurité</strong> — vérification des vulnérabilités techniques</li>
              <li><strong>Migration Technique</strong> — assistance au transfert et déploiement de l'actif</li>
              <li><strong>Accompagnement Achat</strong> — conseil personnalisé tout au long du processus d'acquisition</li>
            </ul>
          </Sub>
          <Sub title="Nature des prestations">
            <p>Sauf mention contraire explicite, l'ensemble des services proposés par La Citadelle Numérique
            et ses partenaires constituent des <strong>obligations de moyens</strong> et non des obligations de résultat.
            Les évaluations et rapports d'expertise sont des avis professionnels qui n'engagent pas la valeur
            de revente effective de l'actif.</p>
          </Sub>
          <Sub title="Paiement des services">
            <p>Les services à prix fixe sont payables en ligne par carte bancaire via Stripe.
            Les services sur devis font l'objet d'un bon de commande distinct.
            Tout paiement de service est non remboursable une fois la prestation commencée.</p>
          </Sub>
        </Section>

        <Section num="8" title="Exécution des services — Rôle des partenaires">
          <Sub title="Interlocuteur unique">
            <p>
              Quel que soit le service commandé, <strong>JOERKE.B est l'interlocuteur contractuel unique</strong> du client.
              Le client contracte exclusivement avec JOERKE.B et non avec les prestataires intervenant en sous-traitance.
            </p>
          </Sub>
          <Sub title="Intervention des partenaires du Syndicat du Code">
            <p>
              Certaines prestations (évaluations, audits, refontes, migrations, valorisations) peuvent être réalisées,
              en tout ou partie, par des membres certifiés du <strong>Syndicat du Code</strong>, partenaires de JOERKE.B.
            </p>
            <p>
              Ces partenaires sont sélectionnés et supervisés par JOERKE.B. Chacun est lié à JOERKE.B
              par un accord de sous-traitance précisant les niveaux de service, les délais et les responsabilités.
              Le client n'est pas partie à cet accord de sous-traitance.
            </p>
          </Sub>
          <Sub title="Responsabilité">
            <p>
              JOERKE.B demeure responsable de la bonne exécution de la prestation vis-à-vis du client,
              y compris en cas d'intervention d'un partenaire.
              En cas de défaillance d'un partenaire, JOERKE.B s'engage à mettre en œuvre tous les moyens
              raisonnables pour assurer la continuité ou la reprise du service.
            </p>
          </Sub>
        </Section>

        <Section num="9" title="Gestion des litiges">
          <Sub title="Rôle de La Garde">
            <p>En cas de litige entre acheteur et vendeur dans le cadre d'une Transaction Sécurisée,
            La Garde intervient en qualité de médiateur interne. Elle analyse les preuves soumises par chaque partie
            et propose une résolution amiable.</p>
          </Sub>
          <Sub title="Preuves recevables">
            <ul className="list-disc pl-5 space-y-1">
              <li>Captures d'écran horodatées</li>
              <li>Accès aux outils de mesure (analytics, hébergeur, CMS)</li>
              <li>Échanges écrits via la messagerie de la plateforme</li>
              <li>Rapports d'audit réalisés dans le cadre d'un service Citadelle</li>
            </ul>
          </Sub>
          <Sub title="Délais de traitement d'un litige">
            <ol className="list-decimal pl-5 space-y-1">
              <li>Ouverture du litige par l'acheteur (dans le délai de vérification)</li>
              <li>Notification du vendeur (J+2 maximum)</li>
              <li>Collecte des preuves des deux parties (jusqu'à J+7)</li>
              <li>Décision de La Garde (J+8 à J+10)</li>
              <li>Libération des fonds ou remboursement selon décision (J+11)</li>
            </ol>
          </Sub>
          <Sub title="Médiation externe">
            <p>En cas d'insatisfaction avec la décision de La Garde, l'utilisateur consommateur peut
            recourir à un médiateur de la consommation agréé. Les coordonnées sont disponibles sur demande
            à lagarde@lacitadellenumerique.fr.</p>
          </Sub>
        </Section>

        <Section num="10" title="Service d'acquisition pour compte">
          <Sub title="Présentation">
            <p>
              Pour les transactions dont le montant dépasse un seuil défini par la Plateforme,
              La Citadelle Numérique peut proposer un <strong>service d'acquisition pour compte</strong>.
              Dans ce cadre, JOERKE.B procède à l'acquisition de l'actif <strong>en son nom propre, pour le compte de l'acheteur</strong>,
              puis le lui rétrocède après vérification complète.
            </p>
          </Sub>
          <Sub title="Conditions d'accès">
            <p>Ce service est conditionné à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La signature préalable d'un contrat spécifique par toutes les parties (signature électronique)</li>
              <li>Le règlement intégral par l'acheteur par virement bancaire avant toute acquisition</li>
              <li>La réalisation optionnelle d'une analyse de vente approfondie à la charge du vendeur</li>
              <li>L'accord explicite du vendeur sur les conditions de cession</li>
            </ul>
          </Sub>
          <Sub title="Processus">
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Signature du contrat d'acquisition pour compte par l'acheteur et JOERKE.B</li>
              <li>Règlement de l'intégralité du montant par l'acheteur par virement (RIB fourni)</li>
              <li>Acquisition de l'actif par JOERKE.B auprès du vendeur</li>
              <li>Vérification complète de l'actif par La Garde et ses partenaires techniques</li>
              <li>Rétrocession de l'actif à l'acheteur après validation</li>
            </ol>
          </Sub>
          <Sub title="Responsabilités et limitations">
            <p>
              JOERKE.B s'engage à réaliser toutes les vérifications raisonnables avant la rétrocession de l'actif.
              Cette prestation constitue une <strong>obligation de moyens</strong>.
              JOERKE.B ne saurait être tenue responsable de vices cachés non détectables lors d'une vérification menée
              avec diligence professionnelle, ni des évolutions de l'actif postérieures à la rétrocession.
            </p>
            <p>
              En cas de découverte d'une anomalie majeure lors de la vérification, JOERKE.B se réserve le droit
              de suspendre l'acquisition et d'en informer l'acheteur avant tout versement au vendeur.
            </p>
          </Sub>
        </Section>

        <Section num="11" title="Droit de rétractation">
          <p>
            Conformément à l'article L221-28 du Code de la consommation, <strong>le droit de rétractation ne s'applique pas</strong> aux
            services pleinement exécutés avant la fin du délai de rétractation, ni aux contenus numériques
            dont l'exécution a commencé avec l'accord exprès du consommateur.
          </p>
          <p>
            Par conséquent, aucun droit de rétractation n'est applicable aux services de La Citadelle Numérique
            dont l'exécution a commencé avec l'accord du client, ni aux transactions d'actifs numériques
            une fois les accès transmis à l'acheteur.
          </p>
        </Section>

        <Section num="12" title="Responsabilité du vendeur">
          <p>Le vendeur est seul responsable de l'exactitude des informations contenues dans son annonce.
          En cas de litige résultant d'informations inexactes ou trompeuses, le vendeur s'engage à indemniser
          l'acheteur et à tenir la Plateforme indemne de toute réclamation.</p>
        </Section>

        <Section num="12" title="Droit applicable">
          <p>Les présentes CGV sont soumises au droit français.
          En cas de litige non résolu amiablement, les tribunaux du ressort du siège social de JOERKE.B (Troyes) sont compétents,
          sauf dispositions légales impératives contraires applicables aux consommateurs.</p>
        </Section>

        <p className="text-xs text-center mt-10 pb-4" style={{ color: "#bbb" }}>
          CGV v1.0 — JOERKE.B SASU — Juin 2026
        </p>
      </div>
    </CitadelleLayout>
  );
}
