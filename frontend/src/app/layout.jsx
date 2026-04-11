import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata = {
  title: "FlowIntel",
  description: "Analytics Platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">

        <Header />

        <main className="min-h-[80vh]">
          {children}
        </main>

        <Footer />

        <Toaster position="top-right" />

      </body>
    </html>
  );
}