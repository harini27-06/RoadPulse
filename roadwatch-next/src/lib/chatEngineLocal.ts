// Local rule-based engine — used as fallback when GEMINI_API_KEY is not set
import {
  searchRoads,
  getRoadsByDistrict,
  getAccidentByDistrict,
  getTopDangerousDistricts,
  getDistrictStats,
  getAllDistricts,
  getRoads,
  getAccidents,
  getExecutiveEngineer,
  getAllExecutiveEngineers,
  formatRoadDetail,
} from "./roadData";
import { getKnowledgeResponse } from "./knowledge";

type Intent =
  | "road_detail" | "road_search" | "district_roads" | "district_accidents" | "district_stats"
  | "top_dangerous" | "all_districts" | "road_count" | "budget_query"
  | "road_type_query" | "maintenance_query" | "executive_engineer" | "knowledge" | "greeting" | "help" | "unknown";

interface ParsedQuery {
  intent: Intent;
  district?: string;
  roadName?: string;
  roadType?: string;
  topN?: number;
}

function extractDistrict(q: string): string | undefined {
  const districts = getAllDistricts().map((d) => d.toLowerCase());
  for (const d of districts) { if (q.includes(d)) return d; }
  const extras = [
    "coimbatore","madurai","chengalpattu","tiruppur","thiruvallur","salem",
    "krishnagiri","tiruchirapalli","dindigul","erode","tiruvannamalai","thanjavur",
    "cuddalore","namakkal","villupuram","chennai","pudukkottai","thoothukudi",
    "virudhunagar","ramanathapuram","tirunelveli","sivagangai","kanniyakumari",
    "karur","dharmapuri","kancheepuram","theni","kallakurichi","vellore","ranipet",
    "tenkasi","thiruvarur","ariyalur","tirupathur","perambalur","myiladuthurai",
    "nagapattinam","nilgiris",
  ];
  for (const d of extras) { if (q.includes(d)) return d; }
  return undefined;
}

function parseIntent(query: string): ParsedQuery {
  const q = query.toLowerCase().trim();
  // Road detail intent — specific road name asked with detail/damage/info keywords
  const roadDetailKeywords = /\b(damage|damaged|why|condition|detail|info|about|status|repair|budget|contractor|maintained|relaid|authority|responsible|when|last)\b/i;
  if (roadDetailKeywords.test(q) || q.split(/\s+/).length >= 3) {
    const results = searchRoads(query, 1);
    if (results.length && results[0].name.toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w.toLowerCase()))) {
      return { intent: "road_detail", roadName: query };
    }
  }
  if (/^(hi|hello|hey|good\s*(morning|evening|afternoon|night)|howdy)\b/.test(q)) return { intent: "greeting" };
  if (/\b(help|what can you do|features|capabilities)\b/.test(q)) return { intent: "help" };
  if (/\b(top|most|highest|worst|dangerous|accident.prone)\b.*\b(district|place|area)\b/.test(q)) {
    const m = q.match(/top\s*(\d+)/);
    return { intent: "top_dangerous", topN: m ? parseInt(m[1]) : 5 };
  }
  if (/\b(all|list|show|which)\b.*\bdistrict/.test(q)) return { intent: "all_districts" };
  if (/\b(how many|count|total|number of)\b.*\broad/.test(q)) return { intent: "road_count", district: extractDistrict(q) };
  if (/\b(budget|cost|estimate|crore|fund|amount|spend)\b/.test(q)) {
    const d = extractDistrict(q);
    if (d) return { intent: "budget_query", district: d };
  }
  if (/\b(last maintenance|maintained|last repaired|maintenance date|last service)\b/.test(q)) {
    const d = extractDistrict(q);
    return { intent: "maintenance_query", district: d, roadName: query };
  }
  if (/executive\s*(engineer|minister|eng|ee)\b/i.test(q)) {
    return { intent: "executive_engineer", district: extractDistrict(q) };
  }
  if (/\b(mdr|major district road|nh|national highway|sh|state highway)\b/.test(q)) {
    const d = extractDistrict(q);
    let roadType = "";
    if (/\b(mdr|major district road)\b/.test(q)) roadType = "MDR";
    else if (/\b(nh|national highway)\b/.test(q)) roadType = "NH";
    else if (/\b(sh|state highway)\b/.test(q)) roadType = "SH";
    return { intent: "road_type_query", district: d, roadType };
  }
  if (/\b(accident|death|fatal|casualt|dangerous)\b/.test(q)) {
    const d = extractDistrict(q);
    if (d) return { intent: "district_accidents", district: d };
    return { intent: "top_dangerous", topN: 5 };
  }
  if (/\b(length|km|kilomet)\b/.test(q)) {
    const d = extractDistrict(q);
    if (d) return { intent: "district_roads", district: d };
  }
  const district = extractDistrict(q);
  if (district) {
    if (/\b(road|highway|km|length|list|show)\b/.test(q)) return { intent: "district_roads", district };
    return { intent: "district_stats", district };
  }
  if (q.length > 5 && /\b(road|highway|route|street)\b/.test(q)) return { intent: "road_search", roadName: query };
  return { intent: "knowledge" };
}

export function processQuery(query: string): string {
  const parsed = parseIntent(query);
  switch (parsed.intent) {
    case "greeting":
      return "Hello! 👋 I'm the **RoadWatch AI Assistant**. Ask me about Tamil Nadu roads, accident stats, or road defects!";
    case "help":
      return "I can help with:\n🛣️ **Road data** — *\"Roads in Madurai\"*\n📊 **Accidents** — *\"Accident stats for Salem\"*\n🏆 **Rankings** — *\"Top dangerous districts\"*\n❓ **Knowledge** — *\"What is a pothole?\"*";
    case "top_dangerous": {
      const top = getTopDangerousDistricts(parsed.topN ?? 5);
      return `🚨 **Top ${parsed.topN ?? 5} Accident-Prone Districts**\n\n${top.map((a, i) => `${i + 1}. **${a.district}** — ${a.totalAccidents} accidents, ${a.totalDeaths} deaths`).join("\n")}`;
    }
    case "all_districts": {
      const all = [...new Set([...getAllDistricts(), ...getAccidents().map((a) => a.district)])].filter(Boolean).sort();
      return `📍 **Districts (${all.length} total)**\n\n${all.join(", ")}`;
    }
    case "road_count": {
      if (parsed.district) {
        const r = getRoadsByDistrict(parsed.district);
        if (!r.length) return `No road data found for **${parsed.district!.toUpperCase()}**.`;
        return `**${parsed.district!.toUpperCase()}** has **${r.length} roads** with a total length of **${r.reduce((s, x) => s + x.lengthKm, 0).toFixed(1)} km**.`;
      }
      const r = getRoads();
      return `Tamil Nadu has **${r.length} roads** with a total length of **${r.reduce((s, x) => s + x.lengthKm, 0).toFixed(1)} km**.`;
    }
    case "budget_query": {
      const { roads, totalLength, totalBudget } = getDistrictStats(parsed.district!);
      if (!roads.length) return `No budget data found for **${parsed.district!.toUpperCase()}**.`;
      return `The total estimated budget for roads in **${parsed.district!.toUpperCase()}** is **₹${totalBudget.toFixed(2)} Crores** across **${roads.length} roads** (${totalLength.toFixed(1)} km).`;
    }
    case "road_type_query": {
      const type = parsed.roadType!;
      let filtered = getRoads().filter((r) => r.type === type);
      if (parsed.district) filtered = filtered.filter((r) => r.district.toUpperCase().includes(parsed.district!.toUpperCase()));
      const len = filtered.reduce((s, r) => s + r.lengthKm, 0);
      const sample = filtered.slice(0, 5).map((r) => `• **${r.name}** — ${r.lengthKm.toFixed(1)} km`);
      return `🛣️ **${type} roads${parsed.district ? ` in ${parsed.district}` : ""}**: ${filtered.length} roads, ${len.toFixed(1)} km\n\n${sample.join("\n")}${filtered.length > 5 ? `\n_...and ${filtered.length - 5} more_` : ""}`;
    }
    case "district_roads": {
      const roads = getRoadsByDistrict(parsed.district!);
      if (!roads.length) return `No roads found for **${parsed.district}**.`;
      const sample = roads.slice(0, 8).map((r) => `• **${r.name}** [${r.code}] — ${r.lengthKm.toFixed(1)} km`);
      return `🛣️ **Roads in ${parsed.district!.toUpperCase()}** (${roads.length} total)\n\n${sample.join("\n")}${roads.length > 8 ? `\n_...and ${roads.length - 8} more_` : ""}`;
    }
    case "district_accidents": {
      const acc = getAccidentByDistrict(parsed.district!);
      if (!acc) return `No accident data found for **${parsed.district!.toUpperCase()}**.`;
      const rank = getAccidents().sort((a, b) => b.totalAccidents - a.totalAccidents).findIndex((a) => a.district === acc.district) + 1;
      return `**${acc.district}** recorded **${acc.totalAccidents.toLocaleString()} accidents** and **${acc.totalDeaths.toLocaleString()} deaths** — ranked **#${rank}** in Tamil Nadu.`;
    }
    case "district_stats": {
      const d = parsed.district!;
      return `What would you like to know about **${d.toUpperCase()}**?\n\n- 💰 *"Total budget of ${d}"*\n- 🚨 *"Accidents in ${d}"*\n- 🛣️ *"Roads in ${d}"*\n- 📏 *"Road length in ${d}"*`;
    }
    case "road_detail": {
      const results = searchRoads(parsed.roadName ?? query, 3);
      if (!results.length) return `No road found matching **"${parsed.roadName ?? query}"**. Try a different name or check the spelling.`;
      const road = results[0];
      const acc = getAccidentByDistrict(road.district);
      return formatRoadDetail(road, acc);
    }
    case "road_search": {
      const results = searchRoads(parsed.roadName ?? query, 6);
      if (!results.length) return `No roads found for **"${query}"**. Try a district name instead.`;
      return `**Search: "${query}"**\n\n${results.map((r) => `• **${r.name}** [${r.code}] — ${r.lengthKm.toFixed(1)} km, ${r.district}`).join("\n")}`;
    }
    case "executive_engineer": {
      if (parsed.district) {
        const ee = getExecutiveEngineer(parsed.district);
        if (ee) return `The Executive Engineer for **${parsed.district.toUpperCase()}** is **${ee}**.`;
        return `No Executive Engineer data found for **${parsed.district.toUpperCase()}**.`;
      }
      return `__EE_LIST__ Here are the Executive Engineers for all 38 districts in Tamil Nadu:`;
    }
    default: {
      const kr = getKnowledgeResponse(query);
      if (!kr.includes("I'm not sure")) return kr;
      const sr = searchRoads(query, 4);
      if (sr.length) return `**Roads matching "${query}"**\n\n${sr.map((r) => `• **${r.name}** — ${r.district}, ${r.lengthKm.toFixed(1)} km`).join("\n")}`;
      return `I'm not sure about that. Try asking about:\n🛣️ Roads in a district\n📊 Accident stats\n❓ Road defects like potholes or cracks`;
    }
  }
}
