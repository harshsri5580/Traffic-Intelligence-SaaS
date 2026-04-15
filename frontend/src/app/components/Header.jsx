"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("/api/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => setIsLoggedIn(res.ok))
            .catch(() => setIsLoggedIn(false));
    }, []);

    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin")
    ) {
        return null;
    }

    return (
        <header className="w-full sticky top-0 z-50 bg-black border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">

            <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">

                {/* LOGO */}
                <Link href="/" className="text-2xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                        TrafficIntel AI
                    </span>
                </Link>

                {/* NAV */}
                {/* <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
                    <a href="#features" className="hover:text-white transition">Features</a>
                    <a href="#pricing" className="hover:text-white transition">Pricing</a>
                    <a href="#usecases" className="hover:text-white transition">Use Cases</a>
                </nav> */}

                {/* RIGHT */}
                <div className="flex items-center gap-4">

                    {!isLoggedIn ? (
                        <>
                            <Link
                                href="/login"
                                className="text-sm text-gray-400 hover:text-white transition"
                            >
                                Login
                            </Link>

                            <Link
                                href="/register"
                                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:scale-105 transition"
                            >
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/dashboard"
                                className="text-sm text-gray-400 hover:text-white transition"
                            >
                                Dashboard
                            </Link>

                            <button
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    window.location.href = "/";
                                }}
                                className="text-sm text-red-400 hover:text-red-500 transition"
                            >
                                Logout
                            </button>
                        </>
                    )}

                </div>
            </div>
        </header>
    );
}