"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface RoadRisk {
  road_name: string;
  district: string;
  risk_percentage: number;
  urgency: string;
}

interface RiskStats {
  total_roads: number;
  critical_roads: number;
  high_risk_roads: number;
  avg_risk: number;
  top5: RoadRisk[];
}

export default function RiskStatistics() {
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [top5, setTop5] = useState<RoadRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/risk/map-data");
        if (!response.ok) throw new Error("Failed to fetch data");
        const roads = await response.json();

        const critical = roads.filter((r: any) => r.urgency === "Critical").length;
        const high = roads.filter((r: any) => r.urgency === "High").length;
        const avg = roads.reduce((sum: number, r: any) => sum + r.risk_percentage, 0) / roads.length || 0;

        setTop5(roads.slice(0, 5));
        setStats({
          total_roads: roads.length,
          critical_roads: critical,
          high_risk_roads: high,
          avg_risk: avg,
          top5: roads.slice(0, 5),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Roads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Total Roads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total_roads}
            </div>
            <p className="text-xs text-gray-500 mt-1">Under surveillance</p>
          </CardContent>
        </Card>

        {/* Critical Roads */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Critical Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.critical_roads}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {stats.total_roads > 0 
                ? Math.round((stats.critical_roads / stats.total_roads) * 100) 
                : 0}% of all roads
            </p>
          </CardContent>
        </Card>

        {/* High Risk Roads */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.high_risk_roads}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        {/* Average Risk */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Average Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(stats.avg_risk)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Network-wide</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 At-Risk Roads */}
      {top5.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Top 5 Roads at Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Road</th>
                  <th className="text-left px-4 py-2">District</th>
                  <th className="text-left px-4 py-2">Risk</th>
                  <th className="text-left px-4 py-2">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((road, i) => {
                  const urgencyColor =
                    road.urgency === "Critical" ? "bg-red-100 text-red-700" :
                    road.urgency === "High"     ? "bg-orange-100 text-orange-700" :
                    road.urgency === "Medium"   ? "bg-yellow-100 text-yellow-700" :
                                                  "bg-green-100 text-green-700";
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{road.road_name}</td>
                      <td className="px-4 py-3 text-gray-500">{road.district || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${road.risk_percentage}%`,
                                backgroundColor:
                                  road.risk_percentage >= 80 ? "#ef4444" :
                                  road.risk_percentage >= 60 ? "#f97316" :
                                  road.risk_percentage >= 40 ? "#eab308" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="font-semibold">{road.risk_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}>
                          {road.urgency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
