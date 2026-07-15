"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, RotateCcw } from "lucide-react";
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

interface ScoreResult {
  score: number;
  label: string;
  color: string;
  ring: string;
  recommendation: string;
}

// ── Scoring formula ────────────────────────────────────────────────────────
// Each factor deducts from 100. Max deductions add up to 100.
function calculateScore(f: FormState): number {
  let score = 100;

  // Potholes (0–20) → max deduct 30
  score -= (f.potholes / 20) * 30;

  // Crack severity → max deduct 20
  const crackPenalty = { Low: 5, Medium: 12, High: 20 };
  score -= crackPenalty[f.crackSeverity];

  // Waterlogging → max deduct 15
  if (f.waterlogging === "Yes") score -= 15;

  // Last maintenance → max deduct 20
  const maintPenalty = { "<6": 0, "6-12": 10, ">12": 20 };
  score -= maintPenalty[f.lastMaintenance];

  // Complaints (0–100) → max deduct 15
  score -= (f.complaints / 100) * 15;

  return Math.max(0, Math.round(score));
}

function getResult(score: number): ScoreResult {
  if (score >= 80) return {
    score, label: "Excellent",
    color: "text-emerald-500", ring: "#10b981",
    recommendation: "Road is in excellent condition. Continue routine monitoring.",
  };
  if (score >= 60) return {
    score, label: "Good",
    color: "text-yellow-500", ring: "#eab308",
    recommendation: "Preventive maintenance recommended to avoid deterioration.",
  };
  if (score >= 40) return {
    score, label: "Needs Maintenance",
    color: "text-orange-500", ring: "#f97316",
    recommendation: "Schedule maintenance soon. Defects are affecting road quality.",
  };
  return {
    score, label: "Critical",
    color: "text-red-500", ring: "#ef4444",
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
        {/* Track */}
        <circle cx="96" cy="96" r={r} fill="none" stroke="currentColor"
          strokeWidth="10" className="text-muted/30" />
        {/* Progress */}
        <motion.circle
          cx="96" cy="96" r={r} fill="none"
          stroke={result.ring} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      {/* Score text */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <span className={cn("text-5xl font-black tabular-nums", result.color)}>
          {result.score}
        </span>
        <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">/ 100</span>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
const DEFAULT: FormState = {
  potholes: 0,
  crackSeverity: "Low",
  waterlogging: "No",
  lastMaintenance: "<6",
  complaints: 0,
};

export default function ScoreCalculatorPage() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [result, setResult] = useState<ScoreResult | null>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleCalculate = () => setResult(getResult(calculateScore(form)));
  const handleReset = () => { setForm(DEFAULT); setResult(null); };

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
            Enter road condition details to calculate a health score out of 100
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-5"
        >
          {/* Potholes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">Number of Potholes</label>
              <span className="text-sm font-black text-blue-500 tabular-nums w-6 text-right">{form.potholes}</span>
            </div>
            <input
              type="range" min={0} max={20} step={1}
              value={form.potholes}
              onChange={(e) => set("potholes", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
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
                  )}>
                  {v}
                </button>
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
                  )}>
                  {v}
                </button>
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
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen Complaints */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold">Citizen Complaints</label>
              <span className="text-sm font-black text-blue-500 tabular-nums w-8 text-right">{form.complaints}</span>
            </div>
            <input
              type="range" min={0} max={100} step={1}
              value={form.complaints}
              onChange={(e) => set("complaints", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button onClick={handleCalculate} className="flex-1 gap-2 font-bold">
              <Calculator className="h-4 w-4" /> Calculate Score
            </Button>
            {result && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            )}
          </div>
        </motion.div>

        {/* Result card */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-8 flex flex-col items-center gap-5"
            >
              {/* Circular score */}
              <CircularScore result={result} />

              {/* Label */}
              <div className="text-center space-y-1">
                <p className={cn("text-xl font-black", result.color)}>{result.label}</p>
                <p className="text-xs text-muted-foreground">RoadPulse Health Score</p>
              </div>

              {/* Recommendation */}
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
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: result.ring }}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 — Critical</span>
                  <span>40 — Maintenance</span>
                  <span>60 — Good</span>
                  <span>80–100 — Excellent</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
