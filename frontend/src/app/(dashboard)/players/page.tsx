"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { UserSquare2, Plus, Loader2, Pencil, Trash2, X, Search, Filter, AlertTriangle, ShieldCheck, Award } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Player Roster
          </h1>
          <p className="text-zinc-400 mt-2 text-base">
            Register players, select role skills, batting/bowling specialties, and track training (PPI) and match (MPI) indexes.
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Player
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats row */}
      {!loading && players.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Roster</p>
            <p className="text-3xl font-black text-white mt-1">{totalPlayers}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Batsmen</p>
            <p className="text-3xl font-black text-orange-500 mt-1">{totalBatsmen}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Bowlers</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{totalBowlers}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">All-rounders</p>
            <p className="text-3xl font-black text-indigo-400 mt-1">{totalAllRounders}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center col-span-2 lg:col-span-1">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Wicketkeepers</p>
            <p className="text-3xl font-black text-amber-500 mt-1">{totalWicketkeepers}</p>
          </div>
        </div>
      )}

      {/* Filters & Search section */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-3 rounded-2xl w-full sm:min-w-[180px]">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 py-3 outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-zinc-950 text-white">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-950 text-white">{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-3 rounded-2xl w-full sm:min-w-[180px]">
            <UserSquare2 className="w-4 h-4 text-zinc-500" />
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 py-3 outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-zinc-950 text-white">All Roles</option>
              <option value="Batsman" className="bg-zinc-950 text-white">Batsman</option>
              <option value="Bowler" className="bg-zinc-950 text-white">Bowler</option>
              <option value="All-rounder" className="bg-zinc-950 text-white">All-rounder</option>
              <option value="Wicketkeeper" className="bg-zinc-950 text-white">Wicketkeeper</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Display */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-zinc-400 text-sm">Fetching player records...</p>
          </div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center backdrop-blur-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            <UserSquare2 className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No Players Found</h3>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            {players.length === 0 
              ? "Your roster is currently empty. Get started by adding players to your squads." 
              : "No players match the search queries and selected filters."}
          </p>
          {players.length === 0 && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
            >
              Add First Player
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map(player => (
            <motion.div 
              key={player.id}
              layout
              whileHover={{ y: -4 }}
              className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 hover:border-orange-500/40 transition-all duration-300 flex flex-col relative group overflow-hidden"
            >
              {/* Accent glow line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Action Buttons overlay */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={() => handleEditInit(player)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Player"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingPlayer(player)}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  title="Delete Player"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <UserSquare2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-orange-500 transition-colors pr-16 truncate">
                      {player.name}
                    </h3>
                    <p className="text-xs text-orange-500/90 font-medium tracking-tight">
                      {player.teams && player.teams.length > 0 
                        ? player.teams.map(t => t.name).join(", ") 
                        : player.team?.name || "Unassigned"}
                    </p>
                  </div>
                </div>

                {/* Specialties tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-zinc-300 uppercase tracking-wider">
                    {player.role}
                  </span>
                  <span className="text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-300">
                    {player.battingStyle}
                  </span>
                  {player.bowlingStyle && player.bowlingStyle !== "None" && (
                    <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
                      {player.bowlingStyle}
                    </span>
                  )}
                </div>
              </div>

              {/* Score indicators */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10 text-center">
                <div className="bg-white/5 border border-white/5 rounded-2xl py-2 px-3">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">PPI Rating</p>
                  <p className="font-extrabold text-orange-500 text-base">{player.ppiScore ? player.ppiScore.toFixed(1) : "0.0"}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl py-2 px-3">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">MPI Rating</p>
                  <p className="font-extrabold text-emerald-400 text-base">{player.mpiScore ? player.mpiScore.toFixed(1) : "0.0"}</p>
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
              className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg rounded-3xl p-8 relative overflow-hidden z-10 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-orange-500" />
                  Add New Player
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Assign Team (Optional)</label>
                    <select 
                      value={newPlayer.teamId} 
                      onChange={e => setNewPlayer({...newPlayer, teamId: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" className="bg-zinc-950 text-white">None (Unassigned)</option>
                      {teams.map(t => <option key={t.id} value={t.id} className="bg-zinc-950 text-white">{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Player Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newPlayer.name} 
                      onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors" 
                      placeholder="E.g. Virat Kohli"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Playing Role</label>
                    <select 
                      value={newPlayer.role} 
                      onChange={e => setNewPlayer({...newPlayer, role: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white">Batsman</option>
                      <option className="bg-zinc-950 text-white">Bowler</option>
                      <option className="bg-zinc-950 text-white">All-rounder</option>
                      <option className="bg-zinc-950 text-white">Wicketkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Batting Style</label>
                    <select 
                      value={newPlayer.battingStyle} 
                      onChange={e => setNewPlayer({...newPlayer, battingStyle: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white">Right-hand bat</option>
                      <option className="bg-zinc-950 text-white">Left-hand bat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Bowling Style</label>
                    <select 
                      value={newPlayer.bowlingStyle} 
                      onChange={e => setNewPlayer({...newPlayer, bowlingStyle: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white">None</option>
                      <option className="bg-zinc-950 text-white">Right-arm Fast</option>
                      <option className="bg-zinc-950 text-white">Right-arm Medium</option>
                      <option className="bg-zinc-950 text-white">Right-arm Offbreak</option>
                      <option className="bg-zinc-950 text-white">Right-arm Legbreak</option>
                      <option className="bg-zinc-950 text-white">Left-arm Fast</option>
                      <option className="bg-zinc-950 text-white">Left-arm Medium</option>
                      <option className="bg-zinc-950 text-white">Left-arm Orthodox</option>
                      <option className="bg-zinc-950 text-white">Left-arm Chinaman</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-3 font-semibold hover:bg-white/10 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
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
              className="bg-[#0f0f0f] border border-white/10 w-full max-w-lg rounded-3xl p-8 relative overflow-hidden z-10 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-orange-500" />
                  Edit Player Details
                </h3>
                <button 
                  onClick={() => setEditingPlayer(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Squad / Team (Optional)</label>
                    <select 
                      value={editFormData.teamId} 
                      onChange={e => setEditFormData({...editFormData, teamId: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" className="bg-zinc-950 text-white">None (Unassigned)</option>
                      {teams.map(t => <option key={t.id} value={t.id} className="bg-zinc-950 text-white">{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Player Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editFormData.name} 
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors" 
                      placeholder="E.g. Virat Kohli"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Playing Role</label>
                    <select 
                      value={editFormData.role} 
                      onChange={e => setEditFormData({...editFormData, role: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white">Batsman</option>
                      <option className="bg-zinc-950 text-white">Bowler</option>
                      <option className="bg-zinc-950 text-white">All-rounder</option>
                      <option className="bg-zinc-950 text-white">Wicketkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Batting Style</label>
                    <select 
                      value={editFormData.battingStyle} 
                      onChange={e => setEditFormData({...editFormData, battingStyle: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white">Right-hand bat</option>
                      <option className="bg-zinc-950 text-white">Left-hand bat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Bowling Style</label>
                    <select 
                      value={editFormData.bowlingStyle} 
                      onChange={e => setEditFormData({...editFormData, bowlingStyle: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors cursor-pointer"
                    >
                      <option className="bg-zinc-950 text-white">None</option>
                      <option className="bg-zinc-950 text-white">Right-arm Fast</option>
                      <option className="bg-zinc-950 text-white">Right-arm Medium</option>
                      <option className="bg-zinc-950 text-white">Right-arm Offbreak</option>
                      <option className="bg-zinc-950 text-white">Right-arm Legbreak</option>
                      <option className="bg-zinc-950 text-white">Left-arm Fast</option>
                      <option className="bg-zinc-950 text-white">Left-arm Medium</option>
                      <option className="bg-zinc-950 text-white">Left-arm Orthodox</option>
                      <option className="bg-zinc-950 text-white">Left-arm Chinaman</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-3 font-semibold hover:bg-white/10 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
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
              className="bg-[#0f0f0f] border border-red-500/20 w-full max-w-md rounded-3xl p-8 relative overflow-hidden z-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-6">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Remove Player?</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Are you sure you want to remove <span className="text-white font-semibold">"{deletingPlayer.name}"</span>?
                  <br />
                  This player will be permanently removed from their team roster. This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    type="button"
                    onClick={() => setDeletingPlayer(null)}
                    disabled={submitting}
                    className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-3 font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={submitting}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
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
