"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";

interface RiskData {
  road_name: string;
  district: string;
  risk_percentage: number;
  urgency: string;
  accidents: number;
  complaints: number;
}

export default function TopRoadsTable() {
  const [roads, setRoads] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopRoads = async () => {
      try {
        const response = await fetch("/api/risk/top-roads");
        if (!response.ok) throw new Error("Failed to fetch top roads");
        const data = await response.json();
        setRoads(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTopRoads();
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getRiskBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Top 20 High-Risk Roads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : roads.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No roads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">ROAD</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">DISTRICT</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">RISK %</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">URGENCY</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">ACCIDENTS</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">COMPLAINTS</th>
                </tr>
              </thead>
              <tbody>
                {roads.map((road, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {road.road_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{road.district}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-xs">
                          <div
                            className={`h-1.5 rounded-full ${getRiskBarColor(
                              road.risk_percentage
                            )}`}
                            style={{ width: `${road.risk_percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 w-12 text-right">
                          {road.risk_percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getUrgencyColor(road.urgency)}>
                        {road.urgency}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {road.accidents.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {road.complaints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
