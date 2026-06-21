"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2, Plus, Users, ClipboardCheck, Clock } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    api.get("/profile")
      .then((res) => {
        setUserName(res.data.name);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Hub...</p>
      </div>
    );
  }

  const isPlayer = role === "player";

  return (
    <div className="space-y-8 py-8 text-center select-none">
      
      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="text-zinc-500 font-black tracking-widest text-sm uppercase">WELCOME BACK</h1>
        <p className="text-4xl font-black text-white uppercase tracking-tight leading-none">
          {userName || (isPlayer ? "PLAYER" : "COACH")}
        </p>
      </div>

      <div className="border border-zinc-900 rounded-3xl p-6 bg-zinc-950/40 space-y-6">
        <p className="text-zinc-400 font-black tracking-wide text-lg">What would you like to do?</p>

        <div className="space-y-4">
          {!isPlayer ? (
            <>
              {/* Coach Options */}
              <button
                onClick={() => router.push("/players?add=true")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-6 px-6 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-lg cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                ADD PLAYER
              </button>

              <button
                onClick={() => router.push("/players")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-6 px-6 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-zinc-800 shadow-md cursor-pointer"
              >
                <Users className="w-6 h-6" />
                VIEW PLAYERS
              </button>
            </>
          ) : (
            <>
              {/* Player Options */}
              <button
                onClick={() => router.push(`/players?selfAssess=true`)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-6 px-6 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-lg cursor-pointer"
              >
                <ClipboardCheck className="w-6 h-6 stroke-[3]" />
                SELF ASSESSMENT
              </button>

              <button
                onClick={() => router.push("/history")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-6 px-6 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-zinc-800 shadow-md cursor-pointer"
              >
                <Clock className="w-6 h-6" />
                VIEW MY HISTORY
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
