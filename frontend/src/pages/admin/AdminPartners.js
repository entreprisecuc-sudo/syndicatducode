/**
 * Gestion des partenaires - Admin
 * CRUD complet pour les partenaires de services
 */

import { useState, useEffect } from "react";
import { 
  Handshake, Plus, Edit, Trash2, Eye, EyeOff, Star,
  ExternalLink, Tag, Mail, Copy, Check
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

const CATEGORY_CONFIG = {
  hosting: { label: "Hébergement", color: "#3b82f6" },
  tools: { label: "Outils & Logiciels", color: "#8b5cf6" },
  services: { label: "Services", color: "#10b981" },
  training: { label: "Formation", color: "#f59e0b" },
  legal: { label: "Juridique & Compta", color: "#6b7280" },
  marketing: { label: "Marketing", color: "#ec4899" },
  other: { label: "Autre", color: "#64748b" }
};

const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    website_url: "",
    category: "other",
    advantages: "",
    discount_code: "",
    contact_email: "",
    is_featured: false
  });
  const [formLoading, setFormLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/partners/admin`, { headers: getAuthHeaders() });
      setPartners(res.data.partners);
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormData({
      name: "", description: "", logo_url: "", website_url: "",
      category: "other", advantages: "", discount_code: "", 
      contact_email: "", is_featured: false
    });
    setShowModal(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      description: partner.description,
      logo_url: partner.logo_url || "",
      website_url: partner.website_url || "",
      category: partner.category,
      advantages: partner.advantages.join("\n"),
      discount_code: partner.discount_code || "",
      contact_email: partner.contact_email || "",
      is_featured: partner.is_featured
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const dataToSend = {
      ...formData,
      logo_url: formData.logo_url || null,
      website_url: formData.website_url || null,
      advantages: formData.advantages.split("\n").filter(a => a.trim()),
      discount_code: formData.discount_code || null,
      contact_email: formData.contact_email || null
    };

    try {
      if (editingPartner) {
        await axios.put(`${API_URL}/partners/admin/${editingPartner.id}`, dataToSend, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_URL}/partners/admin`, dataToSend, { headers: getAuthHeaders() });
      }
      setShowModal(false);
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (partner) => {
    try {
      await axios.put(
        `${API_URL}/partners/admin/${partner.id}`,
        { status: partner.status === "active" ? "inactive" : "active" },
        { headers: getAuthHeaders() }
      );
      fetchPartners();
    } catch (err) {
      alert("Erreur");
    }
  };

  const toggleFeatured = async (partner) => {
    try {
      await axios.put(
        `${API_URL}/partners/admin/${partner.id}`,
        { is_featured: !partner.is_featured },
        { headers: getAuthHeaders() }
      );
      fetchPartners();
    } catch (err) {
      alert("Erreur");
    }
  };

  const deletePartner = async (id) => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    try {
      await axios.delete(`${API_URL}/partners/admin/${id}`, { headers: getAuthHeaders() });
      fetchPartners();
    } catch (err) {
      alert("Erreur");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6 lg:hidden style={{ color: "var(--admin-text)" }}">Partenaires</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="style={{ color: "var(--admin-text)" }} font-semibold">Partenaires de Services</h2>
          <p className="style={{ color: "var(--admin-text-secondary)" }} text-sm">Gérez les partenaires et leurs avantages pour les membres</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 rounded-lg bg-red-500 style={{ color: "var(--admin-text)" }} font-medium hover:bg-red-600 transition-colors inline-flex items-center gap-2">
          <Plus size={18} />
          Nouveau partenaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
          <div className="text-2xl font-bold text-blue-400">{partners.length}</div>
          <div className="style={{ color: "var(--admin-text-secondary)" }} text-sm">Total</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
          <div className="text-2xl font-bold text-green-400">{partners.filter(p => p.status === "active").length}</div>
          <div className="style={{ color: "var(--admin-text-secondary)" }} text-sm">Actifs</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
          <div className="text-2xl font-bold text-yellow-400">{partners.filter(p => p.is_featured).length}</div>
          <div className="style={{ color: "var(--admin-text-secondary)" }} text-sm">Mis en avant</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
          <div className="text-2xl font-bold text-purple-400">{partners.filter(p => p.discount_code).length}</div>
          <div className="style={{ color: "var(--admin-text-secondary)" }} text-sm">Avec code promo</div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : partners.length === 0 ? (
        <div className="p-8 rounded-xl text-center" style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}>
          <Handshake size={48} className="mx-auto mb-4 style={{ color: "var(--admin-text-muted)" }}" />
          <p className="style={{ color: "var(--admin-text-secondary)" }} mb-4">Aucun partenaire enregistré</p>
          <button onClick={openCreateModal} className="px-4 py-2 rounded-lg bg-red-500 style={{ color: "var(--admin-text)" }}">
            Ajouter le premier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map(partner => {
            const cat = CATEGORY_CONFIG[partner.category] || CATEGORY_CONFIG.other;
            return (
              <div 
                key={partner.id}
                className={`p-5 rounded-xl ${partner.status === "inactive" ? "opacity-60" : ""}`}
                style={{ background: "var(--admin-bg-card)", border: partner.is_featured ? "2px solid #e94560" : "1px solid #1f4068" }}
              >
                {partner.is_featured && (
                  <div className="flex items-center gap-1 text-yellow-400 text-xs mb-2">
                    <Star size={12} fill="currentColor" />
                    Partenaire vedette
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                      <Handshake size={24} className="style={{ color: "var(--admin-text-secondary)" }}" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="style={{ color: "var(--admin-text)" }} font-semibold truncate">{partner.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${cat.color}20`, color: cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                </div>

                <p className="style={{ color: "var(--admin-text-secondary)" }} text-sm mb-3 line-clamp-2">{partner.description}</p>

                {partner.advantages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs style={{ color: "var(--admin-text-muted)" }} mb-1">Avantages :</p>
                    <ul className="space-y-1">
                      {partner.advantages.slice(0, 2).map((adv, i) => (
                        <li key={i} className="text-xs text-green-400 flex items-center gap-1">
                          <Check size={12} />
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {partner.discount_code && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded bg-[var(--admin-bg-section)]">
                    <Tag size={14} className="text-yellow-400" />
                    <code className="text-yellow-400 text-sm font-mono">{partner.discount_code}</code>
                    <button onClick={() => copyCode(partner.discount_code)} className="ml-auto style={{ color: "var(--admin-text-secondary)" }} hover:style={{ color: "var(--admin-text)" }}">
                      {copiedCode === partner.discount_code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--admin-border)]">
                  <button onClick={() => toggleFeatured(partner)} className={`p-2 rounded-lg ${partner.is_featured ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-600/20 style={{ color: "var(--admin-text-secondary)" }}"}`}>
                    <Star size={16} />
                  </button>
                  <button onClick={() => toggleStatus(partner)} className={`p-2 rounded-lg ${partner.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-600/20 style={{ color: "var(--admin-text-secondary)" }}"}`}>
                    {partner.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => openEditModal(partner)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deletePartner(partner.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400">
                    <Trash2 size={16} />
                  </button>
                  {partner.website_url && (
                    <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-600/20 style={{ color: "var(--admin-text-secondary)" }} hover:style={{ color: "var(--admin-text)" }} ml-auto">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6" style={{ background: "var(--admin-bg-card)" }}>
            <h2 className="text-xl font-bold style={{ color: "var(--admin-text)" }} mb-6">
              {editingPartner ? "Modifier le partenaire" : "Nouveau partenaire"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nom *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }}" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={2} className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }}" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }}">
                    {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL Logo</label>
                    <input type="url" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }} text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Site web</label>
                    <input type="url" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }} text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Avantages membres (un par ligne)</label>
                  <textarea value={formData.advantages} onChange={(e) => setFormData({ ...formData, advantages: e.target.value })} rows={3} placeholder="-20% sur tous les plans&#10;Support prioritaire..." className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }}" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Code promo</label>
                    <input type="text" value={formData.discount_code} onChange={(e) => setFormData({ ...formData, discount_code: e.target.value })} placeholder="SYNDICAT20" className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }} font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email contact</label>
                    <input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-section)] border border-[var(--admin-border)] style={{ color: "var(--admin-text)" }}" />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-gray-300">Mettre en avant (partenaire vedette)</span>
                </label>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={formLoading} className="px-4 py-2 rounded-lg bg-red-500 style={{ color: "var(--admin-text)" }} font-medium">
                  {formLoading ? "..." : editingPartner ? "Mettre à jour" : "Créer"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-600 style={{ color: "var(--admin-text)" }}">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPartners;
