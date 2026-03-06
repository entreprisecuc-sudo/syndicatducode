/**
 * Page Partenaires - Espace Membres
 * Liste des partenaires avec leurs avantages
 */

import { useState, useEffect } from "react";
import { 
  Handshake, ExternalLink, Tag, Copy, Check, Star, Filter
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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

const MemberPartners = () => {
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const [partnersRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/partners/`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/partners/categories`, { headers: getAuthHeaders() })
      ]);
      setPartners(partnersRes.data.partners);
      setCategories(categoriesRes.data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const url = selectedCategory 
        ? `${API_URL}/partners/?category=${selectedCategory}`
        : `${API_URL}/partners/`;
      const res = await axios.get(url, { headers: getAuthHeaders() });
      setPartners(res.data.partners);
    } catch (err) {
      console.error(err);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold mb-6 lg:hidden" style={{ color: "var(--text-primary)" }}>
        Nos Partenaires
      </h1>

      {/* Header */}
      <div 
        className="p-5 rounded-xl mb-6"
        style={{ background: "linear-gradient(135deg, var(--sage-dark), var(--sage))" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Handshake size={28} className="text-white" />
          <h2 className="text-lg font-semibold text-white">Partenaires du Syndicat</h2>
        </div>
        <p className="text-white/80 text-sm">
          Profitez d'avantages exclusifs auprès de nos partenaires sélectionnés pour vous.
        </p>
      </div>

      {/* Filtres par catégorie */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Filtrer par catégorie</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory ? "text-white" : ""
              }`}
              style={{ 
                background: !selectedCategory ? "var(--sage)" : "var(--bg-section)",
                color: !selectedCategory ? "white" : "var(--text-secondary)"
              }}
            >
              Tous ({partners.length})
            </button>
            {categories.map(cat => {
              const config = CATEGORY_CONFIG[cat.key] || CATEGORY_CONFIG.other;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
                  style={{ 
                    background: selectedCategory === cat.key ? config.color : "var(--bg-section)",
                    color: selectedCategory === cat.key ? "white" : "var(--text-secondary)"
                  }}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des partenaires */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--sage)" }}></div>
        </div>
      ) : partners.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--bg-section)", border: "1px solid var(--border-color)" }}
        >
          <Handshake size={48} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>
            {selectedCategory ? "Aucun partenaire dans cette catégorie" : "Aucun partenaire disponible pour le moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {partners.map(partner => {
            const cat = CATEGORY_CONFIG[partner.category] || CATEGORY_CONFIG.other;
            return (
              <div 
                key={partner.id}
                className="rounded-xl overflow-hidden"
                style={{ 
                  background: "var(--bg-card)", 
                  border: partner.is_featured 
                    ? "2px solid var(--sage)" 
                    : "1px solid var(--border-color)"
                }}
              >
                {/* Header avec logo */}
                <div 
                  className="p-4 flex items-center gap-3"
                  style={{ background: "var(--bg-section)" }}
                >
                  {partner.logo_url ? (
                    <img 
                      src={partner.logo_url} 
                      alt={partner.name} 
                      className="w-14 h-14 rounded-lg object-contain bg-white p-1.5"
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--bg-card)" }}
                    >
                      <Handshake size={28} style={{ color: "var(--text-muted)" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {partner.is_featured && (
                        <Star size={14} className="text-yellow-500" fill="currentColor" />
                      )}
                      <h3 
                        className="font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {partner.name}
                      </h3>
                    </div>
                    <span 
                      className="text-xs px-2 py-0.5 rounded inline-block mt-1"
                      style={{ background: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <p 
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {partner.description}
                  </p>

                  {/* Avantages */}
                  {partner.advantages.length > 0 && (
                    <div className="mb-4">
                      <p 
                        className="text-xs font-medium mb-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Vos avantages :
                      </p>
                      <ul className="space-y-1.5">
                        {partner.advantages.map((adv, i) => (
                          <li 
                            key={i} 
                            className="text-sm flex items-start gap-2"
                          >
                            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                            <span style={{ color: "var(--text-primary)" }}>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Code promo */}
                  {partner.discount_code && (
                    <div 
                      className="p-3 rounded-lg mb-4 flex items-center justify-between"
                      style={{ background: "var(--bg-section)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-yellow-500" />
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                          Code promo :
                        </span>
                        <code 
                          className="font-mono font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {partner.discount_code}
                        </code>
                      </div>
                      <button 
                        onClick={() => copyCode(partner.discount_code)}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        title="Copier le code"
                      >
                        {copiedCode === partner.discount_code ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Lien */}
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-white"
                      style={{ background: "var(--sage)" }}
                    >
                      Visiter le site
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MemberPartners;
