import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./src/lib/auth";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/chatbot", "/complaints"]);
const PROTECTED_PATHS = ["/dashboard", "/analytics", "/budget", "/risk-predictor", "/emergency", "/profile"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin") && !pathname.startsWith("/api/engineer"))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("rw_token")?.value;
  const payload = token ? verifyToken(token) : null;

  if (pathname.startsWith("/admin")) {
    if (!payload) return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
    if (payload.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/api/admin")) {
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/engineer")) {
    if (!payload) return NextResponse.redirect(new URL("/login?redirect=/engineer", request.url));
    if (payload.role !== "engineer" && payload.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/api/engineer")) {
    if (!payload || (payload.role !== "engineer" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!payload) {
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/engineer/:path*", "/api/engineer/:path*", "/dashboard/:path*", "/analytics/:path*", "/budget/:path*", "/risk-predictor/:path*", "/emergency/:path*", "/profile/:path*"],
};
