/**
 * Onglet Historique - Détail utilisateur admin
 * Affiche l'historique d'activité d'un utilisateur
 */

import { 
  History, User, Shield, Briefcase, Send, CreditCard, 
  MessageCircle, Clock, Loader2
} from "lucide-react";

export const HistoryTab = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" style={{ color: "var(--admin-accent)" }} size={32} />
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div 
        className="p-8 rounded-xl text-center transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <History size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
        <p style={{ color: "var(--admin-text-secondary)" }}>Aucune activité enregistrée</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "account_created": return User;
      case "role_assigned": return Shield;
      case "portfolio_created": return Briefcase;
      case "application_submitted": return Send;
      case "subscription": return CreditCard;
      case "message_received": return MessageCircle;
      default: return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "account_created": return "#10b981";
      case "role_assigned": return "#3b82f6";
      case "portfolio_created": return "#8b5cf6";
      case "application_submitted": return "#f59e0b";
      case "subscription": return "#e94560";
      case "message_received": return "#06b6d4";
      default: return "#6b7280";
    }
  };

  return (
    <div className="space-y-3">
      {activity.map((item, index) => {
        const Icon = getActivityIcon(item.type);
        const color = getActivityColor(item.type);
        
        return (
          <div 
            key={index}
            className="p-4 rounded-xl flex items-start gap-4 transition-colors duration-300"
            style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium" style={{ color: "var(--admin-text)" }}>{item.label}</p>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-secondary)" }}>{item.details}</p>
              {item.date && (
                <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
                  {new Date(item.date).toLocaleString("fr-FR")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTab;
