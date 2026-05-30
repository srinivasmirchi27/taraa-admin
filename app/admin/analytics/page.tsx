"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, ShoppingCart, Users, Package, Loader2,
  CheckCircle, XCircle, Clock, Truck,
} from "lucide-react";
import { products as productsApi, orders as ordersApi, users as usersApi, ApiError } from "@/lib/api";
import type { Product } from "@/lib/api";

interface CategoryCount { name: string; count: number }
interface StatusCount   { status: string; count: number }

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [categoryData, setCategoryData] = useState<CategoryCount[]>([]);
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, orderRes, userRes, catNames] = await Promise.all([
          productsApi.list({ page: 1, limit: 1 }),
          ordersApi.list(1, 1),
          usersApi.list(1, 1),
          productsApi.categories(),
        ]);

        setTotalProducts(prodRes.total);
        setTotalOrders(orderRes.total);
        setTotalCustomers(userRes.total);

        // category counts and order status counts in parallel
        const [catCounts, processingRes, shippedRes, deliveredRes, cancelledRes, top] = await Promise.all([
          Promise.all(
            catNames.map((name) =>
              productsApi.list({ category: name, page: 1, limit: 1 })
                .then((r) => ({ name, count: r.total }))
                .catch(() => ({ name, count: 0 }))
            )
          ),
          ordersApi.list(1, 1, "processing"),
          ordersApi.list(1, 1, "shipped"),
          ordersApi.list(1, 1, "delivered"),
          ordersApi.list(1, 1, "cancelled"),
          productsApi.list({ page: 1, limit: 20 }),
        ]);

        setCategoryData(catCounts);
        setStatusData([
          { status: "processing", count: processingRes.total },
          { status: "shipped",    count: shippedRes.total },
          { status: "delivered",  count: deliveredRes.total },
          { status: "cancelled",  count: cancelledRes.total },
        ]);
        // sort by reviews desc as a proxy for popularity
        setTopProducts([...top.items].sort((a, b) => b.reviews - a.reviews).slice(0, 5));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const maxCatCount = Math.max(...categoryData.map((c) => c.count), 1);
  const maxStatusCount = Math.max(...statusData.map((s) => s.count), 1);

  const statusConfig = {
    processing: { icon: Clock,       cls: "text-yellow-600", bg: "bg-yellow-100" },
    shipped:    { icon: Truck,       cls: "text-blue-600",   bg: "bg-blue-100" },
    delivered:  { icon: CheckCircle, cls: "text-green-600",  bg: "bg-green-100" },
    cancelled:  { icon: XCircle,     cls: "text-red-500",    bg: "bg-red-100" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live data from your store</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={ShoppingCart} label="Total Orders"   value={totalOrders.toLocaleString()}   bg="bg-blue-50"   ic="text-blue-600" />
        <KpiCard icon={Package}      label="Total Products" value={totalProducts.toLocaleString()} bg="bg-amber-50"  ic="text-amber-600" />
        <KpiCard icon={Users}        label="Total Customers" value={totalCustomers.toLocaleString()} bg="bg-purple-50" ic="text-purple-600" />
      </div>

      {/* Orders by Status + Category bar chart side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingCart size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-800">Orders by Status</h2>
          </div>
          {totalOrders === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {statusData.map(({ status, count }) => {
                const cfg = statusConfig[status as keyof typeof statusConfig];
                const Icon = cfg.icon;
                const pct = Math.round((count / totalOrders) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded ${cfg.bg}`}>
                          <Icon size={12} className={cfg.cls} />
                        </span>
                        <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} <span className="text-xs text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#C9A84C] transition-all"
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Products by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-800">Products by Category</h2>
          </div>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No categories yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-36">
              {categoryData.map(({ name, count }) => {
                const height = Math.max((count / maxCatCount) * 100, 5);
                return (
                  <div key={name} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{count}</span>
                    <div className="w-full relative" style={{ height: 100 }}>
                      <div
                        className="absolute bottom-0 w-full bg-[#C9A84C] rounded-t-md transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 capitalize truncate w-full text-center">{name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Products by reviews */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top Products by Reviews</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">No products yet.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const maxReviews = topProducts[0].reviews || 1;
              return (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-gray-300">#{i + 1}</span>
                  {p.image && (
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{p.name}</p>
                      <span className="text-sm font-semibold text-gray-700 shrink-0 ml-2">₹{p.price}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-[#C9A84C]"
                        style={{ width: `${(p.reviews / maxReviews) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.category} · ⭐ {p.rating} · {p.reviews.toLocaleString()} reviews</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, bg, ic }: { icon: React.ElementType; label: string; value: string; bg: string; ic: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-lg shrink-0`}>
        <Icon size={20} className={ic} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
