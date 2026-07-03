/**
 * Carte de configuration de la promotion globale (offre de lancement).
 * Réduction en % appliquée à tous les services payants (affichage + facturation).
 */
import { useState, useEffect } from "react";
import { Percent, Save } from "lucide-react";
import api from "@/services/api";

export default function PromoConfigCard() {
  const [promo, setPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/citadelle/admin/promo")
      .then(res => setPromo(res.data))
      .catch(() => setPromo({ enabled: false, label: "Offre de lancement", discount_percent: 0, ends_at: null }));
  }, []);

  const update = (patch) => setPromo(p => ({ ...p, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        enabled: !!promo.enabled,
        label: promo.label || "Offre de lancement",
        discount_percent: promo.discount_percent ? parseInt(promo.discount_percent, 10) : 0,
        ends_at: promo.ends_at || "",
      };
      const res = await api.patch("/citadelle/admin/promo", payload);
      setPromo(res.data);
      setMessage("Promotion enregistrée ✓");
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (!promo) return null;

  return (
    <div
      className="p-5 rounded-xl mb-6"
      style={{ background: "rgba(201,164,92,0.06)", border: "1px solid rgba(201,164,92,0.3)" }}
      data-testid="promo-config-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,164,92,0.2)" }}>
          <Percent size={16} style={{ color: "#C9A45C" }} />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: "#C9A45C" }}>Promotion globale</h3>
          <p className="text-xs opacity-60">Réduction appliquée à tous les services payants (affichage + paiement)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Activation */}
        <label className="flex items-center gap-2 cursor-pointer" data-testid="promo-enabled-toggle">
          <input
            type="checkbox"
            checked={!!promo.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: "#C9A45C" }}
          />
          <span className="text-sm font-medium">Promotion active</span>
        </label>

        {/* Pourcentage */}
        <div>
          <label className="block text-xs font-semibold mb-1 opacity-70">Réduction (%)</label>
          <input
            type="number" min="0" max="90"
            value={promo.discount_percent ?? 0}
            onChange={(e) => update({ discount_percent: e.target.value })}
            data-testid="promo-percent-input"
            className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          />
        </div>

        {/* Libellé du badge */}
        <div>
          <label className="block text-xs font-semibold mb-1 opacity-70">Texte du badge</label>
          <input
            type="text" maxLength={60}
            value={promo.label || ""}
            onChange={(e) => update({ label: e.target.value })}
            data-testid="promo-label-input"
            placeholder="Offre de lancement"
            className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          />
        </div>

        {/* Date de fin (optionnelle) */}
        <div>
          <label className="block text-xs font-semibold mb-1 opacity-70">Fin (optionnel)</label>
          <input
            type="date"
            value={promo.ends_at ? String(promo.ends_at).substring(0, 10) : ""}
            onChange={(e) => update({ ends_at: e.target.value })}
            data-testid="promo-ends-input"
            className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="promo-save-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
          style={{ background: "#C9A45C", color: "#0F2747" }}
        >
          <Save size={14} /> {saving ? "Enregistrement…" : "Enregistrer la promo"}
        </button>
        {message && <span className="text-xs font-medium" data-testid="promo-save-message">{message}</span>}
      </div>
    </div>
  );
}
