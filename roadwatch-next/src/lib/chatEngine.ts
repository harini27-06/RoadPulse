import { GoogleGenerativeAI } from "@google/generative-ai";
import { processQuery } from "./chatEngineLocal";
import {
  getRoads,
  getAccidents,
  getRoadsByDistrict,
  getAccidentByDistrict,
  searchRoads,
  getAllDistricts,
} from "./roadData";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

// Build a compact data summary to inject into the system prompt
function buildDataContext(userMessage: string): string {
  const q = userMessage.toLowerCase();

  const districts = getAllDistricts();
  const mentionedDistrict = districts.find((d) => q.includes(d.toLowerCase()));

  let dataSnippet = "";

  if (mentionedDistrict) {
    const roads = getRoadsByDistrict(mentionedDistrict).slice(0, 15);
    const acc = getAccidentByDistrict(mentionedDistrict);
    dataSnippet = `
## Roads in ${mentionedDistrict} (showing up to 15)
${roads.map((r) => `- ${r.name} [${r.code}] | ${r.type} | ${r.lengthKm.toFixed(1)} km | Last maintained: ${r.lastMaintenanceDate || "N/A"} | Budget: ₹${r.estimatedAmount || r.budget2020} Cr | Authority: ${r.authority || "Executive Engineer, " + r.district + " Division"}`).join("\n")}
${acc ? `\n## Accident Data for ${mentionedDistrict}\nTotal Accidents: ${acc.totalAccidents} | Total Deaths: ${acc.totalDeaths} | Executive Engineer: ${acc.executiveEngineer || "N/A"}` : ""}`;
  }

  const roadResults = searchRoads(userMessage, 5);
  if (roadResults.length && !mentionedDistrict) {
    dataSnippet = `
## Matching Roads
${roadResults.map((r) => `- ${r.name} [${r.code}] | ${r.type} | District: ${r.district} | ${r.lengthKm.toFixed(1)} km | Last maintained: ${r.lastMaintenanceDate || "N/A"} | Budget: ₹${r.estimatedAmount || r.budget2020} Cr | Authority: ${r.authority || "Executive Engineer, " + r.district + " Division"}`).join("\n")}`;
  }

  if (/accident|death|dangerous|worst|ranking|district/i.test(q)) {
    const accidents = getAccidents()
      .sort((a, b) => b.totalAccidents - a.totalAccidents)
      .slice(0, 10);
    dataSnippet += `\n\n## Top 10 Districts by Accidents\n${accidents.map((a, i) => `${i + 1}. ${a.district} — ${a.totalAccidents} accidents, ${a.totalDeaths} deaths | EE: ${a.executiveEngineer || "N/A"}`).join("\n")}`;
  }

  const allRoads = getRoads();
  const totalKm = allRoads.reduce((s, r) => s + r.lengthKm, 0);
  dataSnippet += `\n\n## General Stats\nTotal roads in dataset: ${allRoads.length} | Total length: ${totalKm.toFixed(0)} km | Districts covered: ${districts.length}`;

  return dataSnippet;
}

const SYSTEM_PROMPT = `You are RoadWatch AI, an intelligent assistant for the RoadWatch platform — an AI-powered road monitoring and complaint management system for Tamil Nadu, India.

You have access to a real dataset of Tamil Nadu roads, accident statistics, and district information provided as context in each message.

## Your Capabilities
- Answer questions about Tamil Nadu roads, districts, road types (NH, SH, MDR), budgets, maintenance dates
- Provide accident statistics and district rankings
- Explain road defects: potholes, cracks, waterlogging, debris, damaged roads, missing manholes
- Guide users on filing complaints using RoadWatch
- Answer ANY general question — you are a full general-purpose AI assistant

## RoadWatch Platform
- Image upload → YOLOv11 detects road defects (Pothole, Crack, Waterlogging, Debris, Damaged Road, Missing Manhole)
- Complaint filing with GPS location, tracked as Pending / In Progress / Resolved
- Budget tracker, Risk predictor, Admin & Engineer dashboards

## Response Style
- Conversational, helpful, concise
- Use markdown bold and bullet points for structured answers
- Use the data context provided to answer road/district questions accurately
- For general questions not related to roads, answer from your knowledge normally`;

export async function chat(message: string, history: ChatTurn[] = []): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return processQuery(message);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const dataContext = buildDataContext(message);
    const messageWithContext = `${message}\n\n---\n[RoadWatch Data Context - use this to answer accurately]\n${dataContext}`;

    const geminiHistory = history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.content }],
    }));

    const chatSession = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chatSession.sendMessage(messageWithContext);
    return result.response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return processQuery(message);
  }
}
