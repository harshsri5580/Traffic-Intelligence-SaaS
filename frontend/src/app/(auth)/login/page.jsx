"use client";

import { useState } from "react";
import api from "../../../services/api";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      alert("Please enter email and password");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("Please enter a valid email");
      return false;
    }

    if (trimmedPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return false;
    }

    return true;
  };


 const login = async () => {
  if (!validate()) return;

  try {
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", email.trim());
    formData.append("password", password.trim());

    const res = await api.post("/api/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const token = res?.data?.access_token;
    const role = res?.data?.user?.role || "member";

    if (!token) {
      throw new Error("Invalid server response");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);

    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded w-96">
        
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Login
        </h1>

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-4 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full p-2 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* ✅ NEW PART (Register link) */}
        <p className="text-center text-sm mt-4">
  Don’t have an account?
  <Link href="/register" className="text-blue-500 ml-1">
    Register
  </Link>
</p>

      </div>
    </div>
  );
}