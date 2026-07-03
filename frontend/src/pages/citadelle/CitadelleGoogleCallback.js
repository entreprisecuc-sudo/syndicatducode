/**
 * CitadelleGoogleCallback
 * Traite le retour de Google OAuth (Emergent Auth).
 * Lit le #session_id dans l'URL, l'échange contre un JWT Citadelle.
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import CGUAcceptanceModal from "@/components/citadelle/CGUAcceptanceModal";
import { Loader } from "lucide-react";

export default function CitadelleGoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCitadelleAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState("");
  const [showCGU, setShowCGU] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [cguLoading, setCguLoading] = useState(false);

  useEffect(() => {
    // Prévenir le double traitement (React StrictMode)
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || window.location.hash;
    const sessionId = hash.includes("session_id=")
      ? hash.split("session_id=")[1].split("&")[0]
      : null;

    if (!sessionId) {
      navigate("/citadelle/connexion", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await citadelleApi.post("/auth/google/callback", { session_id: sessionId });
        const { access_token, user } = res.data;

        if (!user.cgu_accepted) {
          setPendingAuth({ token: access_token, user });
          setShowCGU(true);
        } else {
          login(access_token, user);
          const returnUrl = sessionStorage.getItem("citadelle_return_url");
          sessionStorage.removeItem("citadelle_return_url");
          navigate(returnUrl || "/citadelle/espace-membre", { replace: true });
        }
      } catch {
        setError("Erreur lors de la connexion Google. Redirection en cours...");
        setTimeout(() => navigate("/citadelle/connexion", { replace: true }), 2500);
      }
    })();
  }, []);

  const handleCGUAccept = async () => {
    setCguLoading(true);
    try {
      await citadelleApi.patch("/auth/accept-cgu", {}, {
        headers: { Authorization: `Bearer ${pendingAuth.token}` }
      });
      login(pendingAuth.token, { ...pendingAuth.user, cgu_accepted: true });
      setShowCGU(false);
      const returnUrl = sessionStorage.getItem("citadelle_return_url");
      sessionStorage.removeItem("citadelle_return_url");
      navigate(returnUrl || "/citadelle/espace-membre", { replace: true });
    } catch {
      setError("Erreur lors de l'enregistrement du consentement.");
    } finally {
      setCguLoading(false);
    }
  };

  if (showCGU && pendingAuth) {
    return (
      <CGUAcceptanceModal
        isOpen={true}
        onAccept={handleCGUAccept}
        onClose={() => navigate("/citadelle/connexion", { replace: true })}
        loading={cguLoading}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <>
          <Loader size={32} className="animate-spin" style={{ color: CITADELLE_COLORS.gold }} />
          <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>Connexion Google en cours...</p>
        </>
      )}
    </div>
  );
}
