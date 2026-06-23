"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2 } from "lucide-react";

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

  // Invitation Code states
  const [invitationCode, setInvitationCode] = useState("");
  const [codeValidated, setCodeValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validatedPlayerName, setValidatedPlayerName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleValidateCode = async () => {
    if (!invitationCode.trim()) {
      setError("Please enter a player invitation code.");
      return;
    }
    setError("");
    setValidating(true);
    try {
      const res = await api.get(`/auth/validate-code?code=${invitationCode.trim()}`);
      if (res.data.valid) {
        setCodeValidated(true);
        setValidatedPlayerName(res.data.playerName);
      } else {
        setError(res.data.message || "Invalid or already activated invitation code.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or already activated invitation code.");
    } finally {
      setValidating(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (accountType === "player") {
      if (!codeValidated) {
        setError("Please validate your invitation code first.");
        return;
      }
      if (formData.password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

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
          email: formData.email,
          password: formData.password,
          invitationCode: invitationCode.trim(),
          createOrganization: false
        };
      }

      const response = await api.post("/auth/signup", payload);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", accountType);
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "";
      if (msg.toLowerCase().includes("duplicate key") || msg.toLowerCase().includes("already exists")) {
        setError("This email address is already registered.");
      } else {
        setError(msg || "Registration failed.");
      }
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
            onClick={() => {
              setAccountType("coach");
              setError("");
            }}
            className={`py-4 text-center rounded-xl text-xl font-black transition-all cursor-pointer ${
              accountType === "coach"
                ? "bg-orange-500 text-black shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            COACH
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType("player");
              setError("");
            }}
            className={`py-4 text-center rounded-xl text-xl font-black transition-all cursor-pointer ${
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
            <div className="bg-red-950 border-2 border-red-500 text-red-200 p-4 rounded-xl text-sm font-bold text-center uppercase tracking-wide">
              {error}
            </div>
          )}

          {accountType === "coach" ? (
            <>
              <div className="space-y-2 text-left">
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

              <div className="space-y-2 text-left">
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

              <div className="space-y-2 text-left">
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
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "REGISTER"}
              </button>
            </>
          ) : (
            // Player Sign Up Flow
            <div className="space-y-6">
              {!codeValidated ? (
                <>
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-black tracking-wide text-zinc-300 block">PLAYER INVITATION CODE</label>
                    <input
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-mono uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="CPI-XXXXXX"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleValidateCode}
                    disabled={validating}
                    className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4 text-base font-black transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-white shadow-xl"
                  >
                    {validating ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : "VALIDATE CODE"}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 flex items-center gap-3 text-left">
                    <CheckCircle2 className="w-8 h-8 text-orange-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">LINKED PROFILE</span>
                      <span className="text-lg font-black text-white uppercase">{validatedPlayerName}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
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

                  <div className="space-y-2 text-left">
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

                  <div className="space-y-2 text-left">
                    <label className="text-sm font-black tracking-wide text-zinc-300 block">CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-lg text-white font-semibold focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-black transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-white shadow-xl"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "REGISTER & ACTIVATE"}
                  </button>
                </>
              )}
            </div>
          )}
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

      <div className="text-center text-xs text-zinc-650 font-bold uppercase tracking-widest py-4">
        Mobile Sunlight Optimized • Simple UX
      </div>
    </div>
  );
}
