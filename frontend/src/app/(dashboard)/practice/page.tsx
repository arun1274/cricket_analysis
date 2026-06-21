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
  Trash2, 
  X 
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
  name: string;
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

  // Modals & Pool state
  const [allPoolPlayers, setAllPoolPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [assessingPlayer, setAssessingPlayer] = useState<Player | null>(null);

  // Draft / Live State
  const [sessionDate, setSessionDate] = useState("");
  const [sessionName, setSessionName] = useState("");
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

  // Temporary scores in the active assessment modal
  const [tempScores, setTempScores] = useState<Record<string, number>>({
    Technique: 5,
    Intensity: 5,
    Execution: 5,
    Adaptability: 5,
    Discipline: 5,
    Focus: 5,
  });
  const [tempNotes, setTempNotes] = useState("");

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
    setSessionName("");
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

  const loadTeamPlayers = async (teamId: number) => {
    const response = await api.get(`/players/team/${teamId}`);
    setPlayers(response.data);

    // Maintain assessments state for new players while keeping existing scores
    setAssessmentsState(prev => {
      const updated = { ...prev };
      response.data.forEach((p: Player) => {
        if (!updated[p.id]) {
          updated[p.id] = {
            technique: 5,
            intensity: 5,
            execution: 5,
            adaptability: 5,
            discipline: 5,
            focus: 5,
            notes: "",
            isScored: false
          };
        }
      });
      return updated;
    });
  };

  const handleSelectTeam = async (team: Team) => {
    setLoading(true);
    setSelectedTeam(team);
    try {
      await loadTeamPlayers(team.id);
      setView("session_draft");
    } catch (err) {
      console.error("Error fetching players for team:", err);
      setMessage({ type: "error", text: "Failed to load team players." });
    } finally {
      setLoading(false);
    }
  };

  // Add existing player to team
  const handleOpenAddPlayer = async () => {
    setLoading(true);
    try {
      const response = await api.get("/players");
      setAllPoolPlayers(response.data);
      setIsAddPlayerOpen(true);
    } catch (err) {
      console.error("Error fetching player pool:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayerToTeam = async (playerId: number) => {
    if (!selectedTeam) return;
    try {
      await api.post(`/teams/${selectedTeam.id}/players/${playerId}`);
      await loadTeamPlayers(selectedTeam.id);
      setIsAddPlayerOpen(false);
    } catch (err: any) {
      console.error("Failed to add player to team:", err);
      alert(err.response?.data?.message || "Could not add player.");
    }
  };

  const handleRemovePlayerFromTeam = async (playerId: number) => {
    if (!selectedTeam) return;
    if (!confirm("Are you sure you want to remove this player from the team?")) return;
    try {
      await api.delete(`/teams/${selectedTeam.id}/players/${playerId}`);
      await loadTeamPlayers(selectedTeam.id);
    } catch (err: any) {
      console.error("Failed to remove player:", err);
      alert(err.response?.data?.message || "Could not remove player.");
    }
  };

  const handleStartLivePractice = () => {
    if (!sessionName.trim()) {
      setMessage({ type: "error", text: "Session Name is required." });
      return;
    }
    if (!sessionDate) {
      setMessage({ type: "error", text: "Session Date is required." });
      return;
    }
    if (players.length === 0) {
      setMessage({ type: "error", text: "No players in this team to assess." });
      return;
    }
    setView("live_practice");
  };

  // Click player card to assess
  const handleOpenAssessPlayer = (player: Player) => {
    setAssessingPlayer(player);
    const existing = assessmentsState[player.id];
    setTempScores({
      Technique: existing?.technique ?? 5,
      Intensity: existing?.intensity ?? 5,
      Execution: existing?.execution ?? 5,
      Adaptability: existing?.adaptability ?? 5,
      Discipline: existing?.discipline ?? 5,
      Focus: existing?.focus ?? 5,
    });
    setTempNotes(existing?.notes ?? "");
    setIsAssessModalOpen(true);
  };

  const handleSaveAssessmentScores = () => {
    if (!assessingPlayer) return;

    setAssessmentsState(prev => ({
      ...prev,
      [assessingPlayer.id]: {
        technique: tempScores["Technique"],
        intensity: tempScores["Intensity"],
        execution: tempScores["Execution"],
        adaptability: tempScores["Adaptability"],
        discipline: tempScores["Discipline"],
        focus: tempScores["Focus"],
        notes: tempNotes,
        isScored: true
      }
    }));

    setIsAssessModalOpen(false);
    setAssessingPlayer(null);
  };

  const getPlayerPpiInLiveSession = (playerId: number) => {
    const a = assessmentsState[playerId];
    if (!a || !a.isScored) return null;
    const sum = a.technique + a.intensity + a.execution + a.adaptability + a.discipline + a.focus;
    return (sum / 6.0).toFixed(1);
  };

  const countScoredPlayers = () => {
    let count = 0;
    players.forEach(p => {
      if (assessmentsState[p.id]?.isScored) count++;
    });
    return count;
  };

  const isAllPlayersScored = () => {
    if (players.length === 0) return false;
    return players.every(p => assessmentsState[p.id]?.isScored);
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
        name: sessionName,
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
      const errMsg = err.response?.data?.message || err.response?.data || err.message || "Failed to complete practice session.";
      setMessage({ type: "error", text: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg) });
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

  // Get only pool players who are not already in the team roster
  const getFilteredPoolPlayers = () => {
    return allPoolPlayers.filter(p => !players.some(tp => tp.id === p.id));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-450 text-xs">Loading practice details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-1 pb-12">
      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-405" 
            : "bg-red-500/10 border-red-500/20 text-red-405"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />}
          <span className="font-semibold text-xs sm:text-sm">{message.text}</span>
        </div>
      )}

      {/* VIEW: PRACTICE HISTORY */}
      {view === "history" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4.5">
            <div className="space-y-1">
              <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">Practice</h1>
              <p className="text-zinc-455 text-xs sm:text-sm font-semibold leading-relaxed">Evaluate and monitor player training performance indices.</p>
            </div>
            <button
              onClick={handleStartAddPractice}
              className="h-11 px-5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-650/15 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Practice
            </button>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4 shadow-md">
            <h2 className="text-[10px] sm:text-[11px] font-black text-zinc-455 uppercase tracking-wider">Practice History</h2>
            
            {history.length === 0 ? (
              <div className="py-14 text-center space-y-3.5 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-full border border-dashed border-orange-500/20 flex items-center justify-center mx-auto text-zinc-500">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-zinc-350 text-xs sm:text-sm font-black uppercase tracking-wider">No Sessions Conducted</h3>
                  <p className="text-zinc-555 text-[11px] sm:text-xs font-semibold leading-relaxed mt-1">
                    Evaluate squad performance by launching a live practice session.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3 px-4">Session Name</th>
                        <th className="py-3 px-4">Session Date</th>
                        <th className="py-3 px-4">Team Name</th>
                        <th className="py-3 px-4">Players Assessed</th>
                        <th className="py-3 px-4">Average PPI</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {history.map((session) => (
                        <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-white font-extrabold">{session.name}</td>
                          <td className="py-3 px-4 text-zinc-300">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4 text-zinc-450">
                            {session.team.name} <span className="text-[10px] text-zinc-550">({session.team.level})</span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300">{session.playersAssessed}</td>
                          <td className="py-3 px-4">
                            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-md text-[10px] font-bold">
                              {session.averagePpi.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleViewDetails(session.id)}
                              className="h-9 px-4 rounded-lg text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              Details
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block md:hidden space-y-3.5">
                  {history.map((session) => (
                    <div 
                      key={session.id}
                      className="bg-white/5 border border-white/10 p-4.5 rounded-2xl space-y-3 hover:border-orange-500/20 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-white text-sm">{session.name}</h4>
                          <p className="text-[10px] text-zinc-550 mt-1">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                          {session.averagePpi.toFixed(1)} PPI
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-400 border-t border-white/5 pt-2">
                        <div>
                          <span className="text-[9px] text-zinc-550 block uppercase font-bold">Team</span>
                          <span className="font-bold text-zinc-300">{session.team.name}</span>
                        </div>
                        <button
                          onClick={() => handleViewDetails(session.id)}
                          className="h-8 px-3 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SELECT TEAM */}
      {view === "select_team" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3.5 border-b border-white/5 pb-4">
            <button
              onClick={() => setView("history")}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Select Team</h1>
              <p className="text-zinc-450 text-xs sm:text-sm font-semibold leading-relaxed mt-0.5">Choose which team you are conducting the practice session for.</p>
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-10 text-center space-y-4 max-w-sm mx-auto shadow-md">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto text-zinc-500">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-zinc-500 text-xs font-semibold max-w-xs mx-auto">
                No teams found. Please create or manage your teams before launching practice.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 hover:border-orange-500/20 p-5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all duration-300 group relative overflow-hidden shadow-md backdrop-blur-md"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
                  <h3 className="text-lg font-black text-white mb-1">{team.name}</h3>
                  <p className="text-zinc-450 text-[10px] font-bold uppercase tracking-wider mb-4">{team.level}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">CPI Score</span>
                    <span className="text-orange-500 font-black text-sm">{team.teamCpiScore ? team.teamCpiScore.toFixed(1) : "N/A"}</span>
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
          <div className="flex items-center gap-3.5 border-b border-white/5 pb-4">
            <button
              onClick={() => setView("select_team")}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Setup Practice Session</h1>
              <p className="text-zinc-455 text-xs sm:text-sm font-semibold mt-0.5">Review squad roster and configure session settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Config Card */}
            <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md h-fit space-y-4 shadow-md">
              <div className="space-y-3.5">
                <div className="text-[10px] sm:text-[11px] font-black text-zinc-455 uppercase tracking-wider">Session configuration</div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Session Name</label>
                  <input
                    type="text"
                    placeholder="Enter session name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Session Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 [color-scheme:dark] transition-colors cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-0.5">Target Team</span>
                  <span className="font-extrabold text-white text-lg block">{selectedTeam.name}</span>
                  <span className="text-xs text-zinc-400 font-semibold">{selectedTeam.level}</span>
                </div>
              </div>

              <button
                onClick={handleStartLivePractice}
                className="h-11 w-full rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-605/15"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                Start Live Practice
              </button>
            </div>

            {/* Right Roster Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">Team Roster</h3>
                  <p className="text-zinc-455 text-xs font-semibold leading-relaxed mt-0.5">Manage player pool before starting the session.</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleOpenAddPlayer}
                    className="h-9 px-4 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-500" />
                    Add Player
                  </button>
                  <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-zinc-400 font-bold uppercase tracking-wider shrink-0">
                    {players.length} Players
                  </span>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-zinc-500 text-xs font-semibold">
                    This team doesn't have any players assigned. Click "Add Player" to assign players.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {players.map((player) => (
                    <div key={player.id} className="py-3 flex items-center justify-between group">
                      <div>
                        <div className="font-extrabold text-sm text-white">{player.name}</div>
                        <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wide mt-0.5">{player.role}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-550 block uppercase font-bold tracking-wider">PPI Score</span>
                          <span className="font-extrabold text-orange-400 text-xs">{player.ppiScore ? player.ppiScore.toFixed(1) : "0.0"}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePlayerFromTeam(player.id)}
                          className="p-1.5 text-zinc-550 hover:text-red-405 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Remove Player from Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {view === "live_practice" && selectedTeam && (
        <div className="space-y-6">
          {/* Top Progress & Complete Button bar */}
          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-450 font-bold">
                  Live Session: <strong className="text-white">{selectedTeam.name}</strong>
                </span>
                <span className="text-orange-500 font-black uppercase tracking-wider text-[10px]">
                  {countScoredPlayers()} of {players.length} players completed
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${(countScoredPlayers() / players.length) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleCompleteSession}
              disabled={saving || !isAllPlayersScored()}
              className="h-11 px-5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/10 shrink-0"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Practice
                </>
              )}
            </button>
          </div>

          <div className="space-y-3.5">
            <h2 className="text-xs font-black text-zinc-450 uppercase tracking-wider px-1">Assess Players</h2>
            <p className="text-zinc-550 text-[10px] uppercase tracking-wider font-bold px-1 -mt-1.5">Click on any player card to score and write assessments.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {players.map((player) => {
                const livePpi = getPlayerPpiInLiveSession(player.id);
                const isCompleted = assessmentsState[player.id]?.isScored;

                return (
                  <div
                    key={player.id}
                    onClick={() => handleOpenAssessPlayer(player)}
                    className={`border p-4.5 rounded-2xl cursor-pointer transition-all hover:bg-white/[0.04] flex flex-col justify-between h-34 shadow-md ${
                      isCompleted 
                        ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50" 
                        : "bg-white/5 border-white/10 hover:border-orange-500/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-white text-sm truncate pr-2">{player.name}</h4>
                        {isCompleted ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-0.5 uppercase">
                            <Check className="w-2.5 h-2.5" />
                            Done
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-550 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 uppercase">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-450 text-[10px] font-bold mt-1 uppercase tracking-wide">{player.role}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">Live PPI</span>
                      {isCompleted ? (
                        <span className="text-emerald-400 font-black text-base">{livePpi}</span>
                      ) : (
                        <span className="text-zinc-555 text-xs italic font-semibold">Not assessed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SESSION DETAILS */}
      {view === "session_details" && selectedSessionDetails && (
        <div className="space-y-6">
          <div className="flex items-center gap-3.5 border-b border-white/5 pb-4">
            <button
              onClick={() => setView("history")}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Practice Session Details</h1>
              <p className="text-zinc-455 text-xs sm:text-sm font-semibold mt-0.5">Detailed overview of player assessments recorded on this date.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-md">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Session Info</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Name</span>
                  <span className="font-extrabold text-white">{selectedSessionDetails.session.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Date</span>
                  <span className="font-extrabold text-white">
                    {new Date(selectedSessionDetails.session.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Team</span>
                  <span className="font-extrabold text-white">{selectedSessionDetails.session.team.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Level</span>
                  <span className="font-extrabold text-zinc-350">{selectedSessionDetails.session.team.level}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-md col-span-2">
              <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider block">Stats Overview</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Assessed</span>
                  <span className="text-lg font-black text-white">{selectedSessionDetails.session.playersAssessed} Players</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Average PPI</span>
                  <span className="text-lg font-black text-orange-500">{selectedSessionDetails.session.averagePpi.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-md">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-2 text-center">TEC</th>
                    <th className="py-3 px-2 text-center">INT</th>
                    <th className="py-3 px-2 text-center">EXE</th>
                    <th className="py-3 px-2 text-center">ADA</th>
                    <th className="py-3 px-2 text-center">DIS</th>
                    <th className="py-3 px-2 text-center">FOC</th>
                    <th className="py-3 px-4 text-center">PPI Score</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {selectedSessionDetails.assessments.map((ass) => (
                    <tr key={ass.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 px-4 font-bold text-white">
                        {ass.player.name}
                        <span className="text-[11px] font-normal text-zinc-550 block">{ass.player.role}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.technique}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.intensity}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.execution}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.adaptability}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.discipline}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.focus}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-orange-405 font-bold bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20 text-[11px]">
                          {ass.ppiScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 max-w-xs truncate" title={ass.notes}>
                        {ass.notes || <span className="text-zinc-650">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3.5">
              {selectedSessionDetails.assessments.map((ass) => (
                <div key={ass.id} className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                    <div>
                      <div className="font-extrabold text-white text-base">{ass.player.name}</div>
                      <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">{ass.player.role}</div>
                    </div>
                    <span className="text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20 text-[11px]">
                      PPI: {ass.ppiScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">TEC</span>
                      <span className="font-bold text-zinc-300 text-xs">{ass.technique}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-555 block uppercase font-bold">INT</span>
                      <span className="font-bold text-zinc-300 text-xs">{ass.intensity}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-555 block uppercase font-bold">EXE</span>
                      <span className="font-bold text-zinc-300 text-xs">{ass.execution}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-555 block uppercase font-bold">ADA</span>
                      <span className="font-bold text-zinc-300 text-xs">{ass.adaptability}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-555 block uppercase font-bold">DIS</span>
                      <span className="font-bold text-zinc-300 text-xs">{ass.discipline}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-555 block uppercase font-bold">FOC</span>
                      <span className="font-bold text-zinc-300 text-xs">{ass.focus}</span>
                    </div>
                  </div>
                  {ass.notes && (
                    <div className="text-xs text-zinc-405 pt-2.5 border-t border-white/5">
                      <span className="text-zinc-555 font-bold uppercase tracking-wider block mb-0.5 text-[9px]">Notes</span>
                      {ass.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXISTING PLAYER */}
      {isAddPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative backdrop-blur-xl">
            <button
              onClick={() => setIsAddPlayerOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Add Existing Player</h3>
              <p className="text-xs text-zinc-450 mt-0.5">Select a player from your organization roster to add to this team.</p>
            </div>

            <div className="max-h-[260px] overflow-y-auto divide-y divide-white/5 pr-1 custom-scrollbar">
              {getFilteredPoolPlayers().length === 0 ? (
                <p className="text-zinc-555 text-xs text-center py-6">No other available players to add.</p>
              ) : (
                getFilteredPoolPlayers().map(player => (
                  <div key={player.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{player.name}</div>
                      <div className="text-[10px] text-zinc-500">{player.role}</div>
                    </div>
                    <button
                      onClick={() => handleAddPlayerToTeam(player.id)}
                      className="h-8 w-8 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INDIVIDUAL PLAYER ASSESSMENT */}
      {isAssessModalOpen && assessingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative my-4 backdrop-blur-xl">
            <button
              onClick={() => {
                setIsAssessModalOpen(false);
                setAssessingPlayer(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-white/5 pb-2.5">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Assessment for</span>
              <h3 className="text-lg font-black text-white">{assessingPlayer.name}</h3>
              <p className="text-zinc-450 text-[10px] font-bold mt-0.5 uppercase tracking-wide">{assessingPlayer.role}</p>
            </div>

            {/* Metric Sliders Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map((metric) => (
                <div key={metric} className="space-y-1.5 bg-white/5 border border-white/5 p-2.5 rounded-xl">
                  <div className="flex justify-between items-center text-[10px]">
                    <label className="font-bold text-zinc-400">{metric}</label>
                    <span className="text-orange-400 font-extrabold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 text-[9px]">
                      {tempScores[metric]}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={tempScores[metric]}
                    onChange={(e) => setTempScores({ ...tempScores, [metric]: parseInt(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 my-1"
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Coach Comments</label>
              <textarea
                rows={2}
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-650 focus:outline-none focus:border-orange-500 transition-colors text-xs"
                placeholder={`Observations on ${assessingPlayer.name}'s form...`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-white/5 pt-3">
              <button
                onClick={() => {
                  setIsAssessModalOpen(false);
                  setAssessingPlayer(null);
                }}
                className="h-11 px-4 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssessmentScores}
                className="h-11 px-4 rounded-xl text-xs font-bold transition-all bg-orange-655 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
