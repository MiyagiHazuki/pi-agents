import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Antigravity 0.14.0 builds its request and sanitizes Pi's opener before this
// hook runs. Keep the rest of the system prompt and all tool declarations intact.
// PI_ANTIGRAVITY_PROMPT_COMPAT: antigravity (default), neutral, or off.
// This opener comes from pi-antigravity's built-in fallback instruction; it is
// not a copy of the complete official Antigravity client's system prompt.
type PromptStyle = "antigravity" | "neutral";
const OPENERS = {
  antigravity:
    "You are Antigravity, a powerful agentic AI coding assistant designed by Google DeepMind. " +
    "You are pair programming with a user to solve coding tasks. Be concise, practical, and tool aware.",
  neutral: "You are a coding agent helping users work on software projects.",
} satisfies Record<PromptStyle, string>;
const PI_OPENER = /^You are a coding assistant running inside your development environment\. Help users inspect files, run commands, and modify code\./i;
const DOCS_PHRASE = /codemode scripts and non-LLM models such as classifiers and image models \(docs\/codemode\.md\)/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rewriteAntigravityPayload<T>(payload: T, style: PromptStyle = "antigravity"): T {
  if (!isRecord(payload) || !isRecord(payload.request)) return payload;
  const request = payload.request;
  if (!isRecord(request.systemInstruction)) return payload;
  const systemInstruction = request.systemInstruction;
  if (!Array.isArray(systemInstruction.parts)) return payload;

  let changed = false;
  const parts = systemInstruction.parts.map((part: unknown) => {
    if (!isRecord(part) || typeof part.text !== "string") return part;
    const text = part.text
      .replace(PI_OPENER, OPENERS[style])
      .replace(DOCS_PHRASE, "codemode and its classifier and image-generation models (docs/codemode.md)");
    if (text === part.text) return part;
    changed = true;
    return { ...part, text };
  });
  if (!changed) return payload;
  return { ...payload, request: { ...request, systemInstruction: { ...systemInstruction, parts } } } as T;
}

export default function antigravityPromptCompat(pi: ExtensionAPI): void {
  pi.on("before_provider_request", (event, ctx) => {
    if (ctx.model?.provider !== "antigravity") return;
    const mode = process.env.PI_ANTIGRAVITY_PROMPT_COMPAT;
    if (mode === "off") return;
    const rewritten = rewriteAntigravityPayload(event.payload, mode === "neutral" ? "neutral" : "antigravity");
    if (rewritten !== event.payload) return rewritten;
  });
}
