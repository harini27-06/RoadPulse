"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Trash2, LogIn } from "lucide-react";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { ChatMessageItem } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { ImageUploadButton } from "./ImageUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_PROMPTS = [
  "What is a pothole?",
  "How do I report road damage?",
  "Which district has the most accidents?",
  "Road maintenance types",
];

export function ChatWindow() {
  const { user } = useAuth();
  const {
    messages,
    step,
    isTyping,
    sendTextMessage,
    handleImageUpload,
    handleComplaintYes,
    handleComplaintNo,
    handleLocationSubmit,
    handleDescriptionSubmit,
    handleDeleteComplaint,
    clearHistory,
  } = useChat(user?.id ?? null);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInputDisabled =
    step === "awaiting_location" ||
    step === "awaiting_description" ||
    step === "submitting";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isInputDisabled) return;
    setInput("");
    await sendTextMessage(trimmed);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Clear history button */}
      {user && messages.length > 1 && (
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear history
          </button>
        </div>
      )}

      {/* Login banner */}
      {!user && (
        <div className="mx-4 mt-3 mb-1 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <LogIn className="h-4 w-4 shrink-0" />
            <span>
              <strong>Log in</strong> to upload images and raise complaints.
            </span>
          </div>
          <Link
            href="/login"
            className="shrink-0 text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Login
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg, idx) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            isLastMessage={idx === messages.length - 1}
            onComplaintYes={handleComplaintYes}
            onComplaintNo={handleComplaintNo}
            onLocationSubmit={handleLocationSubmit}
            onDescriptionSubmit={handleDescriptionSubmit}
            onDeleteComplaint={handleDeleteComplaint}
          />
        ))}

        {isTyping && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-primary-foreground font-bold">AI</span>
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — shown only on first message */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendTextMessage(prompt)}
              className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors border border-border"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-border p-3 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <ImageUploadButton
            onUpload={handleImageUpload}
            disabled={isInputDisabled || !user}
            loginRequired={!user}
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isInputDisabled
                ? "Processing..."
                : "Ask about roads, or upload a photo..."
            }
            disabled={isInputDisabled}
            className="flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isInputDisabled}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
