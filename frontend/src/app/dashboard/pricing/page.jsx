"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useRef } from "react";

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

  const formatNumber = (num) => {
    if (!num) return "Unlimited";

    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".0", "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(".0", "") + "K";

    return num;
  };

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


  const paddleRef = useRef(null);

  const getPaddle = async () => {
    if (typeof window === "undefined") return null; // ✅ SSR safe

    console.log("PADDLE TOKEN:", process.env.NEXT_PUBLIC_PADDLE_TOKEN);

    if (!paddleRef.current) {
      const { initializePaddle } = await import("@paddle/paddle-js");

      paddleRef.current = await initializePaddle({
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV || "production",
        token: process.env.NEXT_PUBLIC_PADDLE_TOKEN,
      });
    }

    return paddleRef.current;
  };

  const openPaddleCheckout = async (txnId) => {
    try {
      const paddle = await getPaddle();

      if (!paddle) {
        console.error("Paddle not initialized");
        return;
      }

      paddle.Checkout.open({
        transactionId: txnId,
      });

    } catch (err) {
      console.error("Paddle error:", err);
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

      <h1 className="text-4xl font-semibold tracking-tight text-center text-gray-900 mb-6">
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

              <div className="space-y-2 text-gray-600 text-sm">

                <p>✔ Up to {p.max_campaigns} Campaigns</p>
                <p>
                  ✔ {formatNumber(p.max_monthly_clicks)} Clicks / month
                </p>

                <p>✔ Real-time Traffic Analytics</p>
                <p>✔ Advanced Traffic Filtering</p>
                <p>✔ AI-based Bot Detection</p>

                <p>✔ Smart Routing Engine</p>
                <p>✔ Geo & Device Targeting</p>
                <p>✔ IP Reputation Analysis</p>

                <p>✔ VPN / Proxy Detection</p>
                <p>✔ Secure Tracking Infrastructure</p>
                <p>✔ High-speed Redirect System</p>

                <p>✔ Campaign Performance Insights</p>
                <p>✔ Traffic Quality Monitoring</p>
                <p>✔ Scalable Cloud Processing</p>

              </div>

              <button
                disabled={isCurrent && !expired}
                onClick={async () => {
                  try {
                    const res = await api.post(`/billing/create-checkout/${p.id}`);

                    console.log("API RESPONSE:", res.data);

                    const txnId = res?.data?.txn_id;

                    // ✅ DEBUG YAHAN ADD KARO
                    console.log("ENV:", process.env.NEXT_PUBLIC_PADDLE_ENV);
                    console.log("TOKEN:", process.env.NEXT_PUBLIC_PADDLE_TOKEN);
                    console.log("TXN ID:", txnId);

                    if (!txnId) {
                      toast.error("Checkout failed");
                      return;
                    }

                    await openPaddleCheckout(txnId);

                  } catch (err) {
                    console.error(err);
                    toast.error("Payment error");
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