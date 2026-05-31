"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, Tag, BarChart3, Shield, LogOut, X, Loader2,
  Boxes, CreditCard, ShieldCheck, Crown, Image, MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore, useUIStore } from "@/lib/store";

const nav = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard },
  { label: "Products",   href: "/admin/products",   icon: Package },
  { label: "Inventory",  href: "/admin/inventory",  icon: Boxes },
  { label: "Orders",     href: "/admin/orders",     icon: ShoppingCart },
  { label: "Payments",   href: "/admin/payments",   icon: CreditCard },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
  { label: "Admins",     href: "/admin/admins",     icon: ShieldCheck },
  { label: "Roles",      href: "/admin/roles",      icon: Crown },
  { label: "Banners",    href: "/admin/banners",    icon: Image },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Support",    href: "/admin/support",    icon: MessageSquare },
  { label: "Analytics",  href: "/admin/analytics",  icon: BarChart3 },
  { label: "Security",   href: "/admin/security",   icon: Shield },
  { label: "Settings",   href: "/admin/settings",   icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      router.push("/admin/login");
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-[#1a1a1a] text-white flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <span className="text-xl font-bold text-[#C9A84C]">TARAA</span>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? "bg-[#C9A84C] text-black" : "text-gray-300 hover:bg-white/10 hover:text-white"}
                `}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
          >
            {loggingOut ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
