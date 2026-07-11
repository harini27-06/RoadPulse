import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const engineers = await prisma.user.findMany({
      where: { role: { in: ["engineer", "executive_engineer"] } },
      select: { id: true, name: true, email: true, role: true, district: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(engineers);
  } catch {
    return NextResponse.json({ error: "Failed to fetch engineers" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, district } = (await request.json()) as { id: string; district: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const user = await prisma.user.update({
      where: { id },
      data: { district: district?.trim() || null },
      select: { id: true, name: true, email: true, role: true, district: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, district } = (await request.json()) as {
      name: string; email: string; password: string; role?: string; district?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const assignedRole = role === "executive_engineer" ? "executive_engineer" : "engineer";
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: assignedRole, district: district ?? null },
      select: { id: true, name: true, email: true, role: true, district: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create engineer" }, { status: 500 });
  }
}
