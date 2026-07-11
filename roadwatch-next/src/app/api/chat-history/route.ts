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

  const rows = await prisma.chatHistory.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { role: string; content: string; metadata?: string };
  const row = await prisma.chatHistory.create({
    data: { user_id: user.id, role: body.role, content: body.content, metadata: body.metadata ?? null },
  });

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.chatHistory.deleteMany({ where: { user_id: user.id } });
  return NextResponse.json({ ok: true });
}
