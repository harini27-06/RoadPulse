import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accidents = await prisma.accident.findMany({
      where: { executive_engineer: { not: null } },
      select: { district: true, executive_engineer: true },
      orderBy: { district: "asc" },
    });
    return NextResponse.json(accidents);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
