"use client";

import "./globals.css";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

export const metadata = {
  title: "FlowIntel",
  description: "Analytics Platform for Traffic Insights & Performance",
};

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token"); // ya jo tum use kar rahe ho
    setIsLoggedIn(!!token);
  }, []);

  return (
    <html lang="en">
      <body className="bg-gray-50">

        {/* 🔥 GLOBAL HEADER */}
        <div className="w-full bg-white shadow-sm sticky top-0 z-50">
          <div className="flex justify-between items-center px-6 py-4">

            <Link href="/" className="text-xl font-bold">
              FlowIntel
            </Link>

            {/* ✅ CONDITION */}
            {!isLoggedIn && (
              <div className="space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-black">
                  Login
                </Link>

                <Link
                  href="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Get Started
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* 🔥 PAGE CONTENT */}
        <main className="min-h-[80vh]">
          {children}
        </main>

        {/* 🔥 GLOBAL FOOTER */}
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

        <Toaster position="top-right" />

      </body>
    </html>
  );
}