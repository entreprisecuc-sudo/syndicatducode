/**
 * Page d'inscription — La Citadelle Numérique
 * Création d'un compte indépendant (platform: citadelle)
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS, CITADELLE_CONFIG } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";
import CGUAcceptanceModal from "@/components/citadelle/CGUAcceptanceModal";

export default function CitadelleRegister() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCGU, setShowCGU] = useState(false);
  const { login } = useCitadelleAuth();
  const navigate = useNavigate();
  useCitadellePageMeta("Inscription");

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return "Prénom et nom obligatoires";
    if (!form.email) return "Email obligatoire";
    if (form.password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
    if (!/[A-Z]/.test(form.password)) return "Le mot de passe doit contenir au moins une majuscule";
    if (!/\d/.test(form.password)) return "Le mot de passe doit contenir au moins un chiffre";
    if (form.password !== form.confirm) return "Les mots de passe ne correspondent pas";
    return null;
  };

  // Étape 1 : validation du formulaire → affichage modale CGU
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setShowCGU(true);
  };

  // Étape 2 : utilisateur accepte les CGU → inscription réelle
  const handleCGUAccept = async () => {
    setLoading(true);
    try {
      await citadelleApi.post("/auth/register", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email,
        password: form.password,
        cgu_accepted: true,
      });
      // Connexion automatique après inscription
      const loginRes = await citadelleApi.post("/auth/login", { email: form.email, password: form.password });
      login(loginRes.data.access_token, loginRes.data.user);
      setShowCGU(false);
      setSuccess(true);
      setTimeout(() => navigate("/citadelle/espace-membre"), 1500);
    } catch (err) {
      setShowCGU(false);
      setError(err.response?.data?.detail || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>
        <div className="text-center">
          <CheckCircle size={64} style={{ color: CITADELLE_COLORS.gold }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Compte créé avec succès !</h2>
          <p className="mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>Redirection vers votre espace membre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.night} 0%, ${CITADELLE_COLORS.blue} 100%)` }}>

      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/citadelle">
            <img src={CITADELLE_CONFIG.logo} alt={CITADELLE_CONFIG.name} className="h-20 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: "white" }}>
            Créer un compte
          </h1>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            Rejoignez la Citadelle — Publication gratuite
          </p>
        </div>

        {/* Formulaire */}
        <div className="p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,164,92,0.2)", backdropFilter: "blur(12px)" }}>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="citadelle-register-form">

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }} data-testid="citadelle-register-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Prénom</label>
                <input type="text" name="first_name" value={form.first_name} onChange={handleChange}
                  placeholder="Jean" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  data-testid="citadelle-register-firstname" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Nom</label>
                <input type="text" name="last_name" value={form.last_name} onChange={handleChange}
                  placeholder="Dupont" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  data-testid="citadelle-register-lastname" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Adresse email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="jean.dupont@email.fr" autoComplete="email" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                data-testid="citadelle-register-email" />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre" className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  data-testid="citadelle-register-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Confirmer le mot de passe</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                data-testid="citadelle-register-confirm" />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night, marginTop: "8px" }}
              data-testid="citadelle-register-submit"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
              ) : (
                <>
                  <UserPlus size={16} />
                  Créer mon compte gratuitement
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Déjà un compte ?{" "}
              <Link to="/citadelle/connexion" className="font-semibold" style={{ color: CITADELLE_COLORS.gold }} data-testid="citadelle-register-login-link">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Shield size={12} />
          Vos données sont protégées — Aucun paiement requis
        </div>
      </div>
    </div>
  );
}
