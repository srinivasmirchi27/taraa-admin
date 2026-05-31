"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Package, CheckCircle, XCircle, Loader2,
  ChevronLeft, ChevronRight, Boxes, ToggleLeft, ToggleRight,
} from "lucide-react";
import { products as productsApi, ApiError } from "@/lib/api";
import type { Product } from "@/lib/api";

type StockFilter = "all" | "inStock" | "outOfStock";

const PAGE_SIZE = 20;

export default function AdminInventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalInStock, setTotalInStock] = useState(0);
  const [totalOutOfStock, setTotalOutOfStock] = useState(0);
  const [page, setPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        page,
        limit: PAGE_SIZE,
        ...(search && { search }),
        ...(stockFilter === "inStock" && { inStock: true }),
        ...(stockFilter === "outOfStock" && { inStock: false }),
      };
      const [res, inStockRes, outRes] = await Promise.all([
        productsApi.list(filters),
        productsApi.list({ page: 1, limit: 1, inStock: true }),
        productsApi.list({ page: 1, limit: 1, inStock: false }),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setTotalInStock(inStockRes.total);
      setTotalOutOfStock(outRes.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [page, stockFilter, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleStock = async (product: Product) => {
    setToggling(product._id);
    try {
      const updated = await productsApi.update(product._id, { inStock: !product.inStock });
      setItems((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      // Update stats
      if (updated.inStock) {
        setTotalInStock((n) => n + 1);
        setTotalOutOfStock((n) => n - 1);
      } else {
        setTotalInStock((n) => n - 1);
        setTotalOutOfStock((n) => n + 1);
      }
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to update stock status");
    } finally {
      setToggling(null);
    }
  };

  const filterTabs: { key: StockFilter; label: string; count: number | null }[] = [
    { key: "all",        label: "All Products",  count: totalInStock + totalOutOfStock },
    { key: "outOfStock", label: "Out of Stock",   count: totalOutOfStock },
    { key: "inStock",    label: "In Stock",       count: totalInStock },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">Manage product stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Boxes}
          label="Total Products"
          value={totalInStock + totalOutOfStock}
          bg="bg-gray-50"
          ic="text-gray-600"
        />
        <StatCard
          icon={CheckCircle}
          label="In Stock"
          value={totalInStock}
          bg="bg-green-50"
          ic="text-green-600"
        />
        <StatCard
          icon={XCircle}
          label="Out of Stock"
          value={totalOutOfStock}
          bg="bg-red-50"
          ic="text-red-500"
          warn={totalOutOfStock > 0}
        />
      </div>

      {/* Filter tabs + search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setStockFilter(key); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                stockFilter === key
                  ? "bg-[#C9A84C] text-black"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                stockFilter === key ? "bg-black/10 text-black" : "bg-white text-gray-500"
              }`}>
                {count ?? "—"}
              </span>
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
        >
          <Search size={15} className="text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent text-sm outline-none w-full text-gray-700"
          />
        </form>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

      {/* Inventory table */}
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Stock Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0 bg-gray-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Package size={14} className="text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1 max-w-[180px]">{p.name}</p>
                          <p className="text-xs text-gray-400">ID: {p._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium capitalize">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">₹{p.price.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3">
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle size={11} /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleStock(p)}
                        disabled={toggling === p._id}
                        title={p.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
                          p.inStock
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {toggling === p._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : p.inStock ? (
                          <><ToggleRight size={13} /> Mark Out</>
                        ) : (
                          <><ToggleLeft size={13} /> Mark In</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      <Boxes size={32} className="mx-auto mb-2 text-gray-300" />
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={15} />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, bg, ic, warn,
}: {
  icon: React.ElementType; label: string; value: number; bg: string; ic: string; warn?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${warn ? "border-red-200" : "border-gray-200"}`}>
      <div className={`${bg} p-3 rounded-lg`}>
        <Icon size={20} className={ic} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${warn ? "text-red-500" : "text-gray-800"}`}>{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
