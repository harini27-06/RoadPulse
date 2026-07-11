"use client";

import React, { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface RoadRisk {
  id: string;
  road_name: string;
  district: string;
  risk_percentage: number;
  urgency: string;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  breakdown: {
    image_analysis: number;
    accident_impact: number;
    complaint_impact: number;
    temporal_impact: number;
  };
  factors: Record<string, unknown>;
  complaint_count: number;
}

interface RiskMapProps {
  onRoadSelect?: (road: RoadRisk) => void;
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  CHENNAI: [13.0827, 80.2707], COIMBATORE: [11.0168, 76.9558], MADURAI: [9.9252, 78.1198],
  TIRUCHIRAPPALLI: [10.7905, 78.7047], SALEM: [11.6643, 78.1460], TIRUNELVELI: [8.7139, 77.7567],
  VELLORE: [12.9165, 79.1325], ERODE: [11.3410, 77.7172], TIRUPPUR: [11.1085, 77.3411],
  DINDIGUL: [10.3624, 77.9695], THANJAVUR: [10.7870, 79.1378], RANIPET: [12.9279, 79.3329],
  KANCHEEPURAM: [12.8185, 79.6947], CHENGALPATTU: [12.6921, 79.9765], VILLUPURAM: [11.9401, 79.4861],
  CUDDALORE: [11.7480, 79.7714], NAGAPATTINAM: [10.7672, 79.8449], TIRUVARUR: [10.7726, 79.6366],
  MAYILADUTHURAI: [11.1015, 79.6516], ARIYALUR: [11.1400, 79.0767], PERAMBALUR: [11.2342, 78.8808],
  KARUR: [10.9601, 78.0766], NAMAKKAL: [11.2189, 78.1674], DHARMAPURI: [12.1277, 78.1580],
  KRISHNAGIRI: [12.5186, 78.2137], TIRUPATTUR: [12.4967, 78.5726], KALLAKURICHI: [11.7380, 78.9580],
  TENKASI: [8.9597, 77.3152], VIRUDHUNAGAR: [9.5851, 77.9624], RAMANATHAPURAM: [9.3762, 78.8309],
  SIVAGANGA: [9.8477, 78.4800], PUDUKKOTTAI: [10.3797, 78.8201], THENI: [10.0104, 77.4770],
  NILGIRIS: [11.4916, 76.7337], KANNIYAKUMARI: [8.0883, 77.5385], THOOTHUKUDI: [8.7642, 78.1348],
  TIRUVANNAMALAI: [12.2253, 79.0747], TIRUVALLUR: [13.1435, 79.9088],
};

const DEFAULT_CENTER: [number, number] = [11.1271, 78.6569];

const RiskMap: React.FC<RiskMapProps> = ({ onRoadSelect }) => {
  const [roads, setRoads] = useState<RoadRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrgency, setSelectedUrgency] = useState<string | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/risk/map-data")
      .then((r) => r.json())
      .then((data) => setRoads(data))
      .catch((e) => console.error("Error fetching roads:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !containerRef.current) return;

    // Destroy existing map instance before creating a new one
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!containerRef.current) return;

      // Clear any leftover Leaflet init flag on the container
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (containerRef.current as any)._leaflet_id = undefined;

      const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 7);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const plottable = roads.filter(
        (r) => (r.latitude && r.longitude) || DISTRICT_COORDS[r.district?.toUpperCase()]
      );

      const getRiskColor = (risk: number) => {
        if (risk >= 80) return "#ef4444";
        if (risk >= 60) return "#f97316";
        if (risk >= 40) return "#eab308";
        return "#22c55e";
      };

      plottable.forEach((road) => {
        const coords: [number, number] =
          road.latitude && road.longitude
            ? [road.latitude, road.longitude]
            : DISTRICT_COORDS[road.district?.toUpperCase()] ?? DEFAULT_CENTER;

        const radius = 8 + (road.risk_percentage / 100) * 12;
        const color = getRiskColor(road.risk_percentage);

        const circle = L.circleMarker(coords, {
          radius,
          fillColor: color,
          color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.7,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-size:13px;min-width:160px">
            <b>${road.road_name}</b><br/>
            <span style="color:#666">${road.district}</span><br/><br/>
            <b>Risk:</b> <span style="color:#ef4444">${road.risk_percentage}%</span><br/>
            <b>Urgency:</b> ${road.urgency}<br/>
            <b>Complaints:</b> ${road.complaint_count}
          </div>
        `);

        circle.on("click", () => onRoadSelect?.(road));
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, roads, onRoadSelect]);

  const filteredCount = (urgency: string) => roads.filter((r) => r.urgency === urgency).length;

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      {/* Urgency Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedUrgency(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            selectedUrgency === null ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All ({roads.length})
        </button>
        {["Critical", "High", "Medium", "Low"].map((urgency) => {
          const colorClass =
            urgency === "Critical" ? "bg-red-100 text-red-800" :
            urgency === "High"     ? "bg-orange-100 text-orange-800" :
            urgency === "Medium"   ? "bg-yellow-100 text-yellow-800" :
                                     "bg-green-100 text-green-800";
          return (
            <button
              key={urgency}
              onClick={() => setSelectedUrgency(urgency === selectedUrgency ? null : urgency)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selectedUrgency === urgency ? "ring-2 ring-offset-2" : "hover:opacity-80"
              } ${colorClass}`}
            >
              {urgency} ({filteredCount(urgency)})
            </button>
          );
        })}
      </div>

      {/* Map container — Leaflet mounts directly into this div */}
      <div
        ref={containerRef}
        style={{ height: "400px", width: "100%" }}
        className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
      />

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { color: "bg-red-500",    label: "Critical (80+)" },
          { color: "bg-orange-500", label: "High (60-79)" },
          { color: "bg-yellow-500", label: "Medium (40-59)" },
          { color: "bg-green-500",  label: "Low (<40)" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${color}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">• Circle size represents risk magnitude</p>
    </div>
  );
};

export default RiskMap;
