/**
 * Page Mot de passe oublié
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { forgotPassword } from "@/services/authService";
import { CONFIG } from "@/config/constants";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      // On affiche toujours un succès pour ne pas révéler si l'email existe
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  // Écran de succès
  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
        <header className="p-4 md:p-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--sage-dark), var(--sage))" }}
            >
              <Mail size={40} color="white" />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--sage-dark)" }}>
              Email envoyé !
            </h1>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              Si un compte existe avec l'adresse <strong>{email}</strong>, 
              vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Pensez à vérifier vos spams si vous ne recevez rien.
            </p>
            <Link to="/login" className="btn-secondary inline-block">
              Retour à la connexion
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
        <Link to="/login" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={16} />
          Retour à la connexion
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
              Mot de passe oublié
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Entrez votre email pour recevoir un lien de réinitialisation
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="w-full pl-10"
                  data-testid="forgot-email"
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div 
                className="p-3 rounded-lg text-sm bg-red-100 text-red-700"
                data-testid="forgot-error"
              >
                {error}
              </div>
            )}

            {/* Bouton d'envoi */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="forgot-submit"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>

          {/* Lien connexion */}
          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Vous vous souvenez ?{" "}
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

export default ForgotPasswordPage;
