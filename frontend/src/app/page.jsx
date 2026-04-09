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
      <div className="text-center py-24 px-6">
        <h1 className="text-5xl font-extrabold mb-6">
          Smart Traffic Analytics for Better Decisions 🚀
        </h1>

        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          FlowIntel helps businesses understand traffic patterns, monitor user interactions,
          and improve performance using real-time analytics and clear insights.
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
          "Real-time Traffic Monitoring",
          "User Behavior Analysis",
          "Campaign Performance Tracking",
          "Geo & Device Insights",
          "Reliable Data Processing",
          "Simple Reporting Dashboard",
        ].map((f, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow text-center">
            <h3 className="font-semibold text-lg">{f}</h3>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div className="bg-white py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">
          How FlowIntel Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-center">
          <div>
            <h3 className="font-semibold mb-2">1. Create Campaign</h3>
            <p className="text-gray-600 text-sm">
              Set up your campaign and generate tracking links.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Track Traffic</h3>
            <p className="text-gray-600 text-sm">
              Monitor incoming traffic and user activity in real-time.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Analyze & Optimize</h3>
            <p className="text-gray-600 text-sm">
              Use insights to improve performance and make better decisions.
            </p>
          </div>
        </div>
      </div>

      {/* TRUST SECTION */}
      <div className="text-center py-20 px-6">
        <h2 className="text-2xl font-bold mb-4">
          Trusted Analytics Platform
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto">
          FlowIntel is designed to provide transparent analytics and reliable insights.
          Our system focuses on data accuracy, performance monitoring, and scalability.
        </p>
      </div>

      {/* SECURITY SECTION (VERY IMPORTANT FOR APPROVAL) */}
      <div className="bg-white py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-6">
          Secure & Reliable
        </h2>

        <p className="text-gray-600 max-w-3xl mx-auto text-center">
          We prioritize user data security and platform reliability. All data is handled
          with industry-standard practices, ensuring privacy and safe processing.
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

      {/* FINAL CTA */}
      <div className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Get Started?
        </h2>

        <p className="text-gray-600 mb-6">
          Start using FlowIntel today and gain better insights into your traffic.
        </p>

        <Link
          href="/register"
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700"
        >
          Create Account
        </Link>
      </div>

    </div>
  );
}