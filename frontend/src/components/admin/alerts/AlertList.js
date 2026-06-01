/**
 * Liste des alertes - Espace Admin
 */

import { Bell, Eye, EyeOff, Edit, Trash2, ExternalLink } from "lucide-react";
import { TYPE_CONFIG, STYLE_CONFIG, TARGET_CONFIG } from "./alertConfig";

const AlertList = ({ alerts, onToggleActive, onEdit, onDelete, onCreateFirst }) => {
  if (alerts.length === 0) {
    return (
      <div
        className="p-8 rounded-xl text-center"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <Bell size={48} className="mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400 mb-4">Aucune alerte créée</p>
        {onCreateFirst && (
          <button
            onClick={onCreateFirst}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            Créer la première alerte
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alertItem) => {
        const typeConfig = TYPE_CONFIG[alertItem.alert_type] || TYPE_CONFIG.banner;
        const styleConfig = STYLE_CONFIG[alertItem.style] || STYLE_CONFIG.info;
        const targetConfig = TARGET_CONFIG[alertItem.target] || TARGET_CONFIG.all;
        const TypeIcon = typeConfig.icon;
        const StyleIcon = styleConfig.icon;

        return (
          <div
            key={alertItem.id}
            className={`p-5 rounded-xl ${!alertItem.is_active ? 'opacity-60' : ''}`}
            style={{
              background: "var(--admin-bg-card)",
              border: "1px solid var(--admin-border)",
              borderLeft: `4px solid ${styleConfig.color}`
            }}
            data-testid={`alert-${alertItem.id}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white font-semibold text-lg">{alertItem.title}</h3>

                  <span
                    className="px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
                    style={{ background: "#1f4068", color: "#fff" }}
                  >
                    <TypeIcon size={12} />
                    {typeConfig.label}
                  </span>

                  <span
                    className="px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"
                    style={{ background: styleConfig.bg, color: styleConfig.color }}
                  >
                    <StyleIcon size={12} />
                    {styleConfig.label}
                  </span>

                  <span className="px-2 py-0.5 rounded text-xs" style={{ color: targetConfig.color }}>
                    {targetConfig.label}
                  </span>

                  {!alertItem.is_active && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-300">
                      Inactive
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-3">{alertItem.message}</p>

                {alertItem.link_url && (
                  <div className="flex items-center gap-2 text-sm text-blue-400 mb-3">
                    <ExternalLink size={14} />
                    <span>{alertItem.link_text || alertItem.link_url}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span>{alertItem.dismissible ? "Peut être fermée" : "Non fermable"}</span>
                  <span>{alertItem.dismiss_count} fermeture(s)</span>
                  <span>Créée le {new Date(alertItem.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleActive(alertItem)}
                  className={`p-2 rounded-lg transition-colors ${
                    alertItem.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                  }`}
                  title={alertItem.is_active ? "Désactiver" : "Activer"}
                >
                  {alertItem.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                <button
                  onClick={() => onEdit(alertItem)}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  title="Modifier"
                >
                  <Edit size={16} />
                </button>

                <button
                  onClick={() => onDelete(alertItem.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertList;
