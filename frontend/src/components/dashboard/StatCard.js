/**
 * Carte statistique réutilisable pour les dashboards
 */

const StatCard = ({ icon: Icon, label, value, sublabel, color = "var(--sage)" }) => (
  <div 
    className="p-5 rounded-xl"
    style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
        {sublabel && (
          <p className="text-xs mt-1" style={{ color }}>{sublabel}</p>
        )}
      </div>
      <div 
        className="p-2.5 rounded-lg"
        style={{ background: `${color}15` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
    </div>
  </div>
);

export default StatCard;
