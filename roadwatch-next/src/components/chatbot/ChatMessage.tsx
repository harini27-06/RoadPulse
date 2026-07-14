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
    const formatted = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
    return (
      <p
        key={i}
        dangerouslySetInnerHTML={{ __html: formatted }}
        className={line.startsWith("- ") ? "ml-3" : ""}
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
