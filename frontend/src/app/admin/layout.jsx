"use client";

import { useEffect } from "react";   // ✅ ADD
import Sidebar from "./sidebar";

export default function AdminLayout({ children }) {

  useEffect(() => {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // ❌ not logged in
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // ❌ not admin
    if (role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <div className="bg-white shadow px-6 py-4 flex justify-between items-center">

          <h1 className="text-xl font-semibold">
            Admin Panel
          </h1>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              window.location.href = "/login";
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Logout
          </button>

        </div>

        <div className="p-8">
          {children}
        </div>

      </div>
    </div>
  );
}