import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Traffic Intelligence SaaS",
  description: "Advanced Traffic Intelligence Cloaker SaaS Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="app-body">
        {children}
        <Toaster position="top-right" />
        
      </body>
    </html>
  );
}