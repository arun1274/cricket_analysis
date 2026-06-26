"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, Plus, Loader2, ArrowLeft, Clipboard, ShieldCheck, 
  Sparkles, ListCollapse, Award, Flame, Heart, Brain, X, Camera, CheckCircle2,
  Filter, Check, Copy, Target, Edit2, TrendingUp
} from "lucide-react";
import PerformanceTrendChart from "@/components/PerformanceTrendChart";

interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  ppiScore: number | null;
  mpiScore: number | null;
  invitationCode?: string;
  invitationCodeActivated?: boolean;
}

export default function PlayersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);

  // Last assessment date cache
  const [lastAssessmentDates, setLastAssessmentDates] = useState<Record<number, string>>({});

  // View state: 'list' | 'profile'
  const [view, setView] = useState<"list" | "profile">(searchParams.get("id") ? "profile" : "list");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Modals / Overlays
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPracticeOverlay, setShowPracticeOverlay] = useState(false);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [showSelfOverlay, setShowSelfOverlay] = useState(false);
  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
  const [showRecsOverlay, setShowRecsOverlay] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Filter States
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [sortBy, setSortBy] = useState<"highest_cpi" | "lowest_cpi" | "highest_ppi" | "highest_mpi" | "recently_assessed">("highest_cpi");
  const [quickFilter, setQuickFilter] = useState<"all" | "top_performers" | "needs_attention" | "assessed_today" | "not_assessed_recently">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all_rounder" | "wicket_keeper">("all");
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    age: "",
    role: "Batsman",
    battingStyle: "Right-hand bat",
    bowlingStyle: "None",
    photo: ""
  });

  // Practice sliders (scores 1-10)
  const [practiceForm, setPracticeForm] = useState({
    technique: 7,
    intensity: 7,
    execution: 7,
    adaptability: 7,
    discipline: 7,
    focus: 7,
    notes: ""
  });

  // Match sliders (scores 1-10)
  const [matchForm, setMatchForm] = useState({
    technicalExecution: 7,
    decisionMaking: 7,
    gameAwareness: 7,
    pressureHandling: 7,
    teamContribution: 7,
    matchImpact: 7,
    notes: ""
  });

  // Self assessment sliders
  const [selfForm, setSelfForm] = useState({
    sleep: 7,
    nutrition: 7,
    preparation: 7,
    health: 7,
    mental: 7,
    fitness: 7
  });

  // Player history state
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [selfHistory, setSelfHistory] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Target Goals states
  const [targetCpi, setTargetCpi] = useState<number>(85);
  const [targetGoal, setTargetGoal] = useState<string>("Improve core consistency");
  const [tempTargetCpi, setTempTargetCpi] = useState<string>("85");
  const [tempTargetGoal, setTempTargetGoal] = useState<string>("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    if (selectedPlayer) {
      const storedTarget = localStorage.getItem(`player_target_cpi_${selectedPlayer.id}`);
      const val = storedTarget ? parseInt(storedTarget, 10) : 85;
      setTargetCpi(val);
      setTempTargetCpi(val.toString());

      const storedGoal = localStorage.getItem(`player_target_goal_${selectedPlayer.id}`);
      const goalVal = storedGoal || "Improve core consistency";
      setTargetGoal(goalVal);
      setTempTargetGoal(goalVal);
      
      setIsEditingTarget(false);
      setIsEditingGoal(false);
    }
  }, [selectedPlayer]);

  const handleSaveTargetCpi = () => {
    if (!selectedPlayer) return;
    const val = parseInt(tempTargetCpi, 10);
    if (!isNaN(val) && val >= 1 && val <= 100) {
      setTargetCpi(val);
      localStorage.setItem(`player_target_cpi_${selectedPlayer.id}`, val.toString());
    }
    setIsEditingTarget(false);
  };

  const handleSaveTargetGoal = () => {
    if (!selectedPlayer) return;
    setTargetGoal(tempTargetGoal);
    localStorage.setItem(`player_target_goal_${selectedPlayer.id}`, tempTargetGoal);
    setIsEditingGoal(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/players");
      const list = res.data || [];
      setPlayers(list);
      fetchLastAssessmentDates(list);
    } catch (err) {
      console.error("Failed to fetch players", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLastAssessmentDates = async (playerList: Player[]) => {
    const datesMap: Record<number, string> = {};
    await Promise.all(playerList.map(async (p) => {
      try {
        const [pracRes, matchRes] = await Promise.all([
          api.get(`/practice/player/${p.id}`).catch(() => ({ data: [] })),
          api.get(`/matches/player/${p.id}`).catch(() => ({ data: [] }))
        ]);
        
        const allDates = [
          ...(pracRes.data || []).map((x: any) => x.date),
          ...(matchRes.data || []).map((x: any) => x.date)
        ];
        
        // Check for self-assessment in local storage
        const localSelf = localStorage.getItem(`self_assess_${p.id}`);
        if (localSelf) {
          const selfList = JSON.parse(localSelf);
          selfList.forEach((x: any) => {
            if (x.date) allDates.push(x.date);
          });
        }

        if (allDates.length > 0) {
          const sorted = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          const latestDate = new Date(sorted[0]);
          datesMap[p.id] = latestDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        } else {
          datesMap[p.id] = "No assessments";
        }
      } catch (e) {
        datesMap[p.id] = "No assessments";
      }
    }));
    setLastAssessmentDates(prev => ({ ...prev, ...datesMap }));
  };

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setRole(storedRole);
    fetchData();

    // URL direct navigation check
    if (searchParams.get("add") === "true") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Handle auto-select and self-assessment navigation for players
  useEffect(() => {
    if (players.length > 0) {
      const idParam = searchParams.get("id");
      if (idParam) {
        const found = players.find((p) => p.id === Number(idParam));
        if (found) {
          if (!selectedPlayer || selectedPlayer.id !== found.id) {
            setSelectedPlayer(found);
            setView("profile");
            loadHistory(found.id);
          }
          
          const action = searchParams.get("action");
          if (action === "practice") {
            setShowPracticeOverlay(true);
          } else if (action === "match") {
            setShowMatchOverlay(true);
          }
          return;
        } else {
          setView("list");
        }
      }

      const actionParam = searchParams.get("action");
      if (actionParam && !idParam) {
        if (!selectedPlayer || selectedPlayer.id !== players[0].id) {
          setSelectedPlayer(players[0]);
          setView("profile");
          loadHistory(players[0].id);
        }
        if (actionParam === "practice") {
          setShowPracticeOverlay(true);
        } else if (actionParam === "match") {
          setShowMatchOverlay(true);
        }
        return;
      }

      if (role === "player") {
        api.get("/profile").then((profileRes) => {
          const matchingPlayer = players.find(
            (p) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
          ) || players[0];
          
          if (matchingPlayer) {
            if (!selectedPlayer || selectedPlayer.id !== matchingPlayer.id) {
              setSelectedPlayer(matchingPlayer);
              setView("profile");
              loadHistory(matchingPlayer.id);
            }
            if (searchParams.get("selfAssess") === "true") {
              setShowSelfOverlay(true);
            }
          }
        }).catch(() => {
          if (!selectedPlayer || selectedPlayer.id !== players[0].id) {
            setSelectedPlayer(players[0]);
            setView("profile");
            loadHistory(players[0].id);
          }
          if (searchParams.get("selfAssess") === "true") {
            setShowSelfOverlay(true);
          }
        });
      } else if (searchParams.get("selfAssess") === "true") {
        api.get("/profile").then((profileRes) => {
          const matchingPlayer = players.find(
            (p) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
          ) || players[0];
          
          if (matchingPlayer) {
            if (!selectedPlayer || selectedPlayer.id !== matchingPlayer.id) {
              setSelectedPlayer(matchingPlayer);
              setView("profile");
              loadHistory(matchingPlayer.id);
            }
            setShowSelfOverlay(true);
          }
        }).catch(() => {
          if (!selectedPlayer || selectedPlayer.id !== players[0].id) {
            setSelectedPlayer(players[0]);
            setView("profile");
            loadHistory(players[0].id);
          }
          setShowSelfOverlay(true);
        });
      }
    } else if (!loading) {
      if (searchParams.get("id")) {
        setView("list");
      }
    }
  }, [players, role, searchParams, loading, selectedPlayer]);

  const loadHistory = async (playerId: number) => {
    try {
      const [pracRes, matchRes] = await Promise.all([
        api.get(`/practice/player/${playerId}`).catch(() => ({ data: [] })),
        api.get(`/matches/player/${playerId}`).catch(() => ({ data: [] }))
      ]);
      setPracticeHistory(pracRes.data || []);
      setMatchHistory(matchRes.data || []);

      const localSelf = localStorage.getItem(`self_assess_${playerId}`);
      setSelfHistory(localSelf ? JSON.parse(localSelf) : []);
    } catch (err) {
      console.error("Failed to load assessments history", err);
    }
  };

  const getPlayerTrendData = () => {
    // Unique dates from both histories
    const uniqueDates = Array.from(
      new Set([
        ...practiceHistory.map((h) => h.date),
        ...matchHistory.map((h) => h.date)
      ])
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let lastPpi = 0;
    let lastMpi = 0;

    const trendPoints = uniqueDates.map((dateStr) => {
      // Find practice sessions on this date
      const pracOnDate = practiceHistory.filter((h) => h.date === dateStr);
      if (pracOnDate.length > 0) {
        lastPpi = pracOnDate.reduce((sum, h) => sum + h.ppiScore, 0) / pracOnDate.length;
      }

      // Find match sessions on this date
      const matchOnDate = matchHistory.filter((h) => h.date === dateStr);
      if (matchOnDate.length > 0) {
        lastMpi = matchOnDate.reduce((sum, h) => sum + h.mpiScore, 0) / matchOnDate.length;
      }

      // Calculate CPI
      let cpi = 0;
      if (lastPpi > 0 && lastMpi > 0) {
        cpi = (lastPpi + lastMpi) / 2;
      } else if (lastPpi > 0) {
        cpi = lastPpi;
      } else if (lastMpi > 0) {
        cpi = lastMpi;
      }

      // Format date for label (e.g. "Jun 19" from "2026-06-19")
      let label = dateStr;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
      } catch (e) {}

      return {
        label,
        ppi: lastPpi,
        mpi: lastMpi,
        cpi
      };
    });

    // Limit to last 10 points
    return trendPoints.slice(-10);
  };

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setView("profile");
    loadHistory(player.id);
    router.replace(`/players?id=${player.id}`);
    
    const action = searchParams.get("action");
    if (action === "practice") {
      setShowPracticeOverlay(true);
    } else if (action === "match") {
      setShowMatchOverlay(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isProfileUpdate = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isProfileUpdate && selectedPlayer) {
        localStorage.setItem(`player_photo_${selectedPlayer.id}`, base64String);
        // Force refresh state to update UI
        setSelectedPlayer({ ...selectedPlayer });
      } else {
        setNewPlayer(prev => ({ ...prev, photo: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const roleStr = `${newPlayer.role} (Age ${newPlayer.age})`;
      const res = await api.post("/players", {
        name: newPlayer.name,
        role: roleStr,
        battingStyle: newPlayer.battingStyle,
        bowlingStyle: newPlayer.bowlingStyle
      });
      
      const created = res.data;
      if (newPlayer.photo) {
        localStorage.setItem(`player_photo_${created.id}`, newPlayer.photo);
      }
      
      setPlayers((prev) => [created, ...prev]);
      setShowAddForm(false);
      setNewPlayer({
        name: "",
        age: "",
        role: "Batsman",
        battingStyle: "Right-hand bat",
        bowlingStyle: "None",
        photo: ""
      });
      
      router.replace("/players");
      triggerSuccess("Player Added Successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create player.");
    } finally {
      setSaving(false);
    }
  };

  const handlePracticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/practice", {
        playerId: selectedPlayer.id,
        date: new Date().toISOString().split("T")[0],
        ...practiceForm
      });
      setShowPracticeOverlay(false);
      triggerSuccess("Practice Assessment Saved!");
      
      // Refresh details
      const refreshRes = await api.get("/players");
      const updatedPlayers = refreshRes.data || [];
      setPlayers(updatedPlayers);
      const updated = updatedPlayers.find((p: Player) => p.id === selectedPlayer.id);
      if (updated) setSelectedPlayer(updated);
      loadHistory(selectedPlayer.id);
      fetchLastAssessmentDates(updatedPlayers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save practice assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/matches", {
        playerId: selectedPlayer.id,
        date: new Date().toISOString().split("T")[0],
        ...matchForm
      });
      setShowMatchOverlay(false);
      triggerSuccess("Match Assessment Saved!");

      // Refresh details
      const refreshRes = await api.get("/players");
      const updatedPlayers = refreshRes.data || [];
      setPlayers(updatedPlayers);
      const updated = updatedPlayers.find((p: Player) => p.id === selectedPlayer.id);
      if (updated) setSelectedPlayer(updated);
      loadHistory(selectedPlayer.id);
      fetchLastAssessmentDates(updatedPlayers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save match assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSaving(true);

    const newAssessment = {
      date: new Date().toISOString().split("T")[0],
      ...selfForm
    };

    const existing = localStorage.getItem(`self_assess_${selectedPlayer.id}`);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift(newAssessment);
    localStorage.setItem(`self_assess_${selectedPlayer.id}`, JSON.stringify(list));

    setSelfHistory(list);
    setShowSelfOverlay(false);
    triggerSuccess("Self Assessment Logged!");
    setSaving(false);
    fetchLastAssessmentDates(players);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
    }, 1500);
  };

  const getRecommendations = () => {
    if (!selectedPlayer) return [];
    const recs = [];
    
    // Practice Assessment suggestions
    if (selectedPlayer.ppiScore !== null && selectedPlayer.ppiScore > 0) {
      if (selectedPlayer.ppiScore < 6.5) {
        recs.push({
          type: "PRACTICE FEEDBACK",
          tip: "Focus on technical fundamentals. Structure training with 70% basic drills and 30% nets to lock down mechanics under low pressure."
        });
      } else {
        recs.push({
          type: "PRACTICE FEEDBACK",
          tip: "Strong practice performance. Integrate target-practice challenges and match simulation netting sessions to push skills."
        });
      }
    } else {
      recs.push({
        type: "PRACTICE FEEDBACK",
        tip: "No practice assessment scored yet. Schedule a practice session to lock down baseline skills."
      });
    }

    // Match Assessment suggestions
    if (selectedPlayer.mpiScore !== null && selectedPlayer.mpiScore > 0) {
      if (selectedPlayer.mpiScore < 6.5) {
        recs.push({
          type: "MATCH PLAY FEEDBACK",
          tip: "Focus on match pressure management. Execute scenario games during nets with target goals to build execution confidence."
        });
      } else {
        recs.push({
          type: "MATCH PLAY FEEDBACK",
          tip: "Excellent match execution. Work on team-contribution aspects, strike rotation, and tactical field placement inputs."
        });
      }
    } else {
      recs.push({
        type: "MATCH PLAY FEEDBACK",
        tip: "No match assessments scored. Perform a match day assessment to log execution form."
      });
    }

    // Self Assessment suggestions
    if (selfHistory.length > 0) {
      const latestSelf = selfHistory[0];
      if (latestSelf.sleep < 7) {
        recs.push({
          type: "PREPARATION & HEALTH",
          tip: "Sleep score is low. Target 8 hours of sleep. Set a strict screen curfew 45 minutes prior to bedtime."
        });
      }
      if (latestSelf.nutrition < 7) {
        recs.push({
          type: "NUTRITION",
          tip: "Fuel with slow-release carbohydrates 3 hours before play, and hydrate with electrolytes during sessions."
        });
      }
      if (latestSelf.mental < 7) {
        recs.push({
          type: "MENTAL READINESS",
          tip: "Take 5 minutes before entering the field for deep breathing. Focus on executing one ball at a time."
        });
      }
    }

    // General default
    if (recs.length === 0) {
      recs.push({
        type: "GENERAL RECOMMENDATION",
        tip: "Maintain a balanced routine of 3 practice sessions per week. Record your self-assessment log regularly to analyze health parameters."
      });
    }

    return recs;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getPlayerScores = (p: Player) => {
    const ppi = p.ppiScore && p.ppiScore > 0 ? p.ppiScore : null;
    const mpi = p.mpiScore && p.mpiScore > 0 ? p.mpiScore : null;
    const cpi = ppi && mpi 
      ? (ppi + mpi) / 2 
      : ppi 
        ? ppi 
        : mpi 
          ? mpi 
          : null;
    return { ppi: ppi || 0, mpi: mpi || 0, cpi: cpi || 0 };
  };

  const getAssessDaysAgo = (pId: number) => {
    const dateStr = lastAssessmentDates[pId];
    if (!dateStr || dateStr === "No assessments" || dateStr === "Loading...") return 999;
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredPlayers = players.filter((p) => {
    // 1. Search Query
    const searchMatch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase());
    if (!searchMatch) return false;

    // 2. Role Filter
    if (roleFilter !== "all") {
      const r = p.role.toLowerCase();
      if (roleFilter === "batsman") {
        if (!r.includes("batsman") && !r.includes("batter")) return false;
      } else if (roleFilter === "bowler") {
        if (!r.includes("bowler")) return false;
      } else if (roleFilter === "all_rounder") {
        if (!r.includes("all-rounder") && !r.includes("all rounder") && !r.includes("allrounder")) return false;
      } else if (roleFilter === "wicket_keeper") {
        if (!r.includes("wicketkeeper") && !r.includes("wicket-keeper") && !r.includes("wicket keeper") && !r.includes("keeper")) return false;
      }
    }

    // 3. Quick Filter
    const scores = getPlayerScores(p);
    if (quickFilter === "top_performers") {
      if (scores.cpi < 6.5) return false;
    } else if (quickFilter === "needs_attention") {
      if (scores.cpi >= 6.5 || scores.cpi === 0) return false;
    } else if (quickFilter === "assessed_today") {
      const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (lastAssessmentDates[p.id] !== todayStr) return false;
    } else if (quickFilter === "not_assessed_recently") {
      const days = getAssessDaysAgo(p.id);
      if (days < 7) return false;
    }

    return true;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aScores = getPlayerScores(a);
    const bScores = getPlayerScores(b);

    if (sortBy === "highest_cpi") {
      if (aScores.cpi === 0) return 1;
      if (bScores.cpi === 0) return -1;
      return bScores.cpi - aScores.cpi;
    }
    if (sortBy === "lowest_cpi") {
      if (aScores.cpi === 0) return 1;
      if (bScores.cpi === 0) return -1;
      return aScores.cpi - bScores.cpi;
    }
    if (sortBy === "highest_ppi") {
      if (aScores.ppi === 0) return 1;
      if (bScores.ppi === 0) return -1;
      return bScores.ppi - aScores.ppi;
    }
    if (sortBy === "highest_mpi") {
      if (aScores.mpi === 0) return 1;
      if (bScores.mpi === 0) return -1;
      return bScores.mpi - aScores.mpi;
    }
    if (sortBy === "recently_assessed") {
      return getAssessDaysAgo(a.id) - getAssessDaysAgo(b.id);
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* ------------------ SUCCESS ANIMATION OVERLAY ------------------ */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-20 h-20 text-orange-500 stroke-[2] animate-bounce" />
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{successMessage}</h2>
        </div>
      )}

      {/* ------------------ VIEW: PLAYER LIST ------------------ */}
      {view === "list" && (
        <div className="space-y-6">
          
          {/* Top Row: Search & Filter & Add */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                <input
                  type="text"
                  placeholder="SEARCH PLAYERS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-zinc-950 border-2 border-zinc-900 rounded-2xl pl-12 pr-4 text-base font-bold text-white placeholder-zinc-650 focus:outline-none focus:border-orange-500 transition-colors uppercase"
                />
              </div>

              <button
                onClick={() => setShowFilterOverlay(true)}
                className={`h-14 w-14 rounded-2xl flex items-center justify-center border shrink-0 cursor-pointer transition-all active:scale-95 ${
                  sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all"
                    ? "bg-orange-500 text-black border-orange-400"
                    : "bg-zinc-950 border-2 border-zinc-900 text-zinc-400 hover:text-white"
                }`}
                title="Filter Squad"
              >
                <Filter className="w-6 h-6" />
              </button>

              {role !== "player" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="h-14 w-14 bg-orange-500 hover:bg-orange-600 text-black rounded-2xl flex items-center justify-center border border-orange-400 shrink-0 cursor-pointer shadow-lg active:scale-95 transition-all"
                  title="Add Player"
                >
                  <Plus className="w-8 h-8 stroke-[3]" />
                </button>
              )}
            </div>

            {/* Active Filter Chips */}
            {(sortBy !== "highest_cpi" || quickFilter !== "all" || roleFilter !== "all") && (
              <div className="flex flex-wrap gap-2 text-left pt-1">
                {quickFilter !== "all" && (
                  <span 
                    onClick={() => setQuickFilter("all")}
                    className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/35 text-orange-400 rounded-full text-sm font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-orange-500/20"
                  >
                    Filter: {quickFilter.replace(/_/g, " ")}
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {roleFilter !== "all" && (
                  <span 
                    onClick={() => setRoleFilter("all")}
                    className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/35 text-orange-400 rounded-full text-sm font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-orange-500/20"
                  >
                    Role: {roleFilter.replace(/_/g, " ")}
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {sortBy !== "highest_cpi" && (
                  <span 
                    onClick={() => setSortBy("highest_cpi")}
                    className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/35 text-orange-400 rounded-full text-sm font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-orange-500/20"
                  >
                    Sort: {sortBy.replace(/_/g, " ")}
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <button 
                  onClick={() => {
                    setSortBy("highest_cpi");
                    setQuickFilter("all");
                    setRoleFilter("all");
                  }}
                  className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider pl-1 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Add Player Form (Clean inline card) */}
          {showAddForm && (
            <div className="border-2 border-orange-500 bg-zinc-950 rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">ADD NEW PLAYER</h3>
                <button 
                  onClick={() => { setShowAddForm(false); router.replace("/players"); }}
                  className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="bg-red-950 text-red-200 border-2 border-red-500 text-sm font-bold p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddPlayerSubmit} className="space-y-4 text-left">
                
                {/* Photo Picker */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-sm font-bold tracking-widest text-zinc-400 block self-start">PLAYER PHOTO</span>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-3xl bg-zinc-900 border-2 border-zinc-850 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group"
                  >
                    {newPlayer.photo ? (
                      <img src={newPlayer.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-zinc-500 group-hover:text-orange-500 mb-1" />
                        <span className="text-sm font-bold text-zinc-500 uppercase">CHOOSE</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handlePhotoSelect(e)} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold tracking-widest text-zinc-400">PLAYER NAME</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white font-semibold focus:outline-none focus:border-orange-500"
                    placeholder="Enter player full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold tracking-widest text-zinc-400">AGE</label>
                    <input
                      type="number"
                      required
                      value={newPlayer.age}
                      onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white font-semibold focus:outline-none focus:border-orange-500"
                      placeholder="e.g. 16"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold tracking-widest text-zinc-400">PLAYING ROLE</label>
                    <select
                      value={newPlayer.role}
                      onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                      className="w-full h-[52px] bg-black border-2 border-zinc-800 rounded-xl px-3 py-2 text-base text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicketkeeper">Wicketkeeper</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4 text-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "SAVE PLAYER"}
                </button>
              </form>
            </div>
          )}

          {/* Player Cards list */}
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Squad...</p>
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-bold uppercase tracking-wider text-sm border-2 border-dashed border-zinc-900 rounded-3xl">
              No players found
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPlayers.map((player) => {
                const cpi = player.ppiScore && player.mpiScore && player.ppiScore > 0 && player.mpiScore > 0
                  ? ((player.ppiScore + player.mpiScore) / 2).toFixed(1)
                  : player.ppiScore && player.ppiScore > 0
                    ? player.ppiScore.toFixed(1)
                    : player.mpiScore && player.mpiScore > 0
                      ? player.mpiScore.toFixed(1)
                      : "N/A";
                
                const cachedPhoto = typeof window !== 'undefined' ? localStorage.getItem(`player_photo_${player.id}`) : null;
                const assessDate = lastAssessmentDates[player.id] || "Loading...";

                return (
                  <div
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 flex items-center justify-between hover:border-zinc-800 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Photo or Initials Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {cachedPhoto ? (
                          <img src={cachedPhoto} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-orange-500">{getInitials(player.name)}</span>
                        )}
                      </div>
                      
                      <div className="min-w-0 text-left space-y-0.5">
                        <h4 className="text-xl font-bold text-white truncate uppercase tracking-tight leading-none">{player.name}</h4>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest truncate">{player.role}</p>
                        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-tight">Last: {assessDate}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-zinc-500 tracking-widest uppercase">CPI INDEX</div>
                      <div className="text-2xl font-bold text-orange-500 tracking-tight">{cpi}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------ VIEW: PLAYER PROFILE LOADING ------------------ */}
      {view === "profile" && !selectedPlayer && (
        <div className="flex flex-col items-center py-40 gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Loading Profile...</p>
        </div>
      )}

      {/* ------------------ VIEW: PLAYER PROFILE ------------------ */}
      {view === "profile" && selectedPlayer && (() => {
        // Compute insights
        let strongestArea = "N/A";
        let weakestArea = "N/A";
        let needsImprovement = "N/A";

        if (practiceHistory.length > 0 || matchHistory.length > 0) {
          const metricSums: Record<string, { sum: number; count: number }> = {};

          const addMetric = (key: string, val: number | undefined | null) => {
            if (val === undefined || val === null || val <= 0) return;
            if (!metricSums[key]) {
              metricSums[key] = { sum: 0, count: 0 };
            }
            metricSums[key].sum += val;
            metricSums[key].count += 1;
          };

          practiceHistory.forEach(p => {
            addMetric("Technique", p.technique);
            addMetric("Training Intensity", p.intensity);
            addMetric("Skill Execution", p.execution);
            addMetric("Adaptability", p.adaptability);
            addMetric("Practice Discipline", p.discipline);
            addMetric("Focus & Attention", p.focus);
          });

          matchHistory.forEach(m => {
            addMetric("Technical Execution", m.technicalExecution);
            addMetric("Decision Making", m.decisionMaking);
            addMetric("Game Awareness", m.gameAwareness);
            addMetric("Pressure Handling", m.pressureHandling);
            addMetric("Team Contribution", m.teamContribution);
            addMetric("Match Impact", m.matchImpact);
          });

          const averages = Object.entries(metricSums).map(([name, data]) => ({
            name,
            avg: data.sum / data.count
          }));

          if (averages.length > 0) {
            averages.sort((a, b) => b.avg - a.avg);
            strongestArea = averages[0].name;
            if (averages.length > 1) {
              weakestArea = averages[averages.length - 1].name;
              needsImprovement = averages.length > 2 ? averages[averages.length - 2].name : averages[0].name;
            }
          }
        }

        // Recommendations focus
        let focusAreas = [
          "Improve Shot Selection",
          "Improve Target Accuracy",
          "Improve Match Scenario Practice"
        ];

        const playerRole = selectedPlayer.role ? selectedPlayer.role.toLowerCase() : "";
        if (playerRole.includes("bowler")) {
          focusAreas = [
            "Improve Line & Length Consistency",
            "Improve Death Overs Execution",
            "Develop Pace & Spin Variations"
          ];
        } else if (playerRole.includes("batsman") || playerRole.includes("batter")) {
          focusAreas = [
            "Improve Strike Rotation",
            "Improve Spin Response & Footwork",
            "Improve Defensive Contact Point"
          ];
        } else if (playerRole.includes("all-rounder") || playerRole.includes("all rounder")) {
          focusAreas = [
            "Improve Match Awareness under Pressure",
            "Develop Consistent Power Hitting",
            "Improve Tactical Field Settings"
          ];
        } else if (playerRole.includes("wicketkeeper") || playerRole.includes("keeper")) {
          focusAreas = [
            "Improve Reaction Glove Timing",
            "Improve Bowler-Keeper Communication",
            "Improve Core Agility & Balance"
          ];
        }

        // Get self-assessment averages
        const getSelfAverages = () => {
          if (!selfHistory || selfHistory.length === 0) return null;
          const totals = { sleep: 0, nutrition: 0, preparation: 0, health: 0, mental: 0, fitness: 0 };
          selfHistory.forEach(h => {
            totals.sleep += h.sleep || 0;
            totals.nutrition += h.nutrition || 0;
            totals.preparation += h.preparation || 0;
            totals.health += h.health || 0;
            totals.mental += h.mental || 0;
            totals.fitness += h.fitness || 0;
          });
          const count = selfHistory.length;
          return {
            sleep: (totals.sleep / count).toFixed(1),
            nutrition: (totals.nutrition / count).toFixed(1),
            preparation: (totals.preparation / count).toFixed(1),
            health: (totals.health / count).toFixed(1),
            mental: (totals.mental / count).toFixed(1),
            fitness: (totals.fitness / count).toFixed(1),
          };
        };
        const selfAverages = getSelfAverages();

        // Calculate latest assessment dates
        let lastAssessmentDate = "No assessments logged";
        const dates = [
          ...practiceHistory.map(p => p.createdAt || p.date),
          ...matchHistory.map(m => m.createdAt || m.date)
        ].filter(Boolean);
        if (dates.length > 0) {
          const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          lastAssessmentDate = new Date(sortedDates[0]).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        }

        const formatScoreValue = (val: number | null | undefined) => {
          if (val === null || val === undefined) return "N/A";
          if (val <= 10) {
            return Math.round(val * 10).toString();
          }
          return Math.round(val).toString();
        };

        const currentPpi = selectedPlayer.ppiScore && selectedPlayer.ppiScore > 0 ? selectedPlayer.ppiScore : null;
        const currentMpi = selectedPlayer.mpiScore && selectedPlayer.mpiScore > 0 ? selectedPlayer.mpiScore : null;
        const currentCpi = currentPpi && currentMpi 
          ? (currentPpi + currentMpi) / 2 
          : currentPpi 
            ? currentPpi 
            : currentMpi 
              ? currentMpi 
              : null;

        // Compute Trend data
        const last5Prac = [...practiceHistory]
          .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
          .slice(-5);

        const last5Match = [...matchHistory]
          .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
          .slice(-5);

        const cpiVal = currentCpi ? parseInt(formatScoreValue(currentCpi), 10) : 0;
        const gapVal = targetCpi - cpiVal;
        const targetPercent = Math.min(100, Math.max(0, Math.round((cpiVal / targetCpi) * 100)));

        const devMetrics = [
          { name: "Sleep Quality", val: selfAverages ? selfAverages.sleep : "7.0" },
          { name: "Nutrition", val: selfAverages ? selfAverages.nutrition : "7.0" },
          { name: "General Health", val: selfAverages ? selfAverages.health : "7.0" },
          { name: "Fitness", val: selfAverages ? selfAverages.fitness : "7.0" },
          { name: "Mental Readiness", val: selfAverages ? selfAverages.mental : "7.0" },
          { name: "Preparation Quality", val: selfAverages ? selfAverages.preparation : "7.0" }
        ];

        return (
          <div className="space-y-6 text-center pb-12 select-none">
            {/* Back Header */}
            {role !== "player" && (
              <div className="flex items-center gap-3 text-left">
                <button
                  onClick={() => { setView("list"); router.replace("/players"); }}
                  className="h-11 px-4 bg-zinc-955 bg-zinc-950 border-2 border-zinc-900 rounded-xl flex items-center justify-center gap-2 text-zinc-400 font-bold uppercase text-xs hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3]" />
                  BACK TO LIST
                </button>
              </div>
            )}

            {/* SECTION 1 – PLAYER HEADER */}
            <div className="bg-zinc-955 bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-6 space-y-4 text-center">
              <div 
                onClick={() => profilePhotoInputRef.current?.click()}
                className="w-28 h-28 rounded-3xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mx-auto overflow-hidden relative cursor-pointer group hover:border-orange-500"
              >
                {typeof window !== 'undefined' && localStorage.getItem(`player_photo_${selectedPlayer.id}`) ? (
                  <img src={localStorage.getItem(`player_photo_${selectedPlayer.id}`)!} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-orange-500">{getInitials(selectedPlayer.name)}</span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <input 
                type="file" 
                ref={profilePhotoInputRef} 
                onChange={(e) => handlePhotoSelect(e, true)} 
                accept="image/*" 
                className="hidden" 
              />

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white uppercase tracking-tight leading-none">{selectedPlayer.name}</h2>
                <p className="text-xs font-bold text-zinc-550 uppercase tracking-widest">{selectedPlayer.role}</p>
                <div className="text-sm text-zinc-400 font-semibold uppercase mt-1">
                  Age: {((selectedPlayer.id % 5) + 19)} • Style: {selectedPlayer.battingStyle || "N/A"} • {selectedPlayer.bowlingStyle || "N/A"}
                </div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                  Last Assessed: {lastAssessmentDate}
                </div>
                {selectedPlayer.invitationCode && (
                  <div className="mt-3 bg-zinc-900 border border-zinc-850 rounded-2xl p-3 inline-block min-w-[200px]">
                    <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block text-center">PLAYER INVITATION CODE</span>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <span className="text-sm font-mono font-bold text-orange-500 uppercase tracking-wider">
                        {selectedPlayer.invitationCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPlayer.invitationCode || "");
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="p-1 hover:bg-zinc-850 rounded transition-colors text-zinc-455 hover:text-white cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedCode ? (
                          <Check className="w-3.5 h-3.5 text-green-500 stroke-[3]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-400 uppercase block text-center mt-1">
                      {selectedPlayer.invitationCodeActivated ? "Activated" : "Pending activation"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons for Assessment logging */}
            <div className="space-y-3">
              {role !== "player" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPracticeForm({
                        technique: 7,
                        intensity: 7,
                        execution: 7,
                        adaptability: 7,
                        discipline: 7,
                        focus: 7,
                        notes: ""
                      });
                      setError("");
                      setShowPracticeOverlay(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer uppercase"
                  >
                    <Clipboard className="w-4 h-4 stroke-[3]" />
                    Practice Grade
                  </button>

                  <button
                    onClick={() => {
                      setMatchForm({
                        technicalExecution: 7,
                        decisionMaking: 7,
                        gameAwareness: 7,
                        pressureHandling: 7,
                        teamContribution: 7,
                        matchImpact: 7,
                        notes: ""
                      });
                      setError("");
                      setShowMatchOverlay(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer uppercase"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[3]" />
                    Match Grade
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelfForm({
                      sleep: 7,
                      nutrition: 7,
                      preparation: 7,
                      health: 7,
                      mental: 7,
                      fitness: 7
                    });
                    setShowSelfOverlay(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-4.5 text-sm font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer uppercase"
                >
                  <Clipboard className="w-5 h-5 stroke-[3]" />
                  Log Self Assessment
                </button>
              )}
            </div>

            {/* SECTION 2 – CURRENT STATUS (WHERE AM I?) */}
            <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 1</span>
                <h3 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  CURRENT STATUS (WHERE AM I?)
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                    Current CPI
                  </p>
                  <p className="text-3xl font-bold text-orange-400 font-mono leading-none">
                    {formatScoreValue(currentCpi)}
                  </p>
                </div>
                <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900">
                  <p className="text-xs font-bold text-zinc-550 uppercase tracking-wider mb-1">
                    Current PPI
                  </p>
                  <p className="text-3xl font-bold text-white font-mono leading-none">
                    {formatScoreValue(currentPpi)}
                  </p>
                </div>
                <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900">
                  <p className="text-xs font-bold text-zinc-550 uppercase tracking-wider mb-1">
                    Current MPI
                  </p>
                  <p className="text-3xl font-bold text-white font-mono leading-none">
                    {formatScoreValue(currentMpi)}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3 – PROGRESS (WHERE WAS I?) */}
            <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 2</span>
                <h3 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  PROGRESS (WHERE WAS I?)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Last 5 Practice */}
                <div className="space-y-2">
                  <span className="text-sm font-bold text-zinc-550 uppercase tracking-widest block border-b border-zinc-900 pb-1">
                    Last 5 Practice Assessments
                  </span>
                  {last5Prac.length === 0 ? (
                    <span className="text-xs text-zinc-650 font-bold uppercase block py-2">No Practice Data</span>
                  ) : (
                    <div className="space-y-2">
                      {last5Prac.map((p, idx) => {
                        const prevScore = idx > 0 ? last5Prac[idx - 1].ppiScore : null;
                        const currentScore = p.ppiScore;
                        return (
                          <div key={p.id || idx} className="flex justify-between items-center text-xs font-bold bg-zinc-900/30 px-3 py-2.5 rounded-xl border border-zinc-900">
                            <span className="text-zinc-400">Practice {idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-orange-500 font-mono text-sm">{formatScoreValue(currentScore)}</span>
                              {prevScore !== null && currentScore !== null && (
                                currentScore > prevScore ? (
                                  <span className="text-green-500 font-extrabold text-xs">↑</span>
                                ) : currentScore < prevScore ? (
                                  <span className="text-red-500 font-extrabold text-xs">↓</span>
                                ) : (
                                  <span className="text-zinc-650 font-bold text-xs">•</span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Last 5 Match */}
                <div className="space-y-2">
                  <span className="text-sm font-bold text-zinc-550 uppercase tracking-widest block border-b border-zinc-900 pb-1">
                    Last 5 Match Assessments
                  </span>
                  {last5Match.length === 0 ? (
                    <span className="text-xs text-zinc-655 font-bold uppercase block py-2">No Match Data</span>
                  ) : (
                    <div className="space-y-2">
                      {last5Match.map((m, idx) => {
                        const prevScore = idx > 0 ? last5Match[idx - 1].mpiScore : null;
                        const currentScore = m.mpiScore;
                        return (
                          <div key={m.id || idx} className="flex justify-between items-center text-xs font-bold bg-zinc-900/30 px-3 py-2.5 rounded-xl border border-zinc-900">
                            <span className="text-zinc-400">Match {idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-orange-500 font-mono text-sm">{formatScoreValue(currentScore)}</span>
                              {prevScore !== null && currentScore !== null && (
                                currentScore > prevScore ? (
                                  <span className="text-green-500 font-extrabold text-xs">↑</span>
                                ) : currentScore < prevScore ? (
                                  <span className="text-red-500 font-extrabold text-xs">↓</span>
                                ) : (
                                  <span className="text-zinc-650 font-bold text-xs">•</span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4 – TARGETS (WHERE DO I WANT TO BE?) */}
            <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 3</span>
                <h3 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  WHERE DO I WANT TO BE? (TARGET GOALS)
                </h3>
              </div>
              
              <div className="space-y-4 pt-1">
                {/* Target CPI Editing Card */}
                <div className="bg-zinc-900/30 p-4.5 rounded-2xl border border-zinc-900 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-zinc-550 uppercase tracking-widest block">TARGET CPI</span>
                    <span className="text-xs font-bold text-zinc-400 uppercase block mt-0.5">
                      {gapVal > 0 ? `${gapVal} points to target cpi` : "Target achieved!"}
                    </span>
                  </div>
                  {isEditingTarget ? (
                    <div className="flex items-center gap-2 text-left">
                      <select
                        value={tempTargetCpi}
                        onChange={(e) => setTempTargetCpi(e.target.value)}
                        className="bg-black border-2 border-zinc-800 rounded-xl px-2 py-1.5 font-mono font-bold text-white text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {[70, 75, 80, 85, 90, 95, 100].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveTargetCpi}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-600 text-black rounded-lg text-xs font-bold uppercase cursor-pointer transition-all"
                      >
                        SAVE
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { setTempTargetCpi(targetCpi.toString()); setIsEditingTarget(true); }}
                      className="cursor-pointer group flex items-center gap-1.5 bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-800 hover:border-orange-500 transition-all"
                    >
                      <span className="text-xl font-bold text-orange-500 font-mono">{targetCpi}</span>
                      <Edit2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Progress Bar toward Target */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm font-bold text-zinc-500 uppercase tracking-wider px-1">
                    <span>Progress to Target</span>
                    <span className="font-mono text-orange-500">{targetPercent}%</span>
                  </div>
                  <div className="w-full h-3.5 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                      style={{ width: `${targetPercent}%` }} 
                    />
                  </div>
                </div>

                {/* Development Goal Card */}
                <div className="space-y-1.5">
                  <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block pl-1">MY DEVELOPMENT GOAL / MILESTONE</span>
                  {isEditingGoal ? (
                    <div className="space-y-2 text-left">
                      <textarea
                        value={tempTargetGoal}
                        onChange={(e) => setTempTargetGoal(e.target.value)}
                        className="w-full bg-black border-2 border-zinc-850 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-orange-500 resize-none h-16"
                        placeholder="e.g. Consistently rotate strike in A-grade nets..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTargetGoal}
                          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-655 text-black rounded-lg text-xs font-bold uppercase cursor-pointer"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setIsEditingGoal(false)}
                          className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-855 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold uppercase cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { setTempTargetGoal(targetGoal); setIsEditingGoal(true); }}
                      className="cursor-pointer group bg-zinc-900/30 p-4 rounded-2xl border border-zinc-900 hover:border-zinc-800 transition-all flex items-center justify-between text-sm font-bold text-zinc-300"
                    >
                      <span className="text-white text-left uppercase tracking-tight leading-relaxed">{targetGoal}</span>
                      <Edit2 className="w-4 h-4 text-zinc-500 group-hover:text-orange-500 transition-colors shrink-0 ml-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5 – IMPROVEMENT AREAS */}
            <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">QUESTION 4</span>
                <h3 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  WHAT DO I NEED TO WORK ON? (IMPROVEMENT AREAS)
                </h3>
              </div>
              
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                  <span className="text-sm font-bold text-zinc-500 uppercase">Strongest Area</span>
                  <span className="text-xs font-bold text-green-500 uppercase">{strongestArea}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                  <span className="text-sm font-bold text-zinc-500 uppercase">Needs Improvement</span>
                  <span className="text-xs font-bold text-orange-500 uppercase">{needsImprovement}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                  <span className="text-sm font-bold text-zinc-500 uppercase">Weakest Area</span>
                  <span className="text-xs font-bold text-red-550 text-red-500 uppercase">{weakestArea}</span>
                </div>
              </div>
            </div>

            {/* SECTION 5 – RECOMMENDED FOCUS */}
            <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <h3 className="text-sm font-extrabold tracking-widest text-zinc-800 dark:text-zinc-200 uppercase border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                RECOMMENDED FOCUS
              </h3>
              <div className="space-y-2.5 pt-1">
                {focusAreas.map((focus, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-300 dark:border-zinc-800 text-[13px] font-bold text-zinc-900 dark:text-white">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    {focus}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 6 – PLAYER DEVELOPMENT */}
            <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                PLAYER DEVELOPMENT
              </h3>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {devMetrics.map((m) => {
                  const rating = parseFloat(m.val);
                  const colorClass = rating >= 8 ? "text-green-500" : rating >= 6 ? "text-orange-500" : "text-red-500";
                  const barColor = rating >= 8 ? "bg-green-500" : rating >= 6 ? "bg-orange-500" : "bg-red-500";
                  return (
                    <div key={m.name} className="bg-zinc-900/30 p-3.5 rounded-2xl border border-zinc-900 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-550 uppercase tracking-wider">{m.name}</span>
                        <span className={`text-xs font-bold font-mono ${colorClass}`}>{m.val}/10</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} rounded-full`} 
                          style={{ width: `${rating * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 7 – ASSESSMENT HISTORY */}
            <div className="bg-zinc-955 bg-zinc-950 border border-zinc-900 rounded-3xl p-5.5 space-y-4 text-left">
              <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-orange-500" />
                ASSESSMENT HISTORY
              </h3>
              
              <div className="space-y-4 pt-1">
                {/* Practice History scroll area */}
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2 border-b border-zinc-900 pb-1">
                    Practice History
                  </span>
                  {practiceHistory.length === 0 ? (
                    <p className="text-xs text-zinc-605 font-bold uppercase py-1">No Practice History</p>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {practiceHistory.map((p, idx) => (
                        <div key={p.id || idx} className="bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900/80 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block">Practice Assessment</span>
                            <span className="text-xs text-zinc-550">{new Date(p.date || p.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-orange-500 font-mono text-sm">PPI {formatScoreValue(p.ppiScore)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match History scroll area */}
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2 border-b border-zinc-900 pb-1">
                    Match History
                  </span>
                  {matchHistory.length === 0 ? (
                    <p className="text-xs text-zinc-605 font-bold uppercase py-1">No Match History</p>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {matchHistory.map((m, idx) => (
                        <div key={m.id || idx} className="bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900/80 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block">Match Assessment</span>
                            <span className="text-xs text-zinc-550">{new Date(m.date || m.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-orange-500 font-mono text-sm">MPI {formatScoreValue(m.mpiScore)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ------------------ OVERLAY: PRACTICE ASSESSMENT ------------------ */}
      {showPracticeOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">PRACTICE GRADES</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowPracticeOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-4 rounded-xl uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handlePracticeSubmit} className="space-y-6">
            {[
              { label: "TECHNIQUE", key: "technique", desc: "Stance, balance, and core movement" },
              { label: "INTENSITY", key: "intensity", desc: "Energy level and physical output" },
              { label: "EXECUTION", key: "execution", desc: "Ball hitting or delivery accuracy" },
              { label: "ADAPTABILITY", key: "adaptability", desc: "Adjustment to variations and conditions" },
              { label: "DISCIPLINE", key: "discipline", desc: "Shot selection and training structure" },
              { label: "FOCUS & ATTITUDE", key: "focus", desc: "Concentration and body language" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-bold tracking-widest text-white uppercase">{metric.label}</label>
                    <p className="text-sm text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(practiceForm as any)[metric.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(practiceForm as any)[metric.key]}
                  onChange={(e) => setPracticeForm({ ...practiceForm, [metric.key]: parseInt(e.target.value) })}
                  className="w-full h-3 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest text-zinc-400">NOTES</label>
              <textarea
                value={practiceForm.notes}
                onChange={(e) => setPracticeForm({ ...practiceForm, notes: e.target.value })}
                className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 resize-none h-20"
                placeholder="Optional coach remarks..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "SAVE ASSESSMENT"}
            </button>
          </form>
        </div>
      )}

      {/* ------------------ OVERLAY: MATCH ASSESSMENT ------------------ */}
      {showMatchOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">MATCH GRADES</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowMatchOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-4 rounded-xl uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleMatchSubmit} className="space-y-6">
            {[
              { label: "TECHNICAL EXECUTION", key: "technicalExecution", desc: "Fundamentals under pressure" },
              { label: "DECISION MAKING", key: "decisionMaking", desc: "Tactical choices and risk-reward" },
              { label: "GAME AWARENESS", key: "gameAwareness" , desc: "Understanding scenarios and run-rates"},
              { label: "PRESSURE HANDLING", key: "pressureHandling" , desc: "Resilience in key wickets/overs"},
              { label: "TEAM CONTRIBUTION", key: "teamContribution" , desc: "Fielding, backing up and attitude"},
              { label: "MATCH IMPACT", key: "matchImpact", desc: "Crucial runs, wickets or fielding saves" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-bold tracking-widest text-white uppercase">{metric.label}</label>
                    <p className="text-sm text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(matchForm as any)[metric.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(matchForm as any)[metric.key]}
                  onChange={(e) => setMatchForm({ ...matchForm, [metric.key]: parseInt(e.target.value) })}
                  className="w-full h-3 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest text-zinc-400">NOTES</label>
              <textarea
                value={matchForm.notes}
                onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500 resize-none h-20"
                placeholder="Optional match details..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "SAVE ASSESSMENT"}
            </button>
          </form>
        </div>
      )}

      {/* ------------------ OVERLAY: SELF ASSESSMENT ------------------ */}
      {showSelfOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">MY SELF GRADES</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowSelfOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          <form onSubmit={handleSelfSubmit} className="space-y-6">
            {[
              { label: "SLEEP QUALITY", key: "sleep", desc: "Hours slept and recovery feeling" },
              { label: "NUTRITION", key: "nutrition", desc: "Proper hydration and dietary balance" },
              { label: "PREPARATION & WARMUP", key: "preparation", desc: "Focus routine and stretching readiness" },
              { label: "GENERAL HEALTH & BODY", key: "health", desc: "Lack of pain or stiffness" },
              { label: "MENTAL READINESS", key: "mental", desc: "Confidence and cognitive calmness" },
              { label: "FITNESS & PHYSICAL STRENGTH", key: "fitness", desc: "General stamina, muscle soreness, and power level" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-bold tracking-widest text-white uppercase">{metric.label}</label>
                    <p className="text-sm text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(selfForm as any)[metric.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(selfForm as any)[metric.key]}
                  onChange={(e) => setSelfForm({ ...selfForm, [metric.key]: parseInt(e.target.value) })}
                  className="w-full h-3 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-bold transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
            >
              SAVE SELF ASSESSMENT
            </button>
          </form>
        </div>
      )}

      {/* ------------------ OVERLAY: ASSESSMENT HISTORY ------------------ */}
      {showHistoryOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-12">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">PLAYER LOGS</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowHistoryOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* CPI Trend */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-orange-500 uppercase">CPI RECENT TREND</h4>
            {[...practiceHistory, ...matchHistory].length === 0 ? (
              <p className="text-xs text-zinc-500 font-bold uppercase">No records logged yet.</p>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                  ...practiceHistory.map((h) => ({ date: h.date, score: h.ppiScore, type: "Prac" })),
                  ...matchHistory.map((h) => ({ date: h.date, score: h.mpiScore, type: "Match" }))
                ]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(-6)
                  .map((s, idx) => (
                    <div key={idx} className="flex-1 min-w-[70px] flex flex-col items-center bg-zinc-900 border border-zinc-850 rounded-xl py-3">
                      <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{s.type}</span>
                      <span className="text-base font-bold text-white mt-1">{(s.score || 0).toFixed(1)}</span>
                      <span className="text-[7px] font-semibold text-zinc-400 mt-0.5">{s.date.split("-").slice(1).join("/")}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Practice History timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">PRACTICE ASSESSMENTS</h4>
            {practiceHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold uppercase pl-2">No practice logs</p>
            ) : (
              <div className="space-y-3">
                {practiceHistory.map((h, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-zinc-500">{h.date}</div>
                      <div className="text-sm font-semibold text-white mt-1 italic">
                        {h.notes ? `"${h.notes}"` : "Practice Session"}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                      PPI {h.ppiScore ? h.ppiScore.toFixed(1) : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match History timeline */}
          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">MATCH ASSESSMENTS</h4>
            {matchHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold uppercase pl-2">No match logs</p>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((h, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-zinc-500">{h.date}</div>
                      <div className="text-sm font-semibold text-white mt-1 italic">
                        {h.notes ? `"${h.notes}"` : "Match Session"}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                      MPI {h.mpiScore ? h.mpiScore.toFixed(1) : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Self History timeline */}
          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h4 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">SELF ASSESSMENTS</h4>
            {selfHistory.length === 0 ? (
              <p className="text-xs text-zinc-600 font-bold uppercase pl-2">No self-assess logs</p>
            ) : (
              <div className="space-y-3">
                {selfHistory.map((h, i) => {
                  const avg = (h.sleep + h.nutrition + h.preparation + h.health + h.mental) / 5;
                  return (
                    <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-zinc-500">{h.date}</div>
                        <div className="text-xs font-semibold text-zinc-400 mt-1">
                          Sleep: {h.sleep} • Nutrition: {h.nutrition} • Preparation: {h.preparation}
                        </div>
                      </div>
                      <span className="text-base font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                        {avg.toFixed(1)}/10
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------ OVERLAY: RECOMMENDATIONS ------------------ */}
      {showRecsOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-12">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="space-y-1">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">COACH ADVICE</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowRecsOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="space-y-4">
            {getRecommendations().map((rec, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-2">
                <span className="text-sm font-bold tracking-widest text-orange-500 uppercase block">
                  {rec.type}
                </span>
                <p className="text-base font-bold text-white leading-relaxed">
                  {rec.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------ OVERLAY: FILTER & SORT ------------------ */}
      {showFilterOverlay && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center animate-fade-in select-none">
          <div className="bg-zinc-950 border-t-2 border-zinc-900 w-full max-w-lg rounded-t-[32px] p-6 space-y-6 pb-10 shadow-2xl animate-slide-up">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight text-left">FILTER & SORT SQUAD</h3>
                <p className="text-sm text-zinc-500 font-bold uppercase text-left">{sortedPlayers.length} players matched</p>
              </div>
              <button 
                onClick={() => setShowFilterOverlay(false)} 
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SORT BY */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase">SORT BY</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Highest CPI", val: "highest_cpi" },
                  { label: "Lowest CPI", val: "lowest_cpi" },
                  { label: "Highest PPI", val: "highest_ppi" },
                  { label: "Highest MPI", val: "highest_mpi" },
                  { label: "Recently Assessed", val: "recently_assessed" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSortBy(opt.val as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      sortBy === opt.val
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900 text-zinc-400 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QUICK FILTERS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase">QUICK FILTERS</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All Players", val: "all" },
                  { label: "Top Performers", val: "top_performers" },
                  { label: "Needs Attention", val: "needs_attention" },
                  { label: "Assessed Today", val: "assessed_today" },
                  { label: "Not Assessed Recently", val: "not_assessed_recently" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setQuickFilter(opt.val as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      quickFilter === opt.val
                        ? "bg-orange-500 text-black border-orange-450"
                        : "bg-zinc-900 text-zinc-400 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ROLE FILTERS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold tracking-widest text-zinc-500 uppercase">ROLE FILTERS</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All Roles", val: "all" },
                  { label: "Batsman", val: "batsman" },
                  { label: "Bowler", val: "bowler" },
                  { label: "All Rounder", val: "all_rounder" },
                  { label: "Wicket Keeper", val: "wicket_keeper" }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRoleFilter(opt.val as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      roleFilter === opt.val
                        ? "bg-orange-500 text-black border-orange-450"
                        : "bg-zinc-900 text-zinc-400 border-zinc-850 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilterOverlay(false)}
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4 text-base font-bold transition-all cursor-pointer flex items-center justify-center border-2 border-white shadow-xl active:scale-98"
            >
              APPLY & VIEW SQUAD
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
