import { NextRequest, NextResponse } from "next/server";
import * as exifr from "exifr";
import { createWorker } from "tesseract.js";
import type { LocationData } from "@/types";

const YOLO_URL = process.env.YOLO_SERVICE_URL!;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 NEW UPLOAD ROUTE RUNNING - b47a0e1");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only JPEG, PNG, WebP and GIF images are supported.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 10 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    function extractCoordinatesFromText(text: string) {
      const normalized = text
        .replace(/[°º,]/g, " ")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const latMatch = normalized.match(
        /(?:lat(?:itude)?[:\s]*)([-+]?\d+(?:\.\d+)?)/i
      );

      const lonMatch = normalized.match(
        /(?:lon(?:g(?:itude)?)?[:\s]*)([-+]?\d+(?:\.\d+)?)/i
      );

      if (latMatch && lonMatch) {
        return {
          latitude: parseFloat(latMatch[1]),
          longitude: parseFloat(lonMatch[1]),
        };
      }

      const dirLat = normalized.match(
        /([-+]?\d+(?:\.\d+)?)\s*([NS])/i
      );

      const dirLon = normalized.match(
        /([-+]?\d+(?:\.\d+)?)\s*([EW])/i
      );

      if (dirLat && dirLon) {
        return {
          latitude:
            parseFloat(dirLat[1]) *
            (dirLat[2].toUpperCase() === "S" ? -1 : 1),

          longitude:
            parseFloat(dirLon[1]) *
            (dirLon[2].toUpperCase() === "W" ? -1 : 1),
        };
      }

      return null;
    }

    async function parseLocation(): Promise<LocationData | null> {
      try {
        const gps = await exifr.gps(buffer);

        if (
          gps &&
          typeof gps.latitude === "number" &&
          typeof gps.longitude === "number"
        ) {
          const geo = await fetch(
            new URL(
              `/api/geocode?lat=${gps.latitude}&lon=${gps.longitude}`,
              request.url
            )
          );

          const geoData = await geo.json();

          return {
            latitude: gps.latitude,
            longitude: gps.longitude,
            address: geoData.display_name,
            source: "EXIF",
          };
        }

        console.log("No EXIF GPS found. Running OCR...");

        const worker = await createWorker("eng");

        const { data } = await worker.recognize(buffer);

        await worker.terminate();

        const coords = extractCoordinatesFromText(data.text);

        if (!coords) return null;

        const geo = await fetch(
          new URL(
            `/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`,
            request.url
          )
        );

        const geoData = await geo.json();

        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: geoData.display_name,
          source: "OCR",
        };
      } catch (err) {
        console.error("Location parsing failed:", err);
        return null;
      }
    }

    const location = await parseLocation();

    const yoloForm = new FormData();

    yoloForm.append("file", file);

    console.log("Calling YOLO:", `${YOLO_URL}/upload`);

    let response: Response;

    try {
      response = await fetch(`${YOLO_URL}/upload`, {
        method: "POST",
        body: yoloForm,
      });
    } catch (err) {
      console.error("Cannot reach YOLO server:", err);

      return NextResponse.json(
        { error: "Cannot connect to YOLO server." },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const text = await response.text();

      console.error("YOLO returned:", text);

      return NextResponse.json(
        { error: text },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      issue: result.issue,
      confidence: result.confidence,
      location,
    });
  } catch (err) {
    console.error("Upload route error:", err);

    return NextResponse.json(
      {
        error: "Failed to analyze image.",
      },
      {
        status: 500,
      }
    );
  }
}