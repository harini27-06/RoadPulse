import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { UserRole } from "@/types";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`signup:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
    }

    const { name, email, password, role, district } = (await request.json()) as {
      name: string; email: string; password: string; role?: string; district?: string;
    };

    const sanitizedName  = name?.trim();
    const sanitizedEmail = email?.trim().toLowerCase();

    if (!sanitizedName || !sanitizedEmail || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (sanitizedName.length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const ALLOWED_ROLES = ["user", "admin", "executive_engineer"];
    const userRole = ALLOWED_ROLES.includes(role ?? "") ? role! : "user";

    const user = await prisma.user.create({
      data: { name: sanitizedName, email: sanitizedEmail, password: hashed, role: userRole, district: userRole === "executive_engineer" ? (district ?? null) : null },
    });

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role as UserRole });

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, { status: 201 });

    response.cookies.set("rw_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
