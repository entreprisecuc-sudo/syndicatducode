/**
 * Page d'inscription
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Check, X } from "lucide-react";
import { register } from "@/services/authService";
import { CONFIG } from "@/config/constants";

const RegisterPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validation du mot de passe en temps réel
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== ""
  };

  const isPasswordValid = Object.values(passwordChecks).slice(0, 4).every(Boolean);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError("Veuillez respecter les critères du mot de passe");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register(formData.email, formData.password);
      setSuccess(true);
    } catch (err) {
      const message = err.response?.data?.detail || "Erreur lors de l'inscription";
      setError(typeof message === "string" ? message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // Écran de succès
  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
        <header className="p-4 md:p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--sage-dark), var(--sage))" }}
            >
              <Check size={40} color="white" />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--sage-dark)" }}>
              Compte créé avec succès !
            </h1>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              Un email de bienvenue vous a été envoyé.<br />
              Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Se connecter
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="p-4 md:p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={CONFIG.logo} 
              alt={CONFIG.companyName} 
              className="h-20 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Créer un compte
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Rejoignez le Syndicat du Code
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <div className="relative">
                <Mail 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: "var(--text-muted)" }} 
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="votre@email.com"
                  className="w-full pl-10"
                  data-testid="register-email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: "var(--text-muted)" }} 
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Critères du mot de passe */}
              <div className="mt-3 space-y-1">
                {[
                  { key: "length", label: "Au moins 8 caractères" },
                  { key: "uppercase", label: "Une majuscule" },
                  { key: "lowercase", label: "Une minuscule" },
                  { key: "number", label: "Un chiffre" }
                ].map(({ key, label }) => (
                  <div 
                    key={key} 
                    className="flex items-center gap-2 text-xs"
                    style={{ color: passwordChecks[key] ? "var(--sage)" : "var(--text-muted)" }}
                  >
                    {passwordChecks[key] ? <Check size={12} /> : <X size={12} />}
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: "var(--text-muted)" }} 
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10"
                  data-testid="register-confirm-password"
                />
              </div>
              {formData.confirmPassword && (
                <div 
                  className="flex items-center gap-2 text-xs mt-2"
                  style={{ color: passwordChecks.match ? "var(--sage)" : "red" }}
                >
                  {passwordChecks.match ? <Check size={12} /> : <X size={12} />}
                  {passwordChecks.match ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                </div>
              )}
            </div>

            {/* Message d'erreur */}
            {error && (
              <div 
                className="p-3 rounded-lg text-sm bg-red-100 text-red-700"
                data-testid="register-error"
              >
                {error}
              </div>
            )}

            {/* Bouton d'inscription */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !isPasswordValid}
              data-testid="register-submit"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          {/* Lien connexion */}
          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Déjà membre ?{" "}
            <Link 
              to="/login" 
              className="font-medium hover:underline"
              style={{ color: "var(--sage)" }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
