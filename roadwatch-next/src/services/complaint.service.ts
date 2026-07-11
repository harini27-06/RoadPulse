import { Complaint, CreateComplaintPayload } from "@/types";

export async function createComplaint(payload: CreateComplaintPayload): Promise<Complaint> {
  const response = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create complaint" }));
    throw new Error(error.error ?? "Failed to create complaint");
  }

  return response.json() as Promise<Complaint>;
}

export async function deleteComplaint(id: string): Promise<void> {
  const response = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete complaint");
}

export async function fetchComplaints(): Promise<Complaint[]> {
  const response = await fetch("/api/complaints", { cache: "no-store" });

  if (!response.ok) throw new Error("Failed to fetch complaints");

  return response.json() as Promise<Complaint[]>;
}
