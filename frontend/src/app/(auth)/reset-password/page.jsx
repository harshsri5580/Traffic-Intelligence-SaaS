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
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-6 shadow rounded w-96">

        <h2 className="text-xl mb-4">Reset Password</h2>

        <input
          className="border p-2 w-full mb-2"
          placeholder="OTP"
          onChange={(e)=>setOtp(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          type="password"
          placeholder="New Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={reset}
          className="bg-green-600 text-white w-full p-2 rounded"
        >
          Reset Password
        </button>

      </div>
    </div>
  );
}