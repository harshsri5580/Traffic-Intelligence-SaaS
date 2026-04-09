"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    // ✅ Dashboard par header hide
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin")
    ) {
        return null;
    }

    return (
        <div className="w-full bg-white shadow-sm sticky top-0 z-50">
            <div className="flex justify-between items-center px-6 py-4">

                <Link href="/" className="text-xl font-bold">
                    FlowIntel
                </Link>

                {!isLoggedIn && (
                    <div className="space-x-4">

                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                            Login
                        </Link>

                        <Link
                            href="/register"
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                            Get Started
                        </Link>

                    </div>
                )}

            </div>
        </div>
    );
}