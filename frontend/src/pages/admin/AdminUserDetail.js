/**
 * Page détail utilisateur - Admin
 * Affiche toutes les informations d'un utilisateur avec onglets
 * Refactoré pour utiliser les sous-composants extraits
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, History, FileText, Briefcase, CreditCard, Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

// Import des onglets
import { 
  ProfileTab, 
  HistoryTab, 
  BookTab, 
  SubscriptionTab, 
  DocumentsTab 
} from "@/components/admin/userDetail";

// Onglets disponibles
const TABS = [
  { id: "profile", label: "Profil", icon: User },
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
      const response = await axios.get(`${API_URL}/admin/users/${userId}/full`, {
        headers: getAuthHeaders()
      });
      setUserData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await axios.get(`${API_URL}/admin/users/${userId}/activity`, {
        headers: getAuthHeaders()
      });
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
        {TABS.map((tab) => {
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
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;
