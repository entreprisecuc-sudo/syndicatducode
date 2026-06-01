/**
 * Demandes de contact - Admin
 * Support mode sombre/clair
 */

import { useState, useEffect } from "react";
import { FileText, Mail, Phone, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";

// Configuration des statuts
const STATUS_CONFIG = {
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b20" },
  contacted: { label: "Contacté", color: "#3b82f6", bg: "#3b82f620" },
  converted: { label: "Converti", color: "#10b981", bg: "#10b98120" },
  archived: { label: "Archivé", color: "#6b7280", bg: "#6b728020" }
};

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [filterStatus]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const response = await api.get(`/admin/contacts${params}`);
      setContacts(response.data.contacts);
    } catch (err) {
      setError("Erreur lors du chargement des contacts");
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId, newStatus) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/contacts/${contactId}/status?new_status=${newStatus}`,  {});
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Demandes de contact
      </h1>

      {/* Filtres */}
      <div 
        className="p-4 rounded-xl mb-6 flex flex-col md:flex-row gap-4 transition-colors duration-300"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg py-2 px-3 transition-colors duration-300"
          style={{ 
            background: "var(--admin-bg-section)", 
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)"
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="contacted">Contacté</option>
          <option value="converted">Converti</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      {/* Liste des contacts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "var(--admin-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center transition-colors duration-300"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <FileText size={48} className="mx-auto mb-4" style={{ color: "var(--admin-text-muted)" }} />
          <p style={{ color: "var(--admin-text-secondary)" }}>Aucune demande de contact</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => {
            const statusConfig = STATUS_CONFIG[contact.status] || STATUS_CONFIG.pending;
            
            return (
              <div 
                key={contact.id}
                className="p-5 rounded-xl transition-colors duration-300"
                style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 
                      className="font-semibold text-lg"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {contact.name}
                    </h3>
                    <div 
                      className="flex flex-wrap items-center gap-4 mt-2 text-sm"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="hover:opacity-80"
                          style={{ color: "var(--admin-text-secondary)" }}
                        >
                          {contact.email}
                        </a>
                      </span>
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          <a 
                            href={`tel:${contact.phone}`} 
                            className="hover:opacity-80"
                            style={{ color: "var(--admin-text-secondary)" }}
                          >
                            {contact.phone}
                          </a>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(contact.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Statut */}
                  <span 
                    className="px-3 py-1 rounded text-sm shrink-0"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                
                {/* Message */}
                <div 
                  className="p-4 rounded-lg mb-4 transition-colors duration-300"
                  style={{ background: "var(--admin-bg-section)" }}
                >
                  <p 
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: "var(--admin-text-secondary)" }}
                  >
                    {contact.message}
                  </p>
                </div>
                
                {/* Fichiers */}
                {contact.files && contact.files.length > 0 && (
                  <div className="mb-4">
                    <p 
                      className="text-xs mb-2"
                      style={{ color: "var(--admin-text-muted)" }}
                    >
                      {contact.files.length} fichier(s) joint(s)
                    </p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => updateContactStatus(contact.id, key)}
                      disabled={actionLoading || contact.status === key}
                      className={`px-3 py-1.5 rounded text-xs transition-colors ${
                        contact.status === key 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:opacity-80"
                      }`}
                      style={{ 
                        background: config.bg, 
                        color: config.color 
                      }}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compteur */}
      <p 
        className="text-center text-sm mt-4"
        style={{ color: "var(--admin-text-muted)" }}
      >
        {contacts.length} demande(s) trouvée(s)
      </p>
    </AdminLayout>
  );
};

export default AdminContacts;
