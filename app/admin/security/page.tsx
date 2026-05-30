"use client";

import {
  Shield, Lock, Key, Users, Activity,
  CheckCircle, AlertTriangle, Info, Zap, Globe,
} from "lucide-react";

const concepts = [
  {
    group: "Entry & Routing",
    icon: Globe,
    color: "bg-blue-50 text-blue-600",
    items: [
      { name: "API Gateway", status: "active", desc: "Single entry point via Next.js middleware + NestJS global prefix /api/v1" },
      { name: "Reverse Proxy", status: "planned", desc: "Nginx sits in front in production, SSL termination + static file serving" },
    ],
  },
  {
    group: "Authentication",
    icon: Key,
    color: "bg-amber-50 text-amber-600",
    items: [
      { name: "JWT (JSON Web Tokens)", status: "active", desc: "Stateless tokens signed with HS256. Access: 24h, Refresh: 7d" },
      { name: "Local Strategy (email+password)", status: "active", desc: "Passport local strategy validates against bcrypt hashed passwords" },
      { name: "OAuth 2.0 (Google)", status: "planned", desc: "Planned: passport-google-oauth20 strategy for social login" },
      { name: "API Keys (service-to-service)", status: "planned", desc: "X-API-Key header auth for webhook & admin API calls" },
    ],
  },
  {
    group: "Authorization (RBAC)",
    icon: Users,
    color: "bg-purple-50 text-purple-600",
    items: [
      { name: "RolesGuard", status: "active", desc: "Checks req.user.role against @Roles(Role.ADMIN) decorator" },
      { name: "JwtAuthGuard", status: "active", desc: "Wraps passport-jwt, skips routes decorated with @Public()" },
      { name: "Roles: customer / admin / super_admin", status: "active", desc: "Stored in JWT payload, enforced at controller level" },
    ],
  },
  {
    group: "Guards & Middleware",
    icon: Shield,
    color: "bg-green-50 text-green-600",
    items: [
      { name: "LoggerMiddleware", status: "active", desc: "Logs method, URL, status, latency, IP for every request" },
      { name: "Helmet (Security Headers)", status: "active", desc: "Sets X-Content-Type, X-Frame-Options, CSP, HSTS etc." },
      { name: "ValidationPipe", status: "active", desc: "class-validator + whitelist strips unknown body fields" },
      { name: "HttpExceptionFilter", status: "active", desc: "Formats all errors as { success: false, message, statusCode }" },
    ],
  },
  {
    group: "Rate Limiting",
    icon: Zap,
    color: "bg-orange-50 text-orange-600",
    items: [
      { name: "ThrottlerModule (NestJS)", status: "active", desc: "60 requests / 60s per IP, sliding window, applied globally" },
      { name: "Burst protection per endpoint", status: "planned", desc: "Per-route @Throttle() overrides for login (5/min) etc." },
    ],
  },
  {
    group: "Security",
    icon: Lock,
    color: "bg-red-50 text-red-600",
    items: [
      { name: "HTTPS / TLS", status: "planned", desc: "Production: cert via Let's Encrypt, enforced by Nginx" },
      { name: "CORS", status: "active", desc: "Allowlist in CORS_ORIGINS env var, credentials: true" },
      { name: "Input Sanitization", status: "active", desc: "class-validator strips/rejects unexpected fields" },
      { name: "bcryptjs password hashing", status: "active", desc: "Salt rounds: 12. Passwords never stored in plain text." },
    ],
  },
  {
    group: "Observability",
    icon: Activity,
    color: "bg-teal-50 text-teal-600",
    items: [
      { name: "Structured Logging", status: "active", desc: "NestJS Logger + LoggerMiddleware per request/response" },
      { name: "LoggingInterceptor", status: "active", desc: "Logs handler execution time in ms (not just HTTP layer)" },
      { name: "TransformInterceptor", status: "active", desc: "Wraps all responses: { success, data, timestamp }" },
      { name: "/health, /health/ready, /health/metrics", status: "active", desc: "Liveness, readiness, and memory/uptime metrics endpoints" },
    ],
  },
];

const statusBadge: Record<string, string> = {
  active:  "bg-green-100 text-green-700",
  planned: "bg-yellow-100 text-yellow-700",
  todo:    "bg-gray-100 text-gray-500",
};

export default function SecurityPage() {
  const activeCount = concepts.flatMap((c) => c.items).filter((i) => i.status === "active").length;
  const totalCount = concepts.flatMap((c) => c.items).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Architecture</h1>
          <p className="text-sm text-gray-500 mt-0.5">Backend infrastructure patterns implemented in NestJS</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">{activeCount}/{totalCount} implemented</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          These patterns are implemented in <code className="bg-blue-100 px-1 rounded text-xs">backend/src/</code>.
          Run <code className="bg-blue-100 px-1 rounded text-xs">cd backend && npm run start:dev</code> to start the NestJS API.
          Swagger docs available at <code className="bg-blue-100 px-1 rounded text-xs">http://localhost:3001/api/docs</code>.
        </p>
      </div>

      {/* Concepts Grid */}
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
                  {status === "planned" && (
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
