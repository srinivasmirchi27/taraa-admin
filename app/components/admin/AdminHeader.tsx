"use client";

import { Menu, Bell, Search, User } from "lucide-react";
import { useState } from "react";

interface Props {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
              <p className="text-xs font-semibold text-gray-500 px-3 py-2">Notifications</p>
              {[
                { title: "New order #1042", time: "2 min ago", dot: "bg-blue-500" },
                { title: "Low stock: Crystal Necklace", time: "1 hr ago", dot: "bg-yellow-500" },
                { title: "New customer registered", time: "3 hr ago", dot: "bg-green-500" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.dot}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center">
            <User size={15} className="text-black" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-none">Admin</p>
            <p className="text-xs text-gray-400 mt-0.5">taraa.admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
