import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { CreateComplaintPayload } from "@/types";

function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  return token ? verifyToken(token) : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    // Unauthenticated or admin → return all (admin uses /api/admin/complaints)
    // Logged-in user → return only their complaints
    const where = user && user.role === "user" ? { user_id: user.id } : {};

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(complaints);
  } catch {
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const body = (await request.json()) as CreateComplaintPayload;
    const { issue_type, confidence, image_url, latitude, longitude, address, description } = body;

    if (!issue_type || confidence === undefined || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (description && description.length > 1000) {
      return NextResponse.json({ error: "Description too long" }, { status: 400 });
    }

    // Find existing primary complaint within ~100m radius with same issue_type not resolved
    const RADIUS = 0.001; // ~100m in degrees
    const existing = await prisma.complaint.findFirst({
      where: {
        issue_type,
        primary_complaint_id: null,
        status: { notIn: ["Resolved"] },
        latitude:  { gte: latitude  - RADIUS, lte: latitude  + RADIUS },
        longitude: { gte: longitude - RADIUS, lte: longitude + RADIUS },
      },
      orderBy: { created_at: "asc" },
    });

    const complaint = await prisma.complaint.create({
      data: {
        user_id: user?.id ?? null,
        issue_type,
        confidence,
        image_url: image_url ?? null,
        latitude,
        longitude,
        address: address ?? null,
        description: description ?? null,
        status: existing ? existing.status : "Pending",
        primary_complaint_id: existing ? existing.id : null,
      },
    });

    // Notify all admins of new complaint
    if (!existing) {
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            user_id: a.id,
            title: "New Complaint Filed",
            message: `A new ${issue_type} complaint was filed at ${address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}.`,
            type: "info",
          })),
        });
      }
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}
