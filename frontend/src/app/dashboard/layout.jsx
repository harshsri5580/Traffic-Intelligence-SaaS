"use client";

export default function DashboardLayout({ children }) {
  return <>{children}</>;
}

import { useEffect } from "react";   // ✅ ADD
import Sidebar from "./sidebar";
import { Toaster } from "react-hot-toast";


export default function DashboardLayout({ children }) {

  useEffect(() => {

    const token = localStorage.getItem("token");

    // ❌ not logged in
    if (!token) {
      window.location.href = "/login";
    }

  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <Sidebar />

      <div className="flex flex-1 flex-col">

        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center justify-between">

          <h1 className="text-lg font-semibold text-gray-800">
            Traffic Intelligence SaaS
          </h1>

        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
          <Toaster position="top-right" />
        </main>

      </div>
    </div>
  );
}