import { NextRequest, NextResponse } from "next/server";
import * as exifr from "exifr";
import type { LocationData } from "@/types";

const YOLO_URL = process.env.YOLO_SERVICE_URL ?? "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const YOLO_TIMEOUT_MS = 60000;

async function parseLocationFromExif(buffer: Buffer, requestUrl: string): Promise<LocationData | null> {
  try {
    const gps = await exifr.gps(buffer);
    if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") return null;

    try {
      const geo = await fetch(new URL(`/api/geocode?lat=${gps.latitude}&lon=${gps.longitude}`, requestUrl));
      const geoData = await geo.json();
      return {
        latitude: gps.latitude,
        longitude: gps.longitude,
        address: geoData.display_name ?? undefined,
        source: "EXIF",
      };
    } catch {
      return { latitude: gps.latitude, longitude: gps.longitude, source: "EXIF" };
    }
  } catch {
    return null;
  }
}

async function wakeUpYolo(): Promise<void> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    await fetch(`${YOLO_URL}/health`, { signal: controller.signal });
  } catch { /* ignore — just a warm-up ping */ }
}

export async function HEAD() {
  // Fire wake-up ping to Render in background
  wakeUpYolo();
  return new Response(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF images are supported." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract EXIF location (fast, no OCR)
    const location = await parseLocationFromExif(buffer, request.url);

    // Call YOLO with timeout
    const yoloForm = new FormData();
    yoloForm.append("file", file);

    // Call YOLO with timeout — retry once if first attempt times out (Render cold start)
    async function callYolo(): Promise<Response> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), YOLO_TIMEOUT_MS);
      try {
        const res = await fetch(`${YOLO_URL}/upload`, {
          method: "POST",
          body: yoloForm,
          signal: controller.signal,
        });
        return res;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    let yoloResponse: Response;
    try {
      yoloResponse = await callYolo();
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      if (isTimeout) {
        // Retry once — Render may need more time on cold start
        try {
          // Re-create FormData for retry (consumed on first attempt)
          const retryForm = new FormData();
          retryForm.append("file", file);
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), YOLO_TIMEOUT_MS);
          try {
            yoloResponse = await fetch(`${YOLO_URL}/upload`, {
              method: "POST",
              body: retryForm,
              signal: controller2.signal,
            });
          } finally {
            clearTimeout(timeoutId2);
          }
        } catch {
          return NextResponse.json(
            { error: "Detection service is starting up. Please wait a moment and try again." },
            { status: 503 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Detection service is unavailable. Please try again later." },
          { status: 503 }
        );
      }
    }

    if (!yoloResponse.ok) {
      const text = await yoloResponse.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `Detection failed: ${text}` }, { status: yoloResponse.status });
    }

    const result = await yoloResponse.json();

    return NextResponse.json({
      issue: result.issue,
      confidence: result.confidence,
      image_url: result.image_url ?? null,
      location,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Failed to analyze image. Please try again." }, { status: 500 });
  }
}
