"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { UserSquare2, Plus, Loader2, Pencil, Trash2, X, Search, Filter, AlertTriangle, ShieldCheck, Award, Users, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";

interface Team {
  id: number;
  name: string;
}

interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  ppiScore: number;
  mpiScore: number;
  teams?: Team[];
  team?: Team;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  // Form states
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    role: "Batsman",
    battingStyle: "Right-hand bat",
    bowlingStyle: "Right-arm Fast",
    teamId: ""
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "",
    battingStyle: "",
    bowlingStyle: "",
    teamId: ""
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [playersRes, teamsRes] = await Promise.all([
        api.get("/players"),
        api.get("/teams")
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (err: any) {
      console.error("Failed to fetch players page data", err);
      setError("Failed to load players and teams data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/players", {
        ...newPlayer,
        teamId: newPlayer.teamId ? Number(newPlayer.teamId) : null
      });
      setShowAddModal(false);
      setNewPlayer({
        name: "",
        role: "Batsman",
        battingStyle: "Right-hand bat",
        bowlingStyle: "Right-arm Fast",
        teamId: ""
      });
      await fetchData();
    } catch (err: any) {
      console.error("Failed to add player", err);
      setError(err.response?.data?.message || "Failed to add player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (player: Player) => {
    setEditingPlayer(player);
    setEditFormData({
      name: player.name,
      role: player.role,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      teamId: player.team ? String(player.team.id) : ""
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.put(`/players/${editingPlayer.id}`, {
        ...editFormData,
        teamId: editFormData.teamId ? Number(editFormData.teamId) : null
      });
      setEditingPlayer(null);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to update player", err);
      setError(err.response?.data?.message || "Failed to update player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingPlayer) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/players/${deletingPlayer.id}`);
      setDeletingPlayer(null);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to delete player", err);
      setError(err.response?.data?.message || "Failed to delete player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered players
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = selectedTeamFilter === "all" || 
      (player.teams && player.teams.length > 0
        ? player.teams.some(t => String(t.id) === selectedTeamFilter)
        : player.team && String(player.team.id) === selectedTeamFilter);
    const matchesRole = selectedRoleFilter === "all" || player.role === selectedRoleFilter;
    return matchesSearch && matchesTeam && matchesRole;
  });

  // Statistics counters
  const totalPlayers = players.length;
  const totalBatsmen = players.filter(p => p.role === "Batsman").length;
  const totalBowlers = players.filter(p => p.role === "Bowler").length;
  const totalAllRounders = players.filter(p => p.role === "All-rounder").length;
  const totalWicketkeepers = players.filter(p => p.role === "Wicketkeeper").length;

  return (
    <div className="space-y-5 pb-12 px-1">
      
      {/* Header section unified with dashboard styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4.5">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">
            Player Roster
          </h1>
          <p className="text-zinc-455 text-xs sm:text-sm font-semibold leading-relaxed">
            Register players, select role skills, batting/bowling specialties, and track training (PPI) and match (MPI) indexes.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 self-start sm:self-auto px-5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-650/15 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Player
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Stats row matching dashboard KPI design */}
      {!loading && players.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-5">
          {/* Card 1 */}
          <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Total Roster</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalPlayers}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Squad Strength</span>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Batsmen</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <UserSquare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-orange-500">{totalBatsmen}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Batsmen Active</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Bowlers</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalBowlers}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bowlers Active</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-gradient-to-br from-fuchsia-500/5 to-pink-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">All-rounders</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalAllRounders}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">All-rounders</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px] col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Wicketkeepers</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <UserSquare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalWicketkeepers}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Wicketkeepers</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search section */}
      <div className="flex flex-col lg:flex-row gap-4 bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-4.5 rounded-2xl backdrop-blur-md shadow-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="h-11 w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-505 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2.5 bg-black/50 border border-white/10 px-3.5 rounded-xl h-11 w-full lg:min-w-[190px]">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-zinc-350 outline-none w-full cursor-pointer h-full font-bold"
            >
              <option value="all" className="bg-zinc-950 text-white text-xs">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-950 text-white text-xs">{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 bg-black/50 border border-white/10 px-3.5 rounded-xl h-11 w-full lg:min-w-[190px]">
            <UserSquare2 className="w-4 h-4 text-zinc-500 shrink-0" />
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-zinc-350 outline-none w-full cursor-pointer h-full font-bold"
            >
              <option value="all" className="bg-zinc-950 text-white text-xs">All Roles</option>
              <option value="Batsman" className="bg-zinc-950 text-white text-xs">Batsman</option>
              <option value="Bowler" className="bg-zinc-950 text-white text-xs">Bowler</option>
              <option value="All-rounder" className="bg-zinc-950 text-white text-xs">All-rounder</option>
              <option value="Wicketkeeper" className="bg-zinc-950 text-white text-xs">Wicketkeeper</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Display */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-zinc-450 text-xs">Fetching player records...</p>
          </div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-10 rounded-2xl text-center backdrop-blur-sm max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-orange-500/20 flex items-center justify-center p-1.5 mx-auto">
            <div className="w-full h-full rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <UserSquare2 className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-zinc-350 text-xs sm:text-sm font-black uppercase tracking-wider">No Players Found</h3>
            <p className="text-zinc-555 text-[11px] sm:text-xs font-semibold leading-relaxed">
              {players.length === 0 
                ? "Your roster is currently empty. Get started by adding players to your squads." 
                : "No players match the search queries and selected filters."}
            </p>
          </div>
          {players.length === 0 && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="h-9 px-4.5 rounded-xl text-[11px] font-bold transition-all inline-flex items-center justify-center gap-1.5 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 shadow-md cursor-pointer"
            >
              Add First Player
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPlayers.map(player => (
            <motion.div 
              key={player.id}
              layout
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-4.5 rounded-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col relative group overflow-hidden shadow-md backdrop-blur-md"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                    <UserSquare2 className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black tracking-tight text-white truncate max-w-[120px] xs:max-w-[150px]">
                      {player.name}
                    </h3>
                    <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider truncate">
                      {player.teams && player.teams.length > 0 
                        ? player.teams.map(t => t.name).join(", ") 
                        : player.team?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleEditInit(player)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-zinc-300 transition-colors cursor-pointer"
                    title="Edit Player"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setDeletingPlayer(player)}
                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Delete Player"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Specialties tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-zinc-300 uppercase tracking-wider">
                  {player.role}
                </span>
                <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md text-indigo-300">
                  {player.battingStyle}
                </span>
                {player.bowlingStyle && player.bowlingStyle !== "None" && (
                  <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-300">
                    {player.bowlingStyle}
                  </span>
                )}
              </div>

              {/* Score indicators */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-center">
                <div className="bg-white/5 border border-white/5 rounded-xl py-2 px-2.5 flex justify-between items-center text-xs">
                  <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">PPI Score</span>
                  <span className="font-black text-orange-500">{player.ppiScore ? player.ppiScore.toFixed(1) : "0.0"}</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl py-2 px-2.5 flex justify-between items-center text-xs">
                  <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">MPI Score</span>
                  <span className="font-black text-emerald-400">{player.mpiScore ? player.mpiScore.toFixed(1) : "0.0"}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ADD PLAYER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d0d] border border-white/10 w-full max-w-md rounded-2xl p-5 relative overflow-hidden z-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-orange-500" />
                  Add New Player
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Assign Team (Optional)</label>
                    <select 
                      value={newPlayer.teamId} 
                      onChange={e => setNewPlayer({...newPlayer, teamId: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option value="" className="bg-zinc-950 text-white text-xs">None (Unassigned)</option>
                      {teams.map(t => <option key={t.id} value={t.id} className="bg-zinc-950 text-white text-xs">{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Player Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newPlayer.name} 
                      onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" 
                      placeholder="E.g. Virat Kohli"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Playing Role</label>
                    <select 
                      value={newPlayer.role} 
                      onChange={e => setNewPlayer({...newPlayer, role: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white text-xs">Batsman</option>
                      <option className="bg-zinc-950 text-white text-xs">Bowler</option>
                      <option className="bg-zinc-950 text-white text-xs">All-rounder</option>
                      <option className="bg-zinc-950 text-white text-xs">Wicketkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Batting Style</label>
                    <select 
                      value={newPlayer.battingStyle} 
                      onChange={e => setNewPlayer({...newPlayer, battingStyle: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white text-xs">Right-hand bat</option>
                      <option className="bg-zinc-950 text-white text-xs">Left-hand bat</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Bowling Style</label>
                    <select 
                      value={newPlayer.bowlingStyle} 
                      onChange={e => setNewPlayer({...newPlayer, bowlingStyle: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white text-xs">None</option>
                      <option className="bg-zinc-950 text-white text-xs">Right-arm Fast</option>
                      <option className="bg-zinc-950 text-white text-xs">Right-arm Medium</option>
                      <option className="bg-zinc-950 text-white text-xs">Right-arm Offbreak</option>
                      <option className="bg-zinc-950 text-white text-xs">Right-arm Legbreak</option>
                      <option className="bg-zinc-950 text-white text-xs">Left-arm Fast</option>
                      <option className="bg-zinc-950 text-white text-xs">Left-arm Medium</option>
                      <option className="bg-zinc-950 text-white text-xs">Left-arm Orthodox</option>
                      <option className="bg-zinc-950 text-white text-xs">Left-arm Chinaman</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-50 flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-605/15 disabled:opacity-50 flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Player"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PLAYER MODAL */}
      <AnimatePresence>
        {editingPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPlayer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d0d] border border-white/10 w-full max-w-md rounded-2xl p-5 relative overflow-hidden z-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-orange-500" />
                  Edit Player Details
                </h3>
                <button 
                  onClick={() => setEditingPlayer(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Squad / Team (Optional)</label>
                    <select 
                      value={editFormData.teamId} 
                      onChange={e => setEditFormData({...editFormData, teamId: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option value="" className="bg-zinc-955 text-white text-xs">None (Unassigned)</option>
                      {teams.map(t => <option key={t.id} value={t.id} className="bg-zinc-950 text-white text-xs">{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Player Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.name} 
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white placeholder-zinc-555 focus:outline-none focus:border-orange-500 transition-colors" 
                      placeholder="E.g. Virat Kohli"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Playing Role</label>
                    <select 
                      value={editFormData.role} 
                      onChange={e => setEditFormData({...editFormData, role: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-955 text-white text-xs">Batsman</option>
                      <option className="bg-zinc-955 text-white text-xs">Bowler</option>
                      <option className="bg-zinc-955 text-white text-xs">All-rounder</option>
                      <option className="bg-zinc-955 text-white text-xs">Wicketkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Batting Style</label>
                    <select 
                      value={editFormData.battingStyle} 
                      onChange={e => setEditFormData({...editFormData, battingStyle: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-955 text-white text-xs">Right-hand bat</option>
                      <option className="bg-zinc-955 text-white text-xs">Left-hand bat</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Bowling Style</label>
                    <select 
                      value={editFormData.bowlingStyle} 
                      onChange={e => setEditFormData({...editFormData, bowlingStyle: e.target.value})} 
                      className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-955 text-white text-xs">None</option>
                      <option className="bg-zinc-955 text-white text-xs">Right-arm Fast</option>
                      <option className="bg-zinc-955 text-white text-xs">Right-arm Medium</option>
                      <option className="bg-zinc-955 text-white text-xs">Right-arm Offbreak</option>
                      <option className="bg-zinc-955 text-white text-xs">Right-arm Legbreak</option>
                      <option className="bg-zinc-955 text-white text-xs">Left-arm Fast</option>
                      <option className="bg-zinc-955 text-white text-xs">Left-arm Medium</option>
                      <option className="bg-zinc-955 text-white text-xs">Left-arm Orthodox</option>
                      <option className="bg-zinc-955 text-white text-xs">Left-arm Chinaman</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-50 flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-605/15 disabled:opacity-50 flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingPlayer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d0d] border border-red-500/20 w-full max-w-sm rounded-2xl p-5 relative overflow-hidden z-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-black tracking-tight text-white mb-2">Remove Player?</h3>
                <p className="text-zinc-400 text-xs mb-4 leading-normal font-medium">
                  Are you sure you want to remove <span className="text-white font-bold">"{deletingPlayer.name}"</span>?
                  <br />
                  This player will be permanently removed from their team roster. This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    type="button"
                    onClick={() => setDeletingPlayer(null)}
                    disabled={submitting}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-50 flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={submitting}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-red-650 hover:bg-red-500 text-white disabled:opacity-50 flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Remove Player"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
