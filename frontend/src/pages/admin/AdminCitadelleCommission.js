/**
 * AdminCitadelleCommission — La Citadelle Numérique
 * Page d'administration de la commission sur les ventes
 */

import { useState, useEffect } from "react";
import { Save, Percent, Euro, Info, RotateCcw, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const DEFAULTS = { rate: 0.05, minimum_eur: 49 };

export default function AdminCitadelleCommission() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [form, setForm]         = useState({ rate_pct: "5", minimum_eur: "49" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  // Chargement des paramètres actuels
  useEffect(() => {
    api.get("/citadelle/settings/commission")
      .then(res => {
        const d = res.data;
        setSettings(d);
        setForm({
          rate_pct:    String((d.rate * 100).toFixed(2)).replace(/\.?0+$/, ""),
          minimum_eur: String(d.minimum_eur),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const rate = parseFloat(form.rate_pct) / 100;
    const min  = parseFloat(form.minimum_eur);

    if (isNaN(rate) || rate <= 0 || rate > 1) {
      setError("Le taux doit être compris entre 0,01 % et 100 %.");
      return;
    }
    if (isNaN(min) || min <= 0) {
      setError("Le montant minimum doit être supérieur à 0 €.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const res = await api.put("/citadelle/admin/settings/commission", { rate, minimum_eur: min });
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ rate_pct: "5", minimum_eur: "49" });
    setError("");
  };

  // Calcul de l'exemple illustratif
  const previewPrice  = 1000;
  const currentRate   = parseFloat(form.rate_pct) / 100 || DEFAULTS.rate;
  const currentMin    = parseFloat(form.minimum_eur) || DEFAULTS.minimum_eur;
  const commission    = Math.max(previewPrice * currentRate, currentMin);
  const vendorReceive = previewPrice - commission;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto py-8 px-4" data-testid="admin-commission-page">

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Commission sur les ventes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Paramètres affichés aux vendeurs lors de la publication d'une annonce.
          </p>
          {settings.updated_at && (
            <p className="text-xs text-gray-400 mt-1">
              Dernière mise à jour : {new Date(settings.updated_at).toLocaleString("fr-FR")}
            </p>
          )}
        </div>

        {loading ? (
          <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : (
          <div className="space-y-6">

            {/* Formulaire */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-5">
                Paramètres de commission
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Taux */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taux de commission (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.rate_pct}
                      onChange={e => setForm(p => ({ ...p, rate_pct: e.target.value }))}
                      min="0.01"
                      max="100"
                      step="0.01"
                      className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="commission-rate-input"
                    />
                    <Percent size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ex : 5 pour 5 %</p>
                </div>

                {/* Minimum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Montant minimum (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.minimum_eur}
                      onChange={e => setForm(p => ({ ...p, minimum_eur: e.target.value }))}
                      min="1"
                      step="1"
                      className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="commission-min-input"
                    />
                    <Euro size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Prélevé même si le % est inférieur</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-all"
                  data-testid="commission-save-btn"
                >
                  {saved
                    ? <><CheckCircle size={15} /> Enregistré !</>
                    : saving
                    ? "Enregistrement…"
                    : <><Save size={15} /> Enregistrer</>
                  }
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <RotateCcw size={14} /> Valeurs par défaut
                </button>
              </div>
            </div>

            {/* Prévisualisation en temps réel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-blue-500" />
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  Prévisualisation (base 1 000 €)
                </h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Prix de vente</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {previewPrice.toLocaleString("fr-FR")} €
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Commission ({parseFloat(form.rate_pct) || 0} % · min. {parseFloat(form.minimum_eur) || 0} €)
                  </span>
                  <span className="font-semibold text-red-500">
                    — {commission.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-gray-800 dark:text-white">Le vendeur reçoit</span>
                  <span className="font-bold text-green-600">
                    {vendorReceive.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            </div>

            {/* Note informative */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Ces paramètres sont affichés aux vendeurs dans le popup d'information lors de la saisie
                du prix de vente. Ils sont également utilisés dans les calculs de commission
                lors des transactions.
              </p>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}
