/**
 * AnalyticsTracker — envoie une "page vue" à chaque navigation.
 * First-party, RGPD-friendly (l'IP est hachée côté serveur, jamais stockée en clair).
 * Exclut les espaces d'administration.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import citadelleApi from "@/services/citadelleApi";

const SESSION_KEY = "cn_session_id";

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/syndicat-admin") || path.startsWith("/admin")) return;
    citadelleApi
      .post("/analytics/track", {
        session_id: getSessionId(),
        path,
        referrer: document.referrer || null,
      })
      .catch(() => {}); // silencieux : le tracking ne doit jamais gêner l'utilisateur
  }, [location.pathname]);

  return null;
}

export default AnalyticsTracker;
