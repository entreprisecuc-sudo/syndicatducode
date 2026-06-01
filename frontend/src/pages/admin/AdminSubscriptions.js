/**
 * Gestion des abonnements - Admin
 * Configuration des plans et vue des abonnés
 */

import { useState, useEffect } from "react";
import { 
  CreditCard, Plus, Edit, Trash2, Eye, EyeOff, Star,
  Users, TrendingUp, Settings, Check, X
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminModal, { 
  ModalFormGroup, 
  ModalInput, 
  ModalTextarea, 
  ModalSelect,
  ModalActions,
  ModalSubmitButton,
  ModalCancelButton 
} from "@/components/admin/AdminModal";
import api from "@/services/api";

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState("plans"); // plans, subscribers, config
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [stripeConfig, setStripeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal plan
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    features: "",
    is_recommended: false,
    trial_days: 0
  });
  const [formLoading, setFormLoading] = useState(false);

  // Modal Stripe config
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeForm, setStripeForm] = useState({
    stripe_public_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    is_live_mode: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, statsRes, configRes] = await Promise.all([
        api.get('/subscriptions/admin/plans'),
        api.get('/subscriptions/admin/stats'),
        api.get('/subscriptions/admin/stripe-config')
      ]);
      setPlans(plansRes.data.plans);
      setStats(statsRes.data);
      setStripeConfig(configRes.data);
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions/admin/subscriptions');
      setSubscriptions(res.data.subscriptions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "subscribers") {
      fetchSubscriptions();
    }
  }, [activeTab]);

  // Plans CRUD
  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      description: "",
      price_monthly: "",
      price_yearly: "",
      features: "",
      is_recommended: false,
      trial_days: 0
    });
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

    const dataToSend = {
      name: planForm.name,
      description: planForm.description,
      price_monthly: parseFloat(planForm.price_monthly) || 0,
      price_yearly: parseFloat(planForm.price_yearly) || 0,
      features: planForm.features.split("\n").filter(f => f.trim()),
      is_recommended: planForm.is_recommended,
      trial_days: parseInt(planForm.trial_days) || 0
    };

    try {
      if (editingPlan) {
        await api.put(`/subscriptions/admin/plans/${editingPlan.id}`, dataToSend);
      } else {
        await api.post(`/subscriptions/admin/plans`, dataToSend);
      }
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
      await api.put(`/subscriptions/admin/plans/${plan.id}`,  { status: plan.status === "active" ? "inactive" : "active" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm("Supprimer ce plan ?")) return;
    try {
      await api.delete(`/subscriptions/admin/plans/${planId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    }
  };

  // Stripe config
  const handleStripeSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await api.put(`/subscriptions/admin/stripe-config`, stripeForm);
      setShowStripeModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6 lg:hidden text-white">Abonnements</h1>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-semibold">Gestion des Abonnements</h2>
          <p className="text-gray-400 text-sm">Configurez les plans et gérez les abonnés</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowStripeModal(true)}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
          >
            <Settings size={18} />
            Config Stripe
          </button>
          <button 
            onClick={openCreatePlanModal}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Nouveau plan
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
            <div className="text-2xl font-bold text-blue-400">{stats.plans.active}</div>
            <div className="text-gray-400 text-sm">Plans actifs</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
            <div className="text-2xl font-bold text-green-400">{stats.subscriptions.active}</div>
            <div className="text-gray-400 text-sm">Abonnés actifs</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
            <div className="text-2xl font-bold text-yellow-400">{stats.subscriptions.total}</div>
            <div className="text-gray-400 text-sm">Total abonnements</div>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
            <div className="text-2xl font-bold text-purple-400">{stats.revenue.monthly_estimate}€</div>
            <div className="text-gray-400 text-sm">Revenus mensuels</div>
          </div>
        </div>
      )}

      {/* Stripe Status */}
      <div 
        className="p-4 rounded-xl mb-6 flex items-center justify-between"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="flex items-center gap-3">
          <CreditCard size={24} className={stripeConfig?.is_configured ? "text-green-400" : "text-gray-500"} />
          <div>
            <p className="text-white font-medium">
              Stripe {stripeConfig?.is_configured ? "configuré" : "non configuré"}
            </p>
            <p className="text-gray-400 text-sm">
              {stripeConfig?.is_configured 
                ? `Mode ${stripeConfig.is_live_mode ? "Production" : "Test"}`
                : "Configurez vos clés Stripe pour activer les paiements"
              }
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          stripeConfig?.is_configured ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
        }`}>
          {stripeConfig?.is_configured ? "Actif" : "En attente"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "plans", label: "Plans", icon: CreditCard },
          { key: "subscribers", label: "Abonnés", icon: Users }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2 ${
              activeTab === tab.key 
                ? "bg-red-500 text-white" 
                : "bg-[#16213e] text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : activeTab === "plans" ? (
        /* Plans List */
        plans.length === 0 ? (
          <div className="p-8 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
            <CreditCard size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-4">Aucun plan créé</p>
            <button onClick={openCreatePlanModal} className="px-4 py-2 rounded-lg bg-red-500 text-white">
              Créer le premier plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className={`p-5 rounded-xl relative ${plan.status === "inactive" ? "opacity-60" : ""}`}
                style={{ 
                  background: "var(--admin-bg-card)", 
                  border: plan.is_recommended ? "2px solid #e94560" : "1px solid #1f4068"
                }}
              >
                {plan.is_recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium flex items-center gap-1">
                    <Star size={12} />
                    Recommandé
                  </div>
                )}
                
                <h3 className="text-white font-semibold text-lg mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price_monthly}€</span>
                  <span className="text-gray-400">/mois</span>
                  <p className="text-sm text-gray-500">ou {plan.price_yearly}€/an</p>
                </div>
                
                {plan.features.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                        <Check size={14} className="text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{plan.subscriber_count} abonné(s)</span>
                  {plan.trial_days > 0 && <span>{plan.trial_days}j d'essai</span>}
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => togglePlanStatus(plan)} className={`p-2 rounded-lg ${plan.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-600/20 text-gray-400"}`}>
                    {plan.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => openEditPlanModal(plan)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deletePlan(plan.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Subscribers List */
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f4068]">
                <th className="text-left p-4 text-gray-400 font-medium">Utilisateur</th>
                <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
                <th className="text-left p-4 text-gray-400 font-medium">Prix</th>
                <th className="text-left p-4 text-gray-400 font-medium">Statut</th>
                <th className="text-left p-4 text-gray-400 font-medium">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-400">
                    Aucun abonnement
                  </td>
                </tr>
              ) : subscriptions.map(sub => (
                <tr key={sub.id} className="border-b border-[#1f4068]/50">
                  <td className="p-4 text-white">{sub.user_email}</td>
                  <td className="p-4 text-gray-300">{sub.plan_name}</td>
                  <td className="p-4 text-gray-300">{sub.price}€/{sub.duration === "monthly" ? "mois" : "an"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      sub.status === "active" ? "bg-green-500/20 text-green-400" :
                      sub.status === "expired" ? "bg-red-500/20 text-red-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(sub.end_date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Plan */}
      <AdminModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? "Modifier le plan" : "Nouveau plan"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handlePlanSubmit}>
          <ModalFormGroup label="Nom du plan" required>
            <ModalInput
              type="text"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              required
              placeholder="Ex: Starter, Pro, Premium"
            />
          </ModalFormGroup>
          
          <ModalFormGroup label="Description" required>
            <ModalTextarea
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              required
              rows={2}
              placeholder="Description courte du plan"
            />
          </ModalFormGroup>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <ModalFormGroup label="Prix mensuel (€)" required>
              <ModalInput
                type="number"
                step="0.01"
                value={planForm.price_monthly}
                onChange={(e) => setPlanForm({ ...planForm, price_monthly: e.target.value })}
                required
              />
            </ModalFormGroup>
            <ModalFormGroup label="Prix annuel (€)" required>
              <ModalInput
                type="number"
                step="0.01"
                value={planForm.price_yearly}
                onChange={(e) => setPlanForm({ ...planForm, price_yearly: e.target.value })}
                required
              />
            </ModalFormGroup>
          </div>
          
          <ModalFormGroup label="Fonctionnalités (une par ligne)">
            <ModalTextarea
              value={planForm.features}
              onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
              rows={4}
              placeholder={"Accès aux projets\nSupport prioritaire\n..."}
            />
          </ModalFormGroup>
          
          <ModalFormGroup label="Jours d'essai gratuit">
            <ModalInput
              type="number"
              min="0"
              value={planForm.trial_days}
              onChange={(e) => setPlanForm({ ...planForm, trial_days: e.target.value })}
            />
          </ModalFormGroup>
          
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={planForm.is_recommended}
                onChange={(e) => setPlanForm({ ...planForm, is_recommended: e.target.checked })}
                className="w-5 h-5 rounded"
                style={{ accentColor: "var(--admin-accent)" }}
              />
              <span style={{ color: "var(--admin-text-secondary)" }}>
                Mettre en avant ce plan (recommandé)
              </span>
            </label>
          </div>
          
          <ModalActions>
            <ModalSubmitButton loading={formLoading}>
              {editingPlan ? "Mettre à jour" : "Créer le plan"}
            </ModalSubmitButton>
            <ModalCancelButton onClick={() => setShowPlanModal(false)} />
          </ModalActions>
        </form>
      </AdminModal>

      {/* Modal Stripe Config */}
      <AdminModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        title="Configuration Stripe"
        maxWidth="max-w-lg"
      >
        <p style={{ color: "var(--admin-text-secondary)" }} className="text-sm mb-6">
          Entrez vos clés Stripe pour activer les paiements. 
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
            Obtenir les clés →
          </a>
        </p>
        
        <form onSubmit={handleStripeSubmit}>
          <ModalFormGroup label="Clé publique (pk_...)">
            <ModalInput
              type="text"
              value={stripeForm.stripe_public_key}
              onChange={(e) => setStripeForm({ ...stripeForm, stripe_public_key: e.target.value })}
              placeholder="pk_test_..."
            />
          </ModalFormGroup>
          
          <ModalFormGroup label="Clé secrète (sk_...)">
            <ModalInput
              type="password"
              value={stripeForm.stripe_secret_key}
              onChange={(e) => setStripeForm({ ...stripeForm, stripe_secret_key: e.target.value })}
              placeholder="sk_test_..."
            />
          </ModalFormGroup>
          
          <ModalFormGroup label="Webhook secret (whsec_...)">
            <ModalInput
              type="password"
              value={stripeForm.stripe_webhook_secret}
              onChange={(e) => setStripeForm({ ...stripeForm, stripe_webhook_secret: e.target.value })}
              placeholder="whsec_..."
            />
          </ModalFormGroup>
          
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={stripeForm.is_live_mode}
                onChange={(e) => setStripeForm({ ...stripeForm, is_live_mode: e.target.checked })}
                className="w-5 h-5 rounded"
                style={{ accentColor: "var(--admin-accent)" }}
              />
              <span style={{ color: "var(--admin-text-secondary)" }}>Mode Production (clés live)</span>
            </label>
          </div>
          
          <div 
            className="p-3 rounded-lg mb-4"
            style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
          >
            <p className="text-yellow-400 text-sm">
              ⚠️ En mode test, aucun paiement réel ne sera effectué.
            </p>
          </div>
          
          <ModalActions>
            <button 
              type="submit" 
              disabled={formLoading} 
              className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {formLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
            <ModalCancelButton onClick={() => setShowStripeModal(false)} />
          </ModalActions>
        </form>
      </AdminModal>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
