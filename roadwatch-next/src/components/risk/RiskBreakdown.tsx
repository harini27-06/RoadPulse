"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface RoadRisk {
  id: string;
  road_name: string;
  district: string;
  risk_percentage: number;
  urgency: string;
  confidence: number;
  breakdown: {
    image_analysis: number;
    accident_impact: number;
    complaint_impact: number;
    temporal_impact: number;
  };
  factors: Record<string, any>;
  complaint_count: number;
}

interface RiskBreakdownProps {
  road: RoadRisk | null;
  onClose: () => void;
}

export default function RiskBreakdown({ road, onClose }: RiskBreakdownProps) {
  if (!road) return null;

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

  const breakdownItems = [
    {
      label: "Image Analysis",
      value: road.breakdown.image_analysis,
      desc: "Detected defects from road images",
    },
    {
      label: "Accident Impact",
      value: road.breakdown.accident_impact,
      desc: "Historical accidents in district",
    },
    {
      label: "Complaint Impact",
      value: road.breakdown.complaint_impact,
      desc: "User-reported issues",
    },
    {
      label: "Temporal Impact",
      value: road.breakdown.temporal_impact,
      desc: "Recent trends and seasonality",
    },
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{road.road_name}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{road.district}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Risk */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Overall Risk</span>
            <Badge className={getUrgencyColor(road.urgency)}>
              {road.urgency}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">
                {road.risk_percentage}%
              </span>
              <div className="text-right">
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="text-lg font-semibold text-blue-600">
                  {road.confidence}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  road.risk_percentage >= 80
                    ? "bg-red-500"
                    : road.risk_percentage >= 60
                      ? "bg-orange-500"
                      : road.risk_percentage >= 40
                        ? "bg-yellow-500"
                        : "bg-green-500"
                }`}
                style={{ width: `${road.risk_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Risk Breakdown
          </h4>
          <div className="space-y-3">
            {breakdownItems.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(item.value)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contributing Factors */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Contributing Factors
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Defect Density:</span>
              <span className="font-medium text-gray-900">
                {Math.round(road.factors.defect_density)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Defect Severity:</span>
              <span className="font-medium text-gray-900">
                {Math.round(road.factors.defect_severity)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Complaints:</span>
              <span className="font-medium text-gray-900">
                {road.complaint_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trend:</span>
              <span className="font-medium text-gray-900">
                {road.factors.trend || "Stable"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Complaint:</span>
              <span className="font-medium text-gray-900">
                {road.factors.days_since_complaint || 365} days ago
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition">
          View Complaints ({road.complaint_count})
        </button>
      </CardContent>
    </Card>
  );
}
