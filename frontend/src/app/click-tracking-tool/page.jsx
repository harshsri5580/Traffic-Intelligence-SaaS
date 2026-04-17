export const metadata = {
    title: "Best Click Tracking Tool for Ads (2026) | Traffic Intelligence",
    description:
        "Track, analyze and filter your traffic with AI-powered click tracking. Stop fake clicks, protect your ads and boost ROI.",
};

import Link from "next/link";

export default function ClickTrackingPage() {
    return (
        <div className="bg-black text-white">

            {/* HERO */}
            <section className="py-24 text-center max-w-5xl mx-auto px-6">
                <h1 className="text-5xl font-extrabold mb-6">
                    Best Click Tracking Tool for Ads 🚀
                </h1>

                <p className="text-gray-400 text-lg mb-8">
                    Track every click, block fake traffic, and optimize your campaigns with real-time analytics.
                </p>

                <Link
                    href="/register"
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold shadow-lg hover:opacity-90"
                >
                    Start Free Trial
                </Link>
            </section>

            {/* FEATURES */}
            <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
                {[
                    "Real-time Click Tracking",
                    "Advanced Bot Filtering",
                    "Smart Traffic Routing",
                    "Geo & Device Targeting",
                    "IP Blocking & Fraud Detection",
                    "Detailed Analytics Dashboard",
                ].map((f, i) => (
                    <div
                        key={i}
                        className="p-6 rounded-xl bg-white/5 border border-white/10 hover:scale-105 transition"
                    >
                        <p className="text-lg font-semibold">✔ {f}</p>
                    </div>
                ))}
            </section>

            {/* PROBLEM SECTION */}
            <section className="max-w-5xl mx-auto px-6 py-16 text-center">
                <h2 className="text-3xl font-bold mb-6">
                    Losing Money on Fake Clicks? 💸
                </h2>

                <p className="text-gray-400">
                    Most advertisers waste up to 30% of their budget on bots, VPN users, and invalid traffic.
                    Without proper tracking, you’re blind to what’s really happening.
                </p>
            </section>

            {/* SOLUTION */}
            <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-4">
                        Smart Traffic Intelligence 🧠
                    </h2>

                    <p className="text-gray-400 mb-6">
                        Our system analyzes every click in real-time and filters out bad traffic before it costs you money.
                    </p>

                    <ul className="space-y-3 text-gray-300">
                        <li>✔ AI-based bot detection</li>
                        <li>✔ Real-time analytics</li>
                        <li>✔ Smart redirect rules</li>
                        <li>✔ Campaign optimization</li>
                    </ul>
                </div>

                <div className="bg-white/5 p-8 rounded-xl border border-white/10">
                    <p className="text-xl font-semibold mb-4">Live Insights</p>
                    <p className="text-gray-400">
                        See where your traffic comes from, which clicks convert, and block low-quality sources instantly.
                    </p>
                </div>
            </section>

            {/* COMPARISON */}
            <section className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center mb-10">
                    Why Choose Us Over Others?
                </h2>

                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-bold mb-2">Others ❌</p>
                        <p className="text-gray-400 text-sm">
                            Expensive, slow tracking, no proper bot filtering
                        </p>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                        <p className="font-bold mb-2">Traffic Intelligence ✅</p>
                        <p className="text-sm">
                            Fast, accurate tracking with advanced AI filtering
                        </p>
                    </div>

                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <p className="font-bold mb-2">Old Tools ⚠️</p>
                        <p className="text-gray-400 text-sm">
                            Limited features and outdated dashboards
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <h2 className="text-4xl font-bold mb-6">
                    Start Tracking Smarter Today 🚀
                </h2>

                <p className="text-gray-400 mb-8">
                    Join now and take control of your traffic and ad spend.
                </p>

                <Link
                    href="/register"
                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold shadow-lg hover:opacity-90"
                >
                    Get Started Free
                </Link>
            </section>

        </div>
    );
}