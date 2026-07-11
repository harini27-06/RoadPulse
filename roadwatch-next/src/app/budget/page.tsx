"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, IndianRupee, Route, Calendar, TrendingUp, ChevronDown, ChevronUp, Loader2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RoadBudget {
  id: string; name: string; code: string; type: string; lengthKm: number;
  estimatedAmount: number; budget2020: number; workValue: number;
  lastMaintenanceDate: string; tenderId: string;
}

interface DistrictData {
  district: string; roadCount: number; totalLengthKm: number;
  totalEstimated: number; totalBudget: number; totalWorkValue: number;
  totalAccidents: number; totalDeaths: number; roads: RoadBudget[];
}

const typeColor: Record<string, string> = {
  MDR: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  NH:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  SH:  "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
};

function fmt(n: number) { return n > 0 ? `₹${n.toFixed(2)} Cr` : "—"; }

export default function BudgetPage() {
  const [data, setData] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtSearch, setDistrictSearch] = useState("");
  const [roadSearch, setRoadSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [expandedRoad, setExpandedRoad] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/budget").then((r) => r.json()).then((d) => { setData(d.districts); setLoading(false); });
  }, []);

  const filteredDistricts = useMemo(() =>
    data.filter((d) => d.district.toLowerCase().includes(districtSearch.toLowerCase())),
    [data, districtSearch]
  );

  const filteredRoads = useMemo(() => {
    if (!selectedDistrict) return [];
    return selectedDistrict.roads.filter((r) =>
      r.name.toLowerCase().includes(roadSearch.toLowerCase()) ||
      r.code.toLowerCase().includes(roadSearch.toLowerCase())
    );
  }, [selectedDistrict, roadSearch]);

  const totalSpend = data.reduce((s, d) => s + d.totalEstimated, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      <p className="text-sm">Loading budget data...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold">
          <IndianRupee className="h-3.5 w-3.5" />
          Public Spending
        </div>
        <h1 className="text-3xl font-black tracking-tight">Road Budget Tracker</h1>
        <p className="text-muted-foreground text-sm">Real-time highway budget allocations and fiscal telemetry across Tamil Nadu districts.</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Districts", value: data.length, icon: "📍", color: "text-blue-500", border: "border-blue-500/20", bg: "from-blue-500/10 to-blue-500/5" },
          { label: "Total Roads", value: data.reduce((s, d) => s + d.roadCount, 0).toLocaleString(), icon: "🛣️", color: "text-emerald-500", border: "border-emerald-500/20", bg: "from-emerald-500/10 to-emerald-500/5" },
          { label: "Total Length", value: `${data.reduce((s, d) => s + d.totalLengthKm, 0).toFixed(0)} km`, icon: "📏", color: "text-cyan-500", border: "border-cyan-500/20", bg: "from-cyan-500/10 to-cyan-500/5" },
          { label: "Total Estimated", value: `₹${totalSpend.toFixed(0)} Cr`, icon: "💰", color: "text-indigo-500", border: "border-indigo-500/20", bg: "from-indigo-500/10 to-indigo-500/5" },
        ].map(({ label, value, icon, color, border, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-xl border ${border} bg-gradient-to-br ${bg} backdrop-blur-md p-5 space-y-2 transition-all duration-300`}>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{icon} {label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-muted-foreground">Select District</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blue-500/15 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-muted-foreground/50"
                placeholder="Search district..."
                value={districtSearch}
                onChange={(e) => { setDistrictSearch(e.target.value); setSelectedDistrict(null); }}
              />
            </div>
            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredDistricts.map((d) => (
                <button
                  key={d.district}
                  onClick={() => { setSelectedDistrict(d); setRoadSearch(""); setExpandedRoad(null); }}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-200 ${
                    selectedDistrict?.district === d.district
                      ? "border-blue-500/40 bg-blue-500/10 cyber-glow-blue"
                      : "border-blue-500/10 bg-white/30 dark:bg-slate-900/30 hover:border-blue-500/25 hover:bg-blue-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{d.district}</span>
                    <span className="text-[10px] text-muted-foreground">{d.roadCount} roads</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{fmt(d.totalEstimated)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Road details */}
        <div className="lg:col-span-2">
          {!selectedDistrict ? (
            <div className="glass-card flex flex-col items-center justify-center h-64 text-muted-foreground text-sm gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                <Route className="h-7 w-7 text-blue-500/40" />
              </div>
              <p className="text-xs text-muted-foreground">Select a district to view road budget details</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* District summary */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg">{selectedDistrict.district}</h2>
                    <p className="text-[10px] text-muted-foreground">District data loaded</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Roads", value: selectedDistrict.roadCount, color: "text-blue-500" },
                    { label: "Total Length", value: `${selectedDistrict.totalLengthKm.toFixed(1)} km`, color: "text-cyan-500" },
                    { label: "Estimated", value: fmt(selectedDistrict.totalEstimated), color: "text-indigo-500" },
                    { label: "Budget Alloc.", value: fmt(selectedDistrict.totalBudget), color: "text-emerald-500" },
                    { label: "Work Value", value: fmt(selectedDistrict.totalWorkValue), color: "text-amber-500" },
                    { label: "Accidents", value: selectedDistrict.totalAccidents || "—", color: "text-red-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-white/40 dark:bg-slate-900/40 border border-blue-500/10 px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
                      <p className={`font-black text-sm mt-0.5 ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Road search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blue-500/15 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-muted-foreground/50"
                  placeholder="Search roads in this district..."
                  value={roadSearch}
                  onChange={(e) => setRoadSearch(e.target.value)}
                />
              </div>

              {/* Roads list */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredRoads.map((road) => (
                  <div key={road.id} className="rounded-xl border border-blue-500/15 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md overflow-hidden hover:border-blue-500/30 transition-all">
                    <button
                      className="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-blue-500/5 transition-colors"
                      onClick={() => setExpandedRoad(expandedRoad === road.id ? null : road.id)}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm truncate">{road.name}</span>
                          {road.type && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold telemetry-font ${typeColor[road.type] ?? "bg-muted text-muted-foreground"}`}>
                              {road.type}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{road.code} · {road.lengthKm.toFixed(1)} km</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-sm font-black text-blue-500">{fmt(road.estimatedAmount)}</span>
                        {expandedRoad === road.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedRoad === road.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-blue-500/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { icon: <IndianRupee className="h-3 w-3" />, label: "Estimated", value: fmt(road.estimatedAmount), color: "text-indigo-500" },
                              { icon: <TrendingUp className="h-3 w-3" />, label: "Budget Alloc.", value: fmt(road.budget2020), color: "text-emerald-500" },
                              { icon: <IndianRupee className="h-3 w-3" />, label: "Work Value", value: fmt(road.workValue), color: "text-amber-500" },
                              { icon: <Calendar className="h-3 w-3" />, label: "Last Maintained", value: road.lastMaintenanceDate || "N/A", color: "text-cyan-500" },
                              { icon: <Route className="h-3 w-3" />, label: "Length", value: `${road.lengthKm.toFixed(2)} km`, color: "text-blue-500" },
                              { icon: null, label: "Tender ID", value: road.tenderId || "N/A", color: "text-muted-foreground" },
                            ].map(({ icon, label, value, color }) => (
                              <div key={label} className="rounded-lg bg-white/40 dark:bg-slate-900/40 border border-blue-500/10 px-3 py-2">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5 uppercase font-semibold">{icon}{label}</div>
                                <p className={`text-sm font-bold ${color}`}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {filteredRoads.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No roads match your search</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
