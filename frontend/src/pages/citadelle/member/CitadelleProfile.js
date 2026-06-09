/**
 * Mon profil — La Citadelle Numérique
 * Modification des informations personnelles et du mot de passe
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Lock, Save, CheckCircle, AlertCircle,
  Eye, EyeOff, ChevronLeft, Calendar, Mail, Shield
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";

// ── Onglets du profil ─────────────────────────────────────────────────────────

const TABS = [
  { id: "infos",    label: "Informations",    icon: User },
  { id: "password", label: "Mot de passe",    icon: Lock },
];

// ── Composant principal ───────────────────────────────────────────────────────

export default function CitadelleProfile() {
  const { user, updateUser, isAuthenticated, loading } = useCitadelleAuth();
  const [activeTab, setActiveTab] = useState("infos");
  const navigate = useNavigate();

  useCitadellePageMeta("Mon profil");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/citadelle/connexion");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: CITADELLE_COLORS.night }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} />
    </div>
  );

  if (!isAuthenticated) return null;

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${CITADELLE_COLORS.border}`,
    color: CITADELLE_COLORS.white
  };
  const labelStyle = { color: "rgba(255,255,255,0.75)" };

  return (
    <CitadelleLayout pageTitle="Mon profil">
      <div className="min-h-screen py-10 px-4" style={{ background: CITADELLE_COLORS.night }}>
        <div className="max-w-2xl mx-auto">

          {/* En-tête */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              to="/citadelle/espace-membre"
              className="p-2 rounded-lg transition-all"
              style={{ border: `1px solid ${CITADELLE_COLORS.border}`, color: CITADELLE_COLORS.white }}
            >
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-black" style={{ fontFamily: "'Montserrat', sans-serif", color: CITADELLE_COLORS.white }}>
                Mon profil
              </h1>
              <p className="text-sm" style={{ color: CITADELLE_COLORS.textMuted }}>
                Gérez vos informations personnelles
              </p>
            </div>
          </div>

          {/* Carte identité rapide */}
          <div className="flex items-center gap-4 p-5 rounded-2xl mb-6"
            style={{ background: `linear-gradient(135deg, ${CITADELLE_COLORS.blue} 0%, ${CITADELLE_COLORS.night} 100%)`, border: `1px solid ${CITADELLE_COLORS.border}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl"
              style={{ background: "rgba(201,164,92,0.2)", color: CITADELLE_COLORS.gold }}>
              {(user?.first_name?.[0] || "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm truncate flex items-center gap-1.5 mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Mail size={12} /> {user?.email}
              </p>
              {user?.created_at && (
                <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <Calendar size={11} /> Membre depuis {new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(201,164,92,0.15)", color: CITADELLE_COLORS.gold }}>
                <Shield size={11} /> Citadelle
              </span>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CITADELLE_COLORS.border}` }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={activeTab === id
                  ? { background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }
                  : { color: CITADELLE_COLORS.textMuted }}
                data-testid={`profile-tab-${id}`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Contenu onglet */}
          <div className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CITADELLE_COLORS.border}` }}>
            {activeTab === "infos"
              ? <TabInfos user={user} updateUser={updateUser} inputStyle={inputStyle} labelStyle={labelStyle} />
              : <TabPassword inputStyle={inputStyle} labelStyle={labelStyle} />
            }
          </div>

        </div>
      </div>
    </CitadelleLayout>
  );
}

// ── Onglet Informations ───────────────────────────────────────────────────────

function TabInfos({ user, updateUser, inputStyle, labelStyle }) {
  const [form, setForm]       = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "" });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const handleSave = async () => {
    if (form.first_name.trim().length < 2) { setError("Le prénom doit contenir au moins 2 caractères"); return; }
    if (form.last_name.trim().length < 2)  { setError("Le nom doit contenir au moins 2 caractères"); return; }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await citadelleApi.patch("/auth/profile", {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
      });
      if (updateUser) updateUser(res.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-base" style={{ color: CITADELLE_COLORS.white }}>Informations personnelles</h2>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
          data-testid="profile-infos-success">
          <CheckCircle size={15} /> Profil mis à jour avec succès
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>Prénom *</label>
          <input value={form.first_name} onChange={e => { setForm(p => ({ ...p, first_name: e.target.value })); setError(""); }}
            placeholder="Votre prénom" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle} data-testid="profile-firstname-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>Nom *</label>
          <input value={form.last_name} onChange={e => { setForm(p => ({ ...p, last_name: e.target.value })); setError(""); }}
            placeholder="Votre nom" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle} data-testid="profile-lastname-input" />
        </div>
      </div>

      {/* Email — lecture seule */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          Adresse email <span className="text-xs font-normal opacity-50">(non modifiable)</span>
        </label>
        <input value={user?.email || ""} readOnly
          className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-not-allowed"
          style={{ ...inputStyle, opacity: 0.5 }} />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-[1.02]"
        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
        data-testid="profile-save-infos-btn">
        {saving
          ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
          : <><Save size={15} /> Enregistrer</>
        }
      </button>
    </div>
  );
}

// ── Onglet Mot de passe ───────────────────────────────────────────────────────

function TabPassword({ inputStyle, labelStyle }) {
  const [form, setForm]       = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const handleSave = async () => {
    setError("");
    if (!form.current) { setError("Saisissez votre mot de passe actuel"); return; }
    if (form.new.length < 8) { setError("Le nouveau mot de passe doit contenir au moins 8 caractères"); return; }
    if (form.new !== form.confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setSaving(true);
    setSuccess(false);
    try {
      await citadelleApi.patch("/auth/profile", {
        current_password: form.current,
        new_password:     form.new,
      });
      setSuccess(true);
      setForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-base" style={{ color: CITADELLE_COLORS.white }}>Changer le mot de passe</h2>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
          data-testid="profile-password-success">
          <CheckCircle size={15} /> Mot de passe modifié avec succès
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Mot de passe actuel */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>Mot de passe actuel *</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={form.current}
            onChange={e => { setForm(p => ({ ...p, current: e.target.value })); setError(""); }}
            placeholder="Votre mot de passe actuel"
            className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
            style={inputStyle} data-testid="profile-current-password" />
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: CITADELLE_COLORS.textMuted }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Nouveau mot de passe */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>Nouveau mot de passe *</label>
        <input type={showPw ? "text" : "password"} value={form.new}
          onChange={e => { setForm(p => ({ ...p, new: e.target.value })); setError(""); }}
          placeholder="Minimum 8 caractères"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle} data-testid="profile-new-password" />
        <p className="text-xs mt-1.5" style={{ color: CITADELLE_COLORS.textMuted }}>
          Doit contenir : 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre
        </p>
      </div>

      {/* Confirmation */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>Confirmer le nouveau mot de passe *</label>
        <input type={showPw ? "text" : "password"} value={form.confirm}
          onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setError(""); }}
          placeholder="Répétez votre nouveau mot de passe"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle} data-testid="profile-confirm-password" />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-[1.02]"
        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
        data-testid="profile-save-password-btn">
        {saving
          ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
          : <><Lock size={15} /> Changer le mot de passe</>
        }
      </button>
    </div>
  );
}
