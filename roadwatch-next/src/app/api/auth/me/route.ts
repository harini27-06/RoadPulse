import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  if (!token) return NextResponse.json(null, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json(null, { status: 401 });

  return NextResponse.json(payload);
}
