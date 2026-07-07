/**
 * Hook de modération — La Citadelle Numérique
 * Récupère l'état de modération frais du membre (via /auth/me) et en déduit :
 * - le bandeau à afficher (avertissement / suspension / bannissement)
 * - s'il peut agir (acheter / vendre / enchérir)
 * - s'il est banni (accès réduit factures + transmission)
 */

import { useState, useEffect } from "react";
import citadelleApi from "@/services/citadelleApi";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";

const DEFAULT = { loading: true, status: "active", banner: null, canTransact: true, banned: false };

export function useCitadelleModeration() {
  const { isAuthenticated } = useCitadelleAuth();
  const [state, setState] = useState(DEFAULT);

  useEffect(() => {
    if (!isAuthenticated) {
      setState({ loading: false, status: "active", banner: null, canTransact: true, banned: false });
      return;
    }
    let active = true;
    citadelleApi.get("/auth/me")
      .then(res => {
        if (!active) return;
        const u = res.data || {};
        const now = new Date().toISOString();
        const log = Array.isArray(u.moderation_log) ? u.moderation_log : [];
        const latest = (type) =>
          log.filter(e => e.type === type).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

        let banner = null, canTransact = true, banned = false;

        if (u.status === "banned") {
          const e = latest("ban") || {};
          banner = { level: "banned", reason: u.ban_reason || e.reason, note: e.note, until: null };
          canTransact = false;
          banned = true;
        } else if (u.status === "suspended" && u.suspended_until && now < u.suspended_until) {
          const e = latest("suspension") || {};
          banner = { level: "suspended", reason: u.suspension_reason || e.reason, note: e.note, until: u.suspended_until };
          canTransact = false;
        } else {
          const w = latest("warning");
          if (w && w.until && now < w.until) {
            banner = { level: "warning", reason: w.reason, note: w.note, until: w.until };
          }
        }
        setState({ loading: false, status: u.status || "active", banner, canTransact, banned });
      })
      .catch(() => { if (active) setState(s => ({ ...s, loading: false })); });
    return () => { active = false; };
  }, [isAuthenticated]);

  return state;
}
