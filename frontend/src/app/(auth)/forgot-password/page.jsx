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
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-6 shadow rounded w-96">
        <h2 className="text-xl mb-4">Forgot Password</h2>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <button onClick={send} className="bg-indigo-600 text-white w-full p-2 rounded">
          Send OTP
        </button>
      </div>
    </div>
  );
}