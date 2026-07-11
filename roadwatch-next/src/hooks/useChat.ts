"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import * as exifr from "exifr";
import { ChatMessage, ChatStep, DetectionResult, LocationData } from "@/types";
import { generateId } from "@/lib/utils";
import { createComplaint, deleteComplaint } from "@/services/complaint.service";
import { reverseGeocode } from "@/services/location.service";

function botMessage(content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return { id: generateId(), role: "bot", content, timestamp: new Date(), ...extras };
}

function userMessage(content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return { id: generateId(), role: "user", content, timestamp: new Date(), ...extras };
}

const WELCOME: ChatMessage = botMessage(
  "Hi! I'm **RoadPulse AI** — I can answer questions about Tamil Nadu roads and detect defects in road photos.\n\nAsk me anything, or upload a road photo for analysis."
);

async function extractLocationFromImage(file: File): Promise<LocationData | null> {
  try {
    const gps = await exifr.gps(file as any);
    if (typeof gps?.latitude !== "number" || typeof gps?.longitude !== "number") return null;
    const address = await reverseGeocode(gps.latitude, gps.longitude);
    return { latitude: gps.latitude, longitude: gps.longitude, address, source: "EXIF" };
  } catch {
    return null;
  }
}

async function persistMessage(msg: ChatMessage) {
  const metadata = (msg.imageUrl || msg.detectionResult)
    ? JSON.stringify({ imageUrl: msg.imageUrl, detectionResult: msg.detectionResult })
    : undefined;
  await fetch("/api/chat-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: msg.role, content: msg.content, metadata }),
  });
}

function rowToMessage(row: { id: string; role: string; content: string; metadata?: string | null; created_at: string }): ChatMessage {
  const meta = row.metadata ? (JSON.parse(row.metadata) as { imageUrl?: string; detectionResult?: DetectionResult }) : {};
  return {
    id: row.id,
    role: row.role as "user" | "bot",
    content: row.content,
    timestamp: new Date(row.created_at),
    imageUrl: meta.imageUrl,
    detectionResult: meta.detectionResult,
  };
}

export function useChat(userId?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [step, setStep] = useState<ChatStep>("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingDetection, setPendingDetection] = useState<DetectionResult | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState<LocationData | null>(null);
  const pendingLocationRef = useRef<LocationData | null>(null);
  const [lastComplaintId, setLastComplaintId] = useState<string | null>(null);
  const historyLoaded = useRef(false);

  const setPendingLocationSync = useCallback((loc: LocationData | null) => {
    pendingLocationRef.current = loc;
    setPendingLocation(loc);
  }, []);

  useEffect(() => {
    if (!userId || historyLoaded.current) return;
    historyLoaded.current = true;
    fetch("/api/chat-history")
      .then((r) => r.json())
      .then((rows: Parameters<typeof rowToMessage>[0][]) => {
        if (rows.length > 0) setMessages([WELCOME, ...rows.map(rowToMessage)]);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (userId === null && historyLoaded.current) {
      historyLoaded.current = false;
      setMessages([WELCOME]);
      setStep("idle");
    }
  }, [userId]);

  const addBotMessage = useCallback((content: string, extras?: Partial<ChatMessage>) => {
    setIsTyping(true);
    setTimeout(() => {
      const msg = botMessage(content, extras);
      setMessages((prev) => [...prev, msg]);
      setIsTyping(false);
      if (userId) persistMessage(msg);
    }, 600);
  }, [userId]);

  const sendTextMessage = useCallback(async (text: string) => {
    const uMsg = userMessage(text);
    let currentMessages: ChatMessage[] = [];
    setMessages((prev) => {
      currentMessages = prev;
      return [...prev, uMsg];
    });
    if (userId) persistMessage(uMsg);
    setIsTyping(true);

    const history = currentMessages
      .filter((m) => !m.imageUrl && !m.showComplaintButtons && !m.showLocationInput && !m.showDescriptionInput)
      .slice(-10)
      .map((m) => ({ role: m.role === "bot" ? "model" : "user" as "user" | "model", content: m.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = (await response.json()) as { response?: string; error?: string };
      setIsTyping(false);
      const rawText = data.response ?? "Sorry, I couldn't process that. Please try again.";

      // Detect EE list marker — fetch structured data and attach as eeList
      if (rawText.includes("__EE_LIST__")) {
        const cleanText = rawText.replace("__EE_LIST__", "").trim();
        let eeList: { district: string; engineer: string }[] = [];
        try {
          const eeRes = await fetch("/api/engineers");
          eeList = await eeRes.json();
        } catch { /* fallback to empty */ }
        const bMsg = botMessage(cleanText, { eeList });
        setMessages((prev) => [...prev, bMsg]);
        if (userId) persistMessage(bMsg);
      } else {
        const bMsg = botMessage(rawText);
        setMessages((prev) => [...prev, bMsg]);
        if (userId) persistMessage(bMsg);
      }
    } catch {
      setIsTyping(false);
      const bMsg = botMessage("Network error — please check your connection and try again.");
      setMessages((prev) => [...prev, bMsg]);
    }
  }, [userId]);

  const handleImageUpload = useCallback(
    async (file: File, previewUrl: string) => {
      if (!userId) {
        addBotMessage("🔒 You'll need to **log in** first to upload images and raise complaints. [Login here](/login)");
        return;
      }

      const uMsg = userMessage("📷 Image uploaded for analysis", { imageUrl: previewUrl });
      setMessages((prev) => [...prev, uMsg]);
      persistMessage(uMsg);
      setPendingImageUrl(previewUrl);
      addBotMessage("Let me take a look at that image... 🔍");
      setStep("detected");

      const formData = new FormData();
      formData.append("file", file);

      const locationFromImage = await extractLocationFromImage(file);
      if (locationFromImage) setPendingLocationSync(locationFromImage);

      const response = await fetch("/api/upload", { method: "POST", body: formData });

      if (!response.ok) {
        addBotMessage("Hmm, something went wrong analyzing that image. Could you try again?");
        setStep("idle");
        return;
      }

      const result = (await response.json()) as DetectionResult & { image_url?: string; location?: LocationData };
      if (result.location) setPendingLocationSync(result.location);

      const detection: DetectionResult = { issue: result.issue, confidence: result.confidence };

      if ((detection.issue as string) === "Not a Road") {
        setIsTyping(true);
        setTimeout(() => {
          const bMsg = botMessage(
            "Hmm, that doesn't look like a road photo to me. 🤔\n\nI work best with clear photos of roads — things like potholes, cracks, waterlogging, or damaged surfaces. Could you try uploading a road image?"
          );
          setMessages((prev) => [...prev, bMsg]);
          setIsTyping(false);
          persistMessage(bMsg);
          setPendingDetection(null);
          setPendingImageUrl(null);
          setPendingLocationSync(null);
          setStep("idle");
        }, 800);
        return;
      }

      setPendingDetection(detection);
      if (result.image_url) setPendingImageUrl(result.image_url);

      setIsTyping(true);
      setTimeout(() => {
        if ((detection.issue as string) === "Good Road") {
          const bMsg = botMessage(
            `Good news! ✅ This road looks to be in **good condition** (${detection.confidence.toFixed(1)}% confidence) — no defects spotted.\n\nIf you think something's off, try uploading a closer or clearer photo and I'll look again!`,
            { detectionResult: detection }
          );
          setMessages((prev) => [...prev, bMsg]);
          setIsTyping(false);
          persistMessage(bMsg);
          setPendingDetection(null);
          setPendingImageUrl(null);
          setPendingLocationSync(null);
          setStep("idle");
          return;
        }

        const issueEmoji: Record<string, string> = {
          "Pothole": "🕳️",
          "Crack": "🔍",
          "Waterlogging": "💧",
          "Damaged Road": "🛣️",
          "Debris": "🪨",
          "Missing Manhole": "⚠️",
        };
        const emoji = issueEmoji[detection.issue] ?? "⚠️";
        const bMsg = botMessage(
          `${emoji} Looks like there's a **${detection.issue}** here — I'm **${detection.confidence.toFixed(1)}% confident** about that.\n\nWould you like to **raise a complaint** about this so it gets fixed, or were you just looking for information about what you're seeing?`,
          { showComplaintButtons: true, detectionResult: detection }
        );
        setMessages((prev) => [...prev, bMsg]);
        setIsTyping(false);
        persistMessage(bMsg);
        setStep("awaiting_complaint_confirm");
      }, 800);
    },
    [addBotMessage, userId]
  );

  const handleComplaintYes = useCallback(() => {
    const uMsg = userMessage("Yes, raise a complaint");
    setMessages((prev) => [...prev, uMsg]);
    if (userId) persistMessage(uMsg);

    const currentLocation = pendingLocationRef.current;
    if (currentLocation) {
      setStep("awaiting_description");
      setIsTyping(true);
      setTimeout(() => {
        const bMsg = botMessage(
          `Great! I picked up your location from the image: **${currentLocation.address ?? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`}**\n\nAnything you'd like to add about the issue? (totally optional — just hit submit if not)`,
          { showDescriptionInput: true, detectedLocation: currentLocation }
        );
        setMessages((prev) => [...prev, bMsg]);
        setIsTyping(false);
        if (userId) persistMessage(bMsg);
      }, 500);
      return;
    }

    setStep("awaiting_location");
    setIsTyping(true);
    setTimeout(() => {
      const bMsg = botMessage("Sure! Could you share your location so we know where this is? 📍", { showLocationInput: true });
      setMessages((prev) => [...prev, bMsg]);
      setIsTyping(false);
      if (userId) persistMessage(bMsg);
    }, 500);
  }, [userId]);

  const handleComplaintNo = useCallback(() => {
    const uMsg = userMessage("Just information, thanks");
    setMessages((prev) => [...prev, uMsg]);
    if (userId) persistMessage(uMsg);
    setPendingDetection(null);
    setPendingImageUrl(null);
    setPendingLocationSync(null);
    setStep("idle");
    addBotMessage("No worries! Feel free to ask me anything about it, or upload another photo anytime. 😊");
  }, [addBotMessage, userId]);

  const handleLocationSubmit = useCallback((location: LocationData) => {
    setPendingLocationSync(location);
    const uMsg = userMessage(`📍 ${location.address ?? `${location.latitude}, ${location.longitude}`}`);
    setMessages((prev) => [...prev, uMsg]);
    if (userId) persistMessage(uMsg);
    setStep("awaiting_description");
    setIsTyping(true);
    setTimeout(() => {
      const bMsg = botMessage("Got it! Anything you'd like to add about the issue? (optional — skip if you prefer)", { showDescriptionInput: true });
      setMessages((prev) => [...prev, bMsg]);
      setIsTyping(false);
      if (userId) persistMessage(bMsg);
    }, 500);
  }, [userId, setPendingLocationSync]);

  const handleDescriptionSubmit = useCallback(
    async (description: string) => {
      if (!pendingDetection || !pendingLocation) return;

      const uMsg = userMessage(description || "No description provided");
      setMessages((prev) => [...prev, uMsg]);
      if (userId) persistMessage(uMsg);
      setStep("submitting");
      setIsTyping(true);

      try {
        const complaint = await createComplaint({
          issue_type: pendingDetection.issue,
          confidence: pendingDetection.confidence,
          image_url: pendingImageUrl ?? undefined,
          latitude: pendingLocation.latitude,
          longitude: pendingLocation.longitude,
          address: pendingLocation.address,
          description: description || undefined,
        });

        setLastComplaintId(complaint.id);

        setTimeout(() => {
          const bMsg = botMessage(
            `✅ Complaint filed! Here's a summary:\n\n**Issue:** ${pendingDetection.issue}\n**Location:** ${pendingLocation.address ?? "Saved"}\n**Status:** Pending\n\nYou can track it anytime on the **Complaints** page. Thanks for helping make the roads safer! 🙌`,
            { showDeleteButton: true }
          );
          setMessages((prev) => [...prev, bMsg]);
          setIsTyping(false);
          if (userId) persistMessage(bMsg);
          setStep("done");
          setPendingDetection(null);
          setPendingImageUrl(null);
          setPendingLocationSync(null);
          setTimeout(() => setStep("idle"), 1000);
        }, 800);
      } catch {
        setIsTyping(false);
        addBotMessage("Something went wrong submitting the complaint. Want to try again?");
        setStep("idle");
      }
    },
    [pendingDetection, pendingLocation, pendingImageUrl, addBotMessage, userId]
  );

  const handleDeleteComplaint = useCallback(async () => {
    if (!lastComplaintId) return;
    try {
      await deleteComplaint(lastComplaintId);
      setLastComplaintId(null);
      setMessages((prev) => prev.map((m) => (m.showDeleteButton ? { ...m, showDeleteButton: false } : m)));
      addBotMessage("Done — complaint deleted. 🗑️");
    } catch {
      addBotMessage("Couldn't delete that complaint. You can remove it from the Complaints page instead.");
    }
  }, [lastComplaintId, addBotMessage]);

  const clearHistory = useCallback(async () => {
    await fetch("/api/chat-history", { method: "DELETE" });
    historyLoaded.current = false;
    setMessages([WELCOME]);
    setStep("idle");
  }, []);

  return {
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
    lastComplaintId,
  };
}
