"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, CreditCard, Loader2, ChevronLeft, ChevronRight,
  CheckCircle, Clock, RefreshCw, IndianRupee, Banknote,
} from "lucide-react";
import { orders as ordersApi, payments as paymentsApi, ApiError } from "@/lib/api";
import type { Order } from "@/lib/api";

type PayFilter = "all" | "online_paid" | "online_unpaid" | "cod";

const PAGE_SIZE = 20;

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [payFilter, setPayFilter] = useState<PayFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stats
  const [statsOnlinePaid, setStatsOnlinePaid] = useState(0);
  const [statsCod, setStatsCod] = useState(0);

  // Refund state
  const [refunding, setRefunding] = useState<string | null>(null);
  const [showRefund, setShowRefund] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundDone, setRefundDone] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ordersApi.list(page, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      // Stats — fetch totals in parallel (approximate; client-side)
      // We count from the full list page as an estimate
      const paid = res.items.filter((o) => o.isPaid && o.paymentMethod === "online").length;
      const cod = res.items.filter((o) => o.paymentMethod === "COD").length;
      setStatsOnlinePaid(paid);
      setStatsCod(cod);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = items.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress.name.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      payFilter === "all" ||
      (payFilter === "online_paid"   && o.paymentMethod === "online" && o.isPaid) ||
      (payFilter === "online_unpaid" && o.paymentMethod === "online" && !o.isPaid) ||
      (payFilter === "cod"           && o.paymentMethod === "COD");

    return matchSearch && matchFilter;
  });

  const handleRefund = async (order: Order) => {
    if (!order.razorpayPaymentId) return;
    setRefunding(order._id);
    try {
      const amount = refundAmount ? Number(refundAmount) : undefined;
      await paymentsApi.refund(order.razorpayPaymentId, amount);
      setRefundDone((prev) => new Set(prev).add(order._id));
      setShowRefund(null);
      setRefundAmount("");
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Refund failed");
    } finally {
      setRefunding(null);
    }
  };

  const filterTabs: { key: PayFilter; label: string }[] = [
    { key: "all",          label: "All" },
    { key: "online_paid",  label: "Online · Paid" },
    { key: "online_unpaid",label: "Online · Unpaid" },
    { key: "cod",          label: "COD" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500">Payment history and refund management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={CreditCard}    label="Online Paid (this page)"  value={statsOnlinePaid} bg="bg-green-50"  ic="text-green-600" />
        <StatCard icon={Banknote}      label="Cash on Delivery"          value={statsCod}        bg="bg-blue-50"   ic="text-blue-600" />
        <StatCard icon={IndianRupee}   label="Total Orders (this page)"  value={items.length}    bg="bg-amber-50"  ic="text-amber-600" />
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPayFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                payFilter === key
                  ? "bg-[#C9A84C] text-black"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer..."
            className="bg-transparent text-sm outline-none w-full text-gray-700"
          />
        </div>
      </div>

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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Payment ID</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const canRefund = o.isPaid && o.paymentMethod === "online" && !!o.razorpayPaymentId;
                  const alreadyRefunded = refundDone.has(o._id);
                  return (
                    <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800">{o.orderNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("en-IN")}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-700 hidden sm:table-cell">{o.shippingAddress.name}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800">₹{o.total.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          o.paymentMethod === "online"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {o.paymentMethod === "online"
                            ? <><CreditCard size={10} /> Online</>
                            : <><Banknote size={10} /> COD</>}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {o.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle size={11} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full">
                            <Clock size={11} /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        {o.razorpayPaymentId ? (
                          <span className="text-xs text-gray-500 font-mono">{o.razorpayPaymentId}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {alreadyRefunded ? (
                          <span className="text-xs text-green-600 font-medium">Refunded</span>
                        ) : showRefund === o._id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                              placeholder={`Max ₹${o.total}`}
                              className="w-24 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#C9A84C]"
                            />
                            <button
                              onClick={() => handleRefund(o)}
                              disabled={refunding === o._id}
                              className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-60"
                            >
                              {refunding === o._id ? <Loader2 size={11} className="animate-spin" /> : "Refund"}
                            </button>
                            <button
                              onClick={() => { setShowRefund(null); setRefundAmount(""); }}
                              className="text-xs text-gray-400 hover:text-gray-600 px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : canRefund ? (
                          <button
                            onClick={() => setShowRefund(o._id)}
                            className="inline-flex items-center gap-1 text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <RefreshCw size={11} /> Refund
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                      No payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
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

function StatCard({ icon: Icon, label, value, bg, ic }: {
  icon: React.ElementType; label: string; value: number; bg: string; ic: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-lg`}>
        <Icon size={20} className={ic} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
