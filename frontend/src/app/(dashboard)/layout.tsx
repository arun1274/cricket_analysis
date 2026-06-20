"use client";

import { Sidebar } from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ShieldAlert, Clock, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"APPROVED" | "PENDING" | "REJECTED" | null>(null);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    api.get("/profile")
      .then((res) => {
        setStatus(res.data.approvalStatus || "APPROVED");
        setOrgName(res.data.organization?.name || "the Organization");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        localStorage.removeItem("token");
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle pending or rejected users
  if (status === "PENDING" || status === "REJECTED") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            {status === "PENDING" ? (
              <Clock className="w-8 h-8 text-orange-500 animate-pulse" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-red-500" />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-3">
            {status === "PENDING" ? "Approval Pending" : "Request Rejected"}
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            {status === "PENDING" ? (
              <>
                Your application to join <span className="text-white font-semibold">{orgName}</span> as a Coach is currently pending review. 
                Please request the Organization Administrator to approve your account.
              </>
            ) : (
              <>
                Your request to join <span className="text-white font-semibold">{orgName}</span> has been rejected by the Organization Administrator.
              </>
            )}
          </p>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3.5 font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Log Out / Switch Account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen pt-16 lg:pt-0">
        <main className="min-h-screen p-3 sm:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
