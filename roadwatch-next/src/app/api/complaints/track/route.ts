import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const num = request.nextUrl.searchParams.get("number");
  if (!num || isNaN(parseInt(num)))
    return NextResponse.json({ error: "Missing complaint number" }, { status: 400 });

  const complaint = await prisma.complaint
    .findFirst({
      where: { complaint_number: parseInt(num) },
      select: {
        complaint_number: true,
        status: true,
        issue_type: true,
        address: true,
        assigned_engineer: true,
        scheduled_end_date: true,
        created_at: true,
        engineer: { select: { district: true } },
      },
    })
    .catch(() => null);

  if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(complaint);
}
