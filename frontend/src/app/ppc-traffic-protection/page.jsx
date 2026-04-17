export const metadata = {
    title: "PPC Traffic Protection Tool (2026) | Stop Fake Clicks & Save Budget",
    description:
        "Protect your PPC campaigns from fake clicks, bots, and invalid traffic. Improve ROI with real-time traffic protection and smart filtering.",
};

import Link from "next/link";

export default function PPCTrafficProtection() {
    return (
        <div className="bg-black text-white">

            {/* HERO (CENTER + METRICS STYLE 🔥) */}
            <section className="py-24 text-center max-w-5xl mx-auto px-6">
                <h1 className="text-5xl font-extrabold mb-6">
                    PPC Traffic Protection 🔐
                </h1>

                <p className="text-gray-400 text-lg mb-10">
                    Stop fake clicks, protect your ad spend, and maximize ROI with advanced traffic filtering.
                </p>

                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-2xl font-bold text-green-400">+32%</p>
                        <p className="text-xs text-gray-400">ROI Increase</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-2xl font-bold text-red-400">-45%</p>
                        <p className="text-xs text-gray-400">Fake Clicks</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-2xl font-bold text-indigo-400">Real-time</p>
                        <p className="text-xs text-gray-400">Protection</p>
                    </div>
                </div>

                <Link
                    href="/register"
                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold shadow-lg hover:opacity-90"
                >
                    Start Free Trial
                </Link>
            </section>

            {/* PROBLEM + SOLUTION SPLIT */}
            <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">

                <div className="bg-white/5 p-8 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold mb-4 text-red-400">
                        The Problem ❌
                    </h2>

                    <ul className="space-y-3 text-gray-400 text-sm">
                        <li>• Bots clicking your ads</li>
                        <li>• Competitors draining budget</li>
                        <li>• VPN users faking conversions</li>
                        <li>• Low-quality traffic wasting money</li>
                    </ul>
                </div>

                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-8 rounded-xl border border-white/10">
                    <h2 className="text-2xl font-bold mb-4 text-green-400">
                        Our Solution ✅
                    </h2>

                    <ul className="space-y-3 text-gray-200 text-sm">
                        <li>✔ Smart bot filtering</li>
                        <li>✔ Real-time click analysis</li>
                        <li>✔ IP & geo blocking</li>
                        <li>✔ Clean traffic delivery</li>
                    </ul>
                </div>

            </section>

            {/* FEATURES (HORIZONTAL CARDS 🔥) */}
            <section className="max-w-6xl mx-auto px-6 py-16 space-y-6">

                {[
                    "Real-time click monitoring",
                    "Advanced bot & VPN detection",
                    "IP blocking & blacklist system",
                    "Geo & device targeting filters",
                    "Campaign protection automation",
                ].map((feature, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500 transition"
                    >
                        <p className="text-gray-300">{feature}</p>
                        <span className="text-indigo-400 font-semibold">✔ Active</span>
                    </div>
                ))}

            </section>

            {/* COMPARISON BLOCK */}
            <section className="max-w-6xl mx-auto px-6 py-16">

                <h2 className="text-3xl font-bold text-center mb-10">
                    Without vs With Protection ⚔️
                </h2>

                <div className="grid md:grid-cols-2 gap-8">

                    <div className="p-8 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="font-bold mb-4 text-red-400">Without Protection ❌</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li>• High fake traffic</li>
                            <li>• Low conversions</li>
                            <li>• Wasted ad spend</li>
                            <li>• Risk of account bans</li>
                        </ul>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-white/10">
                        <h3 className="font-bold mb-4 text-green-400">With TrafficIntel ✅</h3>
                        <ul className="space-y-2 text-gray-200 text-sm">
                            <li>✔ Clean traffic only</li>
                            <li>✔ Higher conversions</li>
                            <li>✔ Better ROI</li>
                            <li>✔ Safer campaigns</li>
                        </ul>
                    </div>

                </div>

            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <h2 className="text-4xl font-bold mb-6">
                    Protect Your PPC Campaigns Now 🚀
                </h2>

                <p className="text-gray-400 mb-8">
                    Stop wasting budget and start scaling profitable campaigns.
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