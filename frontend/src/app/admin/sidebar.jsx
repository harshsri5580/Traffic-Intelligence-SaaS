"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {

  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Users", path: "/admin/users" },
    { name: "Campaigns", path: "/admin/campaigns" },
    { name: "Traffic", path: "/admin/traffic" },
    { name: "Billing", path: "/admin/billing" },
    { name: "System", path: "/admin/system" },
    { name: "Logs", path: "/admin/logs" }
  ];

  return (

    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">

      <h2 className="text-xl font-bold mb-8">
        Traffic Admin
      </h2>

      <nav className="space-y-2">

        {menu.map((item) => {

          const active = pathname === item.path;

          return (

            <Link
              key={item.path}
              href={item.path}
              className={`block px-4 py-2 rounded ${
                active
                  ? "bg-indigo-600"
                  : "hover:bg-gray-800"
              }`}
            >
              {item.name}
            </Link>

          );

        })}

      </nav>

    </div>

  );

}