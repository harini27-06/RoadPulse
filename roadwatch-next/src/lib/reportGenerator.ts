import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Complaint } from "@/types";

const STATUS_COLORS: Record<string, [number, number, number]> = {
  "Pending":     [234, 179, 8],
  "In Progress": [59, 130, 246],
  "Resolved":    [34, 197, 94],
  "Waitlisted":  [168, 85, 247],
  "Returned":    [239, 68, 68],
};

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    // Always go through the proxy so both local /uploads/ and external URLs work
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Short readable ID: take first 8 chars uppercased with a hyphen e.g. "RW-A1B2C3D4"
function shortId(id: string) {
  return `RW-${id.slice(0, 8).toUpperCase()}`;
}

export async function downloadComplaintReport(c: Complaint) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header bar ──────────────────────────────────────────────
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, W, 26, "F");

  // Logo — fetch from public folder directly
  const logoB64 = await fetch("/Logo.png")
    .then(r => r.blob())
    .then(b => new Promise<string | null>(res => {
      const fr = new FileReader();
      fr.onloadend = () => res(fr.result as string);
      fr.onerror = () => res(null);
      fr.readAsDataURL(b);
    }))
    .catch(() => null);

  if (logoB64) {
    try { doc.addImage(logoB64, "PNG", 12, 4, 18, 18); } catch { /* skip */ }
  }

  // Title
  const textX = logoB64 ? 34 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("RoadPulse", textX, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TN Highway Department — Complaint Report", textX, 19);

  // Generated date top-right
  doc.setFontSize(7.5);
  doc.text(`Generated: ${fmt(new Date().toISOString())}`, W - 12, 19, { align: "right" });

  y = 34;

  // ── Complaint ID + Status row ────────────────────────────────
  // ID pill (dark blue)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, y - 5, 52, 8, 2, 2, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("COMPLAINT ID", 17, y - 0.5);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(shortId(c.id), 17, y + 4);

  // Status badge
  const statusColor = STATUS_COLORS[c.status] ?? [100, 100, 100];
  doc.setFillColor(...statusColor);
  doc.roundedRect(70, y - 5, 36, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(c.status.toUpperCase(), 88, y, { align: "center" });

  y += 14;

  // ── Details table ───────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["Field", "Details"]],
    body: [
      ["Issue Type",        c.issue_type],
      ["Confidence",        `${c.confidence.toFixed(1)}%`],
      ["Status",            c.status],
      ["Filed On",          fmt(c.created_at)],
      ["Location",          c.address ?? `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`],
      ["Coordinates",       `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`],
      ["Description",       c.description ?? "—"],
      ["Assigned Engineer", c.assigned_engineer ?? "Not assigned"],
      ["Scheduled Date",    fmt(c.scheduled_date)],
      ["Repair Notes",      c.repair_notes ?? "—"],
      ["Return Reason",     c.returned_message ?? "—"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45, fillColor: [241, 245, 249] } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Images section ──────────────────────────────────────────
  const hasImages = c.image_url || c.resolved_image_url;
  if (hasImages) {
    // Section heading
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, W - 28, 8, "F");
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PHOTOGRAPHIC EVIDENCE", 14 + 3, y + 5.5);
    y += 12;

    const imgW = (W - 28 - 6) / 2; // two columns with 6mm gap
    const imgH = 55;

    const [beforeB64, afterB64] = await Promise.all([
      c.image_url ? loadImageAsBase64(c.image_url) : Promise.resolve(null),
      c.resolved_image_url ? loadImageAsBase64(c.resolved_image_url) : Promise.resolve(null),
    ]);

    // Check if we need a new page for images
    if (y + imgH + 20 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }

    const drawImageSlot = (b64: string | null, label: string, x: number) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(label, x, y);

      if (b64) {
        try {
          doc.addImage(b64, "JPEG", x, y + 3, imgW, imgH);
        } catch {
          // try PNG
          try { doc.addImage(b64, "PNG", x, y + 3, imgW, imgH); } catch { drawPlaceholder(x); }
        }
      } else {
        drawPlaceholder(x);
      }
    };

    const drawPlaceholder = (x: number) => {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, y + 3, imgW, imgH, 2, 2, "F");
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(x, y + 3, imgW, imgH, 2, 2, "S");
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Image not available", x + imgW / 2, y + 3 + imgH / 2, { align: "center" });
    };

    drawImageSlot(beforeB64, "Before (Reported)", 14);
    if (c.resolved_image_url) {
      drawImageSlot(afterB64, "After (Resolved)", 14 + imgW + 6);
    }

    y += imgH + 8;
  }

  // ── Footer ───────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, ph - 12, W - 14, ph - 12);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("RoadPulse — TN Highway Department | Confidential", 14, ph - 7);
    doc.text(`Page ${i} of ${pageCount}`, W - 14, ph - 7, { align: "right" });
  }

  const safeName = c.issue_type.replace(/\s+/g, "_").toLowerCase();
  doc.save(`complaint_${safeName}_${c.id.slice(0, 8)}.pdf`);
}
