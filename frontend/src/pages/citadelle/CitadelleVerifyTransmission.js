/**
 * Page publique — Vérification d'authenticité d'une Attestation de Transmission.
 * Accessible via le QR code du document. Aucune donnée sensible affichée.
 */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS as C } from "@/config/citadelleConstants";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";

export default function CitadelleVerifyTransmission() {
  const { dossier } = useParams();
  const [state, setState] = useState({ loading: true, data: null });

  useEffect(() => {
    (async () => {
      try { const { data } = await citadelleApi.get(`/transmissions/verify/${dossier}`); setState({ loading: false, data }); }
      catch { setState({ loading: false, data: { valid: false } }); }
    })();
  }, [dossier]);

  const { loading, data } = state;
  const valid = data?.valid;

  return (
    <CitadelleLayout pageTitle="Vérification d'authenticité — La Garde">
      <div className="max-w-xl mx-auto px-4 py-16" data-testid="verify-transmission">
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: C.border }}>
          {loading ? (
            <Loader2 className="animate-spin mx-auto" style={{ color: C.gold }} />
          ) : valid ? (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,.12)" }}>
                <ShieldCheck size={34} style={{ color: C.success }} />
              </div>
              <h1 className="text-xl font-black" style={{ color: C.blue }} data-testid="verify-valid">Document authentique</h1>
              <p className="text-sm mb-6" style={{ color: C.textMuted }}>Cette attestation a bien été émise par La Garde.</p>
              <div className="text-left rounded-xl p-4" style={{ background: C.bg }}>
                <Row label="Dossier" value={data.dossier_number} />
                <Row label="Actif" value={data.asset_title} />
                <Row label="Type" value={data.asset_type} />
                <Row label="Émis le" value={(data.date || "").slice(0, 10)} />
                <Row label="Émetteur" value={data.issuer} />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(220,38,38,.1)" }}>
                <ShieldX size={34} style={{ color: C.error }} />
              </div>
              <h1 className="text-xl font-black" style={{ color: C.blue }} data-testid="verify-invalid">Document introuvable</h1>
              <p className="text-sm" style={{ color: C.textMuted }}>Aucune attestation active ne correspond au dossier « {dossier} ».</p>
            </>
          )}
        </div>
      </div>
    </CitadelleLayout>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between py-1.5">
    <span className="text-xs font-bold" style={{ color: C.textMuted }}>{label}</span>
    <span className="text-xs text-right" style={{ color: C.blue }}>{value || "—"}</span>
  </div>
);
