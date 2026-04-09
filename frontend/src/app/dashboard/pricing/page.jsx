"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [token, setToken] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    const loadAll = async () => {
      try {
        await Promise.all([loadPlans(), loadCurrentPlan()]);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [token]);

  const loadCurrentPlan = async () => {
    try {
      const res = await api.get("/billing/my-subscription");

      setCurrentPlan(res?.data?.plan || null);
      setDaysLeft(res?.data?.days_left || 0);
      setExpired(res?.data?.expired || false);
    } catch {
      setCurrentPlan(null);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await api.get("/billing/plans");

      const data = Array.isArray(res.data)
        ? res.data
        : res?.data?.plans || [];

      setPlans(data.sort((a, b) => a.price - b.price));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false); // 🔥 ADD THIS
    }
  };

  const checkoutLinks = {
    Basic:
      "https://traffic-intelligence.lemonsqueezy.com/checkout/buy/2e53426d-cf76-4ce2-9ea7-e794f4604cff",
    Pro:
      "https://traffic-intelligence.lemonsqueezy.com/checkout/buy/43392cb4-bd85-4b66-b4a3-aa0452b03da2",
    Enterprise:
      "https://traffic-intelligence.lemonsqueezy.com/checkout/buy/2dedcb1e-dbd3-4375-a929-6e1474a3d098",
  };

  if (!token || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading pricing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-10">

      <h1 className="text-4xl font-bold text-center mb-8">
        Choose Your Plan
      </h1>

      {/* 🔥 STATUS BANNER */}
      <div className="max-w-3xl mx-auto mb-10">
        {/* 🔥 SMART PLAN STATUS */}
        {/* ⚠️ Expiring soon */}
        {!expired && daysLeft > 0 && daysLeft <= 3 && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-6 py-3 rounded text-center font-medium">
            ⚠️ Your plan is expiring in {daysLeft} days. Upgrade now.
          </div>
        )}

        {/* 🔴 Expired today */}
        {!expired && daysLeft === 0 && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-3 rounded text-center font-medium">
            🚫 Your plan has expired. Upgrade now.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((p) => {

          const planName = p?.name || "";
          const userPlan = currentPlan?.name?.toLowerCase() || "";

          const isCurrent =
            planName.toLowerCase().trim() === userPlan.trim();

          const isPopular = planName.toLowerCase().includes("pro");

          return (
            <div
              key={p.id}
              className={`relative p-8 rounded-2xl border shadow-lg transition
              ${isPopular
                  ? "border-indigo-600 bg-white scale-105"
                  : "bg-white border-gray-200"
                }`}
            >

              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h2 className="text-2xl font-bold text-center">
                {planName}
              </h2>

              <p className="text-center text-4xl font-extrabold my-6">
                ${p.price}
                <span className="text-sm text-gray-500"> /mo</span>
              </p>

              <div className="space-y-3 text-gray-600 text-sm">
                <p>✔ {p.max_campaigns} Campaigns</p>
                <p>✔ {p.max_monthly_clicks || "Unlimited"} Clicks</p>
                <p>✔ Real-time Tracking</p>
                <p>✔ Bot Filtering</p>
                <p>✔ Analytics Dashboard</p>
              </div>

              <button
                disabled={isCurrent && !expired}
                onClick={() => {
                  const link = checkoutLinks[planName];
                  if (link) {
                    window.location.href = link;
                  } else {
                    toast.error("Invalid plan");
                  }
                }}
                className={`mt-8 w-full py-3 rounded-lg font-semibold transition
                  ${isCurrent && !expired
                    ? "bg-gray-400 cursor-not-allowed"
                    : isPopular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
              >
                {isCurrent && !expired
                  ? "Current Plan"
                  : expired && isCurrent
                    ? "Renew Plan"
                    : "Choose Plan"}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}