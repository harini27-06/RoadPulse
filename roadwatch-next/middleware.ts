import { NextRequest, NextResponse } from "next/server";
import { AuthPayload } from "./src/types";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/chatbot", "/complaints"]);
const PROTECTED_PATHS = ["/dashboard", "/analytics", "/budget", "/risk-predictor", "/emergency", "/profile"];

// Edge-compatible JWT verify using Web Crypto API (no jsonwebtoken)
async function verifyTokenEdge(token: string): Promise<AuthPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const [headerB64, payloadB64, sigB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );

    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin") && !pathname.startsWith("/api/engineer"))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("rw_token")?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

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
