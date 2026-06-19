"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowRight, Loader2, Building, UserPlus, Info } from "lucide-react";

type SignupOption = "create" | "join";

export default function SignupPage() {
  const router = useRouter();
  const [option, setOption] = useState<SignupOption>("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    organizationType: "Academy",
    sport: "Cricket",
    country: "",
    city: "",
    description: "",
    joinCode: ""
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        createOrganization: option === "create",
        organizationName: option === "create" ? formData.organizationName : "",
        organizationType: option === "create" ? formData.organizationType : "",
        sport: option === "create" ? formData.sport : "",
        country: option === "create" ? formData.country : "",
        city: option === "create" ? formData.city : "",
        description: option === "create" ? formData.description : "",
        joinCode: option === "join" ? formData.joinCode : ""
      };

      const response = await api.post("/auth/signup", payload);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-xl mx-auto mb-4 shadow-lg shadow-orange-500/20">
            C
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Create Your Account</h1>
          <p className="text-zinc-400">Join the premier sports performance analytics platform</p>
        </div>

        {/* Option Selection Tab Switcher */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex gap-2 mb-6 backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setOption("create"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
              option === "create"
                ? "bg-orange-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Building className="w-4 h-4" />
            Create Organization
          </button>
          <button
            type="button"
            onClick={() => { setOption("join"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
              option === "join"
                ? "bg-orange-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Join As Coach
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Core User Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Coach Carter"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="coach@team.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Dynamic Form Segment */}
            <AnimatePresence mode="wait">
              {option === "create" ? (
                <motion.div
                  key="create-org"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 pt-4 border-t border-white/10"
                >
                  <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Organization Profile
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Organization Name</label>
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        required={option === "create"}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        placeholder="E.g. Melbourne Cricket Academy"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Organization Type</label>
                      <select
                        name="organizationType"
                        value={formData.organizationType}
                        onChange={handleInputChange}
                        className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors cursor-pointer"
                      >
                        <option value="Academy" className="bg-[#0f0f0f]">Academy</option>
                        <option value="School" className="bg-[#0f0f0f]">School</option>
                        <option value="Club" className="bg-[#0f0f0f]">Club</option>
                        <option value="Professional Team" className="bg-[#0f0f0f]">Professional Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Sport</label>
                      <input
                        type="text"
                        name="sport"
                        value={formData.sport}
                        onChange={handleInputChange}
                        required={option === "create"}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        placeholder="E.g. Cricket"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required={option === "create"}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        placeholder="Australia"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required={option === "create"}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        placeholder="Melbourne"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                      placeholder="Brief details about your sports organization..."
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="join-org"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 pt-4 border-t border-white/10"
                >
                  <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Enter Organization Code
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Join Code</label>
                    <input
                      type="text"
                      name="joinCode"
                      value={formData.joinCode}
                      onChange={handleInputChange}
                      required={option === "join"}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors uppercase tracking-wider font-mono text-center text-lg"
                      placeholder="X1Y2Z3A4"
                    />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      Entering the join code will link your coach account to the specific sports organization. 
                      Once you submit, your account will enter <strong>Pending Approval</strong> until approved by the administrator.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 hover:shadow-orange-600/35 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {option === "create" ? "Register & Create Organization" : "Apply to Join as Coach"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
