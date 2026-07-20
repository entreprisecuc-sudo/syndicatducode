/**
 * SellerServicesUpsell — La Citadelle Numérique
 * Après avoir décliné la mise à la Une, on propose 3 services vendeur
 * pour augmenter les chances de vente. Redirige vers Stripe Checkout.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ShieldCheck, Handshake, ShoppingCart, AlertCircle } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// Titres exacts (DRY, résistant au re-seed) + icône associée
const TARGET_SERVICES = [
  { title: "Estimation Expert", icon: Star },
  { title: "Vérification La Garde", icon: ShieldCheck },
  { title: "Accompagnement Vente Premium", icon: Handshake },
];

export default function SellerServicesUpsell({ user, onDecline, stacked = false }) {
  const [services, setServices] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    citadelleApi.get("/services")
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : (res.data.services || []);
        const picked = TARGET_SERVICES
          .map(t => {
            const svc = all.find(s => s.title === t.title);
            return svc ? { ...svc, icon: t.icon } : null;
          })
          .filter(Boolean);
        setServices(picked);
      })
      .catch(() => {});
  }, []);

  const buy = async (service) => {
    setError("");
    setLoadingId(service.id);
    try {
      const res = await citadelleApi.post("/payments/service/checkout", {
        service_id: service.id,
        client_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Client",
        client_email: user?.email || "",
        client_message: "Commande depuis la création d'annonce",
        origin_url: window.location.origin,
        cancel_path: "/citadelle/espace-membre/mes-annonces",
        user_id: user?.id || null,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setError("Impossible d'initier le paiement. Réessayez.");
        setLoadingId(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la création du paiement.");
      setLoadingId(null);
    }
  };

  if (!services.length) return null;

  return (
    <div className="p-5 rounded-2xl mb-6 text-left" data-testid="seller-services-upsell"
      style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
      <p className="text-sm font-black mb-1" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
        Augmentez vos chances de vente
      </p>
      <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
        Nos experts de La Garde peuvent valoriser, vérifier et accompagner votre annonce jusqu'à la signature.
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-4" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className={stacked ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-3 gap-3"}>
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <div key={svc.id} className={`flex ${stacked ? "flex-row items-center gap-3" : "flex-col"} p-4 rounded-xl`}
              style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
              data-testid={`upsell-service-${svc.id}`}>
              {stacked ? (
                <>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.12)" }}>
                    <Icon size={16} style={{ color: CITADELLE_COLORS.gold }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate" style={{ color: CITADELLE_COLORS.blue }}>{svc.title}</p>
                      <span className="text-sm font-black flex-shrink-0" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                        {svc.price ? `${svc.price.toLocaleString("fr-FR")} €` : (svc.price_label || "")}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 mb-2" style={{ color: CITADELLE_COLORS.textMuted }}>{svc.short_description}</p>
                    <button
                      type="button"
                      onClick={() => buy(svc)}
                      disabled={loadingId === svc.id}
                      className="px-4 py-1.5 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all hover:scale-[1.02]"
                      style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                      data-testid={`upsell-buy-${svc.id}`}>
                      {loadingId === svc.id ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                      ) : (
                        <><ShoppingCart size={12} /> Acheter</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,164,92,0.12)" }}>
                      <Icon size={15} style={{ color: CITADELLE_COLORS.gold }} />
                    </div>
                    <span className="text-sm font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
                      {svc.price ? `${svc.price.toLocaleString("fr-FR")} €` : (svc.price_label || "")}
                    </span>
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: CITADELLE_COLORS.blue }}>{svc.title}</p>
                  <p className="text-xs mb-3 flex-1" style={{ color: CITADELLE_COLORS.textMuted }}>{svc.short_description}</p>
                  <button
                    type="button"
                    onClick={() => buy(svc)}
                    disabled={loadingId === svc.id}
                    className="w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all hover:scale-[1.02]"
                    style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
                    data-testid={`upsell-buy-${svc.id}`}>
                    {loadingId === svc.id ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
                    ) : (
                      <><ShoppingCart size={12} /> Acheter</>
                    )}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <Link to="/citadelle/services" className="text-xs font-medium underline" style={{ color: CITADELLE_COLORS.textMuted }}>
          Voir tous les services
        </Link>
        <button type="button" onClick={onDecline} className="text-xs font-semibold" style={{ color: CITADELLE_COLORS.textMuted }} data-testid="upsell-decline">
          Non merci
        </button>
      </div>
    </div>
  );
}
