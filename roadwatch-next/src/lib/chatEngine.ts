import { processQuery } from "./chatEngineLocal";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

export async function chat(message: string, _history: ChatTurn[] = []): Promise<string> {
  return processQuery(message);
}
