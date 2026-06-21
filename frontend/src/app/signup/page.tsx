"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"coach" | "player">("coach");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let payload = {};
      if (accountType === "coach") {
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          createOrganization: true,
          organizationName: `${formData.name}'s Academy`,
          organizationType: "Academy",
          sport: "Cricket",
          country: "India",
          city: "Default"
        };
      } else {
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          createOrganization: false,
          joinCode: "" // backend will auto-assign to default/first organization
        };
      }

      const response = await api.post("/auth/signup", payload);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", accountType);
        
        // Auto-create Player profile record for Player signups so they exist in the roster
        if (accountType === "player") {
          try {
            await api.post("/players", {
              name: formData.name,
              role: "Player",
              battingStyle: "Right-hand bat",
              bowlingStyle: "None"
            });
          } catch (playerErr) {
            console.error("Failed to auto-create player roster entry", playerErr);
          }
        }

        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 select-none">
      <div className="my-auto max-w-md w-full mx-auto space-y-8">
        
        {/* Logo and Welcome */}
        <div className="text-center">
          <div className="relative w-24 h-28 mx-auto mb-4">
            <Image
              src="/cpi-logo.png"
              alt="CPI Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase">CREATE ACCOUNT</h1>
          <p className="text-zinc-400 text-lg font-bold">Join Cricket Performance Index</p>
        </div>

        {/* Account Type Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-900 border-2 border-zinc-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setAccountType("coach")}
            className={`py-4 text-center rounded-xl text-xl font-black transition-all ${
              accountType === "coach"
                ? "bg-orange-500 text-black shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            COACH
          </button>
          <button
            type="button"
            onClick={() => setAccountType("player")}
            className={`py-4 text-center rounded-xl text-xl font-black transition-all ${
              accountType === "player"
                ? "bg-orange-500 text-black shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            PLAYER
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="bg-red-950 border-2 border-red-500 text-red-200 p-4 rounded-xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-black tracking-wide text-zinc-300 block">FULL NAME</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-semibold focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black tracking-wide text-zinc-300 block">EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-semibold focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black tracking-wide text-zinc-300 block">PASSWORD</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-semibold focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter password (min 8 chars)"
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
              "REGISTER"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-orange-500 hover:text-orange-400 text-lg font-black tracking-wide block py-2"
          >
            ALREADY HAVE AN ACCOUNT? LOG IN
          </Link>
        </div>

      </div>

      <div className="text-center text-xs text-zinc-600 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}
