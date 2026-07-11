import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRisk, ACCIDENT_DISTRICT_ALIASES } from "@/lib/riskEngine";

export async function POST(req: NextRequest) {
  try {
    const { roadName } = await req.json();
    if (!roadName)
      return NextResponse.json({ error: "Road name is required" }, { status: 400 });

    const road = await prisma.road.findFirst({
      where: { road_name: { contains: roadName, mode: "insensitive" } },
    });
    if (!road)
      return NextResponse.json({ error: "Road not found" }, { status: 404 });

    const districtToLookup = road.district?.trim().toUpperCase() || "";
    // Reverse-alias: find the accident DB name that maps to this road district
    const accidentDistrict = districtToLookup
      ? (Object.entries(ACCIDENT_DISTRICT_ALIASES).find(([, v]) => v === districtToLookup)?.[0] ?? districtToLookup)
      : "";

    const [accident, complaints] = await Promise.all([
      districtToLookup
        ? prisma.accident.findFirst({ where: { district: { equals: accidentDistrict, mode: "insensitive" } } })
        : Promise.resolve(null),
      prisma.complaint.findMany({
        where: { road_id: road.id },
        select: { severity: true, created_at: true, confidence: true, issue_type: true },
      }),
    ]);

    const { risk, urgency, breakdown, factors } = computeRisk(
      accident?.total_accidents ?? 0,
      complaints
    );

    return NextResponse.json({
      road_name: road.road_name,
      district: road.district,
      risk_percentage: Math.round(risk),
      urgency,
      breakdown,
      factors,
      accidents: accident?.total_accidents ?? 0,
      complaints: complaints.length,
    });
  } catch (error) {
    console.error("Error predicting risk:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
