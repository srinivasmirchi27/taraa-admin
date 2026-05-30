"use client";

import { useState } from "react";
import {
  TrendingUp, Package, ShoppingCart, Users,
  ArrowUpRight, ArrowDownRight, IndianRupee,
  Clock, CheckCircle, XCircle, Truck,
} from "lucide-react";
import { products } from "../data/products";

const stats = [
  {
    label: "Total Revenue",
    value: "₹2,45,890",
    change: "+18.2%",
    up: true,
    icon: IndianRupee,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Total Orders",
    value: "1,042",
    change: "+12.5%",
    up: true,
    icon: ShoppingCart,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Total Products",
    value: String(products.length),
    change: "+3 this week",
    up: true,
    icon: Package,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Total Customers",
    value: "8,734",
    change: "+5.1%",
    up: true,
    icon: Users,
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

const recentOrders = [
  { id: "#1042", customer: "Priya Sharma", product: "Crystal Necklace Set", amount: "₹99", status: "delivered" },
  { id: "#1041", customer: "Anjali Verma", product: "Gold Pearl Earrings", amount: "₹99", status: "shipped" },
  { id: "#1040", customer: "Meera Iyer", product: "Butterfly Ring", amount: "₹99", status: "processing" },
  { id: "#1039", customer: "Sunita Rao", product: "Bangle Bracelet", amount: "₹99", status: "delivered" },
  { id: "#1038", customer: "Kavya Nair", product: "Kundan Necklace", amount: "₹99", status: "cancelled" },
];

const statusConfig: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  delivered:  { label: "Delivered",  icon: CheckCircle, cls: "bg-green-100 text-green-700" },
  shipped:    { label: "Shipped",    icon: Truck,        cls: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", icon: Clock,        cls: "bg-yellow-100 text-yellow-700" },
  cancelled:  { label: "Cancelled",  icon: XCircle,      cls: "bg-red-100 text-red-700" },
};

const categoryBreakdown = [
  { name: "Necklaces", count: 6, pct: 27 },
  { name: "Earrings",  count: 6, pct: 27 },
  { name: "Rings",     count: 5, pct: 23 },
  { name: "Bracelets", count: 4, pct: 18 },
  { name: "Anklets",   count: 1, pct: 5 },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Admin. Here's what's happening.</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p ? "bg-[#C9A84C] text-black" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, up, icon: Icon, bg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className={`${bg} p-2.5 rounded-lg`}>
                <Icon size={20} className={iconColor} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
                {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const s = statusConfig[o.status];
                  const SIcon = s.icon;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{o.id}</td>
                      <td className="px-5 py-3 text-gray-600">{o.customer}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell truncate max-w-[160px]">{o.product}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{o.amount}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                          <SIcon size={11} />
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Products by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map(({ name, count, pct }) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-gray-400">{count} items</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#C9A84C]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{pct}% of catalog</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Earrings</span> trending this week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Package size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Low Stock Alert</p>
            <p className="text-sm text-amber-700 mt-0.5">
              3 products are running low on stock. <a href="/admin/products" className="underline font-medium">Review inventory →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
