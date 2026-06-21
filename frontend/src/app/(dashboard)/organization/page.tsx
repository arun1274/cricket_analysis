"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Building, Copy, Check, RefreshCw, Users, Clock, 
  CheckCircle, XCircle, Trash2, ShieldAlert, Loader2, 
  Plus, Search, Trophy, X
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-zinc-450 text-xs">Loading organization details...</p>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-5 rounded-2xl max-w-lg mx-auto text-center flex flex-col items-center gap-4 my-12 shadow-2xl">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-black uppercase tracking-wider">Unauthorized Page Access</h3>
        <p className="text-zinc-450 text-xs sm:text-sm leading-relaxed font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 px-1">
      {/* Header */}
      <div className="space-y-1 border-b border-white/5 pb-4.5">
        <h1 className="text-3xl lg:text-[40px] font-black tracking-tight text-white flex items-center gap-1.5">
          Organization
        </h1>
        <p className="text-zinc-455 text-xs sm:text-sm font-semibold leading-relaxed">
          Detailed roster performance, coach administration, and organization settings.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-405 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <p>{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-405 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-405" />
          <p>{error}</p>
        </div>
      )}

      {/* Org Info & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Organization Details */}
        {org && (
          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-orange-500/20 transition-all duration-300 shadow-md relative group overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 mb-4.5">
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{org.name}</h3>
                <span className="text-[9px] px-2 py-0.5 mt-1 rounded bg-white/5 border border-white/10 text-orange-500 font-black uppercase tracking-wider inline-block">{org.type}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs pt-3.5 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 text-[9px] uppercase font-black tracking-wider block">Sport</span>
                  <p className="text-zinc-200 mt-1 font-extrabold">{org.sport}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[9px] uppercase font-black tracking-wider block">Location</span>
                  <p className="text-zinc-200 mt-1 font-extrabold">{org.city}, {org.country}</p>
                </div>
              </div>
              {org.description && (
                <div>
                  <span className="text-zinc-500 text-[9px] uppercase font-black tracking-wider block">Description</span>
                  <p className="text-zinc-400 mt-1 leading-relaxed font-semibold text-[11px]">{org.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Middle Column: Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md hover:border-orange-500/20 transition-all duration-300 shadow-md">
            <div className="text-zinc-500 text-[9px] uppercase font-black tracking-wider">Coaches</div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black text-white">{stats.totalCoaches}</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md hover:border-orange-500/20 transition-all duration-300 shadow-md">
            <div className="text-zinc-500 text-[9px] uppercase font-black tracking-wider">Teams</div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black text-white">{stats.totalTeams}</span>
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md hover:border-orange-500/20 transition-all duration-300 shadow-md">
            <div className="text-zinc-500 text-[9px] uppercase font-black tracking-wider">Players</div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black text-white">{stats.totalPlayers}</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md hover:border-orange-500/20 transition-all duration-300 shadow-md">
            <div className="text-zinc-500 text-[9px] uppercase font-black tracking-wider">Pending</div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black text-amber-500">{pendingCoaches.length}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Right Column: Join Code Box */}
        {org && (
          <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between hover:border-orange-500/20 transition-all duration-300 shadow-md">
            <div>
              <p className="text-zinc-500 text-[9px] uppercase font-black tracking-wider mb-2.5">Join Code</p>
              <div className="flex gap-2.5">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2.5 text-center font-mono font-black text-lg text-orange-500 tracking-widest uppercase">
                  {org.joinCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  title="Copy join code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mt-3.5">
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="h-11 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
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
        <div className="bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4 shadow-md">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Join Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingCoaches.map((coach) => (
              <div
                key={coach.id}
                className="bg-black/40 border border-white/5 rounded-2xl p-3.5 flex justify-between items-center gap-4 hover:border-orange-500/25 transition-colors"
              >
                <div>
                  <h4 className="font-extrabold text-white text-sm">{coach.name}</h4>
                  <p className="text-[10px] text-zinc-550 mt-0.5 font-bold uppercase tracking-wider">{coach.email}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCoachAction(coach.id, "approve")}
                    disabled={actioningId === coach.id}
                    className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCoachAction(coach.id, "reject")}
                    disabled={actioningId === coach.id}
                    className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-red-400 hover:text-white hover:bg-red-500/10 transition-all cursor-pointer"
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
            <Users className="w-5 h-5 text-orange-500" />
            Coaches Directory
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {filteredApprovedCoaches.length === 0 ? (
          <div className="py-14 text-center text-zinc-550 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
            <Users className="w-12 h-12 text-zinc-700" />
            <p className="font-black text-zinc-400 text-xs sm:text-sm uppercase">No coaches found</p>
            <p className="text-[11px] font-semibold text-zinc-650 leading-relaxed">Ensure coaches are registered and approved in your organization</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApprovedCoaches.map((coach) => (
              <motion.div
                key={coach.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedCoachId(coach.id)}
                className={`bg-gradient-to-br from-white/[0.03] to-[#0c0c0c]/40 border rounded-2xl p-5 backdrop-blur-md cursor-pointer transition-all relative shadow-md ${
                  selectedCoachId === coach.id 
                    ? "border-orange-500/50 bg-white/10" 
                    : "border-white/10 hover:border-orange-500/20"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm">
                      {coach.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm group-hover:text-orange-500 transition-colors">
                        {coach.name}
                      </h4>
                      <span className="text-[9px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 mt-1 inline-block">
                        {coach.role}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-450 mt-3.5 break-all font-semibold">{coach.email}</p>

                <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-white/5 text-center text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Teams</span>
                    <span className="font-extrabold text-zinc-200 mt-0.5 block">{coach.teamsCount}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Players</span>
                    <span className="font-extrabold text-zinc-200 mt-0.5 block">{coach.playersCount}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Activity</span>
                    <span className="font-bold text-zinc-350 mt-0.5 block text-[9px] truncate">{coach.lastActivity}</span>
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
              className="relative w-full max-w-md bg-[#0d0d0d] border-l border-white/10 h-full flex flex-col overflow-y-auto p-6 text-white z-10 backdrop-blur-xl"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedCoachId(null);
                  setShowCreateTeam(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {loadingDetails ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <p className="text-zinc-450 text-xs">Fetching coach profile statistics...</p>
                  </div>
                </div>
              ) : coachDetails ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between pt-8">
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-xl font-black">
                        {coachDetails.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">{coachDetails.name}</h3>
                        <p className="text-xs text-zinc-400 font-semibold">{coachDetails.email}</p>
                        <span className="text-[9px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 mt-1.5 inline-block">
                          {coachDetails.role}
                        </span>
                      </div>
                    </div>

                    {/* Stats Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <span className="text-zinc-500 text-[8px] sm:text-[9px] uppercase font-bold block">Average CPI</span>
                        <span className="text-base font-black text-white mt-1 block">
                          {coachDetails.averageCpi > 0 ? coachDetails.averageCpi.toFixed(1) : "0.0"}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <span className="text-zinc-500 text-[8px] sm:text-[9px] uppercase font-bold block">Practice PPI</span>
                        <span className="text-base font-black text-white mt-1 block">
                          {coachDetails.averagePpi > 0 ? coachDetails.averagePpi.toFixed(1) : "0.0"}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                        <span className="text-zinc-500 text-[8px] sm:text-[9px] uppercase font-bold block">Match MPI</span>
                        <span className="text-base font-black text-white mt-1 block">
                          {coachDetails.averageMpi > 0 ? coachDetails.averageMpi.toFixed(1) : "0.0"}
                        </span>
                      </div>
                    </div>

                    {/* Teams List */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <Trophy className="w-4 h-4 text-orange-500" />
                          Teams Managed
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-zinc-400 font-bold">
                            {coachDetails.teams.length}
                          </span>
                        </h4>
                        
                        {!showCreateTeam && (
                          <button
                            onClick={() => setShowCreateTeam(true)}
                            className="h-9 px-3 rounded-xl bg-orange-655 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create Team
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
                          className="bg-white/5 border border-orange-500/20 rounded-2xl p-4 space-y-3.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-white uppercase tracking-wider">New Team under {coachDetails.name}</span>
                            <button
                              type="button"
                              onClick={() => setShowCreateTeam(false)}
                              className="text-zinc-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-450 uppercase font-black block">Team Name</label>
                              <input
                                type="text"
                                placeholder="E.g. Under-15 Team"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                required
                                className="h-10 w-full bg-black/60 border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-450 uppercase font-black block">Skill Category</label>
                              <select
                                value={newTeamLevel}
                                onChange={(e) => setNewTeamLevel(e.target.value)}
                                className="h-10 w-full bg-black/60 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                              >
                                <option value="BEGINNER" className="bg-zinc-950 text-white">BEGINNER</option>
                                <option value="INTERMEDIATE" className="bg-zinc-950 text-white">INTERMEDIATE</option>
                                <option value="ADVANCED" className="bg-zinc-950 text-white">ADVANCED</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2.5 pt-1.5">
                            <button
                              type="button"
                              onClick={() => setShowCreateTeam(false)}
                              className="h-9 px-3 bg-white/5 border border-white/10 text-zinc-300 text-xs rounded-xl font-bold hover:bg-white/10 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={creatingTeam}
                              className="h-9 px-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs rounded-xl font-bold transition-colors flex items-center gap-1"
                            >
                              {creatingTeam && <Loader2 className="w-3 h-3 animate-spin" />}
                              Create Team
                            </button>
                          </div>
                        </motion.form>
                      )}

                      {coachDetails.teams.length === 0 ? (
                        <div className="py-8 text-center text-zinc-550 border border-dashed border-white/5 rounded-2xl text-xs flex flex-col items-center gap-1.5">
                          <Trophy className="w-6 h-6 text-zinc-700" />
                          No teams assigned to this coach.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {coachDetails.teams.map((team) => (
                            <div
                              key={team.id}
                              className="bg-black/40 border border-white/5 rounded-2xl p-3.5 flex justify-between items-center hover:border-orange-500/20 transition-all"
                            >
                              <div>
                                <h5 className="font-extrabold text-white text-xs">{team.name}</h5>
                                <span className="text-[9px] text-zinc-450 uppercase mt-0.5 inline-block font-bold">{team.level}</span>
                              </div>
                              
                              <div className="text-right">
                                <span className="text-zinc-500 text-[9px] uppercase block font-bold">Players</span>
                                <span className="text-xs font-semibold text-zinc-300 block mt-0.5">{team.playersCount} Players</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  {coachDetails.role !== "ADMIN" && (
                    <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-center">
                      <div>
                        <span className="text-zinc-500 text-[9px] uppercase font-bold block">Status</span>
                        <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 mt-0.5">
                          <CheckCircle className="w-4 h-4" />
                          Approved Member
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleCoachAction(coachDetails.id, "remove")}
                        disabled={actioningId === coachDetails.id}
                        className="h-10 px-4 bg-red-950/40 hover:bg-red-950/80 border border-red-500/20 text-red-405 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Coach
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
