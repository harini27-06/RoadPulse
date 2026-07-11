import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "engineer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [complaints, total, pending, inProgress, resolved, returned, waitlisted] =
    await Promise.all([
      prisma.complaint.findMany({
        where: { assigned_engineer_id: user.id },
        orderBy: { created_at: "desc" },
      }),
      prisma.complaint.count({ where: { assigned_engineer_id: user.id } }),
      prisma.complaint.count({ where: { assigned_engineer_id: user.id, status: "Pending" } }),
      prisma.complaint.count({ where: { assigned_engineer_id: user.id, status: "In Progress" } }),
      prisma.complaint.count({ where: { assigned_engineer_id: user.id, status: "Resolved" } }),
      prisma.complaint.count({ where: { assigned_engineer_id: user.id, status: "Returned" } }),
      prisma.complaint.count({ where: { assigned_engineer_id: user.id, status: "Waitlisted" } }),
    ]);

  return NextResponse.json({
    complaints,
    stats: { total, pending, inProgress, resolved, returned, waitlisted },
  });
}
