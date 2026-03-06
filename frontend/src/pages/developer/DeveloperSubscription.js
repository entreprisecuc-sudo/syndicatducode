/**
 * Page Abonnement - Espace Développeur
 * Voir son abonnement actuel et souscrire à un plan
 */

import { useState, useEffect } from "react";
import { 
  CreditCard, Check, Star, Calendar, AlertCircle, 
  Clock, ArrowRight, X
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

const DeveloperSubscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal souscription
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState("monthly");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        axios.get(`${API_URL}/subscriptions/plans`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/subscriptions/my-subscription`, { headers: getAuthHeaders() })
      ]);
      setPlans(plansRes.data.plans);
      setCurrentSubscription(subRes.data.subscription);
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const openSubscribeModal = (plan) => {
    setSelectedPlan(plan);
    setSelectedDuration("monthly");
    setShowModal(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setSubscribing(true);
    try {
      await axios.post(
        `${API_URL}/subscriptions/subscribe`,
        { plan_id: selectedPlan.id, duration: selectedDuration },
        { headers: getAuthHeaders() }
      );
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la souscription");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) return;
    
    try {
      await axios.post(`${API_URL}/subscriptions/cancel`, {}, {
        headers: getAuthHeaders()
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    }
  };

  const getPrice = (plan, duration) => {
    return duration === "monthly" ? plan.price_monthly : plan.price_yearly;
  };

  const getDurationLabel = (duration) => {
    return duration === "monthly" ? "mois" : "an";
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold mb-6 lg:hidden" style={{ color: "var(--text-primary)" }}>
        Mon Abonnement
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--sage)" }}></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : (
        <>
          {/* Abonnement actuel */}
          {currentSubscription ? (
            <div 
              className="p-6 rounded-xl mb-8"
              style={{ 
                background: "linear-gradient(135deg, var(--sage-dark), var(--sage))"
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-white/70 text-sm mb-1">Votre abonnement actuel</p>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentSubscription.plan_name}
                  </h2>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <CreditCard size={16} />
                      {currentSubscription.price}€/{currentSubscription.duration === "monthly" ? "mois" : "an"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      Expire le {new Date(currentSubscription.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                    {currentSubscription.status === "active" ? "✓ Actif" : currentSubscription.status}
                  </span>
                  <button 
                    onClick={handleCancel}
                    className="px-3 py-1 rounded-full bg-red-500/20 text-red-200 text-sm hover:bg-red-500/30 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="p-6 rounded-xl mb-8"
              style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)" }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ background: "var(--sage-dark)" }}>
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    Vous n'avez pas d'abonnement actif
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Souscrivez à un plan pour accéder à toutes les fonctionnalités et opportunités de missions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans disponibles */}
          <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {currentSubscription ? "Changer de plan" : "Choisir un plan"}
          </h2>

          {plans.length === 0 ? (
            <div 
              className="p-8 rounded-xl text-center"
              style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)" }}
            >
              <Clock size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)" }}>
                Aucun plan disponible pour le moment.
                <br />Les plans seront bientôt disponibles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  className={`p-6 rounded-xl relative ${
                    currentSubscription?.plan_id === plan.id ? "ring-2 ring-green-500" : ""
                  }`}
                  style={{ 
                    background: "var(--bg-card)", 
                    border: plan.is_recommended 
                      ? "2px solid var(--sage)" 
                      : "1px solid var(--border-color)"
                  }}
                >
                  {plan.is_recommended && (
                    <div 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1"
                      style={{ background: "var(--sage)" }}
                    >
                      <Star size={12} />
                      Recommandé
                    </div>
                  )}

                  {currentSubscription?.plan_id === plan.id && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                      Plan actuel
                    </div>
                  )}

                  <h3 
                    className="font-semibold text-lg mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.name}
                  </h3>
                  
                  <p 
                    className="text-sm mb-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span 
                      className="text-3xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {plan.price_monthly}€
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>/mois</span>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      ou {plan.price_yearly}€/an
                      {plan.price_yearly < plan.price_monthly * 12 && (
                        <span className="text-green-500 ml-1">
                          (économisez {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                        </span>
                      )}
                    </p>
                  </div>

                  {plan.trial_days > 0 && (
                    <p 
                      className="text-sm mb-4 px-3 py-1.5 rounded-lg inline-block"
                      style={{ background: "var(--sage-dark)", color: "white" }}
                    >
                      {plan.trial_days} jours d'essai gratuit
                    </p>
                  )}

                  {plan.features.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li 
                          key={i} 
                          className="text-sm flex items-center gap-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Check size={16} className="text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => openSubscribeModal(plan)}
                    disabled={currentSubscription?.plan_id === plan.id}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      currentSubscription?.plan_id === plan.id
                        ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                        : "text-white hover:opacity-90"
                    }`}
                    style={{ 
                      background: currentSubscription?.plan_id === plan.id 
                        ? undefined 
                        : "var(--sage)"
                    }}
                  >
                    {currentSubscription?.plan_id === plan.id ? (
                      "Plan actuel"
                    ) : (
                      <>
                        Choisir ce plan
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Modal de souscription */}
          {showModal && selectedPlan && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div 
                className="w-full max-w-md rounded-xl overflow-hidden"
                style={{ background: "var(--bg-card)" }}
              >
                <div 
                  className="p-5"
                  style={{ background: "var(--sage)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Souscrire à {selectedPlan.name}
                    </h3>
                    <button 
                      onClick={() => setShowModal(false)}
                      className="text-white/70 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    Choisissez votre période de facturation :
                  </p>

                  <div className="space-y-3 mb-6">
                    {/* Option mensuelle */}
                    <label 
                      className={`p-4 rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedDuration === "monthly" ? "ring-2" : ""
                      }`}
                      style={{ 
                        background: "var(--bg-section)",
                        borderColor: selectedDuration === "monthly" ? "var(--sage)" : "var(--border-color)",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="duration"
                          checked={selectedDuration === "monthly"}
                          onChange={() => setSelectedDuration("monthly")}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                            Mensuel
                          </p>
                          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            Facturé chaque mois
                          </p>
                        </div>
                      </div>
                      <span 
                        className="font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {selectedPlan.price_monthly}€/mois
                      </span>
                    </label>

                    {/* Option annuelle */}
                    <label 
                      className={`p-4 rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedDuration === "yearly" ? "ring-2" : ""
                      }`}
                      style={{ 
                        background: "var(--bg-section)",
                        borderColor: selectedDuration === "yearly" ? "var(--sage)" : "var(--border-color)",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="duration"
                          checked={selectedDuration === "yearly"}
                          onChange={() => setSelectedDuration("yearly")}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                            Annuel
                            {selectedPlan.price_yearly < selectedPlan.price_monthly * 12 && (
                              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-500">
                                Économisez {Math.round((1 - selectedPlan.price_yearly / (selectedPlan.price_monthly * 12)) * 100)}%
                              </span>
                            )}
                          </p>
                          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            Facturé une fois par an
                          </p>
                        </div>
                      </div>
                      <span 
                        className="font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {selectedPlan.price_yearly}€/an
                      </span>
                    </label>
                  </div>

                  {selectedPlan.trial_days > 0 && (
                    <div 
                      className="p-3 rounded-lg mb-4"
                      style={{ background: "var(--sage-dark)" }}
                    >
                      <p className="text-white text-sm text-center">
                        🎁 Essai gratuit de {selectedPlan.trial_days} jours inclus
                      </p>
                    </div>
                  )}

                  <div 
                    className="p-3 rounded-lg mb-6"
                    style={{ background: "var(--bg-section)" }}
                  >
                    <div className="flex justify-between mb-2">
                      <span style={{ color: "var(--text-muted)" }}>Plan</span>
                      <span style={{ color: "var(--text-primary)" }}>{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>Total</span>
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {getPrice(selectedPlan, selectedDuration)}€/{getDurationLabel(selectedDuration)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="w-full py-3 rounded-lg font-medium text-white transition-colors"
                    style={{ background: "var(--sage)" }}
                  >
                    {subscribing ? "Traitement..." : "Confirmer l'abonnement"}
                  </button>

                  <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
                    En confirmant, vous acceptez les conditions d'utilisation et la politique de confidentialité.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default DeveloperSubscription;
