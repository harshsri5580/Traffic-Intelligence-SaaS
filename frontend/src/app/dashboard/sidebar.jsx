"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
        return <svg className={base} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 3.46-.07-.02a1.65 1.65 0 0 0-1.51.31l-.21.15-3.46-2-.02-.07a1.65 1.65 0 0 0-.31-1.51l-.15-.21-2-3.46.07-.02a1.65 1.65 0 0 0 1.51-.31l.21-.15 3.46 2 .02.07c.13.53.41 1.02.82 1.39z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} bg-gray-950 text-white min-h-screen p-4 flex flex-col border-r border-gray-800 transition-[width] duration-300 ease-in-out will-change-[width]`}>

      {/* Top */}
      <div className={`flex items-center mb-6 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold">Traffic Intelligence</h2>
            <p className="text-xs text-gray-400">Manage your traffic flow</p>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          <span className="text-xl font-bold">☰</span>
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1">

        {menu.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200 relative
              ${active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
            >

              {/* Icon */}
              <span>{getIcon(item.icon)}</span>

              {/* Label */}
              <span className={`transition-opacity duration-200 ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>
                {item.name}
              </span>

              {/* Tooltip */}
              {collapsed && (
                <span className="absolute left-16 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}

      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm transition"
      >
        {collapsed ? "⎋" : "Logout"}
      </button>

    </aside>
  );
}