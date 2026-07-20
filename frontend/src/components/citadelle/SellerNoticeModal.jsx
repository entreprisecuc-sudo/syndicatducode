/**
 * Pop-up « notice vendeur » — La Citadelle Numérique
 * S'affiche à la connexion du vendeur lorsqu'une enchère s'est terminée sans acheteur.
 * Le vendeur doit confirmer avoir compris (bouton) pour ne plus revoir le message.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Info, Image, FileText, Tag, ShieldCheck, Share2 } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";

const TIPS = [
  { icon: Image, title: "Soignez votre visuel", text: "Ajoutez une belle image (capture du site, logo). Les annonces avec un visuel de qualité attirent bien plus l'attention." },
  { icon: FileText, title: "Affinez vos informations", text: "Détaillez revenus, trafic, technologies et potentiel de croissance : plus c'est précis et transparent, plus l'acheteur est rassuré." },
  { icon: Tag, title: "Révisez votre prix de vente", text: "Un prix aligné sur le marché accélère la vente. Vous pouvez le modifier à tout moment." },
  { icon: ShieldCheck, title: "Rendez l'actif crédible", text: "Proposez une démo, une URL publique (si pertinent) ou des preuves de revenus pour lever les doutes." },
  { icon: Share2, title: "Partagez votre annonce", text: "Utilisez le bouton Partager pour diffuser votre annonce sur les réseaux et toucher plus d'acheteurs." },
];

const BLUE = "#0F2747";
const GOLD = "#C9A45C";

export default function SellerNoticeModal() {
  const { isAuthenticated } = useCitadelleAuth();
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setNotice(null); return; }
    citadelleApi.get("/member/notices")
      .then((res) => {
        const first = (res.data.notices || []).find((n) => n.type === "auction_unsold");
        if (first) setNotice(first);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleConfirm = async () => {
    if (!notice) return;
    setSubmitting(true);
    try {
      await citadelleApi.post(`/member/notices/${notice.id}/ack`);
    } catch (e) { /* ignore */ }
    setNotice(null);
    setSubmitting(false);
  };

  if (!notice) return null;

  const prix = notice.price != null ? `${Number(notice.price).toLocaleString("fr-FR")} €` : "votre prix";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,39,71,0.72)", backdropFilter: "blur(4px)" }}
      data-testid="seller-notice-modal"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col"
        style={{ animation: "citadelleNoticeIn 0.25s ease-out" }}
      >
        <style>{`@keyframes citadelleNoticeIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}`}</style>

        {/* En-tête */}
        <div className="px-7 pt-7 pb-5 text-center" style={{ background: BLUE }}>
          <p className="text-[11px] font-bold uppercase tracking-[3px] mb-2" style={{ color: GOLD }}>
            La Citadelle Numérique
          </p>
          <h2 className="text-white font-black text-xl leading-tight">
            Pas d'acheteur cette fois…<br />mais pas de panique !
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-12 rounded-full" style={{ background: GOLD }} />
        </div>

        {/* Corps scrollable */}
        <div className="px-7 py-6 overflow-y-auto">
          <div
            className="flex gap-3 rounded-xl p-4 mb-5"
            style={{ background: "rgba(201,164,92,0.08)", border: `1px solid rgba(201,164,92,0.25)` }}
          >
            <Info size={18} className="shrink-0 mt-0.5" style={{ color: GOLD }} />
            <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
              L'enchère pour <strong style={{ color: BLUE }}>{notice.listing_title}</strong> s'est terminée
              sans acheteur. Bonne nouvelle : <strong style={{ color: BLUE }}>votre annonce reste en ligne</strong> et
              devient une <strong style={{ color: BLUE }}>annonce standard</strong>. Votre prix de réserve devient
              par défaut votre <strong style={{ color: BLUE }}>prix de vente ({prix})</strong>, modifiable à tout moment.
            </p>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[2px] mb-3" style={{ color: GOLD }}>
            5 conseils pour vendre plus vite
          </p>
          <ul className="space-y-3">
            {TIPS.map((t, i) => (
              <li key={i} className="flex gap-3" data-testid={`notice-tip-${i}`}>
                <span
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ background: "rgba(15,39,71,0.06)", color: BLUE }}
                >
                  <t.icon size={16} />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: BLUE }}>{t.title}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#64748B" }}>{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="px-7 py-5 border-t flex flex-col sm:flex-row gap-3" style={{ borderColor: "#EDF0F5" }}>
          <Link
            to="/citadelle/espace-membre/annonces"
            onClick={handleConfirm}
            className="flex-1 text-center rounded-xl py-3 font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "rgba(15,39,71,0.06)", color: BLUE }}
            data-testid="notice-edit-listing-btn"
          >
            Modifier mon annonce
          </Link>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-xl py-3 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: GOLD, color: BLUE }}
            data-testid="notice-confirm-btn"
          >
            {submitting ? "…" : "J'ai compris"}
          </button>
        </div>
      </div>
    </div>
  );
}
