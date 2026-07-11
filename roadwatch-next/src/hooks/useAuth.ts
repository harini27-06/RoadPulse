"use client";

import { useState, useEffect } from "react";
import { AuthPayload } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () =>
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data as AuthPayload | null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchUser();
    // Re-check when tab becomes visible (handles multi-tab login switching)
    const onVisible = () => { if (document.visibilityState === "visible") fetchUser(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return { user, loading, logout };
}
