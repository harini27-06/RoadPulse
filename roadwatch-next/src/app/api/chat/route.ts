import { NextRequest, NextResponse } from "next/server";
import { chat, ChatTurn } from "@/lib/chatEngine";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = req.cookies.get("rw_token")?.value;
  return token ? verifyToken(token) : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = getUser(request);
    const body = (await request.json()) as { message: string; history?: ChatTurn[] };
    const { message, history: clientHistory = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // If user is logged in, load their full conversation history from DB
    // This gives Gemini persistent memory across sessions
    let history: ChatTurn[] = clientHistory;
    if (user) {
      try {
        const dbHistory = await prisma.chatHistory.findMany({
          where: {
            user_id: user.id,
            role: { in: ["user", "bot"] },
          },
          orderBy: { created_at: "asc" },
          take: 20, // last 20 messages for context
          select: { role: true, content: true },
        });

        if (dbHistory.length > 0) {
          history = dbHistory.map((row) => ({
            role: row.role === "bot" ? "model" : "user" as "user" | "model",
            content: row.content,
          }));
        }
      } catch { /* use client history as fallback */ }
    }

    const response = await chat(message, history);
    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
