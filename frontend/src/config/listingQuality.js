/**
 * Calcul du score de qualité d'une annonce — La Citadelle Numérique
 * Source unique partagée (DRY) : formulaire vendeur + back-office admin.
 * Gère les deux formes de données : formulaire (technologies = string)
 * et annonce stockée (technologies = tableau).
 */

const hasNumber = (s) => /\d/.test(s || "");
const len = (s) => (s || "").toString().trim().length;
const techFilled = (t) => (Array.isArray(t) ? t.filter(Boolean).length > 0 : len(t) > 0);

export function buildCriteria(data) {
  const nbImages = (data.images || []).filter(Boolean).length;
  const criteria = [
    { step: 0, weight: 10, done: len(data.title) >= 15, label: "Un titre clair d'au moins 15 caractères" },
    { step: 0, weight: 8,  done: hasNumber(data.title), label: "Un chiffre clé dans le titre (revenu, trafic…)" },
    { step: 0, weight: 10, done: len(data.short_description) >= 80, label: "Une accroche d'au moins 80 caractères" },
    { step: 1, weight: 12, done: !!data.monthly_revenue && parseFloat(data.monthly_revenue) > 0, label: "Les revenus mensuels" },
    { step: 1, weight: 8,  done: !!data.monthly_traffic && parseFloat(data.monthly_traffic) > 0, label: "Le trafic mensuel" },
    { step: 1, weight: 6,  done: !!data.age_months, label: "L'ancienneté de l'actif" },
    { step: 1, weight: 6,  done: len(data.niche) > 0, label: "La niche / le secteur" },
    { step: 2, weight: 14, done: len(data.description) >= 300, label: "Une description détaillée d'au moins 300 caractères" },
    { step: 2, weight: 6,  done: techFilled(data.technologies), label: "Les technologies utilisées" },
  ];
  if (!data.is_adult) {
    criteria.push({ step: 2, weight: 14, done: nbImages > 0, label: "Au moins une image (visuel de vente)" });
    criteria.push({ step: 2, weight: 6,  done: len(data.url_preview) > 0, label: "L'URL ou une démo du site" });
  }
  return criteria;
}

export function scoreLabel(pct) {
  if (pct >= 90) return { text: "Score excellent", color: "#16A34A" };
  if (pct >= 70) return { text: "Bon score", color: "#22C55E" };
  if (pct >= 40) return { text: "Score à compléter", color: "#F59E0B" };
  return { text: "Score de départ", color: "#EF4444" };
}

export function computeListingQuality(data) {
  const criteria = buildCriteria(data || {});
  const total = criteria.reduce((s, c) => s + c.weight, 0);
  const done = criteria.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { pct, criteria, label: scoreLabel(pct), missing: criteria.filter(c => !c.done) };
}
