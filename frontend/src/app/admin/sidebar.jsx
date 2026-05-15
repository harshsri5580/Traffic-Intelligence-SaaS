"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Globe,
  Activity,
  CreditCard,
  Server,
  FileText
} from "lucide-react";

export default function Sidebar() {

  const pathname = usePathname();

  const menu = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users
    },
    {
      name: "Campaigns",
      path: "/admin/campaigns",
      icon: Globe
    },
    {
      name: "Traffic",
      path: "/admin/traffic",
      icon: Activity
    },
    {
      name: "Billing",
      path: "/admin/billing",
      icon: CreditCard
    },
    {
      name: "System",
      path: "/admin/system",
      icon: Server
    },
    {
      name: "Logs",
      path: "/admin/logs",
      icon: FileText
    }
  ];

  return (

    <div className="
w-[290px]
h-screen
sticky
top-0
left-0
overflow-y-auto
bg-[#0F172A]
text-white
px-5
py-6
border-r
border-[#1E293B]
flex
flex-col
">

      <div className="mb-10">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-600/20">
            T
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              TrafficIntelAI
            </h2>

            <p className="text-xs text-gray-400 mt-0.5">
              Admin Control
            </p>
          </div>

        </div>

      </div>

      <nav className="space-y-1.5">

        {menu.map((item) => {

          const active = pathname === item.path;

          return (

            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-400 hover:bg-[#172036] hover:text-white"
                }`}
            >

              <item.icon
                size={18}
                className={`transition-all ${active
                  ? "text-white"
                  : "text-gray-500 group-hover:text-white"
                  }`}
              />

              <span className="text-sm font-medium tracking-wide">
                {item.name}
              </span>

            </Link>



          );

        })}

      </nav>
      <div className="mt-10 p-5 rounded-[24px] bg-[#111827] border border-[#1F2937]">

        <div className="flex items-center gap-2 mb-4">

          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />

          <span className="text-sm font-medium text-gray-300">
            System Online
          </span>

        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          All monitoring systems and traffic engines are operational.
        </p>

      </div>
    </div>

  );

}