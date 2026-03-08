/**
 * Page Espace Projet - Chat et Notes collaboratifs
 * Pour les développeurs participant à un projet
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Send, Pin, Users, FileText, MessageSquare, 
  Plus, Trash2, Edit2, X, Loader2, MoreVertical
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { getAuthHeaders } from "@/services/authService";
import { API_URL } from "@/config/constants";
import axios from "axios";

const ProjectRoom = () => {
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
  const [activeTab, setActiveTab] = useState("chat"); // chat, notes, members
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
    
    // Polling pour les messages (toutes les 5 secondes)
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [roomId]);

  // Scroll automatique vers le dernier message
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
      console.error(err);
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

  const startEditNote = (note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNotePinned(note.is_pinned);
    setShowNoteForm(true);
  };

  // Formatage de l'heure
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

  // Affichage du chargement
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--sage)" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !room) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || "Espace projet introuvable"}</p>
          <Link 
            to="/espace-developpeur/projets"
            className="text-blue-500 hover:underline"
          >
            Retour aux projets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {room.name}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {room.members?.length || 0} membre(s)
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div 
        className="flex gap-2 mb-4 p-1 rounded-lg"
        style={{ background: "var(--bg-section)" }}
      >
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "chat" ? "bg-white shadow-sm" : ""
          }`}
          style={{ color: activeTab === "chat" ? "var(--sage-dark)" : "var(--text-muted)" }}
        >
          <MessageSquare size={18} />
          Discussion
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "notes" ? "bg-white shadow-sm" : ""
          }`}
          style={{ color: activeTab === "notes" ? "var(--sage-dark)" : "var(--text-muted)" }}
        >
          <FileText size={18} />
          Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "members" ? "bg-white shadow-sm" : ""
          }`}
          style={{ color: activeTab === "members" ? "var(--sage-dark)" : "var(--text-muted)" }}
        >
          <Users size={18} />
          Membres
        </button>
      </div>

      {/* Contenu des onglets */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        {/* ONGLET CHAT */}
        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
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
                            style={{ background: "var(--bg-section)", color: "var(--text-muted)" }}
                          >
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] ${isOwn ? "order-2" : ""}`}>
                          {!isOwn && (
                            <p className="text-xs mb-1 ml-2" style={{ color: "var(--sage)" }}>
                              {msg.sender?.first_name || msg.sender?.email?.split("@")[0]}
                            </p>
                          )}
                          <div
                            className="px-4 py-2 rounded-2xl"
                            style={{ 
                              background: isOwn ? "var(--sage)" : "var(--bg-section)",
                              color: isOwn ? "white" : "var(--text-primary)"
                            }}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p 
                            className={`text-xs mt-1 ${isOwn ? "text-right mr-2" : "ml-2"}`}
                            style={{ color: "var(--text-muted)" }}
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

            {/* Input message */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 border-t flex gap-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 rounded-full"
                style={{ 
                  background: "var(--bg-section)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="p-3 rounded-full text-white disabled:opacity-50 transition-colors"
                style={{ background: "var(--sage)" }}
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
            {/* Bouton ajouter note */}
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteContent("");
                setNotePinned(false);
                setShowNoteForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg mb-4 transition-colors"
              style={{ 
                background: "var(--bg-section)",
                color: "var(--sage)",
                border: "2px dashed var(--border-color)"
              }}
            >
              <Plus size={20} />
              Ajouter une note
            </button>

            {/* Formulaire note */}
            {showNoteForm && (
              <div 
                className="p-4 rounded-lg mb-4"
                style={{ background: "var(--bg-section)", border: "1px solid var(--sage)" }}
              >
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Contenu de la note..."
                  className="w-full mb-3 px-3 py-2 rounded-lg"
                  style={{ 
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
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
                      style={{ color: "var(--text-muted)" }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={!noteContent.trim() || savingNote}
                      className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                      style={{ background: "var(--sage)" }}
                    >
                      {savingNote ? "Enregistrement..." : editingNote ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des notes */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Aucune note pour le moment</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-4 rounded-lg"
                    style={{ 
                      background: note.is_pinned ? "var(--sage-light)" : "var(--bg-section)",
                      border: note.is_pinned ? "1px solid var(--sage)" : "1px solid var(--border-color)"
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {note.is_pinned && (
                          <Pin size={14} style={{ color: "var(--sage)" }} />
                        )}
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {note.author?.first_name || note.created_by === "system" ? "Système" : "Membre"}
                          {" • "}
                          {new Date(note.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {note.created_by === user?.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditNote(note)}
                            className="p-1 rounded hover:bg-white/50"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded hover:bg-red-50"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p 
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: "var(--text-primary)" }}
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
                  style={{ background: "var(--bg-section)" }}
                >
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium overflow-hidden"
                    style={{ background: "var(--sage)" }}
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
                  
                  {/* Infos */}
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {member.first_name && member.last_name 
                        ? `${member.first_name} ${member.last_name}`
                        : member.email
                      }
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {member.role === "admin" ? "Administrateur" : "Membre"}
                      {" • Depuis le "}
                      {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectRoom;
