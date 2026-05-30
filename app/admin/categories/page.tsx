"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Edit2, X, Loader2, Tag, Package,
  ImagePlus, ToggleLeft, ToggleRight,
} from "lucide-react";
import { categories as categoriesApi, uploads, ApiError } from "@/lib/api";
import type { Category, CreateCategoryDto } from "@/lib/api";

type DraftCategory = Partial<Omit<Category, "_id" | "createdAt">> & { _id?: string };

const GRADIENT_MAP: Record<string, string> = {
  rings:        "from-amber-400 to-orange-400",
  necklaces:    "from-rose-400 to-pink-500",
  earrings:     "from-violet-400 to-purple-500",
  bracelets:    "from-teal-400 to-cyan-500",
  bangles:      "from-yellow-400 to-amber-500",
  anklets:      "from-emerald-400 to-green-500",
  "maang-tikka":"from-fuchsia-400 to-pink-600",
  "nose-pins":  "from-sky-400 to-blue-500",
};

function gradientFor(slug: string) {
  return GRADIENT_MAP[slug.toLowerCase()] ?? "from-gray-400 to-gray-500";
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<DraftCategory>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await categoriesApi.list(true); // all=true → include inactive
      setCats(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setDraft({ name: "", slug: "", description: "", image: "", isActive: true, sortOrder: cats.length + 1 });
    setModalError("");
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setDraft({ ...cat });
    setModalError("");
    setShowModal(true);
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploads.image(file);
      setDraft((d) => ({ ...d, image: result.secureUrl }));
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft.name?.trim()) { setModalError("Name is required."); return; }
    if (!draft.slug?.trim()) { setModalError("Slug is required."); return; }

    setSaving(true);
    setModalError("");
    try {
      if (draft._id) {
        const { _id, ...rest } = draft as Category;
        const updated = await categoriesApi.update(_id, rest);
        setCats((prev) => prev.map((c) => (c._id === _id ? updated : c)));
      } else {
        const created = await categoriesApi.create(draft as CreateCategoryDto);
        setCats((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const updated = await categoriesApi.update(cat._id, { isActive: !cat.isActive });
      setCats((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
    } catch {
      // silently ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await categoriesApi.delete(deleteId);
      setCats((prev) => prev.filter((c) => c._id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{cats.length} categories</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Grid */}
      {cats.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-2 text-gray-300" />
          No categories yet. Click &quot;Add Category&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((cat) => (
            <div
              key={cat._id}
              className={`bg-white rounded-xl border overflow-hidden ${cat.isActive ? "border-gray-200" : "border-dashed border-gray-300 opacity-70"}`}
            >
              {/* Image / gradient banner */}
              <div className={`h-24 relative flex items-center justify-center ${cat.image ? "" : `bg-gradient-to-br ${gradientFor(cat.slug)}`}`}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : null}
                <div className={`${cat.image ? "absolute inset-0 bg-black/30" : ""} flex items-center justify-center`}>
                  <h3 className="text-white text-lg font-bold capitalize drop-shadow">{cat.name}</h3>
                </div>
                {!cat.isActive && (
                  <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="p-4">
                {cat.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-mono">{cat.slug}</span>
                    <span className="text-xs text-gray-400">· #{cat.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title={cat.isActive ? "Deactivate" : "Activate"}
                    >
                      {cat.isActive
                        ? <ToggleRight size={16} className="text-green-500" />
                        : <ToggleLeft size={16} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(cat._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {draft._id ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                  {modalError}
                </div>
              )}

              <Field label="Name *">
                <input
                  value={draft.name ?? ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      name,
                      // auto-fill slug only when creating
                      ...(!d._id && { slug: slugify(name) }),
                    }));
                  }}
                  className="input" placeholder="Rings"
                />
              </Field>

              <Field label="Slug *">
                <input
                  value={draft.slug ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, slug: slugify(e.target.value) }))}
                  className="input font-mono text-sm" placeholder="rings"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, hyphens only (auto-generated from name)</p>
              </Field>

              <Field label="Description">
                <textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={2} className="input resize-none"
                  placeholder="Gold, silver and oxidised rings for every occasion."
                />
              </Field>

              <Field label="Image">
                <div className="space-y-2">
                  {draft.image && (
                    <img src={draft.image} alt="preview" className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                  )}
                  <div className="flex gap-2">
                    <input
                      value={draft.image ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
                      className="input flex-1 text-xs" placeholder="https://res.cloudinary.com/..."
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60 shrink-0"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                      {uploading ? "…" : "Upload"}
                    </button>
                  </div>
                  <input
                    ref={fileRef} type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Sort Order">
                  <input
                    type="number" min={1}
                    value={draft.sortOrder ?? 1}
                    onChange={(e) => setDraft((d) => ({ ...d, sortOrder: +e.target.value }))}
                    className="input"
                  />
                </Field>
                <Field label="Status">
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <div
                      onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${draft.isActive ? "bg-[#C9A84C]" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${draft.isActive ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                    <span className="text-sm text-gray-700">{draft.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </Field>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : draft._id ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Category?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone. Products in this category won&apos;t be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input { width:100%; padding:0.5rem 0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; font-size:0.875rem; outline:none; background:white; }
        .input:focus { border-color:#C9A84C; box-shadow:0 0 0 3px rgba(201,168,76,0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
