import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const district = request.nextUrl.searchParams.get("district")?.trim();

  if (!q && !district) {
    return NextResponse.json({ error: "Provide q or district" }, { status: 400 });
  }

  try {
    const roads = await prisma.road.findMany({
      where: {
        ...(q && {
          OR: [
            { road_name: { contains: q, mode: "insensitive" } },
            { road_code: { contains: q, mode: "insensitive" } },
            { tender_id: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(district && { district: { contains: district, mode: "insensitive" } }),
      },
      select: {
        road_id: true,
        road_name: true,
        road_code: true,
        road_type: true,
        district: true,
        total_length_km: true,
        tender_id: true,
        estimated_amount: true,
        budget_estimate: true,
        total_work_value: true,
        last_maintenance_date: true,
        authority: true,
      },
      take: 10,
      orderBy: { road_name: "asc" },
    });

    return NextResponse.json(roads);
  } catch {
    return NextResponse.json({ error: "Failed to fetch roads" }, { status: 500 });
  }
}
