import jwt from "jsonwebtoken";
import { AuthPayload } from "@/types";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return secret;
}

const EXPIRES = "7d";

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
  } catch {
    return null;
  }
}
