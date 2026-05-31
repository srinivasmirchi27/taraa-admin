"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import {
  Crown, Shield, ShieldCheck, User, Search, Plus, Edit2, Trash2,
  CheckCircle, XCircle, Loader2, AlertTriangle, Mail, Phone,
  ChevronRight, Save, X, Lock,
} from "lucide-react";
import { users as usersApi, ApiError } from "@/lib/api";
import type { User as UserType, UserRole } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// ─── Permission catalogue ─────────────────────────────────────────────────────

const PERM_GROUPS = [
  {
    group: "Customer Access",
    perms: ["Browse products & categories", "Place & track orders", "Manage own profile"],
  },
  {
    group: "Dashboard & Analytics",
    perms: ["View admin dashboard", "View analytics"],
  },
  {
    group: "Product & Inventory",
    perms: ["Manage products (CRUD)", "Manage categories", "Manage inventory stock", "Upload images (Cloudinary)"],
  },
  {
    group: "Orders & Payments",
    perms: ["View & update all orders", "Initiate payment refunds"],
  },
  {
    group: "User Management",
    perms: ["View customers list", "Assign / change user roles", "Delete users", "Promote users to admin"],
  },
];

const ALL_PERMS = PERM_GROUPS.flatMap((g) => g.perms);

// ─── Role type ────────────────────────────────────────────────────────────────

type RoleDef = {
  id: string;
  label: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  color: "gray" | "blue" | "purple" | "green" | "orange" | "red";
};

const COLOR_OPTIONS: RoleDef["color"][] = ["gray", "blue", "purple", "green", "orange", "red"];

const colorCls: Record<RoleDef["color"], { bg: string; text: string; border: string; badge: string }> = {
  gray:   { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200",  badge: "bg-gray-100 text-gray-700" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200",badge: "bg-purple-100 text-purple-700" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200", badge: "bg-green-100 text-green-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200",badge: "bg-orange-100 text-orange-700" },
  red:    { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200",   badge: "bg-red-100 text-red-700" },
};

const roleIcon: Record<RoleDef["color"], React.ElementType> = {
  gray: User, blue: Shield, purple: Crown,
  green: ShieldCheck, orange: Shield, red: Shield,
};

// ─── Default system roles ─────────────────────────────────────────────────────

const SYSTEM_ROLES: RoleDef[] = [
  {
    id: "customer",
    label: "Customer",
    description: "Regular shoppers. Can browse, order, and manage their own account.",
    permissions: ["Browse products & categories", "Place & track orders", "Manage own profile"],
    isSystem: true,
    color: "gray",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Store managers. Full product, order, and category management access.",
    permissions: [
      "Browse products & categories", "Place & track orders", "Manage own profile",
      "View admin dashboard", "View analytics",
      "Manage products (CRUD)", "Manage categories", "Manage inventory stock", "Upload images (Cloudinary)",
      "View & update all orders", "Initiate payment refunds", "View customers list",
    ],
    isSystem: true,
    color: "blue",
  },
  {
    id: "super_admin",
    label: "Super Admin",
    description: "Full system access including user role management and deletions.",
    permissions: ALL_PERMS,
    isSystem: true,
    color: "purple",
  },
];

const STORAGE_KEY = "taraa_roles_v1";

function loadRoles(): RoleDef[] {
  if (typeof window === "undefined") return SYSTEM_ROLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SYSTEM_ROLES;
    const saved: RoleDef[] = JSON.parse(raw);
    // Merge: update system roles with saved edits, keep custom roles
    return saved;
  } catch {
    return SYSTEM_ROLES;
  }
}

function saveRoles(roles: RoleDef[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}

// ─── Blank draft ──────────────────────────────────────────────────────────────

function blankDraft(): RoleDef {
  return {
    id: `role_${Date.now()}`,
    label: "",
    description: "",
    permissions: [],
    isSystem: false,
    color: "green",
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "roles" | "assign";

export default function RolesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [tab, setTab] = useState<Tab>("roles");
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  // Modal state
  const [editTarget, setEditTarget] = useState<RoleDef | null>(null); // null = closed
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<RoleDef>(blankDraft());
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<RoleDef | null>(null);

  // Assign tab
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [picked, setPicked] = useState<UserType | null>(null);
  const [targetRole, setTargetRole] = useState<"admin" | "super_admin">("admin");
  const [promoting, setPromoting] = useState(false);
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());

  // Load roles from localStorage
  useEffect(() => {
    setRoles(loadRoles());
  }, []);

  // Load user counts
  useEffect(() => {
    usersApi.list(1, 100).then((res) => {
      const counts: Record<string, number> = {};
      res.items.forEach((u) => { counts[u.role] = (counts[u.role] ?? 0) + 1; });
      setUserCounts(counts);
    }).catch(() => {});
  }, []);

  // Load customers for assign tab
  useEffect(() => {
    if (tab !== "assign" || !isSuperAdmin) return;
    setLoadingCustomers(true);
    usersApi.list(1, 100)
      .then((res) => setCustomers(res.items.filter((u) => u.role === "customer")))
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
  }, [tab, isSuperAdmin]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    const d = blankDraft();
    setDraft(d);
    setIsNew(true);
    setEditTarget(d);
  };

  const openEdit = (role: RoleDef) => {
    setDraft({ ...role });
    setIsNew(false);
    setEditTarget(role);
  };

  const closeModal = () => {
    setEditTarget(null);
    setSaving(false);
  };

  const handleSave = () => {
    if (!draft.label.trim()) return;
    setSaving(true);
    const updated = isNew
      ? [...roles, draft]
      : roles.map((r) => (r.id === draft.id ? draft : r));
    setRoles(updated);
    saveRoles(updated);
    setSaving(false);
    closeModal();
  };

  const handleDelete = (role: RoleDef) => {
    const updated = roles.filter((r) => r.id !== role.id);
    setRoles(updated);
    saveRoles(updated);
    setDeleteTarget(null);
  };

  const togglePerm = (perm: string) => {
    setDraft((d) => ({
      ...d,
      permissions: d.permissions.includes(perm)
        ? d.permissions.filter((p) => p !== perm)
        : [...d.permissions, perm],
    }));
  };

  const selectAllInGroup = (perms: string[]) => {
    const allSelected = perms.every((p) => draft.permissions.includes(p));
    setDraft((d) => ({
      ...d,
      permissions: allSelected
        ? d.permissions.filter((p) => !perms.includes(p))
        : [...new Set([...d.permissions, ...perms])],
    }));
  };

  // ── Assign handlers ────────────────────────────────────────────────────────

  const handlePromote = async () => {
    if (!picked) return;
    setPromoting(true);
    try {
      await usersApi.updateRole(picked._id, targetRole as UserRole);
      setPromotedIds((prev) => new Set(prev).add(picked._id));
      setCustomers((prev) => prev.filter((u) => u._id !== picked._id));
      setUserCounts((prev) => ({
        ...prev,
        customer: Math.max(0, (prev.customer ?? 1) - 1),
        [targetRole]: (prev[targetRole] ?? 0) + 1,
      }));
      setPicked(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Promotion failed");
    } finally {
      setPromoting(false);
    }
  };

  const filteredCustomers = customers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? "").includes(q);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500">{roles.length} roles · {Object.values(userCounts).reduce((a, b) => a + b, 0)} users</p>
        </div>
        {tab === "roles" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={15} /> Create Role
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: "roles" as Tab, label: "Manage Roles" },
          { key: "assign" as Tab, label: "Assign Role" },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Roles tab ── */}
      {tab === "roles" && (
        <div className="space-y-4">
          {/* Role cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((role) => {
              const cls = colorCls[role.color];
              const Icon = roleIcon[role.color];
              const count = userCounts[role.id] ?? 0;
              return (
                <div key={role.id} className={`bg-white rounded-xl border ${cls.border} p-5 flex flex-col gap-4`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`${cls.bg} p-2.5 rounded-lg shrink-0`}>
                        <Icon size={18} className={cls.text} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-800">{role.label}</p>
                          {role.isSystem && (
                            <span title="System role"><Lock size={11} className="text-gray-400" /></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{role.permissions.length} permissions</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${cls.badge}`}>
                      {count} user{count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed">{role.description || "No description."}</p>

                  {/* Permission preview */}
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 4).map((p) => (
                      <span key={p} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                    {role.permissions.length > 4 && (
                      <span className="text-xs text-gray-400 px-2 py-0.5">
                        +{role.permissions.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => openEdit(role)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      disabled={role.isSystem}
                      onClick={() => setDeleteTarget(role)}
                      title={role.isSystem ? "System roles cannot be deleted" : "Delete role"}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permission matrix */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">Permission Matrix</h2>
              <p className="text-xs text-gray-400 mt-0.5">Full view across all roles</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Permission</th>
                    {roles.map((role) => {
                      const cls = colorCls[role.color];
                      const Icon = roleIcon[role.color];
                      return (
                        <th key={role.id} className="px-3 py-3 text-center min-w-[90px]">
                          <div className="flex flex-col items-center gap-1">
                            <Icon size={13} className={cls.text} />
                            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{role.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PERM_GROUPS.map(({ group, perms }) => (
                    <Fragment key={group}>
                      <tr className="bg-gray-50 border-t border-gray-100">
                        <td colSpan={roles.length + 1} className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {group}
                        </td>
                      </tr>
                      {perms.map((perm, i) => (
                        <tr key={perm} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                          <td className="px-5 py-2.5 text-sm text-gray-700">{perm}</td>
                          {roles.map((role) => (
                            <td key={role.id} className="px-3 py-2.5 text-center">
                              {role.permissions.includes(perm)
                                ? <CheckCircle size={15} className="text-green-500 mx-auto" />
                                : <XCircle    size={15} className="text-gray-200 mx-auto" />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign tab ── */}
      {tab === "assign" && (
        !isSuperAdmin ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <ShieldCheck size={28} className="text-amber-400" />
            </div>
            <p className="text-lg font-semibold text-gray-800">Super Admin Access Required</p>
            <p className="text-sm text-gray-500 max-w-sm">Only super_admins can assign roles to users.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Customer list */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-800 mb-3">Select a Customer to Promote</h2>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                    <Search size={14} className="text-gray-400" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email or phone…"
                      className="bg-transparent text-sm outline-none w-full text-gray-700" />
                  </div>
                </div>
                {loadingCustomers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={22} className="animate-spin text-[#C9A84C]" />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    <User size={28} className="mx-auto mb-2 text-gray-300" />
                    {searchQuery ? "No customers match." : "No customers to promote."}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[460px] overflow-y-auto">
                    {filteredCustomers.map((u) => {
                      const isPromoted = promotedIds.has(u._id);
                      const isSelected = picked?._id === u._id;
                      return (
                        <button key={u._id} onClick={() => setPicked(isSelected ? null : u)} disabled={isPromoted}
                          className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                            isSelected ? "bg-amber-50 border-l-2 border-[#C9A84C]"
                            : isPromoted ? "opacity-50 cursor-default" : "hover:bg-gray-50"
                          }`}>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                                <Mail size={10} /> {u.email}
                              </span>
                              {u.phone && (
                                <span className="flex items-center gap-1 text-xs text-gray-400 hidden sm:flex shrink-0">
                                  <Phone size={10} /> {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          {isPromoted
                            ? <span className="text-xs text-green-600 font-medium shrink-0">Promoted</span>
                            : isSelected ? <ChevronRight size={15} className="text-[#C9A84C] shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Role assignment panel */}
            <div className="lg:col-span-2">
              {picked ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 sticky top-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {picked.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{picked.name}</p>
                      <p className="text-xs text-gray-400 truncate">{picked.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Promote to</p>
                    {(["admin", "super_admin"] as const).map((role) => {
                      const r = roles.find((r) => r.id === role);
                      if (!r) return null;
                      const cls = colorCls[r.color];
                      const Icon = roleIcon[r.color];
                      return (
                        <button key={role} onClick={() => setTargetRole(role)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                            targetRole === role ? `${cls.border} ${cls.bg}` : "border-gray-100 hover:border-gray-200"
                          }`}>
                          <div className={`${cls.bg} p-2 rounded-lg shrink-0`}>
                            <Icon size={16} className={cls.text} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${targetRole === role ? cls.text : "text-gray-700"}`}>{r.label}</p>
                            <p className="text-xs text-gray-400 leading-tight mt-0.5">{r.description}</p>
                          </div>
                          {targetRole === role && <CheckCircle size={15} className={`${cls.text} shrink-0`} />}
                        </button>
                      );
                    })}
                  </div>

                  {targetRole === "super_admin" && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      Grants full system access including the ability to delete users and change all roles.
                    </div>
                  )}

                  <button onClick={handlePromote} disabled={promoting}
                    className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {promoting && <Loader2 size={14} className="animate-spin" />}
                    {promoting ? "Promoting…" : `Promote to ${roles.find((r) => r.id === targetRole)?.label ?? targetRole}`}
                  </button>
                  <button onClick={() => setPicked(null)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center space-y-2">
                  <ShieldCheck size={28} className="mx-auto text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">Select a customer</p>
                  <p className="text-xs text-gray-400">Pick a customer from the list to assign a role</p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Create / Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {isNew ? "Create Role" : `Edit Role — ${editTarget.label}`}
                </h2>
                {draft.isSystem && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                    <Lock size={11} /> System role — changes are saved locally
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name + Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Name *</label>
                  <input
                    value={draft.label}
                    onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                    placeholder="e.g. Moderator"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {COLOR_OPTIONS.map((c) => {
                      const cls = colorCls[c];
                      return (
                        <button key={c} onClick={() => setDraft((d) => ({ ...d, color: c }))}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${cls.bg} ${
                            draft.color === c ? `${cls.border} scale-110 ring-2 ring-offset-1 ring-gray-300` : "border-transparent"
                          }`}
                          title={c}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={2}
                  placeholder="What can this role do?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 resize-none"
                />
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Permissions</label>
                  <div className="flex gap-2">
                    <button onClick={() => setDraft((d) => ({ ...d, permissions: ALL_PERMS }))}
                      className="text-xs text-[#C9A84C] hover:underline">Select all</button>
                    <span className="text-gray-300">·</span>
                    <button onClick={() => setDraft((d) => ({ ...d, permissions: [] }))}
                      className="text-xs text-gray-400 hover:underline">Clear all</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {PERM_GROUPS.map(({ group, perms }) => {
                    const allSelected = perms.every((p) => draft.permissions.includes(p));
                    const someSelected = perms.some((p) => draft.permissions.includes(p));
                    return (
                      <div key={group} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => selectAllInGroup(perms)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{group}</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            allSelected ? "bg-[#C9A84C] border-[#C9A84C]"
                            : someSelected ? "bg-[#C9A84C]/30 border-[#C9A84C]/50"
                            : "border-gray-300"
                          }`}>
                            {allSelected && <CheckCircle size={12} className="text-black" />}
                          </div>
                        </button>
                        <div className="divide-y divide-gray-50">
                          {perms.map((perm) => {
                            const checked = draft.permissions.includes(perm);
                            return (
                              <label key={perm} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePerm(perm)}
                                  className="w-4 h-4 accent-[#C9A84C] shrink-0"
                                />
                                <span className="text-sm text-gray-700">{perm}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100 shrink-0">
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!draft.label.trim() || saving}
                className="flex-1 py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-black rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : isNew ? "Create Role" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Delete "{deleteTarget.label}"?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This role will be removed from the panel. Users with this role on the backend are unaffected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
