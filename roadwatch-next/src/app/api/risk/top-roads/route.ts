import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRisk, ACCIDENT_DISTRICT_ALIASES } from "@/lib/riskEngine";

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const [roads, accidents, allComplaints] = await Promise.all([
      prisma.road.findMany({
        select: { id: true, road_name: true, district: true },
      }),
      prisma.accident.findMany(),
      prisma.complaint.findMany({
        select: { road_id: true, severity: true, created_at: true, confidence: true, issue_type: true },
      }),
    ]);

    const accidentMap = new Map(accidents.map((a) => {
      const raw = a.district.toUpperCase().trim();
      const key = ACCIDENT_DISTRICT_ALIASES[raw] ?? raw;
      return [key, a.total_accidents];
    }));

    // Only use district field — roads with empty district are national highways outside TN scope
    const getAccidentCount = (road: { district: string }) => {
      const d = road.district?.trim().toUpperCase();
      return d ? (accidentMap.get(d) ?? 0) : 0;
    };

    const complaintsByRoad = new Map<string, typeof allComplaints>();
    for (const c of allComplaints) {
      if (!c.road_id) continue;
      if (!complaintsByRoad.has(c.road_id)) complaintsByRoad.set(c.road_id, []);
      complaintsByRoad.get(c.road_id)!.push(c);
    }

    const roadsWithRisk = roads.map((road) => {
      const complaints = complaintsByRoad.get(road.id) ?? [];
      const accidentCount = getAccidentCount(road);
      const { risk, urgency } = computeRisk(accidentCount, complaints);
      return {
        road_name: road.road_name,
        district: road.district,
        risk_percentage: Math.round(risk),
        urgency,
        accidents: accidentCount,
        complaints: complaints.length,
      };
    });

    const result = roadsWithRisk.sort((a, b) => b.risk_percentage - a.risk_percentage).slice(0, 20);
    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching top roads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
