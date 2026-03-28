"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";
import toast from "react-hot-toast";

export default function VerifyOTPPage() {

  const router = useRouter();

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

    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

      <div className="bg-white p-8 shadow-xl rounded-2xl w-96 border">

        <h1 className="text-2xl font-bold text-center mb-4">
          Verify Email
        </h1>

        <p className="text-sm text-gray-600 text-center mb-6">
          Enter OTP sent to <br />
          <span className="font-semibold">{email}</span>
        </p>

        <input
          className="border p-3 w-full mb-4 rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="------"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={verify}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3 rounded-lg font-semibold transition"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          onClick={async () => {
            try {
              await api.post("/auth/resend-otp", { email });
              toast.success("OTP resent 📩");
            } catch {
              toast.error("Failed to resend");
            }
          }}
          className="mt-3 text-sm text-indigo-600 hover:underline"
        >
          Resend OTP
        </button>

      </div>

    </div>
  );
}