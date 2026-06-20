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
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Match Assessment</h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">Calculate Match Performance Index (MPI) for a player.</p>
        </div>
        <div className="text-left sm:text-right bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Calculated MPI</p>
          <div className="text-2xl font-black text-emerald-400">{mpiScore}</div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold text-xs">{message.text}</span>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl space-y-4 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-350">Select Player</label>
            <select 
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Choose a player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-xs">
                  {p.name} ({p.teams && p.teams.length > 0 ? p.teams.map(t => t.name).join(", ") : p.team?.name || "No Team"})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-350">Match Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark] transition-colors" 
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-4">
          {METRICS.map((metric) => (
            <div key={metric} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-xs text-zinc-300">{metric}</label>
                <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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

        <div className="border-t border-white/10 pt-4">
          <label className="text-xs font-semibold text-zinc-350 block mb-1">Match Notes</label>
          <textarea 
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Add observations about match performance..."
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-semibold transition-all text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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
