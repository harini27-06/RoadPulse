"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { FileText, AlertCircle, Loader2, LogIn, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { Complaint } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export default function ComplaintsPage() {
  const { user, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setComplaints(data) : setError(true))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleDeleted = (id: string) => setComplaints((prev) => prev.filter((c) => c.id !== id));

  const statuses = ["All", "Pending", "In Progress", "Resolved", "Returned"];
  const safe = Array.isArray(complaints) ? complaints : [];
  const filtered = filter === "All" ? safe : safe.filter(c => c.status === filter);

  const counts = {
    All: safe.length,
    Pending: safe.filter(c => c.status === "Pending").length,
    "In Progress": safe.filter(c => c.status === "In Progress").length,
    Resolved: safe.filter(c => c.status === "Resolved").length,
    Returned: safe.filter(c => c.status === "Returned").length,
  };

  const statusColors: Record<string, string> = {
    All: "from-blue-600 to-cyan-600",
    Pending: "from-amber-500 to-orange-500",
    "In Progress": "from-blue-500 to-indigo-500",
    Resolved: "from-emerald-500 to-green-500",
    Returned: "from-red-500 to-rose-500",
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-black mb-2">Access Restricted</h2>
          <p className="text-muted-foreground text-sm mb-6">Your complaints are private. Sign in to view them.</p>
          <Link href="/login?redirect=/complaints">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25">
              <LogIn className="h-4 w-4" /> Sign In
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <FileText className="h-3 w-3" />
            Complaint Registry
          </div>
          <h1 className="text-3xl font-black tracking-tight">My Complaints</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading..." : `${safe.length} complaint${safe.length !== 1 ? "s" : ""} filed`}
          </p>
        </div>
        <Link href="/chatbot">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> File New Complaint
          </motion.button>
        </Link>
      </motion.div>

      {/* Status filter tabs */}
      {!loading && !error && safe.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1 shrink-0">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </div>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                filter === s
                  ? `bg-gradient-to-r ${statusColors[s]} text-white shadow-md`
                  : "bg-white/50 dark:bg-slate-900/50 border border-blue-500/15 text-muted-foreground hover:text-foreground hover:border-blue-500/30"
              }`}
            >
              {s} <span className="opacity-70">({counts[s as keyof typeof counts]})</span>
            </button>
          ))}
        </motion.div>
      )}

      {(loading || authLoading) && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Loading your complaints...</p>
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load complaints. Please try again.</p>
        </motion.div>
      )}

      {!loading && !error && safe.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/15 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🛣️</span>
          </div>
          <h2 className="text-xl font-black mb-2">No Complaints Yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Use the chatbot to upload a road image and file your first complaint.</p>
          <Link href="/chatbot">
            <motion.button whileHover={{ scale: 1.03 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4" /> Open Chatbot
            </motion.button>
          </Link>
        </motion.div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((complaint, index) => (
            <ComplaintCard key={complaint.id} complaint={complaint} index={index} onDeleted={handleDeleted} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
