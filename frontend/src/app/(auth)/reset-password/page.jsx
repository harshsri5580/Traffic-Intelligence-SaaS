"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";
import toast from "react-hot-toast";

export default function ResetPassword() {

  const router = useRouter();

  const [email, setEmail] = useState(""); // ✅ FIX
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  // ✅ SAFE WAY (NO SSR ERROR)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
  }, []);

  const reset = async () => {
    try {

      await api.post("/auth/reset-password", {
        email,
        otp,
        new_password: password
      });

      toast.success("Password updated ✅");
      router.push("/login");

    } catch {
      toast.error("Invalid OTP ❌");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

      {/* CARD */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl rounded-2xl w-full max-w-md border border-white/10">

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          Reset Password 🔐
        </h2>

        {/* OTP INPUT */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 text-center tracking-widest"
          placeholder="Enter OTP"
          onChange={(e) => setOtp(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          type="password"
          placeholder="New Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={reset}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white w-full py-3 rounded-lg font-semibold transition shadow-lg shadow-green-500/30"
        >
          Reset Password
        </button>

      </div>
    </div>
  );
}