import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = req.cookies.get("rw_token")?.value;
  return token ? verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json([], { status: 200 });

  const sessionId = new URL(req.url).searchParams.get("session_id");

  try {
    const rows = await prisma.chatHistory.findMany({
      where: {
        user_id: user.id,
        ...(sessionId ? { session_id: sessionId } : {}),
      },
      orderBy: { created_at: "asc" },
    });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json() as { role: string; content: string; metadata?: string; session_id?: string };

  prisma.chatHistory.create({
    data: {
      user_id: user.id,
      session_id: body.session_id ?? null,
      role: body.role,
      content: body.content,
      metadata: body.metadata ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get("session_id");

  try {
    await prisma.chatHistory.deleteMany({
      where: {
        user_id: user.id,
        ...(sessionId ? { session_id: sessionId } : {}),
      },
    });
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
