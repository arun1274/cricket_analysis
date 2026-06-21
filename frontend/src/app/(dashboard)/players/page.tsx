"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, Plus, Loader2, ArrowLeft, Clipboard, ShieldCheck, 
  Sparkles, ListCollapse, Award, Flame, Heart, Brain, X, Camera, CheckCircle2 
} from "lucide-react";

interface Player {
  id: number;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  ppiScore: number | null;
  mpiScore: number | null;
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
  const [view, setView] = useState<"list" | "profile">("list");
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
    mental: 7
  });

  // Player history state
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [selfHistory, setSelfHistory] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  // Handle self-assessment navigation from dashboard
  useEffect(() => {
    if (players.length > 0 && searchParams.get("selfAssess") === "true") {
      api.get("/profile").then((profileRes) => {
        const matchingPlayer = players.find(
          (p) => p.name.toLowerCase() === profileRes.data.name.toLowerCase()
        ) || players[0];
        
        if (matchingPlayer) {
          setSelectedPlayer(matchingPlayer);
          setView("profile");
          setShowSelfOverlay(true);
          loadHistory(matchingPlayer.id);
        }
      }).catch(() => {
        setSelectedPlayer(players[0]);
        setView("profile");
        setShowSelfOverlay(true);
        loadHistory(players[0].id);
      });
    }
  }, [players, searchParams]);

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

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setView("profile");
    loadHistory(player.id);
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

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* ------------------ SUCCESS ANIMATION OVERLAY ------------------ */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-20 h-20 text-orange-500 stroke-[2] animate-bounce" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">{successMessage}</h2>
        </div>
      )}

      {/* ------------------ VIEW: PLAYER LIST ------------------ */}
      {view === "list" && (
        <div className="space-y-6">
          
          {/* Top Row: Search & Add */}
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
          </div>

          {/* Add Player Form (Clean inline card) */}
          {showAddForm && (
            <div className="border-2 border-orange-500 bg-zinc-950 rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">ADD NEW PLAYER</h3>
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
                  <span className="text-[10px] font-black tracking-widest text-zinc-400 block self-start">PLAYER PHOTO</span>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-3xl bg-zinc-900 border-2 border-zinc-850 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group"
                  >
                    {newPlayer.photo ? (
                      <img src={newPlayer.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-zinc-500 group-hover:text-orange-500 mb-1" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase">CHOOSE</span>
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
                  <label className="text-[10px] font-black tracking-widest text-zinc-400">PLAYER NAME</label>
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
                    <label className="text-[10px] font-black tracking-widest text-zinc-400">AGE</label>
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
                    <label className="text-[10px] font-black tracking-widest text-zinc-400">PLAYING ROLE</label>
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
                  className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4 text-lg font-black transition-all cursor-pointer flex items-center justify-center gap-2"
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
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-bold uppercase tracking-wider text-sm border-2 border-dashed border-zinc-900 rounded-3xl">
              No players found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlayers.map((player) => {
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
                          <span className="text-xl font-black text-orange-500">{getInitials(player.name)}</span>
                        )}
                      </div>
                      
                      <div className="min-w-0 text-left space-y-0.5">
                        <h4 className="text-xl font-black text-white truncate uppercase tracking-tight leading-none">{player.name}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{player.role}</p>
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-tight">Last: {assessDate}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">CPI INDEX</div>
                      <div className="text-2xl font-black text-orange-500 tracking-tight">{cpi}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------ VIEW: PLAYER PROFILE ------------------ */}
      {view === "profile" && selectedPlayer && (
        <div className="space-y-6 text-center">
          
          {/* Back Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView("list"); router.replace("/players"); }}
              className="h-11 px-4 bg-zinc-950 border-2 border-zinc-900 rounded-xl flex items-center justify-center gap-2 text-zinc-400 font-bold uppercase text-xs hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              BACK TO LIST
            </button>
          </div>

          {/* Photo and Name */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-6 space-y-4">
            
            <div 
              onClick={() => profilePhotoInputRef.current?.click()}
              className="w-28 h-28 rounded-3xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mx-auto overflow-hidden relative cursor-pointer group hover:border-orange-500"
            >
              {typeof window !== 'undefined' && localStorage.getItem(`player_photo_${selectedPlayer.id}`) ? (
                <img src={localStorage.getItem(`player_photo_${selectedPlayer.id}`)!} alt={selectedPlayer.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-orange-500">{getInitials(selectedPlayer.name)}</span>
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

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{selectedPlayer.name}</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedPlayer.role}</p>
            </div>
          </div>

          {/* Index Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-4">
              <span className="text-[8px] font-black text-zinc-500 tracking-widest block uppercase mb-1">PRACTICE PPI</span>
              <span className="text-2xl font-black text-white tracking-tight">
                {selectedPlayer.ppiScore && selectedPlayer.ppiScore > 0 ? selectedPlayer.ppiScore.toFixed(1) : "N/A"}
              </span>
            </div>
            <div className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-4">
              <span className="text-[8px] font-black text-zinc-500 tracking-widest block uppercase mb-1">MATCH MPI</span>
              <span className="text-2xl font-black text-white tracking-tight">
                {selectedPlayer.mpiScore && selectedPlayer.mpiScore > 0 ? selectedPlayer.mpiScore.toFixed(1) : "N/A"}
              </span>
            </div>
            <div className="bg-orange-500 border border-orange-400 rounded-2xl p-4 text-black">
              <span className="text-[8px] font-black text-black/60 tracking-widest block uppercase mb-1">TOTAL CPI</span>
              <span className="text-2xl font-black text-black tracking-tight">
                {selectedPlayer.ppiScore && selectedPlayer.mpiScore && selectedPlayer.ppiScore > 0 && selectedPlayer.mpiScore > 0
                  ? ((selectedPlayer.ppiScore + selectedPlayer.mpiScore) / 2).toFixed(1)
                  : selectedPlayer.ppiScore && selectedPlayer.ppiScore > 0
                    ? selectedPlayer.ppiScore.toFixed(1)
                    : selectedPlayer.mpiScore && selectedPlayer.mpiScore > 0
                      ? selectedPlayer.mpiScore.toFixed(1)
                      : "N/A"}
              </span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="space-y-4 pt-4">
            
            {role !== "player" ? (
              <>
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
                    setShowPracticeOverlay(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer"
                >
                  <Clipboard className="w-6 h-6 stroke-[3]" />
                  PRACTICE ASSESSMENT
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
                    setShowMatchOverlay(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-6 h-6 stroke-[3]" />
                  MATCH ASSESSMENT
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSelfForm({
                    sleep: 7,
                    nutrition: 7,
                    preparation: 7,
                    health: 7,
                    mental: 7
                  });
                  setShowSelfOverlay(true);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black rounded-2xl py-5 text-xl font-extrabold flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400 shadow-md cursor-pointer"
              >
                <Clipboard className="w-6 h-6 stroke-[3]" />
                SELF ASSESSMENT
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowHistoryOverlay(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-5 text-lg font-black flex items-center justify-center gap-2.5 transition-all border-2 border-zinc-800 cursor-pointer"
              >
                <ListCollapse className="w-5 h-5" />
                HISTORY
              </button>
              <button
                onClick={() => setShowRecsOverlay(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl py-5 text-lg font-black flex items-center justify-center gap-2.5 transition-all border-2 border-zinc-800 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-orange-500" />
                ADVICE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ OVERLAY: PRACTICE ASSESSMENT ------------------ */}
      {showPracticeOverlay && selectedPlayer && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-6 space-y-6 text-left select-none pb-10">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-wider text-white">PRACTICE GRADES</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowPracticeOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

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
                    <label className="text-sm font-black tracking-widest text-white uppercase">{metric.label}</label>
                    <p className="text-[10px] text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(practiceForm as any)[metric.key]}/10</span>
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
              <label className="text-xs font-black tracking-widest text-zinc-400">NOTES</label>
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
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-black transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
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
              <h3 className="text-xl font-black uppercase tracking-wider text-white">MATCH GRADES</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowMatchOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

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
                    <label className="text-sm font-black tracking-widest text-white uppercase">{metric.label}</label>
                    <p className="text-[10px] text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(matchForm as any)[metric.key]}/10</span>
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
              <label className="text-xs font-black tracking-widest text-zinc-400">NOTES</label>
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
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-black transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
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
              <h3 className="text-xl font-black uppercase tracking-wider text-white">MY SELF GRADES</h3>
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
              { label: "MENTAL READINESS", key: "mental", desc: "Confidence and cognitive calmness" }
            ].map((metric) => (
              <div key={metric.key} className="space-y-2 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-black tracking-widest text-white uppercase">{metric.label}</label>
                    <p className="text-[10px] text-zinc-500 font-semibold">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{(selfForm as any)[metric.key]}/10</span>
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
              className="w-full bg-white hover:bg-zinc-200 text-black rounded-xl py-4.5 text-xl font-black transition-all flex items-center justify-center cursor-pointer border-2 border-white shadow-xl active:scale-98"
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
              <h3 className="text-xl font-black uppercase tracking-wider text-white">PLAYER LOGS</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowHistoryOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* CPI Trend */}
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black tracking-widest text-orange-500 uppercase">CPI RECENT TREND</h4>
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
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{s.type}</span>
                      <span className="text-base font-black text-white mt-1">{(s.score || 0).toFixed(1)}</span>
                      <span className="text-[7px] font-semibold text-zinc-400 mt-0.5">{s.date.split("-").slice(1).join("/")}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Practice History timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-widest text-zinc-500 uppercase">PRACTICE ASSESSMENTS</h4>
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
                    <span className="text-lg font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                      PPI {h.ppiScore ? h.ppiScore.toFixed(1) : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match History timeline */}
          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h4 className="text-xs font-black tracking-widest text-zinc-500 uppercase">MATCH ASSESSMENTS</h4>
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
                    <span className="text-lg font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
                      MPI {h.mpiScore ? h.mpiScore.toFixed(1) : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Self History timeline */}
          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <h4 className="text-xs font-black tracking-widest text-zinc-500 uppercase">SELF ASSESSMENTS</h4>
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
                      <span className="text-base font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-xl">
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
              <h3 className="text-xl font-black uppercase tracking-wider text-white">COACH ADVICE</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{selectedPlayer.name}</p>
            </div>
            <button onClick={() => setShowRecsOverlay(false)} className="text-zinc-500 hover:text-white p-1">
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="space-y-4">
            {getRecommendations().map((rec, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-2">
                <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase block">
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

    </div>
  );
}
