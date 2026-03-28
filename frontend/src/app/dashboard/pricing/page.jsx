"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
     loadPlans();
  loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
  try {
    const res = await api.get("/billing/my-subscription");
    setCurrentPlan(res.data?.plan?.name || null);
  } catch {
    setCurrentPlan(null);
  }
};

  const loadPlans = async () => {
    const res = await api.get("/billing/plans");

    // ✅ ORDER FIX (Basic → Pro → Enterprise)
    const sorted = (res.data || []).sort((a, b) => a.price - b.price);

    setPlans(sorted);
  };
const subscribe = async (id) => {
  const toastId = toast.loading("Processing...");

  try {
    await api.post(`/billing/subscribe/${id}`);

    toast.success("Plan activated 🚀", { id: toastId });

    setTimeout(() => window.location.reload(), 1000);

  } catch {
    toast.error("Failed ❌", { id: toastId });
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-10">

      <h1 className="text-4xl font-bold text-center mb-12">
        Choose Your Plan
      </h1>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {plans.map((p, i) => {

          const isPopular = p.name.toLowerCase().includes("pro");
          const isCurrent = currentPlan === p.name; // ✅ YAHAN ADD KARO

          return (
            <div
              key={p.id}
              className={`relative p-8 rounded-2xl border shadow-lg transition transform hover:-translate-y-2
              ${
                isPopular
                  ? "border-indigo-600 bg-white scale-105"
                  : "bg-white border-gray-200"
              }`}
            >

              {/* 🔥 MOST POPULAR BADGE */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h2 className="text-2xl font-bold text-center">
                {p.name}
              </h2>

              <p className="text-center text-4xl font-extrabold my-6">
                ${p.price}
                <span className="text-sm font-medium text-gray-500"> /mo</span>
              </p>

              <div className="space-y-3 text-gray-600 text-sm">

                <p>✔ {p.max_campaigns} Active Campaigns</p>

                <p>
                  ✔{" "}
                  {p.max_monthly_clicks
                    ? p.max_monthly_clicks
                    : "Unlimited"}{" "}
                  Clicks
                </p>

                <p>✔ Real-time Tracking</p>
                <p>✔ Bot Filtering</p>
                <p>✔ Analytics Dashboard</p>

              </div>

              

              <button
                disabled={isCurrent}
                onClick={() => subscribe(p.id)}
                className={`mt-8 w-full py-3 rounded-lg font-semibold transition
                  ${
                    isCurrent
                      ? "bg-gray-400 cursor-not-allowed"
                      : p.name.toLowerCase().includes("pro")
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
              >
                {isCurrent ? "Current Plan" : "Choose Plan"}
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}