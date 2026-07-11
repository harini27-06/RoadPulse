"use client";

import { useState } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationData } from "@/types";
import { getGPSLocation, reverseGeocode } from "@/services/location.service";

interface LocationInputProps {
  onSubmit: (location: LocationData) => void;
}

export function LocationInput({ onSubmit }: LocationInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [manualAddress, setManualAddress] = useState("");

  const handleGPS = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getGPSLocation();
      onSubmit(location);
    } catch {
      setError("Could not get GPS location. Please enter manually.");
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) {
      setError("Please enter valid latitude and longitude.");
      return;
    }
    setLoading(true);
    const address = manualAddress || (await reverseGeocode(lat, lon));
    setLoading(false);
    onSubmit({ latitude: lat, longitude: lon, address });
  };

  return (
    <div className="mt-2 space-y-2">
      {!manualMode ? (
        <div className="flex flex-col gap-2">
          <Button onClick={handleGPS} disabled={loading} size="sm" className="gap-2 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Use Current GPS Location
          </Button>
          <Button variant="outline" size="sm" onClick={() => setManualMode(true)} className="w-full">
            <MapPin className="h-4 w-4 mr-1" />
            Enter Manually
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Latitude (e.g. 28.6139)"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="text-xs"
            />
            <Input
              placeholder="Longitude (e.g. 77.2090)"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              className="text-xs"
            />
          </div>
          <Input
            placeholder="Address (optional)"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleManualSubmit} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Location"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setManualMode(false)}>
              Back
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
