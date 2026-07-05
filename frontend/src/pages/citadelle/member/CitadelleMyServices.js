/**
 * Mes services — Espace membre La Citadelle Numérique
 * Catalogue des services disponibles à l'achat + historique des commandes
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star, Handshake, Zap, Shield, ExternalLink, ArrowRight, TrendingUp, Search,
  ShoppingCart, CheckCircle, Clock, AlertCircle, Ban, Package
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import ServiceCheckoutModal from "@/components/citadelle/ServiceCheckoutModal";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";

// ── Configuration ──────────────────────────────────────────────────────────────

const TYPE_ICONS = { paid: Zap, free: Star, partner: Handshake, quote: Shield };
const TYPE_LABELS = { paid: "Payant", free: "Gratuit", partner: "Partenaire", quote: "Sur devis" };

const ORDER_STATUS = {
  en_attente: { label: "En attente", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  Icon: Clock },
  en_cours:   { label: "En cours",   color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  Icon: AlertCircle },
  termine:    { label: "Terminé",    color: "#22C55E", bg: "rgba(34,197,94,0.1)",   Icon: CheckCircle },
  annule:     { label: "Annulé",     color: "#DC2626", bg: "rgba(220,38,38,0.1)",   Icon: Ban },
};

// Un service est achetable directement s'il est payant et a un prix positif
const isPayable = (svc) => svc.service_type === "paid" && svc.price > 0;

// ── Composant principal ─────────────────────────────────────────────────────────

export default function CitadelleMyServices() {
  const { user } = useCitadelleAuth();
  const [services, setServices]           = useState([]);
  const [orders, setOrders]               = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingOrders, setLoadingOrders]     = useState(true);

  // Checkout — délégué à ServiceCheckoutModal (Stripe réel)
  const [checkoutService, setCheckoutService] = useState(null);

  useEffect(() => {
    // Chargement parallèle : services publics + commandes de l'utilisateur
    citadelleApi.get("/services").then(res => {
      setServices(res.data.services || []);
      setLoadingServices(false);
    }).catch(() => setLoadingServices(false));

    citadelleApi.get("/services/my-orders").then(res => {
      setOrders(res.data.orders || []);
      setLoadingOrders(false);
    }).catch(() => setLoadingOrders(false));
  }, []);

  // ── Fonctions checkout ────────────────────────────────────────────────────────

  const openCheckout  = (svc) => setCheckoutService(svc);
  const closeCheckout = ()    => setCheckoutService(null);

  // Carte service réutilisable (variante claire ou sombre)
  const renderServiceCard = (svc, dark = false) => {
    const TypeIcon = TYPE_ICONS[svc.service_type] || Star;
    const payable = isPayable(svc);
    return (
      <div key={svc.id}
        className="p-5 rounded-2xl flex flex-col transition-all hover:-translate-y-1"
        style={{
          background: dark ? "rgba(255,255,255,0.06)" : "white",
          border: `1px solid ${dark ? "rgba(201,164,92,0.18)" : CITADELLE_COLORS.border}`,
        }}
        data-testid={`my-service-card-${svc.id}`}>

        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: dark ? "rgba(201,164,92,0.12)" : "rgba(201,164,92,0.1)" }}>
            <TypeIcon size={18} style={{ color: CITADELLE_COLORS.gold }} />
          </div>
          {svc.service_type === "partner" && svc.partner_name && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
              {svc.partner_name}
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm mb-1.5" style={{ color: dark ? "white" : CITADELLE_COLORS.blue }}>
          {svc.title}
        </h3>
        <p className="text-xs flex-1 mb-3 leading-relaxed"
          style={{ color: dark ? "rgba(255,255,255,0.5)" : CITADELLE_COLORS.textMuted }}>
          {svc.short_description || svc.description?.substring(0, 100)}
        </p>

        {/* Prix */}
        <div className="mb-3">
          {svc.price_label ? (
            <span className="text-sm font-bold" style={{ color: dark ? "white" : CITADELLE_COLORS.blue }}>
              {svc.price_label}
            </span>
          ) : svc.price != null ? (
            <span className="text-lg font-black"
              style={{ color: dark ? "white" : CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              {svc.price > 0 ? `${svc.price.toLocaleString("fr-FR")} €` : "Gratuit"}
            </span>
          ) : (
            <span className="text-xs font-medium"
              style={{ color: dark ? "rgba(255,255,255,0.5)" : CITADELLE_COLORS.textMuted }}>
              {TYPE_LABELS[svc.service_type]}
            </span>
          )}
        </div>

        {/* Bouton CTA */}
        {payable ? (
          <button onClick={() => openCheckout(svc)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
            data-testid={`my-service-buy-btn-${svc.id}`}>
            <ShoppingCart size={13} />
            Acheter — {svc.price.toLocaleString("fr-FR")} €
          </button>
        ) : svc.cta_url ? (
          <a href={svc.cta_url} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={dark
              ? { border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }
              : { border: `1px solid ${CITADELLE_COLORS.gold}`, color: CITADELLE_COLORS.gold }}>
            {svc.cta_label || "En savoir plus"} <ExternalLink size={12} />
          </a>
        ) : (
          <a href={`mailto:atelier@syndicatducode.fr?subject=Service: ${svc.title}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={dark
              ? { border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }
              : { border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.blue }}>
            {svc.cta_label || "Nous contacter"} <ArrowRight size={12} />
          </a>
        )}
      </div>
    );
  };

  // Encart catégorisé (clair pour vendeurs/communs, bleu pour acheteurs)
  const renderCategory = (title, subtitle, Icon, list, dark = false) => {
    if (!list.length) return null;
    return (
      <div key={title} className="rounded-2xl overflow-hidden"
        style={dark
          ? { background: CITADELLE_COLORS.blue }
          : { background: "#FAFBFD", border: `1px solid ${CITADELLE_COLORS.border}` }}>
        <div className="px-6 md:px-8 py-6"
          style={{ borderBottom: dark ? "1px solid rgba(201,164,92,0.2)" : `1px solid ${CITADELLE_COLORS.border}` }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: dark ? "rgba(201,164,92,0.15)" : "rgba(201,164,92,0.1)" }}>
              <Icon size={18} style={{ color: CITADELLE_COLORS.gold }} />
            </div>
            <h3 className="text-lg font-black"
              style={{ color: dark ? "white" : CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
              {title}
            </h3>
          </div>
          <p className="text-xs pl-12" style={{ color: dark ? "rgba(255,255,255,0.45)" : CITADELLE_COLORS.textMuted }}>
            {subtitle}
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((svc) => renderServiceCard(svc, dark))}
        </div>
      </div>
    );
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────────

  return (
    <CitadelleLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10" data-testid="citadelle-my-services">

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 mb-8 text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
          <Link to="/citadelle/espace-membre" className="hover:opacity-70 transition-opacity">
            ← Espace membre
          </Link>
          <span>/</span>
          <span className="font-semibold" style={{ color: CITADELLE_COLORS.blue }}>Mes services</span>
        </div>

        {/* En-tête */}
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            Mes services
          </h1>
          <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
            Commandez un service ou consultez l'historique de vos demandes.
          </p>
        </div>

        {/* ── Section 1 : Catalogue par catégorie ──────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-base font-bold mb-6" style={{ color: CITADELLE_COLORS.blue }}>
            Services disponibles
          </h2>

          {loadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: CITADELLE_COLORS.textMuted }}>
              Aucun service disponible pour le moment.
            </p>
          ) : (
            <div className="space-y-10">
              {renderCategory(
                "Pour les vendeurs",
                "Évaluez, optimisez et valorisez votre projet avant la vente.",
                TrendingUp,
                services.filter(s => s.target_category === "vendeur")
              )}
              {renderCategory(
                "Pour les acheteurs",
                "Sécurisez votre investissement avant et après l'acquisition.",
                Search,
                services.filter(s => s.target_category === "acheteur"),
                true
              )}
              {renderCategory(
                "Services communs",
                "Des services essentiels pour toutes vos transactions.",
                Shield,
                services.filter(s => !["vendeur", "acheteur"].includes(s.target_category))
              )}
            </div>
          )}
        </section>

        {/* Séparateur */}
        <div className="mb-10" style={{ height: 1, background: CITADELLE_COLORS.border }} />

        {/* ── Section 2 : Mes commandes ────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold mb-5" style={{ color: CITADELLE_COLORS.blue }}>
            Mes commandes
          </h2>

          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center rounded-2xl"
              style={{ background: "rgba(201,164,92,0.04)", border: `1px dashed rgba(201,164,92,0.25)` }}>
              <Package size={36} className="mx-auto mb-3" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.35 }} />
              <p className="text-sm font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>
                Vous n'avez encore passé aucune commande.
              </p>
              <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.7 }}>
                Découvrez les services ci-dessus et commandez directement.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="my-orders-list">
              {orders.map(order => {
                const statusCfg = ORDER_STATUS[order.status] || ORDER_STATUS.en_attente;
                const StatusIcon = statusCfg.Icon;
                return (
                  <div key={order.id}
                    className="p-4 rounded-xl"
                    style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                    data-testid={`my-order-row-${order.id}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-sm" style={{ color: CITADELLE_COLORS.blue }}>
                            {order.service_title}
                          </p>
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            <StatusIcon size={10} />
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>
                          Commandé le {formatDate(order.created_at)} · Réf. {order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <p className="font-black text-base shrink-0" style={{ color: CITADELLE_COLORS.gold }}>
                        {order.amount?.toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    {order.admin_note && (
                      <p className="text-xs mt-2 pl-3 border-l-2 italic"
                        style={{ color: CITADELLE_COLORS.textMuted, borderColor: CITADELLE_COLORS.gold + "55" }}>
                        Note : {order.admin_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Modale checkout Stripe (réel) ──────────────────────────────── */}
      {checkoutService && (
        <ServiceCheckoutModal
          service={checkoutService}
          onClose={closeCheckout}
        />
      )}
    </CitadelleLayout>
  );
}
