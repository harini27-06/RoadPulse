import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = parseFloat(searchParams.get("radius") ?? "2");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  // 1 degree ≈ 111 km
  const delta = radiusKm / 111;

  const complaints = await prisma.complaint.findMany({
    where: {
      latitude:  { gte: lat - delta, lte: lat + delta },
      longitude: { gte: lng - delta, lte: lng + delta },
    },
    select: { status: true },
  });

  // Group by status
  const counts: Record<string, number> = {};
  for (const c of complaints) {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  }

  return NextResponse.json({
    radiusKm,
    total: complaints.length,
    byStatus: Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  });
}
