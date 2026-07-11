import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "executive_engineer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Match engineer name against accidents table (partial, case-insensitive)
  const accidentData = await prisma.accident.findFirst({
    where: { executive_engineer: { contains: user.name, mode: "insensitive" } },
  });

  // Match complaints by engineer name (case-insensitive) since assignment stores the name from accidents table
  const [complaints, total, pending, inProgress, resolved, returned, waitlisted] =
    await Promise.all([
      prisma.complaint.findMany({
        where: { assigned_engineer: { contains: user.name, mode: "insensitive" } },
        orderBy: { created_at: "desc" },
      }),
      prisma.complaint.count({ where: { assigned_engineer: { contains: user.name, mode: "insensitive" } } }),
      prisma.complaint.count({ where: { assigned_engineer: { contains: user.name, mode: "insensitive" }, status: "Pending" } }),
      prisma.complaint.count({ where: { assigned_engineer: { contains: user.name, mode: "insensitive" }, status: "In Progress" } }),
      prisma.complaint.count({ where: { assigned_engineer: { contains: user.name, mode: "insensitive" }, status: "Resolved" } }),
      prisma.complaint.count({ where: { assigned_engineer: { contains: user.name, mode: "insensitive" }, status: "Returned" } }),
      prisma.complaint.count({ where: { assigned_engineer: { contains: user.name, mode: "insensitive" }, status: "Waitlisted" } }),
    ]);

  return NextResponse.json({
    accidentData,
    complaints,
    stats: { total, pending, inProgress, resolved, returned, waitlisted },
  });
}
