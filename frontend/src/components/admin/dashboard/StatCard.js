/**
 * Carte de statistique individuelle — Dashboard Admin
 */

const StatCard = ({ icon: Icon, label, value, color = "#6366f1", subtext }) => (
  <div
    className="p-4 rounded-xl transition-colors duration-300"
    style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-1 truncate" style={{ color: "var(--admin-text-muted)" }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>{value}</p>
        {subtext && (
          <p className="text-xs mt-1" style={{ color: "var(--admin-text-muted)" }}>{subtext}</p>
        )}
      </div>
      <div
        className="p-2 rounded-lg flex-shrink-0 ml-2"
        style={{ background: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  </div>
);

export default StatCard;
