"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  Activity, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Loader2, 
  Award, 
  Search, 
  Bell, 
  ChevronDown,
  Star,
  Plus
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, LabelList } from "recharts";
import { api } from "@/lib/api";
import { clsx } from "clsx";

interface Stats {
  totalTeams: number;
  totalPlayers: number;
  totalPracticeSessions: number;
  totalMatches: number;
  avgPpi: number;
  avgMpi: number;
  avgCpi: number;
  teamPerformance: { teamName: string; cpi: number }[];
  cpiTrend: { label: string; value: number }[];
  practiceTrend: { label: string; value: number }[];
  matchTrend: { label: string; value: number }[];
  activityFeed: { type: string; title: string; description: string; timestamp: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cpi");
  const [coachName, setCoachName] = useState("Coach");
  const [profileInitials, setProfileInitials] = useState("CO");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, profileRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/profile").catch(() => null)
        ]);

        setStats(statsRes.data);
        if (profileRes && profileRes.data) {
          setCoachName(profileRes.data.name);
          const initials = profileRes.data.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
          setProfileInitials(initials || "CO");
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-400 text-xs">Loading performance hub...</p>
      </div>
    );
  }

  const data = stats || {
    totalTeams: 0,
    totalPlayers: 0,
    totalPracticeSessions: 0,
    totalMatches: 0,
    avgPpi: 0,
    avgMpi: 0,
    avgCpi: 0,
    teamPerformance: [],
    cpiTrend: [],
    practiceTrend: [],
    matchTrend: [],
    activityFeed: []
  };

  // Find peak squad
  const peakSquad = data.teamPerformance && data.teamPerformance.length > 0 
    ? [...data.teamPerformance].sort((a, b) => b.cpi - a.cpi)[0]
    : null;

  return (
    <div className="space-y-5 pb-12 px-1 relative">
      
      {/* Top Search / Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4.5">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search players, teams..."
            className="h-11 w-full bg-[#0d0d0d]/80 border border-white/10 rounded-2xl pl-11 pr-4 text-xs text-white placeholder:text-zinc-555 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
        </div>

        <div className="flex items-center gap-3.5 self-end md:self-auto">
          {/* Notification bell */}
          <button className="relative p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-orange-650 text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
              3
            </span>
          </button>

          {/* Profile Dropdown */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center border border-white/10 shrink-0">
              <span className="text-[10px] font-black text-orange-500">{profileInitials}</span>
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-[11px] font-extrabold text-white truncate max-w-[100px]">
                {coachName}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Hero Header & Insights Card Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">
        {/* Left side: Welcome text */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center">
            <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">
              Dashboard
            </h1>
            {/* Heartbeat Wave */}
            <svg className="w-20 h-9 text-orange-500/60 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] ml-1" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 15H30L35 5L40 25L45 10L50 20L55 15H100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-zinc-100 text-base font-extrabold">Welcome back, {coachName}! 👋</p>
            <p className="text-zinc-450 text-xs sm:text-sm font-semibold leading-relaxed">
              Here's what's happening today. Track metrics, manage practice, and audit matches.
            </p>
          </div>
        </div>

        {/* Right side: Insights Card Panel matching surrounding styling */}
        <div className="w-full lg:max-w-md bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[100px] hover:border-orange-500/10 transition-all duration-300">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Star className="w-3 h-3 text-orange-500 fill-current" />
              </div>
              <span className="text-[10px] text-white uppercase font-black tracking-wider">Performance Insights</span>
            </div>
            
            {/* Season Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Live</span>
              </div>
              <select className="h-6 bg-black/60 border border-white/10 rounded-lg px-2 text-[9px] font-bold text-zinc-300 focus:outline-none focus:border-orange-500 cursor-pointer">
                <option>2024 Season</option>
              </select>
            </div>
          </div>

          {/* Insights Items */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Peak Squad</span>
              <p className="text-xs font-extrabold text-zinc-100 truncate">
                {peakSquad 
                  ? `${peakSquad.teamName} (${peakSquad.cpi.toFixed(1)} CPI)`
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Session Audit</span>
              <p className="text-xs font-extrabold text-emerald-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                All Teams On Track
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards - 2 Columns on Mobile, 4 Columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 z-10 relative">
        {/* TOTAL TEAMS */}
        <StatCard
          href="/teams"
          title="Total Teams"
          value={data.totalTeams}
          trend="Active squads"
          icon={Users}
          iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
          gradient="from-indigo-500/5 to-purple-500/5 hover:border-indigo-500/20"
        >
          {/* Custom Purple Line Chart SVG with glowing dots */}
          <svg className="absolute bottom-0 left-0 right-0 h-10 w-full overflow-visible" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
            <path d="M0 40 Q25 20, 50 30 T100 10 T150 25 T200 15 V40 H0" fill="url(#purpleGlow)" />
            <path d="M0 35 Q25 15, 50 25 T100 5 T150 20 T200 10" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="25" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#8b5cf6]" />
            <circle cx="100" cy="5" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#8b5cf6]" />
            <circle cx="150" cy="20" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#8b5cf6]" />
            <defs>
              <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </StatCard>

        {/* TOTAL PLAYERS */}
        <StatCard
          href="/players"
          title="Total Players"
          value={data.totalPlayers}
          trend="Roster size"
          icon={Award}
          iconColor="text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20"
          gradient="from-fuchsia-500/5 to-pink-500/5 hover:border-fuchsia-500/20"
        >
          {/* Custom Pink Line Chart SVG with glowing dots */}
          <svg className="absolute bottom-0 left-0 right-0 h-10 w-full overflow-visible" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
            <path d="M0 40 Q25 15, 50 25 T100 8 T150 30 T200 10 V40 H0" fill="url(#pinkGlow)" />
            <path d="M0 35 Q25 10, 50 20 T100 3 T150 25 T200 5" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="20" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#ec4899]" />
            <circle cx="100" cy="3" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#ec4899]" />
            <circle cx="150" cy="25" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#ec4899]" />
            <defs>
              <linearGradient id="pinkGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </StatCard>

        {/* PRACTICE SESSIONS */}
        <StatCard
          href="/practice"
          title="Practice Sessions"
          value={data.totalPracticeSessions}
          trend="PPI tracked"
          icon={Target}
          iconColor="text-orange-400 bg-orange-500/10 border-orange-500/20"
          gradient="from-orange-500/5 to-red-500/5 hover:border-orange-500/20"
        >
          {/* Custom Orange Line Chart SVG with glowing dots */}
          <svg className="absolute bottom-0 left-0 right-0 h-10 w-full overflow-visible" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
            <path d="M0 40 Q25 30, 50 20 T100 15 T150 8 T200 18 V40 H0" fill="url(#orangeGlow)" />
            <path d="M0 35 Q25 25, 50 15 T100 10 T150 3 T200 13" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="15" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#f97316]" />
            <circle cx="100" cy="10" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#f97316]" />
            <circle cx="150" cy="3" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#f97316]" />
            <defs>
              <linearGradient id="orangeGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </StatCard>

        {/* TOTAL MATCHES */}
        <StatCard
          href="/matches"
          title="Total Matches"
          value={data.totalMatches}
          trend="MPI tracked"
          icon={Trophy}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          gradient="from-emerald-500/5 to-teal-500/5 hover:border-emerald-500/20"
        >
          {/* Custom Green Line Chart SVG with glowing dots */}
          <svg className="absolute bottom-0 left-0 right-0 h-10 w-full overflow-visible" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
            <path d="M0 40 Q25 25, 50 35 T100 15 T150 22 T200 8 V40 H0" fill="url(#greenGlow)" />
            <path d="M0 35 Q25 20, 50 30 T100 10 T150 17 T200 3" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="30" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#10b981]" />
            <circle cx="100" cy="10" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#10b981]" />
            <circle cx="150" cy="17" r="2.5" fill="#fff" className="filter drop-shadow-[0_0_3px_#10b981]" />
            <defs>
              <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </StatCard>
      </div>

      {/* Intermediate metrics row - 2 Columns on Mobile, 4 Columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 z-10 relative">
        
        {/* AVERAGE PPI */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 flex items-center justify-between backdrop-blur-md hover:border-orange-500/20 transition-all duration-300">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-zinc-555 uppercase font-black tracking-wider block truncate">Average PPI</span>
            <span className="text-xl sm:text-2xl font-black text-white">{data.avgPpi.toFixed(1)}</span>
            <span className="text-[8px] sm:text-[10px] text-zinc-455 block font-semibold truncate">{data.avgPpi > 0 ? `${data.avgPpi.toFixed(1)} avg` : "No data"}</span>
          </div>
          <ProgressRing value={data.avgPpi} colorClass="stroke-orange-500" trailColorClass="stroke-white/5">
            <Activity className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] text-orange-500" />
          </ProgressRing>
        </div>

        {/* AVERAGE MPI */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 flex items-center justify-between backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-zinc-555 uppercase font-black tracking-wider block truncate">Average MPI</span>
            <span className="text-xl sm:text-2xl font-black text-white">{data.avgMpi.toFixed(1)}</span>
            <span className="text-[8px] sm:text-[10px] text-zinc-455 block font-semibold truncate">{data.avgMpi > 0 ? `${data.avgMpi.toFixed(1)} avg` : "No data"}</span>
          </div>
          <ProgressRing value={data.avgMpi} colorClass="stroke-emerald-500" trailColorClass="stroke-white/5">
            <TrendingUp className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] text-emerald-500" />
          </ProgressRing>
        </div>

        {/* AVERAGE CPI */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 flex items-center justify-between backdrop-blur-md hover:border-blue-500/20 transition-all duration-300">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-zinc-555 uppercase font-black tracking-wider block truncate">Average CPI</span>
            <span className="text-xl sm:text-2xl font-black text-white">{data.avgCpi.toFixed(1)}</span>
            <span className="text-[8px] sm:text-[10px] text-zinc-455 block font-semibold truncate">Combined index</span>
          </div>
          <ProgressRing value={data.avgCpi} colorClass="stroke-blue-500" trailColorClass="stroke-white/5">
            <Calendar className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] text-blue-500" />
          </ProgressRing>
        </div>

        {/* PERFORMANCE STATUS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 flex items-center justify-between backdrop-blur-md hover:border-amber-500/20 transition-all duration-300">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-zinc-555 uppercase font-black tracking-wider block truncate">Performance Status</span>
            <span className="text-lg sm:text-xl font-black text-white truncate block">On Track</span>
            <span className="text-[8px] sm:text-[10px] text-zinc-455 block font-semibold truncate">Keep pushing!</span>
          </div>
          <ProgressRing value={8.5} max={10} colorClass="stroke-amber-500" trailColorClass="stroke-white/5">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-current" />
            </div>
          </ProgressRing>
        </div>
      </div>

      {/* Mobile Segmented Chart Control */}
      <div className="lg:hidden flex bg-white/5 border border-white/10 p-1 rounded-xl text-xs font-bold">
        {["cpi", "teams", "ppi", "mpi"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-center transition-all uppercase tracking-wider text-[10px] ${
              activeTab === tab ? "bg-orange-655 text-white shadow font-black" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Charts Row 1: CPI Trend & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 z-10 relative">
        {/* CPI Trend Area Chart */}
        <div className={clsx("bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-md", activeTab === "cpi" ? "block" : "hidden lg:block")}>
          <h3 className="text-xs font-black mb-5 flex items-center justify-between text-zinc-200 uppercase tracking-wider border-b border-white/5 pb-3">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              CPI Trend
            </span>
            <select className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-[10px] text-zinc-400 focus:outline-none">
              <option>Last 7 Days</option>
            </select>
          </h3>
          <div className="h-[210px] sm:h-[260px] flex items-center justify-center">
            {data.cpiTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.cpiTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 12]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="CPI" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorCpi)" 
                    strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-555 text-xs">No CPI trend scores recorded.</div>
            )}
          </div>
        </div>

        {/* Team Performance Bar Chart */}
        <div className={clsx("bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-md", activeTab === "teams" ? "block" : "hidden lg:block")}>
          <h3 className="text-xs font-black mb-5 flex items-center justify-between text-zinc-200 uppercase tracking-wider border-b border-white/5 pb-3">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Team Performance
            </span>
            <select className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-[10px] text-zinc-400 focus:outline-none">
              <option>All Teams</option>
            </select>
          </h3>
          <div className="h-[210px] sm:h-[260px] flex items-center justify-center">
            {data.teamPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.teamPerformance} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="teamName" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 12]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    itemStyle={{ color: '#c084fc', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a' }}
                  />
                  <Bar dataKey="cpi" name="CPI Score" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {/* Display score directly on top of the bars to match the mockup exactly */}
                    <LabelList dataKey="cpi" position="top" fill="#a1a1aa" fontSize={10} fontWeight="bold" formatter={(val: any) => typeof val === 'number' ? val.toFixed(1) : Number(val).toFixed(1)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-555 text-xs">No team performance data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Practice Trend (PPI) & Match Trend (MPI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 z-10 relative">
        {/* Practice Trend Area Chart */}
        <div className={clsx("bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-md", activeTab === "ppi" ? "block" : "hidden lg:block")}>
          <h3 className="text-xs font-black mb-5 flex items-center justify-between text-zinc-200 uppercase tracking-wider border-b border-white/5 pb-3">
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              Practice Trend (PPI)
            </span>
            <select className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-[10px] text-zinc-400 focus:outline-none">
              <option>Last 7 Days</option>
            </select>
          </h3>
          <div className="h-[210px] sm:h-[260px] flex items-center justify-center">
            {data.practiceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.practiceTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity="0.25"/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 12]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    itemStyle={{ color: '#fb923c', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="PPI" 
                    stroke="#f97316" 
                    fillOpacity={1} 
                    fill="url(#colorPpi)" 
                    strokeWidth={2.5}
                    dot={{ fill: '#f97316', stroke: '#fff', strokeWidth: 1.5, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-555 text-xs">No practice sessions logged.</div>
            )}
          </div>
        </div>

        {/* Match Trend Area Chart / Empty State */}
        <div className={clsx("bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-md", activeTab === "mpi" ? "block" : "hidden lg:block")}>
          <h3 className="text-xs font-black mb-5 flex items-center justify-between text-zinc-200 uppercase tracking-wider border-b border-white/5 pb-3">
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Match Trend (MPI)
            </span>
            <select className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-[10px] text-zinc-400 focus:outline-none">
              <option>Last 7 Days</option>
            </select>
          </h3>
          <div className="h-[210px] sm:h-[260px] flex items-center justify-center">
            {data.totalMatches > 0 && data.matchTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.matchTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity="0.25"/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 12]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="MPI" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorMpi)" 
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', stroke: '#fff', strokeWidth: 1.5, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              // Premium Empty State placeholder matches the mockup
              <div className="text-center space-y-4 flex flex-col items-center justify-center pt-2">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-500/20 flex items-center justify-center p-1.5 animate-pulse">
                  <div className="w-full h-full rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                
                <div className="space-y-1.5 max-w-xs mx-auto">
                  <h4 className="text-zinc-350 text-xs font-bold uppercase tracking-wider">No matches logged yet</h4>
                  <p className="text-zinc-555 text-[11px] font-semibold leading-relaxed">
                    Create a match to start tracking MPI scores and updates.
                  </p>
                </div>

                <Link href="/matches">
                  <span className="h-9 px-4.5 rounded-xl text-[11px] font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-550/25 text-emerald-400 shadow-md">
                    <Plus className="w-3.5 h-3.5" />
                    Create Match
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md z-10 relative">
        <h3 className="text-xs font-black mb-5 text-zinc-200 uppercase tracking-wider border-b border-white/5 pb-3">Activity Feed</h3>
        <div className="space-y-3.5">
          {data.activityFeed.length > 0 ? (
            data.activityFeed.slice(0, 5).map((activity, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                key={i} 
                className="flex gap-3.5 border-b border-white/5 pb-3.5 last:border-0 last:pb-0"
              >
                <div className={clsx(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                  activity.type === "PLAYER_ADDED" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                  activity.type === "TEAM_CREATED" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                  activity.type === "PRACTICE_COMPLETED" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {activity.type === "PLAYER_ADDED" ? <Award className="w-4.5 h-4.5" /> :
                   activity.type === "TEAM_CREATED" ? <Users className="w-4.5 h-4.5" /> :
                   activity.type === "PRACTICE_COMPLETED" ? <Target className="w-4.5 h-4.5" /> :
                   <Trophy className="w-4.5 h-4.5" />}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-bold text-zinc-100 truncate">{activity.title}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 truncate">{activity.description}</p>
                  <p className="text-[9px] text-zinc-555 mt-1 font-semibold">
                    {new Date(activity.timestamp).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-zinc-555 text-xs py-1">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Progress Ring Helper Component with Glowing Blurred Underlays
function ProgressRing({ value, max = 10, colorClass, trailColorClass, children }: {
  value: number;
  max?: number;
  colorClass: string;
  trailColorClass: string;
  children?: React.ReactNode;
}) {
  const size = 52;
  const strokeWidth = 5.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-11 h-11 sm:w-13 sm:h-13">
      <svg viewBox="0 0 52 52" className="-rotate-90 overflow-visible w-full h-full">
        {/* Background track */}
        <circle
          className={trailColorClass}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={26}
          cy={26}
        />
        {/* Glowing blurry drop-shadow underlay circle */}
        <circle
          className={colorClass}
          style={{ filter: "blur(2.5px)", opacity: 0.4 }}
          strokeWidth={strokeWidth + 1}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={26}
          cy={26}
        />
        {/* Main sharp progress circle */}
        <circle
          className={clsx("transition-all duration-700 ease-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={26}
          cy={26}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

// Custom Stat Card
function StatCard({ href, title, value, trend, icon: Icon, iconColor, gradient, children }: {
  href: string;
  title: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
  iconColor: string;
  gradient: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3, scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className={clsx(
          "bg-gradient-to-br border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px] transition-all duration-300 cursor-pointer shadow-md",
          gradient
        )}
      >
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider block truncate">{title}</span>
          <div className={clsx("w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center border shrink-0", iconColor)}>
            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3 relative z-10 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</span>
          <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate ml-1">{trend}</span>
        </div>

        {/* Dynamic Glowing line path */}
        {children}
      </motion.div>
    </Link>
  );
}
