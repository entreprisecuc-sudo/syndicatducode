/**
 * Page Admin — Sauvegarde des Données
 * Export manuel JSON (ZIP) et Excel multi-onglets
 * Configuration Google Drive (activable sans recoder en ajoutant la clé)
 */

import { useState, useEffect, useCallback } from "react";
import { Database, Download, FileSpreadsheet, Settings, RefreshCw, CheckCircle, AlertCircle, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminTheme } from "@/context/AdminThemeContext";
import api from "@/services/api";

const DEFAULT_CONFIG = {
  notification_email: "",
  google_drive_enabled: false,
  google_drive_credentials_json: "",
  google_drive_folder_id: "",
  auto_backup_enabled: false,
  auto_backup_frequency: "weekly",
};

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
];

const AdminBackup = () => {
  const { currentTheme } = useAdminTheme();
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/admin/backup/stats");
      setStats(res.data);
    } catch {
      showMessage("Erreur lors du chargement des statistiques", "error");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get("/admin/backup/config");
      setConfig(res.data);
    } catch {
      showMessage("Erreur lors du chargement de la configuration", "error");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, [fetchStats, fetchConfig]);

  // Téléchargement authentifié : récupère le blob via Axios et déclenche le téléchargement
  const handleExport = async (format) => {
    const isJson = format === "json";
    const setter = isJson ? setExportingJson : setExportingExcel;
    const endpoint = `/admin/backup/export/${format}`;

    setter(true);
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      const contentDisposition = response.headers["content-disposition"] || "";
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      const filename = filenameMatch ? filenameMatch[1] : `backup_syndicat.${isJson ? "zip" : "xlsx"}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showMessage(`Export ${isJson ? "JSON (ZIP)" : "Excel"} téléchargé avec succès`);
    } catch {
      showMessage(`Erreur lors de l'export ${isJson ? "JSON" : "Excel"}`, "error");
    } finally {
      setter(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.post("/admin/backup/config", config);
      showMessage("Configuration sauvegardée avec succès");
    } catch (err) {
      const detail = err.response?.data?.detail || "Erreur lors de la sauvegarde";
      showMessage(detail, "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const cardStyle = { background: currentTheme.bgCard, border: `1px solid ${currentTheme.border}` };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={24} style={{ color: currentTheme.accent }} />
            <div>
              <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>
                Sauvegarde des Données
              </h2>
              <p className="text-sm mt-0.5" style={{ color: currentTheme.textSecondary }}>
                Export de la base de données MongoDB
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            data-testid="backup-refresh-stats"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: currentTheme.bgSection, color: currentTheme.textSecondary }}
          >
            <RefreshCw size={16} className={loadingStats ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* Message de retour */}
        {message && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{
              background: message.type === "success" ? "#16a34a20" : "#dc262620",
              color: message.type === "success" ? "#16a34a" : "#dc2626",
              border: `1px solid ${message.type === "success" ? "#16a34a40" : "#dc262640"}`,
            }}
          >
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Résumé global */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={cardStyle}>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Collections</p>
              <p className="text-3xl font-bold mt-1" style={{ color: currentTheme.accent }}>
                {stats.total_collections}
              </p>
            </div>
            <div className="rounded-xl p-4" style={cardStyle}>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Documents totaux</p>
              <p className="text-3xl font-bold mt-1" style={{ color: currentTheme.text }}>
                {stats.total_documents.toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="rounded-xl p-4 col-span-2 lg:col-span-1" style={cardStyle}>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Dernière vérification</p>
              <p className="text-sm font-medium mt-1" style={{ color: currentTheme.text }}>
                {stats.generated_at
                  ? new Date(stats.generated_at).toLocaleString("fr-FR")
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Export manuel */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.text }}>
            <Download size={18} style={{ color: currentTheme.accent }} />
            Export Manuel
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleExport("json")}
              disabled={exportingJson || loadingStats}
              data-testid="backup-export-json"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50"
              style={{ background: currentTheme.accent, color: "#fff" }}
            >
              <Download size={16} />
              {exportingJson ? "Génération en cours..." : "Exporter JSON (ZIP)"}
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={exportingExcel || loadingStats}
              data-testid="backup-export-excel"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50"
              style={{ background: "#16a34a", color: "#fff" }}
            >
              <FileSpreadsheet size={16} />
              {exportingExcel ? "Génération en cours..." : "Exporter Excel (multi-onglets)"}
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: currentTheme.textMuted }}>
            Le ZIP JSON contient un fichier par collection. L'Excel contient un onglet par collection avec en-têtes stylisés.
          </p>
        </div>

        {/* Configuration sauvegarde automatique */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: currentTheme.text }}>
            <Settings size={18} style={{ color: currentTheme.accent }} />
            Configuration Sauvegarde Automatique
          </h3>
          <p className="text-xs mb-4" style={{ color: currentTheme.textMuted }}>
            Renseignez votre clé Google Drive pour activer la sauvegarde automatique. La configuration est sauvegardée en base : aucun recodage nécessaire.
          </p>

          {loadingConfig ? (
            <p className="text-sm" style={{ color: currentTheme.textMuted }}>Chargement de la configuration...</p>
          ) : (
            <div className="space-y-4">
              {/* Email de notification */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                  Email de notification
                </label>
                <input
                  type="email"
                  value={config.notification_email}
                  onChange={(e) => setConfig({ ...config, notification_email: e.target.value })}
                  placeholder="admin@syndicatducode.fr"
                  data-testid="backup-config-email"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    background: currentTheme.bgSection,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                />
              </div>

              {/* Clé JSON Google Service Account */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                  Clé JSON Google Service Account
                  <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                    Non configuré
                  </span>
                </label>
                <textarea
                  value={config.google_drive_credentials_json}
                  onChange={(e) => setConfig({ ...config, google_drive_credentials_json: e.target.value })}
                  placeholder='Collez ici le contenu JSON de votre clé de service Google ({"type": "service_account", ...})'
                  rows={4}
                  data-testid="backup-config-drive-key"
                  className="w-full px-3 py-2 rounded-lg text-sm border font-mono"
                  style={{
                    background: currentTheme.bgSection,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: currentTheme.textMuted }}>
                  Obtenir sur Google Cloud Console → IAM → Comptes de service → Créer une clé JSON
                </p>
              </div>

              {/* Dossier Google Drive */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                  ID du dossier Google Drive (destination)
                </label>
                <input
                  type="text"
                  value={config.google_drive_folder_id}
                  onChange={(e) => setConfig({ ...config, google_drive_folder_id: e.target.value })}
                  placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  data-testid="backup-config-drive-folder"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    background: currentTheme.bgSection,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                />
              </div>

              {/* Fréquence */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                  Fréquence de sauvegarde automatique
                </label>
                <select
                  value={config.auto_backup_frequency}
                  onChange={(e) => setConfig({ ...config, auto_backup_frequency: e.target.value })}
                  data-testid="backup-config-frequency"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    background: currentTheme.bgSection,
                    borderColor: currentTheme.border,
                    color: currentTheme.text,
                  }}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                data-testid="backup-save-config"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50"
                style={{ background: currentTheme.accent, color: "#fff" }}
              >
                {savingConfig ? "Sauvegarde en cours..." : "Sauvegarder la configuration"}
              </button>
            </div>
          )}
        </div>

        {/* Guide de restauration */}
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            data-testid="backup-guide-toggle"
            className="w-full px-5 py-4 flex items-center justify-between transition-colors"
            style={{ color: currentTheme.text }}
          >
            <span className="font-semibold flex items-center gap-2">
              <BookOpen size={18} style={{ color: currentTheme.accent }} />
              Guide de restauration MongoDB
            </span>
            {guideOpen
              ? <ChevronDown size={18} style={{ color: currentTheme.textMuted }} />
              : <ChevronRight size={18} style={{ color: currentTheme.textMuted }} />
            }
          </button>

          {guideOpen && (
            <div
              className="px-5 pb-5 space-y-4 border-t text-sm"
              style={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
            >
              {/* Prérequis */}
              <div className="pt-4">
                <p className="font-semibold mb-2" style={{ color: currentTheme.text }}>1. Prérequis</p>
                <ul className="space-y-1 list-disc list-inside" style={{ color: currentTheme.textSecondary }}>
                  <li><code className="px-1 rounded text-xs" style={{ background: currentTheme.bgSection }}>mongoimport</code> — MongoDB Database Tools (recommandé)</li>
                  <li><code className="px-1 rounded text-xs" style={{ background: currentTheme.bgSection }}>Python 3.8+</code> + <code className="px-1 rounded text-xs" style={{ background: currentTheme.bgSection }}>pymongo</code> — alternative si mongoimport non dispo</li>
                  <li>Fichier ZIP généré depuis ce panneau (bouton "Exporter JSON")</li>
                </ul>
              </div>

              {/* Étape 1 */}
              <div>
                <p className="font-semibold mb-2" style={{ color: currentTheme.text }}>2. Décompresser le ZIP</p>
                <pre
                  className="p-3 rounded-lg text-xs overflow-x-auto"
                  style={{ background: currentTheme.bgSection, color: currentTheme.text }}
                >{`unzip backup_syndicat_YYYY-MM-DD.zip -d /tmp/restore_syndicat/`}</pre>
              </div>

              {/* Étape 2 — mongoimport */}
              <div>
                <p className="font-semibold mb-2" style={{ color: currentTheme.text }}>3. Restauration complète (mongoimport)</p>
                <pre
                  className="p-3 rounded-lg text-xs overflow-x-auto"
                  style={{ background: currentTheme.bgSection, color: currentTheme.text }}
                >{`for file in /tmp/restore_syndicat/*.json; do
  collection=$(basename "$file" .json)
  mongoimport \\
    --uri="$MONGO_URL" \\
    --db="test_database" \\
    --collection="$collection" \\
    --file="$file" \\
    --jsonArray \\
    --mode=upsert
done`}</pre>
                <p className="text-xs mt-1" style={{ color: currentTheme.textMuted }}>
                  <code className="px-1 rounded" style={{ background: currentTheme.bgSection }}>--mode=upsert</code> est idempotent — rejouer la restauration est sans danger.
                </p>
              </div>

              {/* Restauration partielle */}
              <div>
                <p className="font-semibold mb-2" style={{ color: currentTheme.text }}>4. Restauration partielle (1 collection)</p>
                <pre
                  className="p-3 rounded-lg text-xs overflow-x-auto"
                  style={{ background: currentTheme.bgSection, color: currentTheme.text }}
                >{`mongoimport --uri="$MONGO_URL" --db="test_database" \\
  --collection="users" \\
  --file="/tmp/restore_syndicat/users.json" \\
  --jsonArray --mode=upsert`}</pre>
              </div>

              {/* Points d'attention */}
              <div
                className="p-3 rounded-lg text-xs space-y-1"
                style={{ background: `#f59e0b15`, border: `1px solid #f59e0b30`, color: currentTheme.textSecondary }}
              >
                <p className="font-semibold" style={{ color: "#f59e0b" }}>Points d'attention</p>
                <p>• Les <strong>indexes</strong> ne sont pas restaurés par mongoimport. Redémarrer l'application pour les recréer.</p>
                <p>• Les <strong>fichiers uploadés</strong> (dossier <code>/uploads</code>) ne sont pas inclus dans le ZIP — à sauvegarder séparément.</p>
                <p>• Le fichier Excel est un complément de lecture, pas la source recommandée pour une restauration automatisée.</p>
              </div>

              <p className="text-xs" style={{ color: currentTheme.textMuted }}>
                Documentation complète : <code className="px-1 rounded" style={{ background: currentTheme.bgSection }}>/app/memory/RESTAURATION_MONGODB.md</code>
              </p>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminBackup;
