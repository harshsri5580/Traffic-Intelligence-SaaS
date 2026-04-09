"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    // ✅ Hide on ALL private routes
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin")
    ) {
        return null;
    }

    return (
        <div className="bg-white border-t mt-10">
            <div className="max-w-6xl mx-auto px-6 py-10 text-center">

                <h2 className="font-semibold text-lg mb-4">FlowIntel</h2>

                <div className="flex justify-center gap-6 text-sm text-gray-600 mb-4">
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                    <Link href="/contact">Contact</Link>
                </div>

                <p className="text-gray-500 text-xs">
                    © 2026 FlowIntel — Analytics Platform
                </p>

            </div>
        </div>
    );
}