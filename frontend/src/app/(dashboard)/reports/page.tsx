"use client";

import { motion } from "framer-motion";
import { FileBarChart, TrendingUp, Users, Target } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-5 pb-12 px-1">
      {/* Header section unified with dashboard styling */}
      <div className="space-y-1 border-b border-white/5 pb-4.5">
        <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">
          Reports
        </h1>
        <p className="text-zinc-455 text-xs sm:text-sm font-semibold leading-relaxed">
          Analyze and monitor team performance metrics, trend lines, and individual progress charts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-5 rounded-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col relative group overflow-hidden shadow-md backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black tracking-tight text-white group-hover:text-orange-500 transition-colors mb-1.5">
            Performance Trends
          </h3>
          <p className="text-zinc-450 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
            Track PPI and MPI scores over time. Identify improvement patterns and areas needing attention.
          </p>
          <div className="flex items-center gap-1.5 mt-auto text-orange-500 font-black text-[10px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/20 text-[9px] font-black">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-5 rounded-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col relative group overflow-hidden shadow-md backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black tracking-tight text-white group-hover:text-orange-500 transition-colors mb-1.5">
            Team Comparison
          </h3>
          <p className="text-zinc-450 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
            Compare squads side-by-side. Benchmark team CPI scores across age groups and seasons.
          </p>
          <div className="flex items-center gap-1.5 mt-auto text-orange-500 font-black text-[10px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/20 text-[9px] font-black">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-5 rounded-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col relative group overflow-hidden shadow-md backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black tracking-tight text-white group-hover:text-orange-500 transition-colors mb-1.5">
            Player Profiles
          </h3>
          <p className="text-zinc-450 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
            Individual radar charts, strengths, weaknesses, and personalised coaching recommendations.
          </p>
          <div className="flex items-center gap-1.5 mt-auto text-orange-500 font-black text-[10px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/20 text-[9px] font-black">v2.1</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-5 rounded-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col relative group overflow-hidden shadow-md backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileBarChart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black tracking-tight text-white group-hover:text-orange-500 transition-colors mb-1.5">
            Export &amp; Share
          </h3>
          <p className="text-zinc-455 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
            Generate PDF reports for parents, players, and management. Share progress with stakeholders.
          </p>
          <div className="flex items-center gap-1.5 mt-auto text-orange-500 font-black text-[10px] uppercase tracking-wider">
            Coming Soon
            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/20 text-[9px] font-black">v2.1</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
