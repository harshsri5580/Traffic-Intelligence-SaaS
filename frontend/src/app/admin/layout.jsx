"use client";

import { useEffect } from "react";
import Sidebar from "./sidebar";

export default function AdminLayout({ children }) {

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6]">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <div className="h-[78px] bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">

          <div>

            <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">
              Admin Panel
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              TrafficIntelAI Management Console
            </p>

          </div>
          <div className="flex items-center gap-4">

            <div className="hidden md:flex items-center gap-3 bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 py-2">

              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />

              <span className="text-sm font-medium text-gray-600">
                System Online
              </span>

            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
              className="h-11 px-5 rounded-2xl bg-[#111827] hover:bg-black transition-all text-white text-sm font-medium shadow-sm"
            >
              Logout
            </button>

          </div>

        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          {children}
        </div>

      </div>
    </div>
  );
}