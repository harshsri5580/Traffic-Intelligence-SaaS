"use client";
import { useEffect, useRef, useState } from "react";
import api from "../../../services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";




export default function LoginPage() {

  const router = useRouter();
  const errorRef = useRef("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    if (errorRef.current) {
      setErrorMsg(errorRef.current);
    }
  }, []);

  const validate = () => {
    if (!email || !password) {
      return "Enter email & password";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email";
    }

    if (password.length < 6) {
      return "Password too short";
    }

    return null;
  };

  const login = async () => {

    if (loading) return;

    // 🔥 VALIDATION HANDLE (NO STATE CONFLICT)
    let error = "";

    if (!email || !password) {
      error = "Enter email & password";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        error = "Invalid email";
      } else if (password.length < 6) {
        error = "Password too short";
      }
    }

    if (error) {
      setErrorMsg(error); // ✅ UI me dikhega
      toast.error(error, { duration: 4000 }); // ✅ toast stable
      return;
    }

    setErrorMsg(""); // ✅ sirf valid hone ke baad clear

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const token = res?.data?.access_token;
      const role = res?.data?.user?.role || "member";

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      const sub = await api.get("/billing/my-subscription");

      if (role === "admin") {
        router.push("/admin");
      } else if (!sub.data?.plan) {
        router.push("/dashboard/pricing");
      } else {
        router.push("/dashboard");
      }

    } catch (error) {

      let msg = "";

      if (typeof error?.response?.data === "string") {
        msg = error.response.data;
      } else if (error?.response?.data?.detail) {
        msg = error.response.data.detail;
      }

      msg = msg.toLowerCase();

      let finalMsg = "Login failed ❌";

      if (msg.includes("invalid")) {
        finalMsg = "Wrong email or password ❌";
      } else if (msg.includes("verify")) {
        finalMsg = "Verify your email first 📩";
      } else if (msg.includes("blocked")) {
        finalMsg = "Account blocked 🚫";
      }

      // ✅ YAHAN ADD KARO
      errorRef.current = finalMsg;

      setErrorMsg(finalMsg);
      toast.error(finalMsg, { duration: 4000 });

    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

      {/* FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
        noValidate
        className="relative z-10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl rounded-2xl w-full max-w-md border border-white/10"
      >

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-6 text-center">
          Welcome Back 👋
        </h1>

        {/* EMAIL */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          className="bg-black/40 border border-white/10 p-3 w-full mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* FORGOT */}
        <div className="text-right mb-4">
          <Link href="/forgot-password" className="text-sm text-indigo-400 hover:underline">
            Forgot Password?
          </Link>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white w-full py-3 rounded-lg font-semibold transition shadow-lg shadow-indigo-600/30"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* FOOTER */}
        <p className="text-center text-sm mt-4 text-gray-400">
          Don’t have an account?
          <Link href="/register" className="text-indigo-400 ml-1 font-medium">
            Register
          </Link>
        </p>

      </form>
    </div>
  );
}