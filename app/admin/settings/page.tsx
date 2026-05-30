"use client";

import { useState, useEffect } from "react";
import { Save, Globe, Bell, Shield, Database, Zap, CheckCircle, Loader2, User } from "lucide-react";
import { users as usersApi, auth, getRefreshToken, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();

  // Profile (from /users/me)
  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Notifications (local-only, no API)
  const [notifications, setNotifications] = useState({
    newOrder: true, lowStock: true, newCustomer: false, paymentFailed: true,
  });

  // Health
  const [apiUrl] = useState(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1");

  useEffect(() => {
    usersApi.me()
      .then((u) => setProfile({ name: u.name, phone: u.phone ?? "", address: u.address ?? "" }))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    try {
      await usersApi.updateMe({
        name: profile.name,
        ...(profile.phone && { phone: profile.phone }),
        ...(profile.address && { address: profile.address }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("This will sign you out from all devices. Continue?")) return;
    try {
      await auth.logoutAll();
      router.push("/admin/login");
    } catch {
      const refreshToken = getRefreshToken();
      if (refreshToken) await auth.logout(refreshToken).catch(() => {});
      router.push("/admin/login");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account and store configuration</p>
        </div>
      </div>

      {/* Profile */}
      <Section icon={User} title="My Profile">
        {profileLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : (
          <div className="space-y-4">
            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{profileError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display Name">
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="input"
                />
              </Field>
            </div>
            <Field label="Address">
              <input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="123 MG Road, Bangalore"
                className="input"
              />
            </Field>
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
            >
              {profileSaving
                ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                : profileSaved
                ? <><CheckCircle size={15} /> Saved!</>
                : <><Save size={15} /> Save Profile</>}
            </button>
          </div>
        )}
      </Section>

      {/* Store Info (local only) */}
      <Section icon={Globe} title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store Name">
            <input defaultValue="Taraa Fashion Jewellery" className="input" />
          </Field>
          <Field label="Support Email">
            <input defaultValue="support@taraa.in" className="input" />
          </Field>
          <Field label="Currency">
            <select defaultValue="INR" className="input">
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select defaultValue="Asia/Kolkata" className="input">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Notifications (local only) */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          {[
            { key: "newOrder",      label: "New Order",       desc: "Notify when a new order is placed" },
            { key: "lowStock",      label: "Low Stock Alert", desc: "Notify when product stock goes below 5 units" },
            { key: "newCustomer",   label: "New Customer",    desc: "Notify when a new customer registers" },
            { key: "paymentFailed", label: "Payment Failed",  desc: "Notify on failed payment attempts" },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <div
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  notifications[key as keyof typeof notifications] ? "bg-[#C9A84C]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    notifications[key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Session Management */}
      <Section icon={Shield} title="Session Management">
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">JWT Authentication Active</p>
              <p className="text-xs text-green-600">Access tokens expire in 15 min. Refresh tokens valid for 30 days.</p>
            </div>
          </div>
          <button
            onClick={handleLogoutAll}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
          >
            Logout from All Devices
          </button>
        </div>
      </Section>

      {/* API Config (read-only info) */}
      <Section icon={Database} title="API Configuration">
        <div className="space-y-3">
          <Field label="Backend API URL">
            <input value={apiUrl} readOnly className="input font-mono text-xs bg-gray-50 cursor-default" />
          </Field>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <p className="font-medium mb-1">NestJS Backend</p>
            <p className="text-xs text-amber-700">
              Swagger docs available at{" "}
              <a
                href="http://localhost:3001/api/docs"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                http://localhost:3001/api/docs
              </a>
            </p>
          </div>
        </div>
      </Section>

      {/* Rate Limiting (informational) */}
      <Section icon={Zap} title="Rate Limiting">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Default Limit</p>
            <p className="text-sm font-semibold text-gray-800">60 req / 60s per IP</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Production Limit</p>
            <p className="text-sm font-semibold text-gray-800">30 req / 60s per IP</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Applied via NestJS ThrottlerModule. Configured in the backend.</p>
      </Section>

      <style>{`
        .input { width:100%; padding:0.5rem 0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; font-size:0.875rem; outline:none; background:white; }
        .input:focus { border-color:#C9A84C; box-shadow:0 0 0 3px rgba(201,168,76,0.15); }
      `}</style>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <Icon size={16} className="text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
