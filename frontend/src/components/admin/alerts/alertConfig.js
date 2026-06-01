/**
 * Configuration partagée pour les alertes admin
 * Partagée entre AlertList et AlertForm
 */

import { AlertTriangle, Info, CheckCircle, XCircle, MessageSquare, Bell } from "lucide-react";

export const TYPE_CONFIG = {
  popup:  { label: "Popup",    icon: MessageSquare },
  banner: { label: "Bannière", icon: Bell }
};

export const STYLE_CONFIG = {
  info:    { label: "Information",   color: "#3b82f6", bg: "#3b82f620", icon: Info },
  success: { label: "Succès",        color: "#10b981", bg: "#10b98120", icon: CheckCircle },
  warning: { label: "Avertissement", color: "#f59e0b", bg: "#f59e0b20", icon: AlertTriangle },
  danger:  { label: "Urgent",        color: "#ef4444", bg: "#ef444420", icon: XCircle }
};

export const TARGET_CONFIG = {
  all:        { label: "Tous les membres", color: "#6b7280" },
  developer:  { label: "Développeurs",    color: "#8b5cf6" },
  commercial: { label: "Commerciaux",     color: "#f59e0b" },
  public:     { label: "Site public",     color: "#10b981" }
};
