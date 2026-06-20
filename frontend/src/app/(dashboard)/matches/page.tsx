"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const METRICS = [
  "Shot Selection",
  "Temperament",
  "Running Between Wickets",
  "Bowling Accuracy",
  "Fielding Effort",
  "Game Awareness",
];

interface Player {
  id: number;
  name: string;
  teams?: {
    name: string;
  }[];
  team?: {
    name: string;
  };
}

export default function MatchesPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    METRICS.reduce((acc, curr) => ({ ...acc, [curr]: 5 }), {})
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await api.get("/players");
        setPlayers(response.data);
      } catch (err) {
        console.error("Error fetching players:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const mpiScore = (Object.values(scores).reduce((a, b) => a + b, 0) / METRICS.length).toFixed(1);

  const handleSave = async () => {
    if (!selectedPlayer) {
      setMessage({ type: "error", text: "Please select a player." });
      return;
    }
    if (!date) {
      setMessage({ type: "error", text: "Please select a match date." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await api.post("/matches", {
        playerId: parseInt(selectedPlayer),
        date,
        shotSelection: scores["Shot Selection"],
        temperament: scores["Temperament"],
        runningBetweenWickets: scores["Running Between Wickets"],
        bowlingAccuracy: scores["Bowling Accuracy"],
        fieldingEffort: scores["Fielding Effort"],
        gameAwareness: scores["Game Awareness"],
        notes,
      });

      setMessage({ type: "success", text: "Match assessment saved successfully!" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save match assessment.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-400">Loading squad details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Match Assessment</h1>
          <p className="text-zinc-400 mt-1">Calculate Match Performance Index (MPI) for a player.</p>
        </div>
        <div className="text-left sm:text-right bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl w-full sm:w-auto">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">Calculated MPI</p>
          <div className="text-4xl font-extrabold text-emerald-400">{mpiScore}</div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 p-4 sm:p-8 rounded-3xl space-y-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Select Player</label>
            <select 
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Choose a player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">
                  {p.name} ({p.teams && p.teams.length > 0 ? p.teams.map(t => t.name).join(", ") : p.team?.name || "No Team"})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Match Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark] transition-colors" 
            />
          </div>
        </div>

        <div className="space-y-8 border-t border-white/10 pt-8">
          {METRICS.map((metric) => (
            <div key={metric} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium text-zinc-200">{metric}</label>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  {scores[metric]} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores[metric]}
                onChange={(e) => setScores({ ...scores, [metric]: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 py-1"
              />
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8">
          <label className="text-sm font-medium text-zinc-300 block mb-2">Match Notes</label>
          <textarea 
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Add observations about match performance, key moments..."
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 font-medium transition-all text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Assessment"
          )}
        </button>
      </div>
    </div>
  );
}
