/**
 * Administration du Blog — La Citadelle Numérique
 * Fonctionnalités : split view, toolbar Markdown, SEO, planification, stats de vues
 */

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Save, X,
  Calendar, User, ImagePlus, Search, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { BLOG_CATEGORIES, getListingImageUrl } from "@/config/citadelleConstants";

// ── Constantes ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content_md: "",
  category: "actualites",
  author_name: "La Citadelle Numérique",
  partner_link: "",
  cover_image_url: "",
  is_published: false,
  scheduled_at: "",
  seo_title: "",
  seo_description: "",
  seo_slug: "",
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

const formatScheduled = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Convertit une datetime ISO en valeur compatible input[type=datetime-local]
const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
};

// ── Toolbar Markdown ──────────────────────────────────────────────────────────

const TOOLBAR_ACTIONS = [
  { label: "H1", before: "# ", after: "", title: "Titre H1" },
  { label: "H2", before: "## ", after: "", title: "Titre H2" },
  { label: "H3", before: "### ", after: "", title: "Titre H3" },
  { type: "sep" },
  { label: "G", before: "**", after: "**", title: "Gras", style: { fontWeight: 700 } },
  { label: "I", before: "_", after: "_", title: "Italique", style: { fontStyle: "italic" } },
  { type: "sep" },
  { label: "—", before: "\n---\n", after: "", title: "Séparateur horizontal" },
  { label: "›", before: "> ", after: "", title: "Citation" },
  { label: "• ", before: "\n- ", after: "", title: "Liste à puces" },
  { label: "1.", before: "\n1. ", after: "", title: "Liste numérotée" },
  { type: "sep" },
  { label: "</>", before: "`", after: "`", title: "Code inline", style: { fontFamily: "monospace" } },
  { label: "```", before: "\n```\n", after: "\n```", title: "Bloc de code" },
  { label: "Lien", before: "[", after: "](https://)", title: "Lien hypertexte" },
  { label: "Image", before: "![Alt](", after: ")", title: "Image" },
];

function MarkdownToolbar({ contentRef, value, onChange }) {
  const insert = useCallback((before, after) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const newVal = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(
        start + before.length,
        selected ? cursor : cursor
      );
    });
  }, [contentRef, value, onChange]);

  return (
    <div className="flex flex-wrap gap-0.5 px-3 py-1.5 flex-shrink-0"
      style={{ borderBottom: "1px solid #E2E8F0", background: "#F1F4F8" }}>
      {TOOLBAR_ACTIONS.map((action, i) => {
        if (action.type === "sep") {
          return <div key={i} className="w-px mx-1 self-stretch" style={{ background: "#E2E8F0" }} />;
        }
        return (
          <button
            key={i}
            type="button"
            title={action.title}
            onClick={() => insert(action.before, action.after)}
            className="px-2 py-1 rounded text-xs transition-all select-none hover:bg-white hover:shadow-sm"
            style={{ color: "#475569", minWidth: 28, ...action.style }}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AdminCitadelleBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPanel, setEditPanel] = useState(null); // null | "new" | post object
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [seoOpen, setSeoOpen] = useState(false);
  const [publishMode, setPublishMode] = useState("draft"); // "draft" | "now" | "scheduled"
  const contentRef = useRef(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/citadelle/admin/blog");
      setPosts(res.data.posts || []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditPanel("new");
    setPublishMode("draft");
    setSeoOpen(false);
    setError("");
  };

  const openEdit = async (post) => {
    setError("");
    setSeoOpen(false);
    try {
      const res = await api.get(`/citadelle/admin/blog/${post.id}`);
      const d = res.data;
      setForm({
        ...EMPTY_FORM,
        ...d,
        partner_link: d.partner_link || "",
        cover_image_url: d.cover_image_url || "",
        seo_title: d.seo_title || "",
        seo_description: d.seo_description || "",
        seo_slug: d.seo_slug || "",
        scheduled_at: toDatetimeLocal(d.scheduled_at),
      });
      setPublishMode(
        d.is_published ? "now" :
        d.scheduled_at ? "scheduled" : "draft"
      );
    } catch {
      setForm({ ...EMPTY_FORM, ...post, scheduled_at: "" });
      setPublishMode(post.is_published ? "now" : "draft");
    }
    setEditPanel(post);
  };

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim() || form.title.length < 3) { setError("Titre requis (minimum 3 caractères)"); return; }
    if (!form.content_md.trim() || form.content_md.length < 10) { setError("Contenu requis (minimum 10 caractères)"); return; }
    if (publishMode === "scheduled" && !form.scheduled_at) { setError("Veuillez choisir une date de publication"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content_md: form.content_md,
        category: form.category,
        author_name: form.author_name,
        partner_link: form.partner_link.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        seo_slug: form.seo_slug.trim() || null,
        is_published: publishMode === "now",
        scheduled_at: publishMode === "scheduled" ? new Date(form.scheduled_at).toISOString() : null,
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
    } finally { setSaving(false); }
  };

  const togglePublish = async (post) => {
    try {
      await api.patch(`/citadelle/admin/blog/${post.id}`, {
        is_published: !post.is_published,
        scheduled_at: null,
      });
      await fetchPosts();
    } catch (err) { console.error("Erreur toggle publication:", err); }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Supprimer cet article définitivement ?")) return;
    try {
      await api.delete(`/citadelle/admin/blog/${id}`);
      await fetchPosts();
    } catch (err) { console.error("Erreur suppression article:", err); }
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
    } catch { setError("Erreur lors de l'upload de l'image"); }
    finally { setUploadingCover(false); }
  };

  // ── Détermine le statut affiché d'un article ────────────────────────────────
  const getPostStatus = (post) => {
    if (post.is_published) return { label: "Publié", color: "#22C55E" };
    if (post.scheduled_at) return { label: `Planifié · ${formatScheduled(post.scheduled_at)}`, color: "#F59E0B" };
    return { label: "Brouillon", color: "#6B7280" };
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────

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
                style={{ background: "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center opacity-50">
            <BookOpen size={40} className="mx-auto mb-3" />
            <p className="text-sm">Aucun article rédigé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(post => {
              const catLabel = BLOG_CATEGORIES.find(c => c.slug === post.category)?.label || post.category;
              const status = getPostStatus(post);
              return (
                <div key={post.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  data-testid={`admin-blog-post-${post.id}`}>

                  {/* Miniature */}
                  {post.cover_image_url ? (
                    <img
                      src={getListingImageUrl(post.cover_image_url)}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(201,164,92,0.08)" }}>
                      <BookOpen size={16} style={{ color: "#C9A45C", opacity: 0.5 }} />
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{post.title}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(201,164,92,0.12)", color: "#C9A45C" }}>
                        {catLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs flex-wrap"
                      style={{ color: "rgba(255,255,255,0.35)" }}>
                      <span className="flex items-center gap-1">
                        <User size={9} />{post.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={9} />{formatDate(post.created_at)}
                      </span>
                      {post.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye size={9} />{post.view_count} vue{post.view_count > 1 ? "s" : ""}
                        </span>
                      )}
                      <span style={{ color: status.color }}>{status.label}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
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

      {/* ── Panneau d'édition plein écran — thème clair ── */}
      {editPanel && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#F7F8FA" }}>

          {/* Barre supérieure */}
          <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid #E2E8F0", background: "#FFFFFF" }}>
            <h3 className="font-bold text-sm truncate max-w-xs" style={{ color: "#0F2747" }}>
              {editPanel === "new" ? "Nouvel article" : `Modifier · ${editPanel.title?.slice(0, 40)}`}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-60 transition-all hover:scale-105"
                style={{ background: "#C9A45C", color: "#081729" }}
                data-testid="blog-save-btn">
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#081729" }} />
                  : <><Save size={13} /> {editPanel === "new" ? "Créer" : "Enregistrer"}</>
                }
              </button>
              <button onClick={() => setEditPanel(null)}
                className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "#94A3B8" }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-2 p-2.5 rounded-lg text-xs flex-shrink-0"
              style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
              {error}
            </div>
          )}

          {/* Corps */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── Sidebar ─────────────────────────────────────────── */}
            <div className="w-72 flex-shrink-0 overflow-y-auto"
              style={{ borderRight: "1px solid #E2E8F0", background: "#FFFFFF" }}>
              <div className="p-4 space-y-4">

                {/* Titre */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#94A3B8" }}>Titre *</label>
                  <input value={form.title}
                    onChange={e => setField("title", e.target.value)}
                    placeholder="Titre de l'article..." maxLength={200}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                    data-testid="blog-input-title" />
                </div>

                {/* Extrait */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#94A3B8" }}>Extrait</label>
                  <textarea value={form.excerpt}
                    onChange={e => setField("excerpt", e.target.value)}
                    rows={3} placeholder="Résumé affiché sur la liste..." maxLength={500}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                    data-testid="blog-input-excerpt" />
                </div>

                {/* Catégorie + Auteur */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#94A3B8" }}>Catégorie</label>
                    <select value={form.category} onChange={e => setField("category", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                      data-testid="blog-input-category">
                      {BLOG_CATEGORIES.map(c => (
                        <option key={c.slug} value={c.slug}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#94A3B8" }}>Auteur</label>
                    <input value={form.author_name} onChange={e => setField("author_name", e.target.value)}
                      maxLength={100}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                      data-testid="blog-input-author" />
                  </div>
                </div>

                {/* Image de couverture */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                    Miniature · couverture
                  </label>
                  {form.cover_image_url ? (
                    <div className="relative mb-2">
                      <img src={getListingImageUrl(form.cover_image_url)} alt="Couverture"
                        className="w-full h-32 object-cover rounded-lg" />
                      <button onClick={() => setField("cover_image_url", "")}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.55)" }}>
                        <X size={11} className="text-white" />
                      </button>
                      <div className="mt-1 text-xs text-center" style={{ color: "#94A3B8" }}>Ratio conseillé : 1200×630</div>
                    </div>
                  ) : (
                    <div className="mb-1.5 p-2 rounded-lg text-xs text-center"
                      style={{ border: "1px dashed #FECACA", color: "#EF4444", background: "#FFF5F5" }}>
                      Aucune image — impact SEO réduit
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full py-2 rounded-lg cursor-pointer text-xs font-medium transition-colors hover:bg-amber-50"
                    style={{ border: "1px dashed #C9A45C", color: "#C9A45C" }}>
                    {uploadingCover
                      ? <><div className="w-3 h-3 rounded-full border border-transparent animate-spin" style={{ borderTopColor: "#C9A45C" }} />Téléversement...</>
                      : <><ImagePlus size={13} />{form.cover_image_url ? "Remplacer" : "Choisir une image"}</>
                    }
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload} className="hidden" disabled={uploadingCover}
                      data-testid="blog-cover-upload-input" />
                  </label>
                </div>

                {/* Lien partenaire */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#94A3B8" }}>Lien partenaire</label>
                  <input value={form.partner_link} onChange={e => setField("partner_link", e.target.value)}
                    placeholder="https://..." maxLength={500}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                    data-testid="blog-input-partner-link" />
                </div>

                {/* Publication */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#94A3B8" }}>Publication</label>
                  <div className="space-y-1">
                    {[
                      { value: "draft", label: "Brouillon", icon: "○" },
                      { value: "now", label: "Publier maintenant", icon: "●" },
                      { value: "scheduled", label: "Planifier", icon: <Clock size={11} /> },
                    ].map(opt => (
                      <label key={opt.value}
                        className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2.5 rounded-lg transition-colors"
                        style={{
                          background: publishMode === opt.value ? "rgba(201,164,92,0.08)" : "transparent",
                          border: `1px solid ${publishMode === opt.value ? "rgba(201,164,92,0.35)" : "transparent"}`,
                        }}>
                        <input type="radio" name="publishMode" value={opt.value}
                          checked={publishMode === opt.value}
                          onChange={() => setPublishMode(opt.value)} className="hidden" />
                        <span className="text-xs" style={{ color: publishMode === opt.value ? "#C9A45C" : "#94A3B8" }}>
                          {opt.icon}
                        </span>
                        <span className="text-sm font-medium"
                          style={{ color: publishMode === opt.value ? "#0F2747" : "#64748B" }}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {publishMode === "scheduled" && (
                    <div className="mt-2">
                      <input type="datetime-local" value={form.scheduled_at}
                        onChange={e => setField("scheduled_at", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "#F8FAFC", border: "1px solid #C9A45C", color: "#0F2747" }}
                        data-testid="blog-input-scheduled" />
                    </div>
                  )}
                </div>

                {/* SEO — panneau collapsible */}
                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "1rem" }}>
                  <button onClick={() => setSeoOpen(o => !o)}
                    className="flex items-center justify-between w-full py-1 text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
                    style={{ color: "#64748B" }}>
                    <span className="flex items-center gap-1.5"><Search size={11} /> SEO & référencement</span>
                    {seoOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {seoOpen && (
                    <div className="space-y-3 mt-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "#94A3B8" }}>Slug URL</label>
                        <input value={form.seo_slug}
                          onChange={e => setField("seo_slug", e.target.value)}
                          placeholder="slug-personnalise"
                          maxLength={200}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                          style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#475569" }}
                          data-testid="blog-input-seo-slug" />
                        {form.seo_slug && (
                          <p className="mt-1 text-xs truncate" style={{ color: "#C9A45C" }}>/citadelle/blog/{form.seo_slug}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs" style={{ color: "#94A3B8" }}>Titre SEO</label>
                          <span className="text-xs" style={{ color: "#CBD5E1" }}>{(form.seo_title || form.title).length}/60</span>
                        </div>
                        <input value={form.seo_title}
                          onChange={e => setField("seo_title", e.target.value)}
                          placeholder={form.title || "Titre SEO..."}
                          maxLength={200}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                          data-testid="blog-input-seo-title" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs" style={{ color: "#94A3B8" }}>Description SEO</label>
                          <span className="text-xs" style={{
                            color: (form.seo_description || form.excerpt).length > 155 ? "#DC2626" : "#CBD5E1"
                          }}>
                            {(form.seo_description || form.excerpt).length}/160
                          </span>
                        </div>
                        <textarea value={form.seo_description}
                          onChange={e => setField("seo_description", e.target.value)}
                          placeholder={form.excerpt || "Description pour Google (160 car. max)..."}
                          maxLength={300} rows={3}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                          style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F2747" }}
                          data-testid="blog-input-seo-description" />
                      </div>

                      {/* Aperçu Google */}
                      <div className="p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <p className="text-xs mb-1.5 font-semibold" style={{ color: "#94A3B8" }}>Aperçu Google</p>
                        <p className="text-sm font-medium" style={{ color: "#1a73e8" }}>
                          {(form.seo_title || form.title || "Titre de l'article").slice(0, 60)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#0B8043" }}>citadelle-numerique.fr › blog</p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "#4D5156" }}>
                          {(form.seo_description || form.excerpt || "Ajoutez une description pour améliorer votre référencement.").slice(0, 155)}
                          {(form.seo_description || form.excerpt || "").length > 155 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Éditeur + Aperçu split view ─────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F7F8FA" }}>

              {/* Toolbar Markdown */}
              <MarkdownToolbar
                contentRef={contentRef}
                value={form.content_md}
                onChange={v => setField("content_md", v)}
              />

              {/* Split : éditeur gauche + aperçu droite */}
              <div className="flex flex-1 overflow-hidden">

                {/* Éditeur */}
                <div className="flex-1 flex flex-col overflow-hidden"
                  style={{ borderRight: "1px solid #E2E8F0" }}>
                  <div className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase flex-shrink-0"
                    style={{ borderBottom: "1px solid #EEF2F7", background: "#F1F4F8", color: "#94A3B8" }}>
                    Markdown
                  </div>
                  <textarea
                    ref={contentRef}
                    value={form.content_md}
                    onChange={e => setField("content_md", e.target.value)}
                    placeholder={"# Titre de l'article\n\nCommencez à rédiger...\n\n## Section\n\nTexte avec **gras**, *italique*\n\n- Point 1\n- Point 2\n\n> Citation mise en valeur"}
                    className="flex-1 p-5 text-sm font-mono outline-none resize-none"
                    style={{
                      background: "#FFFFFF",
                      color: "#334155",
                      lineHeight: "1.8",
                      caretColor: "#C9A45C",
                    }}
                    data-testid="blog-content-editor"
                  />
                </div>

                {/* Aperçu */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F9FAFB" }}>
                  <div className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase flex-shrink-0"
                    style={{ borderBottom: "1px solid #EEF2F7", background: "#F1F4F8", color: "#94A3B8" }}>
                    Aperçu
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 blog-content"
                    data-testid="blog-content-preview">
                    {form.content_md
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content_md}</ReactMarkdown>
                      : <p className="text-sm italic" style={{ color: "#CBD5E1" }}>L'aperçu s'affiche ici en temps réel...</p>
                    }
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
