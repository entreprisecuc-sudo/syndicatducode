/**
 * Espace membre — Mes documents de transmission (La Garde)
 * Acheteur : Attestation de Transmission complète. Vendeur : Titre de Cession.
 */
import { useState, useEffect } from "react";
import { ShieldCheck, Download, FileText, Loader2 } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS as C } from "@/config/citadelleConstants";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";

export default function CitadelleMyTransmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    (async () => {
      try { const { data } = await citadelleApi.get("/transmissions/my"); setItems(data.transmissions || []); }
      catch { setItems([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const download = async (t) => {
    setBusy(t.id);
    try {
      const res = await citadelleApi.get(`/transmissions/${t.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t.role === "buyer" ? "attestation" : "titre-de-cession"}-${t.dossier_number}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setBusy(""); }
  };

  return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10" data-testid="my-transmissions">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck style={{ color: C.gold }} size={26} />
          <div>
            <h1 className="text-2xl font-black" style={{ color: C.blue }}>Mes transmissions</h1>
            <p className="text-sm" style={{ color: C.textMuted }}>Documents officiels émis par La Garde</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: C.gold }} /></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: C.border }} data-testid="my-transmissions-empty">
            <FileText size={40} style={{ color: C.border }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: C.textMuted }}>Aucun document de transmission pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: C.border }} data-testid={`transmission-item-${t.id}`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,.12)" }}>
                  <ShieldCheck size={20} style={{ color: C.gold }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate" style={{ color: C.blue }}>{t.asset_title}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>
                    {t.role === "buyer" ? "Attestation de Transmission" : "Titre de Cession"} · Dossier {t.dossier_number}
                  </p>
                </div>
                <button onClick={() => download(t)} disabled={busy === t.id} data-testid={`download-transmission-${t.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold flex-shrink-0 disabled:opacity-60" style={{ background: C.blue }}>
                  {busy === t.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}
