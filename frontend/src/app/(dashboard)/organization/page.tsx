"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Building, Copy, Check, RefreshCw, Users, Clock, 
  CheckCircle, XCircle, Trash2, ShieldAlert, Loader2, 
  Plus, Search, User, Trophy, BarChart3, Activity, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Organization {
  id: number;
  name: string;
  type: string;
  sport: string;
  country: string;
  city: string;
  description: string;
  joinCode: string;
}

interface CoachSummary {
  id: number;
  name: string;
  email: string;
  role: string;
  approvalStatus: string;
  teamsCount: number;
  playersCount: number;
  lastActivity: string;
}

interface CoachDetails {
  id: number;
  name: string;
  email: string;
  role: string;
  approvalStatus: string;
  totalTeams: number;
  totalPlayers: number;
  averageCpi: number;
  averagePpi: number;
  averageMpi: number;
  teams: {
    id: number;
    name: string;
    level: string;
    teamCpiScore: number;
    playersCount: number;
  }[];
}

interface OrgStats {
  totalCoaches: number;
  totalTeams: number;
  totalPlayers: number;
}

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrgStats>({ totalCoaches: 0, totalTeams: 0, totalPlayers: 0 });
  const [coaches, setCoaches] = useState<CoachSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Coach Detailed Subview/Modal state
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [coachDetails, setCoachDetails] = useState<CoachDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Team Creation Modal/Form state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLevel, setNewTeamLevel] = useState("BEGINNER");
  const [creatingTeam, setCreatingTeam] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [orgRes, coachesRes, statsRes] = await Promise.all([
        api.get("/organization/details"),
        api.get("/organization/coaches"),
        api.get("/organization/stats")
      ]);
      setOrg(orgRes.data);
      setCoaches(coachesRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error("Failed to load organization data", err);
      setError(err.response?.data?.message || "Failed to load organization settings. Only admins can access this page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleCoachDetails = async (coachId: number) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/organization/coaches/${coachId}`);
      setCoachDetails(res.data);
    } catch (err: any) {
      console.error("Failed to load coach details", err);
      setError(err.response?.data?.message || "Failed to load coach details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCoachId !== null) {
      fetchSingleCoachDetails(selectedCoachId);
    } else {
      setCoachDetails(null);
    }
  }, [selectedCoachId]);

  const handleCopyCode = () => {
    if (!org?.joinCode) return;
    navigator.clipboard.writeText(org.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!confirm("Are you sure you want to regenerate the join code? Existing code will immediately become invalid.")) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await api.post("/organization/regenerate-join-code");
      if (org) {
        setOrg({ ...org, joinCode: res.data.joinCode });
      }
      setSuccessMsg("Join code regenerated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to regenerate join code.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCoachAction = async (coachId: number, action: "approve" | "reject" | "remove") => {
    if (action === "remove" && !confirm("Are you sure you want to remove this coach from the organization?")) return;
    setActioningId(coachId);
    setError(null);
    try {
      await api.post(`/organization/coaches/${coachId}/${action}`);
      setSuccessMsg(`Coach successfully ${action}d!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      
      // If we remove/reject the active detailed coach, close details panel
      if (selectedCoachId === coachId && (action === "remove" || action === "reject")) {
        setSelectedCoachId(null);
      }
      
      await fetchData();
      if (selectedCoachId === coachId) {
        await fetchSingleCoachDetails(coachId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} coach.`);
    } finally {
      setActioningId(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoachId || !newTeamName.trim()) return;
    setCreatingTeam(true);
    setError(null);
    try {
      await api.post("/teams", {
        name: newTeamName,
        level: newTeamLevel,
        coachId: selectedCoachId
      });
      setSuccessMsg("Team created successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setNewTeamName("");
      setNewTeamLevel("BEGINNER");
      setShowCreateTeam(false);
      
      // Refresh statistics and details
      await fetchData();
      await fetchSingleCoachDetails(selectedCoachId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create team.");
    } finally {
      setCreatingTeam(false);
    }
  };

  // Group coaches by their approval status
  const pendingCoaches = coaches.filter(c => c.approvalStatus === "PENDING");
  const approvedCoaches = coaches.filter(c => c.approvalStatus === "APPROVED" || c.approvalStatus === null || c.role === "ADMIN");
  
  // Filter approved coaches for scalable directory search
  const filteredApprovedCoaches = approvedCoaches.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-zinc-400 text-sm">Loading organization management...</p>
        </div>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-5 rounded-2xl max-w-lg mx-auto text-center flex flex-col items-center gap-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-bold">Unauthorized Page Access</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Organization Dashboard
          </h1>
          <p className="text-zinc-400 mt-2 text-base">
            Detailed roster performance, coach administration, and organization settings.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Org Info & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Organization Details */}
        {org && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{org.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-orange-500 font-semibold">{org.type}</span>
              </div>
            </div>

            <div className="space-y-4 text-sm pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 text-xs uppercase font-medium">Sport</span>
                  <p className="text-zinc-200 mt-0.5 font-semibold">{org.sport}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs uppercase font-medium">Location</span>
                  <p className="text-zinc-200 mt-0.5 font-semibold">{org.city}, {org.country}</p>
                </div>
              </div>
              {org.description && (
                <div>
                  <span className="text-zinc-500 text-xs uppercase font-medium">Description</span>
                  <p className="text-zinc-400 mt-1 leading-relaxed text-xs">{org.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Middle Column: Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between backdrop-blur-md">
            <div className="text-zinc-500 text-xs uppercase font-semibold tracking-wider">Total Coaches</div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white">{stats.totalCoaches}</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between backdrop-blur-md">
            <div className="text-zinc-500 text-xs uppercase font-semibold tracking-wider">Total Teams</div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white">{stats.totalTeams}</span>
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between backdrop-blur-md">
            <div className="text-zinc-500 text-xs uppercase font-semibold tracking-wider">Total Players</div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white">{stats.totalPlayers}</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between backdrop-blur-md">
            <div className="text-zinc-500 text-xs uppercase font-semibold tracking-wider">Pending Requests</div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-amber-500">{pendingCoaches.length}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Right Column: Join Code Box */}
        {org && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-3">Join Code</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-center font-mono font-black text-xl text-orange-500 tracking-widest uppercase">
                  {org.joinCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
                  title="Copy join code"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-50 text-white rounded-2xl py-2.5 font-semibold transition-colors cursor-pointer text-xs"
              >
                {regenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
                )}
                Regenerate Join Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Approval Section */}
      {pendingCoaches.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="font-extrabold text-white text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Join Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingCoaches.map((coach) => (
              <div
                key={coach.id}
                className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center gap-4 hover:border-orange-500/20 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-white text-base">{coach.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{coach.email}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCoachAction(coach.id, "approve")}
                    disabled={actioningId === coach.id}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCoachAction(coach.id, "reject")}
                    disabled={actioningId === coach.id}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Roster / Coaches Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Coaches Directory
          </h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search coaches by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {filteredApprovedCoaches.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3">
            <Users className="w-12 h-12 text-zinc-700" />
            <p className="font-semibold text-zinc-400">No coaches match search query</p>
            <p className="text-xs text-zinc-600">Ensure coaches are registered and approved in your organization</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApprovedCoaches.map((coach) => (
              <motion.div
                key={coach.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedCoachId(coach.id)}
                className={`bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-md cursor-pointer transition-all relative ${
                  selectedCoachId === coach.id ? "ring-2 ring-orange-500 bg-white/10" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                      {coach.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base group-hover:text-orange-500 transition-colors">
                        {coach.name}
                      </h4>
                      <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 mt-1 inline-block">
                        {coach.role}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-4 break-all">{coach.email}</p>

                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/5 text-center text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Teams</span>
                    <span className="font-semibold text-zinc-200 mt-0.5 block">{coach.teamsCount}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Players</span>
                    <span className="font-semibold text-zinc-200 mt-0.5 block">{coach.playersCount}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Activity</span>
                    <span className="font-semibold text-zinc-300 mt-0.5 block text-[10px] truncate">{coach.lastActivity}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Coach Detailed Subview Side panel / Modal */}
      <AnimatePresence>
        {selectedCoachId !== null && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedCoachId(null);
                setShowCreateTeam(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[#0a0a0a] border-l border-white/10 h-full flex flex-col overflow-y-auto p-6 md:p-8 text-white z-10"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedCoachId(null);
                  setShowCreateTeam(false);
                }}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {loadingDetails ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <p className="text-zinc-400 text-xs">Fetching coach profile statistics...</p>
                  </div>
                </div>
              ) : coachDetails ? (
                <div className="space-y-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-2xl font-black">
                        {coachDetails.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{coachDetails.name}</h3>
                        <p className="text-sm text-zinc-400">{coachDetails.email}</p>
                        <span className="text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 mt-1.5 inline-block">
                          {coachDetails.role}
                        </span>
                      </div>
                    </div>

                    {/* Stats Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block">Average CPI</span>
                        <span className="text-xl font-bold text-white mt-1.5 block">
                          {coachDetails.averageCpi > 0 ? coachDetails.averageCpi.toFixed(1) : "0.0"}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block">Practice PPI</span>
                        <span className="text-xl font-bold text-white mt-1.5 block">
                          {coachDetails.averagePpi > 0 ? coachDetails.averagePpi.toFixed(1) : "0.0"}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block">Match MPI</span>
                        <span className="text-xl font-bold text-white mt-1.5 block">
                          {coachDetails.averageMpi > 0 ? coachDetails.averageMpi.toFixed(1) : "0.0"}
                        </span>
                      </div>
                    </div>

                    {/* Teams List */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-orange-500" />
                          Teams Managed
                          <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-zinc-400">
                            {coachDetails.teams.length}
                          </span>
                        </h4>
                        
                        {!showCreateTeam && (
                          <button
                            onClick={() => setShowCreateTeam(true)}
                            className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-3 py-1.5 text-xs font-semibold shadow-md transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create New Team
                          </button>
                        )}
                      </div>

                      {/* Create Team Inline Panel */}
                      {showCreateTeam && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleCreateTeam}
                          className="bg-white/5 border border-orange-500/20 rounded-2xl p-4 space-y-4"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white">Create New Team under {coachDetails.name}</span>
                            <button
                              type="button"
                              onClick={() => setShowCreateTeam(false)}
                              className="text-zinc-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Team Name</label>
                              <input
                                type="text"
                                placeholder="E.g. Under-15 Team"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                required
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Skill Category</label>
                              <select
                                value={newTeamLevel}
                                onChange={(e) => setNewTeamLevel(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                              >
                                <option value="BEGINNER">BEGINNER</option>
                                <option value="INTERMEDIATE">INTERMEDIATE</option>
                                <option value="ADVANCED">ADVANCED</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowCreateTeam(false)}
                              className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={creatingTeam}
                              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs rounded-xl font-semibold transition-colors flex items-center gap-1"
                            >
                              {creatingTeam && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Create Team
                            </button>
                          </div>
                        </motion.form>
                      )}

                      {coachDetails.teams.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl text-xs flex flex-col items-center gap-2">
                          <Trophy className="w-6 h-6 text-zinc-700" />
                          No teams assigned to this coach.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {coachDetails.teams.map((team) => (
                            <div
                              key={team.id}
                              className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:border-orange-500/20 transition-all"
                            >
                              <div>
                                <h5 className="font-bold text-white text-sm">{team.name}</h5>
                                <span className="text-[10px] text-zinc-400 uppercase mt-0.5 inline-block">{team.level}</span>
                              </div>
                              
                              <div className="text-right">
                                <span className="text-zinc-500 text-[10px] uppercase block">Players</span>
                                <span className="text-xs font-semibold text-zinc-300 block">{team.playersCount} Players</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  {coachDetails.role !== "ADMIN" && (
                    <div className="border-t border-white/10 pt-6 mt-8 flex justify-between items-center">
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block">Status</span>
                        <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approved Member
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleCoachAction(coachDetails.id, "remove")}
                        disabled={actioningId === coachDetails.id}
                        className="px-4 py-2 bg-red-950/40 hover:bg-red-950/80 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Coach from Organization
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
