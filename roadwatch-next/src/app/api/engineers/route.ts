import { NextResponse } from "next/server";
import { getAllExecutiveEngineers } from "@/lib/roadData";

export async function GET() {
  return NextResponse.json(getAllExecutiveEngineers());
}
