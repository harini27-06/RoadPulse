import { NextRequest, NextResponse } from "next/server";
import exifr from "exifr";
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

// ── OCR: scan raw image bytes for coordinate text ──────────────────────────
// Reads printable ASCII runs from the image binary — works for:
//   PNG tEXt/iTXt chunks, JPEG COM segments, XMP metadata, and any app
//   that stores coords as plain text in the file (e.g. GPS camera overlays).
// Supported formats:
//   12.9716° N, 77.5946° E  |  12.9716, 77.5946
//   Lat: 12.9716 Lon: 77.5946  |  N 12° 58' 17" E 77° 35' 40"

function isValidCoord(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && !(lat === 0 && lon === 0);
}

function parseCoordText(text: string): { latitude: number; longitude: number } | null {
  // Pattern 1: decimal + N/S E/W  e.g. 12.9716° N, 77.5946° E
  const m1 = text.match(/([+-]?\d{1,3}\.\d+)\s*[°o]?\s*([NS])[,\s]+([+-]?\d{1,3}\.\d+)\s*[°o]?\s*([EW])/i);
  if (m1) {
    const lat = parseFloat(m1[1]) * (m1[2].toUpperCase() === "S" ? -1 : 1);
    const lon = parseFloat(m1[3]) * (m1[4].toUpperCase() === "W" ? -1 : 1);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }

  // Pattern 2: labeled  e.g. Lat: 12.9716  Lon: 77.5946
  const m2 = text.match(/[Ll]at[itude]*[:\s]+([+-]?\d{1,3}\.\d+)[,\s]+[Ll]on[gitude]*[:\s]+([+-]?\d{1,3}\.\d+)/);
  if (m2) {
    const lat = parseFloat(m2[1]), lon = parseFloat(m2[2]);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }

  // Pattern 3: plain decimal pair with 4+ decimal places  e.g. 12.971600, 77.594600
  const m3 = text.match(/([+-]?\d{1,3}\.\d{4,})[,\s]+([+-]?\d{1,3}\.\d{4,})/);
  if (m3) {
    const lat = parseFloat(m3[1]), lon = parseFloat(m3[2]);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }

  // Pattern 4: DMS  e.g. N 12° 58' 17" E 77° 35' 40"
  const m4 = text.match(/([NS])\s*(\d{1,3})[°o]\s*(\d{1,2})'\s*([\d.]+)"\s*([EW])\s*(\d{1,3})[°o]\s*(\d{1,2})'\s*([\d.]+)"/i);
  if (m4) {
    const toDecimal = (d: number, m: number, s: number, dir: string) => {
      const v = d + m / 60 + s / 3600;
      return (dir === "S" || dir === "W") ? -v : v;
    };
    const lat = toDecimal(+m4[2], +m4[3], +m4[4], m4[1]);
    const lon = toDecimal(+m4[6], +m4[7], +m4[8], m4[5]);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
  }

  return null;
}

async function parseLocationFromOCR(buffer: Buffer, requestUrl: string): Promise<LocationData | null> {
  try {
    // Extract printable ASCII runs from binary — covers PNG tEXt, JPEG COM, XMP
    const ascii = buffer.toString("latin1").replace(/[^\x20-\x7E\n]/g, " ");
    const coords = parseCoordText(ascii);
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

    // 1. Try EXIF GPS (geotagged JPEG from phone camera)
    // 2. Fall back to binary text scan (coords stored as text in PNG/JPEG metadata)
    let location = await parseLocationFromExif(buffer, request.url);
    if (!location) {
      location = await parseLocationFromOCR(buffer, request.url);
    }

    // ── Call YOLO ──────────────────────────────────────────────────────────
    const yoloForm = new FormData();
    yoloForm.append("file", file);

    async function callYolo(): Promise<Response> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), YOLO_TIMEOUT_MS);
      try {
        return await fetch(`${YOLO_URL}/upload`, { method: "POST", body: yoloForm, signal: controller.signal });
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
        try {
          const retryForm = new FormData();
          retryForm.append("file", file);
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), YOLO_TIMEOUT_MS);
          try {
            yoloResponse = await fetch(`${YOLO_URL}/upload`, { method: "POST", body: retryForm, signal: controller2.signal });
          } finally {
            clearTimeout(timeoutId2);
          }
        } catch {
          return NextResponse.json({ error: "Detection service is starting up. Please wait a moment and try again." }, { status: 503 });
        }
      } else {
        return NextResponse.json({ error: "Detection service is unavailable. Please try again later." }, { status: 503 });
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
