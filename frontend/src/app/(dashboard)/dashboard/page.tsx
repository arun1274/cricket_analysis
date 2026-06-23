"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Users,
  ClipboardCheck,
  Clock,
  Target,
  Activity,
  Award,
  TrendingDown,
  Trophy,
  Lightbulb,
  Zap,
  ChevronRight
} from "lucide-react";

interface RecentAssessment {
  playerName: string;
  assessmentType: string;
  score: number;
  date: string;
}

interface PlayerPerformance {
  name: string;
  cpi: number;
  role: string;
}

interface DashboardStats {
  totalPlayers: number;
  playersAssessedToday: number;
  practicesToday: number;
  matchesToday: number;
  recentAssessments: RecentAssessment[];
  playersNeedingAttention: PlayerPerformance[];
  topPerformers: PlayerPerformance[];
  coachInsights: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const loadDashboardData = async () => {
      try {
        const profileRes = await api.get("/profile");
        setUserName(profileRes.data.name);

        const statsRes = await api.get("/dashboard/stats");
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-550 font-bold uppercase tracking-wider text-xs">
          Loading Coaching Hub...
        </p>
      </div>
    );
  }

  const isPlayer = role === "player";

  // Default fallback data structures
  const totalPlayers = stats?.totalPlayers || 0;
  const playersAssessedToday = stats?.playersAssessedToday || 0;
  const practicesToday = stats?.practicesToday || 0;
  const matchesToday = stats?.matchesToday || 0;
  const recentAssessments = stats?.recentAssessments || [];
  const playersNeedingAttention = stats?.playersNeedingAttention || [];
  const topPerformers = stats?.topPerformers || [];
  const coachInsights = stats?.coachInsights || [];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch (e) {}
    return "Recently";
  };

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      {/* Welcome Header */}
      <div className="space-y-1 py-2 border-b border-zinc-900 flex justify-between items-center">
        <div>
          <h1 className="text-zinc-500 font-black tracking-widest text-[10px] uppercase">
            COACHING HUB
          </h1>
          <p className="text-2xl font-black text-white uppercase tracking-tight leading-none">
            {userName || "COACH"}
          </p>
        </div>
        <span className="text-[10px] font-bold bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20 uppercase tracking-widest">
          {role || "Coach"}
        </span>
      </div>

      {/* SECTION 1: TODAY'S SNAPSHOT */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          Today's Snapshot
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-955 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Total Squad</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{totalPlayers}</span>
              <Users className="w-5 h-5 text-zinc-600" />
            </div>
          </div>
          <div className="bg-zinc-955 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Assessed Today</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-orange-500">{playersAssessedToday}</span>
              <ClipboardCheck className="w-5 h-5 text-orange-600/50" />
            </div>
          </div>
          <div className="bg-zinc-955 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nets / Practices</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{practicesToday}</span>
              <Target className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
          <div className="bg-zinc-955 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Matches Scored</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{matchesToday}</span>
              <Activity className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: QUICK ACTIONS (Brought up for immediate utility on the field) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          Field Quick Actions
        </h3>
        <div className="space-y-3">
          {!isPlayer ? (
            <>
              <button
                onClick={() => router.push("/players?action=practice")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 px-5 text-sm font-black flex items-center justify-between transition-all active:scale-[0.99] border border-orange-400 shadow-lg cursor-pointer uppercase tracking-tight"
              >
                <span className="flex items-center gap-3">
                  <Target className="w-5 h-5 stroke-[3]" />
                  Start Practice Assessment
                </span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>

              <button
                onClick={() => router.push("/players?action=match")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-4.5 px-5 text-sm font-black flex items-center justify-between transition-all active:scale-[0.99] border border-zinc-850 shadow-md cursor-pointer uppercase tracking-tight"
              >
                <span className="flex items-center gap-3">
                  <Activity className="w-5 h-5 stroke-[2]" />
                  Start Match Assessment
                </span>
                <ChevronRight className="w-5 h-5 stroke-[2]" />
              </button>

              <button
                onClick={() => router.push("/players?add=true")}
                className="w-full bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 rounded-2xl py-4 px-5 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer uppercase"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add Player to Squad
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/players?selfAssess=true")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 px-5 text-sm font-black flex items-center justify-between transition-all active:scale-[0.99] border border-orange-400 shadow-lg cursor-pointer uppercase"
              >
                <span className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 stroke-[3]" />
                  Log Self Assessment
                </span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION 5: COACH INSIGHTS */}
      {coachInsights.length > 0 && (
        <div className="border border-orange-500/20 bg-orange-950/5 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-black tracking-widest text-orange-400 uppercase flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-orange-400" />
            Field Coaching Insights
          </h3>
          <ul className="space-y-2 text-left">
            {coachInsights.map((insight, idx) => (
              <li key={idx} className="text-xs font-semibold text-zinc-300 flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 2: RECENT ACTIVITY */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          Recent Assessments
        </h3>
        {recentAssessments.length === 0 ? (
          <div className="text-center py-6 text-zinc-650 font-bold uppercase text-[10px] border border-dashed border-zinc-900 rounded-2xl">
            No recent logs found
          </div>
        ) : (
          <div className="space-y-2">
            {recentAssessments.map((item, idx) => (
              <div key={idx} className="bg-zinc-950/60 border border-zinc-900 p-4.5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 text-left">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none">{item.playerName}</h4>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    {item.assessmentType} ASSESSMENT
                  </p>
                  <p className="text-[8px] font-semibold text-zinc-600">{formatDate(item.date)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-zinc-550 uppercase block leading-none">SCORE</span>
                  <span className={`text-xl font-black ${item.score >= 7.5 ? 'text-emerald-400' : item.score >= 5.5 ? 'text-orange-500' : 'text-red-500'}`}>
                    {item.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: PLAYERS NEEDING ATTENTION & SECTION 4: TOP PERFORMERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 3: PLAYERS NEEDING ATTENTION */}
        <div className="space-y-3">
          <h3 className="text-xs font-black tracking-widest text-red-400 uppercase flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            Needs Attention (Lowest CPI)
          </h3>
          {playersNeedingAttention.length === 0 ? (
            <div className="text-center py-6 text-zinc-650 font-bold uppercase text-[10px] border border-dashed border-zinc-900 rounded-2xl">
              All players looking good
            </div>
          ) : (
            <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-2xl space-y-1.5">
              {playersNeedingAttention.map((player, idx) => (
                <div key={idx} className="bg-zinc-955 border border-zinc-900/60 p-3 rounded-xl flex items-center justify-between">
                  <div className="text-left min-w-0">
                    <h5 className="text-xs font-black text-white truncate uppercase tracking-tight leading-none">{player.name}</h5>
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-wider truncate">{player.role}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase block leading-none">CPI</span>
                    <span className="text-xs font-black text-red-400 font-mono">
                      {player.cpi > 0 ? player.cpi.toFixed(1) : "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: TOP PERFORMERS */}
        <div className="space-y-3">
          <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            Top Performers (Highest CPI)
          </h3>
          {topPerformers.length === 0 ? (
            <div className="text-center py-6 text-zinc-650 font-bold uppercase text-[10px] border border-dashed border-zinc-900 rounded-2xl">
              No assessed players found
            </div>
          ) : (
            <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-2xl space-y-1.5">
              {topPerformers.map((player, idx) => (
                <div key={idx} className="bg-zinc-955 border border-zinc-900/60 p-3 rounded-xl flex items-center justify-between">
                  <div className="text-left min-w-0">
                    <h5 className="text-xs font-black text-white truncate uppercase tracking-tight leading-none">{player.name}</h5>
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-wider truncate">{player.role}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase block leading-none">CPI</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      {player.cpi.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
