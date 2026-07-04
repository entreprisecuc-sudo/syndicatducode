/**
 * Assistant de Transmission d'actif — Administration (La Garde)
 * Wizard 7 étapes, champs d'accès dynamiques selon le type d'actif,
 * brouillon, contrôles de cohérence, génération de l'Attestation.
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck, ChevronLeft, ChevronRight, Save, FileCheck2, Loader2,
  Info, Boxes, KeyRound, ListChecks, MessageSquare, Sparkles, BadgeCheck, Download, AlertTriangle,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { CITADELLE_COLORS as C } from "@/config/citadelleConstants";

const STEPS = [
  { key: "general", label: "Informations", icon: Info },
  { key: "asset", label: "Actif", icon: Boxes },
  { key: "access", label: "Accès", icon: KeyRound },
  { key: "checklist", label: "Checklist", icon: ListChecks },
  { key: "observations", label: "Observations", icon: MessageSquare },
  { key: "services", label: "Services", icon: Sparkles },
  { key: "review", label: "Vérification", icon: BadgeCheck },
];

const euro = (n) => `${Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;

export default function AdminCitadelleTransmission() {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [tx, setTx] = useState(null);
  const [schema, setSchema] = useState({ sections: [], checklist: [], services: [] });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [asset, setAsset] = useState({});
  const [access, setAccess] = useState({});
  const [checklist, setChecklist] = useState({});
  const [observations, setObservations] = useState("");
  const [services, setServices] = useState([]);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/citadelle/admin/transmissions", { transaction_id: transactionId });
      setTx(data);
      setAsset(data.asset || {});
      setAccess(data.access || {});
      setChecklist(data.checklist || {});
      setObservations(data.observations || "");
      setServices(data.recommended_services || []);
      const sc = await api.get(`/citadelle/admin/transmissions/schema/${data.asset_type || "generic"}`);
      setSchema(sc.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Impossible de charger la transmission.");
    } finally { setLoading(false); }
  }, [transactionId]);

  useEffect(() => { init(); }, [init]);

  const payload = () => ({ asset, access, checklist, observations, recommended_services: services });

  const saveDraft = async (silent = false) => {
    setSaving(true); setError("");
    try {
      const { data } = await api.patch(`/citadelle/admin/transmissions/${tx.id}`, payload());
      setTx(data);
      if (!silent) { setToast("Brouillon enregistré"); setTimeout(() => setToast(""), 2500); }
      return true;
    } catch (e) { setError(e?.response?.data?.detail || "Erreur d'enregistrement."); return false; }
    finally { setSaving(false); }
  };

  const coherenceIssues = () => {
    const issues = [];
    const sectionVals = (k) => access[k] || {};
    if ((tx?.asset_type === "domain") && !sectionVals("domain").registrar)
      issues.push("Un nom de domaine doit avoir un registrar renseigné.");
    if (["website", "ecommerce", "blog", "forum"].includes(tx?.asset_type)) {
      const cms = sectionVals("cms");
      if ((cms.platform || "").toLowerCase().includes("wordpress") && !cms.admin_account)
        issues.push("Un site WordPress doit posséder un compte administrateur.");
    }
    return issues;
  };

  const next = async () => {
    if (step === 1 && !asset.name) { setError("Le nom de l'actif est obligatoire."); return; }
    await saveDraft(true);
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };
  const prev = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  const finalize = async () => {
    const issues = coherenceIssues();
    if (issues.length) { setError(issues.join(" ")); return; }
    const ok = await saveDraft(true);
    if (!ok) return;
    setSaving(true);
    try {
      await api.post(`/citadelle/admin/transmissions/${tx.id}/finalize`);
      setToast("Attestation générée — email envoyé à l'acheteur");
      const t = setTimeout(() => navigate("/syndicat-admin/citadelle/transactions"), 1800);
      return () => clearTimeout(t);
    } catch (e) { setError(e?.response?.data?.detail || "Erreur de finalisation."); }
    finally { setSaving(false); }
  };

  const downloadPdf = async () => {
    const res = await api.get(`/citadelle/admin/transmissions/${tx.id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = `attestation-${tx.dossier_number}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-32"><Loader2 className="animate-spin" style={{ color: C.gold }} /></div></AdminLayout>;
  if (!tx) return <AdminLayout><div className="p-8 text-center" style={{ color: C.error }} data-testid="transmission-error">{error || "Introuvable"}</div></AdminLayout>;

  const g = tx.general || {};
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto pb-24" data-testid="transmission-wizard">
        {/* En-tête */}
        <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: C.blue }}>
          <div className="flex items-center gap-3">
            <ShieldCheck style={{ color: C.gold }} size={28} />
            <div>
              <h1 className="text-xl font-black">Assistant de Transmission</h1>
              <p className="text-sm" style={{ color: C.goldLight }}>Dossier {tx.dossier_number} · {g.asset_title}</p>
            </div>
            <span className="ml-auto text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: tx.status === "finalized" ? "rgba(34,197,94,.2)" : "rgba(201,164,92,.2)", color: tx.status === "finalized" ? C.success : C.gold }}
              data-testid="transmission-status">
              {tx.status === "finalized" ? "Finalisée" : "Brouillon"}
            </span>
          </div>
          {/* Barre de progression */}
          <div className="mt-5">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: C.gold }} />
            </div>
            <div className="flex justify-between mt-3 overflow-x-auto gap-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon; const active = i === step; const done = i < step;
                return (
                  <button key={s.key} onClick={() => setStep(i)} data-testid={`transmission-step-${s.key}`}
                    className="flex flex-col items-center gap-1 px-2 flex-shrink-0 transition-opacity"
                    style={{ opacity: active || done ? 1 : 0.5 }}>
                    <Icon size={16} style={{ color: active ? C.gold : done ? C.success : "#fff" }} />
                    <span className="text-[10px]" style={{ color: active ? C.gold : "#fff" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2" style={{ background: "rgba(220,38,38,.08)", color: C.error }} data-testid="transmission-form-error"><AlertTriangle size={16} className="mt-0.5" />{error}</div>}
        {toast && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(34,197,94,.1)", color: C.success }} data-testid="transmission-toast">{toast}</div>}

        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: C.border }}>
          {/* Étape 1 — Infos générales (lecture seule) */}
          {step === 0 && (
            <StepBlock title="Informations générales">
              <KV label="Dossier" value={tx.dossier_number} />
              <KV label="Référence transaction" value={g.transaction_ref} />
              <KV label="Acheteur" value={g.buyer} />
              <KV label="Vendeur" value={g.seller} />
              <KV label="Prix de vente" value={euro(g.price)} />
              <KV label="Commission" value={euro(g.commission)} />
              <KV label="Type d'actif" value={g.asset_type_label || g.asset_type} />
            </StepBlock>
          )}

          {/* Étape 2 — Présentation de l'actif */}
          {step === 1 && (
            <StepBlock title="Présentation de l'actif">
              <Field label="Nom *" value={asset.name} onChange={(v) => setAsset({ ...asset, name: v })} testid="asset-name" />
              <Field label="URL" value={asset.url} onChange={(v) => setAsset({ ...asset, url: v })} testid="asset-url" />
              <Field label="Catégorie" value={asset.category} onChange={(v) => setAsset({ ...asset, category: v })} />
              <Field label="Date de création" value={asset.creation_date} onChange={(v) => setAsset({ ...asset, creation_date: v })} />
              <Field label="Technologies" value={asset.technologies} onChange={(v) => setAsset({ ...asset, technologies: v })} />
              <Field label="Version" value={asset.version} onChange={(v) => setAsset({ ...asset, version: v })} />
              <Field label="Description" value={asset.description} onChange={(v) => setAsset({ ...asset, description: v })} textarea />
            </StepBlock>
          )}

          {/* Étape 3 — Accès dynamiques */}
          {step === 2 && (
            <StepBlock title="Accès transmis" subtitle="Champs adaptés au type d'actif. Les données sensibles sont chiffrées.">
              {schema.sections.length === 0 && <p className="text-sm" style={{ color: C.textMuted }}>Aucune section pour ce type.</p>}
              {schema.sections.map((sec) => (
                <div key={sec.key} className="mb-6">
                  <h4 className="text-sm font-black mb-3" style={{ color: C.gold }}>{sec.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sec.fields.map((f) => (
                      <Field key={f.key} label={f.label} sensitive={f.sensitive}
                        type={f.type === "password" ? "password" : "text"}
                        textarea={f.type === "textarea"}
                        value={(access[sec.key] || {})[f.key] || ""}
                        onChange={(v) => setAccess({ ...access, [sec.key]: { ...(access[sec.key] || {}), [f.key]: v } })}
                        testid={`access-${sec.key}-${f.key}`} />
                    ))}
                  </div>
                </div>
              ))}
            </StepBlock>
          )}

          {/* Étape 4 — Checklist */}
          {step === 3 && (
            <StepBlock title="Checklist de transmission">
              {schema.checklist.map((item) => (
                <label key={item.key} className="flex items-center gap-3 py-2 cursor-pointer" data-testid={`checklist-${item.key}`}>
                  <input type="checkbox" checked={!!checklist[item.key]}
                    onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                    className="w-4 h-4" style={{ accentColor: C.gold }} />
                  <span className="text-sm" style={{ color: C.blue }}>{item.label}</span>
                </label>
              ))}
            </StepBlock>
          )}

          {/* Étape 5 — Observations */}
          {step === 4 && (
            <StepBlock title="Observations">
              <Field label="Remarques, conseils, éléments restants…" value={observations} onChange={setObservations} textarea rows={8} testid="observations" />
            </StepBlock>
          )}

          {/* Étape 6 — Services recommandés */}
          {step === 5 && (
            <StepBlock title="Services recommandés" subtitle="Apparaîtront dans le document remis au nouveau propriétaire.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {schema.services.map((s) => {
                  const on = services.includes(s.key);
                  return (
                    <button key={s.key} onClick={() => setServices(on ? services.filter((x) => x !== s.key) : [...services, s.key])}
                      data-testid={`service-${s.key}`}
                      className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{ borderColor: on ? C.gold : C.border, background: on ? "rgba(201,164,92,.08)" : "#fff" }}>
                      <div className="w-4 h-4 rounded" style={{ background: on ? C.gold : "transparent", border: `1px solid ${on ? C.gold : C.border}` }} />
                      <span className="text-sm" style={{ color: C.blue }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </StepBlock>
          )}

          {/* Étape 7 — Vérification finale */}
          {step === 6 && (
            <StepBlock title="Vérification finale" subtitle="Vérifiez puis générez l'Attestation de Transmission.">
              <KV label="Actif" value={asset.name} />
              <KV label="URL" value={asset.url} />
              <KV label="Accès renseignés" value={`${Object.values(access).reduce((n, s) => n + Object.values(s || {}).filter(Boolean).length, 0)} champ(s)`} />
              <KV label="Checklist" value={`${Object.values(checklist).filter(Boolean).length} / ${schema.checklist.length} validés`} />
              <KV label="Services recommandés" value={`${services.length} sélectionné(s)`} />
              {tx.status === "finalized" ? (
                <div className="mt-5 p-4 rounded-xl flex items-center justify-between" style={{ background: "rgba(34,197,94,.08)" }}>
                  <span className="text-sm font-bold" style={{ color: C.success }}>Attestation générée ✓</span>
                  <button onClick={downloadPdf} data-testid="transmission-download-btn"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: C.blue }}>
                    <Download size={15} /> Télécharger le PDF
                  </button>
                </div>
              ) : (
                <button onClick={finalize} disabled={saving} data-testid="transmission-finalize-btn"
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-black transition-all hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: C.gold }}>
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <FileCheck2 size={18} />}
                  Générer l'Attestation de Transmission
                </button>
              )}
            </StepBlock>
          )}
        </div>

        {/* Barre d'actions */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={prev} disabled={step === 0} data-testid="transmission-prev-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ color: C.blue, background: "#fff", border: `1px solid ${C.border}` }}>
            <ChevronLeft size={16} /> Précédent
          </button>
          <button onClick={() => saveDraft(false)} disabled={saving} data-testid="transmission-savedraft-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm" style={{ color: C.gold, background: "rgba(201,164,92,.1)" }}>
            <Save size={16} /> Enregistrer le brouillon
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} data-testid="transmission-next-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: C.blue }}>
              Suivant <ChevronRight size={16} />
            </button>
          ) : <div style={{ width: 110 }} />}
        </div>
      </div>
    </AdminLayout>
  );
}

const StepBlock = ({ title, subtitle, children }) => (
  <div>
    <h3 className="text-lg font-black mb-1" style={{ color: C.blue }}>{title}</h3>
    {subtitle && <p className="text-sm mb-5" style={{ color: C.textMuted }}>{subtitle}</p>}
    <div className={subtitle ? "" : "mt-4"}>{children}</div>
  </div>
);

const KV = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
    <span className="text-sm font-bold" style={{ color: C.textMuted }}>{label}</span>
    <span className="text-sm text-right" style={{ color: C.blue }}>{value || "—"}</span>
  </div>
);

const Field = ({ label, value, onChange, textarea, rows = 3, type = "text", sensitive, testid }) => (
  <div className="mb-3">
    <label className="block text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: C.blue }}>
      {label}{sensitive && <KeyRound size={11} style={{ color: C.gold }} />}
    </label>
    {textarea ? (
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} data-testid={testid}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none border" style={{ borderColor: C.border, color: C.blue }} />
    ) : (
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} data-testid={testid}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none border" style={{ borderColor: C.border, color: C.blue }} />
    )}
  </div>
);
