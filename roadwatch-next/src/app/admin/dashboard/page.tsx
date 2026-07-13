"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, LogOut, Clock, CheckCircle2, AlertCircle,
  XCircle, ListTodo, Trash2, MapPin, Calendar,
  Loader2, Map, UserCheck, AlertTriangle, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Complaint } from "@/types";
import { formatDate, formatConfidence, getIssueIcon, cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/NotificationBell";

const STATUSES = ["Pending", "In Progress", "Resolved", "Waitlisted", "Returned"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<Status, string> = {
  "Pending":     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Resolved":    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Waitlisted":  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Returned":    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface Stats {
  total: number; pending: number; inProgress: number;
  resolved: number; returned: number; waitlisted: number;
}

interface EngineerUser {
  id: string; name: string; email: string; district: string | null;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-blue-500/15 bg-card/60 dark:bg-slate-950/60 backdrop-blur-md">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border border-blue-500/10 shrink-0", color)}>{icon}</div>
        <div>
          <p className="text-xl font-black text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "All">("All");
  const [engineers, setEngineers] = useState<EngineerUser[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (c: Complaint) => {
    setDownloading(c.id);
    const { downloadComplaintReport } = await import("@/lib/reportGenerator");
    await downloadComplaintReport(c);
    setDownloading(null);
  };

  const fetchData = async () => {
    const res = await fetch("/api/admin/complaints");
    const data = await res.json() as { complaints: Complaint[]; stats: Stats };
    setComplaints(data.complaints.map((c) => ({ ...c, created_at: new Date(c.created_at).toISOString() })));
    setStats(data.stats);
    setLoading(false);
  };

  const fetchEngineers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: EngineerUser[] | { error: string }) => {
        if (Array.isArray(data)) setEngineers(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then((u: { role?: string }) => {
      if (u?.role !== "admin") { window.location.href = "/login"; return; }
      fetchData(); fetchEngineers();
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this complaint permanently?")) return;
    await fetch(`/api/admin/complaints/${id}`, { method: "DELETE" });
    const updated = complaints.filter((c) => c.id !== id);
    setComplaints(updated);
    setStats((prev) => prev ? { ...prev, total: updated.length } : prev);
  };

  const filtered = filter === "All" ? complaints : complaints.filter((c) => c.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-blue-500/20">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <LayoutDashboard className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="hidden sm:inline">Admin Dashboard</span>
            <span className="sm:hidden">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/map")} className="gap-1.5 text-xs">
              <Map className="h-4 w-4" /> <span className="hidden sm:inline">View Map</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-xs text-muted-foreground">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total"      value={stats.total}      icon={<ListTodo className="h-5 w-5 text-primary" />}         color="bg-primary/10" />
            <StatCard label="Pending"    value={stats.pending}    icon={<Clock className="h-5 w-5 text-yellow-600" />}         color="bg-yellow-100 dark:bg-yellow-900/30" />
            <StatCard label="In Progress" value={stats.inProgress} icon={<ListTodo className="h-5 w-5 text-blue-600" />}       color="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard label="Resolved"   value={stats.resolved}   icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}   color="bg-green-100 dark:bg-green-900/30" />
            <StatCard label="Waitlisted" value={stats.waitlisted} icon={<AlertCircle className="h-5 w-5 text-purple-600" />}   color="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard label="Returned"   value={stats.returned}   icon={<XCircle className="h-5 w-5 text-red-600" />}          color="bg-red-100 dark:bg-red-900/30" />
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {(["All", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border text-muted-foreground")}>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground"><p className="text-4xl mb-3">📋</p><p>No complaints found.</p></div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              <AnimatePresence>
                {paginated.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getIssueIcon(c.issue_type)}</span>
                        <div>
                          <p className="font-semibold text-sm">{c.issue_type}</p>
                          <p className="text-xs text-muted-foreground">{formatConfidence(c.confidence)}</p>
                        </div>
                      </div>
                      <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold", STATUS_STYLES[c.status as Status] ?? "bg-gray-100 text-gray-700")}>{c.status}</span>
                    </div>
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{c.address ?? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</span>
                    </div>
                    {c.status === "Returned" && c.returned_message && (
                      <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-2.5 py-2">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-1 mb-0.5"><AlertTriangle className="h-3 w-3" /> Return Reason</p>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{c.returned_message}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />{formatDate(c.created_at)}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {c.image_url && <a href={c.image_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Image</a>}
                        <button onClick={() => router.push(`/admin/assign/${c.id}`)}
                          className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border",
                            c.assigned_engineer ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200" : "bg-muted text-muted-foreground border-border")}>
                          <UserCheck className="h-3 w-3" />
                          <span className="max-w-[80px] truncate">{c.assigned_engineer ?? "Assign"}</span>
                        </button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600" onClick={() => handleDownload(c)} disabled={downloading === c.id}>
                          {downloading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Issue</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date Filed</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assign Engineer</th>
                      <th className="px-4 py-3" />
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginated.map((c) => (
                        <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getIssueIcon(c.issue_type)}</span>
                              <div>
                                <p className="font-medium">{c.issue_type}</p>
                                <p className="text-xs text-muted-foreground">{formatConfidence(c.confidence)}</p>
                                {c.image_url && <a href={c.image_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View image</a>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[180px]">
                            <div className="flex items-start gap-1 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2 text-xs">{c.address ?? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_STYLES[c.status as Status] ?? "bg-gray-100 text-gray-700")}>{c.status}</span>
                            {c.status === "Returned" && c.returned_message && (
                              <div className="mt-1.5 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-2.5 py-2 max-w-[200px]">
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-1 mb-0.5"><AlertTriangle className="h-3 w-3" /> Return Reason</p>
                                <p className="text-xs text-foreground whitespace-pre-wrap">{c.returned_message}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" />{formatDate(c.created_at)}</div>
                          </td>
                          <td className="px-4 py-3 min-w-[180px]">
                            <button onClick={() => router.push(`/admin/assign/${c.id}`)}
                              className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
                                c.assigned_engineer ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200" : "bg-muted text-muted-foreground border-border hover:bg-muted/80")}>
                              <UserCheck className="h-3 w-3" />
                              <span className="max-w-[140px] truncate">{c.assigned_engineer ?? "Assign Engineer"}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10" onClick={() => handleDownload(c)} disabled={downloading === c.id} title="Download PDF">
                              {downloading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(p)}>{p}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
