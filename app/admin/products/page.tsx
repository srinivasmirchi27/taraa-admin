"use client";

import { useState } from "react";
import { products as initialProducts, Product } from "../../data/products";
import {
  Plus, Search, Filter, Edit2, Trash2, Eye,
  CheckCircle, XCircle, Star, Package,
} from "lucide-react";

const CATEGORIES = ["All", "Necklaces", "Earrings", "Rings", "Bracelets", "Anklets"];

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openEdit = (p: Product) => {
    setEditItem({ ...p });
    setShowModal(true);
  };

  const openNew = () => {
    setEditItem({
      id: `p${Date.now()}`,
      name: "",
      category: "Necklaces",
      price: 99,
      originalPrice: 1999,
      discount: 95,
      image: "",
      images: [],
      description: "",
      inStock: true,
      rating: 4.5,
      reviews: 0,
    });
    setShowModal(true);
  };

  const saveProduct = () => {
    if (!editItem) return;
    setItems((prev) => {
      const exists = prev.find((p) => p.id === editItem.id);
      return exists ? prev.map((p) => (p.id === editItem.id ? editItem : p)) : [editItem, ...prev];
    });
    setShowModal(false);
    setEditItem(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setItems((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{items.length} total products</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent text-sm outline-none w-full text-gray-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#C9A84C]/30 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80&q=60"}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                      />
                      <div>
                        <p className="font-medium text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">ID: {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-800">₹{p.price}</p>
                    <p className="text-xs text-gray-400 line-through">₹{p.originalPrice}</p>
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
                        href={`/product/${p.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        title="View"
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
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
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
      </div>

      {/* Edit/Add Modal */}
      {showModal && editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {initialProducts.find((p) => p.id === editItem.id) ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Product Name">
                <input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="input-field"
                  placeholder="Crystal Necklace Set"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    value={editItem.category}
                    onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Price (₹)">
                  <input
                    type="number"
                    value={editItem.price}
                    onChange={(e) => setEditItem({ ...editItem, price: +e.target.value })}
                    className="input-field"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Original Price (₹)">
                  <input
                    type="number"
                    value={editItem.originalPrice}
                    onChange={(e) => setEditItem({ ...editItem, originalPrice: +e.target.value })}
                    className="input-field"
                  />
                </Field>
                <Field label="Discount (%)">
                  <input
                    type="number"
                    value={editItem.discount}
                    onChange={(e) => setEditItem({ ...editItem, discount: +e.target.value })}
                    className="input-field"
                  />
                </Field>
              </div>
              <Field label="Image URL">
                <input
                  value={editItem.image}
                  onChange={(e) => setEditItem({ ...editItem, image: e.target.value, images: [e.target.value] })}
                  className="input-field"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={editItem.description}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </Field>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editItem.inStock}
                    onChange={(e) => setEditItem({ ...editItem, inStock: e.target.checked })}
                    className="w-4 h-4 accent-[#C9A84C]"
                  />
                  <span className="text-sm text-gray-700">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editItem.isBestSeller}
                    onChange={(e) => setEditItem({ ...editItem, isBestSeller: e.target.checked })}
                    className="w-4 h-4 accent-[#C9A84C]"
                  />
                  <span className="text-sm text-gray-700">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editItem.isNew}
                    onChange={(e) => setEditItem({ ...editItem, isNew: e.target.checked })}
                    className="w-4 h-4 accent-[#C9A84C]"
                  />
                  <span className="text-sm text-gray-700">New</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProduct}
                className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-lg text-sm font-semibold transition-colors"
              >
                Save Product
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
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-field:focus {
          ring: 2px;
          border-color: #C9A84C;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
        }
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
