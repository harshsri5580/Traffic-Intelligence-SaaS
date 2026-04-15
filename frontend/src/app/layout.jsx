import "./globals.css";
import { Toaster } from "react-hot-toast";
import LayoutWrapper from "./components/LayoutWrapper"; // 👈 NEW

export const metadata = {
  title: "TrafficIntel AI",
  description: "AI-powered Traffic Intelligence Platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        <LayoutWrapper>
          {children}
        </LayoutWrapper>

        <Toaster position="top-right" />

      </body>
    </html>
  );
}