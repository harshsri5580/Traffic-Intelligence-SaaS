"use client";

import { useState } from "react";
import api from "../../../services/api";
import Link from "next/link";

export default function RegisterPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 VALIDATION
  const validate = () => {

    if (!email || !password) {
      alert("Please fill all fields");
      return false;
    }

    // email format
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format");
      return false;
    }

    // password rule
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

const register = async () => {
  if (!validate()) return;

  try {
    setLoading(true);

   await api.post("/auth/register", {
  email: email.trim(),
  password: password.trim(),
});

    alert("Registration successful");
    window.location.href = "/login";

  } catch (e) {
    console.error(e);
    console.log("FULL ERROR:", e.response?.data);

alert(
  typeof e?.response?.data === "string"
    ? e.response.data
    : JSON.stringify(e.response?.data)
);
  } finally {
    setLoading(false);
  }
};

  return (

    <div className="flex h-screen items-center justify-center bg-gray-100">

      <div className="bg-white p-8 shadow-lg rounded w-96">

        <h1 className="text-2xl font-semibold mb-6 text-center">
          Register
        </h1>

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-4 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={register}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white w-full p-2 rounded"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

       <p className="text-center text-sm mt-4">
  Already have an account?
  <Link href="/login" className="text-blue-500 ml-1">
    Login
  </Link>
</p>
      </div>

    </div>

  );
}