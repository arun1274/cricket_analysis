"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { Home, Users, Clock, User, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"APPROVED" | "PENDING" | "REJECTED" | null>(null);
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    if (!token) {
      router.push("/login");
      return;
    }

    api.get("/profile")
      .then((res) => {
        setStatus(res.data.approvalStatus || "APPROVED");
        setOrgName(res.data.organization?.name || "the Academy");
        
        const backendRole = res.data.role;
        const mappedRole = backendRole === "USER" ? "player" : "coach";
        localStorage.setItem("userRole", mappedRole);
        setRole(mappedRole);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-5">
        <div className="relative w-20 h-24">
          <Image src="/cpi-logo.png" alt="CPI" fill className="object-contain animate-pulse" priority />
        </div>
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bypasses Coach Pending Approval screen for Players
  const isPlayer = role === "player";
  if (!isPlayer && (status === "PENDING" || status === "REJECTED")) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white text-center">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="relative w-20 h-24 mx-auto">
            <Image src="/cpi-logo.png" alt="CPI" fill className="object-contain" priority />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight">
            {status === "PENDING" ? "Approval Pending" : "Request Rejected"}
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed font-bold">
            {status === "PENDING" ? (
              <>
                Your request to join <span className="text-white">{orgName}</span> is pending review.
                Please contact the administrator.
              </>
            ) : (
              <>
                Your application to join <span className="text-white">{orgName}</span> has been rejected.
              </>
            )}
          </p>

          <button
            onClick={handleLogout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-xl py-4 font-black transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            LOG OUT / SWITCH ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: "HOME", path: "/dashboard", icon: Home },
    { name: "PLAYERS", path: "/players", icon: Users },
    { name: "HISTORY", path: "/history", icon: Clock },
    { name: "PROFILE", path: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 pb-24">
      {/* Top Simple Header */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-9">
            <Image src="/cpi-logo.png" alt="CPI" fill className="object-contain" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">CPI</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-lg"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Container */}
      <main className="p-4 max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom 4-Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950 border-t-2 border-zinc-900 z-40 flex items-center justify-around px-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${
                isActive ? "text-orange-500 font-black scale-105" : "text-zinc-500 font-bold"
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className="text-[10px] tracking-widest uppercase">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
