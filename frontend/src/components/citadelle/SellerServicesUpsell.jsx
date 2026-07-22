/**
 * ServicesUpsell — La Citadelle Numérique
 * Propose des services (vendeur OU acheteur) menant à Stripe Checkout.
 * Configurable via `targetServices`, `heading`, `subheading`, `clientMessage`.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ShieldCheck, Handshake, ShoppingCart, AlertCircle, Gauge, LineChart, X } from "lucide-react";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

// Services vendeur (défaut) — titres exacts (DRY, résistant au re-seed) + icône
export const SELLER_SERVICES = [
  { title: "Estimation Expert", icon: Star },
  { title: "Vérification La Garde", icon: ShieldCheck },
  { title: "Accompagnement Vente Premium", icon: Handshake },
];

// Services acheteur — estimations pour vérifier si le site vaut le coup
export const BUYER_ESTIMATION_SERVICES = [
  { title: "Estimation Standard", icon: Gauge },
  { title: "Estimation Expert", icon: LineChart },
];

export default function SellerServicesUpsell({
  user,
  onDecline,
  onRequireAuth,
  stacked = false,
  targetServices = SELLER_SERVICES,
  heading = "Augmentez vos chances de vente",
  subheading = "Nos experts de La Garde peuvent valoriser, vérifier et accompagner votre annonce jusqu'à la signature.",
  clientMessage = "Commande depuis la création d'annonce",
  testid = "seller-services-upsell",
  chooser = false,
}) {
  const [services, setServices] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);

  useEffect(() => {
    citadelleApi.get("/services")
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : (res.data.services || []);
        const picked = targetServices
          .map(t => {
            const svc = all.find(s => s.title === t.title);
            return svc ? { ...svc, icon: t.icon } : null;
          })
          .filter(Boolean);
        setServices(picked);
      })
      .catch(() => {});
  }, [targetServices]);

  const buy = async (service) => {
    if (!user?.email) {
      if (onRequireAuth) { onRequireAuth(); return; }
    }
    setError("");
    setLoadingId(service.id);
    try {
      const res = await citadelleApi.post("/payments/service/checkout", {
        service_id: service.id,
        client_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Client",
        client_email: user?.email || "",
        client_message: clientMessage,
        origin_url: window.location.origin,
        cancel_path: window.location.pathname,
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

  // Mode « chooser » : un seul bouton (sans prix) qui ouvre un modal de choix
  if (chooser) {
    return (
      <div className="p-5 rounded-2xl mb-6 text-left" data-testid={testid}
        style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
        <p className="text-sm font-black mb-1" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>{heading}</p>
        <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>{subheading}</p>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-4" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}
        <button type="button" onClick={() => (user?.email ? setChooserOpen(true) : onRequireAuth?.())}
          className="w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="upsell-open-chooser">
          <LineChart size={13} /> Faire estimer ce site
        </button>
        <div className="flex items-center justify-center mt-4">
          <Link to="/citadelle/services" className="text-xs font-medium underline" style={{ color: CITADELLE_COLORS.textMuted }}>
            Voir tous les services
          </Link>
        </div>

        {chooserOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(8,23,41,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setChooserOpen(false)} data-testid="estimation-chooser-modal">
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-base font-black" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>Choisissez votre estimation</p>
                <button type="button" onClick={() => setChooserOpen(false)} aria-label="Fermer" data-testid="estimation-chooser-close"
                  className="p-1 rounded-lg hover:bg-black/5"><X size={18} style={{ color: CITADELLE_COLORS.textMuted }} /></button>
              </div>
              <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>Une expertise indépendante pour investir en toute confiance.</p>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs mb-3" style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626" }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
                {services.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <button key={svc.id} type="button" onClick={() => buy(svc)} disabled={loadingId === svc.id}
                      className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.01] disabled:opacity-60"
                      style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}
                      data-testid={`estimation-choose-${svc.id}`}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,164,92,0.12)" }}>
                        <Icon size={16} style={{ color: CITADELLE_COLORS.gold }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold" style={{ color: CITADELLE_COLORS.blue }}>{svc.title}</p>
                          <span className="text-sm font-black flex-shrink-0" style={{ color: CITADELLE_COLORS.gold, fontFamily: "'Montserrat', sans-serif" }}>
                            {svc.price ? `${svc.price.toLocaleString("fr-FR")} €` : (svc.price_label || "")}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>{svc.short_description}</p>
                      </div>
                      {loadingId === svc.id && (
                        <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin flex-shrink-0" style={{ borderTopColor: CITADELLE_COLORS.gold }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl mb-6 text-left" data-testid={testid}
      style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
      <p className="text-sm font-black mb-1" style={{ color: CITADELLE_COLORS.blue, fontFamily: "'Montserrat', sans-serif" }}>
        {heading}
      </p>
      <p className="text-xs mb-4" style={{ color: CITADELLE_COLORS.textMuted }}>
        {subheading}
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
        {onDecline && (
          <button type="button" onClick={onDecline} className="text-xs font-semibold" style={{ color: CITADELLE_COLORS.textMuted }} data-testid="upsell-decline">
            Non merci
          </button>
        )}
      </div>
    </div>
  );
}
