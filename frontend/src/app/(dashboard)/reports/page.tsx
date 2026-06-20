"use client";

import { motion } from "framer-motion";
import { FileBarChart, TrendingUp, Users, Target } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Reports</h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">View team and player performance reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-white group-hover:text-orange-500 transition-colors">Performance Trends</h3>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Track PPI and MPI scores over time. Identify improvement patterns and areas needing attention.
          </p>
          <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-[10px]">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[9px]">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-white group-hover:text-emerald-400 transition-colors">Team Comparison</h3>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Compare squads side-by-side. Benchmark team CPI scores across age groups and seasons.
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px]">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-white group-hover:text-blue-400 transition-colors">Player Profiles</h3>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Individual radar charts, strengths, weaknesses, and personalised coaching recommendations.
          </p>
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[10px]">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px]">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileBarChart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-white group-hover:text-purple-400 transition-colors">Export &amp; Share</h3>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Generate PDF reports for parents, players, and management. Share progress with stakeholders.
          </p>
          <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[10px]">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px]">v2.1</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
