/**
 * Administration du Blog — La Citadelle Numérique
 * CRUD articles : créer, modifier, publier/dépublier, supprimer
 * Éditeur Markdown avec bascule aperçu en temps réel
 */

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Save, X, Calendar, User, ImagePlus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { BLOG_CATEGORIES, getListingImageUrl } from "@/config/citadelleConstants";

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content_md: "",
  category: "actualites",
  author_name: "La Citadelle Numérique",
  partner_link: "",
  cover_image_url: "",
  is_published: false,
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminCitadelleBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPanel, setEditPanel] = useState(null); // null | "new" | post object
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/citadelle/admin/blog");
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditPanel("new");
    setPreviewMode(false);
    setError("");
  };

  const openEdit = async (post) => {
    setError("");
    try {
      const res = await api.get(`/citadelle/admin/blog/${post.id}`);
      setForm({
        ...res.data,
        partner_link: res.data.partner_link || "",
        cover_image_url: res.data.cover_image_url || "",
      });
    } catch {
      setForm({ ...post, content_md: "", partner_link: post.partner_link || "", cover_image_url: post.cover_image_url || "" });
    }
    setEditPanel(post);
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || form.title.length < 3) {
      setError("Titre requis (minimum 3 caractères)");
      return;
    }
    if (!form.content_md.trim() || form.content_md.length < 10) {
      setError("Contenu requis (minimum 10 caractères)");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        partner_link: form.partner_link.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      };
      if (editPanel === "new") {
        await api.post("/citadelle/admin/blog", payload);
      } else {
        await api.patch(`/citadelle/admin/blog/${editPanel.id}`, payload);
      }
      setEditPanel(null);
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/citadelle/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setField("cover_image_url", res.data.url);
    } catch (err) {
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingCover(false);
    }
  };

  const togglePublish = async (post) => {
    try {
      await api.patch(`/citadelle/admin/blog/${post.id}`, { is_published: !post.is_published });
      await fetchPosts();
    } catch (err) {
      console.error("Erreur toggle publication:", err);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Supprimer cet article définitivement ?")) return;
    try {
      await api.delete(`/citadelle/admin/blog/${id}`);
      await fetchPosts();
    } catch (err) {
      console.error("Erreur suppression article:", err);
    }
  };

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-citadelle-blog">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(201,164,92,0.15)" }}>
              <BookOpen size={18} style={{ color: "#C9A45C" }} />
            </div>
            <h1 className="text-xl font-bold">Blog — La Citadelle Numérique</h1>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: "#C9A45C", color: "#081729" }}
            data-testid="admin-add-article">
            <Plus size={16} /> Nouvel article
          </button>
        </div>

        {/* Liste des articles */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse"
                style={{ background: "var(--admin-border, rgba(255,255,255,0.08))" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center opacity-50">
            <BookOpen size={40} className="mx-auto mb-3" />
            <p className="text-sm">Aucun article rédigé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const catLabel = BLOG_CATEGORIES.find(c => c.slug === post.category)?.label || post.category;
              return (
                <div key={post.id}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{
                    background: "var(--admin-bg-card, rgba(255,255,255,0.05))",
                    border: "1px solid var(--admin-border, rgba(255,255,255,0.1))",
                    opacity: post.is_published ? 1 : 0.65,
                  }}
                  data-testid={`admin-blog-post-${post.id}`}>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-sm truncate">{post.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(201,164,92,0.15)", color: "#C9A45C" }}>
                        {catLabel}
                      </span>
                      {!post.is_published && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                          Brouillon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs opacity-50">
                      <span className="flex items-center gap-1"><User size={10} />{post.author_name}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(post.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => togglePublish(post)}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: post.is_published ? "#22C55E" : "#6B7280" }}
                      title={post.is_published ? "Dépublier" : "Publier"}
                      data-testid={`blog-toggle-publish-${post.id}`}>
                      {post.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => openEdit(post)}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: "#C9A45C" }} title="Modifier"
                      data-testid={`blog-edit-${post.id}`}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deletePost(post.id)}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: "#DC2626" }} title="Supprimer"
                      data-testid={`blog-delete-${post.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Panneau d'édition plein écran ── */}
      {editPanel && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--admin-bg, #0f172a)" }}>

          {/* Barre d'outils */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="font-bold text-base">
              {editPanel === "new" ? "Nouvel article" : "Modifier l'article"}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(p => !p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: previewMode ? "rgba(201,164,92,0.2)" : "rgba(255,255,255,0.05)",
                  color: previewMode ? "#C9A45C" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${previewMode ? "rgba(201,164,92,0.3)" : "rgba(255,255,255,0.1)"}`,
                }}
                data-testid="blog-toggle-preview">
                {previewMode ? "Éditer" : "Aperçu Markdown"}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-60 transition-all hover:scale-105"
                style={{ background: "#C9A45C", color: "#081729" }}
                data-testid="blog-save-btn">
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: "#081729" }} />
                  : <><Save size={13} /> {editPanel === "new" ? "Créer" : "Enregistrer"}</>
                }
              </button>
              <button onClick={() => setEditPanel(null)}
                className="p-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mx-5 mt-3 p-3 rounded-xl text-xs flex-shrink-0"
              style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
              {error}
            </div>
          )}

          {/* Corps du panneau */}
          <div className="flex flex-1 overflow-hidden">

            {/* Sidebar métadonnées */}
            <div className="w-64 flex-shrink-0 p-4 space-y-4 overflow-y-auto"
              style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Titre *</label>
                <input
                  value={form.title}
                  onChange={e => setField("title", e.target.value)}
                  placeholder="Mon article..." maxLength={200}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="blog-input-title"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Extrait (résumé)</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setField("excerpt", e.target.value)}
                  rows={3} placeholder="Résumé affiché sur la liste..." maxLength={500}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="blog-input-excerpt"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Catégorie</label>
                <select
                  value={form.category}
                  onChange={e => setField("category", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="blog-input-category">
                  {BLOG_CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Auteur</label>
                <input
                  value={form.author_name}
                  onChange={e => setField("author_name", e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="blog-input-author"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60">Lien partenaire (optionnel)</label>
                <input
                  value={form.partner_link}
                  onChange={e => setField("partner_link", e.target.value)}
                  placeholder="https://..." maxLength={500}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="blog-input-partner-link"
                />
              </div>

              {/* Image de couverture */}
              <div>
                <label className="block text-xs font-medium mb-2 opacity-60">Image de couverture</label>
                {form.cover_image_url ? (
                  <div className="relative mb-2">
                    <img
                      src={getListingImageUrl(form.cover_image_url)}
                      alt="Couverture"
                      className="w-full h-28 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setField("cover_image_url", "")}
                      className="absolute top-1 right-1 p-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                      title="Supprimer l'image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : null}
                <label className="flex items-center justify-center gap-2 w-full py-2 rounded-lg cursor-pointer text-xs font-medium transition-all hover:opacity-80"
                  style={{ border: "1px dashed rgba(201,164,92,0.4)", color: "rgba(201,164,92,0.8)" }}
                  data-testid="blog-cover-upload-label">
                  {uploadingCover
                    ? <><div className="w-3 h-3 rounded-full border border-transparent animate-spin" style={{ borderTopColor: "#C9A45C" }} /> Téléversement...</>
                    : <><ImagePlus size={13} /> {form.cover_image_url ? "Remplacer l'image" : "Choisir une image"}</>
                  }
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={uploadingCover}
                    data-testid="blog-cover-upload-input"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setField("is_published", e.target.checked)}
                  className="w-4 h-4 rounded"
                  data-testid="blog-input-published"
                />
                <span className="text-sm">Publier immédiatement</span>
              </label>
            </div>

            {/* Zone éditeur / prévisualisation */}
            <div className="flex-1 overflow-hidden">
              {!previewMode ? (
                <textarea
                  value={form.content_md}
                  onChange={e => setField("content_md", e.target.value)}
                  placeholder={"# Mon article\n\nRédigez votre contenu en Markdown...\n\n## Section\n\nTexte avec **gras**, *italique*, [liens](https://...) et listes :\n\n- Point 1\n- Point 2"}
                  className="w-full h-full p-6 text-sm font-mono outline-none resize-none"
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: "1.7",
                  }}
                  data-testid="blog-content-editor"
                />
              ) : (
                <div className="h-full p-6 overflow-y-auto blog-content blog-content--dark"
                  data-testid="blog-content-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.content_md || "*Aucun contenu à prévisualiser*"}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
