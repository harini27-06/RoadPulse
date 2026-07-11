export interface KnowledgeEntry {
  patterns: string[];
  response: string;
}

export const roadKnowledge: KnowledgeEntry[] = [
  {
    patterns: ["pothole", "pot hole", "what is a pothole", "potholes", "pothole cause", "why pothole"],
    response:
      "A **pothole** is a depression or cavity in a road surface caused by wear, water infiltration, and traffic load.\n\n**How they form:**\n1. Water seeps into cracks in the asphalt\n2. Freezing/thawing cycles (or heavy rain) expand the crack\n3. Traffic loads break apart the weakened surface\n4. The loose material is displaced, leaving a hole\n\n**Dangers:** Potholes can damage vehicle tires, wheels, and suspension, and cause accidents — especially for two-wheelers.\n\n**Fix:** Patching with hot-mix asphalt or cold-patch material. Permanent repair requires cutting out the damaged area and repaving.",
  },
  {
    patterns: ["crack", "road crack", "cracks", "cracking", "what causes road cracks", "types of cracks"],
    response:
      "**Road Cracks** — Types & Causes:\n\n- **Fatigue/Alligator cracking** — repeated traffic loads weaken the surface, creating interconnected cracks resembling alligator skin\n- **Thermal cracking** — temperature fluctuations expand/contract asphalt, causing transverse cracks\n- **Reflective cracking** — cracks from underlying layers propagate upward through overlays\n- **Edge cracking** — lack of lateral support near road edges\n- **Longitudinal cracking** — parallel to road centerline, often from poor joint construction\n- **Block cracking** — large rectangular cracks from asphalt hardening\n\nCracks should be sealed promptly to prevent water infiltration and further deterioration.",
  },
  {
    patterns: ["waterlog", "waterlogging", "flooding", "water on road", "standing water", "drainage"],
    response:
      "**Waterlogging on Roads** occurs when water cannot drain properly.\n\n**Causes:**\n- Blocked or inadequate drainage systems\n- Poor road camber (cross-slope)\n- Low-lying road sections\n- Damaged culverts or storm drains\n\n**Effects:**\n- Weakens road base and subgrade\n- Creates skidding hazards\n- Accelerates road deterioration\n- Reduces visibility\n\n**Solutions:** Clear blocked drains, improve road gradient, install proper drainage infrastructure, raise road level in flood-prone areas.",
  },
  {
    patterns: ["debris", "road debris", "stones", "rubble", "objects on road", "fallen tree"],
    response:
      "**Road Debris** includes loose stones, fallen trees, accident wreckage, construction material, or any foreign objects on the road surface.\n\n**Risks:** Serious safety hazard for motorists and cyclists — can cause tire blowouts, accidents, and vehicle damage.\n\n**Action:** Report immediately using RoadWatch. Debris should be cleared by road maintenance crews within hours of reporting.",
  },
  {
    patterns: ["damaged road", "road damage", "broken road", "road deterioration", "bad road"],
    response:
      "**Road Damage** encompasses various forms of surface deterioration:\n\n- **Potholes** — depressions from water infiltration and traffic\n- **Cracking** — surface fractures from load and temperature\n- **Rutting** — longitudinal depressions along wheel paths\n- **Raveling** — loss of surface aggregate\n- **Bleeding** — excess bitumen on surface\n- **Shoving** — surface displacement from traffic\n\n**Causes:** Heavy traffic, poor construction quality, weather, deferred maintenance, and overloaded vehicles.\n\nRegular inspection and timely repair are essential for road safety.",
  },
  {
    patterns: ["manhole", "missing manhole", "manhole cover", "open manhole", "uncovered manhole"],
    response:
      "A **missing or damaged manhole cover** is a serious road hazard.\n\n**Risks:**\n- Vehicle damage (wheel drop-in)\n- Pedestrian injuries, especially at night\n- Motorcycle accidents\n\n**What to do:**\n1. Report immediately using RoadWatch\n2. Note the exact location (GPS coordinates)\n3. Warn other road users if safe to do so\n\nMunicipal authorities must replace missing covers as an emergency within 24 hours.",
  },
  {
    patterns: ["report", "how to report", "report road damage", "lodge complaint", "file complaint", "raise complaint"],
    response:
      "**How to Report Road Damage using RoadWatch:**\n\n1. Open the **Chatbot** page\n2. Click **Upload Image** 📷 and select a photo of the damage\n3. Our AI (YOLOv11) will analyze and detect the issue\n4. Click **Yes** to raise a complaint\n5. Share your location (GPS or manual entry)\n6. Add a description if needed\n7. Submit — your complaint will be tracked in the **Complaints** page\n\n✅ You'll receive a complaint ID to track the status.",
  },
  {
    patterns: ["maintenance", "road maintenance", "maintenance types", "road repair types", "types of maintenance"],
    response:
      "**Road Maintenance Types:**\n\n- **Routine Maintenance** — regular patching, crack sealing, drain cleaning (ongoing)\n- **Periodic Maintenance** — resurfacing and structural repairs every 3-5 years\n- **Reactive Maintenance** — emergency repairs after accidents or severe damage\n- **Preventive Maintenance** — treatments to extend road life before failure\n- **Rehabilitation** — major reconstruction of deteriorated roads\n- **Emergency Maintenance** — immediate response to hazards like missing manholes or flood damage\n\nProactive maintenance is 4-5x cheaper than reactive repairs.",
  },
  {
    patterns: ["rutting", "ruts", "road ruts", "wheel tracks", "deformation"],
    response:
      "**Rutting** refers to longitudinal depressions along wheel paths.\n\n**Causes:**\n- Plastic deformation of asphalt under heavy traffic loads\n- Especially severe in hot weather when asphalt softens\n- Weak subgrade or base layers\n- Overloaded vehicles\n\n**Dangers:** Hydroplaning in rain, vehicle instability, steering difficulties.\n\n**Fix:** Requires resurfacing (milling and overlay) or base repair for severe cases.",
  },
  {
    patterns: ["road safety", "safety", "safe driving", "road hazard", "driving tips"],
    response:
      "**Road Safety Tips:**\n\n🚗 **Driving:**\n- Slow down near damaged road areas\n- Maintain safe following distances\n- Avoid sudden steering maneuvers over potholes\n- Use headlights in poor visibility\n\n🛞 **Vehicle:**\n- Check tire pressure regularly — potholes cause punctures\n- Inspect suspension after hitting large potholes\n\n📱 **Reporting:**\n- Report hazards using RoadWatch immediately\n- Your report helps protect other road users\n\n🚶 **Pedestrians:**\n- Use footpaths where available\n- Report missing manhole covers immediately",
  },
  {
    patterns: ["status", "complaint status", "track complaint", "pending", "in progress", "resolved"],
    response:
      "**Complaint Status in RoadWatch:**\n\n- 🟡 **Pending** — complaint submitted, awaiting review by authorities\n- 🔵 **In Progress** — maintenance crew assigned and working on repair\n- 🟢 **Resolved** — repair completed and verified\n\nYou can track all your submitted complaints in the **Complaints** page. Each complaint shows the issue type, location, date, and current status.",
  },
  {
    patterns: ["hello", "hi", "hey", "greetings", "good morning", "good evening", "good afternoon", "good night"],
    response:
      "Hello! 👋 I'm the **RoadWatch AI Assistant**.\n\nI can help you with:\n- 🛣️ Road information across Tamil Nadu districts\n- 📊 Accident statistics by district\n- 🔍 Road defect detection from images\n- 📋 Filing road damage complaints\n- ❓ Road knowledge & safety tips\n\nTry asking: *\"Roads in Chennai\"*, *\"Accident data for Coimbatore\"*, or *\"What is a pothole?\"*",
  },
  {
    patterns: ["help", "what can you do", "features", "capabilities", "commands", "options"],
    response:
      "Here's what I can do:\n\n🛣️ **Road Data** — Ask about roads in any Tamil Nadu district\n📊 **Accident Stats** — Get accident & death statistics by district\n🏆 **Rankings** — Find the most accident-prone districts\n🔍 **Defect Detection** — Upload an image to detect road issues\n📋 **Complaints** — File and track road damage complaints\n❓ **Road Knowledge** — Ask about potholes, cracks, maintenance, etc.\n\n**Example queries:**\n- *\"Roads in Madurai\"*\n- *\"Accident statistics for Salem\"*\n- *\"Top 5 most dangerous districts\"*\n- *\"How many roads in Chennai?\"*\n- *\"What causes road cracks?\"*",
  },
  {
    patterns: ["yolo", "ai", "detection", "how does it work", "how detection works", "image analysis"],
    response:
      "**RoadWatch uses YOLOv11** (You Only Look Once) — a state-of-the-art real-time object detection model.\n\n**Detection Process:**\n1. Upload an image via the chatbot\n2. Image is sent to our FastAPI AI service\n3. YOLOv11 analyzes it for road defects\n4. Returns the detected issue and confidence score\n5. You can then file an official complaint\n\n**Detectable Issues:**\n- Pothole\n- Crack\n- Waterlogging\n- Debris\n- Damaged Road\n- Missing Manhole",
  },
  {
    patterns: ["asphalt", "bitumen", "pavement", "road material", "concrete road", "road construction"],
    response:
      "**Road Construction Materials:**\n\n🔲 **Asphalt (Bitumen)** — Most common; flexible, cost-effective, repairable in sections. Consists of aggregates bound by bitumen.\n\n🔲 **Concrete (PCC/RCC)** — More durable (20-30 years), higher initial cost, better for heavy traffic.\n\n🔲 **WBM (Water Bound Macadam)** — Used for rural roads; gravel compacted with water.\n\n🔲 **Gravel/Earthen** — Low-cost rural roads; prone to erosion.\n\nRoad quality depends heavily on material mix design, construction quality, and drainage.",
  },
  {
    patterns: ["speed bump", "speed breaker", "humps", "rumble strip"],
    response:
      "**Speed Bumps & Traffic Calming Devices:**\n\n- **Speed Bumps** — Raised sections across the road to slow vehicles near schools, hospitals, and residential areas\n- **Speed Tables** — Flat-topped raised sections, gentler than bumps\n- **Rumble Strips** — Textured road surface that creates vibration to alert drivers\n- **Chicanes** — Alternating obstacles that force vehicles to slow down\n\nImproperly placed or unmarked speed bumps are themselves a road hazard and should be reported.",
  },
  {
    patterns: ["road marking", "lane marking", "road line", "white line", "yellow line", "road sign"],
    response:
      "**Road Markings & Signs:**\n\n**Markings:**\n- **White solid line** — No overtaking\n- **White dashed line** — Overtaking permitted with caution\n- **Yellow line** — Divides opposing traffic\n- **Zebra crossing** — Pedestrian crossing\n- **Stop line** — Where vehicles must stop at signals\n\n**Signs:**\n- **Red circle** — Prohibitory (speed limit, no entry)\n- **Triangle** — Warning signs\n- **Blue rectangle** — Informatory signs\n\nFaded or missing road markings should be reported to highway authorities.",
  },
  {
    patterns: ["overloaded", "overload", "heavy vehicle", "truck damage", "axle load"],
    response:
      "**Overloaded Vehicles & Road Damage:**\n\nOverloaded trucks are one of the **biggest causes of road damage** in India.\n\n**Impact:**\n- A vehicle at 2x the legal axle load causes **16x more road damage** (4th power law)\n- Accelerates rutting, fatigue cracking, and base failure\n- Reduces road life from 10 years to 2-3 years\n\n**Regulations:**\n- Maximum axle load: 10.2 tonnes (single axle)\n- Overloading is penalized under the Motor Vehicles Act\n- Weigh bridges are installed on major highways",
  },
  {
    patterns: ["mdr", "major district road", "what is mdr"],
    response:
      "**MDR — Major District Roads** are roads of major importance within a district, connecting important towns, villages, and roads of higher category.\n\n**Characteristics:**\n- Maintained by State/District Highway Departments\n- Typically 2-lane roads\n- Connect district headquarters to taluks and important towns\n- Lower traffic volume than State/National Highways\n\nTamil Nadu has over **1,000+ MDR roads** in our dataset covering districts like Chennai, Coimbatore, Madurai, and more.",
  },
  {
    patterns: ["national highway", "nh", "what is nh", "national highway india"],
    response:
      "**National Highways (NH)** are the primary road network of India, maintained by the **National Highways Authority of India (NHAI)**.\n\n**Key facts:**\n- India has ~1.46 lakh km of National Highways\n- NH-44 (Srinagar to Kanyakumari) is the longest at 4,225 km\n- NH-48 (Delhi-Chennai) passes through Tamil Nadu\n- 4-lane or 6-lane on major corridors\n- Speed limit: 100 km/h (cars), 80 km/h (trucks)\n\nAsk me about specific NHs in our dataset!",
  },
  {
    patterns: ["state highway", "sh", "what is sh"],
    response:
      "**State Highways (SH)** connect important towns and cities within a state, maintained by the **State Public Works Department (PWD)**.\n\n**Characteristics:**\n- Secondary to National Highways\n- Connect district headquarters and major towns\n- Typically 2-lane roads\n- Maintained by Tamil Nadu Highways Department\n\nTamil Nadu has an extensive SH network. Ask me about specific state highways!",
  },
  {
    patterns: ["last maintenance", "maintenance date", "when was road maintained", "last repaired", "last serviced"],
    response:
      "**Last Maintenance Date** is now tracked for every road in our dataset.\n\nYou can:\n- Ask *\"When was [road name] last maintained?\"*\n- Visit the **Budget Tracker** page to see maintenance dates alongside budget details for every road\n- Filter by district to find roads with the oldest maintenance dates\n\nRegular maintenance every **3–5 years** is recommended for state highways and MDRs.",
  },
  {
    patterns: ["tamil nadu highways", "tnhd", "highways department", "road network", "total road length"],
    response:
      "**Tamil Nadu Highways Department (TNHD)** manages the state's road network:\n\n- **National Highways** — ~5,000 km (maintained with NHAI)\n- **State Highways** — ~10,500 km\n- **Major District Roads (MDR)** — ~23,000 km\n- **Other District Roads** — ~30,000 km\n\nThe department handles construction, maintenance, and improvement of roads across all 38 districts of Tamil Nadu.\n\nOur dataset covers **1,500+ roads** across Tamil Nadu districts with budget and tender information.",
  },
];

export function getKnowledgeResponse(query: string): string {
  const normalizedQuery = query.toLowerCase().trim();

  for (const entry of roadKnowledge) {
    if (entry.patterns.some((p) => normalizedQuery.includes(p))) {
      return entry.response;
    }
  }

  return "I'm not sure about that specific question. I'm best equipped to answer questions about **road defects, maintenance, safety**, Tamil Nadu road data, and using the **RoadWatch complaint system**. Try asking about potholes, cracks, road maintenance types, or district road statistics!";
}
