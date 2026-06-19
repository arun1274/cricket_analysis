"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  Users, 
  ChevronRight, 
  Play, 
  Check, 
  ChevronLeft 
} from "lucide-react";
import { api } from "@/lib/api";

const METRICS = [
  "Technique",
  "Intensity",
  "Execution",
  "Adaptability",
  "Discipline",
  "Focus",
];

interface Team {
  id: number;
  name: string;
  level: string;
  teamCpiScore?: number;
}

interface Player {
  id: number;
  name: string;
  role: string;
  ppiScore?: number;
}

interface PracticeSession {
  id: number;
  team: {
    id: number;
    name: string;
    level: string;
  };
  date: string;
  playersAssessed: number;
  averagePpi: number;
}

interface PracticeAssessment {
  id: number;
  player: {
    name: string;
    role: string;
  };
  technique: number;
  intensity: number;
  execution: number;
  adaptability: number;
  discipline: number;
  focus: number;
  ppiScore: number;
  notes?: string;
}

interface SessionDetails {
  session: PracticeSession;
  assessments: PracticeAssessment[];
}

export default function PracticePage() {
  const router = useRouter();

  // Navigation / View State
  const [view, setView] = useState<"history" | "select_team" | "session_draft" | "live_practice" | "session_details">("history");
  
  // Data State
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<SessionDetails | null>(null);

  // Draft / Live State
  const [sessionDate, setSessionDate] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [assessmentsState, setAssessmentsState] = useState<Record<number, {
    technique: number;
    intensity: number;
    execution: number;
    adaptability: number;
    discipline: number;
    focus: number;
    notes: string;
    isScored: boolean;
  }>>({});

  // Status State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize date to today and fetch history/teams
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSessionDate(today);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/practice/sessions");
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching practice session history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAddPractice = async () => {
    setLoading(true);
    try {
      const response = await api.get("/teams");
      setTeams(response.data);
      setView("select_team");
    } catch (err) {
      console.error("Error fetching teams:", err);
      setMessage({ type: "error", text: "Failed to load teams. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (team: Team) => {
    setLoading(true);
    setSelectedTeam(team);
    try {
      const response = await api.get(`/players/team/${team.id}`);
      const teamPlayers = response.data;
      setPlayers(teamPlayers);
      
      // Initialize assessments state
      const initialAssessments: typeof assessmentsState = {};
      teamPlayers.forEach((p: Player) => {
        initialAssessments[p.id] = {
          technique: 5,
          intensity: 5,
          execution: 5,
          adaptability: 5,
          discipline: 5,
          focus: 5,
          notes: "",
          isScored: false
        };
      });
      setAssessmentsState(initialAssessments);
      setView("session_draft");
    } catch (err) {
      console.error("Error fetching players for team:", err);
      setMessage({ type: "error", text: "Failed to load team players." });
    } finally {
      setLoading(false);
    }
  };

  const handleStartLivePractice = () => {
    if (players.length === 0) {
      setMessage({ type: "error", text: "No players in this team to assess." });
      return;
    }
    setCurrentIdx(0);
    setView("live_practice");
  };

  const handleScoreChange = (metric: string, val: number) => {
    const activePlayer = players[currentIdx];
    if (!activePlayer) return;

    setAssessmentsState(prev => {
      const pState = prev[activePlayer.id] || {
        technique: 5,
        intensity: 5,
        execution: 5,
        adaptability: 5,
        discipline: 5,
        focus: 5,
        notes: "",
        isScored: false
      };
      
      return {
        ...prev,
        [activePlayer.id]: {
          ...pState,
          [metric.toLowerCase()]: val,
          isScored: true
        }
      };
    });
  };

  const handleNotesChange = (notes: string) => {
    const activePlayer = players[currentIdx];
    if (!activePlayer) return;

    setAssessmentsState(prev => {
      const pState = prev[activePlayer.id];
      return {
        ...prev,
        [activePlayer.id]: {
          ...pState,
          notes
        }
      };
    });
  };

  const countScoredPlayers = () => {
    return Object.values(assessmentsState).filter(a => a.isScored).length;
  };

  const handleCompleteSession = async () => {
    if (!selectedTeam) return;
    setSaving(true);
    setMessage(null);

    const assessmentsPayload = players.map(p => {
      const a = assessmentsState[p.id];
      return {
        playerId: p.id,
        technique: a.technique,
        intensity: a.intensity,
        execution: a.execution,
        adaptability: a.adaptability,
        discipline: a.discipline,
        focus: a.focus,
        notes: a.notes,
      };
    });

    try {
      await api.post("/practice/sessions", {
        teamId: selectedTeam.id,
        date: sessionDate,
        assessments: assessmentsPayload
      });

      setMessage({ type: "success", text: "Practice session completed and locked successfully!" });
      setTimeout(() => {
        setView("history");
        fetchHistory();
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to complete practice session." });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/practice/sessions/${sessionId}`);
      setSelectedSessionDetails(response.data);
      setView("session_details");
    } catch (err) {
      console.error("Error fetching session details:", err);
      setMessage({ type: "error", text: "Failed to load session details." });
    } finally {
      setLoading(false);
    }
  };

  const getActivePpiScore = () => {
    const activePlayer = players[currentIdx];
    if (!activePlayer) return "5.0";
    const a = assessmentsState[activePlayer.id];
    if (!a) return "5.0";
    const sum = a.technique + a.intensity + a.execution + a.adaptability + a.discipline + a.focus;
    return (sum / 6.0).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-400">Loading module details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
      {/* Messages */}
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

      {/* VIEW: PRACTICE HISTORY */}
      {view === "history" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Practice (PPI)</h1>
              <p className="text-zinc-400 mt-1">Conduct live practice sessions and evaluate player performance indices.</p>
            </div>
            <button
              onClick={handleStartAddPractice}
              className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-5 py-3.5 font-medium transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Practice
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6">
            <h2 className="text-xl font-semibold text-white">Practice History</h2>
            
            {history.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-zinc-500">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">No Sessions Conducted Yet</h3>
                  <p className="text-zinc-400 text-sm mt-1 max-w-sm mx-auto">
                    Evaluate your squad's performance by adding a new live practice session today.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-4">Session Date</th>
                      <th className="py-4 px-4">Team Name</th>
                      <th className="py-4 px-4">Players Assessed</th>
                      <th className="py-4 px-4">Average PPI</th>
                      <th className="py-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((session) => (
                      <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 text-white font-medium">
                          {new Date(session.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-4 text-zinc-300">
                          {session.team.name} <span className="text-xs text-zinc-500">({session.team.level})</span>
                        </td>
                        <td className="py-4 px-4 text-zinc-300">
                          {session.playersAssessed}
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
                            {session.averagePpi.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleViewDetails(session.id)}
                            className="bg-white/5 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-sm font-medium border border-white/10 transition-colors inline-flex items-center gap-1.5"
                          >
                            View Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SELECT TEAM */}
      {view === "select_team" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("history")}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Select Team</h1>
              <p className="text-zinc-400 text-sm">Choose which team you are conducting the practice session for.</p>
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-zinc-500">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-zinc-400 max-w-sm mx-auto">
                No teams found. Please create or manage your teams before launching practice.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className="bg-white/5 border border-white/10 hover:border-orange-500/40 p-6 rounded-3xl cursor-pointer hover:bg-white/[0.08] transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
                  <h3 className="text-lg font-bold text-white mb-1">{team.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{team.level}</p>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs text-zinc-500">CPI Score</span>
                    <span className="text-orange-500 font-bold">{team.teamCpiScore ? team.teamCpiScore.toFixed(1) : "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: SESSION DRAFT / SETUP */}
      {view === "session_draft" && selectedTeam && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("select_team")}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Setup Practice Session</h1>
              <p className="text-zinc-400 text-sm">Review players and configure the date.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Config Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl h-fit space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Session configuration</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Session Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 [color-scheme:dark] transition-colors"
                  />
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-xs text-zinc-500 block mb-1">Target Team</span>
                  <span className="font-bold text-white text-lg block">{selectedTeam.name}</span>
                  <span className="text-xs text-zinc-400">{selectedTeam.level}</span>
                </div>
              </div>

              <button
                onClick={handleStartLivePractice}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 text-base"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Live Practice
              </button>
            </div>

            {/* Right Roster Card */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Team Roster</h3>
                <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-zinc-400">
                  {players.length} Players
                </span>
              </div>

              {players.length === 0 ? (
                <p className="text-zinc-500 py-12 text-center text-sm">
                  This team doesn't have any players assigned. Go to Teams page to add players first.
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {players.map((player) => (
                    <div key={player.id} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-xs text-zinc-500">{player.role}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-500 block">Current PPI</span>
                        <span className="font-bold text-orange-400">{player.ppiScore ? player.ppiScore.toFixed(1) : "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LIVE PRACTICE MODE */}
      {view === "live_practice" && players[currentIdx] && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Top Wizard Indicator */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                Live Practice: <strong className="text-white">{selectedTeam?.name}</strong>
              </span>
              <span className="text-orange-500 font-bold">
                {currentIdx + 1} of {players.length} players assessed
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / players.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Assessment Sliders Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Evaluating Player</div>
                <h2 className="text-3xl font-extrabold text-white">{players[currentIdx].name}</h2>
                <p className="text-zinc-400 text-sm mt-0.5">{players[currentIdx].role}</p>
              </div>
              <div className="text-right bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-xl">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Player PPI</span>
                <span className="text-3xl font-black text-orange-500">{getActivePpiScore()}</span>
              </div>
            </div>

            {/* Metrics Sliders */}
            <div className="space-y-6">
              {METRICS.map((metric) => {
                const metricKey = metric.toLowerCase();
                const activePlayerId = players[currentIdx].id;
                const activeVal = assessmentsState[activePlayerId]?.[metricKey as keyof typeof assessmentsState[number]] as number || 5;

                return (
                  <div key={metric} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-zinc-300 text-sm">{metric}</label>
                      <span className="text-orange-400 font-bold bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20 text-xs">
                        {activeVal} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={activeVal}
                      onChange={(e) => handleScoreChange(metric, parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="border-t border-white/10 pt-6">
              <label className="text-sm font-semibold text-zinc-300 block mb-2">Performance Notes</label>
              <textarea
                rows={3}
                value={assessmentsState[players[currentIdx].id]?.notes || ""}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                placeholder={`Observations on ${players[currentIdx].name}'s technique, drive, or form...`}
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-white/10 pt-6 gap-4">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-5 py-3 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {currentIdx < players.length - 1 ? (
                <button
                  onClick={() => {
                    // Mark as scored
                    setAssessmentsState(prev => ({
                      ...prev,
                      [players[currentIdx].id]: {
                        ...prev[players[currentIdx].id],
                        isScored: true
                      }
                    }));
                    setCurrentIdx(prev => prev + 1);
                  }}
                  className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-6 py-3 font-semibold transition-all flex items-center gap-1.5"
                >
                  Next Player
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleCompleteSession}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 py-3.5 font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Complete Session
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SESSION DETAILS */}
      {view === "session_details" && selectedSessionDetails && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("history")}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Practice Session Details</h1>
              <p className="text-zinc-400 text-sm">Detailed overview of player assessments recorded on this date.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Session Info</span>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-400 block">Date</span>
                  <span className="text-sm font-bold text-white">
                    {new Date(selectedSessionDetails.session.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Team</span>
                  <span className="text-sm font-bold text-white">{selectedSessionDetails.session.team.name}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Level</span>
                  <span className="text-sm font-semibold text-zinc-300">{selectedSessionDetails.session.team.level}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Stats</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-zinc-400 block">Assessed</span>
                  <span className="text-2xl font-black text-white">{selectedSessionDetails.session.playersAssessed} Players</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Average PPI</span>
                  <span className="text-2xl font-black text-orange-500">{selectedSessionDetails.session.averagePpi.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-4">Player</th>
                    <th className="py-4 px-2 text-center">TEC</th>
                    <th className="py-4 px-2 text-center">INT</th>
                    <th className="py-4 px-2 text-center">EXE</th>
                    <th className="py-4 px-2 text-center">ADA</th>
                    <th className="py-4 px-2 text-center">DIS</th>
                    <th className="py-4 px-2 text-center">FOC</th>
                    <th className="py-4 px-4 text-center">PPI</th>
                    <th className="py-4 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {selectedSessionDetails.assessments.map((ass) => (
                    <tr key={ass.id}>
                      <td className="py-4 px-4 font-bold text-white">
                        {ass.player.name}
                        <span className="text-xs font-normal text-zinc-500 block">{ass.player.role}</span>
                      </td>
                      <td className="py-4 px-2 text-center text-zinc-300">{ass.technique}</td>
                      <td className="py-4 px-2 text-center text-zinc-300">{ass.intensity}</td>
                      <td className="py-4 px-2 text-center text-zinc-300">{ass.execution}</td>
                      <td className="py-4 px-2 text-center text-zinc-300">{ass.adaptability}</td>
                      <td className="py-4 px-2 text-center text-zinc-300">{ass.discipline}</td>
                      <td className="py-4 px-2 text-center text-zinc-300">{ass.focus}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 text-xs">
                          {ass.ppiScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 max-w-xs truncate" title={ass.notes}>
                        {ass.notes || <span className="text-zinc-600">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
