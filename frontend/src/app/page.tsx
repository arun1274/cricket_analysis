"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Activity, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-9 flex-shrink-0">
              <Image
                src="/cpi-logo.png"
                alt="CPI"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">CPI Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-9 px-4 rounded-xl text-xs font-bold bg-white hover:opacity-90 text-black inline-flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-28 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Platform v1.0 Live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 text-white"
          >
            Cricket Performance
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-650">
              Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-normal leading-relaxed"
          >
            Are we training properly? If not, what must we do better?
            The premier analytics platform designed for elite cricket coaches.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="h-12 px-6 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-zinc-50 inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-orange-600/15 cursor-pointer"
            >
              Start Coaching Now
              <ArrowRight className="w-4 h-4 text-zinc-50" />
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity />}
              title="Practice & Match Index"
              description="Slider-based assessment for PPI and MPI to accurately track player progression and form."
            />
            <FeatureCard
              icon={<BarChart3 />}
              title="Advanced Analytics"
              description="Radar charts, team comparisons, and trend analysis visualised with stunning clarity."
            />
            <FeatureCard
              icon={<Shield />}
              title="Smart Insights"
              description="AI-driven strengths, weaknesses, and targeted recommendations for every individual."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-all duration-200 group shadow-md">
      <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="text-base font-bold mb-2 text-white">{title}</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
