"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { Complaint } from "@/types";
import { getIssueIcon } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "Pending":     "#ca8a04",
  "In Progress": "#2563eb",
  "Resolved":    "#16a34a",
  "Waitlisted":  "#9333ea",
  "Returned":    "#dc2626",
};

interface Props {
  complaints: Complaint[];
}

function markerIcon(L: typeof import("leaflet"), c: Complaint) {
  const color = STATUS_COLORS[c.status] ?? "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:14px;line-height:1">${getIssueIcon(c.issue_type)}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function markerPopup(c: Complaint) {
  const color = STATUS_COLORS[c.status] ?? "#6b7280";
  return `<div style="font-family:sans-serif;font-size:13px;line-height:1.6;min-width:180px">
    <div style="font-weight:700;font-size:14px;margin-bottom:6px">${getIssueIcon(c.issue_type)} ${c.issue_type}</div>
    <div style="margin-bottom:6px"><span style="background:${color};color:#fff;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">${c.status}</span></div>
    <div style="color:#555;font-size:12px;margin-top:4px">📍 ${c.address ?? `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`}</div>
    ${c.description ? `<div style="color:#444;font-size:12px;margin-top:4px">${c.description}</div>` : ""}
    <div style="color:#999;font-size:11px;margin-top:6px">${c.confidence.toFixed(1)}% confidence</div>
  </div>`;
}

function addMarkers(L: typeof import("leaflet"), map: LeafletMap, complaints: Complaint[]): Marker[] {
  const markers: Marker[] = [];
  const valid = complaints.filter((c) => c.latitude && c.longitude);
  valid.forEach((c) => {
    const m = L.marker([c.latitude, c.longitude], { icon: markerIcon(L, c) })
      .bindPopup(markerPopup(c))
      .addTo(map);
    markers.push(m);
  });
  if (valid.length === 1) {
    map.setView([valid[0].latitude, valid[0].longitude], 14);
  } else if (valid.length > 1) {
    map.fitBounds(
      L.latLngBounds(valid.map((c) => [c.latitude, c.longitude] as [number, number])),
      { padding: [50, 50] }
    );
  }
  return markers;
}

export function ComplaintsMap({ complaints }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Init map — cancelled flag prevents StrictMode double-init
  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      markersRef.current = addMarkers(L, map, complaints);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh markers when complaints change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    import("leaflet").then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = addMarkers(L, map, complaints);
    });
  }, [complaints]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
