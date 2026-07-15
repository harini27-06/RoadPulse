"use client";

import { useState } from "react";
import { Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { ChatSession } from "@/hooks/useChatSessions";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatSidebar({ sessions, activeSessionId, onNewChat, onSwitch, onDelete }: ChatSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0",
        collapsed ? "w-10" : "w-56"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full border border-border bg-background flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center pt-3 gap-2">
          <button
            onClick={onNewChat}
            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
            title="New Chat"
          >
            <Plus className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
        </div>
      ) : (
        <>
          {/* New Chat button */}
          <div className="p-2 border-b border-border">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              New Chat
            </button>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto py-1">
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4 px-3">No conversations yet</p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-1.5 px-2 py-1.5 mx-1 my-0.5 rounded-lg cursor-pointer transition-colors",
                  activeSessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onSwitch(session.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{session.title}</p>
                  <p className="text-[10px] opacity-60">{formatDate(session.updated_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
