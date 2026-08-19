/**
 * Catalogue EN des services (contenu stocké en BDD en français).
 * Indexé par le TITRE FRANÇAIS (identifiant stable, les services n'ont pas de slug exposé).
 * Utilisé uniquement quand la langue = "en" ; repli sur la valeur BDD si absent.
 */

export const SERVICE_CATALOG_EN = {
  "Estimation Standard": {
    title: "Standard Estimate",
    short_description: "Get a first estimate of your site's value within 48h.",
    description: `Who is it for?
Sellers who want a first estimate of their site's value.

What the service includes:
• Quick site analysis
• Value estimate
• Summary PDF report
• Recommended price range`,
  },
  "Estimation Expert": {
    title: "Expert Estimate",
    short_description: "Full, detailed valuation with a professional PDF report.",
    description: `Who is it for?
Sellers who want an in-depth valuation before listing.

What the service includes:
• Full site analysis
• Traffic study
• SEO study
• Revenue analysis
• Competition analysis
• Detailed valuation
• Complete PDF report
• Improvement advice before listing`,
  },
  "Vérification La Garde": {
    title: "La Garde Verification",
    short_description: "Get the \"Verified by La Garde\" badge on your listing.",
    description: `Who is it for?
Sellers who want to strengthen the credibility of their listing.

What the service includes:
• Seller identity verification
• Ownership rights verification
• Declared revenue check
• Main access verification
• "Verified by La Garde" badge on the listing

This badge reassures buyers and speeds up the sale.`,
  },
  "Accompagnement Vente Premium": {
    title: "Premium Sale Support",
    short_description: "Be supported at every step, from the file to signing.",
    description: `Who is it for?
Sellers who want to maximize their chances of selling quickly.

What the service includes:
• Sale file preparation
• Listing optimization
• Pricing advice
• Seller support
• Buyer replies
• Assistance until signing`,
  },
  "Vente aux enchères": {
    title: "Auction Sale",
    short_description: "Auction your site with real-time bid management.",
    description: `Who is it for?
Sellers who want to maximize their sale price.

What the service includes:
• Site put up for auction
• Automatic bid management
• Real-time notifications
• Complete bid history

Pricing:
• Commission: 5% on the sale
• Featured option: €29

All auctions are protected by La Citadelle's Secure Transaction.`,
    price_label: "5% commission",
  },
  "Audit SEO": {
    title: "SEO Audit",
    short_description: "Assess a site's SEO potential with a prioritized action plan.",
    description: `Who is it for?
Buyers and sellers who want to assess a site's SEO potential.

What the service includes:
• Full technical audit
• Core Web Vitals analysis
• Backlinks analysis
• Keyword study
• SEO error identification
• Prioritized action plan`,
  },
  "Audit Sécurité": {
    title: "Security Audit",
    short_description: "Check a site's security before acquisition.",
    description: `Who is it for?
Buyers who want to check a site's security before acquiring it.

What the service includes:
• HTTPS and certificates verification
• Known vulnerabilities analysis
• CMS and plugins audit
• Backups verification
• Server configuration analysis
• Detailed security report

Risk levels: 🟢 Low — 🟠 Medium — 🔴 High — ⚫ Critical`,
  },
  "Migration de site": {
    title: "Site Migration",
    short_description: "Complete and secure transfer of your acquisition.",
    description: `Who is it for?
Buyers who want a complete and secure transfer of their acquisition.

What the service includes:
• Domain name migration
• Hosting migration
• Database migration
• Email migration
• Third-party tools migration
• Post-transfer checks
• Go-live and confirmation

Available option:
• Urgent migration: +€100`,
    price_label: "From €299",
  },
  "Refonte / Optimisation": {
    title: "Redesign / Optimization",
    short_description: "Improve a site's performance and design.",
    description: `Who is it for?
Buyers and sellers who want to improve a site's performance.

What the service includes:
• Performance optimization
• Visual modernization
• User experience improvement
• Technical fixes
• On-page SEO optimization

Carried out by the developers of the Syndicat du Code.
Preliminary study then personalized quote.`,
    price_label: "From €499",
  },
  "Transaction Sécurisée Premium": {
    title: "Premium Secure Transaction",
    short_description: "Protect your purchase or sale with our escrow and La Garde.",
    description: `Who is it for?
Buyers and sellers who want to secure 100% of their transaction.

What the service includes:
• Complete transaction management
• Seller and buyer verification
• Electronic signature
• Transferred access control
• Payment security via Stripe
• Assistance by La Garde until full transfer

Pricing:
• Commission: 5% of the transaction amount
• Minimum: €49

Mandatory service for all sales made on La Citadelle Numérique.`,
    price_label: "5% (min. €49)",
  },
  "Dépôt d'annonce": {
    title: "Listing Publication",
    short_description: "Create and publish your website sale listing for free.",
    description: `Create and publish your website sale listing entirely for free.
Your listing is visible to all buyers registered on the platform.`,
    price_label: "Free",
  },
  "Recherche d'annonces": {
    title: "Listings Search",
    short_description: "Freely browse all site listings for sale.",
    description: `Freely browse all the site listings for sale on La Citadelle Numérique.
Filters by type, price, revenue and age available.`,
    price_label: "Free",
  },
  "Création de compte": {
    title: "Account Creation",
    short_description: "Signing up on La Citadelle Numérique is entirely free.",
    description: `Signing up on La Citadelle Numérique is entirely free.
Access messaging, purchase offers and your member area at no cost.`,
    price_label: "Free",
  },
};

/** Localise un service pour l'affichage (repli sur la valeur BDD). */
export function localizeService(svc, lang) {
  if (!svc || lang !== "en") return svc;
  const o = SERVICE_CATALOG_EN[(svc.title || "").trim()];
  if (!o) return svc;
  return {
    ...svc,
    title: o.title ?? svc.title,
    description: o.description ?? svc.description,
    short_description: o.short_description ?? svc.short_description,
    price_label: o.price_label ?? svc.price_label,
  };
}
