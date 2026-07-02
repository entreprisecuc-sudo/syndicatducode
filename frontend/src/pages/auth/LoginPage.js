/**
 * Page de connexion
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { login } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { CONFIG } from "@/config/constants";

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login(formData.email, formData.password, rememberMe);
      loginUser(response.user);
      
      // Redirige selon l'état du compte
      if (response.user.first_login || !response.user.role) {
        navigate("/choisir-role");
      } else {
        // Redirige vers l'espace approprié
        const redirectPath = response.user.role === "commercial"
          ? "/espace-commercial"
          : response.user.role === "admin"
            ? "/syndicat-admin"
            : "/espace-developpeur";
        navigate(redirectPath);
      }
    } catch (err) {
      const message = err.response?.data?.detail || "Erreur de connexion";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
              Connexion
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Accédez à votre espace membre
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
                  data-testid="login-email"
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
                  data-testid="login-password"
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
            </div>

            {/* Se souvenir de moi + mot de passe oublié */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  data-testid="login-remember-me"
                />
                Se souvenir de moi
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm hover:underline"
                style={{ color: "var(--sage)" }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div 
                className="p-4 rounded-lg text-sm"
                style={{ 
                  background: error.includes("suspendu") ? "#ef444420" : "#fef2f2",
                  border: error.includes("suspendu") ? "1px solid #ef4444" : "none",
                  color: error.includes("suspendu") ? "#fca5a5" : "#b91c1c"
                }}
                data-testid="login-error"
              >
                {error.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Lien inscription */}
          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Pas encore membre ?{" "}
            <Link 
              to="/register" 
              className="font-medium hover:underline"
              style={{ color: "var(--sage)" }}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
