import { ChatWindow } from "@/components/chatbot/ChatWindow";

export const metadata = { title: "Chatbot — RoadPulse" };

export default function ChatbotPage() {
  return (
    <div className="container mx-auto px-4 py-4 h-[calc(100vh-3.5rem-1rem)]">
      <div className="flex flex-col h-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 px-5 py-3.5 rounded-xl border border-border bg-card shadow-sm">
          <div className="relative flex-shrink-0">
            {/* Animated bot */}
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md animate-[botpulse_2.5s_ease-in-out_infinite]">
              <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
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
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base">RoadPulse AI Assistant</p>
            <p className="text-xs text-muted-foreground">Road defect detection &amp; Tamil Nadu road data</p>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
