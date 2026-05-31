"use client";

import { Menu, Bell, User } from "lucide-react";
import { useState } from "react";
import { useAuthStore, useUIStore } from "@/lib/store";

export default function AdminHeader() {
  const [notifOpen, setNotifOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Bell size={20} />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
              <p className="text-xs font-semibold text-gray-500 px-3 py-2">Notifications</p>
              <p className="text-xs text-gray-400 px-3 py-2">No new notifications.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center">
            {user ? (
              <span className="text-black text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={15} className="text-black" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-none">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {user?.role?.replace("_", " ") ?? "Loading..."}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
