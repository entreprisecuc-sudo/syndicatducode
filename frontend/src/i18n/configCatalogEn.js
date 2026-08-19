/**
 * Catalogue EN des libellés de configuration (catégories, services accueil…).
 * Le fichier citadelleConstants.js reste la source (français). Ce mapping fournit
 * la version EN indexée par slug ; repli automatique sur la valeur FR si absent.
 */

export const CATEGORY_EN = {
  website:        { label: "Websites",          description: "Showcase sites, blogs, portfolios" },
  ecommerce:      { label: "E-commerce",         description: "Online stores, marketplaces" },
  saas:           { label: "SaaS",               description: "Software as a service" },
  webapp:         { label: "Web applications",   description: "Web apps, online tools" },
  social_account: { label: "Social networks",    description: "Accounts, pages, communities" },
  domain:         { label: "Domain names",       description: "Domains, premium extensions" },
  // Catégories étendues
  shopify_store:   { label: "Shopify store",              description: "Shopify store, dropshipping" },
  amazon_fba:      { label: "Amazon FBA",                 description: "Amazon FBA / Merch business" },
  newsletter:      { label: "Newsletter",                 description: "Paid or sponsored newsletter" },
  youtube_channel: { label: "YouTube channel",            description: "Monetized YouTube channel" },
  instagram:       { label: "Instagram account",          description: "Instagram account or page" },
  tiktok:          { label: "TikTok account",             description: "Monetized TikTok account" },
  linkedin_page:   { label: "LinkedIn Company page",       description: "LinkedIn company page" },
  discord_server:  { label: "Discord server",             description: "Discord community" },
  forum:           { label: "Forum",                      description: "Forum or online community" },
  blog:            { label: "Blog",                       description: "Monetized blog" },
  online_media:    { label: "Online media",               description: "Magazine, journal, digital media" },
  ai_automation:   { label: "AI agents / Automations",    description: "AI tools, scripts, workflows" },
  template_plugin: { label: "Templates / Themes / Plugins", description: "Resellable digital assets" },
  database_api:    { label: "Databases / APIs",           description: "APIs, datasets, databases" },
};

export const HOME_SERVICE_EN = {
  valuation:    { label: "Valuation",     description: "Accurate estimate of your digital asset's value", price: "Free" },
  verification: { label: "Verification",  description: "Independent audit of traffic, revenue and GA data", price: "On quote" },
  migration:    { label: "Migration",     description: "Complete technical transfer by our partners", price: "On quote" },
  audit:        { label: "Pre-sale audit", description: "Full technical report to reassure buyers", price: "On quote" },
};

export function localizeCategory(cat, lang) {
  if (!cat || lang !== "en") return cat;
  const o = CATEGORY_EN[cat.slug];
  if (!o) return cat;
  return { ...cat, label: o.label ?? cat.label, description: o.description ?? cat.description };
}

export function localizeHomeService(svc, lang) {
  if (!svc || lang !== "en") return svc;
  const o = HOME_SERVICE_EN[svc.slug];
  if (!o) return svc;
  return { ...svc, label: o.label ?? svc.label, description: o.description ?? svc.description, price: o.price ?? svc.price };
}
