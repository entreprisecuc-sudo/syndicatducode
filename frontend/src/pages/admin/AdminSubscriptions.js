/**
 * Gestion des abonnements - Admin
 * Configuration des plans et vue des abonnés
 */

import { useState, useEffect } from "react";
import { CreditCard, Plus, Users, TrendingUp, Settings } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import PlanCard from "@/components/admin/subscriptions/PlanCard";
import SubscribersList from "@/components/admin/subscriptions/SubscribersList";
import PlanModal from "@/components/admin/subscriptions/PlanModal";
import StripeConfigModal from "@/components/admin/subscriptions/StripeConfigModal";

const EMPTY_PLAN_FORM = {
  name: "", description: "", price_monthly: "", price_yearly: "",
  features: "", is_recommended: false, trial_days: 0
};

const EMPTY_STRIPE_FORM = {
  stripe_public_key: "", stripe_secret_key: "",
  stripe_webhook_secret: "", is_live_mode: false
};

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeForm, setStripeForm] = useState(EMPTY_STRIPE_FORM);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === "subscribers") fetchSubscriptions();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, statsRes] = await Promise.all([
        api.get('/subscriptions/admin/plans'),
        api.get('/subscriptions/admin/stats')
      ]);
      setPlans(plansRes.data.plans);
      setStats(statsRes.data);
    } catch {
      // Erreur gérée silencieusement
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions/admin/subscriptions');
      setSubscriptions(res.data.subscriptions);
    } catch { /* silence */ }
  };

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm(EMPTY_PLAN_FORM);
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly.toString(),
      price_yearly: plan.price_yearly.toString(),
      features: plan.features.join("\n"),
      is_recommended: plan.is_recommended,
      trial_days: plan.trial_days
    });
    setShowPlanModal(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const data = {
      ...planForm,
      price_monthly: parseFloat(planForm.price_monthly) || 0,
      price_yearly: parseFloat(planForm.price_yearly) || 0,
      features: planForm.features.split("\n").filter(f => f.trim()),
      trial_days: parseInt(planForm.trial_days) || 0
    };
    try {
      editingPlan
        ? await api.put(`/subscriptions/admin/plans/${editingPlan.id}`, data)
        : await api.post('/subscriptions/admin/plans', data);
      setShowPlanModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    } finally {
      setFormLoading(false);
    }
  };

  const togglePlanStatus = async (plan) => {
    try {
      await api.put(`/subscriptions/admin/plans/${plan.id}`, {
        status: plan.status === "active" ? "inactive" : "active"
      });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || "Erreur"); }
  };

  const deletePlan = async (planId) => {
    if (!window.confirm("Supprimer ce plan ?")) return;
    try {
      await api.delete(`/subscriptions/admin/plans/${planId}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || "Erreur"); }
  };

  const handleStripeSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.put('/subscriptions/admin/stripe-config', stripeForm);
      setShowStripeModal(false);
    } catch (err) { alert(err.response?.data?.detail || "Erreur"); }
    finally { setFormLoading(false); }
  };

  const TABS = [
    { id: "plans", label: "Plans", icon: CreditCard },
    { id: "subscribers", label: "Abonnés", icon: Users },
    { id: "config", label: "Configuration", icon: Settings }
  ];

  return (
    <AdminLayout>
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Abonnés actifs", value: stats.active_subscribers || 0, icon: Users },
            { label: "Plans disponibles", value: stats.total_plans || 0, icon: CreditCard },
            { label: "Revenu mensuel", value: `${stats.monthly_revenue || 0}€`, icon: TrendingUp },
            { label: "Revenu annuel", value: `${stats.yearly_revenue || 0}€`, icon: TrendingUp }
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="p-4 rounded-xl"
              style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
            >
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: "var(--admin-bg-section)" }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? "text-white" : "text-gray-400 hover:text-gray-300"
            }`}
            style={activeTab === id ? { background: "var(--admin-bg-card)" } : {}}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      ) : activeTab === "plans" ? (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openCreatePlanModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Plus size={16} />
              Nouveau plan
            </button>
          </div>
          {plans.length === 0 ? (
            <div
              className="p-8 rounded-xl text-center"
              style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
            >
              <CreditCard size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">Aucun plan créé</p>
              <button onClick={openCreatePlanModal} className="px-4 py-2 rounded-lg bg-red-500 text-white">
                Créer le premier plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onToggleStatus={togglePlanStatus}
                  onEdit={openEditPlanModal}
                  onDelete={deletePlan}
                />
              ))}
            </div>
          )}
        </>
      ) : activeTab === "subscribers" ? (
        <SubscribersList subscriptions={subscriptions} />
      ) : (
        <div
          className="p-6 rounded-xl"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <h3 className="font-semibold text-white mb-2">Configuration Stripe</h3>
          <p className="text-sm text-gray-400 mb-4">
            Gérez vos clés Stripe pour activer les paiements en ligne.
          </p>
          <button
            onClick={() => setShowStripeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm"
          >
            <Settings size={16} />
            Configurer Stripe
          </button>
        </div>
      )}

      <PlanModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        planForm={planForm}
        setPlanForm={setPlanForm}
        onSubmit={handlePlanSubmit}
        loading={formLoading}
        isEditing={!!editingPlan}
      />

      <StripeConfigModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        stripeForm={stripeForm}
        setStripeForm={setStripeForm}
        onSubmit={handleStripeSubmit}
        loading={formLoading}
      />
    </AdminLayout>
  );
};

export default AdminSubscriptions;
