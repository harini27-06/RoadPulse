"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, User, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types";
import { formatTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocationInput } from "./LocationInput";
import { DescriptionInput } from "./DescriptionInput";
import { LocationData } from "@/types";

const PREVIEW_COUNT = 5;

const STATUS_COLORS: Record<string, string> = {
  Pending:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Resolved:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Waitlisted:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Returned:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function NearbyStatsCard({ data }: { data: { radiusKm: number; total: number; byStatus: { status: string; count: number }[] } }) {
  return (
    <div className="mt-2 rounded-xl border border-border overflow-hidden w-full">
      <div className="bg-primary/10 px-4 py-3 flex items-center gap-2 border-b border-border">
        <span className="text-base">📍</span>
        <div>
          <p className="text-xs font-bold text-foreground">Within {data.radiusKm} km</p>
          <p className="text-[11px] text-muted-foreground">Based on your current location</p>
        </div>
        <span className="ml-auto text-2xl font-black text-primary">{data.total}</span>
      </div>
      <div className="divide-y divide-border">
        {data.byStatus.map(({ status, count }) => (
          <div key={status} className="flex items-center justify-between px-4 py-2.5">
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[status] ?? "bg-muted text-muted-foreground")}>
              {status}
            </span>
            <span className="text-sm font-bold text-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingTable({ data }: { data: { title: string; subtitle?: string; columns: string[]; rows: string[][] } }) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 5;
  const visible = expanded ? data.rows : data.rows.slice(0, PREVIEW);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden text-sm w-full">
      {data.subtitle && (
        <div className="bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{data.subtitle}</div>
      )}
      <table className="w-full">
        <thead>
          <tr className="bg-primary/10 border-b border-border">
            {data.columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => {
            const rank = parseInt(row[0]);
            return (
              <tr key={i} className={cn("border-b border-border/50 last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                {row.map((cell, j) => (
                  <td key={j} className={cn("px-3 py-2 text-xs", j === 0 ? "font-bold text-primary w-10" : j === 1 ? "font-semibold" : "text-muted-foreground")}>
                    {j === 0 ? (medals[rank - 1] ?? cell) : cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.rows.length > PREVIEW && (
        <button onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-muted/40 transition-colors border-t border-border">
          {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show all ({data.rows.length - PREVIEW} more)</>}
        </button>
      )}
    </div>
  );
}

function CompareTable({ rows, labels }: {
  rows: { feature: string; a: string; b: string }[];
  labels: [string, string];
}) {
  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden text-sm w-full">
      <table className="w-full">
        <thead>
          <tr className="bg-primary/10 border-b border-border">
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-[38%]">Feature</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-primary truncate max-w-[100px]">{labels[0]}</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-blue-500 truncate max-w-[100px]">{labels[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.feature} className={cn("border-b border-border/50 last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
              <td className="px-3 py-2 text-xs font-medium text-muted-foreground">{row.feature}</td>
              <td className="px-3 py-2 text-xs text-center font-semibold text-foreground">{row.a}</td>
              <td className="px-3 py-2 text-xs text-center font-semibold text-foreground">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EEListCard({ list }: { list: { district: string; engineer: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? list : list.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden text-sm w-full">
      <div className="bg-muted/60 px-3 py-2 flex items-center justify-between">
        <span className="font-semibold text-xs text-foreground">Executive Engineers — Tamil Nadu ({list.length} districts)</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground w-5">#</th>
            <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">District</th>
            <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Executive Engineer</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={row.district} className={cn("border-b border-border/50 last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
              <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-1.5 text-xs font-medium">{row.district}</td>
              <td className="px-3 py-1.5 text-xs text-muted-foreground">{row.engineer}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-muted/40 transition-colors border-t border-border"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> View more ({list.length - PREVIEW_COUNT} more districts)</>
          )}
        </button>
      )}
    </div>
  );
}

interface ChatMessageProps {
  message: ChatMessageType;
  onComplaintYes?: () => void;
  onComplaintNo?: () => void;
  onLocationSubmit?: (location: LocationData) => void;
  onDescriptionSubmit?: (description: string) => void;
  onDeleteComplaint?: () => void;
  isLastMessage?: boolean;
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    // Bullet points
    const isBullet = line.startsWith("- ") || line.startsWith("• ");
    const content = isBullet ? line.slice(2) : line;
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
    return (
      <p
        key={i}
        dangerouslySetInnerHTML={{ __html: formatted }}
        className={isBullet ? "ml-3 flex gap-1.5 before:content-['•'] before:text-primary before:shrink-0" : ""}
      />
    );
  });
}

function ClientTimestamp({ timestamp }: { timestamp: Date }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    setTime(formatTime(timestamp));
  }, [timestamp]);
  if (!time) return null;
  return <span className="text-xs text-muted-foreground">{time}</span>;
}

export function ChatMessageItem({
  message,
  onComplaintYes,
  onComplaintNo,
  onLocationSubmit,
  onDescriptionSubmit,
  onDeleteComplaint,
  isLastMessage,
}: ChatMessageProps) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-2.5 mb-3", isBot ? "justify-start" : "justify-end")}
    >
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-1.5", isBot ? "items-start" : "items-end flex flex-col")}>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed space-y-1 rounded-2xl",
            isBot
              ? "bg-muted text-foreground rounded-tl-sm"
              : "bg-primary text-primary-foreground rounded-tr-sm"
          )}
        >
          {message.imageUrl && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <img
                src={message.imageUrl}
                alt="Uploaded road image"
                className="object-cover w-full max-h-48"
              />
            </div>
          )}
          <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
        </div>

        {message.eeList && message.eeList.length > 0 && (
          <EEListCard list={message.eeList} />
        )}

        {message.compareTable && message.compareLabels && (
          <CompareTable rows={message.compareTable} labels={message.compareLabels} />
        )}

        {message.rankingList && (
          <RankingTable data={message.rankingList} />
        )}

        {message.nearbyStats && (
          <NearbyStatsCard data={message.nearbyStats} />
        )}

        {isLastMessage && message.showComplaintButtons && onComplaintYes && onComplaintNo && (
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              onClick={onComplaintYes}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Raise a Complaint
            </Button>
            <Button size="sm" variant="outline" onClick={onComplaintNo}>
              Just Info
            </Button>
          </div>
        )}

        {isLastMessage && message.showLocationInput && onLocationSubmit && (
          <div className="w-full mt-1">
            <LocationInput onSubmit={onLocationSubmit} />
          </div>
        )}

        {message.detectedLocation && (
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Location from image:</p>
            <p>
              {message.detectedLocation.address ??
                `${message.detectedLocation.latitude.toFixed(5)}, ${message.detectedLocation.longitude.toFixed(5)}`}
            </p>
          </div>
        )}

        {isLastMessage && message.showDescriptionInput && onDescriptionSubmit && (
          <div className="w-full mt-1">
            <DescriptionInput onSubmit={onDescriptionSubmit} />
          </div>
        )}

        {message.showDeleteButton && onDeleteComplaint && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onDeleteComplaint}
            className="gap-1.5 mt-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Complaint
          </Button>
        )}

        <ClientTimestamp timestamp={message.timestamp} />
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
