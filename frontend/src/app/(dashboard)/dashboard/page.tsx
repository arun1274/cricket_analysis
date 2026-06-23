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
} from "lucide-react";
import KpiCard from "@/components/KpiCard";

interface TrendPoint {
  label: string;
  value: number;
}

function SimpleTrendChart({ points, strokeColor }: { points: TrendPoint[]; strokeColor: string }) {
  if (points.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-zinc-600 text-xs font-black uppercase tracking-widest border-2 border-dashed border-zinc-900 rounded-2xl">
        No assessment data logged
      </div>
    );
  }

  const height = 100;
  const width = 300;
  const paddingX = 30;
  const paddingTop = 25;
  const paddingBottom = 22;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (points.length <= 1) return width / 2;
    return paddingX + (index * chartWidth) / (points.length - 1);
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(10, val));
    return paddingTop + chartHeight - (clamped * chartHeight) / 10;
  };

  let pathD = "";
  if (points.length > 1) {
    pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.value)}`).join(" ");
  }

  return (
    <div className="w-full mt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Draw subtle target horizontal grid lines */}
        <line
          x1={paddingX}
          y1={getY(10)}
          x2={width - paddingX}
          y2={getY(10)}
          stroke="#18181b"
          strokeWidth={0.8}
          strokeDasharray="2 4"
        />
        <line
          x1={paddingX}
          y1={getY(5)}
          x2={width - paddingX}
          y2={getY(5)}
          stroke="#18181b"
          strokeWidth={0.8}
          strokeDasharray="2 4"
        />

        {/* Draw Line */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Draw Points & Labels */}
        {points.map((p, i) => {
          const x = getX(i);
          const y = getY(p.value);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={4.5}
                fill="#000"
                stroke={strokeColor}
                strokeWidth={3}
              />
              {/* Score Value Label */}
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fill="#fff"
                className="text-[10px] font-black font-mono select-none"
              >
                {p.value.toFixed(1)}
              </text>
              {/* Date Label */}
              <text
                x={x}
                y={height - 2}
                textAnchor="middle"
                fill="#71717a"
                className="text-[8.5px] font-black uppercase tracking-tight select-none"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Averages
  const [avgPpi, setAvgPpi] = useState<number | null>(null);
  const [avgMpi, setAvgMpi] = useState<number | null>(null);
  const [avgCpi, setAvgCpi] = useState<number | null>(null);

  // Last 5 Trend Lists
  const [practiceSessions, setPracticeSessions] = useState<TrendPoint[]>([]);
  const [matchSessions, setMatchSessions] = useState<TrendPoint[]>([]);
  const [cpiPoints, setCpiPoints] = useState<TrendPoint[]>([]);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const loadDashboardData = async () => {
      try {
        // Fetch Profile
        const profileRes = await api.get("/profile");
        setUserName(profileRes.data.name);

        // Fetch Dashboard Stats
        const statsRes = await api.get("/dashboard/stats");
        const stats = statsRes.data;

        if (stats) {
          setAvgPpi(stats.avgPpi || 0);
          setAvgMpi(stats.avgMpi || 0);
          setAvgCpi(stats.avgCpi || 0);

          const pTrend = stats.practiceTrend || [];
          const mTrend = stats.matchTrend || [];
          const cTrend = stats.cpiTrend || [];

          // Extract last 5 valid sessions (value > 0)
          setPracticeSessions(pTrend.filter((p: any) => p.value > 0).slice(-5));
          setMatchSessions(mTrend.filter((m: any) => m.value > 0).slice(-5));
          setCpiPoints(cTrend.filter((c: any) => c.value > 0));
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getTrendStatus = (points: TrendPoint[]) => {
    if (points.length < 2) return { text: "STABLE", color: "text-zinc-400 bg-zinc-900 border-zinc-800" };
    const last = points[points.length - 1].value;
    const prev = points[points.length - 2].value;
    if (last > prev) return { text: "IMPROVING", color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30" };
    if (last < prev) return { text: "DECLINING", color: "text-red-400 bg-red-950/40 border-red-500/30" };
    return { text: "STABLE", color: "text-zinc-400 bg-zinc-900 border-zinc-800" };
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">
          Loading Hub...
        </p>
      </div>
    );
  }

  const isPlayer = role === "player";

  // Safe formatting helpers for KPIs
  const formatKpi = (val: number | null) => {
    return val && val > 0 ? val.toFixed(1) : "N/A";
  };

  const practiceTrendStatus = getTrendStatus(practiceSessions);
  const matchTrendStatus = getTrendStatus(matchSessions);

  // Performance Snapshot Calculations
  const currentCpi = cpiPoints.length > 0 ? cpiPoints[cpiPoints.length - 1].value : (avgCpi || 0);
  const previousCpi = cpiPoints.length > 1 ? cpiPoints[cpiPoints.length - 2].value : null;

  let cpiChange = "0.0";
  let changeType: "up" | "down" | "none" = "none";
  if (previousCpi !== null && previousCpi > 0) {
    const diff = currentCpi - previousCpi;
    if (diff > 0) {
      cpiChange = `+${diff.toFixed(1)}`;
      changeType = "up";
    } else if (diff < 0) {
      cpiChange = `${diff.toFixed(1)}`;
      changeType = "down";
    } else {
      cpiChange = "0.0";
      changeType = "none";
    }
  }

  // Dynamic Cricket Insights based on values
  let strongestArea = "N/A (No assessments)";
  let needsImprovement = "Log Initial Assessments";
  let recommendedFocus = "Perform a Practice (PPI) and Match (MPI) assessment to unlock insights.";

  if ((avgPpi && avgPpi > 0) || (avgMpi && avgMpi > 0)) {
    const pVal = avgPpi || 0;
    const mVal = avgMpi || 0;
    if (pVal > mVal) {
      strongestArea = "Practice Consistency (PPI)";
      needsImprovement = "Match Performance under Pressure (MPI)";
      recommendedFocus = "Simulate match pressure during net sessions with targets and consequences.";
    } else if (mVal > pVal) {
      strongestArea = "Match Execution (MPI)";
      needsImprovement = "Practice Consistency & Intensity (PPI)";
      recommendedFocus = "Increase attendance and focus during structured drills; log session intentions.";
    } else {
      strongestArea = "Balanced Execution";
      needsImprovement = "Overall Skill Refinement";
      recommendedFocus = "Maintain standard routines; focus on tactical awareness and shot/delivery variety.";
    }
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Welcome Message */}
      <div className="space-y-1 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">
          WELCOME BACK
        </h1>
        <p className="text-3xl font-black text-white uppercase tracking-tight leading-none">
          {userName || (isPlayer ? "PLAYER" : "COACH")}
        </p>
      </div>

      {/* KPI Averages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Average PPI"
          value={formatKpi(avgPpi)}
          subtitle="Practice performance rating"
          icon={Target}
          glowColor="amber"
        />
        <KpiCard
          title="Average MPI"
          value={formatKpi(avgMpi)}
          subtitle="Match performance rating"
          icon={Activity}
          glowColor="amber"
        />
        <KpiCard
          title="Average CPI"
          value={formatKpi(avgCpi)}
          subtitle="Overall cricket performance"
          icon={Award}
          glowColor="orange"
        />
      </div>

      {/* Two Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Practice Session Card */}
        <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden select-none">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Last 5 Practice Sessions
            </h4>
            <span className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full border ${practiceTrendStatus.color}`}>
              {practiceTrendStatus.text}
            </span>
          </div>
          <SimpleTrendChart points={practiceSessions} strokeColor="#f97316" />
        </div>

        {/* Match Session Card */}
        <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden select-none">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Last 5 Match Sessions
            </h4>
            <span className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full border ${matchTrendStatus.color}`}>
              {matchTrendStatus.text}
            </span>
          </div>
          <SimpleTrendChart points={matchSessions} strokeColor="#d97706" />
        </div>
      </div>

      {/* Performance Snapshot Card */}
      <div className="border border-zinc-900 rounded-3xl p-6 bg-zinc-950/40 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <h3 className="text-sm font-black tracking-widest text-orange-500 uppercase">
            Performance Snapshot
          </h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">CPI Summary</span>
        </div>

        {/* Answer: Where am I? Where was I? What is changing? */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">
              Current CPI
            </p>
            <p className="text-2xl font-black text-white">
              {currentCpi > 0 ? currentCpi.toFixed(1) : "N/A"}
            </p>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">
              Previous CPI
            </p>
            <p className="text-2xl font-black text-zinc-300">
              {previousCpi !== null ? previousCpi.toFixed(1) : "N/A"}
            </p>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">
              Change
            </p>
            <p className={`text-2xl font-black ${
              changeType === "up" ? "text-emerald-400" : changeType === "down" ? "text-red-400" : "text-zinc-400"
            }`}>
              {previousCpi !== null ? cpiChange : "N/A"}
            </p>
          </div>
        </div>

        {/* Answer: What do I need to work on? */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                Strongest Area
              </p>
              <p className="text-sm font-bold text-white uppercase tracking-tight">
                {strongestArea}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                Needs Improvement
              </p>
              <p className="text-sm font-bold text-orange-400 uppercase tracking-tight">
                {needsImprovement}
              </p>
            </div>
          </div>
          <div className="bg-orange-950/20 border border-orange-500/30 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-1">
              Recommended Focus
            </p>
            <p className="text-sm font-medium text-zinc-300">
              {recommendedFocus}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="border border-zinc-900 rounded-3xl p-6 bg-zinc-950/40 space-y-4">
        <p className="text-zinc-400 font-black tracking-wide text-sm uppercase text-center">
          What would you like to do?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isPlayer ? (
            <>
              {/* Coach Action Paths */}
              <button
                onClick={() => router.push("/players?add=true")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-lg cursor-pointer uppercase"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                ADD PLAYER
              </button>

              <button
                onClick={() => router.push("/players")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-zinc-805 shadow-md cursor-pointer uppercase"
              >
                <Users className="w-5 h-5" />
                VIEW PLAYERS
              </button>
            </>
          ) : (
            <>
              {/* Player Action Paths */}
              <button
                onClick={() => router.push(`/players?selfAssess=true`)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-lg cursor-pointer uppercase"
              >
                <ClipboardCheck className="w-5 h-5 stroke-[3]" />
                SELF ASSESSMENT
              </button>

              <button
                onClick={() => router.push("/history")}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-5 px-6 text-lg font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-zinc-805 shadow-md cursor-pointer uppercase"
              >
                <Clock className="w-5 h-5" />
                VIEW MY HISTORY
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
