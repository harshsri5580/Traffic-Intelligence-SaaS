"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin")
    ) {
        return null;
    }

    return (
        <footer className="bg-black text-white border-t border-white/10 mt-20 relative overflow-hidden">

            {/* GLOW BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent blur-2xl"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-12">

                {/* BRAND */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        TrafficIntel AI
                    </h2>

                    <p className="text-gray-400 text-sm leading-relaxed">
                        AI-powered traffic intelligence platform for marketers, agencies, and SaaS founders.
                        Optimize, analyze, and scale your traffic with real-time insights.
                    </p>
                </div>

                {/* COMPANY */}
                <div>
                    <h3 className="font-semibold mb-4 text-white">Company</h3>
                    <div className="flex flex-col gap-3 text-sm text-gray-400">

                        <Link href="/contact" className="hover:text-white transition">
                            Contact
                        </Link>

                        <Link href="/privacy" className="hover:text-white transition">
                            Privacy Policy
                        </Link>

                        <Link href="/terms" className="hover:text-white transition">
                            Terms of Service
                        </Link>

                        <Link href="/refund" className="hover:text-white transition">
                            Refund Policy
                        </Link>

                    </div>
                </div>

                {/* PLATFORM */}
                <div>
                    <h3 className="font-semibold mb-4 text-white">Platform</h3>
                    <div className="flex flex-col gap-3 text-sm text-gray-400">

                        <p className="flex items-center gap-2">⚡ <span>Ultra-fast redirect engine</span></p>
                        <p className="flex items-center gap-2">🛡️ <span>Secure & private tracking</span></p>
                        <p className="flex items-center gap-2">🌍 <span>Global infrastructure</span></p>
                        <p className="flex items-center gap-2">📊 <span>Real-time analytics</span></p>

                    </div>
                </div>

            </div>

            {/* BOTTOM */}
            <div className="relative z-10 border-t border-white/10 py-6 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} TrafficIntel AI. All rights reserved.
            </div>

        </footer>
    );
}