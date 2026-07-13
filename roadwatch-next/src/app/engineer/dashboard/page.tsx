"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardHat, LogOut, Clock, CheckCircle2, AlertCircle, XCircle,
  ListTodo, MapPin, Calendar, ChevronDown, Loader2, Upload,
  ImageIcon, Pencil, Send, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Complaint } from "@/types";
import { formatDate, formatConfidence, getIssueIcon, cn } from "@/lib/utils";
import { toast } from "sonner";
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

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  "Pending":     <Clock className="h-4 w-4" />,
  "In Progress": <ListTodo className="h-4 w-4" />,
  "Resolved":    <CheckCircle2 className="h-4 w-4" />,
  "Waitlisted":  <AlertCircle className="h-4 w-4" />,
  "Returned":    <XCircle className="h-4 w-4" />,
};

interface Stats {
  total: number; pending: number; inProgress: number;
  resolved: number; returned: number; waitlisted: number;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", color)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDropdown({ current, onChange }: { current: string; onChange: (s: Status) => void }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[current as Status] ?? "bg-gray-100 text-gray-800";
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", style)}>
        {STATUS_ICONS[current as Status]}{current}<ChevronDown className="h-3 w-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 z-50 bg-card border rounded-lg shadow-lg overflow-hidden min-w-[150px]">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors", s === current && "bg-muted font-semibold")}>
                {STATUS_ICONS[s]}{s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReturnReasonCell({ complaint, onSave, onCancel, saving }: {
  complaint: Complaint;
  onSave: (msg: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(!complaint.returned_message);
  const [text, setText] = useState(complaint.returned_message ?? "");

  if (!editing) {
    return (
      <div className="mt-2 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-2.5 space-y-1.5">
        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Return Reason</p>
        <p className="text-xs text-foreground whitespace-pre-wrap">{text}</p>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
          <Pencil className="h-3 w-3" /> Edit reason
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-2.5 space-y-2">
      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
        Return Reason <span className="text-red-500">*</span>
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        className="w-full resize-none rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
        placeholder="Required — explain why this complaint is being returned..." autoFocus />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" className="h-7 text-xs"
          onClick={() => { if (complaint.returned_message) { setText(complaint.returned_message); setEditing(false); } else { onCancel(); } }}
          disabled={saving}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs gap-1"
          onClick={() => { onSave(text); setEditing(false); }}
          disabled={!text.trim() || saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          {complaint.returned_message ? "Update" : "Send"}
        </Button>
      </div>
    </div>
  );
}

function ResolvedImageUpload({ complaintId, current, onUploaded }: {
  complaintId: string; current?: string | null; onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const { image_url } = await fetch("/api/upload", { method: "POST", body: formData }).then(r => r.json()) as { image_url: string };
    await fetch(`/api/engineer/complaints/${complaintId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved_image_url: image_url }),
    });
    onUploaded(image_url);
    setUploading(false);
    e.target.value = "";
  };
  return (
    <div className="flex items-center gap-2 mt-1.5">
      {current && (
        <a href={current} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline font-medium">
          <ImageIcon className="h-3 w-3" />View proof
        </a>
      )}
      <label className={cn("flex items-center gap-1 text-xs cursor-pointer px-2 py-1 rounded border transition-colors select-none",
        uploading ? "opacity-50 pointer-events-none" : "hover:bg-muted text-muted-foreground")}>
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
        {current ? "Replace" : "Upload proof"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}

export default function EngineerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "All">("All");
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingReturn, setPendingReturn] = useState<Set<string>>(new Set());
  const [engineerName, setEngineerName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then((u: { name?: string; role?: string }) => {
      if (u?.role !== "engineer") { window.location.href = "/login"; return; }
      setEngineerName(u.name ?? "Engineer");
      const load = () =>
        fetch("/api/engineer/complaints")
          .then(r => r.json())
          .then((data: { complaints: Complaint[]; stats: Stats }) => {
            setComplaints(data.complaints.map((c) => ({ ...c, created_at: new Date(c.created_at).toISOString() })));
            setStats(data.stats);
            setLoading(false);
          });
      load();
      const interval = setInterval(load, 30_000);
      return () => clearInterval(interval);
    });
  }, []);

  const patch = async (id: string, body: object) => {
    await fetch(`/api/engineer/complaints/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const recalcStats = (list: Complaint[]): Stats => ({
    total:      list.length,
    pending:    list.filter((c) => c.status === "Pending").length,
    inProgress: list.filter((c) => c.status === "In Progress").length,
    resolved:   list.filter((c) => c.status === "Resolved").length,
    returned:   list.filter((c) => c.status === "Returned").length,
    waitlisted: list.filter((c) => c.status === "Waitlisted").length,
  });

  const handleStatusChange = async (id: string, status: Status) => {
    if (status === "Returned") {
      setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      setPendingReturn((prev) => new Set(prev).add(id));
      return;
    }
    setUpdating(id);
    await patch(id, { status });
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    setStats((prev) => prev ? recalcStats(complaints.map((c) => c.id === id ? { ...c, status } : c)) : prev);
    setUpdating(null);
  };

  const handleReturnSave = async (id: string, message: string) => {
    setUpdating(id);
    await patch(id, { status: "Returned", returned_message: message });
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status: "Returned", returned_message: message } : c));
    setStats((prev) => prev ? recalcStats(complaints.map((c) => c.id === id ? { ...c, status: "Returned" } : c)) : prev);
    setPendingReturn((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setUpdating(null);
  };

  const handleReturnCancel = (id: string) => {
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status: "Pending" } : c));
    setPendingReturn((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleResolvedImage = (id: string, url: string) => {
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, resolved_image_url: url } : c));
  };

  const filtered = filter === "All" ? complaints : complaints.filter((c) => c.status === filter);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("You have been logged out", { duration: 3000 });
    setTimeout(() => { window.location.href = "/"; }, 1500);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-blue-500/20">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground min-w-0">
            <HardHat className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="truncate">Engineer{engineerName ? ` — ${engineerName}` : ""}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* Info banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-3">
          <HardHat className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Your Assigned Complaints</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              These complaints have been assigned to you by the admin. Update the status, upload resolution proof, or return with a reason.
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total" value={stats.total} icon={<ListTodo className="h-5 w-5 text-primary" />} color="bg-primary/10" />
            <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5 text-yellow-600" />} color="bg-yellow-100 dark:bg-yellow-900/30" />
            <StatCard label="In Progress" value={stats.inProgress} icon={<ListTodo className="h-5 w-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-900/30" />
            <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
            <StatCard label="Waitlisted" value={stats.waitlisted} icon={<AlertCircle className="h-5 w-5 text-purple-600" />} color="bg-purple-100 dark:bg-purple-900/30" />
            <StatCard label="Returned" value={stats.returned} icon={<XCircle className="h-5 w-5 text-red-600" />} color="bg-red-100 dark:bg-red-900/30" />
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {(["All", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
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
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">🛠️</p>
            <p className="font-medium">No complaints assigned to you yet.</p>
            <p className="text-sm mt-1">The admin will assign complaints to you shortly.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              <AnimatePresence>
                {filtered.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getIssueIcon(c.issue_type)}</span>
                        <div>
                          <p className="font-semibold text-sm">{c.issue_type}</p>
                          <p className="text-xs text-muted-foreground">{formatConfidence(c.confidence)}</p>
                          {c.image_url && <a href={c.image_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View image</a>}
                        </div>
                      </div>
                      {updating === c.id
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                        : <StatusDropdown current={c.status} onChange={(s) => handleStatusChange(c.id, s)} />}
                    </div>
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{c.address ?? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</span>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    {c.scheduled_date && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(c.scheduled_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                    {(c.status === "Returned" || pendingReturn.has(c.id)) && (
                      <ReturnReasonCell complaint={c} saving={updating === c.id}
                        onSave={(msg) => handleReturnSave(c.id, msg)}
                        onCancel={() => handleReturnCancel(c.id)} />
                    )}
                    {c.status === "Resolved" && (
                      <ResolvedImageUpload complaintId={c.id} current={c.resolved_image_url}
                        onUploaded={(url) => handleResolvedImage(c.id, url)} />
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />{formatDate(c.created_at)}
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
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scheduled</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date Filed</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((c) => (
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
                          <td className="px-4 py-3 max-w-[160px]">
                            <p className="text-xs text-muted-foreground line-clamp-2">{c.description ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {c.scheduled_date ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(c.scheduled_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">Not scheduled</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" />{formatDate(c.created_at)}</div>
                          </td>
                          <td className="px-4 py-3 min-w-[240px]">
                            {updating === c.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                              <div className="flex flex-col gap-1">
                                <StatusDropdown current={c.status} onChange={(s) => handleStatusChange(c.id, s)} />
                                {(c.status === "Returned" || pendingReturn.has(c.id)) && (
                                  <ReturnReasonCell complaint={c} saving={updating === c.id}
                                    onSave={(msg) => handleReturnSave(c.id, msg)}
                                    onCancel={() => handleReturnCancel(c.id)} />
                                )}
                                {c.status === "Resolved" && (
                                  <ResolvedImageUpload complaintId={c.id} current={c.resolved_image_url}
                                    onUploaded={(url) => handleResolvedImage(c.id, url)} />
                                )}
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
