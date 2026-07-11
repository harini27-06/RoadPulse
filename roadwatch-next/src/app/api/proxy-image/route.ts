import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("rw_token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  try {
    // Local /uploads/* — read directly from filesystem
    if (url.startsWith("/uploads/")) {
      const filePath = join(process.cwd(), "public", url);
      const buffer = await readFile(filePath);
      const ext = url.split(".").pop()?.toLowerCase() ?? "jpg";
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return new NextResponse(buffer, {
        headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" },
      });
    }

    // External URL — proxy fetch
    const res = await fetch(url, { headers: { "User-Agent": "RoadPulse/1.0" } });
    if (!res.ok) return new NextResponse("Failed to fetch image", { status: 502 });
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
