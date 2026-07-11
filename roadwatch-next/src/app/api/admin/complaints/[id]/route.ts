import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(complaint);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    returned_message?: string | null;
    assigned_engineer?: string | null;
    assigned_engineer_id?: string | null;
    scheduled_date?: string | null;
    scheduled_end_date?: string | null;
    repair_notes?: string | null;
  };

  // Auto-resolve assigned_engineer_id from name if assigning
  let resolvedEngineerId = body.assigned_engineer_id;
  if (body.assigned_engineer && resolvedEngineerId === undefined) {
    const engineerUser = await prisma.user.findFirst({
      where: {
        role: { in: ["engineer", "executive_engineer"] },
        name: { contains: body.assigned_engineer, mode: "insensitive" },
      },
    });
    resolvedEngineerId = engineerUser?.id ?? null;
  }
  if (body.assigned_engineer === null) resolvedEngineerId = null;

  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.returned_message !== undefined && { returned_message: body.returned_message }),
      ...(body.assigned_engineer !== undefined && { assigned_engineer: body.assigned_engineer }),
      ...(resolvedEngineerId !== undefined && { assigned_engineer_id: resolvedEngineerId }),
      ...(body.scheduled_date !== undefined && {
        scheduled_date: body.scheduled_date ? new Date(body.scheduled_date) : null,
      }),
      ...(body.scheduled_end_date !== undefined && {
        scheduled_end_date: body.scheduled_end_date ? new Date(body.scheduled_end_date) : null,
      }),
      ...(body.repair_notes !== undefined && { repair_notes: body.repair_notes }),
    },
  });

  // Sync status and returned_message to duplicates
  const syncData = {
    ...(body.status !== undefined && { status: body.status }),
    ...(body.returned_message !== undefined && { returned_message: body.returned_message }),
  };
  if (Object.keys(syncData).length > 0) {
    await prisma.complaint.updateMany({ where: { primary_complaint_id: id }, data: syncData });
  }

  // Notifications
  const notifs: { user_id: string; title: string; message: string; type: string }[] = [];

  // Notify engineer/EE when newly assigned — use the resolved ID stored on the complaint
  const assignedId = complaint.assigned_engineer_id;
  if (assignedId && assignedId !== existing.assigned_engineer_id) {
    notifs.push({
      user_id: assignedId,
      title: "Complaint Assigned to You",
      message: `Admin assigned a ${complaint.issue_type} complaint to you.${
        complaint.address ? ` Location: ${complaint.address}.` : ""
      }${
        complaint.scheduled_date
          ? ` Scheduled by: ${new Date(complaint.scheduled_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
          : ""
      }`,
      type: "assignment",
    });
  }

  // Notify complaint owner on status change
  if (body.status && body.status !== existing.status && complaint.user_id) {
    notifs.push({
      user_id: complaint.user_id,
      title: `Complaint ${body.status}`,
      message: `Your ${complaint.issue_type} complaint status changed to "${body.status}".${
        body.status === "Returned" && body.returned_message ? ` Reason: ${body.returned_message}` : ""
      }`,
      type: body.status === "Resolved" ? "success" : body.status === "Returned" ? "warning" : "info",
    });
  }

  if (notifs.length > 0) {
    await prisma.notification.createMany({ data: notifs });
  }

  return NextResponse.json(complaint);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.complaint.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
