"use client";

import {
  TrendingUp, TrendingDown, BarChart3,
  IndianRupee, ShoppingCart, Users, Package,
} from "lucide-react";

const monthlyRevenue = [
  { month: "Jan", revenue: 12400, orders: 125 },
  { month: "Feb", revenue: 18900, orders: 191 },
  { month: "Mar", revenue: 22100, orders: 223 },
  { month: "Apr", revenue: 19800, orders: 200 },
  { month: "May", revenue: 31200, orders: 315 },
];

const topProducts = [
  { name: "Oxidised Silver Jhumka Earrings", sales: 412, revenue: "₹40,788" },
  { name: "Butterfly Pavé Crystal Ring", sales: 321, revenue: "₹31,779" },
  { name: "Pearl & Crystal Statement Necklace", sales: 289, revenue: "₹28,611" },
  { name: "Crystal Emerald Necklace Set", sales: 234, revenue: "₹23,166" },
  { name: "Tassel Drop Earrings", sales: 198, revenue: "₹19,602" },
];

const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sales and performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (May)", value: "₹31,200", change: "+58%", up: true, icon: IndianRupee },
          { label: "Orders (May)", value: "315", change: "+57%", up: true, icon: ShoppingCart },
          { label: "Avg Order Value", value: "₹99", change: "0%", up: true, icon: Package },
          { label: "New Customers", value: "1,234", change: "+12%", up: true, icon: Users },
        ].map(({ label, value, change, up, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <Icon size={18} className="text-gray-400" />
              <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {change}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-800">Monthly Revenue</h2>
        </div>
        <div className="flex items-end gap-4 h-40">
          {monthlyRevenue.map(({ month, revenue }) => {
            const height = (revenue / maxRevenue) * 100;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">₹{(revenue / 1000).toFixed(1)}k</span>
                <div className="w-full relative" style={{ height: 120 }}>
                  <div
                    className="absolute bottom-0 w-full bg-[#C9A84C] rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top Selling Products</h2>
        <div className="space-y-3">
          {topProducts.map(({ name, sales, revenue }, i) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-gray-300">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[240px]">{name}</p>
                  <span className="text-sm font-semibold text-gray-700">{revenue}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-[#C9A84C]"
                    style={{ width: `${(sales / topProducts[0].sales) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{sales} sales</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
