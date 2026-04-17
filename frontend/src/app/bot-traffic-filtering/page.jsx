export const metadata = {
    title: "Block Bot & Fake Traffic Instantly (2026) | TrafficIntel AI",
    description:
        "Detect and block bot traffic, fake clicks, and VPN users in real-time. Protect your campaigns and increase ROI with TrafficIntel AI.",
};

import Link from "next/link";

export default function BotTrafficFilteringPage() {
    return (
        <div className="bg-black text-white">

            {/* HERO */}
            <section className="py-24 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

                <div>
                    <h1 className="text-5xl font-extrabold mb-6">
                        Block Bot Traffic Instantly 🛡️
                    </h1>

                    <p className="text-gray-400 text-lg mb-8">
                        Stop fake clicks, protect your ad budget, and filter low-quality traffic in real-time.
                    </p>

                    <Link
                        href="/register"
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold shadow-lg hover:opacity-90"
                    >
                        Start Free Trial
                    </Link>
                </div>

                {/* VISUAL BOX */}
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-10 rounded-2xl border border-white/10 backdrop-blur">
                    <p className="text-lg mb-4 font-semibold">Traffic Breakdown</p>

                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between">
                            <span>Real Users</span>
                            <span className="text-green-400">72%</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Bot Traffic</span>
                            <span className="text-red-400">18%</span>
                        </p>
                        <p className="flex justify-between">
                            <span>VPN / Proxy</span>
                            <span className="text-yellow-400">10%</span>
                        </p>
                    </div>
                </div>

            </section>

            {/* PROBLEM */}
            <section className="max-w-5xl mx-auto px-6 py-16 text-center">
                <h2 className="text-3xl font-bold mb-6">
                    You're Losing Money on Fake Clicks 💸
                </h2>

                <p className="text-gray-400">
                    Bots, competitors, and low-quality traffic can destroy your campaigns.
                    Without proper filtering, you waste budget and get poor results.
                </p>
            </section>

            {/* FEATURES GRID (DIFFERENT STYLE) */}
            <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">

                {[
                    {
                        title: "AI Bot Detection",
                        desc: "Automatically detect and block advanced bots in real-time.",
                    },
                    {
                        title: "VPN & Proxy Filtering",
                        desc: "Stop fake users hiding behind VPNs and proxies.",
                    },
                    {
                        title: "IP Reputation Analysis",
                        desc: "Identify suspicious IPs and block them instantly.",
                    },
                    {
                        title: "Behavior Tracking",
                        desc: "Analyze user behavior to detect invalid clicks.",
                    },
                ].map((f, i) => (
                    <div
                        key={i}
                        className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                        <p className="text-gray-400 text-sm">{f.desc}</p>
                    </div>
                ))}

            </section>

            {/* HOW IT WORKS (STEP DESIGN 🔥) */}
            <section className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">
                    How It Works ⚙️
                </h2>

                <div className="grid md:grid-cols-3 gap-8 text-center">

                    {[
                        "User clicks your link",
                        "System analyzes traffic",
                        "Bad traffic gets blocked",
                    ].map((step, i) => (
                        <div key={i} className="p-6">
                            <div className="text-4xl font-bold text-indigo-500 mb-4">
                                {i + 1}
                            </div>
                            <p className="text-gray-300">{step}</p>
                        </div>
                    ))}

                </div>
            </section>

            {/* RESULT SECTION */}
            <section className="max-w-5xl mx-auto px-6 py-16 text-center">
                <h2 className="text-3xl font-bold mb-6">
                    Clean Traffic = Better ROI 📈
                </h2>

                <p className="text-gray-400">
                    With accurate filtering, your campaigns perform better, convert more,
                    and cost less.
                </p>
            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <h2 className="text-4xl font-bold mb-6">
                    Start Blocking Fake Traffic Today 🚀
                </h2>

                <p className="text-gray-400 mb-8">
                    Take control of your traffic and stop wasting money.
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