/**
 * Gestion des Espaces Projets - Admin
 * Permet aux admins de voir et accéder à tous les espaces projets
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  MessageSquare, Users, FileText, ChevronRight, 
  Calendar, Loader2, FolderOpen
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

const AdminProjectRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/project-rooms/admin/list`, {
        headers: getAuthHeaders()
      });
      setRooms(response.data.rooms);
    } catch (err) {
      setError("Erreur lors du chargement des espaces projets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      {/* Titre mobile */}
      <h1 
        className="text-xl font-bold mb-6 lg:hidden"
        style={{ color: "var(--admin-text)" }}
      >
        Espaces Projets
      </h1>

      {/* Header */}
      <div className="mb-6">
        <h2 
          className="font-semibold"
          style={{ color: "var(--admin-text)" }}
        >
          Espaces Projets Collaboratifs
        </h2>
        <p 
          className="text-sm"
          style={{ color: "var(--admin-text-secondary)" }}
        >
          Accédez aux discussions et notes de tous les projets en cours
        </p>
      </div>

      {/* Liste des espaces */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 
            className="animate-spin" 
            size={32} 
            style={{ color: "var(--admin-accent)" }} 
          />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 text-center">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div 
          className="p-8 rounded-xl text-center"
          style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
        >
          <FolderOpen 
            size={48} 
            className="mx-auto mb-4" 
            style={{ color: "var(--admin-text-muted)" }} 
          />
          <h3 
            className="font-semibold mb-2"
            style={{ color: "var(--admin-text)" }}
          >
            Aucun espace projet
          </h3>
          <p 
            className="text-sm"
            style={{ color: "var(--admin-text-muted)" }}
          >
            Les espaces projets sont créés automatiquement lorsqu'une candidature est acceptée.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/syndicat-admin/espace-projet/${room.id}`}
              className="block p-5 rounded-xl transition-all hover:shadow-lg"
              style={{ 
                background: "var(--admin-bg-card)", 
                border: "1px solid var(--admin-border)" 
              }}
              data-testid={`room-link-${room.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Titre et projet */}
                  <h3 
                    className="font-semibold text-lg mb-1"
                    style={{ color: "var(--admin-text)" }}
                  >
                    {room.name}
                  </h3>
                  
                  {room.project && (
                    <p 
                      className="text-sm mb-3"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      Projet : {room.project.title}
                    </p>
                  )}
                  
                  {/* Statistiques */}
                  <div 
                    className="flex flex-wrap items-center gap-4 text-sm"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {room.members_count || 0} membre(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Créé le {formatDate(room.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Indicateurs */}
                <div className="flex items-center gap-3">
                  <div 
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ 
                      background: room.status === "active" ? "#10b98120" : "#6b728020",
                      color: room.status === "active" ? "#10b981" : "#6b7280"
                    }}
                  >
                    {room.status === "active" ? "Actif" : "Inactif"}
                  </div>
                  <ChevronRight 
                    size={20} 
                    style={{ color: "var(--admin-text-muted)" }} 
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProjectRooms;
