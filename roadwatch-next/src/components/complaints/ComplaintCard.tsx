"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Gauge, Trash2, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Complaint } from "@/types";
import { formatDate, formatConfidence, getStatusColor, getIssueIcon } from "@/lib/utils";
import { deleteComplaint } from "@/services/complaint.service";

interface ComplaintCardProps {
  complaint: Complaint;
  index: number;
  onDeleted: (id: string) => void;
}

function ComparisonModal({ complaint, onClose }: { complaint: Complaint; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="glass-card w-full max-w-2xl overflow-hidden hud-corners cyber-glow-blue"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-black text-sm">Work Completed — {complaint.issue_type}</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-slate-900/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-0 divide-x divide-blue-500/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-center py-2.5 bg-red-500/5 text-red-500 uppercase tracking-widest telemetry-font border-b border-blue-500/10">BEFORE</span>
              {complaint.image_url ? (
                <img src={complaint.image_url} alt="Before" className="w-full h-56 object-cover" />
              ) : (
                <div className="w-full h-56 bg-muted flex items-center justify-center text-4xl">{getIssueIcon(complaint.issue_type)}</div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-center py-2.5 bg-emerald-500/5 text-emerald-500 uppercase tracking-widest telemetry-font border-b border-blue-500/10">AFTER</span>
              <img src={complaint.resolved_image_url!} alt="After" className="w-full h-56 object-cover" />
            </div>
          </div>

          <div className="px-5 py-3 border-t border-blue-500/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground telemetry-font">
              📍 {complaint.address ?? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
            </span>
            <span className="text-xs text-emerald-500 font-bold telemetry-font">✓ ISSUE_RESOLVED</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const statusGradient: Record<string, string> = {
  Pending: "from-amber-500/10 to-amber-500/5 border-amber-500/25 text-amber-600 dark:text-amber-400",
  "In Progress": "from-blue-500/10 to-blue-500/5 border-blue-500/25 text-blue-600 dark:text-blue-400",
  Resolved: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
  Returned: "from-red-500/10 to-red-500/5 border-red-500/25 text-red-600 dark:text-red-400",
};

export function ComplaintCard({ complaint, index, onDeleted }: ComplaintCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this complaint? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteComplaint(complaint.id);
      onDeleted(complaint.id);
    } catch {
      alert("Failed to delete complaint.");
      setDeleting(false);
    }
  };

  const statusStyle = statusGradient[complaint.status] ?? statusGradient["Pending"];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -3 }}
        className="group"
      >
        <div className="rounded-2xl border border-blue-500/15 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md overflow-hidden hover:border-blue-500/35 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hud-corners">
          {/* Image */}
          {complaint.image_url ? (
            <div className="relative h-44 w-full bg-muted border-b border-blue-500/10 overflow-hidden">
              <img src={complaint.image_url} alt={complaint.issue_type} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded-lg font-black border bg-gradient-to-br ${statusStyle} backdrop-blur-sm`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 flex items-center justify-center border-b border-blue-500/10 relative">
              <span className="text-4xl">{getIssueIcon(complaint.issue_type)}</span>
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded-lg font-black border bg-gradient-to-br ${statusStyle}`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-black text-sm">{complaint.issue_type}</h3>
                <span className="text-[10px] font-black telemetry-font text-blue-500 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                  #{complaint.complaint_number ?? complaint.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 telemetry-font">
                <Gauge className="h-3 w-3" />
                <span>{formatConfidence(complaint.confidence)} confidence</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
              <span className="line-clamp-2">
                {complaint.address ?? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
              </span>
            </div>

            {complaint.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{complaint.description}</p>
            )}

            {complaint.status === "Returned" && complaint.returned_message && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-wide telemetry-font flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> RETURNED_BY_ADMIN
                </p>
                <p className="text-xs text-foreground">{complaint.returned_message}</p>
              </div>
            )}

            {complaint.status === "Resolved" && complaint.resolved_image_url && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors telemetry-font"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> VIEW_COMPLETED_WORK
              </button>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-blue-500/10">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground telemetry-font">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(complaint.created_at)}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete complaint"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {showModal && <ComparisonModal complaint={complaint} onClose={() => setShowModal(false)} />}
    </>
  );
}
