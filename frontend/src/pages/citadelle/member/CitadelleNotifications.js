/**
 * Page "À traiter" complète — liste de toutes les interactions en attente.
 * Chaque notification est un lien vers l'action à réaliser.
 */
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import MemberActivityPanel from "@/components/citadelle/MemberActivityPanel";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";

const C = CITADELLE_COLORS;

export default function CitadelleNotifications() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useCitadelleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/citadelle/connexion");
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <CitadelleLayout>
      <div className="min-h-screen py-10 px-4" style={{ background: C.bg }}>
        <div className="max-w-3xl mx-auto">
          <Link
            to="/citadelle/espace-membre"
            data-testid="notifications-back"
            className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors hover:text-[#C9A45C]"
            style={{ color: C.textMuted }}
          >
            <ArrowLeft size={16} />
            {t("member.notif_back")}
          </Link>

          <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif", color: C.blue }}>
            {t("member.notif_title")}
          </h1>

          <MemberActivityPanel hideTitle />
        </div>
      </div>
    </CitadelleLayout>
  );
}
