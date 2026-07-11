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
      prisma.road.findMany({ select: { id: true, road_name: true, district: true } }),
      prisma.accident.findMany(),
      prisma.complaint.findMany({
        select: {
          road_id: true,
          severity: true,
          created_at: true,
          confidence: true,
          issue_type: true,
          latitude: true,
          longitude: true,
          address: true,
        },
      }),
    ]);

    const accidentMap = new Map(accidents.map((a) => {
      const raw = a.district.toUpperCase().trim();
      const key = ACCIDENT_DISTRICT_ALIASES[raw] ?? raw;
      return [key, a.total_accidents];
    }));

    // Group complaints by road_id in memory
    const complaintsByRoad = new Map<string, typeof allComplaints>();
    for (const c of allComplaints) {
      if (!c.road_id) continue;
      if (!complaintsByRoad.has(c.road_id)) complaintsByRoad.set(c.road_id, []);
      complaintsByRoad.get(c.road_id)!.push(c);
    }

    // Match unlinked complaints to roads by district extracted from address
    const unlinkedComplaints = allComplaints.filter((c) => !c.road_id);
    for (const c of unlinkedComplaints) {
      if (!c.address) continue;
      const addrUpper = c.address.toUpperCase();
      const matchedRoad = roads.find((r) =>
        r.district && addrUpper.includes(r.district.toUpperCase())
      );
      if (matchedRoad) {
        if (!complaintsByRoad.has(matchedRoad.id)) complaintsByRoad.set(matchedRoad.id, []);
        complaintsByRoad.get(matchedRoad.id)!.push(c);
      }
    }

    // Helper: get accident count — only use district field, never infer from road name
    // (roads with empty district are national highways outside TN scope)
    const getAccidentCount = (road: { district: string }) => {
      const d = road.district?.trim().toUpperCase();
      return d ? (accidentMap.get(d) ?? 0) : 0;
    };

    const roadsWithRisk = roads.map((road) => {
      const complaints = complaintsByRoad.get(road.id) ?? [];
      const accidentCount = getAccidentCount(road);

      const { risk, urgency, confidence, breakdown, factors } = computeRisk(
        accidentCount,
        complaints
      );

      const validComplaints = complaints.filter((c) => c.latitude && c.longitude);
      const centerLat =
        validComplaints.length > 0
          ? validComplaints.reduce((s, c) => s + c.latitude!, 0) / validComplaints.length
          : null;
      const centerLng =
        validComplaints.length > 0
          ? validComplaints.reduce((s, c) => s + c.longitude!, 0) / validComplaints.length
          : null;

      return {
        id: road.id,
        road_name: road.road_name,
        district: road.district,
        risk_percentage: Math.round(risk),
        urgency,
        confidence: Math.round(confidence),
        breakdown,
        factors,
        complaint_count: complaints.length,
        latitude: centerLat,
        longitude: centerLng,
      };
    });

    const sorted = roadsWithRisk.sort((a, b) => b.risk_percentage - a.risk_percentage);
    cache = { data: sorted, ts: Date.now() };
    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
