import { processQuery } from "./chatEngineLocal";
import { prisma } from "./prisma";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

function getResolutionDays(scheduledEndDate: Date | null): string {
  if (scheduledEndDate) {
    const diff = Math.ceil((scheduledEndDate.getTime() - Date.now()) / 86400000);
    if (diff > 0) return `${diff} Day${diff !== 1 ? "s" : ""}`;
    return "Overdue";
  }
  return "3 Days";
}

export async function chat(message: string, _history: ChatTurn[] = []): Promise<string> {
  const trackMatch = message.match(/track\s+complaint\s*#?(\d+)/i);
  if (trackMatch) {
    const num = parseInt(trackMatch[1]);
    try {
      const c = await prisma.complaint.findFirst({
        where: { complaint_number: num },
        select: {
          complaint_number: true,
          status: true,
          issue_type: true,
          assigned_engineer: true,
          scheduled_end_date: true,
          created_at: true,
          engineer: { select: { district: true } },
        },
      });

      if (!c) return `No complaint found with ID **#${num}**. Please check the number and try again.`;

      const engineer = c.assigned_engineer ?? "Executive Engineer";
      const district = c.engineer?.district;
      const division = district
        ? `${district.charAt(0).toUpperCase() + district.slice(1)} Division`
        : "Salem Division";
      const resolution = getResolutionDays(c.scheduled_end_date);

      return `**Complaint #${c.complaint_number} — ${c.issue_type}**\n\n**Status**\n${c.status}\n\n**Engineer**\n${engineer}\n${division}\n\n**Expected Resolution**\n${resolution}`;
    } catch {
      return `Unable to fetch complaint **#${num}** right now. Please visit the **Complaints** page to check its status.`;
    }
  }

  return processQuery(message);
}
