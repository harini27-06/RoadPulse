export type IssueType =
  | "Pothole"
  | "Crack"
  | "Waterlogging"
  | "Debris"
  | "Damaged Road"
  | "Missing Manhole"
  | "Good Road";

export type UserRole = "user" | "admin" | "engineer" | "executive_engineer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface DetectionResult {
  issue: IssueType;
  confidence: number;
}

export interface Complaint {
  id: string;
  user_id?: string | null;
  issue_type: string;
  confidence: number;
  image_url?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  description?: string | null;
  status: string;
  resolved_image_url?: string | null;
  returned_message?: string | null;
  assigned_engineer?: string | null;
  assigned_engineer_id?: string | null;
  scheduled_date?: string | null;
  scheduled_end_date?: string | null;
  repair_notes?: string | null;
  created_at: string;
}

export interface CreateComplaintPayload {
  issue_type: string;
  confidence: number;
  image_url?: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  user_id?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  source?: "EXIF" | "OCR" | "manual";
}

export type ChatRole = "user" | "bot";

export type ChatStep =
  | "idle"
  | "detected"
  | "awaiting_complaint_confirm"
  | "awaiting_location"
  | "awaiting_description"
  | "submitting"
  | "done";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  imageUrl?: string;
  detectionResult?: DetectionResult;
  showComplaintButtons?: boolean;
  showLocationInput?: boolean;
  showDescriptionInput?: boolean;
  showDeleteButton?: boolean;
  detectedLocation?: LocationData;
  eeList?: { district: string; engineer: string }[];
}
