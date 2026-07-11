import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    take: 30,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { id?: string };

  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, user_id: user.id },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { user_id: user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
