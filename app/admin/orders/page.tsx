"use client";

import { useState } from "react";
import {
  Search, Filter, Eye, Download,
  CheckCircle, XCircle, Clock, Truck, Package,
} from "lucide-react";

type Status = "all" | "processing" | "shipped" | "delivered" | "cancelled";

const mockOrders = Array.from({ length: 30 }, (_, i) => {
  const statuses: Array<"processing" | "shipped" | "delivered" | "cancelled"> = [
    "delivered", "shipped", "processing", "cancelled",
  ];
  const products = [
    "Crystal Emerald Necklace Set",
    "Gold Plated Pearl Earrings",
    "Butterfly Pavé Crystal Ring",
    "Multilayer Gold Bangle Bracelet",
    "Kundan Polki Statement Necklace",
    "Oxidised Silver Jhumka Earrings",
  ];
  const customers = [
    "Priya Sharma", "Anjali Verma", "Meera Iyer",
    "Sunita Rao", "Kavya Nair", "Riya Patel",
    "Deepa Menon", "Aisha Khan", "Nidhi Gupta",
  ];
  const days = ["May 28", "May 27", "May 26", "May 25", "May 24"];
  return {
    id: `#${1042 - i}`,
    customer: customers[i % customers.length],
    product: products[i % products.length],
    amount: "₹99",
    status: statuses[i % statuses.length],
    date: days[i % days.length],
    address: "Mumbai, Maharashtra",
  };
});

const statusConfig = {
  processing: { label: "Processing", icon: Clock,        cls: "bg-yellow-100 text-yellow-700" },
  shipped:    { label: "Shipped",    icon: Truck,        cls: "bg-blue-100 text-blue-700" },
  delivered:  { label: "Delivered",  icon: CheckCircle,  cls: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelled",  icon: XCircle,      cls: "bg-red-100 text-red-700" },
};

const statusCounts = {
  all: mockOrders.length,
  processing: mockOrders.filter((o) => o.status === "processing").length,
  shipped: mockOrders.filter((o) => o.status === "shipped").length,
  delivered: mockOrders.filter((o) => o.status === "delivered").length,
  cancelled: mockOrders.filter((o) => o.status === "cancelled").length,
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = mockOrders.filter((o) => {
    const matchStatus = status === "all" || o.status === status;
    const matchSearch =
      o.id.includes(search) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.product.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const selectedOrder = mockOrders.find((o) => o.id === selected);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{mockOrders.length} total orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(Object.entries(statusCounts) as [Status, number][]).map(([s, count]) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              status === s
                ? "bg-[#C9A84C] text-black"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : s} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer, or product..."
            className="bg-transparent text-sm outline-none w-full text-gray-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const s = statusConfig[o.status];
                const SIcon = s.icon;
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-800">{o.id}</td>
                    <td className="px-5 py-3 text-gray-700">{o.customer}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell max-w-[180px] truncate">{o.product}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">{o.date}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{o.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                        <SIcon size={11} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(o.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selected && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Order {selectedOrder.id}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <InfoRow label="Customer" value={selectedOrder.customer} />
              <InfoRow label="Product" value={selectedOrder.product} />
              <InfoRow label="Amount" value={selectedOrder.amount} />
              <InfoRow label="Date" value={selectedOrder.date} />
              <InfoRow label="Delivery Address" value={selectedOrder.address} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                {(() => {
                  const s = statusConfig[selectedOrder.status];
                  const SIcon = s.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${s.cls}`}>
                      <SIcon size={13} /> {s.label}
                    </span>
                  );
                })()}
              </div>

              {/* Update Status */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["processing", "shipped", "delivered", "cancelled"] as const).map((s) => (
                    <button
                      key={s}
                      className="py-2 border border-gray-200 rounded-lg text-sm capitalize hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
