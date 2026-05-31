"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronDown, Loader2, Send, X, ChevronLeft, ChevronRight, User, Shield,
  RefreshCw, Tag,
} from "lucide-react";
import { support as supportApi, ApiError } from "@/lib/api";
import type {
  SupportTicket, SupportStats, TicketStatus, TicketPriority, TicketCategory,
  SupportTicketFilters, ReplyTicketDto, UpdateTicketDto,
} from "@/lib/api";

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { key: TicketStatus | ""; label: string; color: string }[] = [
  { key: "",            label: "All Statuses",  color: "bg-gray-100 text-gray-600"   },
  { key: "open",        label: "Open",          color: "bg-blue-100 text-blue-700"   },
  { key: "in_progress", label: "In Progress",   color: "bg-amber-100 text-amber-700" },
  { key: "resolved",    label: "Resolved",      color: "bg-green-100 text-green-700" },
  { key: "closed",      label: "Closed",        color: "bg-gray-100 text-gray-500"   },
];

const PRIORITY_OPTIONS: { key: TicketPriority | ""; label: string }[] = [
  { key: "",       label: "All Priorities" },
  { key: "high",   label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low",    label: "Low"   },
];

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: "Order", payment: "Payment", product: "Product",
  shipping: "Shipping", return: "Return", other: "Other",
};

const statusIcon: Record<TicketStatus, React.ElementType> = {
  open: Clock, in_progress: AlertCircle, resolved: CheckCircle, closed: XCircle,
};

const statusColor: Record<TicketStatus, string> = {
  open:        "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-green-100 text-green-700",
  closed:      "bg-gray-100 text-gray-500",
};

const priorityColor: Record<TicketPriority, string> = {
  high:   "text-red-600 bg-red-50",
  medium: "text-amber-600 bg-amber-50",
  low:    "text-gray-500 bg-gray-50",
};

// ─── Stats Widget ──────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: SupportStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Open",        value: stats.byStatus.open,        color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "In Progress", value: stats.byStatus.in_progress, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Resolved",    value: stats.byStatus.resolved,    color: "text-green-600", bg: "bg-green-50" },
        { label: "Total",       value: stats.total,                color: "text-gray-700",  bg: "bg-gray-50"  },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`${bg} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Thread Modal ──────────────────────────────────────────────────────────────

function ThreadModal({ ticket, onClose, onUpdated }: {
  ticket: SupportTicket;
  onClose: () => void;
  onUpdated: (t: SupportTicket) => void;
}) {
  const [reply, setReply]         = useState("");
  const [sending, setSending]     = useState(false);
  const [replyError, setReplyError] = useState("");
  const [updating, setUpdating]   = useState(false);

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setReplyError("");
    try {
      const res = await supportApi.reply(ticket._id, { message: reply.trim() } as ReplyTicketDto);
      onUpdated(res);
      setReply("");
    } catch (err) {
      setReplyError(err instanceof ApiError ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async (data: UpdateTicketDto) => {
    setUpdating(true);
    try {
      const res = await supportApi.update(ticket._id, data);
      onUpdated(res);
    } catch {
      /* silently ignore — ticket state already valid */
    } finally {
      setUpdating(false);
    }
  };

  const isClosed = ticket.status === "closed";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-gray-400">{ticket.ticketNumber}</span>
              {ticket.orderNumber && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{ticket.orderNumber}</span>}
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{CATEGORY_LABELS[ticket.category]}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${priorityColor[ticket.priority]}`}>{ticket.priority}</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{ticket.subject}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {ticket.userId ? `${ticket.userId.name} (${ticket.userId.email})` : ticket.guestEmail ?? "Guest"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Status + priority controls */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <select
            value={ticket.status}
            disabled={updating}
            onChange={(e) => handleUpdate({ status: e.target.value as TicketStatus })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#C9A84C]"
          >
            {STATUS_OPTIONS.filter(o => o.key !== "").map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 font-medium ml-2">Priority:</span>
          <select
            value={ticket.priority}
            disabled={updating}
            onChange={(e) => handleUpdate({ priority: e.target.value as TicketPriority })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#C9A84C]"
          >
            {PRIORITY_OPTIONS.filter(o => o.key !== "").map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {updating && <Loader2 size={13} className="animate-spin text-[#C9A84C] ml-1" />}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Original message */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={11} className="text-gray-500" />
              </div>
              <p className="text-xs font-semibold text-gray-700">
                {ticket.userId?.name ?? ticket.guestName ?? "Customer"}
              </p>
              <p className="text-xs text-gray-400 ml-auto">
                {new Date(ticket.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{ticket.message}</p>
          </div>

          {/* Replies */}
          {ticket.replies.map((r) => (
            <div key={r._id} className={`rounded-xl p-4 ${r.sentBy === "admin" ? "bg-amber-50 border border-amber-100 ml-4" : "bg-white border border-gray-100"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${r.sentBy === "admin" ? "bg-[#C9A84C]/20" : "bg-gray-100"}`}>
                  {r.sentBy === "admin" ? <Shield size={11} className="text-[#C9A84C]" /> : <User size={11} className="text-gray-500" />}
                </div>
                <p className="text-xs font-semibold text-gray-700">{r.senderName}</p>
                {r.sentBy === "admin" && <span className="text-[10px] text-[#C9A84C] font-medium">Admin</span>}
                <p className="text-xs text-gray-400 ml-auto">
                  {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{r.message}</p>
            </div>
          ))}
        </div>

        {/* Reply box */}
        {!isClosed ? (
          <form onSubmit={handleReply} className="p-4 border-t border-gray-100">
            {replyError && <p className="text-xs text-red-500 mb-2">{replyError}</p>}
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply as admin..."
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-amber-100 resize-none"
              />
              <button type="submit" disabled={sending || !reply.trim()} className="px-4 py-2 bg-[#C9A84C] text-white rounded-xl text-sm font-semibold hover:bg-[#b8963f] transition-colors disabled:opacity-60 flex items-center gap-1.5 self-end">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "…" : "Reply"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">This ticket is closed. Update status to re-open.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [tickets, setTickets]     = useState<SupportTicket[]>([]);
  const [stats, setStats]         = useState<SupportStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected]   = useState<SupportTicket | null>(null);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters]     = useState<{ status: TicketStatus | ""; priority: TicketPriority | "" }>({ status: "", priority: "" });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const f: SupportTicketFilters = {
        page: p, limit: 20,
        ...(filters.status   ? { status:   filters.status   } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(search           ? { search }                     : {}),
      };
      const res = await supportApi.list(f);
      setTickets(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages ?? Math.ceil(res.total / 20));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  const loadStats = useCallback(async () => {
    try {
      const res = await supportApi.stats();
      setStats(res);
    } catch { /* stats are informational */ }
  }, []);

  useEffect(() => { load(page); }, [load, page]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTicketUpdated = (updated: SupportTicket) => {
    setSelected(updated);
    setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    loadStats();
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? "Loading…" : `${total} ticket${total !== 1 ? "s" : ""}`}</p>
        </div>
        <button onClick={() => { load(page); loadStats(); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#C9A84C] border border-gray-200 px-3 py-2 rounded-lg transition-colors">
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ticket#, order#, email…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963f] transition-colors">
            Search
          </button>
        </form>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value as TicketStatus | "" })); setPage(1); }}
            className="appearance-none pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#C9A84C]"
          >
            {STATUS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Priority filter */}
        <div className="relative">
          <select
            value={filters.priority}
            onChange={(e) => { setFilters((f) => ({ ...f, priority: e.target.value as TicketPriority | "" })); setPage(1); }}
            className="appearance-none pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#C9A84C]"
          >
            {PRIORITY_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {(filters.status || filters.priority || search) && (
          <button onClick={() => { setFilters({ status: "", priority: "" }); setSearch(""); setSearchInput(""); setPage(1); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
            <X size={12} />Clear
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}

      {/* Ticket list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={40} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No tickets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Ticket</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Replies</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const SIcon = statusIcon[ticket.status];
                  return (
                    <tr
                      key={ticket._id}
                      onClick={() => setSelected(ticket)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-bold text-gray-500">{ticket.ticketNumber}</p>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-xs">{ticket.subject}</p>
                        {ticket.orderNumber && <p className="text-[10px] text-amber-600 mt-0.5">{ticket.orderNumber}</p>}
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {ticket.userId?.name ?? ticket.guestName ?? <span className="text-gray-400 italic">Guest</span>}
                        {ticket.userId?.email && <p className="text-gray-400">{ticket.userId.email}</p>}
                        {ticket.guestEmail && !ticket.userId && <p className="text-gray-400">{ticket.guestEmail}</p>}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                          <Tag size={9} />{CATEGORY_LABELS[ticket.category]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${priorityColor[ticket.priority]}`}>{ticket.priority}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[ticket.status]}`}>
                          <SIcon size={10} />{STATUS_OPTIONS.find(o => o.key === ticket.status)?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{ticket.replies.length}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Thread modal */}
      {selected && (
        <ThreadModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleTicketUpdated}
        />
      )}
    </div>
  );
}
