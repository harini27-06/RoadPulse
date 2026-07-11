import { NextResponse } from "next/server";
import { getRoads, getAccidents, getAllDistricts, normalizeDistrict } from "@/lib/roadData";

export async function GET() {
  const roads = getRoads();
  const accidents = getAccidents();
  const districts = getAllDistricts();

  const districtData = districts.map((district) => {
    const distRoads = roads.filter((r) => r.district.toUpperCase() === district.toUpperCase());
    const normalized = normalizeDistrict(district);
    const acc = accidents.find((a) => a.district === normalized);
    return {
      district,
      roadCount: distRoads.length,
      totalLengthKm: parseFloat(distRoads.reduce((s, r) => s + r.lengthKm, 0).toFixed(2)),
      totalEstimated: parseFloat(distRoads.reduce((s, r) => s + r.estimatedAmount, 0).toFixed(2)),
      totalBudget: parseFloat(distRoads.reduce((s, r) => s + r.budget2020, 0).toFixed(2)),
      totalWorkValue: parseFloat(distRoads.reduce((s, r) => s + r.workValue, 0).toFixed(2)),
      totalAccidents: acc?.totalAccidents ?? 0,
      totalDeaths: acc?.totalDeaths ?? 0,
      roads: distRoads.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        type: r.type,
        lengthKm: r.lengthKm,
        estimatedAmount: r.estimatedAmount,
        budget2020: r.budget2020,
        workValue: r.workValue,
        lastMaintenanceDate: r.lastMaintenanceDate,
        tenderId: r.tenderId,
      })),
    };
  });

  return NextResponse.json({ districts: districtData });
}
