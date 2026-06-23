"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Target,
  Activity,
  Zap,
  ChevronRight,
  AlertTriangle,
  Award,
  Sparkles,
  ClipboardCheck
} from "lucide-react";

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore: number | null;
  mpiScore: number | null;
}

interface DashboardStats {
  totalPlayers: number;
  avgPpi: number;
  avgMpi: number;
  avgCpi: number;
  playersNeedingAttention: Array<{
    name: string;
    cpi: number;
    role: string;
  }>;
  topPerformers: Array<{
    name: string;
    cpi: number;
    role: string;
  }>;
  recentAssessments: Array<{
    playerName: string;
    assessmentType: string;
    score: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [coachName, setCoachName] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Player list (to lookup IDs)
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastAssessmentDates, setLastAssessmentDates] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profileRes, statsRes, playersRes] = await Promise.all([
          api.get("/profile"),
          api.get("/dashboard/stats"),
          api.get("/players")
        ]);

        setCoachName(profileRes.data.name);
        setStats(statsRes.data);
        const playerList = playersRes.data || [];
        setPlayers(playerList);

        // Fetch last assessment dates player-by-player for bottom players to show in Section 2
        const attentionPlayers = statsRes.data?.playersNeedingAttention || [];
        const datesMap: Record<string, string> = {};
        
        await Promise.all(attentionPlayers.map(async (ap: any) => {
          const matchedPlayer = playerList.find((p: any) => p.name.toLowerCase() === ap.name.toLowerCase());
          if (matchedPlayer) {
            try {
              const [pracRes, matchRes] = await Promise.all([
                api.get(`/practice/player/${matchedPlayer.id}`).catch(() => ({ data: [] })),
                api.get(`/matches/player/${matchedPlayer.id}`).catch(() => ({ data: [] }))
              ]);
              const pracLogs = pracRes.data || [];
              const matchLogs = matchRes.data || [];
              const dates = [
                ...pracLogs.map((p: any) => p.createdAt || p.date),
                ...matchLogs.map((m: any) => m.createdAt || m.date)
              ].filter(Boolean);

              if (dates.length > 0) {
                const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                datesMap[matchedPlayer.name.toLowerCase()] = new Date(sortedDates[0]).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                });
              } else {
                datesMap[matchedPlayer.name.toLowerCase()] = "No assessments";
              }
            } catch (e) {
              datesMap[matchedPlayer.name.toLowerCase()] = "No assessments";
            }
          } else {
            datesMap[ap.name.toLowerCase()] = "No assessments";
          }
        }));

        setLastAssessmentDates(datesMap);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getPlayerIdByName = (name: string) => {
    const p = players.find(x => x.name.toLowerCase() === name.toLowerCase());
    return p ? p.id : null;
  };

  const navigateToPlayer = (name: string) => {
    const id = getPlayerIdByName(name);
    if (id) {
      router.push(`/players?id=${id}`);
    } else {
      router.push(`/players`);
    }
  };

  const formatActivityDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    
    const isToday = d.getDate() === now.getDate() && 
                    d.getMonth() === now.getMonth() && 
                    d.getFullYear() === now.getFullYear();
                    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() && 
                        d.getMonth() === yesterday.getMonth() && 
                        d.getFullYear() === yesterday.getFullYear();
                        
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatScoreValue = (val: number) => {
    if (val <= 10) {
      return Math.round(val * 10);
    }
    return Math.round(val);
  };

  // Section 6: Focus for Today
  const getFocusItems = () => {
    if (!stats) return ["Technical Execution", "Pressure Handling", "Decision Making"];
    const avgPpi = stats.avgPpi || 0;
    const avgMpi = stats.avgMpi || 0;

    if (avgPpi > 0 && avgMpi > 0) {
      if (avgPpi < avgMpi) {
        return ["Technical Execution", "Practice Discipline", "Training Intensity"];
      } else if (avgMpi < avgPpi) {
        return ["Pressure Handling", "Decision Making", "Game Awareness"];
      }
    }
    return ["Skill Execution", "Adaptability", "Focus & Attention"];
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-550 font-bold uppercase tracking-wider text-xs">
          Loading Coach Assistant...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      
      {/* SECTION 1: WELCOME */}
      <div className="border-b border-zinc-900 pb-4">
        <h1 className="text-zinc-500 font-black tracking-widest text-[10px] uppercase">
          Welcome Back Coach
        </h1>
        <p className="text-3xl font-black text-white uppercase tracking-tight leading-none mt-1">
          {coachName || "Coach"}
        </p>
      </div>

      {/* SECTION 2: PLAYERS NEEDING ATTENTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          Players Needing Attention
        </h3>
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
          {stats?.playersNeedingAttention && stats.playersNeedingAttention.length > 0 ? (
            stats.playersNeedingAttention.map((p, idx) => {
              const lastDate = lastAssessmentDates[p.name.toLowerCase()] || "No assessments";
              return (
                <div
                  key={idx}
                  onClick={() => navigateToPlayer(p.name)}
                  className="p-4 flex justify-between items-center hover:bg-zinc-900/40 cursor-pointer transition-colors active:bg-zinc-900/60"
                >
                  <div>
                    <span className="text-sm font-bold text-white uppercase block">{p.name}</span>
                    <span className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">
                      Last Assessed: {lastDate}
                    </span>
                  </div>
                  <span className="text-xs font-black text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    CPI {p.cpi > 0 ? formatScoreValue(p.cpi) : "N/A"}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-zinc-650 font-bold uppercase">
              No players currently needing attention.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: RECENT ACTIVITY */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <ClipboardCheck className="w-3.5 h-3.5 text-orange-500" />
          Recent Activity
        </h3>
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
          {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
            stats.recentAssessments.map((a, idx) => (
              <div
                key={idx}
                onClick={() => navigateToPlayer(a.playerName)}
                className="p-4 flex justify-between items-center hover:bg-zinc-900/40 cursor-pointer transition-colors active:bg-zinc-900/60"
              >
                <div>
                  <span className="text-sm font-bold text-white uppercase block">{a.playerName}</span>
                  <span className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">
                    {a.assessmentType === "PRACTICE" ? "Practice Assessment" : "Match Assessment"}
                  </span>
                </div>
                <span className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">
                  {formatActivityDate(a.date)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-zinc-650 font-bold uppercase">
              No recent assessment activity logged.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          Quick Actions
        </h3>
        <div className="space-y-3">
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
            Add Player
          </button>
        </div>
      </div>

      {/* SECTION 5: TOP PERFORMERS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-orange-500" />
          Top Performers
        </h3>
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
          {stats?.topPerformers && stats.topPerformers.length > 0 ? (
            stats.topPerformers.map((p, idx) => (
              <div
                key={idx}
                onClick={() => navigateToPlayer(p.name)}
                className="p-4 flex justify-between items-center hover:bg-zinc-900/40 cursor-pointer transition-colors active:bg-zinc-900/60"
              >
                <div>
                  <span className="text-sm font-bold text-white uppercase block">{p.name}</span>
                  <span className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">
                    {p.role}
                  </span>
                </div>
                <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  CPI {p.cpi > 0 ? formatScoreValue(p.cpi) : "N/A"}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-zinc-650 font-bold uppercase">
              No assessments logged yet.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6: FOCUS FOR TODAY */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          Focus for Today
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {getFocusItems().map((item, idx) => (
            <div
              key={idx}
              className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-2xl text-center flex flex-col justify-center items-center min-h-[75px]"
            >
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                Focus 0{idx + 1}
              </span>
              <span className="text-xs font-extrabold text-white uppercase tracking-tight leading-tight">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
