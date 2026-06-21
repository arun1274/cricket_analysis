"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        
        // Fetch profile to resolve the role
        const profileRes = await api.get("/profile", {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });
        
        const userRole = profileRes.data.role === "USER" ? "player" : "coach";
        localStorage.setItem("userRole", userRole);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 select-none">
      <div className="my-auto max-w-md w-full mx-auto space-y-8">
        
        {/* Logo and Welcome */}
        <div className="text-center">
          <div className="relative w-28 h-32 mx-auto mb-6">
            <Image
              src="/cpi-logo.png"
              alt="CPI Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">WELCOME</h1>
          <p className="text-zinc-400 text-lg font-bold">Cricket Performance Index</p>
        </div>

        {/* Main form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-950 border-2 border-red-500 text-red-200 p-4 rounded-xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-black tracking-wide text-zinc-300 block">EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-semibold focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black tracking-wide text-zinc-300 block">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-semibold focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-black transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-white shadow-xl"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            ) : (
              "SIGN IN"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <Link
            href="/signup"
            className="text-orange-500 hover:text-orange-400 text-lg font-black tracking-wide block py-2.5"
          >
            CREATE NEW ACCOUNT
          </Link>
        </div>

      </div>

      <div className="text-center text-xs text-zinc-600 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}
