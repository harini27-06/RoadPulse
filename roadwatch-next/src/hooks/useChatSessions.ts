"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatSessions(userId: string | null | undefined) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load sessions when user logs in
  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }
    setLoading(true);
    fetch("/api/chat-sessions")
      .then((r) => r.json())
      .then((data: ChatSession[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
          setActiveSessionId(data[0].id); // most recent first
        } else {
          // Auto-create first session
          createSession().then((s) => {
            if (s) setActiveSessionId(s.id);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const createSession = useCallback(async (): Promise<ChatSession | null> => {
    try {
      const res = await fetch("/api/chat-sessions", { method: "POST" });
      const session: ChatSession = await res.json();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      return session;
    } catch {
      return null;
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`/api/chat-sessions?id=${id}`, { method: "DELETE" }).catch(() => {});
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(next[0]?.id ?? null);
      }
      return next;
    });
  }, [activeSessionId]);

  const updateTitle = useCallback((id: string, title: string) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
    fetch(`/api/chat-sessions?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {});
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  // Refresh sessions list (called after title update)
  const refreshSessions = useCallback(() => {
    if (!userId) return;
    fetch("/api/chat-sessions")
      .then((r) => r.json())
      .then((data: ChatSession[]) => { if (Array.isArray(data)) setSessions(data); })
      .catch(() => {});
  }, [userId]);

  return {
    sessions,
    activeSessionId,
    loading,
    createSession,
    deleteSession,
    updateTitle,
    switchSession,
    refreshSessions,
  };
}
