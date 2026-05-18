"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../services/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const [plans, setPlans] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    const txn = new URLSearchParams(window.location.search).get("_ptxn");
    if (txn) router.push("/dashboard?payment=success");
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get("/billing/plans");
      const data = Array.isArray(res.data) ? res.data : res.data?.plans || [];
      setPlans(data.sort((a, b) => a.price - b.price));
    } catch { }
  };

  const formatNumber = (num) => {
    if (!num) return "Unlimited";

    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".0", "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(".0", "") + "K";

    return num;
  };

  return (
    <div className="bg-black text-white min-h-screen">


      {/* HERO */}
      <div className="relative text-center py-20 py-12 py-14 md:py-16 px-6 overflow-hidden">

        {/* MULTI LAYER BACKGROUND */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 blur-[100px] rounded-full"></div>

        {/* CONTENT */}
        <div className="relative z-10 max-w-5xl mx-auto">

          {/* SMALL TAG */}
          <div className="inline-block mb-6 px-4 py-1.5 text-sm rounded-full border border-white/10 bg-white/5 backdrop-blur text-gray-300">
            🚀 AI-Powered Traffic Intelligence
          </div>

          {/* HEADING */}
          <h1 className="text-5xl md:text-7xl font-semibold leading-tight tracking-tight">

            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              Control Your Traffic
            </span>

            <br />

            <span className="text-white">
              Like a Pro
            </span>

          </h1>

          {/* SUBTEXT */}
          <p className="text-gray-400 max-w-2xl mx-auto mt-6 text-lg leading-relaxed">
            Advanced cloaking, AI-powered bot detection, and ultra-fast routing —
            built for marketers who demand performance and precision.
          </p>

          {/* BUTTONS */}
          {/* CTA */}
          <div className="mt-10 flex flex-col items-center">

            {/* BUTTON */}
            <Link
              href="/register"
              className="
      bg-gradient-to-r from-indigo-600 to-purple-600
      px-10 py-4 rounded-2xl font-semibold text-lg
      shadow-2xl shadow-indigo-600/30
      hover:scale-105 hover:shadow-indigo-500/50
      transition duration-300
    "
            >
              Start 7-Day Free Trial
            </Link>

            {/* SMALL TRUST TEXT */}
            <div className="mt-4 text-sm text-gray-500">
              No Credit Card Required
            </div>

            {/* FEATURE BAR */}
            <div className="
    mt-8
    flex flex-wrap justify-center gap-3
    max-w-4xl
  ">

              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-gray-300">
                🚀 3 Campaigns
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-gray-300">
                ⚡ 100K Clicks
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-gray-300">
                🛡️ AI Bot Detection
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-gray-300">
                📊 Real-time Analytics
              </div>

            </div>

          </div>

          {/* TRUST */}
          {/* TRUST + FREE TRIAL BENEFITS */}
          <div className="mt-14 flex flex-col items-center">

            {/* SOCIAL PROOF */}
            <div className="text-sm text-gray-500 mb-6">
              Trusted by marketers & agencies worldwide
            </div>



          </div>

        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="py-24 relative">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent blur-2xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center mb-4">
            Powerful Features 💎
          </h2>

          <p className="text-gray-400 text-center mb-14 max-w-2xl mx-auto">
            Everything you need to monitor, analyze, and optimize your traffic performance at scale.
          </p>

          <div className="grid md:grid-cols-3 gap-8">

            {/* FEATURE 1 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="font-semibold text-lg mb-2">Fraud Detection System</h3>
              <p className="text-gray-400 text-sm">
                Identify and filter suspicious traffic using intelligent risk analysis.
              </p>
            </div>

            {/* FEATURE 2 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-lg mb-2">High-Speed Processing</h3>
              <p className="text-gray-400 text-sm">
                Optimized infrastructure ensures fast request handling and minimal latency.
              </p>
            </div>

            {/* FEATURE 3 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-lg mb-2">Smart Decision Engine</h3>
              <p className="text-gray-400 text-sm">
                Apply intelligent rules to process and manage incoming traffic effectively.
              </p>
            </div>

            {/* FEATURE 4 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="font-semibold text-lg mb-2">Geo & Device Targeting</h3>
              <p className="text-gray-400 text-sm">
                Customize traffic handling based on location, device, and user context.
              </p>
            </div>

            {/* FEATURE 5 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="font-semibold text-lg mb-2">Traffic Filtering System</h3>
              <p className="text-gray-400 text-sm">
                Protect your campaigns by filtering unwanted or low-quality traffic.
              </p>
            </div>

            {/* FEATURE 6 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
              <p className="text-gray-400 text-sm">
                Monitor traffic performance with live insights and detailed reports.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* USE CASES */}
      <div id="usecases" className="py-24 relative text-center">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-transparent blur-2xl"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">

          <h2 className="text-4xl font-bold mb-4">
            Built For Growth 🚀
          </h2>

          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Designed for professionals who need advanced traffic insights and performance optimization tools.
          </p>

          <div className="grid md:grid-cols-4 gap-8">

            {/* CARD 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="font-semibold text-lg mb-2">Affiliate Marketers</h3>
              <p className="text-gray-400 text-sm">
                Track, analyze, and optimize campaign performance with precision.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-lg mb-2">Media Buyers</h3>
              <p className="text-gray-400 text-sm">
                Monitor traffic quality and maximize ROI across multiple channels.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="font-semibold text-lg mb-2">Ad Agencies</h3>
              <p className="text-gray-400 text-sm">
                Manage and scale campaigns efficiently for multiple clients.
              </p>
            </div>

            {/* CARD 4 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="font-semibold text-lg mb-2">SaaS Founders</h3>
              <p className="text-gray-400 text-sm">
                Gain actionable insights to improve traffic performance and growth.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* PERFORMANCE */}
      <div className="py-24 text-center relative">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent blur-2xl"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">

          <h2 className="text-4xl font-bold mb-4">
            High Performance Infrastructure ⚡
          </h2>

          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Built for speed, reliability, and global scalability — ensuring every click is processed instantly.
          </p>

          <div className="grid md:grid-cols-3 gap-8">

            {/* CARD 1 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">
                Ultra Fast Processing
              </h3>
              <p className="text-gray-400 text-sm">
                Optimized backend ensures rapid request handling with minimal latency.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-2">
                Global Infrastructure
              </h3>
              <p className="text-gray-400 text-sm">
                Distributed systems designed for worldwide traffic handling and reliability.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:scale-105 transition shadow-lg">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">
                Intelligent Optimization
              </h3>
              <p className="text-gray-400 text-sm">
                Smart processing and caching techniques improve performance and efficiency.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" className="py-28 relative">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent blur-2xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">

          {/* HEADER */}
          <h2 className="text-4xl font-bold text-center mb-4">
            Simple & Transparent Pricing 💎
          </h2>

          <div className="text-center mb-16">

            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your traffic infrastructure.
              No hidden fees. Cancel anytime.
            </p>

            {/* FREE TRIAL BOX */}
            <div className="
    mt-8 inline-flex flex-wrap items-center justify-center gap-3
    bg-gradient-to-r from-indigo-600/20 to-purple-600/20
    border border-indigo-500/20
    px-5 py-3 rounded-2xl
    backdrop-blur shadow-lg
  ">

              <div className="
      bg-green-500/20 text-green-400
      px-3 py-1 rounded-full
      text-xs font-bold uppercase tracking-wide
    ">
                7 Days Free Trial
              </div>

              <div className="text-sm text-gray-300">
                ✔ 3 Campaigns
              </div>

              <div className="text-sm text-gray-300">
                ✔ 100K Free Clicks
              </div>

              <div className="text-sm text-gray-300">
                ✔ AI Bot Detection
              </div>

              <div className="text-sm text-gray-300">
                ✔ Real-time Analytics
              </div>

            </div>

          </div>

          {/* CARDS */}
          <div className="grid md:grid-cols-3 gap-10">

            {plans.map((p) => {
              const popular = p.name.toLowerCase().includes("pro");

              return (
                <div
                  key={p.id}
                  className={`relative p-8 rounded-2xl border backdrop-blur bg-white/5 transition
            ${popular
                      ? "border-indigo-500 scale-105 shadow-2xl shadow-indigo-500/20"
                      : "border-white/10 hover:scale-105"
                    }`}
                >

                  {/* BADGE */}
                  {popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-4 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  {/* PLAN NAME */}
                  <h3 className="text-2xl font-bold text-center mb-2">
                    {p.name}
                  </h3>

                  {/* PRICE */}
                  {/* PRICE */}
                  <div className="text-center my-6">

                    {/* DISCOUNT */}
                    {popular && (
                      <div className="flex items-center justify-center gap-3 mb-3">

                        <span className="text-2xl font-semibold text-gray-500 line-through opacity-70">
                          $79
                        </span>

                        <div className="
        bg-gradient-to-r from-red-500 to-pink-500
        text-white text-[11px] font-bold
        px-3 py-1 rounded-full
        shadow-lg uppercase tracking-wide
      ">
                          Save 13%
                        </div>

                      </div>
                    )}

                    {/* MAIN PRICE */}
                    <div className="flex items-end justify-center gap-1">

                      <span className="text-6xl font-semibold tracking-tight">
                        ${p.price}
                      </span>

                      <span className="text-lg text-gray-400 font-medium mb-2">
                        /mo
                      </span>

                    </div>

                  </div>

                  {/* FEATURES */}
                  <div className="space-y-3 text-gray-300 text-sm mb-8">

                    <p>✔ Up to {p.max_campaigns} Campaigns</p>
                    <p>
                      ✔ {formatNumber(p.max_monthly_clicks)} Clicks / month
                    </p>
                    <p>✔ Unlimited Rules</p>
                    <p>✔ Unlimited Offers</p>
                    <p>✔ Real-time Traffic Analytics</p>
                    <p>✔ Advanced Traffic Filtering</p>
                    <p>✔ AI-based Bot Detection</p>

                    <p>✔ Smart Routing Engine</p>
                    <p>✔ Geo & Device Targeting</p>
                    <p>✔ IP Reputation Analysis</p>

                    {p.enable_vpn_detection && <p>✔ VPN Detection</p>}
                    {p.enable_proxy && <p>✔ Proxy Detection</p>}
                    {p.enable_cloaker && <p>✔ Traffic Cloaking</p>}

                    <p>✔ Secure Tracking Infrastructure</p>
                    <p>✔ High-speed Redirect System</p>

                    <p>✔ Campaign Performance Insights</p>
                    <p>✔ Traffic Quality Monitoring</p>
                    <p>✔ Scalable Cloud Processing</p>
                  </div>

                  {/* CTA */}
                  <Link
                    href="/register"
                    className={`block text-center py-3 rounded-lg font-semibold transition
              ${popular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30 hover:opacity-90"
                        : "bg-white/10 hover:bg-white/20"
                      }`}
                  >
                    Start Free Trial
                  </Link>

                </div>
              );
            })}

          </div>

          {/* TRUST NOTE */}
          <p className="text-center text-gray-500 text-sm mt-16">
            Secure payments • No hidden fees • Cancel anytime
          </p>

        </div>
      </div>

      {/* TRUST */}
      <div className="py-24 relative text-center">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent blur-2xl"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">

          {/* TRUST SECTION */}
          <h2 className="text-4xl font-bold mb-4">
            Trusted by Professionals Worldwide 🌍
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Built with performance, security, and scalability at its core — designed for modern traffic management.
          </p>

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <h3 className="text-3xl font-bold text-indigo-400">99.9%</h3>
              <p className="text-gray-400 text-sm mt-2">Uptime Reliability</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <h3 className="text-3xl font-bold text-purple-400">50ms</h3>
              <p className="text-gray-400 text-sm mt-2">Avg Response Time</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
              <h3 className="text-3xl font-bold text-indigo-400">Global</h3>
              <p className="text-gray-400 text-sm mt-2">Traffic Infrastructure</p>
            </div>

          </div>

          {/* CTA */}
          <div className="border-t border-white/10 pt-16">

            <h2 className="text-4xl font-bold mb-6">
              Ready to Optimize Your Traffic? 🚀
            </h2>

            <p className="text-gray-400 mb-8">
              Start your journey with powerful analytics and intelligent traffic management tools.
            </p>

            <Link
              href="/register"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-600/30 hover:scale-105 transition"
            >
              Get Started Now
            </Link>

          </div>

        </div>
      </div>

    </div>
  );
}