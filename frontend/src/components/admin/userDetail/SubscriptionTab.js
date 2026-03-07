/**
 * Onglet Abonnement - Détail utilisateur admin
 * Affiche les informations d'abonnement d'un utilisateur
 */

import { CreditCard, CheckCircle } from "lucide-react";

export const SubscriptionTab = ({ subscription }) => {
  const activeSubscription = subscription?.active;
  const plan = subscription?.plan;

  if (!activeSubscription) {
    return (
      <div 
        className="p-8 rounded-xl text-center transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <CreditCard size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
        <p style={{ color: "var(--admin-text-secondary)" }}>Aucun abonnement actif</p>
      </div>
    );
  }

  return (
    <div 
      className="p-6 rounded-xl transition-colors duration-300"
      style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 
            className="text-lg font-semibold mb-1"
            style={{ color: "var(--admin-text)" }}
          >
            {plan?.name || "Abonnement"}
          </h3>
          <p style={{ color: "var(--admin-text-secondary)" }}>{plan?.description}</p>
        </div>
        
        <span 
          className="px-3 py-1 rounded-lg text-sm font-medium"
          style={{ background: "#10b98120", color: "#10b981" }}
        >
          Actif
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prix */}
        {plan?.price && (
          <div 
            className="p-4 rounded-lg transition-colors duration-300" 
            style={{ background: "var(--admin-bg-section)" }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Prix</p>
            <p className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>
              {plan.price}€ <span className="text-sm font-normal" style={{ color: "var(--admin-text-secondary)" }}>/ mois</span>
            </p>
          </div>
        )}

        {/* Date de début */}
        {activeSubscription.start_date && (
          <div 
            className="p-4 rounded-lg transition-colors duration-300" 
            style={{ background: "var(--admin-bg-section)" }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Date de début</p>
            <p style={{ color: "var(--admin-text)" }}>
              {new Date(activeSubscription.start_date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}

        {/* ID Plan */}
        <div 
          className="p-4 rounded-lg transition-colors duration-300" 
          style={{ background: "var(--admin-bg-section)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>ID Plan</p>
          <p className="font-mono text-sm" style={{ color: "var(--admin-text)" }}>{activeSubscription.plan_id}</p>
        </div>

        {/* Statut */}
        <div 
          className="p-4 rounded-lg transition-colors duration-300" 
          style={{ background: "var(--admin-bg-section)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--admin-text-muted)" }}>Statut</p>
          <p className="text-green-400 font-medium">{activeSubscription.status}</p>
        </div>
      </div>

      {/* Fonctionnalités du plan */}
      {plan?.features?.length > 0 && (
        <div 
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--admin-border)" }}
        >
          <h4 className="text-sm font-medium mb-3" style={{ color: "var(--admin-text-muted)" }}>Fonctionnalités incluses</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li 
                key={index} 
                className="flex items-center gap-2"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
