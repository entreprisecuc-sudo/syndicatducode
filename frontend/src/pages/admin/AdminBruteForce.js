/**
 * Protection Anti-Brute Force
 * Configuration du rate limiting et gestion des entités bloquées
 */

import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, Unlock, Lock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const DEFAULT_CONFIG = {
  max_attempts: 5,
  block_duration_minutes: 15,
  window_minutes: 5,
  is_active: true
};

const AdminBruteForce = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [blocked, setBlocked] = useState([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/admin/brute-force/config');
      setConfig(res.data);
    } catch {
      showMessage("Erreur lors du chargement de la configuration", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlocked = useCallback(async () => {
    try {
      setLoadingBlocked(true);
      const res = await api.get('/admin/brute-force/blocked');
      setBlocked(res.data.blocked);
      setBlockedCount(res.data.count);
    } catch {
      showMessage("Erreur lors du chargement des entités bloquées", "error");
    } finally {
      setLoadingBlocked(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchBlocked();
  }, [fetchConfig, fetchBlocked]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleActive = async () => {
    const newConfig = { ...config, is_active: !config.is_active };
    setConfig(newConfig);
    try {
      await api.put(`/admin/brute-force/config`, newConfig);
      showMessage(newConfig.is_active ? "Protection activée" : "Protection désactivée");
    } catch {
      setConfig(config);
      showMessage("Erreur lors de la mise à jour", "error");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/brute-force/config`, config);
      showMessage("Configuration sauvegardée avec succès");
    } catch (err) {
      const detail = err.response?.data?.detail || "Erreur lors de la sauvegarde";
      showMessage(detail, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await api.post(`/admin/brute-force/unblock`,  { ip });
      showMessage(`IP ${ip} débloquée`);
      fetchBlocked();
    } catch {
      showMessage("Erreur lors du déblocage", "error");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const handleInputChange = (field, value) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setConfig(prev => ({ ...prev, [field]: parsed }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--admin-accent)" }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Message de retour */}
      {message && (
        <div
          data-testid="brute-force-message"
          className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
          style={{
            background: message.type === "error" ? "#ef444420" : "#10b98120",
            color: message.type === "error" ? "#ef4444" : "#10b981",
            border: `1px solid ${message.type === "error" ? "#ef444440" : "#10b98140"}`
          }}
        >
          {message.text}
        </div>
      )}

      {/* Header principal */}
      <div
        className="p-4 rounded-xl mb-6 flex items-center justify-between transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="flex items-center gap-3">
          <Shield size={20} style={{ color: "#ef4444" }} />
          <div>
            <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>
              Protection Anti-Brute Force (Rate Limiting)
            </h2>
          </div>
        </div>

        {/* Toggle Activé / Désactivé */}
        <button
          data-testid="brute-force-toggle"
          onClick={handleToggleActive}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: config.is_active ? "#10b98120" : "#6b728020",
            color: config.is_active ? "#10b981" : "#6b7280",
            border: `1px solid ${config.is_active ? "#10b98140" : "#6b728040"}`
          }}
        >
          {config.is_active ? (
            <><Lock size={14} /> Activé</>
          ) : (
            <><Unlock size={14} /> Désactivé</>
          )}
        </button>
      </div>

      {/* Cartes de configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Max Tentatives */}
        <div
          className="p-4 rounded-xl"
          style={{ background: "#dbeafe30", border: "1px solid #3b82f640" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--admin-text)" }}>
            Max Tentatives
          </p>
          <input
            data-testid="input-max-attempts"
            type="number"
            min="1"
            max="20"
            value={config.max_attempts}
            onChange={(e) => handleInputChange("max_attempts", e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none"
            style={{ color: "var(--admin-text)" }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
            Avant blocage (1–20)
          </p>
        </div>

        {/* Durée Blocage */}
        <div
          className="p-4 rounded-xl"
          style={{ background: "#fce7f330", border: "1px solid #ec489940" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--admin-text)" }}>
            Durée Blocage (min)
          </p>
          <input
            data-testid="input-block-duration"
            type="number"
            min="1"
            max="30"
            value={config.block_duration_minutes}
            onChange={(e) => handleInputChange("block_duration_minutes", e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none"
            style={{ color: "var(--admin-text)" }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
            Durée du blocage (1–30 min)
          </p>
        </div>

        {/* Fenêtre de détection */}
        <div
          className="p-4 rounded-xl"
          style={{ background: "#fefce830", border: "1px solid #eab30840" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--admin-text)" }}>
            Fenêtre (min)
          </p>
          <input
            data-testid="input-window"
            type="number"
            min="1"
            max="30"
            value={config.window_minutes}
            onChange={(e) => handleInputChange("window_minutes", e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none"
            style={{ color: "var(--admin-text)" }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
            Fenêtre de détection (1–30 min)
          </p>
        </div>
      </div>

      {/* Section entités bloquées */}
      <div
        className="p-4 rounded-xl mb-6 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: "#ef4444" }} />
            <h3 className="font-medium" style={{ color: "var(--admin-text)" }}>
              Entités Bloquées ({blockedCount})
            </h3>
          </div>
          <button
            data-testid="btn-refresh-blocked"
            onClick={fetchBlocked}
            disabled={loadingBlocked}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-secondary)" }}
          >
            <RefreshCw size={12} className={loadingBlocked ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {blocked.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <Lock size={40} style={{ color: "var(--admin-text-muted)", opacity: 0.3 }} />
            <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
              Aucune entité bloquée actuellement
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blocked.map((entity, idx) => (
              <div
                key={idx}
                data-testid={`blocked-entity-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-border)" }}
              >
                <div>
                  <p className="font-mono text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                    {entity.ip}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
                    Bloqué jusqu'au {formatDate(entity.blocked_until)}
                    {entity.attempts_count && ` · ${entity.attempts_count} tentatives`}
                  </p>
                </div>
                <button
                  data-testid={`btn-unblock-${idx}`}
                  onClick={() => handleUnblock(entity.ip)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}
                >
                  <Unlock size={12} />
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <button
          data-testid="btn-save-config"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#3b82f6" }}
        >
          {saving ? (
            <><RefreshCw size={14} className="animate-spin" /> Sauvegarde...</>
          ) : (
            <><Shield size={14} /> Sauvegarder la Configuration</>
          )}
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminBruteForce;
