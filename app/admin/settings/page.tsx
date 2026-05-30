"use client";

import { useState } from "react";
import { Save, Globe, Bell, Shield, Database, Zap, CheckCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [store, setStore] = useState({
    name: "Taraa Fashion Jewellery",
    email: "support@taraa.in",
    phone: "+91 98765 43210",
    currency: "INR",
    timezone: "Asia/Kolkata",
    gst: "22ABCDE1234F1Z5",
  });

  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    newCustomer: false,
    paymentFailed: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your store configuration</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Store Info */}
      <Section icon={Globe} title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store Name">
            <input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className="input" />
          </Field>
          <Field label="Support Email">
            <input value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} className="input" />
          </Field>
          <Field label="Phone">
            <input value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} className="input" />
          </Field>
          <Field label="GST Number">
            <input value={store.gst} onChange={(e) => setStore({ ...store, gst: e.target.value })} className="input" />
          </Field>
          <Field label="Currency">
            <select value={store.currency} onChange={(e) => setStore({ ...store, currency: e.target.value })} className="input">
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select value={store.timezone} onChange={(e) => setStore({ ...store, timezone: e.target.value })} className="input">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-3">
          {[
            { key: "newOrder", label: "New Order", desc: "Notify when a new order is placed" },
            { key: "lowStock", label: "Low Stock Alert", desc: "Notify when product stock goes below 5 units" },
            { key: "newCustomer", label: "New Customer", desc: "Notify when a new customer registers" },
            { key: "paymentFailed", label: "Payment Failed", desc: "Notify on failed payment attempts" },
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

      {/* Security */}
      <Section icon={Shield} title="Security">
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">JWT Authentication Active</p>
              <p className="text-xs text-green-600">Tokens expire in 24 hours. Refresh tokens valid for 7 days.</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <Shield size={16} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">RBAC Enabled — Role: Super Admin</p>
              <p className="text-xs text-blue-600">You have full access to all admin resources.</p>
            </div>
          </div>
          <Field label="Change Admin Password">
            <input type="password" placeholder="New password (min 8 chars)" className="input" />
          </Field>
        </div>
      </Section>

      {/* API / Backend */}
      <Section icon={Database} title="API Configuration">
        <div className="space-y-4">
          <Field label="Backend API URL">
            <input defaultValue="http://localhost:3001/api" className="input font-mono text-xs" />
          </Field>
          <Field label="API Version">
            <input defaultValue="v1" className="input" />
          </Field>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <p className="font-medium mb-1">NestJS Backend Status</p>
            <p className="text-xs text-amber-700">
              Connect to <code className="bg-amber-100 px-1 rounded">http://localhost:3001</code> — run{" "}
              <code className="bg-amber-100 px-1 rounded">cd backend && npm run start:dev</code> to start.
            </p>
          </div>
        </div>
      </Section>

      {/* Rate Limiting */}
      <Section icon={Zap} title="Rate Limiting & Performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Max Requests / Minute">
            <input type="number" defaultValue={60} className="input" />
          </Field>
          <Field label="Rate Limit Strategy">
            <select className="input">
              <option>Sliding Window</option>
              <option>Fixed Window</option>
              <option>Token Bucket</option>
              <option>Leaky Bucket</option>
            </select>
          </Field>
        </div>
        <p className="text-xs text-gray-400 mt-2">These settings are applied in the NestJS backend via ThrottlerModule.</p>
      </Section>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .input:focus { border-color: #C9A84C; box-shadow: 0 0 0 3px rgba(201,168,76,0.15); }
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
