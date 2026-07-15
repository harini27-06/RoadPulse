import Groq from "groq-sdk";
import { processQuery } from "./chatEngineLocal";
import { prisma } from "./prisma";
import {
  getRoads,
  getAccidents,
  getRoadsByDistrict,
  getAccidentByDistrict,
  searchRoads,
  getAllDistricts,
  getAuthority,
} from "./roadData";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

// Fetch a specific road's full details from DB (real authority + tender data)
async function getRoadFromDB(query: string): Promise<string | null> {
  try {
    const roads = await prisma.road.findMany({
      where: {
        OR: [
          { road_name: { contains: query, mode: "insensitive" } },
          { road_code: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        road_name: true,
        road_code: true,
        road_type: true,
        district: true,
        total_length_km: true,
        tender_id: true,
        estimated_amount: true,
        budget_estimate: true,
        total_work_value: true,
        last_maintenance_date: true,
        authority: true,
      },
      take: 3,
      orderBy: { road_name: "asc" },
    });
    if (!roads.length) return null;
    return roads.map((r) => [
      `**${r.road_name}** [${r.road_code ?? "N/A"}]`,
      `Type: ${r.road_type ?? "N/A"} | District: ${r.district} | Length: ${r.total_length_km?.toFixed(1) ?? "N/A"} km`,
      `Authority: ${r.authority ?? "N/A"}`,
      `Tender ID: ${r.tender_id ?? "N/A"}`,
      `Estimated Amount: ${r.estimated_amount ? `₹${r.estimated_amount.toFixed(2)} Cr` : "N/A"}`,
      `Budget Estimate: ${r.budget_estimate ? `₹${r.budget_estimate.toFixed(2)} Cr` : "N/A"}`,
      `Total Work Value: ${r.total_work_value ? `₹${r.total_work_value.toFixed(2)} Cr` : "N/A"}`,
      `Last Maintenance: ${r.last_maintenance_date ?? "N/A"}`,
    ].join("\n")).join("\n\n");
  } catch {
    return null;
  }
}

// Fetch all roads in a district from DB with authority + tender data
async function getDistrictRoadsFromDB(district: string): Promise<string | null> {
  try {
    const roads = await prisma.road.findMany({
      where: { district: { contains: district, mode: "insensitive" } },
      select: {
        road_name: true,
        road_code: true,
        road_type: true,
        total_length_km: true,
        authority: true,
        tender_id: true,
        estimated_amount: true,
      },
      take: 20,
      orderBy: { road_name: "asc" },
    });
    if (!roads.length) return null;
    return roads.map((r) =>
      `- **${r.road_name}** [${r.road_code ?? "N/A"}] | ${r.road_type ?? "N/A"} | ${r.total_length_km?.toFixed(1) ?? "?"}km | Authority: ${r.authority ?? "N/A"} | Tender: ${r.tender_id ?? "N/A"} | Budget: ${r.estimated_amount ? `₹${r.estimated_amount.toFixed(1)}Cr` : "N/A"}`
    ).join("\n");
  } catch {
    return null;
  }
}

async function buildDataContext(message: string): Promise<string> {
  const q = message.toLowerCase();
  const districts = getAllDistricts();
  const mentionedDistrict = districts.find((d) => q.includes(d.toLowerCase()));

  let ctx = "";

  if (mentionedDistrict) {
    const roads = getRoadsByDistrict(mentionedDistrict).slice(0, 20);
    const acc = getAccidentByDistrict(mentionedDistrict);
    // Prefer DB data (has real authority + tender)
    const dbRoads = await getDistrictRoadsFromDB(mentionedDistrict).catch(() => null);
    ctx += `\n### Roads in ${mentionedDistrict} (${roads.length} shown)\n`;
    if (dbRoads) {
      ctx += dbRoads;
    } else {
      ctx += roads
        .map((r) => `- ${r.name} [${r.code}] | ${r.type} | ${r.lengthKm.toFixed(1)} km | Maintained: ${r.lastMaintenanceDate || "N/A"} | Budget: ₹${r.estimatedAmount || r.budget2020} Cr | Authority: ${getAuthority(r)}`)
        .join("\n");
    }
    if (acc) {
      ctx += `\n\n### Accident Data — ${mentionedDistrict}\nAccidents: ${acc.totalAccidents} | Deaths: ${acc.totalDeaths} | Executive Engineer: ${acc.executiveEngineer || "N/A"}`;
    }
  }

  const roadHits = searchRoads(message, 5);
  if (roadHits.length > 0 && !mentionedDistrict) {
    const dbData = await getRoadFromDB(roadHits[0].name).catch(() => null);
    if (dbData) {
      ctx += `\n### Road Details (from database)\n${dbData}`;
    } else {
      ctx += `\n### Matching Roads\n`;
      ctx += roadHits
        .map((r) => `- ${r.name} [${r.code}] | ${r.type} | ${r.district} | ${r.lengthKm.toFixed(1)} km | Maintained: ${r.lastMaintenanceDate || "N/A"} | Budget: ₹${r.estimatedAmount || r.budget2020} Cr | Authority: ${getAuthority(r)}`)
        .join("\n");
    }
  }

  if (/accident|death|dangerous|worst|ranking/i.test(q)) {
    const top = getAccidents()
      .sort((a, b) => b.totalAccidents - a.totalAccidents)
      .slice(0, 10);
    ctx += `\n\n### Top Districts by Accidents\n`;
    ctx += top.map((a, i) => `${i + 1}. ${a.district} — ${a.totalAccidents} accidents, ${a.totalDeaths} deaths`).join("\n");
  }

  const allRoads = getRoads();
  ctx += `\n\n### Dataset Summary\nTotal roads: ${allRoads.length} | Total length: ${allRoads.reduce((s, r) => s + r.lengthKm, 0).toFixed(0)} km | Districts: ${districts.length}`;

  return ctx;
}

const SYSTEM_PROMPT = `You are RoadPulse AI — the intelligent assistant for RoadWatch, an AI-powered road monitoring and complaint management platform for Tamil Nadu, India.

You can answer ANY question — road-related, general knowledge, science, math, history, coding, or anything else.

For Tamil Nadu road/district questions, use the data context provided at the end of each message to give accurate, data-driven answers.

## RoadWatch Platform Features
- 📸 Upload road photos → YOLOv11 AI detects: Pothole, Crack, Waterlogging, Debris, Damaged Road, Missing Manhole
- 📋 File complaints with GPS location → status tracked: Pending → In Progress → Resolved
- 🗺️ Budget Tracker, Risk Predictor, Admin & Engineer dashboards
- 📍 Covers all 38 districts of Tamil Nadu with real road data

## Your Capabilities
- Answer questions about Tamil Nadu roads, districts, accidents, budgets, engineers
- Explain road defects, maintenance types, road safety
- Help users file complaints and track their status
- Answer general questions on any topic
- Compare roads, rank districts, find executive engineers
- Tell users which department/authority is responsible for a road
- Provide tender IDs, budget estimates, and work values for roads

## Response Style
- Be warm, conversational, and helpful
- Use **bold** for key terms, bullet points for lists, emojis sparingly for clarity
- For data queries, always cite numbers from the provided context
- Keep responses concise — avoid unnecessary padding
- Never refuse to answer — always give your best response
- If asked about complaint tracking, remind users they can type "Track Complaint #[number]"
- End responses with a helpful follow-up suggestion when appropriate`;

export async function chat(message: string, history: ChatTurn[] = []): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  // Complaint tracking — handle locally
  if (/track\s+complaint\s*#?\d+/i.test(message)) {
    return processQuery(message);
  }

  // Authority / tender / department — answer directly from DB (most accurate)
  const isAuthorityOrTenderQuery = /\b(authority|department|dept|responsible|who\s+maintain|who\s+manage|in.?charge|which\s+dept|which\s+department|tender|tender\s+id|contractor|work\s+value|budget\s+estimate)\b/i.test(message);
  if (isAuthorityOrTenderQuery) {
    const q = message.toLowerCase();
    const districts = getAllDistricts();
    const mentionedDistrict = districts.find((d) => q.includes(d.toLowerCase()));

    if (mentionedDistrict) {
      const dbData = await getDistrictRoadsFromDB(mentionedDistrict);
      if (dbData) {
        return `🛣️ **Roads in ${mentionedDistrict.toUpperCase()} — Authority & Tender Details**\n\n${dbData}`;
      }
    } else {
      const roadHits = searchRoads(message, 1);
      if (roadHits.length) {
        const dbData = await getRoadFromDB(roadHits[0].name);
        if (dbData) return `🛣️ **Road Details**\n\n${dbData}`;
      }
    }
  }

  if (!apiKey) {
    console.warn("GROQ_API_KEY not set — using local engine");
    return processQuery(message);
  }

  try {
    const groq = new Groq({ apiKey });

    const dataContext = await buildDataContext(message);
    const fullMessage = `${message}\n\n---\n[RoadWatch Data Context]\n${dataContext}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    const sanitized: { role: "user" | "assistant"; content: string }[] = [];
    for (const turn of history) {
      const role = (turn.role === "user" ? "user" : "assistant") as "user" | "assistant";
      if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === role) continue;
      sanitized.push({ role, content: turn.content });
    }
    while (sanitized.length > 0 && sanitized[0].role !== "user") sanitized.shift();
    while (sanitized.length > 0 && sanitized[sanitized.length - 1].role !== "assistant") sanitized.pop();

    messages.push(...sanitized);
    messages.push({ role: "user", content: fullMessage });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content ?? processQuery(message);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Groq error:", msg);
    return processQuery(message);
  }
}
