"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Target, Activity, Trophy, TrendingUp, Calendar, Loader2, Award } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { api } from "@/lib/api";

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-400">Loading your performance metrics...</p>
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

  // Helper for trend display
  const getTrendText = (val: number, label: string) => {
    return val > 0 ? `${val.toFixed(1)} average` : "No assessments";
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">Welcome to your team's performance hub.</p>
      </div>

      {/* 7 Stats Cards - 2 Columns on mobile, 4 Columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Teams" value={data.totalTeams} icon={Users} trend="Active squads" color="from-blue-500/10 to-indigo-500/10" iconColor="text-blue-400" />
        <StatCard title="Total Players" value={data.totalPlayers} icon={Award} trend="Roster size" color="from-purple-500/10 to-pink-500/10" iconColor="text-purple-400" />
        <StatCard title="Practice Sessions" value={data.totalPracticeSessions} icon={Target} trend="PPI tracked" color="from-orange-500/10 to-red-500/10" iconColor="text-orange-400" />
        <StatCard title="Total Matches" value={data.totalMatches} icon={Trophy} trend="MPI tracked" color="from-emerald-500/10 to-teal-500/10" iconColor="text-emerald-400" />
        <StatCard title="Average PPI" value={data.avgPpi.toFixed(1)} icon={Activity} trend={getTrendText(data.avgPpi, "PPI")} color="from-amber-500/10 to-orange-500/10" iconColor="text-amber-400" />
        <StatCard title="Average MPI" value={data.avgMpi.toFixed(1)} icon={TrendingUp} trend={getTrendText(data.avgMpi, "MPI")} color="from-emerald-500/10 to-green-500/10" iconColor="text-emerald-400" />
        <div className="col-span-2 md:col-span-1">
          <StatCard title="Average CPI" value={data.avgCpi.toFixed(1)} icon={Calendar} trend="Combined index" color="from-sky-500/10 to-blue-500/10" iconColor="text-sky-400" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* CPI Trend */}
        <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-1.5 text-zinc-200">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            CPI Trend
          </h3>
          <div className="h-[180px] sm:h-[220px] flex items-center justify-center">
            {data.cpiTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.cpiTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" name="CPI" stroke="#38bdf8" fillOpacity={1} fill="url(#colorCpi)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">Assess practice/matches to see CPI trend.</div>
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-1.5 text-zinc-200">
            <Users className="w-4 h-4 text-blue-400" />
            Team Performance
          </h3>
          <div className="h-[180px] sm:h-[220px] flex items-center justify-center">
            {data.teamPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.teamPerformance} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="teamName" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="cpi" name="CPI Score" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">Create teams and assess players to view performance.</div>
            )}
          </div>
        </div>

        {/* Practice Trend */}
        <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-1.5 text-zinc-200">
            <Target className="w-4 h-4 text-orange-400" />
            Practice Trend (PPI)
          </h3>
          <div className="h-[180px] sm:h-[220px] flex items-center justify-center">
            {data.practiceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.practiceTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" name="PPI" stroke="#f97316" fillOpacity={1} fill="url(#colorPpi)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">No practice sessions logged yet.</div>
            )}
          </div>
        </div>

        {/* Match Trend */}
        <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-1.5 text-zinc-200">
            <Trophy className="w-4 h-4 text-emerald-400" />
            Match Trend (MPI)
          </h3>
          <div className="h-[180px] sm:h-[220px] flex items-center justify-center">
            {data.matchTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.matchTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMpi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" name="MPI" stroke="#10b981" fillOpacity={1} fill="url(#colorMpi)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs">No match assessments logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md">
        <h3 className="text-base font-bold mb-4 text-zinc-100">Activity Feed</h3>
        <div className="space-y-4">
          {data.activityFeed.length > 0 ? (
            data.activityFeed.map((activity, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                key={i} 
                className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  activity.type === "PLAYER_ADDED" ? "bg-purple-500/10 text-purple-400" :
                  activity.type === "TEAM_CREATED" ? "bg-blue-500/10 text-blue-400" :
                  activity.type === "PRACTICE_COMPLETED" ? "bg-orange-500/10 text-orange-400" :
                  "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {activity.type === "PLAYER_ADDED" ? <Award className="w-4 h-4" /> :
                   activity.type === "TEAM_CREATED" ? <Users className="w-4 h-4" /> :
                   activity.type === "PRACTICE_COMPLETED" ? <Target className="w-4 h-4" /> :
                   <Trophy className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-150 truncate">{activity.title}</p>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate">{activity.description}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">
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
            <div className="text-zinc-500 text-xs py-2">No recent activity found. Set up your team and assess players to see updates here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, iconColor }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-br ${color} border border-white/10 p-3 sm:p-4 rounded-xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[110px] transition-all`}
    >
      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-zinc-400 font-bold text-[9px] sm:text-xs tracking-wider uppercase truncate max-w-[80%]">{title}</h3>
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconColor} opacity-70`} />
      </div>
      <div className="flex items-baseline justify-between mt-2 relative z-10 gap-1.5">
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{value}</span>
        <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium truncate max-w-[60%]">{trend}</span>
      </div>
    </motion.div>
  );
}
