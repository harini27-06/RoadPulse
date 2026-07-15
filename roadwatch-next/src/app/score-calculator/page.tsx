"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, RotateCcw, Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface FormState {
  potholes: number;
  crackSeverity: "Low" | "Medium" | "High";
  waterlogging: "Yes" | "No";
  lastMaintenance: "<6" | "6-12" | ">12";
  complaints: number;
}

interface RoadResult {
  road_id: string;
  road_name: string;
  road_code: string | null;
  district: string;
  road_type: string | null;
  last_maintenance_date: string | null;
  score_data: {
    potholes: number;
    crackSeverity: "Low" | "Medium" | "High";
    waterlogging: "Yes" | "No";
    lastMaintenance: "<6" | "6-12" | ">12";
    complaints: number;
  };
}

interface ScoreResult {
  score: number;
  label: string;
  color: string;
  ring: string;
  recommendation: string;
}

// ── Scoring formula ────────────────────────────────────────────────────────
function calculateScore(f: FormState): number {
  let score = 100;
  score -= (f.potholes / 20) * 30;
  score -= ({ Low: 5, Medium: 12, High: 20 })[f.crackSeverity];
  if (f.waterlogging === "Yes") score -= 15;
  score -= ({ "<6": 0, "6-12": 10, ">12": 20 })[f.lastMaintenance];
  score -= (f.complaints / 100) * 15;
  return Math.max(0, Math.round(score));
}

function getResult(score: number): ScoreResult {
  if (score >= 80) return {
    score, label: "Excellent", color: "text-emerald-500", ring: "#10b981",
    recommendation: "Road is in excellent condition. Continue routine monitoring.",
  };
  if (score >= 60) return {
    score, label: "Good", color: "text-yellow-500", ring: "#eab308",
    recommendation: "Preventive maintenance recommended to avoid deterioration.",
  };
  if (score >= 40) return {
    score, label: "Needs Maintenance", color: "text-orange-500", ring: "#f97316",
    recommendation: "Schedule maintenance soon. Defects are affecting road quality.",
  };
  return {
    score, label: "Critical", color: "text-red-500", ring: "#ef4444",
    recommendation: "Immediate repair required. Road poses safety risk to commuters.",
  };
}

// ── Circular SVG progress ──────────────────────────────────────────────────
function CircularScore({ result }: { result: ScoreResult }) {
  const r = 72;
  const circ = 2 * Math.PI * r;
  const offset = circ - (result.score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="absolute inset-0 -rotate-90" width="192" height="192" viewBox="0 0 192 192">
        <circle cx="96" cy="96" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
        <motion.circle
          cx="96" cy="96" r={r} fill="none" stroke={result.ring} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <motion.div className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}>
        <span className={cn("text-5xl font-black tabular-nums", result.color)}>{result.score}</span>
        <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">/ 100</span>
      </motion.div>
    </div>
  );
}

// ── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT: FormState = {
  potholes: 0, crackSeverity: "Low", waterlogging: "No",
  lastMaintenance: "<6", complaints: 0,
};

// ── Main page ──────────────────────────────────────────────────────────────
export default function ScoreCalculatorPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<RoadResult[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<RoadResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [form, setForm] = useState<FormState>(DEFAULT);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setResult(null);
  };

  // Search roads with debounce
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/roads?q=${encodeURIComponent(query)}&score=1`);
        const data = await res.json();
        if (Array.isArray(data)) { setSuggestions(data); setShowDropdown(true); }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 350);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectRoad = (road: RoadResult) => {
    setSelectedRoad(road);
    setQuery(road.road_name);
    setShowDropdown(false);
    setResult(null);
    // Autofill form from DB data
    setForm({
      potholes: road.score_data.potholes,
      crackSeverity: road.score_data.crackSeverity,
      waterlogging: road.score_data.waterlogging,
      lastMaintenance: road.score_data.lastMaintenance,
      complaints: road.score_data.complaints,
    });
  };

  const clearRoad = () => {
    setSelectedRoad(null);
    setQuery("");
    setSuggestions([]);
    setForm(DEFAULT);
    setResult(null);
  };

  const handleCalculate = () => setResult(getResult(calculateScore(form)));
  const handleReset = () => { clearRoad(); };

  const maintLabel = { "<6": "Less than 6 months", "6-12": "6–12 months", ">12": "More than 1 year" };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Road Health Tool
          </div>
          <h1 className="text-2xl font-black tracking-tight">RoadPulse Score Calculator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search a road to auto-fill data from the database, then calculate its health score
          </p>
        </motion.div>

        {/* Road Search */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card p-5">
          <label className="text-sm font-semibold mb-2 block">Search Road</label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedRoad(null); setResult(null); }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Type road name, e.g. Chennai Bypass..."
                className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
              />
              {query && (
                <button onClick={clearRoad} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
                >
                  {searching ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">Searching...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">No roads found</div>
                  ) : (
                    suggestions.map((road) => (
                      <button key={road.road_id} onClick={() => selectRoad(road)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/50 last:border-0">
                        <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{road.road_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[road.road_code, road.district, road.road_type].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected road badge */}
          {selectedRoad && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{selectedRoad.road_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Data auto-filled from database · {selectedRoad.district || "District N/A"}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                Auto-filled
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Form card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-5">

          {/* Potholes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">Number of Potholes</label>
              <span className="text-sm font-black text-blue-500 tabular-nums w-6 text-right">{form.potholes}</span>
            </div>
            <input type="range" min={0} max={20} step={1} value={form.potholes}
              onChange={(e) => set("potholes", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span><span>10</span><span>20</span>
            </div>
          </div>

          {/* Crack Severity */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Crack Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Low", "Medium", "High"] as const).map((v) => (
                <button key={v} onClick={() => set("crackSeverity", v)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-semibold border transition-all",
                    form.crackSeverity === v
                      ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                      : "border-border text-muted-foreground hover:border-blue-500/50 hover:text-foreground"
                  )}>{v}</button>
              ))}
            </div>
          </div>

          {/* Waterlogging */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Waterlogging Present</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Yes", "No"] as const).map((v) => (
                <button key={v} onClick={() => set("waterlogging", v)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-semibold border transition-all",
                    form.waterlogging === v
                      ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                      : "border-border text-muted-foreground hover:border-blue-500/50 hover:text-foreground"
                  )}>{v}</button>
              ))}
            </div>
          </div>

          {/* Last Maintenance */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Last Maintenance</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: "<6", label: "< 6 months" },
                { val: "6-12", label: "6–12 months" },
                { val: ">12", label: "> 1 year" },
              ] as const).map(({ val, label }) => (
                <button key={val} onClick={() => set("lastMaintenance", val)}
                  className={cn(
                    "py-2 px-1 rounded-lg text-xs font-semibold border transition-all leading-tight",
                    form.lastMaintenance === val
                      ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                      : "border-border text-muted-foreground hover:border-blue-500/50 hover:text-foreground"
                  )}>{label}</button>
              ))}
            </div>
          </div>

          {/* Citizen Complaints */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">Citizen Complaints</label>
              <span className="text-sm font-black text-blue-500 tabular-nums w-8 text-right">{form.complaints}</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={form.complaints}
              onChange={(e) => set("complaints", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button onClick={handleCalculate} className="flex-1 gap-2 font-bold">
              <Calculator className="h-4 w-4" /> Calculate Score
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </motion.div>

        {/* Result card */}
        <AnimatePresence>
          {result && (
            <motion.div key="result"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-8 flex flex-col items-center gap-5">

              {selectedRoad && (
                <p className="text-xs text-muted-foreground font-semibold">
                  {selectedRoad.road_name} · {selectedRoad.district}
                </p>
              )}

              <CircularScore result={result} />

              <div className="text-center space-y-1">
                <p className={cn("text-xl font-black", result.color)}>{result.label}</p>
                <p className="text-xs text-muted-foreground">RoadPulse Health Score</p>
              </div>

              <div className={cn(
                "w-full rounded-xl border px-5 py-4 text-sm font-medium text-center",
                result.score >= 80 && "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
                result.score >= 60 && result.score < 80 && "border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400",
                result.score >= 40 && result.score < 60 && "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-400",
                result.score < 40 && "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400",
              )}>
                💡 {result.recommendation}
              </div>

              {/* Score breakdown bar */}
              <div className="w-full space-y-1.5">
                <p className="text-xs text-muted-foreground font-semibold">Score Breakdown</p>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: result.ring }}
                    initial={{ width: 0 }} animate={{ width: `${result.score}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 — Critical</span><span>40 — Maintenance</span>
                  <span>60 — Good</span><span>80–100 — Excellent</span>
                </div>
              </div>

              {/* Input summary */}
              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: "Potholes", value: `${form.potholes}` },
                  { label: "Crack Severity", value: form.crackSeverity },
                  { label: "Waterlogging", value: form.waterlogging },
                  { label: "Last Maintenance", value: maintLabel[form.lastMaintenance] },
                  { label: "Complaints", value: `${form.complaints}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-xs font-bold">{value}</p>
                  </div>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
