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

  try {
    const rows = await prisma.chatHistory.findMany({
      where: { user_id: user.id },
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

  const body = await req.json() as { role: string; content: string; metadata?: string };

  // Fire-and-forget — never block the response on DB write
  prisma.chatHistory.create({
    data: {
      user_id: user.id,
      role: body.role,
      content: body.content,
      metadata: body.metadata ?? null,
    },
  }).catch(() => { /* silently ignore pool errors */ });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.chatHistory.deleteMany({ where: { user_id: user.id } });
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
