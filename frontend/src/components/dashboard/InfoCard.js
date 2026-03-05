/**
 * Carte d'information/action réutilisable
 */

import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const InfoCard = ({ 
  icon: Icon, 
  title, 
  description, 
  linkTo, 
  linkLabel = "Voir plus",
  color = "var(--sage)" 
}) => (
  <div 
    className="p-5 rounded-xl"
    style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
  >
    <div 
      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
      style={{ background: `${color}15` }}
    >
      <Icon size={20} style={{ color }} />
    </div>
    
    <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
      {title}
    </h3>
    <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
      {description}
    </p>
    
    {linkTo && (
      <Link 
        to={linkTo}
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color }}
      >
        {linkLabel}
        <ChevronRight size={16} />
      </Link>
    )}
  </div>
);

export default InfoCard;
