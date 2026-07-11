"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, UserCheck, Loader2, CheckCircle2,
  Calendar, ImageOff, AlertTriangle, BadgeCheck, Building2,
  Shield, Sun, Moon, ClipboardList, Clock, X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Complaint } from "@/types";
import { formatDate, formatConfidence, getIssueIcon } from "@/lib/utils";
import { toast } from "sonner";

interface EngineerUser {
  district: string;
  executive_engineer: string;
}

const STATUS_STYLES: Record<string, string> = {
  "Pending":     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Resolved":    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Waitlisted":  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Returned":    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AssignEngineerPage() {
  const router = useRouter();
  const { complaintId } = useParams<{ complaintId: string }>();
  const { theme, setTheme } = useTheme();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [engineers, setEngineers] = useState<EngineerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Schedule state
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("17:00");
  const [repairNotes, setRepairNotes] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/complaints/${complaintId}`).then((r) => r.json()),
      fetch("/api/admin/engineers").then((r) => r.json()),
    ]).then(([c, e]) => {
      setComplaint(c);
      if (Array.isArray(e)) setEngineers(e);
      // Pre-fill if already scheduled
      if (c.scheduled_date) {
        const d = new Date(c.scheduled_date);
        setEndDate(d.toISOString().slice(0, 10));
        setEndTime(d.toTimeString().slice(0, 5));
      }
      if (c.repair_notes) setRepairNotes(c.repair_notes);
      setLoading(false);
    });
  }, [complaintId]);

  const removeAssignment = async () => {
    setRemoving(true);
    await fetch(`/api/admin/complaints/${complaintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_engineer: null, assigned_engineer_id: null }),
    });
    setComplaint((prev) => prev ? { ...prev, assigned_engineer: null, assigned_engineer_id: null } : prev);
    setRemoving(false);
  };

  const assign = async (engineer: EngineerUser) => {
    if (!endDate) {
      setScheduleError("Please set a scheduled end date before assigning.");
      return;
    }
    setScheduleError("");
    setAssigning(engineer.district);
    const endISO = `${endDate}T${endTime}:00`;
    await fetch(`/api/admin/complaints/${complaintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigned_engineer: engineer.executive_engineer,
        scheduled_date: endISO,
        repair_notes: repairNotes || null,
      }),
    });
    setAssigning(null);
    toast.success(`${engineer.executive_engineer} assigned successfully!`);
    router.push("/admin/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Complaint not found.
      </div>
    );
  }

  const addressParts = complaint.address
    ? complaint.address.split(",").map((p) => p.trim())
    : [];

  const addrUpper = complaint.address?.toUpperCase() ?? "";

  const complaintDistrict = (() => {
    const found = engineers.find(
      (e) => new RegExp(`\\b${e.district.trim().toUpperCase()}\\b`).test(addrUpper)
    );
    if (found) return found.district;
    if (addressParts.length >= 3) return addressParts[addressParts.length - 3];
    return null;
  })();

  const isAssigned = (engineerName: string) => {
    if (!complaint.assigned_engineer) return false;
    const a = complaint.assigned_engineer.trim().toLowerCase();
    const b = engineerName.trim().toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
  };

  const matched = engineers.filter((e) =>
    new RegExp(`\\b${e.district.trim().toUpperCase()}\\b`).test(addrUpper)
  );
  const others = engineers.filter((e) => !matched.find((m) => m.district === e.district));

  // Min date = today
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 font-bold text-lg">
              <Shield className="h-5 w-5 text-primary" />
              <span>RoadWatch</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <span className="text-muted-foreground/40">/</span>
              <span className="text-sm font-medium text-foreground">Assign Engineer</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — Complaint card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
              {complaint.image_url && !imgError ? (
                <div className="relative">
                  <img
                    src={complaint.image_url}
                    alt={complaint.issue_type}
                    className="w-full h-56 object-cover"
                    onError={() => setImgError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-2xl">{getIssueIcon(complaint.issue_type)}</span>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{complaint.issue_type}</p>
                      <p className="text-white/70 text-xs">{formatConfidence(complaint.confidence)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="h-8 w-8 opacity-40" />
                  <span className="text-xs">No image available</span>
                </div>
              )}

              <div className="p-4 space-y-3">
                {!complaint.image_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getIssueIcon(complaint.issue_type)}</span>
                    <div>
                      <p className="font-bold">{complaint.issue_type}</p>
                      <p className="text-xs text-muted-foreground">{formatConfidence(complaint.confidence)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="leading-snug">
                    {complaint.address ?? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDate(complaint.created_at)}</span>
                </div>

                {complaintDistrict && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {complaintDistrict}
                    </span>
                    <span className="text-xs text-muted-foreground">district</span>
                  </div>
                )}

                {complaint.description && (
                  <p className="text-sm text-muted-foreground border-t pt-3 leading-relaxed">
                    {complaint.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                    STATUS_STYLES[complaint.status] ?? "bg-gray-100 text-gray-700"
                  )}>
                    {complaint.status}
                  </span>
                  {complaint.assigned_engineer && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {complaint.assigned_engineer}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Schedule + Engineers */}
          <div className="lg:col-span-3 space-y-5">

            {/* Schedule panel */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Schedule & Instructions</p>
                  <p className="text-xs text-muted-foreground">Set before assigning an engineer</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* End date + time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Scheduled Date & Time <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      min={today}
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setScheduleError(""); }}
                      className={cn(
                        "flex-1 text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
                        scheduleError && !endDate ? "border-destructive ring-1 ring-destructive" : "border-border"
                      )}
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-28 text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" /> Repair Instructions
                    <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="e.g. Fill pothole with cold mix, ensure drainage is cleared first..."
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                {scheduleError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {scheduleError}
                  </p>
                )}

                {/* Summary preview */}
                {endDate && (
                  <div className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-primary">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Scheduled: <span className="font-semibold">
                      {new Date(`${endDate}T${endTime}:00`).toLocaleString("en-IN", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span></span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Engineers */}
            {matched.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-semibold">District Match</p>
                  {complaintDistrict && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                      {complaintDistrict}
                    </span>
                  )}
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {matched.length}
                  </span>
                </div>
                {matched.map((e, i) => (
                  <EngineerCard
                    key={e.district}
                    engineer={e}
                    matched
                    current={isAssigned(e.executive_engineer)}
                    loading={assigning === e.district}
                    removing={removing}
                    index={i}
                    onAssign={() => assign(e)}
                    onRemove={removeAssignment}
                  />
                ))}
              </div>
            )}

            {others.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-muted-foreground">Other Engineers</p>
                </div>
                {others.map((e, i) => (
                  <EngineerCard
                    key={e.district}
                    engineer={e}
                    matched={false}
                    current={isAssigned(e.executive_engineer)}
                    loading={assigning === e.district}
                    removing={removing}
                    index={i}
                    onAssign={() => assign(e)}
                    onRemove={removeAssignment}
                  />
                ))}
              </div>
            )}

            {engineers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <UserCheck className="h-10 w-10 opacity-30" />
                <p className="text-sm">No engineers found in the accidents table.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EngineerCard({
  engineer, matched, current, loading, removing, index, onAssign, onRemove,
}: {
  engineer: EngineerUser;
  matched: boolean;
  current: boolean;
  loading: boolean;
  removing: boolean;
  index: number;
  onAssign: () => void;
  onRemove: () => void;
}) {
  const initials = engineer.executive_engineer
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md",
        matched && "border-green-300 dark:border-green-700/60",
        current && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
          matched ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-primary/10 text-primary"
        )}>
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm">{engineer.executive_engineer}</p>
            {current && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                Current
              </span>
            )}
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-medium mt-0.5",
            matched ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}>
            <MapPin className="h-3 w-3" />{engineer.district}
          </span>
        </div>
      </div>

      {current ? (
        <div className="flex items-center gap-2 ml-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700/50">
            <BadgeCheck className="h-3.5 w-3.5" /> Assigned
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            disabled={removing}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Remove assignment"
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={onAssign}
          disabled={loading}
          className="gap-1.5 ml-3 shrink-0"
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <UserCheck className="h-3.5 w-3.5" />
          }
          Assign
        </Button>
      )}
    </motion.div>
  );
}
