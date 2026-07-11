import { LocationData } from "@/types";

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
    if (!response.ok) return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const data = (await response.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

export async function getGPSLocation(): Promise<LocationData> {
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;
  const address = await reverseGeocode(latitude, longitude);
  return { latitude, longitude, address };
}
