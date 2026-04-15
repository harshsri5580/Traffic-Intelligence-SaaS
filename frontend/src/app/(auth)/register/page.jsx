"use client";

import { useState } from "react";
import api from "../../../services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RegisterPage() {

  const router = useRouter();

  const [name, setName] = useState(""); // ✅ NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 VALIDATION
  const validate = () => {

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return false;
    }

    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const register = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name, // ✅ NEW
        email: email.trim(),
        password: password.trim(),
      });

      toast.success("OTP sent to your email 📩");

      // 🔥 REDIRECT TO OTP PAGE
      router.push(`/verify-otp?email=${email}`);

    } catch (e) {

      let msg = "Registration failed ❌";

      if (typeof e?.response?.data === "string") {
        msg = e.response.data;
      } else if (e?.response?.data?.detail) {
        msg = e.response.data.detail;
      }

      msg = msg.toLowerCase();

      if (msg.includes("already")) {
        msg = "Email already registered ❌";
      } else if (msg.includes("invalid")) {
        msg = "Invalid email ❌";
      } else if (msg.includes("temporary")) {
        msg = "Temporary email not allowed 🚫";
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
      <div className="relative z-10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl rounded-2xl w-full max-w-md border border-white/10">

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Account 🚀
        </h1>

        {/* NAME */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* EMAIL */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={register}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white w-full py-3 rounded-lg font-semibold transition shadow-lg shadow-indigo-600/30"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* FOOTER */}
        <p className="text-center text-sm mt-4 text-gray-400">
          Already have an account?
          <Link href="/login" className="text-indigo-400 ml-1 font-medium">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}