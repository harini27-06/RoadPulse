import { DetectionResult } from "@/types";

const YOLO_URL = process.env.YOLO_SERVICE_URL ?? "http://localhost:8000";

export async function detectRoadIssue(imageFile: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(`${YOLO_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Detection failed" }));
    throw new Error(error.detail ?? "YOLO service error");
  }

  return response.json() as Promise<DetectionResult>;
}
