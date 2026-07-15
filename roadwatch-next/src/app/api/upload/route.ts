import { NextRequest, NextResponse } from "next/server";
import exifr from "exifr";
import Tesseract from "tesseract.js";
import type { LocationData } from "@/types";

const YOLO_URL = process.env.YOLO_SERVICE_URL ?? "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const YOLO_TIMEOUT_MS = 90000;

// ── EXIF GPS extraction ────────────────────────────────────────────────────
async function parseLocationFromExif(buffer: Buffer, requestUrl: string): Promise<LocationData | null> {
  try {
    const gps = await exifr.gps(buffer);
    if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") return null;
    return await reverseGeocode(gps.latitude, gps.longitude, requestUrl, "EXIF");
  } catch {
    return null;
  }
}

// ── OCR coordinate extraction ──────────────────────────────────────────────
// Matches coordinates burned as text into the image, e.g.:
//   12.9716° N, 77.5946° E
//   12.9716, 77.5946
//   N 12° 58' 17.76"  E 77° 35' 40.56"
//   Lat: 12.9716  Lon: 77.5946
const COORD_PATTERNS = [
  // Decimal with degree symbol + N/S E/W  e.g. 12.9716° N, 77.5946° E
  /([+-]?\d{1,3}\.\d+)\s*°?\s*([NS])[,\s]+([+-]?\d{1,3}\.\d+)\s*°?\s*([EW])/i,
  // Plain decimal pair  e.g. 12.9716, 77.5946  or  12.9716 77.5946
  /([+-]?\d{1,3}\.\d{4,})\s*[,\s]\s*([+-]?\d{1,3}\.\d{4,})/,
  // Labeled  e.g. Lat: 12.9716  Lon: 77.5946
  /[Ll]at[itude]*[:\s]+([+-]?\d{1,3}\.\d+)[,\s]+[Ll]on[gitude]*[:\s]+([+-]?\d{1,3}\.\d+)/,
  // DMS  e.g. N 12° 58' 17.76" E 77° 35' 40.56"
  /([NS])\s*(\d{1,3})°\s*(\d{1,2})'\s*([\d.]+)"\s*([EW])\s*(\d{1,3})°\s*(\d{1,2})'\s*([\d.]+)"/i,
];

function dmsToDecimal(deg: number, min: number, sec: number, dir: string): number {
  const d = deg + min / 60 + sec / 3600;
  return (dir === "S" || dir === "W") ? -d : d;
}

function parseCoordText(text: string): { latitude: number; longitude: number } | null {
  // Pattern 1: decimal + N/S E/W
  const m1 = text.match(COORD_PATTERNS[0]);
  if (m1) {
    const lat = parseFloat(m1[1]) * (m1[2].toUpperCase() === "S" ? -1 : 1);
    const lon = parseFloat(m1[3]) * (m1[4].toUpperCase() === "W" ? -1 : 1);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }
  // Pattern 2: plain decimal pair
  const m2 = text.match(COORD_PATTERNS[1]);
  if (m2) {
    const lat = parseFloat(m2[1]);
    const lon = parseFloat(m2[2]);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }
  // Pattern 3: labeled
  const m3 = text.match(COORD_PATTERNS[2]);
  if (m3) {
    const lat = parseFloat(m3[1]);
    const lon = parseFloat(m3[2]);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }
  // Pattern 4: DMS
  const m4 = text.match(COORD_PATTERNS[3]);
  if (m4) {
    const lat = dmsToDecimal(+m4[2], +m4[3], +m4[4], m4[1]);
    const lon = dmsToDecimal(+m4[6], +m4[7], +m4[8], m4[5]);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }
  return null;
}

function isValidCoord(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && !(lat === 0 && lon === 0);
}

async function parseLocationFromOCR(buffer: Buffer, requestUrl: string): Promise<LocationData | null> {
  try {
    const { data: { text } } = await Tesseract.recognize(
      buffer,
      "eng",
      { errorHandler: () => {} }
    );
    if (!text?.trim()) return null;
    const coords = parseCoordText(text);
    if (!coords) return null;
    return await reverseGeocode(coords.latitude, coords.longitude, requestUrl, "OCR");
  } catch {
    return null;
  }
}

// ── Shared reverse geocode ─────────────────────────────────────────────────
async function reverseGeocode(
  lat: number, lon: number, requestUrl: string, source: "EXIF" | "OCR"
): Promise<LocationData> {
  try {
    const geo = await fetch(new URL(`/api/geocode?lat=${lat}&lon=${lon}`, requestUrl));
    const geoData = await geo.json() as { display_name?: string };
    return { latitude: lat, longitude: lon, address: geoData.display_name ?? undefined, source };
  } catch {
    return { latitude: lat, longitude: lon, source };
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

    // 1. Try EXIF GPS first (fast, metadata-based)
    // 2. Fall back to OCR if no EXIF GPS found (reads coordinates burned as text into image)
    let location = await parseLocationFromExif(buffer, request.url);
    if (!location) {
      location = await parseLocationFromOCR(buffer, request.url);
    }

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
