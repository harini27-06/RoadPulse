"use client";

import React, { useState, Suspense } from "react";
import { Map, Brain, BarChart3, Clock } from "lucide-react";
import RiskBreakdown from "@/components/risk/RiskBreakdown";
import RiskStatistics from "@/components/risk/RiskStatistics";
import RiskPredictorSearch from "@/components/risk/RiskPredictorSearch";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

interface RoadRisk {
  id: string; road_name: string; district: string; risk_percentage: number;
  urgency: string; confidence: number;
  breakdown: { image_analysis: number; accident_impact: number; complaint_impact: number; temporal_impact: number; };
  factors: Record<string, any>; complaint_count: number;
  latitude: number | null; longitude: number | null;
}

const RiskMap = dynamic(() => import("@/components/risk/RiskMap"), {
  ssr: false,
  loading: () => (
          <div className="w-full h-96 rounded-xl bg-blue-500/5 border border-blue-500/15 flex flex-col items-center justify-center gap-3">
      <Map className="h-5 w-5 text-blue-500/50 animate-pulse" />
      <p className="text-xs text-muted-foreground">Loading map...</p>
    </div>
  ),
});

const modelFactors = [
  { icon: "📸", label: "Image Analysis", weight: "40%", color: "text-blue-500", border: "border-blue-500/20", bg: "from-blue-500/10 to-blue-500/5", desc: "YOLOv11 model detects and classifies road defects from citizen image uploads." },
  { icon: "📊", label: "Statistical Analysis", weight: "40%", color: "text-emerald-500", border: "border-emerald-500/20", bg: "from-emerald-500/10 to-emerald-500/5", desc: "Historical accident severity, complaint patterns, and traffic densities computed per district." },
  { icon: "📈", label: "Temporal Trends", weight: "20%", color: "text-amber-500", border: "border-amber-500/20", bg: "from-amber-500/10 to-amber-500/5", desc: "Seasonality coefficients (monsoon impacts, heat indexes) and historical recency weighting." },
];

export default function RiskPredictorPage() {
  const [selectedRoad, setSelectedRoad] = useState<RoadRisk | null>(null);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                AI Risk Predictor
              </div>
              <h1 className="text-2xl font-black tracking-tight">Risk Predictor</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                YOLOv11 image analysis combined with accident and complaint data
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-blue-500/5 border border-blue-500/10 animate-pulse" />)}
          </div>
        }>
          <RiskStatistics />
        </Suspense>

        {/* Search */}
        <RiskPredictorSearch />

        {/* Map + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <Map className="w-4 h-4 text-blue-500" />
              <div>
                <h3 className="font-bold text-sm">Road Risk Map</h3>
                <p className="text-xs text-muted-foreground">Click a marker to inspect</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
            </div>
            <div className="p-4">
              <Suspense fallback={<div className="text-center py-8 text-sm text-muted-foreground">Loading map...</div>}>
                <RiskMap onRoadSelect={setSelectedRoad} />
              </Suspense>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
            {selectedRoad ? (
              <RiskBreakdown road={selectedRoad} onClose={() => setSelectedRoad(null)} />
            ) : (
              <div className="glass-card h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-4">
                  <Map className="w-8 h-8 text-blue-500/40" />
                </div>
                <p className="font-bold text-sm mb-1">No Road Selected</p>
                <p className="text-xs text-muted-foreground">Click on a road marker to view risk details</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Model Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Brain className="w-4 h-4 text-violet-500" />
            <div>
              <h3 className="font-bold text-sm">Model Algorithm Factors</h3>
              <p className="text-xs text-muted-foreground">Weighted scoring system</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {modelFactors.map(({ icon, label, weight, color, border, bg, desc }) => (
              <div key={label} className={`rounded-xl border ${border} bg-gradient-to-br ${bg} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{icon}</span>
                  <span className={`text-xs font-bold ${color}`}>{weight}</span>
                </div>
                <h4 className={`font-bold text-xs ${color}`}>{label}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
