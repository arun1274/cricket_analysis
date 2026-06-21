"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, LogOut, User, Shield, Key } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile details", err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none text-center">
      
      <div className="space-y-2">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">USER DETAILS</h1>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">MY PROFILE</h2>
      </div>

      {profile && (
        <div className="space-y-6">
          
          {/* Avatar and Primary Details */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-6 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-905 border border-zinc-800 flex items-center justify-center mx-auto text-orange-500">
              <User className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                {profile.name}
              </h3>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                {role === "player" ? "ACADEMY PLAYER" : "COACHING STAFF"}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-4 text-left">
            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">EMAIL ADDRESS</span>
              <span className="text-sm font-bold text-white uppercase tracking-tight">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">ACADEMY NAME</span>
              <span className="text-sm font-bold text-white uppercase tracking-tight">
                {profile.organization?.name || "PERSONAL WORKSPACE"}
              </span>
            </div>
            {role !== "player" && profile.organization?.joinCode && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4.5 space-y-2 mt-2">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  ACADEMY JOIN CODE FOR PLAYERS
                </span>
                <p className="text-3xl font-black text-white tracking-widest text-center py-1">
                  {profile.organization.joinCode}
                </p>
                <p className="text-[10.5px] font-bold text-zinc-400 leading-normal text-center">
                  Share this code with your players. They must enter this code during signup to join your roster automatically.
                </p>
              </div>
            )}
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-650 hover:bg-red-750 text-white rounded-2xl py-5 text-xl font-extrabold flex items-center justify-center gap-3 transition-all border border-red-500 shadow-md cursor-pointer"
          >
            <LogOut className="w-6 h-6" />
            SIGN OUT / EXIT
          </button>

        </div>
      )}

    </div>
  );
}
