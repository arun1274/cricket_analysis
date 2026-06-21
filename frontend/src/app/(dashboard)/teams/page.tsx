"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Users, Plus, Loader2, Pencil, Trash2, X, AlertTriangle, Shield, TrendingUp, ChevronDown, ChevronUp, PlusCircle, UserMinus, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";

interface Team {
  id: number;
  name: string;
  level: string;
  teamCpiScore: number;
}

interface Player {
  id: number;
  name: string;
  role: string;
  teams?: { id: number; name: string }[];
  team?: {
    id: number;
  };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  // Expanded team & Add existing player state
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [activeTeamForAdd, setActiveTeamForAdd] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // Form states
  const [newTeam, setNewTeam] = useState({ name: "", level: "" });
  const [editFormData, setEditFormData] = useState({ name: "", level: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [teamsRes, playersRes, profileRes] = await Promise.all([
        api.get("/teams"),
        api.get("/players"),
        api.get("/profile").catch(() => ({ data: { role: null, organization: null } }))
      ]);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
      setOrganization(profileRes.data?.organization || null);
      setUserRole(profileRes.data?.role || null);
    } catch (error: any) {
      console.error("Failed to fetch teams page data", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/teams", newTeam);
      setShowCreateModal(false);
      setNewTeam({ name: "", level: "" });
      await fetchData();
    } catch (err: any) {
      console.error("Failed to create team", err);
      setError(err.response?.data?.message || "Failed to create team. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (team: Team) => {
    setEditingTeam(team);
    setEditFormData({ name: team.name, level: team.level });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.put(`/teams/${editingTeam.id}`, editFormData);
      setEditingTeam(null);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to update team", err);
      setError(err.response?.data?.message || "Failed to update team. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingTeam) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/teams/${deletingTeam.id}`);
      setDeletingTeam(null);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to delete team", err);
      setError(err.response?.data?.message || "Failed to delete team. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to count players for each team (supporting many-to-many)
  const getPlayerCount = (teamId: number) => {
    return players.filter(p => {
      if (p.teams && p.teams.length > 0) {
        return p.teams.some(t => t.id === teamId);
      }
      return p.team?.id === teamId;
    }).length;
  };

  // Helper to get players in a team
  const getTeamPlayers = (teamId: number) => {
    return players.filter(p => {
      if (p.teams && p.teams.length > 0) {
        return p.teams.some(t => t.id === teamId);
      }
      return p.team?.id === teamId;
    });
  };

  // Helper to get players in organization NOT in this team
  const getAvailablePlayersForTeam = (teamId: number) => {
    return players.filter(p => {
      const isInTeam = p.teams && p.teams.length > 0
        ? p.teams.some(t => t.id === teamId)
        : p.team?.id === teamId;
      return !isInTeam;
    });
  };

  const handleAddExistingPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForAdd || !selectedPlayerId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/teams/${activeTeamForAdd.id}/players/${selectedPlayerId}`);
      setShowAddExistingModal(false);
      setSelectedPlayerId("");
      setActiveTeamForAdd(null);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to add player to team", err);
      setError(err.response?.data?.message || "Failed to add player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePlayerFromTeam = async (teamId: number, playerId: number) => {
    if (!confirm("Are you sure you want to remove this player from this team?")) return;
    setError(null);
    try {
      await api.delete(`/teams/${teamId}/players/${playerId}`);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to remove player from team", err);
      setError(err.response?.data?.message || "Failed to remove player. Please try again.");
    }
  };

  // Statistics
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  const avgCpiScore = teams.length > 0 
    ? teams.reduce((acc, curr) => acc + curr.teamCpiScore, 0) / teams.length 
    : 0;

  const hasOrganization = organization && organization.id;

  return (
    <div className="space-y-5 pb-12 px-1 relative">
      
      {/* Header section unified with dashboard styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4.5">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">
            Teams
          </h1>
          <p className="text-zinc-450 text-xs sm:text-sm font-semibold leading-relaxed">
            Create, update, and manage your squads, training level categories, and performance index trackers.
          </p>
        </div>
        {hasOrganization && userRole !== "ADMIN" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-11 self-start md:self-auto px-5 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-650/15 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        )}
      </div>

      {!hasOrganization && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-250 p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-400 flex-shrink-0" />
          <p>Please create or join an organization before creating teams.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Stats row matching dashboard designs */}
      {!loading && teams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {/* Card 1 */}
          <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Total Teams</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalTeams}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Squads Active</span>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Average CPI Score</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-orange-500">{avgCpiScore.toFixed(1)}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">CPI Rating</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-br from-fuchsia-500/5 to-pink-500/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[115px] col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-zinc-455 uppercase font-black tracking-wider">Total Players</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalPlayers}</span>
              <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Players Listed</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-zinc-450 text-xs">Fetching teams roster...</p>
          </div>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-10 rounded-2xl text-center backdrop-blur-sm max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-orange-500/20 flex items-center justify-center p-1.5 mx-auto">
            <div className="w-full h-full rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-zinc-350 text-xs sm:text-sm font-black uppercase tracking-wider">Create your first team</h3>
            <p className="text-zinc-555 text-[11px] sm:text-xs font-semibold leading-relaxed">
              Get started by organizing your squads. Once created, you can add players, track performance scores, and analyze ratings.
            </p>
          </div>
          {hasOrganization && userRole !== "ADMIN" && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="h-9 px-4.5 rounded-xl text-[11px] font-bold transition-all inline-flex items-center justify-center gap-1.5 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 shadow-md cursor-pointer"
            >
              Create Team Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {teams.map(team => {
            const squadCount = getPlayerCount(team.id);
            return (
              <motion.div 
                key={team.id} 
                layout
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 p-4.5 rounded-2xl hover:border-orange-500/20 transition-all duration-300 flex flex-col relative group overflow-hidden shadow-md backdrop-blur-md"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                      <Users className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black tracking-tight text-white truncate max-w-[120px] xs:max-w-[150px]">
                        {team.name}
                      </h3>
                      <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider block">
                        {team.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleEditInit(team)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-zinc-300 transition-colors cursor-pointer"
                      title="Edit Team"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeletingTeam(team)}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-t border-white/5 text-xs">
                  <div>
                    <p className="text-zinc-500 uppercase tracking-wider text-[9px] font-bold">Squad Strength</p>
                    <p className="font-extrabold text-white mt-0.5">{squadCount} {squadCount === 1 ? 'Player' : 'Players'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 uppercase tracking-wider text-[9px] font-bold">CPI Rating</p>
                    <p className="font-black text-orange-500 text-sm mt-0.5">
                      {team.teamCpiScore > 0 ? team.teamCpiScore.toFixed(1) : "0.0"}
                    </p>
                  </div>
                </div>

                {/* Collapsible Player Roster & Management */}
                <div className="mt-2.5 pt-2.5 border-t border-white/5">
                  <button
                    onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                    className="flex items-center justify-between w-full text-xs font-bold text-zinc-455 hover:text-white transition-colors py-0.5 cursor-pointer"
                  >
                    <span>{expandedTeamId === team.id ? "Hide Roster" : "View Roster"}</span>
                    {expandedTeamId === team.id ? (
                      <ChevronUp className="w-4 h-4 text-orange-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedTeamId === team.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3 overflow-hidden mt-3"
                      >
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {getTeamPlayers(team.id).length === 0 ? (
                            <p className="text-xs text-zinc-555 italic py-2 text-center font-semibold">No players assigned.</p>
                          ) : (
                            getTeamPlayers(team.id).map(player => (
                              <div key={player.id} className="flex justify-between items-center bg-white/5 border border-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{player.name}</p>
                                  <p className="text-[9px] text-zinc-500 truncate">{player.role}</p>
                                </div>
                                <button
                                  onClick={() => handleRemovePlayerFromTeam(team.id, player.id)}
                                  className="p-1 rounded text-zinc-550 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Remove player"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Existing Player Trigger */}
                        <button
                          onClick={() => {
                            setActiveTeamForAdd(team);
                            setShowAddExistingModal(true);
                          }}
                          className="flex items-center justify-center gap-2 w-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Player
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d0d] border border-white/10 w-full max-w-sm rounded-2xl p-5 relative overflow-hidden z-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black tracking-tight text-white">Create New Team</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Team Name</label>
                  <input 
                    type="text" 
                    required
                    value={newTeam.name}
                    onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" 
                    placeholder="E.g. Under 19s A Team"
                  />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Level / Age Group</label>
                  <input 
                    type="text" 
                    required
                    value={newTeam.level}
                    onChange={e => setNewTeam({...newTeam, level: e.target.value})}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" 
                    placeholder="E.g. U19, Senior First XI"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
                      "Save Team"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTeam(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d0d] border border-white/10 w-full max-w-sm rounded-2xl p-5 relative overflow-hidden z-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black tracking-tight text-white">Edit Team Settings</h3>
                <button 
                  onClick={() => setEditingTeam(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Team Name</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.name}
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" 
                    placeholder="E.g. Under 19s A Team"
                  />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Level / Age Group</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.level}
                    onChange={e => setEditFormData({...editFormData, level: e.target.value})}
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" 
                    placeholder="E.g. U19, Senior First XI"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingTeam(null)}
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
        {deletingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingTeam(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
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
                
                <h3 className="text-lg font-black tracking-tight text-white mb-2">Delete Team?</h3>
                <p className="text-zinc-400 text-xs mb-4 leading-normal font-medium">
                  Are you sure you want to delete <span className="text-white font-bold">"{deletingTeam.name}"</span>?
                  <br />
                  <span className="text-orange-400 font-semibold mt-1 block">This will dissociate all {getPlayerCount(deletingTeam.id)} players from this squad. The players will remain in the organization pool.</span> This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    type="button"
                    onClick={() => setDeletingTeam(null)}
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
                      "Delete Team"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD EXISTING PLAYER MODAL */}
      <AnimatePresence>
        {showAddExistingModal && activeTeamForAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddExistingModal(false);
                setActiveTeamForAdd(null);
                setSelectedPlayerId("");
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d0d] border border-white/10 w-full max-w-sm rounded-2xl p-5 relative overflow-hidden z-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-orange-500" />
                  Add Player
                </h3>
                <button 
                  onClick={() => {
                    setShowAddExistingModal(false);
                    setActiveTeamForAdd(null);
                    setSelectedPlayerId("");
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExistingPlayer} className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-400 mb-3 leading-normal font-medium">
                    Assign a player from the organization pool to <span className="text-white font-bold">{activeTeamForAdd.name}</span>.
                  </p>
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-455 uppercase tracking-wider block mb-1.5">Select Player</label>
                  <select 
                    required 
                    value={selectedPlayerId} 
                    onChange={e => setSelectedPlayerId(e.target.value)} 
                    className="h-11 w-full bg-black/50 border border-white/10 rounded-xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-zinc-950 text-zinc-550">-- Choose a Player --</option>
                    {getAvailablePlayersForTeam(activeTeamForAdd.id).map(p => (
                      <option key={p.id} value={p.id} className="bg-zinc-950 text-white text-xs">
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                  {getAvailablePlayersForTeam(activeTeamForAdd.id).length === 0 && (
                    <p className="text-[10px] text-amber-500 mt-1.5 font-bold">All players in the organization are already assigned to this team.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddExistingModal(false);
                      setActiveTeamForAdd(null);
                      setSelectedPlayerId("");
                    }}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-50 flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting || !selectedPlayerId}
                    className="h-11 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer bg-orange-655 hover:bg-orange-500 text-white shadow-lg shadow-orange-605/15 disabled:opacity-50 flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add to Squad"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
