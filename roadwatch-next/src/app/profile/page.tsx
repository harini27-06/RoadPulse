"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Mail, FileText, CheckCircle2,
  Clock, LogOut, Loader2, ShieldCheck, Activity, MapPin, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Complaint } from "@/types";
import { formatDate, getStatusColor, getIssueIcon } from "@/lib/utils";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((data) => setComplaints(data as Complaint[]))
      .finally(() => setLoadingComplaints(false));
  }, [user]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-3.5rem)] gap-4">
      <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
    </div>
  );

  if (!user) return null;

  const stats = {
    total:      complaints.length,
    pending:    complaints.filter((c) => c.status === "Pending").length,
    resolved:   complaints.filter((c) => c.status === "Resolved").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-3.5rem)]">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl sm:text-3xl font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
              {user.role === "admin" ? (
                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-semibold">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold">
                  <User className="h-3 w-3" /> Citizen
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5 text-blue-500" /> {user.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5 text-emerald-500" /> ID: {user.id.slice(0, 12)}...
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2 border-red-500/20 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Filed", value: stats.total, icon: FileText, color: "text-blue-500", bg: "from-blue-500/10 to-blue-500/5", border: "border-blue-500/20" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/20" },
          { label: "In Progress", value: stats.inProgress, icon: Activity, color: "text-indigo-500", bg: "from-indigo-500/10 to-indigo-500/5", border: "border-indigo-500/20" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/20" },
        ].map(({ label, value, icon: Icon, color, bg, border }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className={`rounded-xl border ${border} bg-gradient-to-br ${bg} backdrop-blur-md p-5 transition-all duration-300`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent complaints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <h2 className="font-black text-lg">My Complaints</h2>
          </div>
          <Link href="/complaints">
            <motion.button whileHover={{ scale: 1.03 }} className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/5">
              View All →
            </motion.button>
          </Link>
        </div>

        {loadingComplaints ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-card text-center py-12">
            <p className="text-4xl mb-3">🛣️</p>
            <p className="font-black mb-1">No complaints filed yet</p>
            <p className="text-sm text-muted-foreground mb-4">Use the chatbot to report a road issue</p>
            <Link href="/chatbot">
              <motion.button whileHover={{ scale: 1.03 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
                Open Chatbot
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.slice(0, 5).map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card p-4 flex items-center gap-4 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/15 flex items-center justify-center text-xl shrink-0">
                  {getIssueIcon(c.issue_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{c.issue_type}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(c.status)}`}>{c.status}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{c.address ?? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Calendar className="h-3 w-3" />
                  {formatDate(c.created_at)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
