"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Filter, Edit2, Trash2, Eye,
  CheckCircle, XCircle, Star, Package, Loader2, ChevronLeft, ChevronRight,
  ImagePlus, Upload, Images,
} from "lucide-react";
import { products as productsApi, categories as categoriesApi, uploads, ApiError } from "@/lib/api";
import type { Product, CreateProductDto, BulkProductInput, BulkUploadResult } from "@/lib/api";

type DraftProduct = Omit<Product, "_id" | "createdAt"> & { _id?: string };

type BulkRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  discount: string;
  description: string;
  imageUrl: string;
  file: File | null;
  inStock: boolean;
};

const makeRow = (cat: string): BulkRow => ({
  id: Math.random().toString(36).slice(2),
  name: "",
  category: cat,
  price: "",
  originalPrice: "",
  discount: "",
  description: "",
  imageUrl: "",
  file: null,
  inStock: true,
});

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("");
  const [filterNew, setFilterNew] = useState(false);
  const [filterBestSeller, setFilterBestSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<DraftProduct | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [appendingImages, setAppendingImages] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendImagesRef = useRef<HTMLInputElement>(null);

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

  const handleAppendImages = async (files: FileList) => {
    if (!editItem?._id) return;
    setAppendingImages(true);
    try {
      const updated = await productsApi.appendImages(editItem._id, Array.from(files));
      setEditItem((prev) => prev ? { ...prev, images: updated.images } : prev);
      setItems((prev) => prev.map((p) => p._id === editItem._id ? updated : p));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to append images");
    } finally {
      setAppendingImages(false);
      if (appendImagesRef.current) appendImagesRef.current.value = "";
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploads.image(file);
      setEditItem((prev) => prev ? { ...prev, image: result.secureUrl, images: [result.secureUrl] } : prev);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    categoriesApi.list(true)
      .then((cats) => setCategories(cats.map((c) => c.slug)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const filters = {
          page,
          limit: PAGE_SIZE,
          ...(category !== "All" && { category }),
          ...(search && { search }),
          ...(sort && { sort: sort as "price_asc" | "price_desc" | "popular" | "newest" }),
          ...(filterNew && { isNew: true }),
          ...(filterBestSeller && { isBestSeller: true }),
        };
        const res = await productsApi.list(filters);
        setItems(res.items);
        setTotal(res.total);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, category, search, sort, filterNew, filterBestSeller, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openEdit = (p: Product) => {
    setEditItem({ ...p });
    setShowModal(true);
  };

  const openNew = () => {
    setEditItem({
      name: "", category: categories[0] ?? "rings",
      price: 0, originalPrice: 0, discount: 0,
      image: "", images: [], description: "",
      inStock: true, rating: 0, reviews: 0,
    });
    setShowModal(true);
  };

  const saveProduct = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      if (editItem._id) {
        const { _id, ...rest } = editItem as Product;
        const updated = await productsApi.update(_id, rest);
        setItems((prev) => prev.map((p) => (p._id === _id ? updated : p)));
      } else {
        const created = await productsApi.create(editItem as CreateProductDto);
        setItems((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
      }
      setShowModal(false);
      setEditItem(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await productsApi.delete(deleteId);
      setItems((prev) => prev.filter((p) => p._id !== deleteId));
      setTotal((t) => t - 1);
      setDeleteId(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk upload handlers ────────────────────────────────────────────────────

  const openBulkModal = () => {
    setBulkRows([makeRow(categories[0] ?? "")]);
    setBulkResult(null);
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkResult(null);
  };

  const addBulkRow = () => {
    if (bulkRows.length >= 50) return;
    setBulkRows((prev) => [...prev, makeRow(categories[0] ?? "")]);
  };

  const removeBulkRow = (i: number) => {
    setBulkRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateBulkRow = (i: number, updated: BulkRow) => {
    setBulkRows((prev) => prev.map((r, idx) => (idx === i ? updated : r)));
  };

  const runBulkUpload = async () => {
    setBulkUploading(true);
    try {
      const productList: BulkProductInput[] = bulkRows.map((row) => ({
        name: row.name,
        category: row.category,
        price: Number(row.price) || 0,
        originalPrice: Number(row.originalPrice) || Number(row.price) || 0,
        discount: Number(row.discount) || 0,
        description: row.description,
        inStock: row.inStock,
        ...(!row.file && row.imageUrl ? { image: row.imageUrl } : {}),
      }));
      const images = bulkRows.map((r) => r.file);
      const result = await productsApi.bulkUpload(productList, images);
      setBulkResult(result);
      if (result.summary.created > 0) setRefreshKey((k) => k + 1);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{total} total products</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openBulkModal}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload size={15} /> Bulk Upload
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1"
          >
            <Search size={15} className="text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="bg-transparent text-sm outline-none w-full text-gray-700"
            />
          </form>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#C9A84C]/30 bg-white capitalize"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#C9A84C]/30 bg-white"
            >
              <option value="">Sort: Default</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Filter:</span>
          <button
            onClick={() => { setFilterNew((v) => !v); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              filterNew ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            New Arrivals
          </button>
          <button
            onClick={() => { setFilterBestSeller((v) => !v); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              filterBestSeller ? "bg-amber-500 text-white border-amber-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Best Sellers
          </button>
          {(filterNew || filterBestSeller || sort || category !== "All" || search) && (
            <button
              onClick={() => {
                setFilterNew(false); setFilterBestSeller(false);
                setSort(""); setCategory("All"); setSearch(""); setSearchInput(""); setPage(1);
              }}
              className="text-xs px-3 py-1 rounded-full border border-red-200 text-red-500 hover:bg-red-50 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Rating</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Stock</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Package size={16} className="text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400">ID: {p._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium capitalize">{p.category}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">₹{p.price}</p>
                      {p.originalPrice > p.price && (
                        <p className="text-xs text-gray-400 line-through">₹{p.originalPrice}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-gray-700">{p.rating}</span>
                        <span className="text-gray-400 text-xs">({p.reviews.toLocaleString()})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle size={13} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                          <XCircle size={13} /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={p.image || "#"}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="View image"
                        >
                          <Eye size={15} />
                        </a>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Package size={32} className="mx-auto mb-2 text-gray-300" />
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editItem._id ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Product Name">
                <input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="input-field" placeholder="Gold Plated Ring"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    value={editItem.category}
                    onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                    className="input-field capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Price (₹)">
                  <input type="number" value={editItem.price}
                    onChange={(e) => setEditItem({ ...editItem, price: +e.target.value })}
                    className="input-field" />
                </Field>
              </div>
              <Field label="Badge (optional)">
                <input
                  value={editItem.badge ?? ""}
                  onChange={(e) => setEditItem({ ...editItem, badge: e.target.value || undefined })}
                  className="input-field"
                  placeholder="e.g. New, Bestseller, Sale"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Original Price (₹)">
                  <input type="number" value={editItem.originalPrice}
                    onChange={(e) => setEditItem({ ...editItem, originalPrice: +e.target.value })}
                    className="input-field" />
                </Field>
                <Field label="Discount (%)">
                  <input type="number" value={editItem.discount}
                    onChange={(e) => setEditItem({ ...editItem, discount: +e.target.value })}
                    className="input-field" />
                </Field>
              </div>
              <Field label="Product Image">
                <div className="space-y-2">
                  {editItem.image && (
                    <img src={editItem.image} alt="preview" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  )}
                  <div className="flex gap-2">
                    <input
                      value={editItem.image}
                      onChange={(e) => setEditItem({ ...editItem, image: e.target.value, images: [e.target.value] })}
                      className="input-field flex-1"
                      placeholder="https://res.cloudinary.com/..."
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60 shrink-0"
                      title="Upload from device"
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                </div>
              </Field>
              <Field label="Description">
                <textarea value={editItem.description}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  rows={3} className="input-field resize-none" />
              </Field>
              <div className="flex items-center gap-4">
                {(["inStock", "isBestSeller", "isNew"] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!editItem[key]}
                      onChange={(e) => setEditItem({ ...editItem, [key]: e.target.checked })}
                      className="w-4 h-4 accent-[#C9A84C]" />
                    <span className="text-sm text-gray-700 capitalize">
                      {key === "inStock" ? "In Stock" : key === "isBestSeller" ? "Best Seller" : "New"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Append more images (edit only) */}
            {editItem._id && (
              <div className="px-6 pb-4">
                <div className="border border-dashed border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Additional Images</p>
                      <p className="text-xs text-gray-400">{editItem.images?.length ?? 0} image(s) in gallery</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => appendImagesRef.current?.click()}
                      disabled={appendingImages}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {appendingImages ? <Loader2 size={14} className="animate-spin" /> : <Images size={14} />}
                      {appendingImages ? "Uploading…" : "Add More"}
                    </button>
                  </div>
                  {editItem.images && editItem.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {editItem.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}
                  <input
                    ref={appendImagesRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleAppendImages(e.target.files); }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveProduct} disabled={saving}
                className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving..." : "Save Product"}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Bulk Upload Products</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Max 50 products. Products without a file must include an image URL.
                </p>
              </div>
              <button onClick={closeBulkModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Result summary */}
            {bulkResult && (
              <div className="px-6 pt-5 space-y-3 shrink-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-700">{bulkResult.summary.total}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{bulkResult.summary.created}</p>
                    <p className="text-xs text-green-700 font-medium mt-0.5">Created</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-500">{bulkResult.summary.failed}</p>
                    <p className="text-xs text-red-600 font-medium mt-0.5">Failed</p>
                  </div>
                </div>
                {bulkResult.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1.5 max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold text-red-700">Failures:</p>
                    {bulkResult.failed.map((f) => (
                      <p key={f.index} className="text-xs text-red-600">
                        <span className="font-medium">Row {f.index + 1}</span>
                        {f.name ? ` (${f.name})` : ""}: {f.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rows */}
            {!bulkResult && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {bulkRows.map((row, i) => (
                  <BulkRowCard
                    key={row.id}
                    index={i}
                    row={row}
                    categories={categories}
                    onChange={(updated) => updateBulkRow(i, updated)}
                    onRemove={() => removeBulkRow(i)}
                  />
                ))}

                {bulkRows.length < 50 && (
                  <button
                    onClick={addBulkRow}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={15} />
                    Add Product Row
                    <span className="text-xs opacity-60">({bulkRows.length}/50)</span>
                  </button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100 shrink-0">
              <button
                onClick={closeBulkModal}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                {bulkResult ? "Close" : "Cancel"}
              </button>
              {!bulkResult && (
                <button
                  onClick={runBulkUpload}
                  disabled={bulkUploading || bulkRows.length === 0}
                  className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {bulkUploading && <Loader2 size={14} className="animate-spin" />}
                  {bulkUploading
                    ? `Uploading ${bulkRows.length} product${bulkRows.length !== 1 ? "s" : ""}…`
                    : `Upload ${bulkRows.length} Product${bulkRows.length !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-field { width:100%; padding:0.5rem 0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; font-size:0.875rem; outline:none; }
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

function BulkRowCard({
  index,
  row,
  categories,
  onChange,
  onRemove,
}: {
  index: number;
  row: BulkRow;
  categories: string[];
  onChange: (r: BulkRow) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Product {index + 1}</span>
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-400 transition-colors"
          title="Remove row"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Row 1: Name + Category + inStock */}
      <div className="grid grid-cols-6 gap-2">
        <input
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          className="input-field col-span-3"
          placeholder="Product Name *"
        />
        <select
          value={row.category}
          onChange={(e) => onChange({ ...row, category: e.target.value })}
          className="input-field col-span-2 capitalize"
        >
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 cursor-pointer col-span-1 justify-center">
          <input
            type="checkbox"
            checked={row.inStock}
            onChange={(e) => onChange({ ...row, inStock: e.target.checked })}
            className="w-3.5 h-3.5 accent-[#C9A84C]"
          />
          <span className="text-xs text-gray-600 whitespace-nowrap">In Stock</span>
        </label>
      </div>

      {/* Row 2: Price + Orig Price + Discount */}
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          value={row.price}
          onChange={(e) => onChange({ ...row, price: e.target.value })}
          className="input-field"
          placeholder="Price ₹ *"
        />
        <input
          type="number"
          value={row.originalPrice}
          onChange={(e) => onChange({ ...row, originalPrice: e.target.value })}
          className="input-field"
          placeholder="Orig Price ₹"
        />
        <input
          type="number"
          value={row.discount}
          onChange={(e) => onChange({ ...row, discount: e.target.value })}
          className="input-field"
          placeholder="Discount %"
        />
      </div>

      {/* Row 3: Description */}
      <textarea
        value={row.description}
        onChange={(e) => onChange({ ...row, description: e.target.value })}
        rows={2}
        className="input-field resize-none"
        placeholder="Description"
      />

      {/* Row 4: Image URL or File */}
      <div className="flex gap-2 items-center">
        <input
          value={row.imageUrl}
          onChange={(e) => onChange({ ...row, imageUrl: e.target.value, file: null })}
          className="input-field flex-1"
          placeholder="Image URL (or upload a file)"
          disabled={!!row.file}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium shrink-0 transition-colors ${
            row.file
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          title={row.file ? row.file.name : "Choose image file"}
        >
          <ImagePlus size={13} />
          {row.file ? "Change" : "File"}
        </button>
        {row.file && (
          <button
            type="button"
            onClick={() => onChange({ ...row, file: null })}
            className="text-red-400 hover:text-red-600 shrink-0"
            title="Remove file"
          >
            <XCircle size={16} />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange({ ...row, file: f, imageUrl: "" });
            e.target.value = "";
          }}
        />
      </div>
      {row.file && (
        <p className="text-xs text-green-600 truncate">
          {row.file.name} — {(row.file.size / 1024).toFixed(1)} KB
        </p>
      )}
    </div>
  );
}
