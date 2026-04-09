"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../services/api";

export default function Home() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get("/billing/plans");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.plans || [];

      const sorted = data.sort((a, b) => a.price - b.price);
      setPlans(sorted);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">



      {/* HERO */}
      <div className="text-center py-20 px-6">
        <h1 className="text-5xl font-extrabold mb-6">
          Understand Your Traffic. Improve Performance. Grow Faster 🚀
        </h1>

        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          FlowIntel is a modern analytics platform that helps you monitor traffic,
          understand user behavior, and optimize your campaigns with real-time insights.
        </p>

        <Link
          href="/register"
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700"
        >
          Start Free Trial
        </Link>
      </div>

      {/* FEATURES */}
      <div className="grid md:grid-cols-3 gap-6 px-10 pb-20">

        {[
          "Real-time Traffic Analytics",
          "User Behavior Insights",
          "Campaign Performance Tracking",
          "Geographic & Device Insights",
          "Traffic Quality Monitoring",
          "Smart Reporting Dashboard",
        ].map((f, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow text-center">
            <h3 className="font-semibold text-lg">{f}</h3>
          </div>
        ))}

      </div>

      {/* TRUST SECTION */}
      <div className="text-center pb-20 px-6">
        <h2 className="text-2xl font-bold mb-4">
          Built for Modern Marketers & Businesses
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto">
          Our platform provides transparent analytics, reliable performance insights,
          and scalable infrastructure designed for businesses of all sizes.
        </p>
      </div>

      {/* PRICING */}
      <div className="bg-white py-20">

        <h2 className="text-3xl font-bold text-center mb-12">
          Simple & Transparent Pricing
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">

          {plans.map((p) => {
            const isPopular = p.name.toLowerCase().includes("pro");

            return (
              <div
                key={p.id}
                className={`relative p-8 rounded-2xl border shadow-lg
                ${isPopular ? "border-indigo-600 scale-105" : "bg-gray-50"}`}
              >
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
                  <span className="text-sm text-gray-500"> /mo</span>
                </p>

                <div className="space-y-3 text-gray-600 text-sm">
                  <p>✔ {p.max_campaigns} Campaigns</p>
                  <p>✔ {p.max_monthly_clicks || "Unlimited"} Events</p>
                  <p>✔ Real-time Analytics</p>
                  <p>✔ Performance Insights</p>
                  <p>✔ Reporting Dashboard</p>
                </div>

                <Link
                  href="/register"
                  className="mt-8 block text-center bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Start Free Trial
                </Link>
              </div>
            );
          })}

        </div>
      </div>


    </div>
  );
}