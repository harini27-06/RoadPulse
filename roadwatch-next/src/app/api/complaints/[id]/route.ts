import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("rw_token")?.value;
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Users can only delete their own complaints; admins can delete any
    const complaint = await prisma.complaint.findUnique({ where: { id }, select: { user_id: true } });
    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.role !== "admin" && complaint.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.complaint.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete complaint" }, { status: 500 });
  }
}
