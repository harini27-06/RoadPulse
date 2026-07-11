"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Map, Loader2, ArrowLeft } from "lucide-react";
import { Complaint } from "@/types";
import { cn } from "@/lib/utils";

const ComplaintsMap = dynamic(
  () => import("@/components/admin/ComplaintsMap").then((m) => m.ComplaintsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const STATUSES = ["All", "Pending", "In Progress", "Resolved", "Waitlisted", "Returned"] as const;
type Filter = typeof STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  "Pending":     "bg-yellow-400",
  "In Progress": "bg-blue-500",
  "Resolved":    "bg-green-500",
  "Waitlisted":  "bg-purple-500",
  "Returned":  "bg-red-500",
};

export default function AdminMapPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/complaints")
      .then((r) => r.json())
      .then((data: { complaints: Complaint[] }) => {
        setComplaints(data.complaints);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "All" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-background z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2 font-semibold">
              <Map className="h-4 w-4 text-primary" />
              Complaints Map
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filtered.length} complaint${filtered.length !== 1 ? "s" : ""} shown`}
          </span>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2 flex items-center gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border text-muted-foreground"
            )}
          >
            {s !== "All" && (
              <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[s])} />
            )}
            {s}
            {s !== "All" && !loading && (
              <span className="opacity-60">
                ({complaints.filter((c) => c.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Map — fills remaining height */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <LayoutDashboard className="h-10 w-10 opacity-30" />
            <p>No complaints for this filter</p>
          </div>
        ) : (
          <ComplaintsMap key={filter} complaints={filtered} />
        )}
      </div>
    </div>
  );
}
