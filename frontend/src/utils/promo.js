/**
 * Utilitaires promotion (offre globale sur les services payants).
 * Le prix réduit est réellement facturé côté backend ; ces helpers gèrent l'affichage.
 */
import React from "react";
import { Percent } from "lucide-react";

const eur = (n) => Number(n).toLocaleString("fr-FR");

// Prix après réduction (arrondi 2 décimales)
export const promoDiscounted = (price, promo) => {
  if (promo?.active && promo.discount_percent > 0 && price > 0) {
    return Math.round(price * (1 - promo.discount_percent / 100) * 100) / 100;
  }
  return price;
};

// La promo s'applique-t-elle à ce prix ?
export const isPromoOn = (promo, price) =>
  !!(promo?.active && promo.discount_percent > 0 && price > 0);

// Affichage du prix d'un service (barré + réduit si promo, sinon libellé habituel)
export function PriceDisplay({ svc, promo }) {
  const payable = svc.service_type === "paid" && svc.price > 0;
  if (payable && isPromoOn(promo, svc.price)) {
    return (
      <span className="inline-flex items-center gap-1">
        <span style={{ textDecoration: "line-through", opacity: 0.55 }}>{eur(svc.price)} €</span>
        <span>{eur(promoDiscounted(svc.price, promo))} €</span>
      </span>
    );
  }
  return (
    <>
      {svc.price_label ||
        (svc.price > 0 ? `${eur(svc.price)} €` : svc.price === 0 ? "Gratuit" : "Sur devis")}
    </>
  );
}

// Bandeau promo global (haut de page)
export function PromoBanner({ promo }) {
  if (!promo?.active) return null;
  const end = promo.ends_at
    ? ` · jusqu'au ${new Date(promo.ends_at).toLocaleDateString("fr-FR")}`
    : "";
  return (
    <div
      data-testid="promo-banner"
      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-center"
      style={{ background: "linear-gradient(90deg,#C9A45C,#e0b968)", color: "#0F2747" }}
    >
      <Percent size={15} />
      {promo.label} — -{promo.discount_percent}% sur tous les services payants{end}
    </div>
  );
}
