import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [complaints, total, pending, inProgress, resolved, rejected, waitlisted] =
      await Promise.all([
        prisma.complaint.findMany({
          where: { primary_complaint_id: null },
          orderBy: { created_at: "desc" },
          include: {
            user: { select: { name: true } },
            _count: { select: { duplicates: true } },
          },
        }),
        prisma.complaint.count({ where: { primary_complaint_id: null } }),
        prisma.complaint.count({ where: { primary_complaint_id: null, status: "Pending" } }),
        prisma.complaint.count({ where: { primary_complaint_id: null, status: "In Progress" } }),
        prisma.complaint.count({ where: { primary_complaint_id: null, status: "Resolved" } }),
        prisma.complaint.count({ where: { primary_complaint_id: null, status: "Returned" } }),
        prisma.complaint.count({ where: { primary_complaint_id: null, status: "Waitlisted" } }),
      ]);

    const shaped = complaints.map(({ user, _count, ...c }) => ({
      ...c,
      user_name: user?.name ?? null,
      duplicate_count: _count.duplicates,
    }));

    return NextResponse.json({
      complaints: shaped,
      stats: { total, pending, inProgress, resolved, returned: rejected, waitlisted },
    });
  } catch (e) {
    console.error("[admin/complaints] GET error:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
