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
  MapPin, 
  X 
} from "lucide-react";
import { api } from "@/lib/api";

const METRICS = [
  "Technical Execution",
  "Decision Making",
  "Game Awareness",
  "Pressure Handling",
  "Team Contribution",
  "Match Impact"
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
  mpiScore?: number;
}

interface MatchSession {
  id: number;
  team: {
    id: number;
    name: string;
    level: string;
  };
  name: string;
  opponent: string;
  venue?: string;
  date: string;
  playersAssessed: number;
  averageMpi: number;
}

interface MatchAssessment {
  id: number;
  player: {
    name: string;
    role: string;
  };
  technicalExecution: number;
  decisionMaking: number;
  gameAwareness: number;
  pressureHandling: number;
  teamContribution: number;
  matchImpact: number;
  mpiScore: number;
  notes?: string;
}

interface MatchDetails {
  session: MatchSession;
  assessments: MatchAssessment[];
}

export default function MatchesPage() {
  const router = useRouter();

  // Navigation / View State
  const [view, setView] = useState<"history" | "create_match" | "live_assessment" | "match_details">("history");
  
  // Data State
  const [history, setHistory] = useState<MatchSession[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayersIds, setSelectedPlayersIds] = useState<number[]>([]);
  const [selectedMatchDetails, setSelectedMatchDetails] = useState<MatchDetails | null>(null);

  // Modal / Assessment state
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [assessingPlayer, setAssessingPlayer] = useState<Player | null>(null);

  // Form Fields
  const [matchName, setMatchName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [venue, setVenue] = useState("");

  // Live Assessment State
  const [assessmentsState, setAssessmentsState] = useState<Record<number, {
    technicalExecution: number;
    decisionMaking: number;
    gameAwareness: number;
    pressureHandling: number;
    teamContribution: number;
    matchImpact: number;
    notes: string;
    isScored: boolean;
  }>>({});

  // Temporary scores in the active assessment modal
  const [tempScores, setTempScores] = useState<Record<string, number>>({
    "Technical Execution": 5,
    "Decision Making": 5,
    "Game Awareness": 5,
    "Pressure Handling": 5,
    "Team Contribution": 5,
    "Match Impact": 5,
  });
  const [tempNotes, setTempNotes] = useState("");

  // Status State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize date to today and fetch match history
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setMatchDate(today);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/matches/sessions");
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching match session history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreateMatch = async () => {
    setLoading(true);
    setMatchName("");
    setOpponentName("");
    setVenue("");
    setSelectedTeam(null);
    setPlayers([]);
    setSelectedPlayersIds([]);
    const today = new Date().toISOString().split("T")[0];
    setMatchDate(today);

    try {
      const response = await api.get("/teams");
      setTeams(response.data);
      setView("create_match");
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
    // Select all players by default
    setSelectedPlayersIds(response.data.map((p: Player) => p.id));

    // Initialize assessments state for team players
    setAssessmentsState(prev => {
      const updated = { ...prev };
      response.data.forEach((p: Player) => {
        if (!updated[p.id]) {
          updated[p.id] = {
            technicalExecution: 5,
            decisionMaking: 5,
            gameAwareness: 5,
            pressureHandling: 5,
            teamContribution: 5,
            matchImpact: 5,
            notes: "",
            isScored: false
          };
        }
      });
      return updated;
    });
  };

  const handleSelectTeamChange = async (teamIdStr: string) => {
    if (!teamIdStr) {
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayersIds([]);
      return;
    }
    const teamId = parseInt(teamIdStr);
    const team = teams.find(t => t.id === teamId) || null;
    setSelectedTeam(team);
    if (team) {
      setLoading(true);
      try {
        await loadTeamPlayers(team.id);
      } catch (err) {
        console.error("Error fetching players for team:", err);
        setMessage({ type: "error", text: "Failed to load team players." });
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePlayerParticipation = (playerId: number) => {
    setSelectedPlayersIds(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleStartMatchAssessment = () => {
    if (!matchName.trim()) {
      setMessage({ type: "error", text: "Match Name is required." });
      return;
    }
    if (!selectedTeam) {
      setMessage({ type: "error", text: "Please select a team." });
      return;
    }
    if (!matchDate) {
      setMessage({ type: "error", text: "Match Date is required." });
      return;
    }
    if (!opponentName.trim()) {
      setMessage({ type: "error", text: "Opponent Name is required." });
      return;
    }
    if (selectedPlayersIds.length === 0) {
      setMessage({ type: "error", text: "Please select at least one participating player." });
      return;
    }
    setMessage(null);
    setView("live_assessment");
  };

  // Click player card to assess
  const handleOpenAssessPlayer = (player: Player) => {
    setAssessingPlayer(player);
    const existing = assessmentsState[player.id];
    setTempScores({
      "Technical Execution": existing?.technicalExecution ?? 5,
      "Decision Making": existing?.decisionMaking ?? 5,
      "Game Awareness": existing?.gameAwareness ?? 5,
      "Pressure Handling": existing?.pressureHandling ?? 5,
      "Team Contribution": existing?.teamContribution ?? 5,
      "Match Impact": existing?.matchImpact ?? 5,
    });
    setTempNotes(existing?.notes ?? "");
    setIsAssessModalOpen(true);
  };

  const handleSaveAssessmentScores = () => {
    if (!assessingPlayer) return;

    setAssessmentsState(prev => ({
      ...prev,
      [assessingPlayer.id]: {
        technicalExecution: tempScores["Technical Execution"],
        decisionMaking: tempScores["Decision Making"],
        gameAwareness: tempScores["Game Awareness"],
        pressureHandling: tempScores["Pressure Handling"],
        teamContribution: tempScores["Team Contribution"],
        matchImpact: tempScores["Match Impact"],
        notes: tempNotes,
        isScored: true
      }
    }));

    setIsAssessModalOpen(false);
    setAssessingPlayer(null);
  };

  const getPlayerMpiInLiveSession = (playerId: number) => {
    const a = assessmentsState[playerId];
    if (!a || !a.isScored) return null;
    const sum = a.technicalExecution + a.decisionMaking + a.gameAwareness + a.pressureHandling + a.teamContribution + a.matchImpact;
    return (sum / 6.0).toFixed(1);
  };

  const getParticipantPlayers = () => {
    return players.filter(p => selectedPlayersIds.includes(p.id));
  };

  const countScoredPlayers = () => {
    let count = 0;
    getParticipantPlayers().forEach(p => {
      if (assessmentsState[p.id]?.isScored) count++;
    });
    return count;
  };

  const isAllPlayersScored = () => {
    const participants = getParticipantPlayers();
    if (participants.length === 0) return false;
    return participants.every(p => assessmentsState[p.id]?.isScored);
  };

  const handleCompleteMatchAssessment = async () => {
    if (!selectedTeam) return;
    setSaving(true);
    setMessage(null);

    const assessmentsPayload = getParticipantPlayers().map(p => {
      const a = assessmentsState[p.id];
      return {
        playerId: p.id,
        technicalExecution: a.technicalExecution,
        decisionMaking: a.decisionMaking,
        gameAwareness: a.gameAwareness,
        pressureHandling: a.pressureHandling,
        teamContribution: a.teamContribution,
        matchImpact: a.matchImpact,
        notes: a.notes,
      };
    });

    try {
      await api.post("/matches/sessions", {
        teamId: selectedTeam.id,
        date: matchDate,
        name: matchName,
        opponent: opponentName,
        venue: venue || null,
        assessments: assessmentsPayload
      });

      setMessage({ type: "success", text: "Match assessment completed and saved to history successfully!" });
      setTimeout(() => {
        setView("history");
        fetchHistory();
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || "Failed to complete match assessment.";
      setMessage({ type: "error", text: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg) });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/matches/sessions/${sessionId}`);
      setSelectedMatchDetails(response.data);
      setView("match_details");
    } catch (err) {
      console.error("Error fetching match session details:", err);
      setMessage({ type: "error", text: "Failed to load match details." });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-450 text-xs">Loading matches data...</p>
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

      {/* VIEW: MATCH HISTORY */}
      {view === "history" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4.5">
            <div className="space-y-1">
              <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">Matches</h1>
              <p className="text-zinc-450 text-xs sm:text-sm font-semibold leading-relaxed">Record match details and calculate player performance index metrics.</p>
            </div>
            <button
              onClick={handleStartCreateMatch}
              className="h-11 px-5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-650/15 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Match
            </button>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4 shadow-md">
            <h2 className="text-[10px] sm:text-[11px] font-black text-zinc-455 uppercase tracking-wider">Match History</h2>
            
            {history.length === 0 ? (
              <div className="py-14 text-center space-y-3.5 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-full border border-dashed border-orange-500/20 flex items-center justify-center mx-auto text-zinc-500">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-zinc-350 text-xs sm:text-sm font-black uppercase tracking-wider">No Matches Found</h3>
                  <p className="text-zinc-555 text-[11px] sm:text-xs font-semibold leading-relaxed mt-1">
                    Assess player match performances by creating your first match record.
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
                        <th className="py-3 px-4">Match Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4">Opponent</th>
                        <th className="py-3 px-4">Players Assessed</th>
                        <th className="py-3 px-4">Average MPI</th>
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
                          <td className="py-3 px-4 text-zinc-300 font-semibold">{session.opponent}</td>
                          <td className="py-3 px-4 text-zinc-300">{session.playersAssessed}</td>
                          <td className="py-3 px-4">
                            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-md text-[10px] font-bold">
                              {(session.averageMpi || 0.0).toFixed(1)}
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
                          {(session.averageMpi || 0.0).toFixed(1)} MPI
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 border-t border-white/5 pt-2">
                        <div>
                          <span className="text-[9px] text-zinc-550 block uppercase font-bold">Team</span>
                          <span className="font-bold text-zinc-300">{session.team.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-555 block uppercase font-bold">Opponent</span>
                          <span className="font-bold text-zinc-300">{session.opponent}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-[10px] text-zinc-500 font-semibold">{session.playersAssessed} Assessed</span>
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

      {/* VIEW: CREATE MATCH */}
      {view === "create_match" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3.5 border-b border-white/5 pb-4">
            <button
              onClick={() => setView("history")}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Create Match</h1>
              <p className="text-zinc-450 text-xs sm:text-sm font-semibold leading-relaxed mt-0.5">Configure match details and pick participating players.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Form Card */}
            <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md h-fit space-y-4 shadow-md">
              <div className="text-[10px] sm:text-[11px] font-black text-zinc-455 uppercase tracking-wider">Match Configuration</div>
              
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Match Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Cup Finals"
                    value={matchName}
                    onChange={(e) => setMatchName(e.target.value)}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Select Team</label>
                  <select
                    onChange={(e) => handleSelectTeamChange(e.target.value)}
                    value={selectedTeam?.id || ""}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-zinc-950 text-zinc-550 text-xs">Choose team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} className="bg-zinc-950 text-white text-xs">
                        {team.name} ({team.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Match Date</label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 [color-scheme:dark] transition-colors cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Opponent Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Avengers CC"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Venue (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Lords Cricket Ground"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleStartMatchAssessment}
                className="h-11 w-full rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-605/15"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                Start Match Assessment
              </button>
            </div>

            {/* Right Roster / Selection Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">Match Squad Selection</h3>
                  <p className="text-zinc-455 text-xs font-semibold leading-relaxed mt-0.5">Select the players who participated in the match.</p>
                </div>
                <span className="text-[9px] sm:text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-zinc-400 font-bold uppercase tracking-wider shrink-0">
                  {selectedPlayersIds.length} / {players.length} Selected
                </span>
              </div>

              {!selectedTeam ? (
                <div className="py-24 text-center space-y-2.5">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-zinc-500 text-sm font-semibold">
                    Select a team to load its roster.
                  </p>
                </div>
              ) : players.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-zinc-500 text-sm font-semibold">
                    No players found in this team roster. Please add players first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {players.map((player) => {
                    const isParticipating = selectedPlayersIds.includes(player.id);
                    return (
                      <div 
                        key={player.id}
                        onClick={() => togglePlayerParticipation(player.id)}
                        className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.04] ${
                          isParticipating 
                            ? "bg-orange-500/5 border-orange-500/30" 
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-sm text-white">{player.name}</div>
                          <div className="text-[10px] text-zinc-550 mt-0.5 font-bold uppercase tracking-wide">{player.role}</div>
                        </div>

                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isParticipating 
                            ? "bg-orange-600 border-orange-600 text-white" 
                            : "border-white/20"
                        }`}>
                          {isParticipating && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LIVE ASSESSMENT */}
      {view === "live_assessment" && selectedTeam && (
        <div className="space-y-6">
          {/* Top Progress Bar & Completion Button */}
          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold">
                  Match Assessment: <strong className="text-white">{matchName}</strong> vs <strong className="text-white">{opponentName}</strong>
                </span>
                <span className="text-orange-500 font-black uppercase tracking-wider text-[10px]">
                  {countScoredPlayers()} of {selectedPlayersIds.length} Players Assessed
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${(countScoredPlayers() / selectedPlayersIds.length) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleCompleteMatchAssessment}
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
                  Complete Match Assessment
                </>
              )}
            </button>
          </div>

          <div className="space-y-3.5">
            <h2 className="text-xs font-black text-zinc-450 uppercase tracking-wider px-1">Active Match Squad</h2>
            <p className="text-zinc-550 text-[10px] uppercase tracking-wider font-bold px-1 -mt-1.5">Select a player to score their MPI metrics.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getParticipantPlayers().map((player) => {
                const liveMpi = getPlayerMpiInLiveSession(player.id);
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
                            Completed
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
                      <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">MPI Score</span>
                      {isCompleted ? (
                        <span className="text-emerald-400 font-black text-base">{liveMpi}</span>
                      ) : (
                        <span className="text-zinc-555 text-xs italic font-semibold">Unassessed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MATCH DETAILS */}
      {view === "match_details" && selectedMatchDetails && (
        <div className="space-y-6">
          <div className="flex items-center gap-3.5 border-b border-white/5 pb-4">
            <button
              onClick={() => setView("history")}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Match Assessment Details</h1>
              <p className="text-zinc-455 text-xs sm:text-sm font-semibold mt-0.5">Review player scores and performance metrics recorded for this match.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Match info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-md">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Match Details</span>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Match Name</span>
                  <span className="font-extrabold text-white text-sm">{selectedMatchDetails.session.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Opponent</span>
                  <span className="font-extrabold text-white">{selectedMatchDetails.session.opponent}</span>
                </div>
                {selectedMatchDetails.session.venue && (
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" /> Venue
                    </span>
                    <span className="font-extrabold text-white">{selectedMatchDetails.session.venue}</span>
                  </div>
                )}
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Date</span>
                  <span className="font-extrabold text-white">
                    {new Date(selectedMatchDetails.session.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Team details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-md">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Team Info</span>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Team</span>
                  <span className="font-extrabold text-white text-sm">{selectedMatchDetails.session.team.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Level</span>
                  <span className="font-extrabold text-zinc-350">{selectedMatchDetails.session.team.level}</span>
                </div>
              </div>
            </div>

            {/* Overall summary stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-md">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Performance Overview</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Assessed</span>
                  <span className="text-lg font-black text-white">{selectedMatchDetails.session.playersAssessed} Players</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Average MPI</span>
                  <span className="text-lg font-black text-orange-500">{(selectedMatchDetails.session.averageMpi || 0.0).toFixed(1)}</span>
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
                    <th className="py-3 px-2 text-center">DEC</th>
                    <th className="py-3 px-2 text-center">AWA</th>
                    <th className="py-3 px-2 text-center">PRE</th>
                    <th className="py-3 px-2 text-center">CON</th>
                    <th className="py-3 px-2 text-center">IMP</th>
                    <th className="py-3 px-4 text-center">MPI Score</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {selectedMatchDetails.assessments.map((ass) => (
                    <tr key={ass.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 px-4 font-bold text-white">
                        {ass.player.name}
                        <span className="text-[11px] font-normal text-zinc-550 block">{ass.player.role}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.technicalExecution}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.decisionMaking}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.gameAwareness}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.pressureHandling}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.teamContribution}</td>
                      <td className="py-3 px-2 text-center text-zinc-300">{ass.matchImpact}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20 text-[11px]">
                          {(ass.mpiScore || 0.0).toFixed(1)}
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

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-3.5">
              {selectedMatchDetails.assessments.map((ass) => (
                <div key={ass.id} className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                    <div>
                      <div className="font-extrabold text-white text-base">{ass.player.name}</div>
                      <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-0.5">{ass.player.role}</div>
                    </div>
                    <span className="text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20 text-[11px]">
                      MPI: {(ass.mpiScore || 0.0).toFixed(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">TEC</span>
                      <span className="font-bold text-zinc-300">{ass.technicalExecution}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">DEC</span>
                      <span className="font-bold text-zinc-300">{ass.decisionMaking}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">AWA</span>
                      <span className="font-bold text-zinc-300">{ass.gameAwareness}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">PRE</span>
                      <span className="font-bold text-zinc-300">{ass.pressureHandling}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">CON</span>
                      <span className="font-bold text-zinc-300">{ass.teamContribution}</span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-zinc-550 block uppercase font-bold">IMP</span>
                      <span className="font-bold text-zinc-300">{ass.matchImpact}</span>
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

      {/* MODAL: PLAYER ASSESSMENT SLIDERS */}
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

            {/* Sliders Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map((metric) => (
                <div key={metric} className="space-y-1.5 bg-white/5 border border-white/5 p-2.5 rounded-xl">
                  <div className="flex justify-between items-center text-[10px]">
                    <label className="font-bold text-zinc-400 leading-none">{metric}</label>
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
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Match Notes / Comments</label>
              <textarea
                rows={2}
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-650 focus:outline-none focus:border-orange-500 transition-colors text-xs"
                placeholder={`Observations on ${assessingPlayer.name}'s match contribution...`}
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
                className="h-11 px-4 rounded-xl text-xs font-bold transition-all bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
