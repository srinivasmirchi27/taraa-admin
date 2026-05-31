"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Mail, Phone, MapPin, ShoppingBag,
  Users, UserCheck, UserX, Loader2, ChevronLeft, ChevronRight,
  Trash2, Shield, ShieldCheck,
} from "lucide-react";
import { users as usersApi, ApiError } from "@/lib/api";
import type { User, UserRole } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const PAGE_SIZE = 20;

const ROLES: UserRole[] = ["customer", "admin", "super_admin"];

export default function AdminCustomersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<User | null>(null);

  const [changingRole, setChangingRole] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usersApi.list(page, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeCount = items.filter((u) => u.isActive).length;

  const filtered = search
    ? items.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone ?? "").includes(search)
      )
    : items;

  const handleRoleChange = async (role: UserRole) => {
    if (!selected) return;
    setChangingRole(true);
    try {
      const updated = await usersApi.updateRole(selected._id, role);
      setItems((prev) => prev.map((u) => (u._id === selected._id ? updated : u)));
      setSelected(updated);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Role update failed");
    } finally {
      setChangingRole(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await usersApi.delete(selected._id);
      setItems((prev) => prev.filter((u) => u._id !== selected._id));
      setTotal((t) => t - 1);
      setSelected(null);
      setDeleteConfirm(false);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openDrawer = (u: User) => {
    setSelected(u);
    setDeleteConfirm(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">{total} registered customers</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users}      label="Total Customers"  value={String(total)}       bg="bg-blue-50"   ic="text-blue-600" />
        <StatCard icon={UserCheck}  label="Active This Page" value={String(activeCount)} bg="bg-green-50"  ic="text-green-600" />
        <StatCard icon={ShoppingBag} label="Page"           value={`${page} / ${Math.max(totalPages, 1)}`} bg="bg-amber-50" ic="text-amber-600" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell text-xs">{u.email}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Phone size={11} /> {u.phone ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                        u.role === "super_admin" ? "bg-purple-100 text-purple-700" :
                        u.role === "admin"       ? "bg-blue-100 text-blue-700" :
                                                   "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                          <UserCheck size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                          <UserX size={11} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openDrawer(u)}
                        className="text-xs text-[#C9A84C] hover:underline font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />
                      No customers found.
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

      {/* Customer Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Customer Profile</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Avatar */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{selected.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                  selected.role === "super_admin" ? "bg-purple-100 text-purple-700" :
                  selected.role === "admin"       ? "bg-blue-100 text-blue-700" :
                                                     "bg-gray-100 text-gray-600"
                }`}>
                  {selected.role.replace("_", " ")}
                </span>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={15} className="text-gray-400 shrink-0" />
                  {selected.email}
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={15} className="text-gray-400 shrink-0" />
                    {selected.phone}
                  </div>
                )}
                {selected.address && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin size={15} className="text-gray-400 shrink-0" />
                    {selected.address}
                  </div>
                )}
              </div>

              {/* Account info */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <InfoRow label="Joined"         value={new Date(selected.createdAt).toLocaleDateString("en-IN")} />
                <InfoRow label="Phone Verified" value={selected.phoneVerified ? "Yes" : "No"} />
                <InfoRow label="Account Status" value={selected.isActive ? "Active" : "Inactive"} />
              </div>

              {/* Role management — super_admin only */}
              {isSuperAdmin && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-purple-500" />
                    <p className="text-sm font-medium text-gray-700">Role Management</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        disabled={changingRole || selected.role === role}
                        onClick={() => handleRoleChange(role)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium border transition-colors capitalize disabled:opacity-40 ${
                          selected.role === role
                            ? role === "super_admin" ? "bg-purple-100 text-purple-700 border-purple-200"
                            : role === "admin"       ? "bg-blue-100 text-blue-700 border-blue-200"
                                                     : "bg-gray-100 text-gray-600 border-gray-200"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {changingRole
                          ? <Loader2 size={13} className="animate-spin mx-auto" />
                          : role.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                    <ShieldCheck size={12} />
                    <span>Currently: <span className="font-medium capitalize">{selected.role.replace("_", " ")}</span></span>
                  </div>
                </div>
              )}

              {/* Delete user — super_admin only */}
              {isSuperAdmin && (
                <div className="pt-4 border-t border-gray-100">
                  {deleteConfirm ? (
                    <div className="space-y-3">
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <p className="text-sm font-semibold text-red-700 mb-1">Permanently delete?</p>
                        <p className="text-xs text-red-500">This cannot be undone. All data for <span className="font-medium">{selected.name}</span> will be removed.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {deleting && <Loader2 size={13} className="animate-spin" />}
                          {deleting ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Delete User
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, bg, ic }: { icon: React.ElementType; label: string; value: string; bg: string; ic: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-lg`}>
        <Icon size={20} className={ic} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
