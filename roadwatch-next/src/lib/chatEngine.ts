import Groq from "groq-sdk";
import { processQuery } from "./chatEngineLocal";
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

function buildDataContext(message: string): string {
  const q = message.toLowerCase();
  const districts = getAllDistricts();

  const mentionedDistrict = districts.find((d) => q.includes(d.toLowerCase()));

  let ctx = "";

  if (mentionedDistrict) {
    const roads = getRoadsByDistrict(mentionedDistrict).slice(0, 20);
    const acc = getAccidentByDistrict(mentionedDistrict);
    ctx += `\n### Roads in ${mentionedDistrict} (${roads.length} shown)\n`;
    ctx += roads
      .map(
        (r) =>
          `- ${r.name} [${r.code}] | ${r.type} | ${r.lengthKm.toFixed(1)} km | Maintained: ${r.lastMaintenanceDate || "N/A"} | Budget: ₹${r.estimatedAmount || r.budget2020} Cr | Authority: ${getAuthority(r)}`
      )
      .join("\n");
    if (acc) {
      ctx += `\n\n### Accident Data — ${mentionedDistrict}\nAccidents: ${acc.totalAccidents} | Deaths: ${acc.totalDeaths} | Executive Engineer: ${acc.executiveEngineer || "N/A"}`;
    }
  }

  const roadHits = searchRoads(message, 5);
  if (roadHits.length > 0 && !mentionedDistrict) {
    ctx += `\n### Matching Roads\n`;
    ctx += roadHits
      .map(
        (r) =>
          `- ${r.name} [${r.code}] | ${r.type} | ${r.district} | ${r.lengthKm.toFixed(1)} km | Maintained: ${r.lastMaintenanceDate || "N/A"} | Budget: ₹${r.estimatedAmount || r.budget2020} Cr | Authority: ${getAuthority(r)}`
      )
      .join("\n");
  }

  if (/accident|death|dangerous|worst|ranking/i.test(q)) {
    const top = getAccidents()
      .sort((a, b) => b.totalAccidents - a.totalAccidents)
      .slice(0, 10);
    ctx += `\n\n### Top Districts by Accidents\n`;
    ctx += top
      .map((a, i) => `${i + 1}. ${a.district} — ${a.totalAccidents} accidents, ${a.totalDeaths} deaths`)
      .join("\n");
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

  // Handle complaint tracking locally (no need for Groq)
  const trackMatch = message.match(/track\s+complaint\s*#?(\d+)/i);
  if (trackMatch) {
    return processQuery(message);
  }

  if (!apiKey) {
    console.warn("GROQ_API_KEY not set — using local engine");
    return processQuery(message);
  }

  try {
    const groq = new Groq({ apiKey });

    const dataContext = buildDataContext(message);
    const fullMessage = `${message}\n\n---\n[RoadWatch Data Context]\n${dataContext}`;

    // Convert history to Groq format (user/assistant only, strictly alternating)
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Sanitize history: map "model"/"bot" → "assistant", ensure alternating
    const sanitized: { role: "user" | "assistant"; content: string }[] = [];
    for (const turn of history) {
      const role = (turn.role === "user" ? "user" : "assistant") as "user" | "assistant";
      if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === role) continue;
      sanitized.push({ role, content: turn.content });
    }
    // Must start with user
    while (sanitized.length > 0 && sanitized[0].role !== "user") sanitized.shift();
    // Must end with assistant (so current message is next user turn)
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
