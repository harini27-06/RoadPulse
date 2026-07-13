"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage, ChatStep, DetectionResult, LocationData } from "@/types";
import { generateId } from "@/lib/utils";
import { createComplaint, deleteComplaint } from "@/services/complaint.service";

function botMessage(content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return { id: generateId(), role: "bot", content, timestamp: new Date(), ...extras };
}

function userMessage(content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return { id: generateId(), role: "user", content, timestamp: new Date(), ...extras };
}

const WELCOME: ChatMessage = botMessage(
  "Hi! I'm **RoadPulse AI** — I can answer questions about Tamil Nadu roads and detect defects in road photos.\n\nAsk me anything, or upload a road photo for analysis."
);

async function persistMessage(msg: ChatMessage) {
  const metadata = (msg.imageUrl || msg.detectionResult)
    ? JSON.stringify({ imageUrl: msg.imageUrl, detectionResult: msg.detectionResult })
    : undefined;
  await fetch("/api/chat-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: msg.role, content: msg.content, metadata }),
  }).catch(() => {});
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
        addBotMessage("You need to **log in** first to upload images and raise complaints.");
        return;
      }

      const uMsg = userMessage("Image uploaded for analysis", { imageUrl: previewUrl });
      setMessages((prev) => [...prev, uMsg]);
      persistMessage(uMsg);
      setPendingImageUrl(previewUrl);
      addBotMessage("Analyzing your image 🔍...wait a moment while I check for road defects.");
      setStep("detected");

      const formData = new FormData();
      formData.append("file", file);

      let response: Response;
      try {
        response = await fetch("/api/upload", { method: "POST", body: formData });
      } catch {
        addBotMessage("Network error — could not reach the server. Please check your connection and try again.");
        setStep("idle");
        return;
      }

      const result = await response.json() as { issue?: string; confidence?: number; image_url?: string; location?: LocationData; error?: string };

      if (!response.ok) {
        const errMsg = result.error ?? "Something went wrong analyzing that image.";
        addBotMessage(errMsg.includes("unavailable") || errMsg.includes("timed out")
          ? `The AI detection service is currently **${errMsg.includes("timed out") ? "slow to respond" : "offline"}**. This usually happens when the service is starting up — please wait 30 seconds and try again.`
          : errMsg
        );
        setStep("idle");
        return;
      }

      if (result.location) setPendingLocationSync(result.location);

      const detection: DetectionResult = { issue: result.issue as DetectionResult["issue"], confidence: result.confidence ?? 0 };

      if ((detection.issue as string) === "Not a Road") {
        setIsTyping(true);
        setTimeout(() => {
          const bMsg = botMessage("That doesn't look like a road photo. Please upload a clear photo of a road surface — potholes, cracks, waterlogging, or damaged surfaces.");
          setMessages((prev) => [...prev, bMsg]);
          setIsTyping(false);
          persistMessage(bMsg);
          setPendingDetection(null);
          setPendingImageUrl(null);
          setPendingLocationSync(null);
          setStep("idle");
        }, 600);
        return;
      }

      setPendingDetection(detection);
      if (result.image_url) setPendingImageUrl(result.image_url);

      setIsTyping(true);
      setTimeout(() => {
        if ((detection.issue as string) === "Good Road") {
          const bMsg = botMessage(
            `This road looks to be in **good condition** (${detection.confidence.toFixed(1)}% confidence) — no defects detected.`,
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
          Pothole: "🕳️", Crack: "🔍", Waterlogging: "💧",
          "Damaged Road": "🛣️", Debris: "🪨", "Missing Manhole": "⚠️",
        };
        const emoji = issueEmoji[detection.issue] ?? "⚠️";
        const bMsg = botMessage(
          `${emoji} Detected **${detection.issue}** — **${detection.confidence.toFixed(1)}% confidence**.\n\nWould you like to raise a complaint about this?`,
          { showComplaintButtons: true, detectionResult: detection }
        );
        setMessages((prev) => [...prev, bMsg]);
        setIsTyping(false);
        persistMessage(bMsg);
        setStep("awaiting_complaint_confirm");
      }, 600);
    },
    [addBotMessage, userId, setPendingLocationSync]
  );

  const handleComplaintYes = useCallback(() => {
    const uMsg = userMessage("Yes, raise a complaint");
    setMessages((prev) => [...prev, uMsg]);
    if (userId) persistMessage(uMsg);

    const currentLocation = pendingLocationRef.current ?? {
      latitude: 0,
      longitude: 0,
      address: "Location not available",
      source: "manual" as const,
    };
    setPendingLocationSync(currentLocation);

    setStep("awaiting_description");
    setIsTyping(true);
    setTimeout(() => {
      const hasGps = currentLocation.latitude !== 0 || currentLocation.longitude !== 0;
      const locationLine = hasGps
        ? `📍 Location detected from image: **${currentLocation.address ?? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`}**`
        : `📍 No GPS data found in image — location will be saved as *not available*`;
      const bMsg = botMessage(
        `${locationLine}\n\nAnything you'd like to add about the issue? (optional — just hit submit if not)`,
        { showDescriptionInput: true, detectedLocation: currentLocation }
      );
      setMessages((prev) => [...prev, bMsg]);
      setIsTyping(false);
      if (userId) persistMessage(bMsg);
    }, 500);
  }, [userId, setPendingLocationSync]);

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
      if (!pendingDetection) return;
      const location = pendingLocationRef.current ?? { latitude: 0, longitude: 0, address: "Location not available", source: "manual" as const };

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
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          description: description || undefined,
        });

        setLastComplaintId(complaint.id);

        setTimeout(() => {
          const complaintRef = complaint.complaint_number ? ` **#${complaint.complaint_number}**` : "";
          const bMsg = botMessage(
            `✅ Complaint${complaintRef} filed! Here's a summary:\n\n**Issue:** ${pendingDetection.issue}\n**Location:** ${location.address ?? "Saved"}\n**Status:** Pending\n\nTrack it anytime — type *"Track Complaint #${complaint.complaint_number ?? ""}"* or visit the **Complaints** page. 🙌`,
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
    [pendingDetection, pendingImageUrl, addBotMessage, userId]
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
