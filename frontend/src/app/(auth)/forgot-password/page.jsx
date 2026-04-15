"use client";

import { useState } from "react";
import api from "../../../services/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ForgotPassword() {

  const router = useRouter();
  const [email, setEmail] = useState("");

  const send = async () => {
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent 📩");
      router.push(`/reset-password?email=${email}`);
    } catch {
      toast.error("User not found");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

      {/* CARD */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl rounded-2xl w-full max-w-md border border-white/10 text-center">

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-3">
          Forgot Password 🔐
        </h2>

        <p className="text-sm text-gray-400 mb-6">
          Enter your email to receive a verification OTP
        </p>

        {/* EMAIL INPUT */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={send}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white w-full py-3 rounded-lg font-semibold transition shadow-lg shadow-indigo-600/30"
        >
          Send OTP
        </button>

      </div>
    </div>
  );
}