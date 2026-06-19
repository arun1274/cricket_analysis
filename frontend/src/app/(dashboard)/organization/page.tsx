"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Building, Copy, Check, RefreshCw, Users, Clock, 
  CheckCircle, XCircle, Trash2, ShieldAlert, Loader2, Info
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

interface Coach {
  id: number;
  name: string;
  email: string;
  role: string;
  approvalStatus: string;
}

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [orgRes, coachesRes] = await Promise.all([
        api.get("/organization/details"),
        api.get("/organization/coaches")
      ]);
      setOrg(orgRes.data);
      setCoaches(coachesRes.data);
    } catch (err: any) {
      console.error("Failed to load organization data", err);
      setError(err.response?.data?.message || "Failed to load organization settings. Only admins can access this page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} coach.`);
    } finally {
      setActioningId(null);
    }
  };

  // Group coaches by their approval status
  const pendingCoaches = coaches.filter(c => c.approvalStatus === "PENDING");
  const approvedCoaches = coaches.filter(c => c.approvalStatus === "APPROVED" || c.approvalStatus === null);
  const rejectedCoaches = coaches.filter(c => c.approvalStatus === "REJECTED");

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
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Organization Settings
        </h1>
        <p className="text-zinc-400 mt-2 text-base">
          Manage your organization profiles, generate join codes, and moderate coach access credentials.
        </p>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Org profile card & Join code card */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Org Info */}
          {org && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{org.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-semibold">{org.type}</span>
                </div>
              </div>

              <div className="space-y-4 text-sm pt-4 border-t border-white/10">
                <div>
                  <span className="text-zinc-500 text-xs uppercase font-medium">Sport Discipline</span>
                  <p className="text-zinc-200 mt-0.5 font-semibold">{org.sport}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs uppercase font-medium">Location</span>
                  <p className="text-zinc-200 mt-0.5 font-semibold">{org.city}, {org.country}</p>
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

          {/* Join Code Box */}
          {org && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
              <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-4">Organization Join Code</p>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-center font-mono font-black text-2xl text-orange-500 tracking-widest uppercase">
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

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-2xl py-3 font-semibold transition-colors cursor-pointer text-sm"
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-orange-500" />
                  )}
                  Regenerate Join Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Coaches Approval management lists */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Approvals Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="font-extrabold text-white text-xl mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Requests
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 ml-1">
                {pendingCoaches.length}
              </span>
            </h3>

            {pendingCoaches.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl text-sm flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-zinc-600" />
                No pending requests.
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pendingCoaches.map((coach) => (
                    <motion.div
                      key={coach.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange-500/20 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-white text-base">{coach.name}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{coach.email}</p>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleCoachAction(coach.id, "approve")}
                          disabled={actioningId === coach.id}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCoachAction(coach.id, "reject")}
                          disabled={actioningId === coach.id}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/20 text-red-400 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Approved Coaches */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="font-extrabold text-white text-xl mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Approved Coaches
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 ml-1">
                {approvedCoaches.length}
              </span>
            </h3>

            {approvedCoaches.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl text-sm flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-zinc-600" />
                No approved coaches found.
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {approvedCoaches.map((coach) => (
                    <motion.div
                      key={coach.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange-500/20 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{coach.name}</h4>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500">
                            {coach.role}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{coach.email}</p>
                      </div>

                      {coach.role !== "ADMIN" && (
                        <button
                          onClick={() => handleCoachAction(coach.id, "remove")}
                          disabled={actioningId === coach.id}
                          className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center justify-center"
                          title="Remove Coach from organization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Rejected Coaches */}
          {rejectedCoaches.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="font-extrabold text-white text-xl mb-6 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Rejected Coaches
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 ml-1">
                  {rejectedCoaches.length}
                </span>
              </h3>

              <div className="space-y-4">
                <AnimatePresence>
                  {rejectedCoaches.map((coach) => (
                    <motion.div
                      key={coach.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange-500/20 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-white text-base text-zinc-400 line-through">{coach.name}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{coach.email}</p>
                      </div>

                      <button
                        onClick={() => handleCoachAction(coach.id, "approve")}
                        disabled={actioningId === coach.id}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-colors cursor-pointer"
                      >
                        Re-Approve
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
