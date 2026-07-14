import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [complaints, total, pending, inProgress, resolved, rejected, waitlisted] =
      await Promise.all([
        prisma.complaint.findMany({ orderBy: { created_at: "desc" } }),
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: "Pending" } }),
        prisma.complaint.count({ where: { status: "In Progress" } }),
        prisma.complaint.count({ where: { status: "Resolved" } }),
        prisma.complaint.count({ where: { status: "Returned" } }),
        prisma.complaint.count({ where: { status: "Waitlisted" } }),
      ]);

    return NextResponse.json({
      complaints,
      stats: { total, pending, inProgress, resolved, returned: rejected, waitlisted },
    });
  } catch (e) {
    console.error("[admin/complaints] GET error:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
