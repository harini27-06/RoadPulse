import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { prisma } from "./prisma";
import {
  getRoads,
  getAccidents,
  getTopDangerousDistricts,
  getRoadsByDistrict,
  getAccidentByDistrict,
  searchRoads,
  getAllDistricts,
  getDistrictStats,
  getExecutiveEngineer,
  getAllExecutiveEngineers,
  formatRoadDetail,
} from "./roadData";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

// Module-level Gemini instance
let _genAI: GoogleGenerativeAI | null = null;

// ─── Live DB context ──────────────────────────────────────────────────────────

async function getLiveDBContext(): Promise<string> {
  try {
    const [
      totalComplaints,
      pendingCount,
      inProgressCount,
      resolvedCount,
      recentComplaints,
      issueBreakdown,
      totalUsers,
      areaBreakdown,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: "Pending" } }),
      prisma.complaint.count({ where: { status: "In Progress" } }),
      prisma.complaint.count({ where: { status: "Resolved" } }),
      prisma.complaint.findMany({
        orderBy: { created_at: "desc" },
        take: 8,
        select: { issue_type: true, status: true, address: true, confidence: true, severity: true, description: true },
      }),
      prisma.complaint.groupBy({
        by: ["issue_type"],
        _count: { issue_type: true },
        orderBy: { _count: { issue_type: "desc" } },
      }),
      prisma.user.count(),
      prisma.complaint.groupBy({
        by: ["address", "issue_type"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 30,
      }),
    ]);

    const recentStr = recentComplaints.length
      ? recentComplaints.map((c) =>
          `• ${c.issue_type} (${c.status}) @ "${c.address ?? "unknown"}" — ${c.confidence.toFixed(0)}% conf${c.severity ? `, ${c.severity} severity` : ""}${c.description ? ` — "${c.description}"` : ""}`
        ).join("\n")
      : "No complaints yet.";

    const issueStr = issueBreakdown.length
      ? issueBreakdown.map((i) => `• ${i.issue_type}: ${i._count.issue_type}`).join("\n")
      : "No complaints yet.";

    const areaStr = areaBreakdown.length
      ? areaBreakdown
          .filter((a) => a.address)
          .map((a) => `• ${a.issue_type} @ "${a.address}": ${a._count.id}`)
          .join("\n")
      : "No area data yet.";

    const dbAccidents = await prisma.accident.findMany({ orderBy: { total_accidents: "desc" }, take: 10 });
    const accStr = dbAccidents.length
      ? dbAccidents.map((a) => `• ${a.district}: ${a.total_accidents} accidents, ${a.total_deaths} deaths${a.executive_engineer ? `, EE: ${a.executive_engineer}` : ""}`).join("\n")
      : "No accident records in DB yet.";

    return `LIVE DATABASE (real-time):
Users: ${totalUsers} | Complaints: ${totalComplaints} (Pending: ${pendingCount}, In Progress: ${inProgressCount}, Resolved: ${resolvedCount})

Complaints by type:
${issueStr}

Complaints by area and issue (top 30):
${areaStr}

Recent complaints:
${recentStr}

Accident data from DB:
${accStr}`;
  } catch {
    return "Live DB: unavailable";
  }
}

// ─── Static dataset context ───────────────────────────────────────────────────

function getStaticContext(): string {
  const roads = getRoads();
  const accidents = getAccidents();
  const districts = getAllDistricts().filter(Boolean);
  const totalLen = roads.reduce((s, r) => s + r.lengthKm, 0).toFixed(1);
  const totalBudget = roads.reduce((s, r) => s + r.estimatedAmount, 0).toFixed(2);
  const totalAccidents = accidents.reduce((s, a) => s + a.totalAccidents, 0);
  const totalDeaths = accidents.reduce((s, a) => s + a.totalDeaths, 0);

  const mdrCount = roads.filter((r) => r.type.toUpperCase().includes("MDR")).length;
  const nhCount  = roads.filter((r) => r.type.toUpperCase().includes("NH")).length;
  const shCount  = roads.filter((r) => r.type.toUpperCase().includes("SH")).length;

  const topAcc = getTopDangerousDistricts(10)
    .map((a, i) => `${i + 1}. ${a.district}: ${a.totalAccidents} accidents, ${a.totalDeaths} deaths`)
    .join("\n");

  const allAcc = accidents
    .map((a) => `${a.district}: ${a.totalAccidents} accidents, ${a.totalDeaths} deaths${a.executiveEngineer ? `, EE: ${a.executiveEngineer}` : ""}`)
    .join(" | ");

  const distSummary = districts.map((d) => {
    const r = getRoadsByDistrict(d);
    const a = getAccidentByDistrict(d);
    const len = r.reduce((s, x) => s + x.lengthKm, 0).toFixed(1);
    const budget = r.reduce((s, x) => s + x.estimatedAmount, 0).toFixed(2);
    return `${d}: ${r.length} roads, ${len}km, ₹${budget}Cr${a ? `, ${a.totalAccidents} accidents, ${a.totalDeaths} deaths` : ""}`;
  }).join("\n");

  return `TAMIL NADU ROAD DATASET (answer ALL road/accident questions from this data):

KEY TOTALS — use these exact numbers when asked:
- Total roads in dataset: ${roads.length}
- Total road length: ${totalLen} km
- Total budget: ₹${totalBudget} Crores
- Total districts covered: ${districts.length}
- Road types: MDR=${mdrCount}, NH=${nhCount}, SH=${shCount}
- Total accidents (all districts): ${totalAccidents.toLocaleString()}
- Total deaths (all districts): ${totalDeaths.toLocaleString()}
- Districts with accident data: ${accidents.length}

Top 10 most accident-prone districts:
${topAcc}

All accident data by district:
${allAcc}

All district road summaries:
${distSummary}`;
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(liveCtx: string): string {
  return `You are RoadPulse AI — a precise assistant for Tamil Nadu road information.

CRITICAL RULES:
- Answer ONLY the specific field asked. ONE answer, no extras.
- "total budget" → give ONLY the budget number. Do NOT mention roads, length, accidents.
- "total accidents" → give ONLY accidents + deaths. Do NOT mention roads, budget, length.
- "total deaths" → give ONLY the death count.
- "how many roads" → give ONLY road count + length. Do NOT mention budget or accidents.
- "road length" → give ONLY the km total.
- NEVER dump a full district overview when a specific field is asked.
- NEVER make up numbers. Use ONLY figures from the data below.
- No filler, no follow-up questions, no generic tips.
- Use **bold** for key numbers only.

EXACT ANSWER FORMATS:
- "total budget of [district]" → The total estimated budget for roads in **[DISTRICT]** is **₹X Crores** across **Y roads**.
- "total accidents in [district]" → **[DISTRICT]** recorded **X accidents** and **Y deaths** — ranked **#Z** in Tamil Nadu.
- "total deaths in [district]" → **[DISTRICT]** recorded **Y deaths** from road accidents.
- "how many roads in [district]" → **[DISTRICT]** has **X roads** with a total length of **Y km**.
- "road length in [district]" → The total road length in **[DISTRICT]** is **X km** across **Y roads**.
- "executive engineer of [district]" → The Executive Engineer for **[DISTRICT]** is **[Name]**.
- "most dangerous districts" → list only districts with accident counts.
- "total accidents in Tamil Nadu" → use KEY TOTALS statewide figure only.
- specific road question (damage/condition/budget/contractor/authority) → answer ONLY in this exact point-wise format, NO paragraphs:

🛣️ **[Road Name]**

**Road Code:** [code]
**Type:** [type]
**District:** [district]
**Length:** [X] km

**Last Relaid:** [year]
**Maintenance Due:** [year]
**Budget:** ₹[X] Crores
**Tender / Contractor ID:** [id or Not available]
**Responsible Authority:** Executive Engineer, [District] Division ([EE name if known])

- "which area has most [issue]" or "top areas for [issue]" → use TOP AREAS data from context, answer in this format:

📍 **Top Areas with [Issue] Complaints**

1. [Area] — [N] complaints
2. [Area] — [N] complaints
...

⚠️ These areas need urgent attention. You can report issues using RoadWatch.

${liveCtx}

${getStaticContext()}`;
}

// ─── Per-message data enrichment ─────────────────────────────────────────────

async function enrichMessage(message: string): Promise<string> {
  const q = message.toLowerCase();
  const injections: string[] = [];

  const isBudget   = /budget|cost|estimate|crore|fund|amount|spend/i.test(q);
  const isAccident = /accident|death|fatal|casualt|dangerous/i.test(q);
  const isRoad     = /road|highway|route|street|length|km/i.test(q);
  const isCount    = /total|how many|count|number of/i.test(q);

  // Global totals — only when no district is mentioned
  const districts = getAllDistricts().filter(Boolean);
  const district  = districts.find((d) => q.includes(d.toLowerCase()));

  if (!district && isCount && (isRoad || isAccident)) {
    const roads     = getRoads();
    const accidents = getAccidents();
    const totalAccidents = accidents.reduce((s, a) => s + a.totalAccidents, 0);
    const totalDeaths    = accidents.reduce((s, a) => s + a.totalDeaths, 0);
    const totalLen       = roads.reduce((s, r) => s + r.lengthKm, 0).toFixed(1);
    injections.push(`[TOTALS: ${roads.length} roads, ${totalLen}km, ${getAllDistricts().filter(Boolean).length} districts, ${totalAccidents} accidents, ${totalDeaths} deaths]`);
  }

  if (district) {
    const { roads, accidents, totalLength, totalBudget } = getDistrictStats(district);
    // Inject only what is relevant to the question
    if (isBudget) {
      injections.push(`[${district.toUpperCase()} BUDGET: ${roads.length} roads, ${totalLength.toFixed(1)}km total length, ₹${totalBudget.toFixed(2)} Crores total estimated budget]`);
    }
    if (isAccident) {
      const accStr = accidents
        ? `${accidents.totalAccidents} accidents, ${accidents.totalDeaths} deaths${accidents.executiveEngineer ? `, EE: ${accidents.executiveEngineer}` : ""}`
        : "no accident data";
      injections.push(`[${district.toUpperCase()} ACCIDENTS: ${accStr}]`);
    }
    if (isRoad && !isBudget) {
      const sample = roads.slice(0, 8).map((r) => `${r.name}[${r.code}] ${r.lengthKm.toFixed(1)}km`).join(", ");
      injections.push(`[${district.toUpperCase()} ROADS: ${roads.length} roads, ${totalLength.toFixed(1)}km total. Sample: ${sample}]`);
    }
    if (!isBudget && !isAccident && !isRoad) {
      // General district question — inject summary
      const accStr = accidents ? `${accidents.totalAccidents} accidents, ${accidents.totalDeaths} deaths` : "no accident data";
      injections.push(`[${district.toUpperCase()}: ${roads.length} roads, ${totalLength.toFixed(1)}km, ₹${totalBudget.toFixed(2)}Cr, ${accStr}]`);
    }
  }

  if (!district && isRoad && !isCount) {
    const results = searchRoads(message, 5);
    if (results.length) {
      // If the query looks like a specific road detail question, inject full detail for top match
      const isDetailQuery = /\b(damage|damaged|why|condition|detail|info|about|status|repair|budget|contractor|maintained|relaid|authority|responsible|when|last)\b/i.test(q);
      if (isDetailQuery) {
        const road = results[0];
        const acc = getAccidentByDistrict(road.district);
        injections.push(`[ROAD DETAIL:\n${formatRoadDetail(road, acc)}]`);
      } else {
        injections.push(`[ROAD SEARCH: ${results.map((r) => `${r.name}[${r.code}] ${r.district} ${r.lengthKm.toFixed(1)}km lastMaintained:${r.lastMaintenanceDate || "N/A"} budget:₹${r.estimatedAmount.toFixed(2)}Cr tender:${r.tenderId || "N/A"}`).join("; ")}]`);
      }
    }
  }

  if (/complaint|report|status|pending|resolved|progress/i.test(q)) {
    try {
      const stats = await prisma.complaint.groupBy({ by: ["status"], _count: { status: true } });
      injections.push(`[COMPLAINT STATS: ${stats.map((s) => `${s.status}:${s._count.status}`).join(", ")}]`);
    } catch { /* ignore */ }
  }

  // Area-based issue query — "which area has most potholes"
  const areaIssueMatch = q.match(/\b(pothole|pot hole|crack|waterlog|debris|manhole|damaged road|road damage)\b/i);
  if (areaIssueMatch && /\b(area|place|location|where|most|top|highest|common)\b/i.test(q)) {
    try {
      const issueType = areaIssueMatch[0].toLowerCase().replace("pot hole", "pothole");
      const issueMap: Record<string, string> = {
        pothole: "Pothole", crack: "Crack", waterlog: "Waterlogging",
        debris: "Debris", manhole: "Missing Manhole", "damaged road": "Damaged Road", "road damage": "Damaged Road",
      };
      const dbIssue = issueMap[issueType] ?? issueType;
      const rows = await prisma.complaint.groupBy({
        by: ["address"],
        where: { issue_type: { contains: dbIssue, mode: "insensitive" }, address: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });
      if (rows.length) {
        injections.push(`[TOP AREAS FOR ${dbIssue.toUpperCase()}: ${rows.map((r, i) => `${i + 1}. "${r.address}" (${r._count.id} complaints)`).join("; ")}]`);
      }
    } catch { /* ignore */ }
  }

  if (/executive\s*(engineer|minister|eng|ee)\b/i.test(q)) {
    const d = districts.find((d) => q.includes(d.toLowerCase()));
    if (d) {
      const ee = getExecutiveEngineer(d);
      injections.push(`[EXECUTIVE ENGINEER for ${d.toUpperCase()}: ${ee ?? "not found"}]`);
    } else {
      const all = getAllExecutiveEngineers();
      injections.push(`[ALL EXECUTIVE ENGINEERS: ${all.map((e) => `${e.district}=${e.engineer}`).join("; ")}]`);
    }
  }

  if (isAccident && !district) {
    const top = getTopDangerousDistricts(5);
    injections.push(`[TOP ACCIDENT DISTRICTS: ${top.map((a) => `${a.district}:${a.totalAccidents} accidents,${a.totalDeaths} deaths`).join("; ")}]`);
  }

  return injections.length ? `${message}\n\n${injections.join("\n")}` : message;
}

// ─── Smart local fallback ─────────────────────────────────────────────────────

async function smartLocalResponse(message: string, history: ChatTurn[]): Promise<string> {
  const q = message.toLowerCase().trim();
  const liveCtx = await getLiveDBContext();
  const enriched = await enrichMessage(message);
  const dataInjection = enriched !== message ? enriched.split("\n\n").slice(1).join("\n") : "";

  if (/^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|howdy)\b/i.test(q)) {
    return `Hi! I'm **RoadPulse AI**. I can help with Tamil Nadu road data, accident stats, defect detection, and complaints.\n\nWhat would you like to know?`;
  }

  if (/\b(help|what can you do|features|capabilities)\b/i.test(q)) {
    return `Sure! Here's what I can do for you:\n\n🛣️ **Road Data** — try *"Roads in Coimbatore"* or *"MDR roads in Salem"*\n📊 **Accident Stats** — *"Accident data for Chennai"* or *"Most dangerous districts"*\n💰 **Budget Info** — *"Budget for Madurai roads"*\n🔍 **Defect Detection** — upload a photo and I'll tell you what's wrong\n📋 **Complaints** — file and track road damage reports\n\nJust ask away — I'm here to help! 😊`;
  }

  if (/total|how many|number of/i.test(q) && /road/i.test(q) && !/accident/i.test(q) && !getAllDistricts().filter(Boolean).find((d) => q.includes(d.toLowerCase()))) {
    const roads = getRoads();
    const totalLen = roads.reduce((s, r) => s + r.lengthKm, 0).toFixed(1);
    const totalBudget = roads.reduce((s, r) => s + r.estimatedAmount, 0).toFixed(2);
    return `Tamil Nadu has **${roads.length} roads** with a total length of **${totalLen} km** and an estimated budget of **₹${totalBudget} Crores**.`;
  }

  if (/total|how many|number of/i.test(q) && /accident|death|fatal/i.test(q) && !getAllDistricts().filter(Boolean).find((d) => q.includes(d.toLowerCase()))) {
    const accidents = getAccidents();
    const totalAccidents = accidents.reduce((s, a) => s + a.totalAccidents, 0);
    const totalDeaths = accidents.reduce((s, a) => s + a.totalDeaths, 0);
    return `Tamil Nadu recorded **${totalAccidents.toLocaleString()} total accidents** and **${totalDeaths.toLocaleString()} total deaths** across **${accidents.length} districts**.`;
  }

  if (/\b(how many|total|count|stats|statistics)\b.*\b(complaint|user|report)\b/i.test(q) ||
      /\b(complaint|user|report)\b.*\b(how many|total|count|stats)\b/i.test(q)) {
    return `📊 **RoadWatch Platform Stats**\n\n${liveCtx}\n\nWant details on a specific district or issue type?`;
  }

  if (/\b(top|most|highest|worst|dangerous|accident.prone)\b.*\b(district|place|area)\b/i.test(q) ||
      /\b(which|what)\b.*\b(district|place)\b.*\b(most|highest|dangerous)\b/i.test(q)) {
    const n = parseInt(q.match(/top\s*(\d+)/)?.[1] ?? "5");
    const top = getTopDangerousDistricts(Math.min(n || 5, 10));
    const rows = top.map((a, i) => `${i + 1}. **${a.district}** — ${a.totalAccidents.toLocaleString()} accidents, ${a.totalDeaths.toLocaleString()} deaths`).join("\n");
    return `🚨 **Top ${top.length} Most Accident-Prone Districts in Tamil Nadu**\n\n${rows}\n\n⚠️ These districts need urgent road safety improvements. Want details on any specific district?`;
  }

  // Executive engineer query
  if (/executive\s*(engineer|minister|eng|ee)\b/i.test(q)) {
    const allDistricts = getAllDistricts().filter(Boolean);
    const eeDistrict = allDistricts.find((d) => q.includes(d.toLowerCase()));
    if (eeDistrict) {
      const ee = getExecutiveEngineer(eeDistrict);
      if (ee) return `The Executive Engineer for **${eeDistrict.toUpperCase()}** is **${ee}**.`;
      return `No Executive Engineer data found for **${eeDistrict.toUpperCase()}**.`;
    }
    // List all — return marker so useChat attaches structured eeList
    return `__EE_LIST__ Here are the Executive Engineers for all 38 districts in Tamil Nadu:`;
  }

  // Area-based issue query — "which area has most potholes"
  const areaIssueKeyword = q.match(/\b(pothole|pot hole|crack|waterlog|debris|manhole|damaged road|road damage)\b/i);
  if (areaIssueKeyword && /\b(area|place|location|where|most|top|highest|common)\b/i.test(q)) {
    const issueMap: Record<string, string> = {
      pothole: "Pothole", "pot hole": "Pothole", crack: "Crack", waterlog: "Waterlogging",
      debris: "Debris", manhole: "Missing Manhole", "damaged road": "Damaged Road", "road damage": "Damaged Road",
    };
    const rawIssue = areaIssueKeyword[0].toLowerCase();
    const dbIssue = issueMap[rawIssue] ?? rawIssue;
    try {
      const rows = await prisma.complaint.groupBy({
        by: ["address"],
        where: { issue_type: { contains: dbIssue, mode: "insensitive" }, address: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });
      if (rows.length) {
        const list = rows.map((r, i) => `${i + 1}. **${r.address}** — ${r._count.id} complaint${r._count.id > 1 ? "s" : ""}`).join("\n");
        return `📍 **Top Areas with ${dbIssue} Complaints**\n\n${list}\n\n⚠️ These areas need urgent attention. You can report issues using RoadWatch.`;
      }
      return `No **${dbIssue}** complaints have been filed yet. Be the first to report one! 📷`;
    } catch {
      return `Couldn't fetch area data right now. Please try again shortly.`;
    }
  }

  const districts = getAllDistricts().filter(Boolean);
  const district = districts.find((d) => q.includes(d.toLowerCase()));
  if (district) {
    const { roads, accidents, totalLength, totalBudget } = getDistrictStats(district);
    const isBudget   = /budget|cost|estimate|crore|fund|amount|spend/i.test(q);
    const isAccident = /accident|death|fatal|casualt|dangerous/i.test(q);
    const isDeathOnly = /\bdeath|\bfatal|\bcasualt/i.test(q) && !/accident/i.test(q);
    const isLength   = /\blength\b|\bkm\b|\bkilomet/i.test(q);
    const isRoadCount = /(how many|total|count|number of).*road|road.*(how many|total|count|number of)/i.test(q);
    const isRoadList = /\blist\b|\bshow\b.*road|\broads in\b/i.test(q);

    // Budget query — return ONLY budget
    if (isBudget) {
      if (!roads.length) return `No budget data found for **${district.toUpperCase()}**.`;
      return `The total estimated budget for roads in **${district.toUpperCase()}** is **₹${totalBudget.toFixed(2)} Crores** across **${roads.length} roads**.`;
    }

    // Death-only query
    if (isDeathOnly) {
      if (!accidents) return `No accident data found for **${district.toUpperCase()}**.`;
      return `**${district.toUpperCase()}** recorded **${accidents.totalDeaths.toLocaleString()} deaths** from road accidents.`;
    }

    // Accident / death query — return ONLY accident + death
    if (isAccident) {
      if (!accidents) return `No accident data found for **${district.toUpperCase()}**.`;
      const allAcc = getAccidents().sort((a, b) => b.totalAccidents - a.totalAccidents);
      const rank = allAcc.findIndex((a) => a.district === accidents.district) + 1;
      return `**${district.toUpperCase()}** recorded **${accidents.totalAccidents.toLocaleString()} accidents** and **${accidents.totalDeaths.toLocaleString()} deaths** — ranked **#${rank}** in Tamil Nadu.`;
    }

    // Road length query — return ONLY length
    if (isLength) {
      if (!roads.length) return `No road length data found for **${district.toUpperCase()}**.`;
      return `The total road length in **${district.toUpperCase()}** is **${totalLength.toFixed(1)} km** across **${roads.length} roads**.`;
    }

    // Road count query — return ONLY count
    if (isRoadCount) {
      if (!roads.length) return `No road data found for **${district.toUpperCase()}**.`;
      return `**${district.toUpperCase()}** has **${roads.length} roads** with a total length of **${totalLength.toFixed(1)} km**.`;
    }

    // Road list query
    if (isRoadList) {
      if (!roads.length) return `No roads found for **${district.toUpperCase()}**.`;
      const sample = roads.slice(0, 8).map((r, i) => `${i + 1}. **${r.name}** [${r.code}] — ${r.lengthKm.toFixed(1)} km`).join("\n");
      return `**Roads in ${district.toUpperCase()}** (${roads.length} total):\n\n${sample}${roads.length > 8 ? `\n_...and ${roads.length - 8} more_` : ""}`;
    }

    // General district mention with no specific intent — ask what they want
    return `What would you like to know about **${district.toUpperCase()}**?\n\n- 💰 *"Total budget of ${district}"*\n- 🚨 *"Accidents in ${district}"*\n- 🛣️ *"Roads in ${district}"*\n- 📏 *"Road length in ${district}"*`;
  }

  if (/\b(road|highway|route|street|path)\b/i.test(q)) {
    const results = searchRoads(message, 8);
    if (results.length) {
      const isDetailQuery = /\b(damage|damaged|why|condition|detail|info|about|status|repair|budget|contractor|maintained|relaid|authority|responsible|when|last)\b/i.test(q);
      if (isDetailQuery) {
        const road = results[0];
        const acc = getAccidentByDistrict(road.district);
        return formatRoadDetail(road, acc);
      }
      const list = results.map((r) => `\u2022 **${r.name}** [${r.code}] \u2014 ${r.district}, ${r.lengthKm.toFixed(1)} km`).join("\n");
      return `\ud83d\udee3\ufe0f **Roads matching "${message}"**\n\n${list}\n\nWant more details on any of these roads?`;
    }
  }

  if (/\b(accident|death|fatal|casualt|dangerous)\b/i.test(q)) {
    const top5 = getTopDangerousDistricts(5);
    const rows = top5.map((a, i) => `${i + 1}. **${a.district}** — ${a.totalAccidents} accidents, ${a.totalDeaths} deaths`).join("\n");
    return `🚨 **Tamil Nadu Road Accident Overview**\n\nTotal districts tracked: ${getAccidents().length}\n\n**Top 5 most dangerous:**\n${rows}\n\nAsk me about a specific district for detailed accident analysis!`;
  }

  if (/\b(pothole|pot hole)\b/i.test(q)) {
    return `🕳️ **Potholes** are one of the most common road defects in Tamil Nadu.\n\n**How they form:**\n1. Water seeps into cracks in the asphalt\n2. Heavy rain/traffic weakens the road base\n3. The surface breaks apart under vehicle load\n\n**Dangers:** Tire damage, suspension damage, accidents — especially dangerous for two-wheelers at night.\n\n**What to do:**\n- Report it using RoadWatch (upload a photo → AI detects → file complaint)\n- Authorities must repair within 48 hours of a complaint\n\nHave you spotted a pothole? I can help you report it! 📷`;
  }

  if (/\b(crack|cracking|cracks)\b/i.test(q)) {
    return `🔍 **Road Cracks** — Types & What They Mean:\n\n- **Alligator/Fatigue cracks** — interconnected pattern from repeated traffic load (most serious)\n- **Thermal cracks** — transverse cracks from temperature changes\n- **Edge cracks** — along road edges from lack of support\n- **Longitudinal cracks** — parallel to road, from poor construction joints\n\n**Why it matters:** Unsealed cracks let water in → weakens base → becomes a pothole.\n\n**Fix:** Crack sealing (minor) or full resurfacing (severe). Early treatment is 5x cheaper than waiting!\n\nSpotted cracks on a road? Upload a photo and I'll help you file a complaint. 📸`;
  }

  if (/\b(waterlog|waterlogging|flood|standing water|drainage)\b/i.test(q)) {
    return `💧 **Waterlogging on Roads**\n\n**Causes:**\n- Blocked storm drains and culverts\n- Poor road camber (cross-slope)\n- Low-lying road sections\n- Inadequate drainage design\n\n**Effects:**\n- Weakens road base → accelerates damage\n- Skidding hazard for vehicles\n- Hides potholes and road damage\n- Reduces road life by 40-60%\n\n**Solution:** Clear drains, improve road gradient, install proper drainage. Report waterlogged roads using RoadWatch!\n\nIs there a specific waterlogged road you want to report?`;
  }

  if (/\b(maintenance|repair|fix|maintain)\b/i.test(q)) {
    return `🔧 **Road Maintenance Types:**\n\n1. **Routine** — Ongoing: pothole patching, crack sealing, drain cleaning\n2. **Periodic** — Every 3-5 years: resurfacing, structural repairs\n3. **Preventive** — Before failure: surface treatments to extend road life\n4. **Reactive** — Emergency repairs after damage or accidents\n5. **Rehabilitation** — Major reconstruction of severely deteriorated roads\n\n💡 **Key fact:** Preventive maintenance costs ₹1 vs ₹5-8 for reactive repairs. Early reporting through RoadWatch saves public money!\n\nWant to know about maintenance schedules for a specific district?`;
  }

  if (/\b(safe|safety|driving|tips|precaution)\b/i.test(q)) {
    return `🛡️ **Road Safety Tips for Tamil Nadu:**\n\n🚗 **Driving:**\n- Slow down on damaged roads — potholes at speed cause accidents\n- Maintain 3-second following distance\n- Use headlights at dusk and in rain\n- Never swerve suddenly to avoid potholes\n\n🛞 **Vehicle:**\n- Check tire pressure weekly — low pressure worsens pothole damage\n- Inspect suspension after hitting large potholes\n\n📱 **Reporting:**\n- Report hazards on RoadWatch immediately\n- Your report protects thousands of other road users\n\n⚠️ **High-risk districts:** Coimbatore, Madurai, Chengalpattu — extra caution needed!\n\nStay safe! Is there a specific road safety concern I can help with?`;
  }

  if (/\b(how to|report|complaint|file|raise|submit)\b/i.test(q)) {
    return `It's really simple! Here's how:\n\n1. 📷 Head to the **Chatbot** page and click the upload button\n2. 🔍 Our AI will look at the image and tell you what it found\n3. ✅ I'll ask if you want to raise a complaint or just needed info\n4. 📍 Share your location (GPS or manual)\n5. 📝 Add a quick description if you'd like\n6. 🚀 Hit submit — done!\n\nYou can then track it on the **Complaints** page. Status goes: Pending → In Progress → Resolved.\n\nWant to try it now? Just upload a photo! 📸`;
  }

  if (/\b(roadwatch|what is|about|platform|app)\b/i.test(q)) {
    return `🛣️ **About RoadWatch:**\n\nRoadWatch is an AI-powered road monitoring platform for Tamil Nadu, India.\n\n**What it does:**\n- 📷 **Detect** road defects from photos using YOLOv11 AI\n- 📋 **File** complaints with GPS location\n- 📊 **Track** complaint status in real-time\n- 🗺️ **Monitor** road conditions across Tamil Nadu\n- 💬 **Chat** with AI for road information and guidance\n\n**Coverage:** ${getAllDistricts().filter(Boolean).length} districts | ${getRoads().length.toLocaleString()} roads | ${getAccidents().length} districts with accident data\n\nHow can I help you today?`;
  }

  if (history.length > 0) {
    const lastBot = [...history].reverse().find((h) => h.role === "model");
    if (lastBot?.content.includes("district") && /\b(yes|sure|tell me|more|details|show)\b/i.test(q)) {
      return `Sure! Which district would you like details on? I have data for all ${getAllDistricts().filter(Boolean).length} Tamil Nadu districts. Just name the district! 🗺️`;
    }
  }

  if (q.length > 3) {
    const roadResults = searchRoads(message, 4);
    if (roadResults.length) {
      // If it looks like a detail question about a specific road, return formatted detail
      const isDetailQuery = /\b(damage|damaged|why|condition|detail|info|about|status|repair|budget|contractor|maintained|relaid|authority|responsible|when|last)\b/i.test(q);
      if (isDetailQuery) {
        const road = roadResults[0];
        const acc = getAccidentByDistrict(road.district);
        return formatRoadDetail(road, acc);
      }
      const list = roadResults.map((r) => `\u2022 **${r.name}** \u2014 ${r.district}, ${r.lengthKm.toFixed(1)} km`).join("\n");
      return `Here's what I found:\n\n${list}\n\nWant more details on any of these? Just ask!`;
    }
    return `Hmm, I'm not quite sure what you mean by *"${message}"* — but I'm great with Tamil Nadu road stuff! Try asking:\n\n🛣️ *"Roads in [district name]"*\n📊 *"Accident stats for [district]"*\n🔍 *"What is a pothole?"*\n📋 *"How do I report road damage?"*\n🏆 *"Most dangerous districts"*\n\nWhat would you like to know?`;
  }

  return `Not sure what you're looking for? Here are some things you can ask me:\n- *"Roads in Chennai"*\n- *"Accident data for Coimbatore"*\n- *"What causes potholes?"*\n- *"How do I file a complaint?"*`;
}

// ─── Main chat function ───────────────────────────────────────────────────────

export async function chat(message: string, history: ChatTurn[] = []): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();

  if (key) {
    try {
      if (!_genAI) _genAI = new GoogleGenerativeAI(key);

      const [liveCtx, enrichedMessage] = await Promise.all([
        getLiveDBContext(),
        enrichMessage(message),
      ]);

      const systemInstruction = buildSystemPrompt(liveCtx);
      const generationConfig = { temperature: 0.75, topP: 0.92, maxOutputTokens: 1200 };

      const geminiHistory: Content[] = history.slice(-12).map((t) => ({
        role: t.role,
        parts: [{ text: t.content }],
      }));

      // Try gemini-2.0-flash, fallback to gemini-1.5-flash
      for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
        try {
          const model = _genAI.getGenerativeModel({ model: modelName, systemInstruction, generationConfig });
          const session = model.startChat({ history: geminiHistory });
          const result = await session.sendMessage(enrichedMessage);
          const text = result.response.text();
          if (text) return text;
        } catch {
          continue;
        }
      }
    } catch (err: unknown) {
      console.error("Gemini failed:", (err as Error).message);
    }
  }

  return smartLocalResponse(message, history);
}
