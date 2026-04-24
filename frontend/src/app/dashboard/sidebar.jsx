"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: "home" },
    { name: "Campaigns", path: "/dashboard/campaigns", icon: "layers" },
    { name: "Offers", path: "/dashboard/offers", icon: "tag" },
    { name: "Rules", path: "/dashboard/rules", icon: "filter" },
    { name: "Traffic Logs", path: "/dashboard/logs", icon: "activity" },
    { name: "Traffic Filters", path: "/dashboard/filters", icon: "shield" },
    { name: "Analytics", path: "/dashboard/analytics", icon: "bar" },
    { name: "Pricing", path: "/dashboard/pricing", icon: "dollar" },
    { name: "Settings", path: "/dashboard/settings", icon: "settings" },
    { name: "Docs", path: "/dashboard/docs", icon: "book" }, // 
  ];

  const isActive = (path) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  // 🔥 SVG ICONS (no library)
  const getIcon = (icon) => {
    const base = "w-5 h-5";
    switch (icon) {
      case "home":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" /></svg>;
      case "layers":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 6-10 6L2 8l10-6z" /><path d="M2 14l10 6 10-6" /></svg>;
      case "tag":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12l-8 8-8-8V4h8l8 8z" /></svg>;
      case "filter":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" /></svg>;
      case "activity":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
      case "shield":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3 9-8 10-5-1-8-5-8-10V6l8-4z" /></svg>;
      case "bar":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-6" /></svg>;
      case "dollar":
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H7" /></svg>;
      case "settings":
        return (
          <svg className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.5-2-3.5-2.4.5a7.97 7.97 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7.97 7.97 0 0 0-1.7 1l-2.4-.5-2 3.5 2 1.5a7.97 7.97 0 0 0 0 2l-2 1.5 2 3.5 2.4-.5a7.97 7.97 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7.97 7.97 0 0 0 1.7-1l2.4.5 2-3.5-2-1.5z" />
          </svg>
        );
      case "book":
        return (
          <svg className={base} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M20 22V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5v13z" />
          </svg>
        );
      default:
        return null;
    }

  };

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} 
fixed left-0 top-0 h-screen 
bg-[#0B0F1A] text-white flex flex-col 
border-r border-gray-800/50 
transition-all duration-300 z-50`}>

      {/* TOP */}
      <div className={`px-4 py-5 border-b border-gray-800 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>

        {!collapsed && (
          <div className="leading-tight">

            <h2 className="
    text-lg font-semibold tracking-tight
    bg-gradient-to-r from-white to-gray-300
    bg-clip-text text-transparent
  ">
              TrafficIntel <span className="text-indigo-400">AI</span>
            </h2>

            <p className="
    text-xs text-gray-500
    mt-0.5
    tracking-wide
  ">
              Smarter Traffic. Better Conversions.
            </p>

          </div>
        )}

        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="text-gray-400 hover:text-white"
        >
          ☰
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 py-4 space-y-1">

        {menu.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
          ${active
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
            >

              {/* ACTIVE LINE */}
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-indigo-400 rounded-r"></span>
              )}

              {/* ICON */}
              <span className="opacity-90">{getIcon(item.icon)}</span>

              {/* TEXT */}
              {!collapsed && <span>{item.name}</span>}

              {/* TOOLTIP */}
              {collapsed && (
                <span className="absolute left-16 bg-gray-900 text-xs px-2 py-1 rounded shadow border border-gray-700 opacity-0 group-hover:opacity-100">
                  {item.name}
                </span>
              )}

            </Link>
          );
        })}

      </nav>

      {/* LOGOUT (FIXED POSITION) */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full bg-red-600/90 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition shadow-md"
        >
          {collapsed ? "⎋" : "Logout"}
        </button>
      </div>

    </aside>
  );
}