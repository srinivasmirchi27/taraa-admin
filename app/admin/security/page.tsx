"use client";

import { useState, useEffect } from "react";
import {
  Shield, Lock, Key, Users, Activity,
  CheckCircle, AlertTriangle, Info, Zap, Globe,
  Loader2, RefreshCw, LogOut,
} from "lucide-react";
import { health, auth, getRefreshToken, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

const concepts = [
  {
    group: "Entry & Routing", icon: Globe, color: "bg-blue-50 text-blue-600",
    items: [
      { name: "API Gateway",    status: "active",  desc: "Single entry point via NestJS global prefix /api/v1" },
      { name: "Reverse Proxy",  status: "planned", desc: "Nginx in production for SSL termination + static serving" },
    ],
  },
  {
    group: "Authentication", icon: Key, color: "bg-amber-50 text-amber-600",
    items: [
      { name: "JWT (HS256)",              status: "active",  desc: "Access: 15m, Refresh: 30d. Auto-refreshed by admin client." },
      { name: "Email + Password (Local)", status: "active",  desc: "Passport local strategy with bcrypt password hashing" },
      { name: "Google OAuth 2.0",         status: "active",  desc: "Web flow via /auth/google, mobile via /auth/google/token" },
      { name: "Phone OTP / Firebase",     status: "active",  desc: "/auth/otp/send → /auth/otp/verify, Firebase phone login" },
    ],
  },
  {
    group: "Authorization (RBAC)", icon: Users, color: "bg-purple-50 text-purple-600",
    items: [
      { name: "RolesGuard",                           status: "active", desc: "Checks req.user.role against @Roles() decorator" },
      { name: "JwtAuthGuard",                         status: "active", desc: "Wraps passport-jwt, skips @Public() routes" },
      { name: "Roles: customer / admin / super_admin", status: "active", desc: "Stored in JWT payload, enforced at controller level" },
    ],
  },
  {
    group: "Guards & Middleware", icon: Shield, color: "bg-green-50 text-green-600",
    items: [
      { name: "LoggerMiddleware",    status: "active", desc: "Logs method, URL, status, latency, IP per request" },
      { name: "Helmet (Security Headers)", status: "active", desc: "X-Content-Type, X-Frame-Options, CSP, HSTS" },
      { name: "ValidationPipe",     status: "active", desc: "class-validator + whitelist strips unknown body fields" },
      { name: "HttpExceptionFilter", status: "active", desc: "All errors → { success: false, message, statusCode }" },
    ],
  },
  {
    group: "Rate Limiting", icon: Zap, color: "bg-orange-50 text-orange-600",
    items: [
      { name: "ThrottlerModule (NestJS)",     status: "active",  desc: "60 req / 60s per IP, sliding window, applied globally" },
      { name: "Per-endpoint burst protection", status: "planned", desc: "Per-route @Throttle() for login (5/min) etc." },
    ],
  },
  {
    group: "Security", icon: Lock, color: "bg-red-50 text-red-600",
    items: [
      { name: "HTTPS / TLS",              status: "planned", desc: "Production: Let's Encrypt cert via Nginx" },
      { name: "CORS",                     status: "active",  desc: "CORS_ORIGINS env var, credentials: true" },
      { name: "Input Sanitization",       status: "active",  desc: "class-validator strips/rejects unexpected fields" },
      { name: "bcryptjs password hashing", status: "active", desc: "Salt rounds: 12. Passwords never stored in plain text." },
    ],
  },
  {
    group: "Observability", icon: Activity, color: "bg-teal-50 text-teal-600",
    items: [
      { name: "Structured Logging",     status: "active", desc: "NestJS Logger + LoggerMiddleware per request/response" },
      { name: "LoggingInterceptor",     status: "active", desc: "Logs handler execution time in ms" },
      { name: "TransformInterceptor",   status: "active", desc: "Wraps all responses: { success, data, timestamp }" },
      { name: "/health endpoint",       status: "active", desc: "Liveness check — status, timestamp, service name" },
    ],
  },
];

const statusBadge: Record<string, string> = {
  active:  "bg-green-100 text-green-700",
  planned: "bg-yellow-100 text-yellow-700",
};

export default function SecurityPage() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<"loading" | "ok" | "error">("loading");
  const [healthData, setHealthData] = useState<{ status: string; timestamp: string; service: string } | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const checkHealth = async () => {
    setHealthStatus("loading");
    try {
      const data = await health.check();
      setHealthData(data);
      setHealthStatus("ok");
    } catch {
      setHealthStatus("error");
    }
  };

  useEffect(() => { checkHealth(); }, []);

  const handleLogoutAll = async () => {
    if (!confirm("Sign out from all devices?")) return;
    setLogoutAllLoading(true);
    try {
      await auth.logoutAll();
      router.push("/admin/login");
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 401) {
        router.push("/admin/login");
      } else {
        const refreshToken = getRefreshToken();
        if (refreshToken) await auth.logout(refreshToken).catch(() => {});
        router.push("/admin/login");
      }
    }
  };

  const activeCount = concepts.flatMap((c) => c.items).filter((i) => i.status === "active").length;
  const totalCount  = concepts.flatMap((c) => c.items).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Architecture</h1>
          <p className="text-sm text-gray-500 mt-0.5">Backend security patterns implemented in NestJS</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">{activeCount}/{totalCount} implemented</span>
        </div>
      </div>

      {/* Live health check */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">API Health Check</h2>
          </div>
          <button
            onClick={checkHealth}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {healthStatus === "loading" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={15} className="animate-spin text-[#C9A84C]" />
            Checking API status…
          </div>
        )}
        {healthStatus === "ok" && healthData && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-800">API is online — {healthData.service}</p>
              <p className="text-xs text-green-600 mt-0.5">
                Status: {healthData.status} · Last checked: {new Date(healthData.timestamp).toLocaleTimeString("en-IN")}
              </p>
            </div>
          </div>
        )}
        {healthStatus === "error" && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-700">API is unreachable</p>
              <p className="text-xs text-red-500 mt-0.5">
                Check that the NestJS server is running on{" "}
                <code className="bg-red-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Session actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Session Management</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium">RBAC Active</p>
            <p className="text-xs text-blue-600 mt-0.5">customer · admin · super_admin roles enforced at API level.</p>
          </div>
          <button
            onClick={handleLogoutAll}
            disabled={logoutAllLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 shrink-0"
          >
            {logoutAllLoading
              ? <Loader2 size={15} className="animate-spin" />
              : <LogOut size={15} />}
            Logout All Devices
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          These patterns are implemented in the NestJS backend.
          Swagger docs at{" "}
          <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer" className="underline font-medium">
            http://localhost:3001/api/docs
          </a>
        </p>
      </div>

      {/* Architecture concepts */}
      <div className="space-y-4">
        {concepts.map(({ group, icon: Icon, color, items }) => (
          <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
              <div className={`p-1.5 rounded-lg ${color.split(" ")[0]}`}>
                <Icon size={15} className={color.split(" ")[1]} />
              </div>
              <h2 className="font-semibold text-gray-800 text-sm">{group}</h2>
              <span className="ml-auto text-xs text-gray-400">{items.length} patterns</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(({ name, status, desc }) => (
                <div key={name} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusBadge[status]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  {status === "planned" && <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
