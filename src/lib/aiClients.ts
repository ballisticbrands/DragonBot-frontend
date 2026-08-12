// The visitor's AI-client choice, threaded through the funnel.
//
// The LP homepage hero is four buttons — "Connect Amazon Seller Central
// to Claude / ChatGPT / Cursor / any MCP client" — which all land on
// /sign-up. The chosen client arrives as `?ai=<id>` (ids match the LP's
// HOSTS array in DragonBotLP/src/pages/LandingV4.jsx) and personalises
// the signup headline, the chat preview, and the dashboard onboarding
// checklist. Persisted to localStorage so the choice survives the
// signup → dashboard navigation and later sessions.

export type AiClientId = "claude" | "chatgpt" | "cursor" | "other";

export interface AiClient {
  id: AiClientId;
  /** Chip label on the picker. */
  label: string;
  /** How the client reads inside running copy ("…plugs DragonBot into X"). */
  name: string;
}

export const AI_CLIENTS: AiClient[] = [
  { id: "claude", label: "Claude", name: "Claude" },
  { id: "chatgpt", label: "ChatGPT", name: "ChatGPT" },
  { id: "cursor", label: "Cursor", name: "Cursor" },
  { id: "other", label: "Another AI", name: "your AI" },
];

const STORAGE_KEY = "dragonbot_ai_choice_v1";

export function parseAiParam(v: string | null): AiClientId | null {
  if (!v) return null;
  const id = v.toLowerCase();
  return AI_CLIENTS.some((c) => c.id === id) ? (id as AiClientId) : null;
}

export function saveAiChoice(id: AiClientId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage disabled — the copy just falls back to "your AI" */
  }
}

export function readAiChoice(): AiClientId | null {
  try {
    return parseAiParam(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** "Claude" / "ChatGPT" / "Cursor" — or "your AI" when unknown/other. */
export function aiDisplayName(id: AiClientId | null): string {
  return AI_CLIENTS.find((c) => c.id === id)?.name ?? "your AI";
}
