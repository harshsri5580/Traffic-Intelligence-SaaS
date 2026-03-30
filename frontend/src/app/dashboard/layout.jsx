"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation"; // ✅ IMPORTANT
import Sidebar from "./sidebar";
import { Toaster } from "react-hot-toast";
import api from "../../services/api";

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [showResume, setShowResume] = useState(false);

  const pathname = usePathname(); // ✅ FIX
  const isPricingPage = pathname.includes("/pricing"); // ✅ FIX

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    checkPlan();
  }, []);

  const checkPlan = async () => {
    try {
      const res = await api.get("/billing/my-subscription");

      if (!res.data || res.data.expired) {
  setExpired(true);
  setShowResume(false);
} else {
  setExpired(false);
  setShowResume(true); // 👈 upgrade ke baad resume dikhega
}
    } catch {
      setExpired(true);
    } finally {
      setLoading(false);
    }
  };


  const resumeCampaigns = async () => {
  try {
    await api.post("/campaigns/resume-all");
    window.location.reload(); // safest refresh
  } catch {
    alert("Failed to resume campaigns");
  }
};

  // ✅ Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ✅ Sidebar hide only when expired AND not pricing */}
      <div className={`${expired ? "opacity-50" : ""}`}>
  <Sidebar />
</div>

      <div className="flex flex-1 flex-col">

        <header className="bg-white border-b px-6 py-4 shadow-sm flex justify-between items-center">
          <h1 className="text-lg font-semibold">
            Traffic Intelligence SaaS
          </h1>

        
        </header>

        <main className="flex-1 overflow-y-auto p-8">

          {/* ✅ MAIN CONTENT */}
          <div
            className={`${
              expired && !isPricingPage
                ? "blur-md opacity-60 pointer-events-none select-none"
                : ""
            }`}
          >
            {children}
          </div>

          {/* 🔴 LOCK SCREEN (ONLY NON-PRICING) */}
          {expired && !isPricingPage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

              <div className="bg-white p-10 rounded-xl shadow-xl text-center max-w-md w-full">

                <div className="text-5xl mb-4">🚫</div>

                <h2 className="text-2xl font-bold mb-2">
                  Your plan has expired
                </h2>

                <p className="text-gray-600 mb-6">
                  Upgrade your plan to continue using campaigns, analytics and tracking.
                </p>

                <div className="flex gap-3 justify-center flex-wrap">

                  <button
                    onClick={() => (window.location.href = "/dashboard/pricing")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
                  >
                    Upgrade
                  </button>

                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      window.location.href = "/login";
                    }}
                    className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-lg"
                  >
                    Logout
                  </button>


                  {showResume && (
  <button
    onClick={resumeCampaigns}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
  >
    Resume Campaigns
  </button>
)}

                </div>

              </div>
            </div>
          )}

          <Toaster position="top-right" />

        </main>

      </div>
    </div>
  );
}