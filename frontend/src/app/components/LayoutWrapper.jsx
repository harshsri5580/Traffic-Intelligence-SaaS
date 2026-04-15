"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();

    const isPrivate =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin");

    return (
        <div
            className={
                isPrivate
                    ? "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 min-h-screen"
                    : "bg-black text-white min-h-screen"
            }
        >
            {!isPrivate && <Header />}

            <main className={isPrivate ? "" : "min-h-[80vh]"}>
                {children}
            </main>

            {!isPrivate && <Footer />}
        </div>
    );
}