"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search, Loader2 } from "lucide-react";

interface RiskResult {
  road_name: string;
  district: string;
  risk_percentage: number;
  urgency: string;
  accidents: number;
  complaints: number;
}

export default function RiskPredictorSearch() {
  const [roadName, setRoadName] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/risk/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to predict risk");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
        <CardTitle>Predict Risk for Specific Road</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handlePredict} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter road name (e.g., Pollachi road)"
            value={roadName}
            onChange={(e) => setRoadName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={loading || !roadName}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Predict
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-4 gap-3 mt-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Road</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {result.road_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Risk %</p>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-bold text-red-600">
                  {result.risk_percentage}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRiskBarColor(
                      result.risk_percentage
                    )}`}
                    style={{ width: `${result.risk_percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Urgency</p>
              <Badge className={`mt-2 ${getUrgencyColor(result.urgency)}`}>
                {result.urgency}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">
                Accidents
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {result.accidents}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
