/**
 * Section collapsible avec titre cliquable — Dashboard Admin
 */

import { ChevronDown } from "lucide-react";

const CollapsibleSection = ({
  title,
  icon,
  children,
  columns = 5,
  isOpen,
  onToggle,
  accentColor = "#6366f1",
  sectionId
}) => (
  <div
    className="mb-4 rounded-xl overflow-hidden transition-all duration-300"
    style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)" }}
  >
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-all"
      style={{ background: `${accentColor}15` }}
      data-testid={`collapse-${sectionId}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <h3
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--admin-text)" }}
        >
          {title}
        </h3>
      </div>
      <div
        className="p-1.5 rounded-lg transition-transform duration-200"
        style={{
          background: "var(--admin-bg-card)",
          transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)"
        }}
      >
        <ChevronDown size={18} style={{ color: "var(--admin-text-secondary)" }} />
      </div>
    </button>

    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className={`p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${columns} gap-3`}>
        {children}
      </div>
    </div>
  </div>
);

export default CollapsibleSection;
