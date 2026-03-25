"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {

  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Campaigns", path: "/dashboard/campaigns" },
    { name: "Offers", path: "/dashboard/offers" },
    { name: "Rules", path: "/dashboard/rules" },
    { name: "Analytics", path: "/dashboard/analytics" },
    { name: "Traffic Logs", path: "/dashboard/logs" },
    { name: "Traffic Filters", path: "/dashboard/filters" },
    { name: "Settings", path: "/dashboard/settings" }
  ];

  const isActive = (path) => {

    // dashboard should match exactly
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    // other routes can match nested paths
    return pathname.startsWith(path);
  };

  return (

    <aside className="w-64 bg-gray-900 text-white min-h-screen p-6 flex flex-col border-r border-gray-800">

      {/* Logo */}
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-wide">
          Traffic Intelligence
        </h2>
        <p className="text-xs text-gray-400">
          SaaS Dashboard
        </p>
      </div>

      {/* Menu */}
      <nav className="space-y-2 flex-1">

        {menu.map((item) => {

          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-4 py-2 rounded-md text-sm transition-all
              ${
                active
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              {item.name}
            </Link>
          );

        })}

      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition"
      >
        Logout
      </button>

    </aside>
  );

}