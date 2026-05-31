"use client";

import { useState, useEffect } from "react";
import {
  Shield, ShieldCheck, Users, UserCheck, Mail, Phone,
  Loader2, AlertTriangle,
} from "lucide-react";
import { users as usersApi, ApiError } from "@/lib/api";
import type { User, UserRole } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const ROLES: UserRole[] = ["customer", "admin", "super_admin"];

const roleStyle: Record<UserRole, string> = {
  customer:    "bg-gray-100 text-gray-600",
  admin:       "bg-blue-100 text-blue-700",
  super_admin: "bg-purple-100 text-purple-700",
};

export default function AdminAdminsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [changingRole, setChangingRole] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        // Load up to 100 users and filter to non-customer roles
        const res = await usersApi.list(1, 100);
        setAdmins(res.items.filter((u) => u.role !== "customer"));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load admins");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const superAdmins = admins.filter((u) => u.role === "super_admin");
  const regularAdmins = admins.filter((u) => u.role === "admin");

  const handleRoleChange = async (role: UserRole) => {
    if (!selected) return;
    setChangingRole(true);
    setSuccessMsg("");
    try {
      const updated = await usersApi.updateRole(selected._id, role);
      if (role === "customer") {
        // Demoted — remove from the list
        setAdmins((prev) => prev.filter((u) => u._id !== selected._id));
        setSelected(null);
      } else {
        setAdmins((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
        setSelected(updated);
      }
      setSuccessMsg(role === "customer" ? "User demoted to customer." : `Role changed to ${role.replace("_", " ")}.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Role update failed");
    } finally {
      setChangingRole(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <p className="text-sm text-gray-500">
          Manage admin accounts and permissions.{" "}
          {!isSuperAdmin && <span className="text-amber-500 font-medium">Role changes require super_admin.</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Shield}      label="Total Admins"        value={admins.length}        bg="bg-blue-50"   ic="text-blue-600" />
        <StatCard icon={ShieldCheck} label="Super Admins"        value={superAdmins.length}   bg="bg-purple-50" ic="text-purple-600" />
        <StatCard icon={UserCheck}   label="Regular Admins"      value={regularAdmins.length} bg="bg-gray-50"   ic="text-gray-600" />
      </div>

      {/* Super_admin notice */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <AlertTriangle size={16} className="shrink-0" />
          You have read-only access. Only super_admins can promote or demote users.
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">{successMsg}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Super Admins */}
          <Section title="Super Admins" count={superAdmins.length} accent="purple">
            {superAdmins.length === 0 ? (
              <Empty label="No super admins found." />
            ) : (
              superAdmins.map((u) => (
                <AdminCard
                  key={u._id}
                  user={u}
                  isSelf={u._id === currentUser?.id}
                  isSuperAdmin={isSuperAdmin}
                  selected={selected?._id === u._id}
                  onClick={() => setSelected(selected?._id === u._id ? null : u)}
                />
              ))
            )}
          </Section>

          {/* Admins */}
          <Section title="Admins" count={regularAdmins.length} accent="blue">
            {regularAdmins.length === 0 ? (
              <Empty label="No admins found." />
            ) : (
              regularAdmins.map((u) => (
                <AdminCard
                  key={u._id}
                  user={u}
                  isSelf={u._id === currentUser?.id}
                  isSuperAdmin={isSuperAdmin}
                  selected={selected?._id === u._id}
                  onClick={() => setSelected(selected?._id === u._id ? null : u)}
                />
              ))
            )}
          </Section>
        </div>
      )}

      {/* Role management panel — shown when a user is selected */}
      {selected && isSuperAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Manage: {selected.name}</p>
              <p className="text-xs text-gray-500">{selected.email}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>

          <p className="text-xs text-gray-500 mb-3">Change role to:</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <button
                key={role}
                disabled={changingRole || selected.role === role}
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize disabled:opacity-40 ${
                  selected.role === role
                    ? roleStyle[role] + " border-transparent"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {changingRole
                  ? <Loader2 size={14} className="animate-spin mx-auto" />
                  : role.replace("_", " ")}
              </button>
            ))}
          </div>

          {selected.role !== "customer" ? null : null}

          <p className="text-xs text-gray-400 mt-3">
            Setting role to <span className="font-medium">customer</span> will remove this user from the Admins list.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, count, accent, children }: {
  title: string; count: number; accent: "blue" | "purple"; children: React.ReactNode;
}) {
  const accentCls = accent === "purple"
    ? "text-purple-700 bg-purple-100"
    : "text-blue-700 bg-blue-100";
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accentCls}`}>{count}</span>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function AdminCard({ user, isSelf, isSuperAdmin, selected, onClick }: {
  user: User; isSelf: boolean; isSuperAdmin: boolean; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={isSuperAdmin && !isSelf ? onClick : undefined}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
        selected ? "bg-amber-50" : isSuperAdmin && !isSelf ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800 truncate">{user.name}</p>
          {isSelf && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">You</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
            <Mail size={10} /> {user.email}
          </span>
          {user.phone && (
            <span className="flex items-center gap-1 text-xs text-gray-400 hidden sm:flex">
              <Phone size={10} /> {user.phone}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleStyle[user.role]}`}>
          {user.role.replace("_", " ")}
        </span>
        <span className={`text-xs ${user.isActive ? "text-green-500" : "text-gray-400"}`}>
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </button>
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

function Empty({ label }: { label: string }) {
  return (
    <div className="px-5 py-8 text-center text-sm text-gray-400">
      <Users size={28} className="mx-auto mb-2 text-gray-300" />
      {label}
    </div>
  );
}
