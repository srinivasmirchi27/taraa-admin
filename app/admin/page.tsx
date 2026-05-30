"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Package, ShoppingCart, Users,
  ArrowUpRight, IndianRupee,
  Clock, CheckCircle, XCircle, Truck, Loader2,
} from "lucide-react";
import { products, orders, users, ApiError } from "@/lib/api";
import type { Order } from "@/lib/api";

const statusConfig: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  delivered:  { label: "Delivered",  icon: CheckCircle, cls: "bg-green-100 text-green-700" },
  shipped:    { label: "Shipped",    icon: Truck,        cls: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", icon: Clock,        cls: "bg-yellow-100 text-yellow-700" },
  cancelled:  { label: "Cancelled",  icon: XCircle,      cls: "bg-red-100 text-red-700" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalCustomers: 0, processing: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, orderRes, userRes, processingRes, catList] = await Promise.all([
          products.list({ page: 1, limit: 1 }),
          orders.list(1, 5),
          users.list(1, 1),
          orders.list(1, 1, "processing"),
          products.categories(),
        ]);
        setStats({
          totalProducts: prodRes.total,
          totalOrders: orderRes.total,
          totalCustomers: userRes.total,
          processing: processingRes.total,
        });
        setRecentOrders(orderRes.items);
        setCategories(catList);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load dashboard");
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
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>
    );
  }

  const statCards = [
    { label: "Total Revenue", value: "—", sub: "Connect payments", icon: IndianRupee, bg: "bg-amber-50", ic: "text-amber-600" },
    { label: "Total Orders",    value: stats.totalOrders.toLocaleString(),    sub: `${stats.processing} processing`, icon: ShoppingCart, bg: "bg-blue-50",   ic: "text-blue-600" },
    { label: "Total Products",  value: stats.totalProducts.toLocaleString(),  sub: `${categories.length} categories`, icon: Package,      bg: "bg-emerald-50", ic: "text-emerald-600" },
    { label: "Total Customers", value: stats.totalCustomers.toLocaleString(), sub: "Registered users", icon: Users, bg: "bg-purple-50", ic: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, Admin. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className={`${bg} p-2.5 rounded-lg`}>
                <Icon size={20} className={ic} />
              </div>
              <ArrowUpRight size={14} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-[#C9A84C] hover:underline font-medium">View all</a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const s = statusConfig[o.status] ?? statusConfig.processing;
                    const SIcon = s.icon;
                    return (
                      <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                        <td className="px-5 py-3 text-gray-600">{o.shippingAddress.name}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">₹{o.total.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                            <SIcon size={11} />{s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Product Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">No categories found.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{cat}</span>
                  <span className="text-xs text-[#C9A84C] font-medium px-2 py-0.5 bg-amber-50 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              <p className="text-sm text-gray-600">{categories.length} active categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
