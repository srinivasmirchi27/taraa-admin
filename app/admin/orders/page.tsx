"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Eye, Download,
  CheckCircle, XCircle, Clock, Truck, Package, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, IndianRupee,
} from "lucide-react";
import { orders as ordersApi, payments as paymentsApi, ApiError } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/api";

type StatusFilter = "all" | OrderStatus;

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; cls: string }> = {
  processing: { label: "Processing", icon: Clock,       cls: "bg-yellow-100 text-yellow-700" },
  shipped:    { label: "Shipped",    icon: Truck,       cls: "bg-blue-100 text-blue-700" },
  delivered:  { label: "Delivered",  icon: CheckCircle, cls: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelled",  icon: XCircle,     cls: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Refund state
  const [refunding, setRefunding] = useState(false);
  const [showRefundInput, setShowRefundInput] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundSuccess, setRefundSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ordersApi.list(
        page,
        PAGE_SIZE,
        statusFilter === "all" ? undefined : statusFilter,
      );
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredItems = search
    ? items.filter((o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.shippingAddress.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await ordersApi.updateStatus(orderId, status);
      setItems((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      setSelected(updated);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Status update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRefund = async () => {
    if (!selected?.razorpayPaymentId) return;
    setRefunding(true);
    try {
      const amount = refundAmount ? Number(refundAmount) : undefined;
      await paymentsApi.refund(selected.razorpayPaymentId, amount);
      setRefundSuccess(true);
      setShowRefundInput(false);
      setRefundAmount("");
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Refund failed");
    } finally {
      setRefunding(false);
    }
  };

  const exportCsv = () => {
    const header = ["Order No", "Customer", "Phone", "City", "State", "Pincode", "Amount", "Status", "Payment", "Paid", "Date"];
    const rows = items.map((o) => [
      o.orderNumber,
      o.shippingAddress.name,
      o.shippingAddress.phone,
      o.shippingAddress.city,
      o.shippingAddress.state,
      o.shippingAddress.pincode,
      o.total,
      o.status,
      o.paymentMethod,
      o.isPaid ? "Yes" : "No",
      new Date(o.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDrawer = (o: Order) => {
    setSelected(o);
    setShowRefundInput(false);
    setRefundAmount("");
    setRefundSuccess(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={items.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(["all", "processing", "shipped", "delivered", "cancelled"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-[#C9A84C] text-black"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer name..."
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Order ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((o) => {
                  const s = statusConfig[o.status];
                  const SIcon = s.icon;
                  return (
                    <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-800">{o.orderNumber}</td>
                      <td className="px-5 py-3 text-gray-700">{o.shippingAddress.name}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">₹{o.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{o.isPaid ? "Paid" : "Unpaid"} · {o.paymentMethod}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                          <SIcon size={11} />{s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => openDrawer(o)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Package size={32} className="mx-auto mb-2 text-gray-300" />
                      No orders found.
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
              Page {page} of {totalPages}
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

      {/* Order Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <InfoRow label="Customer" value={selected.shippingAddress.name} />
              <InfoRow label="Phone" value={selected.shippingAddress.phone} />
              <InfoRow label="Address" value={`${selected.shippingAddress.line1}, ${selected.shippingAddress.city}, ${selected.shippingAddress.state} - ${selected.shippingAddress.pincode}`} />
              <InfoRow label="Payment" value={`${selected.paymentMethod} · ${selected.isPaid ? "Paid" : "Unpaid"}`} />
              {selected.paidAt && <InfoRow label="Paid At" value={new Date(selected.paidAt).toLocaleString("en-IN")} />}
              <InfoRow label="Total" value={`₹${selected.total.toLocaleString()}`} />
              <InfoRow label="Date" value={new Date(selected.createdAt).toLocaleString("en-IN")} />

              <div>
                <p className="text-xs text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                      {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                {(() => {
                  const s = statusConfig[selected.status];
                  const SIcon = s.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${s.cls}`}>
                      <SIcon size={13} /> {s.label}
                    </span>
                  );
                })()}
              </div>

              {/* Status update */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
                    <button
                      key={s}
                      disabled={updatingStatus || selected.status === s}
                      onClick={() => handleStatusUpdate(selected._id, s)}
                      className="py-2 border border-gray-200 rounded-lg text-sm capitalize hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-40"
                    >
                      {updatingStatus ? <Loader2 size={14} className="animate-spin mx-auto" /> : `Mark ${s}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refund section — only for paid online orders */}
              {selected.isPaid && selected.paymentMethod === "online" && selected.razorpayPaymentId && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Refund</p>
                  {refundSuccess ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-3">
                      <CheckCircle size={16} /> Refund initiated successfully
                    </div>
                  ) : showRefundInput ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                        <IndianRupee size={14} className="text-gray-400" />
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder={`Leave empty for full refund (₹${selected.total})`}
                          className="bg-transparent text-sm outline-none w-full text-gray-700"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRefundInput(false)}
                          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRefund}
                          disabled={refunding}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {refunding && <Loader2 size={13} className="animate-spin" />}
                          {refunding ? "Processing…" : "Confirm Refund"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRefundInput(true)}
                      className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Initiate Refund
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Payment ID: {selected.razorpayPaymentId}
                  </p>
                </div>
              )}
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
