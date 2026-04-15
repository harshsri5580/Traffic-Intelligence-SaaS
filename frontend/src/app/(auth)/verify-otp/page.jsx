"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";
import toast from "react-hot-toast";

export default function VerifyOTPPage() {

  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState(""); // ✅ FIX
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ SAFE PARAM FETCH (NO SSR ERROR)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");

    if (!emailParam) {
      toast.error("Invalid access");
      router.push("/register");
    } else {
      setEmail(emailParam);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const saved = localStorage.getItem("otp_timer");

    if (saved) {
      const diff = Math.floor((Date.now() - parseInt(saved)) / 1000);
      if (diff < 60) setCooldown(60 - diff);
    }
  }, []);



  const verify = async () => {

    if (!otp || otp.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/verify-email", {
        email,
        otp,
      });

      toast.success("Email verified successfully ✅");

      setTimeout(() => {
        router.push("/login");
      }, 1000);

    } catch (e) {

      let msg = "Invalid or expired OTP ❌";

      if (typeof e?.response?.data === "string") {
        msg = e.response.data;
      } else if (e?.response?.data?.detail) {
        msg = e.response.data.detail;
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

      {/* CARD */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl rounded-2xl w-full max-w-md border border-white/10 text-center">

        {/* TITLE */}
        <h1 className="text-2xl font-bold mb-3">
          Verify Email ✉️
        </h1>

        <p className="text-sm text-gray-400 mb-6">
          Enter OTP sent to <br />
          <span className="font-semibold text-white">{email}</span>
        </p>

        {/* OTP INPUT */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setOtp(val);
          }}
          className="bg-black/40 border border-white/10 p-3 w-full mb-4 rounded-lg text-center text-xl tracking-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
          placeholder="••••••"
        />

        {/* VERIFY BUTTON */}
        <button
          onClick={verify}
          disabled={loading || otp.length !== 6}
          className={`w-full py-3 rounded-lg font-semibold transition shadow-lg
        ${loading || otp.length !== 6
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white shadow-indigo-600/30"
            }`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* RESEND */}
        <button
          onClick={async () => {
            if (cooldown > 0) return;

            try {
              await api.post("/auth/resend-otp", { email });

              toast.success("OTP resent 📩");

              localStorage.setItem("otp_timer", Date.now());
              setCooldown(60);

            } catch {
              toast.error("Failed to resend");
            }
          }}
          disabled={cooldown > 0}
          className={`mt-4 text-sm transition
        ${cooldown > 0
              ? "text-gray-500 cursor-not-allowed"
              : "text-indigo-400 hover:underline"
            }`}
        >
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend OTP"}
        </button>

      </div>
    </div>
  );
}