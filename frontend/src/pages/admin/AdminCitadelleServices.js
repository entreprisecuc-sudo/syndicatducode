/**
 * Administration des services — La Citadelle Numérique
 * CRUD complet : créer, modifier, activer/désactiver, supprimer
 */

import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Star, Shield, Handshake,
  FileText, Save, X, ArrowUp, ArrowDown, CheckCircle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

const TYPE_CONFIG = {
  paid:    { label: "Payant",    color: "#C9A45C", bg: "rgba(201,164,92,0.1)" },
  free:    { label: "Gratuit",   color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  partner: { label: "Partenaire", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  quote:   { label: "Sur devis", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
};

const CATEGORIES = [
  { value: "estimation", label: "Estimation" },
  { value: "migration", label: "Migration" },
  { value: "legal", label: "Juridique" },
  { value: "seo", label: "SEO / Marketing" },
  { value: "security", label: "Sécurité" },
  { value: "development", label: "Développement" },
  { value: "general", label: "Général" },
];

const EMPTY_FORM = {
  title: "", description: "", short_description: "", price: "",
  price_label: "", service_type: "paid", category: "general",
  icon: "star", partner_name: "", partner_url: "", cta_label: "En savoir plus",
  cta_url: "", is_active: true, display_order: 0
};

export default function AdminCitadelleServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null); // null | "new" | service object
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/citadelle/admin/services");
      setServices(res.data.services || []);
    } catch { setServices([]); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM, display_order: services.length });
    setEditModal("new");
    setError("");
  };

  const openEdit = (svc) => {
    setForm({ ...svc, price: svc.price ?? "" });
    setEditModal(svc);
    setError("");
  };

  const handleSave = async () => {
    if (!form.title.trim() || form.title.length < 3) { setError("Titre requis (min 3 caractères)"); return; }
    if (!form.description.trim() || form.description.length < 10) { setError("Description requise (min 10 caractères)"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        price: form.price !== "" ? parseFloat(form.price) : null,
      };
      if (editModal === "new") {
        await api.post("/citadelle/admin/services", payload);
      } else {
        await api.patch(`/citadelle/admin/services/${editModal.id}`, payload);
      }
      setEditModal(null);
      await fetchServices();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const toggleActive = async (svc) => {
    await api.patch(`/citadelle/admin/services/${svc.id}`, { is_active: !svc.is_active });
    await fetchServices();
  };

  const deleteService = async (id) => {
    if (!confirm("Supprimer ce service définitivement ?")) return;
    await api.delete(`/citadelle/admin/services/${id}`);
    await fetchServices();
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-citadelle-services">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,92,0.15)" }}>
              <Star size={18} style={{ color: "#C9A45C" }} />
            </div>
            <h1 className="text-xl font-bold">Services — La Citadelle Numérique</h1>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: "#C9A45C", color: "#081729" }}
            data-testid="admin-add-service">
            <Plus size={16} /> Ajouter un service
          </button>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--admin-border, rgba(255,255,255,0.08))" }} />)}</div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center opacity-50">
            <Star size={40} className="mx-auto mb-3" />
            <p className="text-sm">Aucun service configuré</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(svc => {
              const typeCfg = TYPE_CONFIG[svc.service_type] || TYPE_CONFIG.paid;
              return (
                <div key={svc.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                  style={{
                    background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                    border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                    opacity: svc.is_active ? 1 : 0.5
                  }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{svc.title}</p>
                    <p className="text-xs opacity-50 mt-0.5 truncate">{svc.short_description || svc.description?.substring(0, 80)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                    {typeCfg.label}
                  </span>
                  {svc.price != null && (
                    <span className="text-sm font-bold">{svc.price > 0 ? `${svc.price}€` : "Gratuit"}</span>
                  )}
                  {svc.price_label && !svc.price && (
                    <span className="text-xs opacity-60">{svc.price_label}</span>
                  )}
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleActive(svc)} className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: svc.is_active ? "#22C55E" : "#6B7280" }} title={svc.is_active ? "Désactiver" : "Activer"}>
                      {svc.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => openEdit(svc)} className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: "#C9A45C" }} title="Modifier">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteService(svc.id)} className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: "#DC2626" }} title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal édition/création */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 rounded-2xl"
            style={{ background: "var(--admin-bg, #1a1a2e)", border: "1px solid rgba(201,164,92,0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editModal === "new" ? "Nouveau service" : "Modifier le service"}</h3>
              <button onClick={() => setEditModal(null)} className="p-1 rounded-lg opacity-50 hover:opacity-100"><X size={18} /></button>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs mb-4" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Titre *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                  placeholder="Estimation de la valeur de votre site"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Description courte</label>
                <input value={form.short_description} onChange={e => setForm(p => ({...p, short_description: e.target.value}))}
                  placeholder="Résumé en 1 ligne" maxLength={300}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Description complète *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  rows={4} placeholder="Description détaillée du service..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60">Type</label>
                  <select value={form.service_type} onChange={e => setForm(p => ({...p, service_type: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="paid">Payant</option>
                    <option value="free">Gratuit</option>
                    <option value="partner">Partenaire</option>
                    <option value="quote">Sur devis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60">Catégorie</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60">Prix (€)</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))}
                    placeholder="99" min="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60">Label prix</label>
                  <input value={form.price_label} onChange={e => setForm(p => ({...p, price_label: e.target.value}))}
                    placeholder="À partir de 99€"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>

              {form.service_type === "partner" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 opacity-60">Nom du partenaire</label>
                    <input value={form.partner_name} onChange={e => setForm(p => ({...p, partner_name: e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 opacity-60">URL partenaire</label>
                    <input value={form.partner_url} onChange={e => setForm(p => ({...p, partner_url: e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60">Texte du bouton</label>
                  <input value={form.cta_label} onChange={e => setForm(p => ({...p, cta_label: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60">URL du bouton</label>
                  <input value={form.cta_url} onChange={e => setForm(p => ({...p, cta_url: e.target.value}))}
                    placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Ordre d'affichage</label>
                <input type="number" value={form.display_order} onChange={e => setForm(p => ({...p, display_order: parseInt(e.target.value) || 0}))}
                  className="w-24 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Annuler</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: "#C9A45C", color: "#081729" }}>
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#081729" }} />
                  : <><Save size={14} /> {editModal === "new" ? "Créer" : "Enregistrer"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
