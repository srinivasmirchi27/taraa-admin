"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, Tag, BarChart3, Shield, LogOut, X, Loader2,
} from "lucide-react";
import { useState } from "react";
import { auth, getRefreshToken } from "@/lib/api";

const nav = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard },
  { label: "Products",   href: "/admin/products",   icon: Package },
  { label: "Orders",     href: "/admin/orders",     icon: ShoppingCart },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Analytics",  href: "/admin/analytics",  icon: BarChart3 },
  { label: "Security",   href: "/admin/security",   icon: Shield },
  { label: "Settings",   href: "/admin/settings",   icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await auth.logout(refreshToken);
      } else {
        // no refresh token stored — just clear and redirect
        const { clearTokens } = await import("@/lib/api");
        clearTokens();
      }
    } catch {
      // even if API call fails, clear local tokens
      const { clearTokens } = await import("@/lib/api");
      clearTokens();
    } finally {
      router.push("/admin/login");
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-[#1a1a1a] text-white flex flex-col
          transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <span className="text-xl font-bold text-[#C9A84C]">TARAA</span>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
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

        {/* Logout */}
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
