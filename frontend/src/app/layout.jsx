import "./globals.css";
import { Toaster } from "react-hot-toast";
import LayoutWrapper from "./components/LayoutWrapper"; // 👈 NEW

export const metadata = {
  metadataBase: new URL("https://www.trafficintelai.com"),

  title: {
    default: "TrafficIntelAI - Stop Fake Clicks & Protect Ads",
    template: "%s | TrafficIntelAI",
  },

  description:
    "Advanced traffic cloaker and click tracking tool to block bots, stop fake clicks, and protect your ad campaigns with AI-powered security.",

  keywords: [
    "traffic cloaker",
    "click tracking tool",
    "bot protection",
    "fake click protection",
    "ppc traffic protection",
    "ad fraud prevention",
  ],

  icons: {
    icon: "/favicon.ico",
  },

  alternates: {
    canonical: "https://www.trafficintelai.com",
  },

  openGraph: {
    title: "TrafficIntelAI - Smart Traffic Protection",
    description:
      "Stop bot traffic, protect your ads and increase ROI with AI-powered cloaking.",
    url: "https://www.trafficintelai.com",
    siteName: "TrafficIntelAI",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "TrafficIntelAI - Stop Fake Clicks",
    description:
      "Protect your campaigns from bots and fake clicks using AI.",
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