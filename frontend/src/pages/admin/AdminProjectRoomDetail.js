/**
 * Espace Projet Collaboratif - Vue Admin
 * Chat, Notes et Gestion des membres
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Send, Pin, Users, FileText, MessageSquare, 
  Plus, Trash2, Edit2, X, Loader2, UserPlus, UserMinus
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

const AdminProjectRoomDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [error, setError] = useState("");
  
  // Note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Charger les données
  useEffect(() => {
    fetchRoom();
    fetchMessages();
    fetchNotes();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${API_URL}/project-rooms/${roomId}`, {
        headers: getAuthHeaders()
      });
      setRoom(response.data);
    } catch (err) {
      setError("Impossible de charger l'espace projet");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/project-rooms/${roomId}/messages`, {
        headers: getAuthHeaders()
      });
      setMessages(response.data.messages);
    } catch (err) {
      console.error("Erreur chargement messages:", err);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/project-rooms/${roomId}/notes`, {
        headers: getAuthHeaders()
      });
      setNotes(response.data.notes);
    } catch (err) {
      console.error("Erreur chargement notes:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      await axios.post(
        `${API_URL}/project-rooms/${roomId}/messages`,
        { content: newMessage },
        { headers: getAuthHeaders() }
      );
      setNewMessage("");
      fetchMessages();
      messageInputRef.current?.focus();
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || savingNote) return;

    try {
      setSavingNote(true);
      
      if (editingNote) {
        await axios.put(
          `${API_URL}/project-rooms/${roomId}/notes/${editingNote.id}`,
          { content: noteContent, is_pinned: notePinned },
          { headers: getAuthHeaders() }
        );
      } else {
        await axios.post(
          `${API_URL}/project-rooms/${roomId}/notes`,
          { content: noteContent, is_pinned: notePinned },
          { headers: getAuthHeaders() }
        );
      }
      
      setNoteContent("");
      setNotePinned(false);
      setShowNoteForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (err) {
      console.error("Erreur sauvegarde note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Supprimer cette note ?")) return;

    try {
      await axios.delete(
        `${API_URL}/project-rooms/${roomId}/notes/${noteId}`,
        { headers: getAuthHeaders() }
      );
      fetchNotes();
    } catch (err) {
      console.error("Erreur suppression note:", err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Retirer ce membre de l'espace projet ?")) return;

    try {
      await axios.delete(
        `${API_URL}/project-rooms/${roomId}/members/${userId}`,
        { headers: getAuthHeaders() }
      );
      fetchRoom();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const startEditNote = (note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNotePinned(note.is_pinned);
    setShowNoteForm(true);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--admin-accent)" }} />
        </div>
      </AdminLayout>
    );
  }

  if (error || !room) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error || "Espace projet introuvable"}</p>
          <Link 
            to="/syndicat-admin/espaces-projets"
            className="text-gray-400 hover:text-white"
          >
            ← Retour aux espaces projets
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/syndicat-admin/espaces-projets")}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--admin-text-muted)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>
            {room.name}
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            {room.members?.length || 0} membre(s) • Admin
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div 
        className="flex gap-2 mb-4 p-1 rounded-lg"
        style={{ background: "var(--admin-bg-section)" }}
      >
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          style={{ 
            background: activeTab === "chat" ? "var(--admin-bg-card)" : "transparent",
            color: activeTab === "chat" ? "var(--admin-text)" : "var(--admin-text-muted)"
          }}
        >
          <MessageSquare size={18} />
          Discussion
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          style={{ 
            background: activeTab === "notes" ? "var(--admin-bg-card)" : "transparent",
            color: activeTab === "notes" ? "var(--admin-text)" : "var(--admin-text-muted)"
          }}
        >
          <FileText size={18} />
          Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          style={{ 
            background: activeTab === "members" ? "var(--admin-bg-card)" : "transparent",
            color: activeTab === "members" ? "var(--admin-text)" : "var(--admin-text-muted)"
          }}
        >
          <Users size={18} />
          Membres
        </button>
      </div>

      {/* Contenu */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--admin-bg-card)", border: "1px solid var(--admin-border)" }}
      >
        {/* ONGLET CHAT */}
        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--admin-text-muted)" }}>
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Aucun message pour le moment</p>
                  <p className="text-sm">Commencez la discussion !</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user?.id;
                  const showDate = index === 0 || 
                    formatDate(msg.created_at) !== formatDate(messages[index - 1]?.created_at);
                  
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span 
                            className="text-xs px-3 py-1 rounded-full"
                            style={{ background: "var(--admin-bg-section)", color: "var(--admin-text-muted)" }}
                          >
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] ${isOwn ? "order-2" : ""}`}>
                          {!isOwn && (
                            <p className="text-xs mb-1 ml-2" style={{ color: "var(--admin-accent)" }}>
                              {msg.sender?.first_name || msg.sender?.email?.split("@")[0]}
                            </p>
                          )}
                          <div
                            className="px-4 py-2 rounded-2xl"
                            style={{ 
                              background: isOwn ? "var(--admin-accent)" : "var(--admin-bg-section)",
                              color: isOwn ? "white" : "var(--admin-text)"
                            }}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p 
                            className={`text-xs mt-1 ${isOwn ? "text-right mr-2" : "ml-2"}`}
                            style={{ color: "var(--admin-text-muted)" }}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form 
              onSubmit={handleSendMessage}
              className="p-4 border-t flex gap-2"
              style={{ borderColor: "var(--admin-border)" }}
            >
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 rounded-full"
                style={{ 
                  background: "var(--admin-bg-section)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"
                }}
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="p-3 rounded-full text-white disabled:opacity-50 transition-colors"
                style={{ background: "var(--admin-accent)" }}
              >
                {sendingMessage ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        )}

        {/* ONGLET NOTES */}
        {activeTab === "notes" && (
          <div className="p-4">
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteContent("");
                setNotePinned(false);
                setShowNoteForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg mb-4 transition-colors"
              style={{ 
                background: "var(--admin-bg-section)",
                color: "var(--admin-accent)",
                border: "2px dashed var(--admin-border)"
              }}
            >
              <Plus size={20} />
              Ajouter une note
            </button>

            {showNoteForm && (
              <div 
                className="p-4 rounded-lg mb-4"
                style={{ background: "var(--admin-bg-section)", border: "1px solid var(--admin-accent)" }}
              >
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Contenu de la note..."
                  className="w-full mb-3 px-3 py-2 rounded-lg"
                  style={{ 
                    background: "var(--admin-bg-card)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={notePinned}
                      onChange={(e) => setNotePinned(e.target.checked)}
                    />
                    <Pin size={16} />
                    Épingler cette note
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowNoteForm(false);
                        setEditingNote(null);
                      }}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ color: "var(--admin-text-muted)" }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={!noteContent.trim() || savingNote}
                      className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                      style={{ background: "var(--admin-accent)" }}
                    >
                      {savingNote ? "Enregistrement..." : editingNote ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--admin-text-muted)" }}>
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Aucune note pour le moment</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-4 rounded-lg"
                    style={{ 
                      background: note.is_pinned ? "var(--admin-accent)" + "20" : "var(--admin-bg-section)",
                      border: note.is_pinned ? "1px solid var(--admin-accent)" : "1px solid var(--admin-border)"
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {note.is_pinned && (
                          <Pin size={14} style={{ color: "var(--admin-accent)" }} />
                        )}
                        <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                          {note.created_by === "system" ? "Système" : note.author?.first_name || "Membre"}
                          {" • "}
                          {new Date(note.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditNote(note)}
                          className="p-1 rounded hover:opacity-70"
                          style={{ color: "var(--admin-text-muted)" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded hover:opacity-70"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p 
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ONGLET MEMBRES */}
        {activeTab === "members" && (
          <div className="p-4">
            <div className="space-y-3">
              {room.members?.map((member) => (
                <div 
                  key={member.user_id}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{ background: "var(--admin-bg-section)" }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium overflow-hidden"
                    style={{ background: "var(--admin-accent)" }}
                  >
                    {member.photo_url ? (
                      <img 
                        src={`${API_URL}${member.photo_url}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (member.first_name?.[0] || member.email?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: "var(--admin-text)" }}>
                      {member.first_name && member.last_name 
                        ? `${member.first_name} ${member.last_name}`
                        : member.email
                      }
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      {member.role === "admin" ? "Administrateur" : "Développeur"}
                      {" • Depuis le "}
                      {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  
                  {/* Bouton retirer (sauf pour les admins) */}
                  {member.role !== "admin" && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                      style={{ color: "#ef4444" }}
                      title="Retirer du projet"
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjectRoomDetail;
