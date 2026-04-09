import "./globals.css";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata = {
  title: "FlowIntel",
  description: "Analytics Platform for Traffic Insights & Performance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">

        {/* 🔥 HEADER */}
        <Header />

        {/* 🔥 PAGE CONTENT */}
        <main className="min-h-[80vh]">
          {children}
        </main>

        {/* 🔥 FOOTER */}
        <Footer />



        <Toaster position="top-right" />

      </body>
    </html>
  );
}