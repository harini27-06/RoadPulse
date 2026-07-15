"use client";

import { useAuth } from "@/hooks/useAuth";
import { useChatSessions } from "@/hooks/useChatSessions";
import { ChatWindow } from "@/components/chatbot/ChatWindow";
import { ChatSidebar } from "@/components/chatbot/ChatSidebar";

export default function ChatbotPage() {
  const { user } = useAuth();
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    switchSession,
    refreshSessions,
  } = useChatSessions(user?.id);

  const handleNewChat = async () => {
    await createSession();
  };

  // Refresh session titles periodically so auto-title shows up
  // (fires once 3s after switching to a new session)
  const handleSessionSwitch = (id: string) => {
    switchSession(id);
    setTimeout(refreshSessions, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-4 h-[calc(100vh-3.5rem-1rem)]">
      <div className="flex h-full max-w-5xl mx-auto gap-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Sidebar — only for logged-in users */}
        {user && (
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNewChat={handleNewChat}
            onSwitch={handleSessionSwitch}
            onDelete={deleteSession}
          />
        )}

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md animate-[botpulse_2.5s_ease-in-out_infinite]">
                <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="12" width="22" height="16" rx="4" fill="white" fillOpacity="0.95" />
                  <rect x="14" y="7" width="8" height="6" rx="2" fill="white" fillOpacity="0.9" />
                  <line x1="18" y1="7" x2="18" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="4" r="1.5" fill="white" />
                  <circle cx="13" cy="20" r="2.5" fill="#6366f1" />
                  <circle cx="23" cy="20" r="2.5" fill="#6366f1" />
                  <rect x="13" y="24" width="10" height="2" rx="1" fill="#6366f1" />
                  <rect x="5" y="16" width="3" height="6" rx="1.5" fill="white" fillOpacity="0.8" />
                  <rect x="28" y="16" width="3" height="6" rx="1.5" fill="white" fillOpacity="0.8" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">RoadPulse AI Assistant</p>
              <p className="text-xs text-muted-foreground truncate">Road defect detection &amp; Tamil Nadu road data</p>
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow sessionId={activeSessionId} />
          </div>
        </div>
      </div>
    </div>
  );
}
