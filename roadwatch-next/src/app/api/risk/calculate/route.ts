import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRisk } from "@/lib/riskEngine";

export async function POST(req: NextRequest) {
  try {
    const { roadId } = await req.json();
    if (!roadId)
      return NextResponse.json({ error: "Road ID is required" }, { status: 400 });

    const road = await prisma.road.findUnique({ where: { id: roadId } });
    if (!road)
      return NextResponse.json({ error: "Road not found" }, { status: 404 });

    const [complaints, accident] = await Promise.all([
      prisma.complaint.findMany({
        where: { road_id: roadId },
        select: { severity: true, created_at: true, confidence: true, issue_type: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.accident.findUnique({ where: { district: road.district } }),
    ]);

    const { risk, urgency, confidence, breakdown, factors } = computeRisk(
      accident?.total_accidents ?? 0,
      complaints
    );

    const riskRounded = Math.round(risk);
    const confidenceRounded = Math.round(confidence);

    await prisma.roadRiskPrediction.upsert({
      where: { road_id: roadId },
      create: {
        road_id: roadId,
        risk_percentage: riskRounded,
        urgency,
        confidence: confidenceRounded,
        breakdown: JSON.stringify(breakdown),
        factors: JSON.stringify(factors),
      },
      update: {
        risk_percentage: riskRounded,
        urgency,
        confidence: confidenceRounded,
        breakdown: JSON.stringify(breakdown),
        factors: JSON.stringify(factors),
      },
    });

    return NextResponse.json({
      road_id: road.id,
      road_name: road.road_name,
      district: road.district,
      risk_percentage: riskRounded,
      urgency,
      confidence: confidenceRounded,
      breakdown,
      factors,
    });
  } catch (error) {
    console.error("Error calculating risk:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
