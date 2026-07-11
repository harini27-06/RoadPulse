// Shared risk calculation engine — used by all /api/risk/* routes

export interface RiskBreakdown {
  image_analysis: number;
  accident_impact: number;
  complaint_impact: number;
  temporal_impact: number;
}

export interface RiskFactors {
  defect_density: number;
  defect_severity: number;
  defect_types: Record<string, number>;
  critical_complaints_ratio: string;
  trend: string;
  days_since_complaint: number;
}

export interface RiskResult {
  risk: number;
  urgency: string;
  confidence: number;
  breakdown: RiskBreakdown;
  factors: RiskFactors;
}

const SEVERITY_MAP: Record<string, number> = { Low: 33, Medium: 66, High: 100 };

// Accident DB district names → Road DB district names
export const ACCIDENT_DISTRICT_ALIASES: Record<string, string> = {
  "CHENNAI CITY":    "CHENNAI",
  "THIRUVALLUR":     "TIRUVALLUR",
  "TIRUCHIRAPALLI":  "TIRUCHIRAPPALLI",
  "SIVAGANGAI":      "SIVAGANGAI",   // roads use SIVAGANGAI too — no change needed
  "THIRUVARUR":      "TIRUVARUR",
  "TIRUPATHUR":      "THIRUPATHUR",
  "MYILADUTHURAI":   "MAYILADUTHURAI",
  "THE NILGIRIS":    "UDHAGAMANDALAM",
  "THOOTHUKUDI":     "TUTICORIN",
};

export function getUrgencyLevel(risk: number): string {
  if (risk >= 75) return "Critical";
  if (risk >= 50) return "High";
  if (risk >= 25) return "Medium";
  return "Low";
}

export interface ComplaintInput {
  severity: string | null;
  created_at: Date;
  latitude?: number | null;
  longitude?: number | null;
  confidence?: number | null;  // YOLO detection confidence (0-100)
  issue_type?: string | null;  // YOLO detected issue
}

// Maps YOLO issue type → severity weight (higher = more dangerous)
const ISSUE_SEVERITY: Record<string, number> = {
  "Missing Manhole": 100,
  "Pothole":         85,
  "Damaged Road":    80,
  "Waterlogging":    65,
  "Debris":          60,
  "Crack":           50,
};

export function computeRisk(
  accidentCount: number,
  complaints: ComplaintInput[],
  defectDensity = 0,
  maxSeverity = 0
): RiskResult {
  const complaintCount = complaints.length;

  // ── Layer 1: Image-based risk — YOLO confidence + issue type ──────
  let imageDensity = defectDensity;
  let imageMaxSeverity = maxSeverity;

  if (defectDensity === 0 && complaints.length > 0) {
    const yoloComplaints = complaints.filter((c) => c.confidence != null);
    if (yoloComplaints.length > 0) {
      imageDensity =
        yoloComplaints.reduce((s, c) => s + (c.confidence ?? 0), 0) /
        yoloComplaints.length;

      // Use issue weight independently from confidence to avoid double-counting
      imageMaxSeverity = Math.max(
        ...yoloComplaints.map((c) => ISSUE_SEVERITY[c.issue_type ?? ""] ?? 50)
      );
    }
  }

  // imageRisk: 50% avg confidence + 50% worst issue severity (both 0–100)
  const imageRisk = Math.min(imageDensity * 0.5 + imageMaxSeverity * 0.5, 100);

  // Build defect_types count
  const defectTypes: Record<string, number> = {};
  for (const c of complaints) {
    if (c.issue_type) defectTypes[c.issue_type] = (defectTypes[c.issue_type] ?? 0) + 1;
  }

  // ── Layer 2: Accident risk ────────────────────────────────────────
  // Tamil Nadu district max is ~1813 (Chennai). 500 = meaningful mid-range threshold.
  const maxAccidents = 500;
  const accidentRisk = Math.min((accidentCount / maxAccidents) * 100, 100);

  // ── Layer 3: Complaint risk ───────────────────────────────────────
  const complaintRisk = Math.min((complaintCount / 10) * 100, 100);

  const severities = complaints
    .map((c) => SEVERITY_MAP[c.severity ?? "Medium"] ?? 50)
    .filter((v) => v > 0);
  const avgSeverity =
    severities.length > 0
      ? severities.reduce((a, b) => a + b, 0) / severities.length
      : 50; // default medium when no severity data

  const criticalCount = complaints.filter(
    (c) => (SEVERITY_MAP[c.severity ?? ""] ?? 0) >= 100
  ).length;
  const criticalRatio = complaintCount > 0 ? criticalCount / complaintCount : 0;

  // ── Layer 4: Temporal risk ────────────────────────────────────────
  const now = new Date();
  const MS_DAY = 1000 * 60 * 60 * 24;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_DAY);
  const sixtyDaysAgo  = new Date(now.getTime() - 60 * MS_DAY);

  const recentCount = complaints.filter((c) => new Date(c.created_at) > thirtyDaysAgo).length;
  const prevCount   = complaints.filter(
    (c) => new Date(c.created_at) > sixtyDaysAgo && new Date(c.created_at) <= thirtyDaysAgo
  ).length;

  const trend = (recentCount - prevCount) / Math.max(recentCount + prevCount, 1);

  const lastDate =
    complaints.length > 0
      ? new Date(Math.max(...complaints.map((c) => new Date(c.created_at).getTime())))
      : now;
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / MS_DAY);

  // Recency: full score if complaint today, zero if complaint was 1+ year ago
  const recencyRisk  = complaintCount > 0 ? Math.max(0, 100 - (daysSince / 365) * 100) : 0;
  const trendImpact  = Math.max(0, trend * 100);
  // Seasonal boost (monsoon = higher road damage risk) — only boosts, never penalises
  const currentMonth = now.getMonth() + 1;
  const seasonalBoost = [6, 7, 8, 9].includes(currentMonth) ? 15 : 0;
  const temporalRisk = Math.min(recencyRisk * 0.6 + trendImpact * 0.4 + seasonalBoost, 100);

  // ── Ensemble ──────────────────────────────────────────────────────
  // Weights: accident(35%) + complaint(25%) + image(25%) + temporal(15%)
  // Accident risk always contributes regardless of complaint count
  const finalRisk = Math.min(
    Math.max(
      accidentRisk  * 0.35 +
      complaintRisk * 0.25 +
      imageRisk     * 0.25 +
      temporalRisk  * 0.15,
      0
    ),
    100
  );

  // Confidence: based on data richness (complaints + accident data availability)
  const confidence = Math.min(
    (Math.min(complaintCount, 10) / 10) * 0.6 +
    (accidentCount > 0 ? 0.4 : 0),
    1
  ) * 100;

  return {
    risk: finalRisk,
    urgency: getUrgencyLevel(finalRisk),
    confidence,
    breakdown: {
      image_analysis:   Math.min(Math.max(imageRisk,    0), 100),
      accident_impact:  Math.min(Math.max(accidentRisk, 0), 100),
      complaint_impact: Math.min(Math.max(complaintRisk,0), 100),
      temporal_impact:  Math.min(Math.max(temporalRisk, 0), 100),
    },
    factors: {
      defect_density:           imageDensity,
      defect_severity:          imageMaxSeverity,
      defect_types:             defectTypes,
      critical_complaints_ratio:`${(criticalRatio * 100).toFixed(1)}%`,
      trend:                    trend > 0 ? "increasing" : trend < 0 ? "decreasing" : "stable",
      days_since_complaint:     daysSince,
    },
  };
}
