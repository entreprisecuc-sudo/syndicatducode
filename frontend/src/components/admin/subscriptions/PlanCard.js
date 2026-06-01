/**
 * Carte d'un plan d'abonnement — Admin Subscriptions
 */

import { Eye, EyeOff, Edit, Trash2, Check, Star } from "lucide-react";

const PlanCard = ({ plan, onToggleStatus, onEdit, onDelete }) => (
  <div
    className={`p-5 rounded-xl relative ${plan.status === "inactive" ? "opacity-60" : ""}`}
    style={{
      background: "var(--admin-bg-card)",
      border: plan.is_recommended ? "2px solid #e94560" : "1px solid #1f4068"
    }}
  >
    {plan.is_recommended && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium flex items-center gap-1">
        <Star size={12} />
        Recommandé
      </div>
    )}

    <h3 className="text-white font-semibold text-lg mb-2">{plan.name}</h3>
    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

    <div className="mb-4">
      <span className="text-3xl font-bold text-white">{plan.price_monthly}€</span>
      <span className="text-gray-400">/mois</span>
      <p className="text-sm text-gray-500">ou {plan.price_yearly}€/an</p>
    </div>

    {plan.features?.length > 0 && (
      <ul className="space-y-2 mb-4">
        {plan.features.slice(0, 4).map((feature, i) => (
          <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
            <Check size={14} className="text-green-400" />
            {feature}
          </li>
        ))}
      </ul>
    )}

    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
      <span>{plan.subscriber_count} abonné(s)</span>
      {plan.trial_days > 0 && <span>{plan.trial_days}j d'essai</span>}
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => onToggleStatus(plan)}
        className={`p-2 rounded-lg ${plan.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-600/20 text-gray-400"}`}
      >
        {plan.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button onClick={() => onEdit(plan)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
        <Edit size={16} />
      </button>
      <button onClick={() => onDelete(plan.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400">
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

export default PlanCard;
