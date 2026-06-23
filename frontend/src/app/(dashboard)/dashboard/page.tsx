"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Users,
  ClipboardCheck,
  Target,
  Activity,
  Lightbulb,
  Zap,
  ChevronRight
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
  playersAssessedToday: number;
  practicesToday: number;
  matchesToday: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  
  // Dashboard stats (Today's Snapshot)
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Player Selection list
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerData, setSelectedPlayerData] = useState<Player | null>(null);
  
  // Selected Player Assessment History
  const [playerPracticeHistory, setPlayerPracticeHistory] = useState<any[]>([]);
  const [playerMatchHistory, setPlayerMatchHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const loadDashboardData = async () => {
      try {
        // Load profile & general stats
        const [profileRes, statsRes, playersRes] = await Promise.all([
          api.get("/profile"),
          api.get("/dashboard/stats"),
          api.get("/players")
        ]);

        setUserName(profileRes.data.name);
        setStats(statsRes.data);
        
        const playerList = playersRes.data || [];
        setPlayers(playerList);
        
        if (playerList.length > 0) {
          setSelectedPlayerId(playerList[0].id);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Fetch player details and history when selection changes
  useEffect(() => {
    if (!selectedPlayerId) {
      setSelectedPlayerData(null);
      setPlayerPracticeHistory([]);
      setPlayerMatchHistory([]);
      return;
    }

    const loadPlayerHistory = async () => {
      setLoadingHistory(true);
      try {
        const found = players.find(p => p.id === selectedPlayerId);
        if (found) setSelectedPlayerData(found);

        const [pracRes, matchRes] = await Promise.all([
          api.get(`/practice/player/${selectedPlayerId}`).catch(() => ({ data: [] })),
          api.get(`/matches/player/${selectedPlayerId}`).catch(() => ({ data: [] }))
        ]);
        setPlayerPracticeHistory(pracRes.data || []);
        setPlayerMatchHistory(matchRes.data || []);
      } catch (err) {
        console.error("Failed to load player history logs", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadPlayerHistory();
  }, [selectedPlayerId, players]);

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

  // Today's Snapshot details
  const totalPlayers = stats?.totalPlayers || players.length || 0;
  const playersAssessedToday = stats?.playersAssessedToday || 0;
  const practicesToday = stats?.practicesToday || 0;
  const matchesToday = stats?.matchesToday || 0;

  // Selected Player details & insights
  const currentPpi = selectedPlayerData?.ppiScore && selectedPlayerData.ppiScore > 0 ? selectedPlayerData.ppiScore.toFixed(1) : "N/A";
  const currentMpi = selectedPlayerData?.mpiScore && selectedPlayerData.mpiScore > 0 ? selectedPlayerData.mpiScore.toFixed(1) : "N/A";

  let currentCpi = "N/A";
  if (selectedPlayerData?.ppiScore && selectedPlayerData?.mpiScore && selectedPlayerData.ppiScore > 0 && selectedPlayerData.mpiScore > 0) {
    currentCpi = ((selectedPlayerData.ppiScore + selectedPlayerData.mpiScore) / 2).toFixed(1);
  } else if (selectedPlayerData?.ppiScore && selectedPlayerData.ppiScore > 0) {
    currentCpi = selectedPlayerData.ppiScore.toFixed(1);
  } else if (selectedPlayerData?.mpiScore && selectedPlayerData.mpiScore > 0) {
    currentCpi = selectedPlayerData.mpiScore.toFixed(1);
  }

  // Last Assessment Date Calculation
  let lastAssessmentDate = "No assessments logged";
  const dates = [
    ...playerPracticeHistory.map(p => p.createdAt || p.date),
    ...playerMatchHistory.map(m => m.createdAt || m.date)
  ].filter(Boolean);
  if (dates.length > 0) {
    const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    lastAssessmentDate = new Date(sortedDates[0]).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  // Chronological last 5 assessments (Practice & Matches)
  const sortedPracticeHistory = [...playerPracticeHistory]
    .sort((a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime())
    .slice(-5);

  const sortedMatchHistory = [...playerMatchHistory]
    .sort((a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime())
    .slice(-5);

  const getHistoryTrend = (historyList: any[], scoreKey: string) => {
    if (historyList.length < 2) return { text: "Stable", symbol: "→", color: "text-zinc-400 bg-zinc-900 border-zinc-800" };
    const last = historyList[historyList.length - 1][scoreKey];
    const prev = historyList[historyList.length - 2][scoreKey];
    if (last > prev) return { text: "Improving", symbol: "↑", color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30" };
    if (last < prev) return { text: "Declining", symbol: "↓", color: "text-red-400 bg-red-950/40 border-red-500/30" };
    return { text: "Stable", symbol: "→", color: "text-zinc-400 bg-zinc-900 border-zinc-800" };
  };

  const practiceTrend = getHistoryTrend(sortedPracticeHistory, "ppiScore");
  const matchTrend = getHistoryTrend(sortedMatchHistory, "mpiScore");

  const formatScoreValue = (val: number) => {
    if (val <= 10) {
      return Math.round(val * 10);
    }
    return Math.round(val);
  };

  // Coaching Insights (Strongest Area, Needs Improvement, Recommended Focus)
  let strongestArea = "N/A";
  let weakestArea = "N/A";
  let recommendedFocusList: string[] = ["Complete both Practice and Match assessments to receive focus areas."];

  if (playerPracticeHistory.length > 0 || playerMatchHistory.length > 0) {
    const metricSums: Record<string, { sum: number; count: number }> = {};

    const addMetric = (key: string, val: number | undefined | null) => {
      if (val === undefined || val === null || val <= 0) return;
      if (!metricSums[key]) {
        metricSums[key] = { sum: 0, count: 0 };
      }
      metricSums[key].sum += val;
      metricSums[key].count += 1;
    };

    // Practice assessment metrics
    playerPracticeHistory.forEach(p => {
      addMetric("Technique", p.technique);
      addMetric("Training Intensity", p.intensity);
      addMetric("Skill Execution", p.execution);
      addMetric("Adaptability", p.adaptability);
      addMetric("Practice Discipline", p.discipline);
      addMetric("Focus & Attention", p.focus);
    });

    // Match assessment metrics
    playerMatchHistory.forEach(m => {
      addMetric("Technical Execution", m.technicalExecution);
      addMetric("Decision Making", m.decisionMaking);
      addMetric("Game Awareness", m.gameAwareness);
      addMetric("Pressure Handling", m.pressureHandling);
      addMetric("Team Contribution", m.teamContribution);
      addMetric("Match Impact", m.matchImpact);
    });

    const averages = Object.entries(metricSums).map(([name, data]) => ({
      name,
      avg: data.sum / data.count
    }));

    if (averages.length > 0) {
      averages.sort((a, b) => b.avg - a.avg);
      strongestArea = averages[0].name;

      const sortedAsc = [...averages].sort((a, b) => a.avg - b.avg);
      weakestArea = sortedAsc[0].name;

      if (weakestArea === "Technique" || weakestArea === "Technical Execution") {
        recommendedFocusList = [
          "Stance stability and bat-flow alignment drills",
          "Defensive contact-point throwdowns",
          "Shadow batting practice under coaching observation"
        ];
      } else if (weakestArea === "Training Intensity" || weakestArea === "Practice Discipline") {
        recommendedFocusList = [
          "High-intensity net sessions with timed targets",
          "Strict intent mapping logs for every practice block",
          "Interval agility and stamina training routines"
        ];
      } else if (weakestArea === "Skill Execution" || weakestArea === "Match Impact") {
        recommendedFocusList = [
          "Target hitting drills targeting gaps in the field",
          "Consistent length line-and-length bowling targets",
          "Game simulation nets requiring set run scoring zones"
        ];
      } else if (weakestArea === "Adaptability" || weakestArea === "Game Awareness") {
        recommendedFocusList = [
          "Scenario batting (high run-rate chase vs wicket preservation)",
          "Variation response drills (spin, pace, bouncer nets)",
          "Tactical captaincy and field placement planning games"
        ];
      } else if (weakestArea === "Focus & Attention" || weakestArea === "Decision Making") {
        recommendedFocusList = [
          "Colored ball recognition nets for shot selection",
          "Pre-delivery breath control and trigger-movement routines",
          "Selective hitting constraints (e.g. only off-side playing)"
        ];
      } else if (weakestArea === "Pressure Handling") {
        recommendedFocusList = [
          "Batting nets with severe wicket run penalty consequences",
          "Target chasing under loud mock field noise",
          "Death-overs scenario batting and bowling simulations"
        ];
      } else if (weakestArea === "Team Contribution") {
        recommendedFocusList = [
          "Active strike rotation and push-for-singles drills",
          "Sacrifice batting and boundary protection scenarios",
          "Pair communication calls during quick running"
        ];
      } else {
        recommendedFocusList = [
          "Maintain balanced training routines",
          "Review session logs for minor skill variations",
          "Work on overall fitness and mental clarity"
        ];
      }
    }
  }

  return (
    <div className="space-y-8 pb-16 select-none max-w-lg mx-auto text-left">
      {/* Welcome Header */}
      <div className="space-y-1 py-2 border-b border-zinc-900 flex justify-between items-center">
        <div>
          <h1 className="text-zinc-555 text-zinc-500 font-black tracking-widest text-[10px] uppercase">
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
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Total Squad</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{totalPlayers}</span>
              <Users className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-555 text-zinc-500 uppercase tracking-wider">Assessed Today</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-orange-500">{playersAssessedToday}</span>
              <ClipboardCheck className="w-5 h-5 text-orange-600/50" />
            </div>
          </div>
          <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nets / Practices</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{practicesToday}</span>
              <Target className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
          <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Matches Scored</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-black text-white">{matchesToday}</span>
              <Activity className="w-5 h-5 text-zinc-650" />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
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

      {/* PLAYER PERFORMANCE SNAPSHOT SECTION */}
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-xs font-black text-orange-500 tracking-widest uppercase flex items-center gap-2">
            <Users className="w-4 h-4" />
            Player Performance Snapshot
          </label>
          <div className="relative">
            <select
              value={selectedPlayerId || ""}
              onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
              className="w-full h-14 bg-zinc-955 bg-zinc-950 border border-zinc-900 rounded-2xl px-4 text-sm font-black text-white focus:outline-none focus:border-orange-500 cursor-pointer appearance-none uppercase"
            >
              <option value="" disabled>Select Player ▼</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role.split(" (")[0]})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-550">
              <span className="text-xs font-black">▼</span>
            </div>
          </div>
        </div>

        {selectedPlayerData ? (
          <div className="border border-zinc-900 rounded-3xl p-6 bg-zinc-950/40 space-y-6">
            {/* Player details header */}
            <div className="flex justify-between items-start border-b border-zinc-900/80 pb-4 text-left">
              <div>
                <h4 className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">COACH SELECTION</h4>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mt-1">
                  {selectedPlayerData.name}
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                  {selectedPlayerData.role}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-zinc-550 tracking-widest block uppercase">LAST ASSESSMENT</span>
                <span className="text-xs font-bold text-zinc-300">{lastAssessmentDate}</span>
              </div>
            </div>

            {/* Main Score Snapshots */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-900">
                <p className="text-[8px] font-black text-zinc-505 text-zinc-500 uppercase tracking-wider mb-1">
                  Current PPI
                </p>
                <p className="text-xl font-black text-white font-mono">
                  {currentPpi !== "N/A" ? formatScoreValue(Number(currentPpi)) : "N/A"}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-900">
                <p className="text-[8px] font-black text-zinc-505 text-zinc-500 uppercase tracking-wider mb-1">
                  Current MPI
                </p>
                <p className="text-xl font-black text-white font-mono">
                  {currentMpi !== "N/A" ? formatScoreValue(Number(currentMpi)) : "N/A"}
                </p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider mb-1">
                  Overall CPI
                </p>
                <p className="text-xl font-black text-orange-400 font-mono">
                  {currentCpi !== "N/A" ? formatScoreValue(Number(currentCpi)) : "N/A"}
                </p>
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-10 gap-2 text-zinc-550">
                <Loader2 className="w-5 h-5 animate-spin text-orange-550" />
                <span className="text-[9px] font-black uppercase tracking-widest">Loading history logs...</span>
              </div>
            ) : (
              <>
                {/* Last 5 Practices & Matches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Practices */}
                  <div className="space-y-2 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">LAST 5 PRACTICES</span>
                      {sortedPracticeHistory.length >= 2 && (
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border flex items-center gap-0.5 uppercase tracking-wide ${practiceTrend.color}`}>
                          {practiceTrend.text} {practiceTrend.symbol}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 text-left">
                      {sortedPracticeHistory.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between items-center text-[11px] font-bold py-1 border-b border-zinc-900/30 last:border-0">
                          <span className="text-zinc-500">Practice {idx + 1}</span>
                          <span className="text-white font-mono">{formatScoreValue(p.ppiScore)}</span>
                        </div>
                      ))}
                      {sortedPracticeHistory.length === 0 && (
                        <p className="text-[9px] text-zinc-650 font-bold uppercase text-center py-3">No practice logs</p>
                      )}
                    </div>
                  </div>

                  {/* Matches */}
                  <div className="space-y-2 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">LAST 5 MATCHES</span>
                      {sortedMatchHistory.length >= 2 && (
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border flex items-center gap-0.5 uppercase tracking-wide ${matchTrend.color}`}>
                          {matchTrend.text} {matchTrend.symbol}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 text-left">
                      {sortedMatchHistory.map((m, idx) => (
                        <div key={m.id || idx} className="flex justify-between items-center text-[11px] font-bold py-1 border-b border-zinc-900/30 last:border-0">
                          <span className="text-zinc-555 text-zinc-500">Match {idx + 1}</span>
                          <span className="text-white font-mono">{formatScoreValue(m.mpiScore)}</span>
                        </div>
                      ))}
                      {sortedMatchHistory.length === 0 && (
                        <p className="text-[9px] text-zinc-650 font-bold uppercase text-center py-3">No match logs</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coaching Insights Card */}
                <div className="border border-orange-500/20 bg-orange-950/5 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b border-orange-500/15 pb-2.5">
                    <Lightbulb className="w-4 h-4 text-orange-400" />
                    <h4 className="text-[10px] font-black tracking-widest text-orange-400 uppercase">COACHING INSIGHTS</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-zinc-500 tracking-wider block">STRONGEST AREA</span>
                      <span className="text-sm font-bold text-white uppercase">{strongestArea}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-orange-400/80 uppercase tracking-wider block">NEEDS IMPROVEMENT</span>
                      <span className="text-sm font-bold text-orange-400 uppercase">{weakestArea}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-900/60">
                    <span className="text-[9px] font-black text-zinc-500 tracking-wider block">RECOMMENDED FOCUS</span>
                    <ul className="space-y-1.5 text-[11px]">
                      {recommendedFocusList.map((rec, i) => (
                        <li key={i} className="text-zinc-300 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-600 font-bold uppercase text-xs border border-dashed border-zinc-900 rounded-3xl">
            No players available in the squad. Add a player first!
          </div>
        )}
      </div>
    </div>
  );
}
