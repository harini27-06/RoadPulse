import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const VALID_STATUSES = ["Pending", "In Progress", "Resolved", "Returned", "Waitlisted"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || (user.role !== "engineer" && user.role !== "executive_engineer")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify this complaint is assigned to this engineer (matched by name)
  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assignedName = (existing.assigned_engineer ?? "").trim().toLowerCase();
  const userName = (user.name ?? "").trim().toLowerCase();
  const isAssigned = assignedName === userName || assignedName.includes(userName) || userName.includes(assignedName);
  if (!isAssigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    status?: string;
    resolved_image_url?: string;
    returned_message?: string | null;
    repair_notes?: string | null;
  };

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.resolved_image_url !== undefined && { resolved_image_url: body.resolved_image_url }),
      ...(body.returned_message !== undefined && { returned_message: body.returned_message }),
      ...(body.repair_notes !== undefined && { repair_notes: body.repair_notes }),
    },
  });

  // Sync all duplicate complaints linked to this primary
  const updateData = {
    ...(body.status && { status: body.status }),
    ...(body.resolved_image_url !== undefined && { resolved_image_url: body.resolved_image_url }),
    ...(body.returned_message !== undefined && { returned_message: body.returned_message }),
  };
  if (Object.keys(updateData).length > 0) {
    await prisma.complaint.updateMany({
      where: { primary_complaint_id: id },
      data: updateData,
    });
  }

  // Notify complaint owner on status change
  if (body.status && body.status !== existing.status && complaint.user_id) {
    await prisma.notification.create({
      data: {
        user_id: complaint.user_id,
        title: `Complaint ${body.status}`,
        message: `Your ${complaint.issue_type} complaint status changed to "${body.status}".${
          body.status === "Returned" && body.returned_message ? ` Reason: ${body.returned_message}` : ""
        }`,
        type: body.status === "Resolved" ? "success" : body.status === "Returned" ? "warning" : "info",
      },
    });
  }

  return NextResponse.json(complaint);
}
