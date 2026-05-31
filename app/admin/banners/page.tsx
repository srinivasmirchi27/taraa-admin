"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon,
  Loader2, ChevronLeft, ChevronRight, Calendar, ExternalLink,
  Tag, RefreshCw, X, Save,
} from "lucide-react";
import { banners as bannersApi, ApiError } from "@/lib/api";
import type { Banner, BannerType, CreateBannerDto, UpdateBannerDto } from "@/lib/api";

// ─── Config ───────────────────────────────────────────────────────────────────

const BANNER_TYPES: { key: BannerType; label: string; color: string }[] = [
  { key: "hero",         label: "Hero",         color: "bg-blue-100 text-blue-700" },
  { key: "promotional",  label: "Promotional",  color: "bg-amber-100 text-amber-700" },
  { key: "announcement", label: "Announcement", color: "bg-purple-100 text-purple-700" },
  { key: "sale",         label: "Sale",         color: "bg-red-100 text-red-700" },
];

const typeColor = (t: BannerType) =>
  BANNER_TYPES.find((b) => b.key === t)?.color ?? "bg-gray-100 text-gray-600";

// ─── Draft type ───────────────────────────────────────────────────────────────

type Draft = {
  title: string;
  subtitle: string;
  type: BannerType;
  sortOrder: string;
  isActive: boolean;
  badge: string;
  ctaText: string;
  ctaLink: string;
  startDate: string;
  endDate: string;
  file: File | null;
};

function emptyDraft(): Draft {
  return {
    title: "", subtitle: "", type: "hero", sortOrder: "0",
    isActive: true, badge: "", ctaText: "", ctaLink: "",
    startDate: "", endDate: "", file: null,
  };
}

function bannerToDraft(b: Banner): Draft {
  return {
    title: b.title,
    subtitle: b.subtitle ?? "",
    type: b.type,
    sortOrder: String(b.sortOrder),
    isActive: b.isActive,
    badge: b.badge ?? "",
    ctaText: b.ctaText ?? "",
    ctaLink: b.ctaLink ?? "",
    startDate: b.startDate ? b.startDate.slice(0, 16) : "",
    endDate: b.endDate ? b.endDate.slice(0, 16) : "",
    file: null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scheduleLabel(banner: Banner): { text: string; color: string } | null {
  if (!banner.startDate && !banner.endDate) return null;
  const now = Date.now();
  const start = banner.startDate ? new Date(banner.startDate).getTime() : null;
  const end = banner.endDate ? new Date(banner.endDate).getTime() : null;

  if (start && now < start) return { text: "Scheduled", color: "bg-blue-50 text-blue-600" };
  if (end && now > end)     return { text: "Expired",   color: "bg-red-50 text-red-500" };
  return { text: "Live", color: "bg-green-50 text-green-600" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<BannerType | "all">("all");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Replace image
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggling active
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await bannersApi.adminList(typeFilter === "all" ? undefined : typeFilter);
      setItems(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setDraft(emptyDraft());
    setImagePreview("");
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (b: Banner) => {
    setDraft(bannerToDraft(b));
    setImagePreview(b.image);
    setEditId(b._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setSaving(false);
  };

  const handleFileChange = (file: File) => {
    setDraft((d) => ({ ...d, file }));
    setImagePreview(URL.createObjectURL(file));
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        // Update fields (JSON)
        const body: UpdateBannerDto = {
          title: draft.title,
          subtitle: draft.subtitle || undefined,
          type: draft.type,
          sortOrder: Number(draft.sortOrder) || 0,
          isActive: draft.isActive,
          badge: draft.badge || undefined,
          ctaText: draft.ctaText || undefined,
          ctaLink: draft.ctaLink || undefined,
          startDate: draft.startDate || undefined,
          endDate: draft.endDate || undefined,
        };
        let updated = await bannersApi.update(editId, body);

        // Replace image if a new file was picked
        if (draft.file) {
          updated = await bannersApi.replaceImage(editId, draft.file);
        }

        setItems((prev) => prev.map((b) => (b._id === editId ? updated : b)));
      } else {
        // Create — multipart
        const payload: CreateBannerDto = {
          title: draft.title,
          subtitle: draft.subtitle || undefined,
          type: draft.type,
          sortOrder: Number(draft.sortOrder) || 0,
          isActive: draft.isActive,
          badge: draft.badge || undefined,
          ctaText: draft.ctaText || undefined,
          ctaLink: draft.ctaLink || undefined,
          startDate: draft.startDate || undefined,
          endDate: draft.endDate || undefined,
          file: draft.file ?? undefined,
        };
        const created = await bannersApi.create(payload);
        setItems((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    setTogglingId(b._id);
    try {
      const updated = await bannersApi.toggleActive(b._id, !b.isActive);
      setItems((prev) => prev.map((x) => (x._id === b._id ? updated : x)));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  };

  const handleReplaceImage = async (file: File) => {
    if (!replacingId) return;
    setReplacing(true);
    try {
      const updated = await bannersApi.replaceImage(replacingId, file);
      setItems((prev) => prev.map((b) => (b._id === replacingId ? updated : b)));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Image replace failed");
    } finally {
      setReplacing(false);
      setReplacingId(null);
      if (replaceFileRef.current) replaceFileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await bannersApi.delete(deleteId);
      setItems((prev) => prev.filter((b) => b._id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────────

  const displayed = typeFilter === "all" ? items : items.filter((b) => b.type === typeFilter);
  const stats = {
    total: items.length,
    active: items.filter((b) => b.isActive).length,
    scheduled: items.filter((b) => b.startDate && new Date(b.startDate).getTime() > Date.now()).length,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500">
            {stats.total} banners · {stats.active} active · {stats.scheduled} scheduled
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            typeFilter === "all" ? "bg-[#C9A84C] text-black" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All <span className="ml-1 text-xs opacity-70">({items.length})</span>
        </button>
        {BANNER_TYPES.map(({ key, label }) => {
          const count = items.filter((b) => b.type === key).length;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === key ? "bg-[#C9A84C] text-black" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label} <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Banner cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <ImageIcon size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No banners yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Banner" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((banner) => {
              const sched = scheduleLabel(banner);
              return (
                <div
                  key={banner._id}
                  className={`bg-white rounded-xl border overflow-hidden flex flex-col sm:flex-row ${
                    banner.isActive ? "border-gray-200" : "border-gray-100 opacity-70"
                  }`}
                >
                  {/* Image */}
                  <div className="sm:w-52 h-32 sm:h-auto bg-gray-100 shrink-0 relative overflow-hidden">
                    {banner.image ? (
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon size={28} className="text-gray-300" />
                      </div>
                    )}
                    {/* Sort order badge */}
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      #{banner.sortOrder}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${typeColor(banner.type)}`}>
                          {banner.type}
                        </span>
                        {banner.badge && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Tag size={10} /> {banner.badge}
                          </span>
                        )}
                        {sched && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${sched.color}`}>
                            <Calendar size={10} /> {sched.text}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          banner.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800 text-base leading-tight">{banner.title}</p>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{banner.subtitle}</p>
                      )}
                    </div>

                    {(banner.ctaText || banner.ctaLink) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#C9A84C]">
                        <ExternalLink size={11} />
                        <span className="truncate">
                          {banner.ctaText || "CTA"}
                          {banner.ctaLink && ` → ${banner.ctaLink}`}
                        </span>
                      </div>
                    )}

                    {(banner.startDate || banner.endDate) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {banner.startDate && `From ${new Date(banner.startDate).toLocaleDateString("en-IN")}`}
                        {banner.startDate && banner.endDate && " · "}
                        {banner.endDate && `Until ${new Date(banner.endDate).toLocaleDateString("en-IN")}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center justify-end gap-1 p-3 border-t sm:border-t-0 sm:border-l border-gray-100 shrink-0">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(banner)}
                      disabled={togglingId === banner._id}
                      title={banner.isActive ? "Deactivate" : "Activate"}
                      className={`p-2 rounded-lg transition-colors ${
                        banner.isActive
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {togglingId === banner._id
                        ? <Loader2 size={16} className="animate-spin" />
                        : banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    {/* Replace image */}
                    <button
                      onClick={() => { setReplacingId(banner._id); replaceFileRef.current?.click(); }}
                      title="Replace image"
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      {replacing && replacingId === banner._id
                        ? <Loader2 size={16} className="animate-spin" />
                        : <RefreshCw size={16} />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(banner)}
                      title="Edit"
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteId(banner._id)}
                      title="Delete"
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Hidden replace-image file input */}
      <input
        ref={replaceFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleReplaceImage(f);
        }}
      />

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {editId ? "Edit Banner" : "Add Banner"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Image upload / preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editId ? "Image (pick to replace)" : "Banner Image"}
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-36 object-cover rounded-xl border border-gray-200 mb-2"
                  />
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`w-full py-3 border-2 border-dashed rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                    draft.file
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-gray-200 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C]"
                  }`}
                >
                  <ImageIcon size={16} />
                  {draft.file ? draft.file.name : "Choose image file"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                />
              </div>

              {/* Title + Subtitle */}
              <Field label="Title *">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="input-field"
                  placeholder="Summer Sale — Up to 50% Off"
                />
              </Field>
              <Field label="Subtitle">
                <input
                  value={draft.subtitle}
                  onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                  className="input-field"
                  placeholder="Shop the finest jewellery collection"
                />
              </Field>

              {/* Type + Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Banner Type">
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as BannerType }))}
                    className="input-field capitalize"
                  >
                    {BANNER_TYPES.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Sort Order">
                  <input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                    className="input-field"
                    placeholder="0"
                  />
                </Field>
              </div>

              {/* Badge + CTA Text */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Badge">
                  <input
                    value={draft.badge}
                    onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))}
                    className="input-field"
                    placeholder="NEW · HOT · SALE"
                  />
                </Field>
                <Field label="CTA Button Text">
                  <input
                    value={draft.ctaText}
                    onChange={(e) => setDraft((d) => ({ ...d, ctaText: e.target.value }))}
                    className="input-field"
                    placeholder="Shop Now"
                  />
                </Field>
              </div>

              {/* CTA Link */}
              <Field label="CTA Link (URL or path)">
                <input
                  value={draft.ctaLink}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaLink: e.target.value }))}
                  className="input-field"
                  placeholder="/collection or https://..."
                />
              </Field>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date (optional)">
                  <input
                    type="datetime-local"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                    className="input-field"
                  />
                </Field>
                <Field label="End Date (optional)">
                  <input
                    type="datetime-local"
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                    className="input-field"
                  />
                </Field>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    draft.isActive ? "bg-[#C9A84C]" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    draft.isActive ? "translate-x-5" : "translate-x-1"
                  }`} />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {draft.isActive ? "Active — visible on site" : "Inactive — hidden from site"}
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100 shrink-0">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !draft.title.trim()}
                className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : editId ? "Save Changes" : "Create Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Delete Banner?</h3>
            <p className="text-sm text-gray-500 mb-5">
              The banner image will also be removed from Cloudinary. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-field { width:100%; padding:0.5rem 0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; font-size:0.875rem; outline:none; background:white; }
        .input-field:focus { border-color:#C9A84C; box-shadow:0 0 0 3px rgba(201,168,76,0.15); }
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
