import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const district = request.nextUrl.searchParams.get("district")?.trim();
  const forScore = request.nextUrl.searchParams.get("score") === "1";

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

    // If score=1, enrich each road with complaint aggregates from its district
    if (forScore && roads.length > 0) {
      const districts = [...new Set(roads.map((r) => r.district).filter(Boolean))];

      // Fetch all complaints for these districts in one query
      const complaints = await prisma.complaint.findMany({
        where: {
          address: {
            // match district name anywhere in address string
            in: undefined,
          },
        },
        select: { issue_type: true, address: true },
      });

      // Also fetch complaints without district filter — group by issue_type globally
      // since road_id is null on most complaints, we use total counts
      const allComplaints = await prisma.complaint.findMany({
        select: { issue_type: true, address: true },
      });

      const enriched = roads.map((road) => {
        // Filter complaints that mention this road's district in address
        const districtComplaints = road.district
          ? allComplaints.filter((c) =>
              c.address?.toLowerCase().includes(road.district.toLowerCase())
            )
          : allComplaints;

        const potholeCount = districtComplaints.filter((c) => c.issue_type === "Pothole").length;
        const crackCount = districtComplaints.filter((c) => c.issue_type === "Crack").length;
        const waterloggingCount = districtComplaints.filter((c) => c.issue_type === "Waterlogging").length;
        const totalComplaints = districtComplaints.length;

        // Derive crack severity from count
        const crackSeverity =
          crackCount === 0 ? "Low" : crackCount <= 3 ? "Medium" : "High";

        // Derive last maintenance bucket from last_maintenance_date
        let lastMaintenance: "<6" | "6-12" | ">12" = ">12";
        if (road.last_maintenance_date) {
          const maintDate = new Date(road.last_maintenance_date);
          const monthsAgo =
            (Date.now() - maintDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsAgo < 6) lastMaintenance = "<6";
          else if (monthsAgo <= 12) lastMaintenance = "6-12";
          else lastMaintenance = ">12";
        }

        return {
          ...road,
          score_data: {
            potholes: Math.min(potholeCount, 20),
            crackSeverity,
            waterlogging: waterloggingCount > 0 ? "Yes" : "No",
            lastMaintenance,
            complaints: Math.min(totalComplaints, 100),
          },
        };
      });

      return NextResponse.json(enriched);
    }

    return NextResponse.json(roads);
  } catch {
    return NextResponse.json({ error: "Failed to fetch roads" }, { status: 500 });
  }
}
