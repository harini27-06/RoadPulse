import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PRIMARY_ONLY = { primary_complaint_id: null };

export async function GET() {
  try {
    const [complaints, total, pending, inProgress, resolved, rejected, waitlisted] =
      await Promise.all([
        prisma.complaint.findMany({ where: PRIMARY_ONLY, orderBy: { created_at: "desc" } }),
        prisma.complaint.count({ where: PRIMARY_ONLY }),
        prisma.complaint.count({ where: { ...PRIMARY_ONLY, status: "Pending" } }),
        prisma.complaint.count({ where: { ...PRIMARY_ONLY, status: "In Progress" } }),
        prisma.complaint.count({ where: { ...PRIMARY_ONLY, status: "Resolved" } }),
        prisma.complaint.count({ where: { ...PRIMARY_ONLY, status: "Returned" } }),
        prisma.complaint.count({ where: { ...PRIMARY_ONLY, status: "Waitlisted" } }),
      ]);

    return NextResponse.json({
      complaints,
      stats: { total, pending, inProgress, resolved, returned: rejected, waitlisted },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
