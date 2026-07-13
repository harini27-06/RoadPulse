"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { BarChart2, TrendingUp, AlertTriangle, Route, Loader2, IndianRupee, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface DistrictData {
  district: string;
  roadCount: number;
  totalLengthKm: number;
  totalEstimated: number;
  totalBudget: number;
  totalWorkValue: number;
  totalAccidents: number;
  totalDeaths: number;
}

type ChartTab = "budget" | "roads" | "accidents" | "deaths";

const TABS: { key: ChartTab; label: string; icon: React.ReactNode; color: string; glow: string }[] = [
  { key: "budget",    label: "Budget Spend",  icon: <IndianRupee className="h-3.5 w-3.5" />,  color: "#6366f1", glow: "shadow-indigo-500/20" },
  { key: "roads",     label: "Road Count",    icon: <Route className="h-3.5 w-3.5" />,         color: "#22c55e", glow: "shadow-emerald-500/20" },
  { key: "accidents", label: "Accidents",     icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "#f59e0b", glow: "shadow-amber-500/20" },
  { key: "deaths",    label: "Deaths",        icon: <TrendingUp className="h-3.5 w-3.5" />,    color: "#ef4444", glow: "shadow-red-500/20" },
];

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-blue-500/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl px-4 py-3 text-sm">
      <p className="font-bold mb-1 text-foreground">{label}</p>
      <p style={{ color: payload[0].fill }} className="font-semibold">{unit}{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ChartTab>("budget");
  const [topN, setTopN] = useState(10);

  useEffect(() => {
    fetch("/api/budget").then((r) => r.json()).then((d) => { setData(d.districts); setLoading(false); });
  }, []);

  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      if (activeTab === "budget")    return b.totalEstimated - a.totalEstimated;
      if (activeTab === "roads")     return b.roadCount - a.roadCount;
      if (activeTab === "accidents") return b.totalAccidents - a.totalAccidents;
      return b.totalDeaths - a.totalDeaths;
    }).slice(0, topN);
    return sorted.map((d) => ({
      name: d.district.length > 12 ? d.district.slice(0, 12) + "…" : d.district,
      fullName: d.district,
      value: activeTab === "budget" ? parseFloat(d.totalEstimated.toFixed(1)) : activeTab === "roads" ? d.roadCount : activeTab === "accidents" ? d.totalAccidents : d.totalDeaths,
    }));
  }, [data, activeTab, topN]);

  const activeConfig = TABS.find((t) => t.key === activeTab)!;
  const unit = activeTab === "budget" ? "₹" : "";
  const valueSuffix = activeTab === "budget" ? " Cr" : "";

  const statCards = [
    { label: "Districts", value: data.length, icon: "📍", color: "text-blue-500", bg: "from-blue-500/10 to-blue-500/5", border: "border-blue-500/20" },
    { label: "Total Roads", value: data.reduce((s, d) => s + d.roadCount, 0).toLocaleString(), icon: "🛣️", color: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/20" },
    { label: "Total Budget", value: `₹${data.reduce((s, d) => s + d.totalEstimated, 0).toFixed(0)} Cr`, icon: "💰", color: "text-indigo-500", bg: "from-indigo-500/10 to-indigo-500/5", border: "border-indigo-500/20" },
    { label: "Total Accidents", value: data.reduce((s, d) => s + d.totalAccidents, 0).toLocaleString(), icon: "⚠️", color: "text-amber-500", bg: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/20" },
    { label: "Total Deaths", value: data.reduce((s, d) => s + d.totalDeaths, 0).toLocaleString(), icon: "🔴", color: "text-red-500", bg: "from-red-500/10 to-red-500/5", border: "border-red-500/20" },
    { label: "Total Length", value: `${data.reduce((s, d) => s + d.totalLengthKm, 0).toFixed(0)} km`, icon: "📏", color: "text-cyan-500", bg: "from-cyan-500/10 to-cyan-500/5", border: "border-cyan-500/20" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      <p className="text-sm">Loading analytics...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl space-y-8 min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold">
          <Activity className="h-3.5 w-3.5" />
          Infrastructure Analytics
        </div>
        <h1 className="text-3xl font-black tracking-tight">Road & Accident Analytics</h1>
        <p className="text-muted-foreground text-sm">Dynamic visual metrics covering Tamil Nadu highway spending, asset distribution, and safety logs.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-xl border ${border} bg-gradient-to-br ${bg} backdrop-blur-md p-4 space-y-2 transition-all duration-300`}
          >
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{icon} {label}</p>
            <p className={`text-xl font-black ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <BarChart2 className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-sm">District Comparison</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20`
                    : "bg-white/50 dark:bg-slate-900/50 border border-blue-500/15 text-muted-foreground hover:text-foreground hover:border-blue-500/30"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="text-xs border border-blue-500/20 rounded-lg px-3 py-2 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold"
          >
            {[5, 10, 15, 20, 38].map((n) => <option key={n} value={n}>Top {n === 38 ? "All" : n}</option>)}
          </select>
        </div>

        <h3 className="font-semibold text-sm text-muted-foreground">Top {topN} Districts by {activeConfig.label}</h3>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[400px] px-4 sm:px-0">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `${unit}${v}${valueSuffix}`} />
                <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((_, i) => <Cell key={i} fill={activeConfig.color} opacity={1 - (i / chartData.length) * 0.4} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Budget vs Work Value */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <IndianRupee className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-sm">Budget Allocation vs Work Value</span>
        </div>
        <h3 className="font-bold text-sm">Budget Allocation vs Work Value — Top 10 Districts</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[400px] px-4 sm:px-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[...data].sort((a, b) => b.totalEstimated - a.totalEstimated).slice(0, 10).map((d) => ({
                  name: d.district.length > 10 ? d.district.slice(0, 10) + "…" : d.district,
                  "Estimated (Cr)": parseFloat(d.totalEstimated.toFixed(1)),
                  "Work Value (Cr)": parseFloat(d.totalWorkValue.toFixed(1)),
                  "Budget Alloc. (Cr)": parseFloat(d.totalBudget.toFixed(1)),
                }))
                }
                margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                <Bar dataKey="Estimated (Cr)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Budget Alloc. (Cr)" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Work Value (Cr)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Accidents vs Deaths */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-sm">Accident & Fatality Data</span>
        </div>
        <h3 className="font-bold text-sm">Accidents vs Deaths by District</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[400px] px-4 sm:px-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[...data].filter((d) => d.totalAccidents > 0).sort((a, b) => b.totalAccidents - a.totalAccidents).map((d) => ({
                  name: d.district.length > 10 ? d.district.slice(0, 10) + "…" : d.district,
                  Accidents: d.totalAccidents,
                  Deaths: d.totalDeaths,
                }))}
                margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                <Bar dataKey="Accidents" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Deaths" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* District table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <span className="font-semibold text-sm">District Summary</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-500/10 bg-blue-500/5">
                {["District", "Roads", "Length (km)", "Estimated (Cr)", "Budget (Cr)", "Work Value (Cr)", "Accidents", "Deaths"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].sort((a, b) => b.totalEstimated - a.totalEstimated).map((d, i) => (
                <tr key={d.district} className={`border-b border-blue-500/5 last:border-0 hover:bg-blue-500/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/20 dark:bg-white/[0.02]"}`}>
                  <td className="px-4 py-2.5 font-bold text-sm">{d.district}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.roadCount}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.totalLengthKm.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-indigo-500 font-bold">{d.totalEstimated > 0 ? d.totalEstimated.toFixed(2) : "—"}</td>
                  <td className="px-4 py-2.5 text-emerald-500 font-bold">{d.totalBudget > 0 ? d.totalBudget.toFixed(2) : "—"}</td>
                  <td className="px-4 py-2.5 text-amber-500 font-bold">{d.totalWorkValue > 0 ? d.totalWorkValue.toFixed(2) : "—"}</td>
                  <td className="px-4 py-2.5 text-amber-600">{d.totalAccidents || "—"}</td>
                  <td className="px-4 py-2.5 text-red-500">{d.totalDeaths || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
