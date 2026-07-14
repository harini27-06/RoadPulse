import fs from "fs";
import path from "path";

export interface RoadRecord {
  id: string;
  name: string;
  code: string;
  type: string;
  district: string;
  state: string;
  lastMaintenanceDate: string;
  startKm: number;
  endKm: number;
  lengthKm: number;
  tenderId: string;
  estimatedAmount: number;
  budget2020: number;
  workValue: number;
  authority: string;
}

export interface AccidentRecord {
  district: string;
  totalAccidents: number;
  totalDeaths: number;
  executiveEngineer?: string;
}

let _roads: RoadRecord[] = [];
let _accidents: AccidentRecord[] = [];
let _loaded = false;

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let cols: string[] = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuote && content[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === "," && !inQuote) {
      cols.push(cur.trim()); cur = "";
    } else if ((ch === "\n" || (ch === "\r" && content[i + 1] === "\n")) && !inQuote) {
      if (ch === "\r") i++;
      cols.push(cur.trim());
      if (cols.some((c) => c.length > 0)) rows.push(cols);
      cols = []; cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || cols.length > 0) { cols.push(cur.trim()); rows.push(cols); }
  return rows;
}

function loadData() {
  if (_loaded) return;
  _loaded = true;

  const dataDir = path.join(process.cwd(), "prisma", "datasets");

  // Load roads
  try {
    const roadCSV = fs.readFileSync(path.join(dataDir, "Road Datasets - Sheet1 (1).csv"), "utf-8");
    const rows = parseCSV(roadCSV);
    const header = rows[0];
    _roads = rows.slice(1).map((cols) => ({
      id:                  cols[0] ?? "",
      name:                cols[1] ?? "",
      code:                cols[2] ?? "",
      type:                cols[3] ?? "",
      district:            cols[4] ?? "",
      state:               cols[5] ?? "",
      lastMaintenanceDate: cols[6] ?? "",
      startKm:             parseFloat(cols[7]) || 0,
      endKm:               parseFloat(cols[8]) || 0,
      lengthKm:            parseFloat(cols[9]) || 0,
      tenderId:            cols[10] ?? "",
      estimatedAmount:     parseFloat(cols[11]) || 0,
      budget2020:          parseFloat(cols[12]) || 0,
      workValue:           parseFloat(cols[13]) || 0,
      authority:           cols[14] ?? "",
    })).filter((r) => r.name.length > 0);
  } catch { /* file not found in dev */ }

  // Load accidents
  try {
    const accCSV = fs.readFileSync(path.join(dataDir, "Accidents - Sheet1 (1) (1).csv"), "utf-8");
    const rows = parseCSV(accCSV);
    // CSV columns: S_No, Districts, Total Accidents, Total Deaths, Executive Engineer
    _accidents = rows.slice(1).map((cols) => ({
      district:          (cols[1] ?? "").trim().toUpperCase(),
      totalAccidents:    parseInt(cols[2]) || 0,
      totalDeaths:       parseInt(cols[3]) || 0,
      executiveEngineer: (cols[4] ?? "").trim() || undefined,
    })).filter((r) => r.district.length > 0);
  } catch { /* file not found */ }
}

export function getRoads(): RoadRecord[] { loadData(); return _roads; }
export function getAccidents(): AccidentRecord[] { loadData(); return _accidents; }

// Fuzzy search roads by name or code
export function searchRoads(query: string, limit = 5): RoadRecord[] {
  loadData();
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);

  const scored = _roads.map((r) => {
    const name = r.name.toLowerCase();
    const code = r.code.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (name.includes(t)) score += t.length;
      if (code.includes(t)) score += 2;
    }
    // Exact substring bonus
    if (name.includes(q)) score += 20;
    return { r, score };
  }).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);

  return scored;
}

// Get roads by district
export function getRoadsByDistrict(district: string): RoadRecord[] {
  loadData();
  const d = district.toUpperCase().trim();
  return _roads.filter((r) => r.district.toUpperCase().includes(d));
}

// Get accident data for a district
export function getAccidentByDistrict(district: string): AccidentRecord | null {
  loadData();
  const d = normalizeDistrict(district);
  return _accidents.find((a) => a.district === d || a.district.includes(d) || d.includes(a.district)) ?? null;
}

// Get executive engineer for a district
export function getExecutiveEngineer(district: string): string | null {
  const acc = getAccidentByDistrict(district);
  return acc?.executiveEngineer ?? null;
}

// Get all executive engineers mapped by district
export function getAllExecutiveEngineers(): { district: string; engineer: string }[] {
  loadData();
  return _accidents
    .filter((a) => a.executiveEngineer)
    .map((a) => ({ district: a.district, engineer: a.executiveEngineer! }));
}

// Format a single road's details as a point-wise answer
export function formatRoadDetail(road: RoadRecord, accidents?: AccidentRecord | null): string {
  const ee = accidents?.executiveEngineer;
  const lastYear = road.lastMaintenanceDate
    ? road.lastMaintenanceDate.match(/(\d{4})/)?.[1] ?? road.lastMaintenanceDate
    : "Not available";

  // Estimate next maintenance: 3 years after last maintenance year
  let maintenanceDue = "Not available";
  if (road.lastMaintenanceDate) {
    const yr = parseInt(road.lastMaintenanceDate.match(/(\d{4})/)?.[1] ?? "0");
    if (yr > 0) maintenanceDue = `${yr + 3}`;
  }

  const budget = road.estimatedAmount > 0
    ? `\u20b9${road.estimatedAmount.toFixed(2)} Crores`
    : road.budget2020 > 0
    ? `\u20b9${road.budget2020.toFixed(2)} Crores`
    : "Not available";

  const contractor = road.tenderId && road.tenderId.trim()
    ? road.tenderId.trim()
    : "Not available";

  const lines = [
    `\ud83d\udee3\ufe0f **${road.name}**`,
    ``,
    `**Road Code:** ${road.code || "N/A"}`,
    `**Type:** ${road.type || "N/A"}`,
    `**District:** ${road.district}`,
    `**Length:** ${road.lengthKm.toFixed(1)} km`,
    ``,
    `**Last Relaid:** ${lastYear}`,
    `**Maintenance Due:** ${maintenanceDue}`,
    `**Budget:** ${budget}`,
    `**Tender / Contractor ID:** ${contractor}`,
    `**Responsible Authority:** ${road.authority || `Executive Engineer, ${road.district} Division`}${ee ? ` (${ee})` : ""}`,
  ];
  return lines.join("\n");
}

// Get top N most dangerous districts
export function getTopDangerousDistricts(n = 5): AccidentRecord[] {
  loadData();
  return [..._accidents].sort((a, b) => b.totalAccidents - a.totalAccidents).slice(0, n);
}

// Get districts with worst roads — ranked by: most accidents + least budget per km
export function getWorstRoadDistricts(n = 10): { rank: number; district: string; score: string; accidents: number; roads: number; budgetPerKm: string }[] {
  loadData();
  const districts = getAllDistricts();
  const scored = districts.map((d) => {
    const roads = getRoadsByDistrict(d);
    const acc = getAccidentByDistrict(d);
    const totalKm = roads.reduce((s, r) => s + r.lengthKm, 0);
    const totalBudget = roads.reduce((s, r) => s + (r.estimatedAmount || r.budget2020), 0);
    const budgetPerKm = totalKm > 0 ? totalBudget / totalKm : 0;
    const accidents = acc?.totalAccidents ?? 0;
    // Score: high accidents + low budget per km = worst roads
    const score = accidents * 2 + (budgetPerKm > 0 ? 10000 / budgetPerKm : 500);
    return { district: d, score, accidents, roads: roads.length, totalKm, budgetPerKm };
  }).sort((a, b) => b.score - a.score).slice(0, n);

  return scored.map((d, i) => ({
    rank: i + 1,
    district: d.district,
    score: d.score.toFixed(0),
    accidents: d.accidents,
    roads: d.roads,
    budgetPerKm: d.budgetPerKm > 0 ? `₹${d.budgetPerKm.toFixed(1)} Cr/km` : "N/A",
  }));
}

// Get district stats summary
export function getDistrictStats(district: string): {
  roads: RoadRecord[];
  accidents: AccidentRecord | null;
  totalLength: number;
  totalBudget: number;
} {
  const roads = getRoadsByDistrict(district);
  const accidents = getAccidentByDistrict(district);
  const totalLength = roads.reduce((s, r) => s + r.lengthKm, 0);
  const totalBudget = roads.reduce((s, r) => s + r.estimatedAmount, 0);
  return { roads, accidents, totalLength, totalBudget };
}

// All unique districts
// Maps road CSV district names → accident CSV district names
const DISTRICT_ALIAS: Record<string, string> = {
  "PUDUKOTTAI":      "PUDUKKOTTAI",
  "TIRUVARUR":       "THIRUVARUR",
  "TIRUCHIRAPPALLI": "TIRUCHIRAPALLI",
  "TUTICORIN":       "THOOTHUKUDI",
  "CHENNAI":         "CHENNAI CITY",
  "TIRUVALLUR":      "THIRUVALLUR",
  "VIRDHUNAGAR":     "VIRUDHUNAGAR",
  "MAYILADUTHURAI":  "MYILADUTHURAI",
  "THIRUPATHUR":     "TIRUPATHUR",
};

// Districts to exclude (towns/taluks, not real districts)
export const EXCLUDED_DISTRICTS = new Set([
  "PALANI", "DHARAPURAM", "NAGERCOIL", "POLLACHI",
  "VRIDHACHALAM", "EDAPPADY", "GOBICHETTIPALAYAM",
  "UDHAGAMANDALAM", "CHEYYAR",
]);

export function getAllDistricts(): string[] {
  loadData();
  return [...new Set(
    _roads
      .map((r) => r.district)
      .filter((d) => d && !EXCLUDED_DISTRICTS.has(d.toUpperCase()))
  )].sort();
}

export function normalizeDistrict(d: string): string {
  const up = d.toUpperCase().trim();
  return DISTRICT_ALIAS[up] ?? up;
}
