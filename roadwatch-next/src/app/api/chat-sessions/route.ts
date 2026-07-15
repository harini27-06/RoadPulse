import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = req.cookies.get("rw_token")?.value;
  return token ? verifyToken(token) : null;
}

// GET /api/chat-sessions — list all sessions for user
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json([], { status: 200 });

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { user_id: user.id },
      orderBy: { updated_at: "desc" },
      select: { id: true, title: true, created_at: true, updated_at: true },
    });
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/chat-sessions — create new session
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const session = await prisma.chatSession.create({
      data: { user_id: user.id, title: "New Chat" },
      select: { id: true, title: true, created_at: true, updated_at: true },
    });
    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// DELETE /api/chat-sessions?id=xxx — delete a session (cascades messages)
export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.chatSession.deleteMany({ where: { id, user_id: user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PATCH /api/chat-sessions?id=xxx — update session title
export async function PATCH(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { title } = await req.json() as { title: string };
  try {
    await prisma.chatSession.updateMany({
      where: { id, user_id: user.id },
      data: { title: title.slice(0, 60) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
