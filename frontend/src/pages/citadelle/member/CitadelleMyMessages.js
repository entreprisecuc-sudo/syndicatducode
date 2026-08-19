/**
 * Mes messages — Espace membre La Citadelle Numérique
 * Liste des conversations pré-vente (acheteur ↔ vendeur)
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, Clock } from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

export default function CitadelleMyMessages() {
  const { t, i18n } = useTranslation();
  const { user } = useCitadelleAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await citadelleApi.get("/messages/my");
      setConversations(res.data.conversations || []);
    } catch { setConversations([]); }
    finally { setLoading(false); }
  };

  const userId = user?.id;

  return (
    <CitadelleLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10" data-testid="my-messages">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.blue }}>
            {t("member.msgs_title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
            {t("member.msgs_count", { count: conversations.length })}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: CITADELLE_COLORS.bg }} />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: CITADELLE_COLORS.bg, border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <MessageSquare size={40} className="mx-auto mb-3" style={{ color: CITADELLE_COLORS.textMuted, opacity: 0.3 }} />
            <p className="text-sm font-medium" style={{ color: CITADELLE_COLORS.textMuted }}>{t("member.msgs_empty")}</p>
            <Link to="/citadelle/annonces" className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}>
              {t("member.msgs_browse")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(conv => {
              const isBuyer = conv.buyer_id === userId;
              const otherName = isBuyer ? conv.seller_name : conv.buyer_name;
              const lastMsg = conv.last_message;
              return (
                <Link key={conv.id} to={`/citadelle/espace-membre/messages/${conv.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ background: "white", border: `1px solid ${CITADELLE_COLORS.border}` }}
                  data-testid={`conversation-row-${conv.id}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,164,92,0.1)" }}>
                    <MessageSquare size={16} style={{ color: CITADELLE_COLORS.gold }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: CITADELLE_COLORS.blue }}>
                      {conv.listing_title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>
                      {isBuyer ? t("member.role_seller") : t("member.role_buyer")} : {otherName}
                    </p>
                    {lastMsg && (
                      <p className="text-xs mt-1 truncate" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {lastMsg.sender_id === userId ? t("member.msgs_you") : ""}{lastMsg.content}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(201,164,92,0.1)", color: CITADELLE_COLORS.gold }}>
                      {conv.message_count}
                    </span>
                    {lastMsg && (
                      <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
                        {new Date(lastMsg.sent_at).toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR")}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CitadelleLayout>
  );
}
