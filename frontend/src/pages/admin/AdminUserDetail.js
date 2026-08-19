/**
 * Page détail utilisateur - Admin
 * Affiche toutes les informations d'un utilisateur avec onglets
 * Refactoré pour utiliser les sous-composants extraits
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, History, FileText, Briefcase, CreditCard, Loader2, Receipt, Landmark, Shield
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getToken } from "@/services/authService";
import { useAdminTheme } from "@/context/AdminThemeContext";

// Import des onglets
import { 
  ProfileTab, 
  HistoryTab, 
  BookTab, 
  SubscriptionTab, 
  DocumentsTab 
} from "@/components/admin/userDetail";
import BillingTab from "@/components/admin/userDetail/BillingTab";
import api from "@/services/api";

// Onglets disponibles
const TABS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "billing", label: "Factures", icon: Receipt },
  { id: "history", label: "Historique", icon: History },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "book", label: "Book", icon: Briefcase },
  { id: "subscription", label: "Abonnement", icon: CreditCard }
];

/**
 * Page principale
 */
const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useAdminTheme();
  
  const [userData, setUserData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [citadelleData, setCitadelleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (activeTab === "history" && activity.length === 0) {
      fetchActivity();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}/full`);
      setUserData(response.data);
      // Si utilisateur Citadelle, charger les données spécifiques
      if (response.data?.user?.platform === "citadelle") {
        try {
          const citRes = await api.get(`/citadelle/auth/admin/users/${userId}`);
          setCitadelleData(citRes.data);
        } catch { /* pas de données citadelle */ }
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await api.get(`/admin/users/${userId}/activity`);
      setActivity(response.data.activity || []);
    } catch (err) {
      console.error("Erreur chargement activité:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" style={{ color: "var(--admin-accent)" }} size={48} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/syndicat-admin/utilisateurs")}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: "var(--admin-accent)" }}
          >
            Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  const user = userData?.user;
  const profile = userData?.profile;
  const portfolio = userData?.portfolio;
  const subscription = userData?.subscription;
  const isCitadelle = user?.platform === "citadelle";

  // Onglets dynamiques selon la plateforme
  const activeTabs = isCitadelle ? [
    { id: "profile", label: "Profil", icon: User },
    { id: "citadelle_billing", label: "Bancaire / Pro", icon: Landmark },
    { id: "citadelle_docs", label: "Documents", icon: FileText },
    { id: "history", label: "Historique", icon: History },
  ] : TABS;

  return (
    <AdminLayout>
      {/* Bouton retour */}
      <button
        onClick={() => navigate("/syndicat-admin/utilisateurs")}
        className="flex items-center gap-2 transition-colors mb-6 hover:opacity-80"
        style={{ color: "var(--admin-text-secondary)" }}
        data-testid="back-to-users-btn"
      >
        <ArrowLeft size={20} />
        Retour à la liste
      </button>

      {/* Onglets */}
      <div 
        className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: "var(--admin-bg-card)" }}
      >
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap"
              style={{
                background: isActive ? "var(--admin-accent)" : "transparent",
                color: isActive ? "white" : "var(--admin-text-secondary)"
              }}
              data-testid={`tab-${tab.id}`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu de l'onglet actif */}
      <div data-testid={`tab-content-${activeTab}`}>
        {activeTab === "profile" && (
          <ProfileTab user={user} profile={profile} />
        )}
        
        {activeTab === "billing" && (
          <BillingTab userId={userId} userEmail={user?.email} />
        )}
        
        {activeTab === "history" && (
          <HistoryTab activity={activity} loading={activityLoading} />
        )}
        
        {activeTab === "documents" && (
          <DocumentsTab userId={userId} />
        )}
        
        {activeTab === "book" && (
          <BookTab portfolio={portfolio} />
        )}
        
        {activeTab === "subscription" && (
          <SubscriptionTab subscription={subscription} />
        )}

        {/* Onglets Citadelle */}
        {activeTab === "citadelle_billing" && citadelleData && (
          <CitadelleBillingSection data={citadelleData} />
        )}
        {activeTab === "citadelle_docs" && citadelleData && (
          <CitadelleDocsSection data={citadelleData} userId={userId} />
        )}
      </div>
    </AdminLayout>
  );
};

// ── Section Bancaire/Pro Citadelle (admin) ────────────────────────────────────

function CitadelleBillingSection({ data }) {
  const billing = data.billing || {};
  const professional = data.professional || {};
  const isPro = professional.is_professional;

  const Field = ({ label, value }) => (
    <div>
      <span className="text-xs block mb-0.5" style={{ color: "var(--admin-text-secondary)" }}>{label}</span>
      <p className="text-sm font-medium" style={{ color: value ? "var(--admin-text)" : "var(--admin-text-secondary)" }}>
        {value || "Non renseigné"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="citadelle-billing-section">
      {/* Coordonnées bancaires */}
      <div className="p-5 rounded-xl" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={16} style={{ color: "#C9A45C" }} />
          <h3 className="font-bold text-sm">Coordonnées bancaires</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Titulaire" value={billing.account_holder} />
          <Field label="Banque" value={billing.bank_name} />
          <Field label="IBAN" value={billing.iban} />
          <Field label="BIC / SWIFT" value={billing.bic} />
        </div>
      </div>

      {/* Adresse */}
      <div className="p-5 rounded-xl" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
        <h3 className="font-bold text-sm mb-3">Adresse personnelle</h3>
        <p className="text-sm whitespace-pre-line" style={{ color: data.address ? "var(--admin-text)" : "var(--admin-text-secondary)" }}>
          {data.address || "Non renseignée"}
        </p>
      </div>

      {/* Statut professionnel */}
      <div className="p-5 rounded-xl" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: isPro ? "#C9A45C" : "var(--admin-text-secondary)" }} />
          <h3 className="font-bold text-sm">{isPro ? "Professionnel" : "Particulier"}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
            background: isPro ? "rgba(201,164,92,0.15)" : "rgba(107,114,128,0.15)",
            color: isPro ? "#C9A45C" : "#6B7280"
          }}>
            {isPro ? "PRO" : "PARTICULIER"}
          </span>
        </div>
        {isPro && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Raison sociale" value={professional.company_name} />
            <Field label="SIREN" value={professional.siren} />
            <Field label="SIRET" value={professional.siret} />
            <Field label="N° TVA" value={professional.vat_number} />
            <div className="col-span-2">
              <Field label="Adresse du siège" value={professional.company_address} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section Documents Citadelle (admin) ───────────────────────────────────────

function CitadelleDocsSection({ data, userId }) {
  const docs = data.documents || {};
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const DocRow = ({ label, doc, docType }) => {
    const [loading, setLoading] = useState(false);
    const openDoc = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(
          `${backendUrl}/api/citadelle/auth/documents/${userId}/${docType}?token=${encodeURIComponent(token || "")}`
        );
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      } catch (e) {
        alert("Impossible d'ouvrir le document (accès sécurisé).");
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
        <FileText size={18} style={{ color: doc ? "#C9A45C" : "var(--admin-text-secondary)", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {doc ? (
            <p className="text-xs" style={{ color: "#22C55E" }}>
              {doc.filename} — {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>Non fourni</p>
          )}
        </div>
        {doc && (
          <button onClick={openDoc} disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1"
            style={{ background: "rgba(201,164,92,0.15)", color: "#C9A45C" }}>
            {loading && <Loader2 size={12} className="animate-spin" />}
            Voir
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3" data-testid="citadelle-docs-section">
      <DocRow label="Carte d'identité" doc={docs.identity} docType="identity" />
      <DocRow label="RIB (document bancaire)" doc={docs.rib} docType="rib" />
      <DocRow label="Extrait KBIS" doc={docs.kbis} docType="kbis" />
    </div>
  );
}

export default AdminUserDetail;
