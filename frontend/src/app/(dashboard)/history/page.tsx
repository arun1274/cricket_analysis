"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Clipboard, ShieldCheck, ChevronRight } from "lucide-react";

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore: number | null;
  mpiScore: number | null;
}

export default function HistoryPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);

    const fetchPlayers = async () => {
      try {
        const res = await api.get("/players");
        const list: Player[] = res.data || [];
        setPlayers(list);

        if (list.length > 0) {
          // If player role, select matching profile player, else select first player
          api.get("/profile").then((profileRes) => {
            const match = list.find(
              (p) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
            ) || list[0];
            setSelectedPlayerId(match.id);
            fetchPlayerHistory(match.id);
          }).catch(() => {
            setSelectedPlayerId(list[0].id);
            fetchPlayerHistory(list[0].id);
          });
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load players list", err);
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const fetchPlayerHistory = async (playerId: number) => {
    setHistoryLoading(true);
    try {
      const [pracRes, matchRes] = await Promise.all([
        api.get(`/practice/player/${playerId}`).catch(() => ({ data: [] })),
        api.get(`/matches/player/${playerId}`).catch(() => ({ data: [] }))
      ]);
      
      // Sort newest first
      const sortedPrac = (pracRes.data || []).sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const sortedMatch = (matchRes.data || []).sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPracticeHistory(sortedPrac);
      setMatchHistory(sortedMatch);
    } catch (err) {
      console.error("Failed to fetch player history", err);
    } finally {
      setHistoryLoading(false);
      setLoading(false);
    }
  };

  const handlePlayerChange = (playerId: number) => {
    setSelectedPlayerId(playerId);
    fetchPlayerHistory(playerId);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading History...</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500 font-bold uppercase tracking-wider text-sm border-2 border-dashed border-zinc-900 rounded-3xl">
        No player history logs available.
      </div>
    );
  }

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Compute Trend data (last 5 sessions)
  const getTrendData = () => {
    const allSessions = [
      ...practiceHistory.map((h) => ({ date: h.date, score: h.ppiScore, type: "Practice" })),
      ...matchHistory.map((h) => ({ date: h.date, score: h.mpiScore, type: "Match" }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return allSessions.slice(-5);
  };

  const lastSessions = getTrendData();

  return (
    <div className="space-y-6 pb-12 select-none">
      
      <div className="space-y-2 text-center">
        <h1 className="text-zinc-500 font-black tracking-widest text-xs uppercase">TIMELINE LOGS</h1>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">PERFORMANCE HISTORY</h2>
      </div>

      {/* Select Player (only for Coach role) */}
      {role !== "player" && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block pl-1">SELECT SQUAD PLAYER</label>
          <select
            value={selectedPlayerId || ""}
            onChange={(e) => handlePlayerChange(Number(e.target.value))}
            className="w-full h-14 bg-zinc-950 border-2 border-zinc-900 rounded-2xl px-4 text-base text-white font-black uppercase cursor-pointer focus:outline-none focus:border-orange-500"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role.split(" ")[0]})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlayer && (
        <div className="space-y-6">
          
          {/* CPI Trend card */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-black tracking-widest text-orange-500 uppercase">CPI RECENT TREND</h3>
            {lastSessions.length === 0 ? (
              <p className="text-xs text-zinc-650 font-bold uppercase">No scoring trend logs recorded yet.</p>
            ) : (
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-zinc-400">
                  <span>START ({lastSessions[0].date})</span>
                  <ChevronRight className="w-4 h-4 text-zinc-650" />
                  <span>LATEST ({lastSessions[lastSessions.length - 1].date})</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2">
                  {lastSessions.map((s, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center bg-zinc-900 border border-zinc-805 rounded-xl py-3 px-1">
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{s.type === "Practice" ? "Prac" : "Match"}</span>
                      <span className="text-lg font-black text-white mt-1">{(s.score || 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Lists */}
          {historyLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Practice List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black tracking-widest text-zinc-500 uppercase block pl-1">PRACTICE TIMELINE</h4>
                {practiceHistory.length === 0 ? (
                  <div className="bg-zinc-950/20 border-2 border-dashed border-zinc-900 text-center py-6 text-zinc-650 font-bold uppercase text-xs rounded-2xl">
                    No practice assessments recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {practiceHistory.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                            <Clipboard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-500">{item.date}</div>
                            <div className="text-sm font-bold text-white truncate max-w-[180px] uppercase">
                              {item.notes || "PRACTICE DRILLS"}
                            </div>
                          </div>
                        </div>
                        <span className="text-base font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-xl">
                          PPI {item.ppiScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Match List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black tracking-widest text-zinc-500 uppercase block pl-1">MATCH PLAY TIMELINE</h4>
                {matchHistory.length === 0 ? (
                  <div className="bg-zinc-950/20 border-2 border-dashed border-zinc-900 text-center py-6 text-zinc-650 font-bold uppercase text-xs rounded-2xl">
                    No match play assessments recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchHistory.map((item, idx) => (
                      <div key={idx} className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-500">{item.date}</div>
                            <div className="text-sm font-bold text-white truncate max-w-[180px] uppercase">
                              {item.notes || "MATCH SESSION"}
                            </div>
                          </div>
                        </div>
                        <span className="text-base font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-xl">
                          MPI {item.mpiScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
