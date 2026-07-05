/**
 * Mon profil — La Citadelle Numérique
 * Modification des informations personnelles et du mot de passe
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Lock, Save, CheckCircle, AlertCircle,
  Eye, EyeOff, ChevronLeft, Calendar, Mail, Shield,
  Building, Landmark, CreditCard, Upload, Phone, Info,
  ExternalLink, Loader, RefreshCw, Zap, Bell
} from "lucide-react";
import CitadelleLayout from "@/components/citadelle/CitadelleLayout";
import { useCitadelleAuth } from "@/context/CitadelleAuthContext";
import citadelleApi from "@/services/citadelleApi";
import { CITADELLE_COLORS } from "@/config/citadelleConstants";
import { useCitadellePageMeta } from "@/hooks/useCitadellePageMeta";

// ── Onglets du profil ─────────────────────────────────────────────────────────

const TABS = [
  { id: "infos",    label: "Informations",    icon: User },
  { id: "banking",  label: "Coordonnées bancaires", icon: Landmark },
  { id: "pro",      label: "Statut",          icon: Building },
  { id: "payments", label: "Paiements",       icon: CreditCard },
  { id: "password", label: "Mot de passe",    icon: Lock },
];

// ── Composant principal ───────────────────────────────────────────────────────

export default function CitadelleProfile() {
  const { user, updateUser, isAuthenticated, loading } = useCitadelleAuth();
  const [activeTab, setActiveTab] = useState("infos");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useCitadellePageMeta("Mon profil");

  // Retour depuis Stripe Connect → ouvrir automatiquement l'onglet Paiements
  useEffect(() => {
    const stripeReturn = searchParams.get("stripe_connect");
    if (stripeReturn) {
      setActiveTab("payments");
    }
  }, [searchParams]);

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
            {activeTab === "infos" && <TabInfos user={user} updateUser={updateUser} inputStyle={inputStyle} labelStyle={labelStyle} />}
            {activeTab === "banking" && <TabBanking inputStyle={inputStyle} labelStyle={labelStyle} />}
            {activeTab === "pro" && <TabProfessional inputStyle={inputStyle} labelStyle={labelStyle} />}
            {activeTab === "payments" && <TabStripeConnect user={user} />}
            {activeTab === "password" && <TabPassword inputStyle={inputStyle} labelStyle={labelStyle} />}
          </div>

        </div>
      </div>
    </CitadelleLayout>
  );
}

// ── Calcul de la date max (18 ans en arrière) ─────────────────────────────────
const getMaxDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
};

// ── Indicateur de complétude KYC ─────────────────────────────────────────────
function KycBanner({ user }) {
  const hasPhone = !!(user?.phone);
  const hasDob   = !!(user?.date_of_birth);
  if (hasPhone && hasDob) return null;

  const missing = [];
  if (!hasPhone) missing.push("numéro de téléphone");
  if (!hasDob)   missing.push("date de naissance");

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl text-xs"
      style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.25)", color: CITADELLE_COLORS.gold }}
      data-testid="kyc-banner">
      <Info size={14} className="flex-shrink-0 mt-0.5" />
      <span>
        <strong>Profil incomplet pour la réception des paiements.</strong>{" "}
        Renseignez votre {missing.join(" et votre ")} pour activer les virements automatiques lors de vos ventes.
      </span>
    </div>
  );
}

// ── Onglet Informations ───────────────────────────────────────────────────────

function TabInfos({ user, updateUser, inputStyle, labelStyle }) {
  const [form, setForm] = useState({
    first_name:    user?.first_name    || "",
    last_name:     user?.last_name     || "",
    phone:         user?.phone         || "",
    date_of_birth: user?.date_of_birth || "",
    email_notifications: user?.email_notifications !== false,
  });
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
      const payload = {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        phone:      form.phone.trim(),
        date_of_birth: form.date_of_birth,
        email_notifications: form.email_notifications,
      };
      const res = await citadelleApi.patch("/auth/profile", payload);
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

      <KycBanner user={{ ...user, phone: form.phone, date_of_birth: form.date_of_birth }} />

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

      {/* Prénom / Nom */}
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

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          <span className="flex items-center gap-1.5">
            <Phone size={13} /> Téléphone
            <span className="text-xs font-normal opacity-50">(recommandé pour les virements)</span>
          </span>
        </label>
        <input
          value={form.phone}
          onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setError(""); }}
          placeholder="0612345678 ou +33612345678"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
          style={inputStyle}
          data-testid="profile-phone-input"
          inputMode="tel"
          maxLength={16}
        />
      </div>

      {/* Date de naissance */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> Date de naissance
            <span className="text-xs font-normal opacity-50">(requis pour recevoir des paiements)</span>
          </span>
        </label>
        <input
          type="date"
          value={form.date_of_birth}
          onChange={e => { setForm(p => ({ ...p, date_of_birth: e.target.value })); setError(""); }}
          max={getMaxDob()}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ ...inputStyle, colorScheme: "dark" }}
          data-testid="profile-dob-input"
        />
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          Vous devez avoir au moins 18 ans. Utilisée uniquement pour la vérification d'identité des paiements.
        </p>
      </div>

      {/* Préférence notifications email — bouton on/off */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: CITADELLE_COLORS.white }}>
            <Bell size={14} /> Notifications par email
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Enchère surenchérie, dernière chance, offre clôturée… (les emails essentiels restent envoyés)
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.email_notifications}
          onClick={() => setForm(p => ({ ...p, email_notifications: !p.email_notifications }))}
          data-testid="profile-email-notifications-toggle"
          className="relative shrink-0 rounded-full transition-colors"
          style={{
            width: 48, height: 26,
            background: form.email_notifications ? CITADELLE_COLORS.gold : "rgba(255,255,255,0.2)",
          }}>
          <span className="absolute rounded-full bg-white transition-all" style={{
            width: 20, height: 20, top: 3,
            left: form.email_notifications ? 25 : 3,
          }} />
        </button>
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

// ── Onglet Coordonnées bancaires ──────────────────────────────────────────────

function TabBanking({ inputStyle, labelStyle }) {
  const [form, setForm] = useState({ iban: "", bic: "", bank_name: "", account_holder: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    citadelleApi.get("/auth/profile/billing").then(res => {
      const b = res.data.billing || {};
      setForm({
        iban: b.iban || "", bic: b.bic || "", bank_name: b.bank_name || "",
        account_holder: b.account_holder || "", address: res.data.address || ""
      });
      setDocs(res.data.documents || {});
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    if (!form.account_holder.trim()) { setError("Le titulaire du compte est requis"); return; }
    if (!form.iban.trim()) { setError("L'IBAN est requis"); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      await citadelleApi.patch("/auth/profile/billing", {
        iban: form.iban, bic: form.bic, bank_name: form.bank_name,
        account_holder: form.account_holder, address: form.address
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const uploadDoc = async (type, file) => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await citadelleApi.post(`/auth/profile/document/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocs(prev => ({ ...prev, [type]: { url: res.data.url, filename: file.name, uploaded_at: new Date().toISOString() } }));
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally { setUploading(""); }
  };

  if (!loaded) return <div className="py-8 text-center"><div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bold text-base" style={{ color: CITADELLE_COLORS.white }}>Coordonnées bancaires</h2>
        <p className="text-xs mt-1" style={{ color: CITADELLE_COLORS.textMuted }}>
          Nécessaires pour recevoir vos paiements. Ces données sont stockées de manière sécurisée.
        </p>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: "rgba(201,164,92,0.06)", border: "1px solid rgba(201,164,92,0.15)", color: CITADELLE_COLORS.gold }}>
        <Shield size={13} /> Vos données bancaires sont chiffrées et accessibles uniquement par vous et l'administrateur.
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}>
          <CheckCircle size={15} /> Coordonnées bancaires enregistrées
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>Titulaire du compte *</label>
        <input value={form.account_holder} onChange={e => { setForm(p => ({ ...p, account_holder: e.target.value })); setError(""); }}
          placeholder="Prénom Nom ou Raison sociale" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle} data-testid="billing-holder" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>IBAN *</label>
        <input value={form.iban} onChange={e => { setForm(p => ({ ...p, iban: e.target.value.toUpperCase() })); setError(""); }}
          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono tracking-wider"
          style={inputStyle} data-testid="billing-iban" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>BIC / SWIFT</label>
          <input value={form.bic} onChange={e => { setForm(p => ({ ...p, bic: e.target.value.toUpperCase() })); setError(""); }}
            placeholder="BNPAFRPP" className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
            style={inputStyle} data-testid="billing-bic" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>Banque</label>
          <input value={form.bank_name} onChange={e => { setForm(p => ({ ...p, bank_name: e.target.value })); setError(""); }}
            placeholder="Nom de votre banque" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle} data-testid="billing-bank" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>Adresse personnelle</label>
        <textarea value={form.address} onChange={e => { setForm(p => ({ ...p, address: e.target.value })); setError(""); }}
          placeholder="Adresse complète (rue, code postal, ville)" rows={2}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={inputStyle} data-testid="billing-address" />
      </div>

      {/* Upload documents */}
      <div className="pt-3 space-y-3" style={{ borderTop: `1px solid ${CITADELLE_COLORS.border}` }}>
        <h3 className="text-sm font-semibold" style={{ color: CITADELLE_COLORS.white }}>Documents justificatifs</h3>
        <DocumentUpload label="Carte d'identité" type="identity" docs={docs} uploading={uploading} onUpload={uploadDoc} />
        <DocumentUpload label="RIB (document bancaire)" type="rib" docs={docs} uploading={uploading} onUpload={uploadDoc} />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-[1.02]"
        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
        data-testid="billing-save-btn">
        {saving
          ? <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.night }} />
          : <><Save size={15} /> Enregistrer</>
        }
      </button>
    </div>
  );
}

// ── Composant upload document réutilisable ────────────────────────────────────

function DocumentUpload({ label, type, docs, uploading, onUpload }) {
  const doc = docs[type];
  const inputId = `doc-upload-${type}`;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${CITADELLE_COLORS.border}` }}>
      <CreditCard size={16} style={{ color: CITADELLE_COLORS.gold, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: CITADELLE_COLORS.white }}>{label}</p>
        {doc ? (
          <p className="text-xs truncate" style={{ color: "#22C55E" }}>
            {doc.filename || "Document uploadé"} — {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
          </p>
        ) : (
          <p className="text-xs" style={{ color: CITADELLE_COLORS.textMuted }}>PDF, JPEG, PNG — max 10 Mo</p>
        )}
      </div>
      <label htmlFor={inputId}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105"
        style={{ background: doc ? "rgba(34,197,94,0.1)" : "rgba(201,164,92,0.1)", color: doc ? "#22C55E" : CITADELLE_COLORS.gold }}>
        {uploading === type ? (
          <div className="w-3 h-3 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: CITADELLE_COLORS.gold }} />
        ) : doc ? (
          <><CheckCircle size={12} /> Modifier</>
        ) : (
          <><Upload size={12} /> Charger</>
        )}
      </label>
      <input id={inputId} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={e => { if (e.target.files?.[0]) onUpload(type, e.target.files[0]); e.target.value = ""; }}
        data-testid={`doc-upload-${type}`} />
    </div>
  );
}

// ── Onglet Statut professionnel ───────────────────────────────────────────────

function TabProfessional({ inputStyle, labelStyle }) {
  const [form, setForm] = useState({ is_professional: false, company_name: "", siren: "", siret: "", vat_number: "", company_address: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    citadelleApi.get("/auth/profile/billing").then(res => {
      const p = res.data.professional || {};
      setForm({
        is_professional: p.is_professional || false,
        company_name: p.company_name || "", siren: p.siren || "", siret: p.siret || "",
        vat_number: p.vat_number || "", company_address: p.company_address || ""
      });
      setDocs(res.data.documents || {});
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const uploadDoc = async (type, file) => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await citadelleApi.post(`/auth/profile/document/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocs(prev => ({ ...prev, [type]: { url: res.data.url, filename: file.name, uploaded_at: new Date().toISOString() } }));
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally { setUploading(""); }
  };

  const handleSave = async () => {
    if (form.is_professional && !form.company_name.trim()) { setError("La raison sociale est requise pour les professionnels"); return; }
    if (form.is_professional && !form.siren.trim()) { setError("Le SIREN est requis pour les professionnels"); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      await citadelleApi.patch("/auth/profile/billing", {
        is_professional: form.is_professional,
        company_name: form.company_name, siren: form.siren, siret: form.siret,
        vat_number: form.vat_number, company_address: form.company_address
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  if (!loaded) return <div className="py-8 text-center"><div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: CITADELLE_COLORS.border, borderTopColor: CITADELLE_COLORS.gold }} /></div>;

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-base" style={{ color: CITADELLE_COLORS.white }}>Statut professionnel</h2>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}>
          <CheckCircle size={15} /> Informations enregistrées
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Toggle Pro / Particulier */}
      <div className="flex gap-3">
        {[
          { val: false, label: "Particulier", desc: "Vente occasionnelle" },
          { val: true, label: "Professionnel", desc: "Entreprise / Auto-entrepreneur" }
        ].map(opt => (
          <button key={String(opt.val)} onClick={() => { setForm(p => ({ ...p, is_professional: opt.val })); setError(""); }}
            className="flex-1 p-4 rounded-xl text-left transition-all"
            style={{
              background: form.is_professional === opt.val ? "rgba(201,164,92,0.1)" : "rgba(255,255,255,0.02)",
              border: form.is_professional === opt.val ? "1px solid rgba(201,164,92,0.4)" : `1px solid ${CITADELLE_COLORS.border}`
            }}
            data-testid={`pro-toggle-${opt.val}`}>
            <p className="text-sm font-semibold" style={{ color: form.is_professional === opt.val ? CITADELLE_COLORS.gold : CITADELLE_COLORS.white }}>
              {opt.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: CITADELLE_COLORS.textMuted }}>{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Champs pro */}
      {form.is_professional && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>Raison sociale *</label>
            <input value={form.company_name} onChange={e => { setForm(p => ({ ...p, company_name: e.target.value })); setError(""); }}
              placeholder="Nom de votre entreprise" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle} data-testid="pro-company" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={labelStyle}>SIREN *</label>
              <input value={form.siren} onChange={e => { setForm(p => ({ ...p, siren: e.target.value.replace(/\D/g, "").slice(0, 9) })); setError(""); }}
                placeholder="9 chiffres" maxLength={9} className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
                style={inputStyle} data-testid="pro-siren" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={labelStyle}>SIRET</label>
              <input value={form.siret} onChange={e => { setForm(p => ({ ...p, siret: e.target.value.replace(/\D/g, "").slice(0, 14) })); setError(""); }}
                placeholder="14 chiffres" maxLength={14} className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
                style={inputStyle} data-testid="pro-siret" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>N° TVA intracommunautaire</label>
            <input value={form.vat_number} onChange={e => { setForm(p => ({ ...p, vat_number: e.target.value.toUpperCase() })); setError(""); }}
              placeholder="FR XX XXXXXXXXX" className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
              style={inputStyle} data-testid="pro-vat" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>Adresse du siège</label>
            <textarea value={form.company_address} onChange={e => { setForm(p => ({ ...p, company_address: e.target.value })); setError(""); }}
              placeholder="Adresse complète de votre entreprise" rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle} data-testid="pro-address" />
          </div>

          {/* Upload KBIS */}
          <div className="pt-2">
            <DocumentUpload label="Extrait KBIS" type="kbis" docs={docs} uploading={uploading} onUpload={uploadDoc} />
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-[1.02]"
        style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
        data-testid="pro-save-btn">
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


// ── Onglet Stripe Connect Paiements ──────────────────────────────────────────

const STATUS_CONFIG = {
  not_connected:  { label: "Non connecté",        color: "#9ca3af",   bg: "rgba(156,163,175,0.08)"  },
  pending:        { label: "En attente",           color: "#d97706",   bg: "rgba(217,119,6,0.08)"   },
  pending_review: { label: "En cours de vérif.",  color: "#2563eb",   bg: "rgba(37,99,235,0.08)"   },
  active:         { label: "Actif — paiements activés", color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
  restricted:     { label: "Restreint",            color: "#dc2626",   bg: "rgba(220,38,38,0.08)"   },
};

function TabStripeConnect({ user }) {
  const [status, setStatus]     = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]       = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const stripeReturn = searchParams.get("stripe_connect");

  // Charger le statut au montage (et après retour Stripe)
  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await citadelleApi.get("/stripe-connect/status");
      setStatus(res.data);
    } catch {
      setStatus({ status: "not_connected" });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    const origin = window.location.origin;
    const base   = `${origin}/citadelle/espace-membre/profil`;
    try {
      const res = await citadelleApi.post("/stripe-connect/onboard", {
        return_url:  `${base}?stripe_connect=success`,
        refresh_url: `${base}?stripe_connect=refresh`,
      });
      // Redirection vers Stripe Connect
      window.location.href = res.data.onboarding_url;
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de se connecter à Stripe");
      setConnecting(false);
    }
  };

  // Nettoyer le param URL après affichage
  const dismissReturn = () => {
    setSearchParams({});
  };

  const cfg = STATUS_CONFIG[status?.status] || STATUS_CONFIG.not_connected;
  const kycMissing = !user?.phone || !user?.date_of_birth;

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-base" style={{ color: CITADELLE_COLORS.white }}>
        Réception des paiements (Stripe)
      </h2>

      {/* Message retour Stripe */}
      {stripeReturn === "success" && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div className="flex items-start gap-2">
            <CheckCircle size={15} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: "#22C55E" }}>
              <strong>Onboarding terminé !</strong> Votre compte Stripe est en cours de vérification.
              Le statut ci-dessous sera mis à jour sous 24–48 h.
            </p>
          </div>
          <button onClick={dismissReturn} className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "#22C55E" }}>
            <Shield size={14} />
          </button>
        </div>
      )}

      {stripeReturn === "refresh" && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#d97706" }}>
          <RefreshCw size={14} /> Le lien d'onboarding a expiré. Cliquez sur le bouton ci-dessous pour en générer un nouveau.
        </div>
      )}

      {/* Avertissement KYC manquant */}
      {kycMissing && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
          style={{ background: "rgba(201,164,92,0.07)", border: "1px solid rgba(201,164,92,0.25)", color: CITADELLE_COLORS.gold }}>
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            Complétez votre <strong>téléphone</strong> et <strong>date de naissance</strong> dans l'onglet{" "}
            <button className="underline font-semibold">Informations</button>{" "}
            pour pré-remplir le formulaire Stripe et accélérer la vérification.
          </span>
        </div>
      )}

      {/* Carte statut */}
      <div className="p-5 rounded-2xl space-y-4"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CITADELLE_COLORS.border}` }}>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm opacity-50">
            <Loader size={14} className="animate-spin" /> Vérification du statut…
          </div>
        ) : (
          <>
            {/* Badge statut */}
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
              <span className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}
                data-testid="stripe-connect-status">
                {cfg.label}
              </span>
              {status?.account_id && (
                <span className="text-xs opacity-30 font-mono">{status.account_id}</span>
              )}
              <button onClick={loadStatus} className="ml-auto opacity-30 hover:opacity-70 transition-opacity"
                title="Actualiser" data-testid="stripe-status-refresh">
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Infos détail */}
            {status?.account_id && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Détails soumis",       value: status.details_submitted },
                  { label: "Virements activés",     value: status.payouts_enabled   },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2 text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}>
                    {value
                      ? <CheckCircle size={12} style={{ color: "#22C55E" }} />
                      : <AlertCircle size={12} style={{ color: "#d97706" }} />
                    }
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Explications selon statut */}
            {status?.status === "not_connected" && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Connectez votre compte Stripe pour recevoir automatiquement les fonds lors de la finalisation de vos ventes.
              </p>
            )}
            {(status?.status === "pending" || status?.status === "pending_review") && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Votre compte est en cours de vérification par Stripe. Ce processus peut prendre 24 à 48 h.
                Vous pouvez compléter ou corriger vos informations en cliquant sur le bouton ci-dessous.
              </p>
            )}
            {status?.status === "active" && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Votre compte est vérifié. Les fonds seront virés automatiquement lors de la validation de vos ventes.
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Bouton principal */}
      {status?.status !== "active" && (
        <button
          onClick={handleConnect}
          disabled={connecting || loadingStatus}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60 transition-all hover:scale-[1.02]"
          style={{ background: CITADELLE_COLORS.gold, color: CITADELLE_COLORS.night }}
          data-testid="stripe-connect-btn">
          {connecting
            ? <><Loader size={14} className="animate-spin" /> Redirection vers Stripe…</>
            : <><Zap size={14} />
                {status?.status === "not_connected" ? "Connecter mon compte Stripe" : "Compléter l'onboarding Stripe"}
                <ExternalLink size={12} className="ml-1 opacity-60" />
              </>
          }
        </button>
      )}

      {/* Note légale */}
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
        La Citadelle Numérique utilise Stripe Connect pour les virements. En continuant, vous acceptez les{" "}
        <a href="https://stripe.com/fr/connect-account/legal" target="_blank" rel="noopener noreferrer"
          className="underline opacity-60 hover:opacity-100 transition-opacity">
          Conditions d'utilisation Stripe
        </a>.
      </p>
    </div>
  );
}
