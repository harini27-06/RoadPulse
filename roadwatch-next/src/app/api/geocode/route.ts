import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "RoadWatch/1.0 (road-monitoring-app)",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ display_name: `${lat}, ${lon}` });
    }

    const data = await response.json() as { display_name?: string };
    return NextResponse.json({ display_name: data.display_name ?? `${lat}, ${lon}` });
  } catch {
    return NextResponse.json({ display_name: `${lat}, ${lon}` });
  }
}
