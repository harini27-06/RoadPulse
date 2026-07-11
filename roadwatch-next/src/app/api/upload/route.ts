import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import * as exifr from "exifr";
import { createWorker } from "tesseract.js";
import type { LocationData } from "@/types";

const YOLO_URL = process.env.YOLO_SERVICE_URL ?? "https://roadpulse-px08.onrender.com";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 10 MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const uploadPath = join(process.cwd(), "public", "uploads", filename);
    await writeFile(uploadPath, Buffer.from(bytes));
    const image_url = `/uploads/${filename}`;

    function extractCoordinatesFromText(text: string): { latitude: number; longitude: number } | null {
      const normalized = text
        .replace(/[°º,]/g, " ")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const latMatch = normalized.match(/(?:lat(?:itude)?[:\s]*)([-+]?\d{1,3}(?:\.\d+)?)/i);
      const lonMatch = normalized.match(/(?:lon(?:g(?:itude)?)?[:\s]*)([-+]?\d{1,3}(?:\.\d+)?)/i);
      if (latMatch && lonMatch) {
        return {
          latitude: parseFloat(latMatch[1]),
          longitude: parseFloat(lonMatch[1]),
        };
      }

      const dirLatMatch = normalized.match(/([-+]?\d{1,3}(?:\.\d+)?)\s*([NS])/i);
      const dirLonMatch = normalized.match(/([-+]?\d{1,3}(?:\.\d+)?)\s*([EW])/i);
      if (dirLatMatch && dirLonMatch) {
        const lat = parseFloat(dirLatMatch[1]) * (dirLatMatch[2].toUpperCase() === "S" ? -1 : 1);
        const lon = parseFloat(dirLonMatch[1]) * (dirLonMatch[2].toUpperCase() === "W" ? -1 : 1);
        return { latitude: lat, longitude: lon };
      }

      // Do not infer coordinates from arbitrary numbers. Only accept explicit
      // latitude/longitude labeled values or directional coordinates.
      return null;
    }

    async function parseImageLocation(): Promise<LocationData | null> {
      try {
        const buffer = Buffer.from(bytes);
        let gps = await exifr.gps(buffer as any);
        if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") {
          const parsed = await exifr.parse(buffer as any, ["GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef"]);
          if (
            parsed &&
            typeof parsed.GPSLatitude === "number" &&
            typeof parsed.GPSLongitude === "number"
          ) {
            gps = { latitude: parsed.GPSLatitude, longitude: parsed.GPSLongitude } as any;
          }
        }

        if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
          const geoUrl = new URL(`/api/geocode?lat=${gps.latitude}&lon=${gps.longitude}`, request.url);
          const geoResponse = await fetch(geoUrl);
          const geoData = (await geoResponse.json()) as { display_name?: string };
          console.log("Upload EXIF GPS found", gps.latitude, gps.longitude);
          return {
            latitude: gps.latitude,
            longitude: gps.longitude,
            address: geoData.display_name,
            source: "EXIF",
          };
        }

        console.log("Upload OCR: starting OCR text extraction");
        const tesseractWorkerPath = join(
          process.cwd(),
          "node_modules",
          "tesseract.js",
          "src",
          "worker-script",
          "node",
          "index.js"
        );
        const worker = await createWorker("eng", undefined, {
          workerPath: tesseractWorkerPath,
        });
        const { data } = await worker.recognize(buffer);
        await worker.terminate();

        const coords = extractCoordinatesFromText(data.text);
        if (!coords) {
          console.log("Upload OCR: no coordinates found in OCR text", data.text);
          return null;
        }

        const geoUrl = new URL(`/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`, request.url);
        const geoResponse = await fetch(geoUrl);
        const geoData = (await geoResponse.json()) as { display_name?: string };
        console.log("Upload OCR GPS found", coords.latitude, coords.longitude);
        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: geoData.display_name,
          source: "OCR",
        };
      } catch (err) {
        console.error("Failed to parse image location:", err);
        return null;
      }
    }

    const location = await parseImageLocation();

    // Forward to YOLO service for detection
    const yoloForm = new FormData();
    yoloForm.append("file", file);

    const response = await fetch(`${YOLO_URL}/upload`, {
      method: "POST",
      body: yoloForm,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "YOLO service error" }));
      return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const result = await response.json() as { issue: string; confidence: number };
    return NextResponse.json({ ...result, image_url, location: location ?? undefined });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
