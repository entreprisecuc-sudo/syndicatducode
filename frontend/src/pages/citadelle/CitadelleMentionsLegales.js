/**
 * Mentions Légales — La Citadelle Numérique
 */
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { Helmet } from "react-helmet-async";
import { CITADELLE_COLORS, CITADELLE_PUBLIC_URL } from "@/config/citadelleConstants";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-bold text-lg mb-3 pb-2" style={{ color: CITADELLE_COLORS.blue, borderBottom: `2px solid ${CITADELLE_COLORS.gold}`, fontFamily: "'Montserrat', sans-serif" }}>
      {title}
    </h2>
    <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#444" }}>
      {children}
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex flex-wrap gap-2">
    <span className="font-semibold w-48 flex-shrink-0" style={{ color: CITADELLE_COLORS.blue }}>{label} :</span>
    <span>{value}</span>
  </div>
);

export default function CitadelleMentionsLegales() {
  return (
    <CitadelleLayout>
      <Helmet>
        <title>Mentions Légales | La Citadelle Numérique</title>
        <meta name="description" content="Mentions légales de La Citadelle Numérique : éditeur du site, hébergeur, propriété intellectuelle et coordonnées de l'entreprise." />
        <link rel="canonical" href={`${CITADELLE_PUBLIC_URL}/citadelle/mentions-legales`} />
      </Helmet>
      {/* En-tête */}
      <div className="py-14 text-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: CITADELLE_COLORS.gold }}>La Citadelle Numérique</p>
        <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "'Montserrat', sans-serif" }}>Mentions Légales</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Dernière mise à jour : juin 2026</p>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-14" data-testid="mentions-legales-content">

        <Section title="1. Éditeur du site">
          <Row label="Raison sociale" value="JOERKE.B" />
          <Row label="Forme juridique" value="SASU (Société par Actions Simplifiée Unipersonnelle)" />
          <Row label="Capital social" value="À compléter" />
          <Row label="SIREN" value="892 906 728" />
          <Row label="SIRET" value="892 906 728 00019" />
          <Row label="RCS" value="892 906 728 R.C.S. Troyes" />
          <Row label="TVA intracommunautaire" value="FR12892906728" />
          <Row label="Siège social" value="11 Rue Urbain IV, 10000 Troyes, France" />
          <Row label="Président" value="Arnaud Becam" />
          <Row label="Directeur de publication" value="Arnaud Becam" />
          <Row label="Email" value="lagarde@lacitadellenumerique.fr" />
          <Row label="Site web" value="lacitadellenumerique.fr" />
        </Section>

        <Section title="2. Hébergement">
          <p>Le site La Citadelle Numérique est hébergé par :</p>
          <Row label="Hébergeur" value="Emergent Labs Inc." />
          <Row label="Adresse" value="À compléter selon infrastructure de production" />
          <p className="mt-2 text-xs italic" style={{ color: "#888" }}>En cas de changement d'hébergeur, cette mention sera mise à jour dans les meilleurs délais.</p>
        </Section>

        <Section title="3. Activité de la plateforme">
          <p>
            La Citadelle Numérique est une plateforme en ligne spécialisée dans l'intermédiation pour l'achat et la vente d'actifs numériques
            (sites internet, SaaS, e-commerce, applications web, blogs, noms de domaine, comptes de réseaux sociaux).
          </p>
          <p>
            La société JOERKE.B agit en qualité d'intermédiaire de mise en relation. Elle n'est ni acheteur ni vendeur des actifs présentés sur la plateforme,
            sauf dans le cadre de services spécifiques mentionnés dans les Conditions Générales de Vente.
          </p>
        </Section>

        <Section title="4. Propriété intellectuelle">
          <p>
            L'ensemble des éléments constituant le site La Citadelle Numérique (structure, textes, graphismes, logo, icônes, images, sons)
            est la propriété exclusive de JOERKE.B ou fait l'objet d'une autorisation d'utilisation.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, de ces éléments,
            quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de JOERKE.B.
          </p>
          <p>
            Les contenus publiés par les utilisateurs (annonces, descriptions, images) restent la propriété de leurs auteurs.
            En publiant sur la plateforme, l'utilisateur accorde à JOERKE.B une licence d'utilisation non exclusive pour les besoins du service.
          </p>
        </Section>

        <Section title="5. Responsabilité">
          <p>
            JOERKE.B ne saurait être tenue responsable des dommages directs ou indirects causés au matériel de l'utilisateur
            lors de l'accès au site, résultant notamment de l'utilisation d'un matériel non conforme ou de l'apparition d'un bug.
          </p>
          <p>
            La plateforme agit en qualité d'hébergeur au sens de la loi n°2004-575 du 21 juin 2004 (LCEN) pour les contenus publiés par les utilisateurs.
            À ce titre, sa responsabilité ne peut être engagée qu'en cas de défaut de retrait d'un contenu manifestement illicite dûment notifié.
          </p>
        </Section>

        <Section title="6. Liens hypertextes">
          <p>
            Le site peut contenir des liens vers des sites tiers. JOERKE.B n'est pas responsable du contenu de ces sites
            et ne saurait être tenue responsable des dommages résultant de leur consultation.
          </p>
        </Section>

        <Section title="7. Droit applicable et juridiction compétente">
          <p>
            Les présentes mentions légales sont soumises au droit français.
            En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>Pour toute question relative aux présentes mentions légales :</p>
          <Row label="Email" value="lagarde@lacitadellenumerique.fr" />
          <Row label="Adresse postale" value="JOERKE.B — 11 Rue Urbain IV, 10000 Troyes, France" />
        </Section>

        <p className="text-xs text-center mt-10 pb-4" style={{ color: "#bbb" }}>
          JOERKE.B SASU — SIREN 892 906 728 — Tous droits réservés © 2026
        </p>
      </div>
    </CitadelleLayout>
  );
}
